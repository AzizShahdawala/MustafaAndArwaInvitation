import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { connectDb } from './db.js';
import { RSVP } from './models.js';
import { sendConfirmation, sendReminder } from './email.js';

export const app = express();
const origins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(v => v.trim());
app.use(cors({ origin(origin, cb) { if (!origin || origins.includes(origin) || origin.endsWith('.github.io')) return cb(null, true); cb(new Error('Origin not allowed')); } }));
app.use(express.json({ limit: '20kb' }));

const schema = z.object({ eventId: z.enum(['preWedding','reception']), name: z.string().trim().min(2).max(100), email: z.string().email().max(200), phone: z.string().trim().regex(/^[+0-9 ()-]{7,18}$/), attending: z.enum(['yes','no']), guestCount: z.number().int().min(0).max(20), dietaryNotes: z.string().max(300).optional().default(''), message: z.string().max(500).optional().default('') }).superRefine((v,ctx)=>{if(v.attending==='yes'&&v.guestCount<1)ctx.addIssue({code:'custom',path:['guestCount'],message:'Guest count must be at least 1'})});
const secret = () => process.env.JWT_SECRET || 'local-development-secret-change-me';
const auth = (req,res,next) => { try { req.admin=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),secret()); next(); } catch { res.status(401).json({message:'Please sign in again.'}); } };

app.get('/api/health', (_req,res)=>res.json({ok:true}));
app.post('/api/rsvps', async (req,res,next)=>{try{const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0].message});await connectDb();const payload={...parsed.data,guestCount:parsed.data.attending==='yes'?parsed.data.guestCount:0};let rsvp;try{rsvp=await RSVP.create(payload)}catch(error){if(error.code===11000)return res.status(409).json({message:'This email has already responded for this event.'});throw error}try{const result=await sendConfirmation(rsvp);if(!result.skipped){rsvp.confirmationSentAt=new Date();await rsvp.save()}}catch(error){console.error('Confirmation email:',error.message)}res.status(201).json({message:'RSVP received',id:rsvp._id})}catch(e){next(e)}});
app.post('/api/admin/login',(req,res)=>{const expectedUser=process.env.ADMIN_USERNAME||'mustafaArwa786';const expectedPass=process.env.ADMIN_PASSWORD||'mustafaArwa786';if(req.body?.username!==expectedUser||req.body?.password!==expectedPass)return res.status(401).json({message:'Invalid admin ID or password.'});res.json({token:jwt.sign({role:'admin'},secret(),{expiresIn:'8h'})})});
const summarize = rsvps => ({responses:rsvps.length,attending:rsvps.filter(r=>r.attending==='yes').length,guests:rsvps.reduce((n,r)=>n+r.guestCount,0),declined:rsvps.filter(r=>r.attending==='no').length});
app.get('/api/admin/rsvps',auth,async(_req,res,next)=>{try{await connectDb();const rsvps=await RSVP.find().sort({createdAt:-1}).lean();res.json({rsvps,summary:summarize(rsvps),byEvent:{preWedding:summarize(rsvps.filter(r=>r.eventId==='preWedding')),reception:summarize(rsvps.filter(r=>r.eventId==='reception'))}})}catch(e){next(e)}});
app.post('/api/admin/reminders/:id',auth,async(req,res,next)=>{try{await connectDb();const rsvp=await RSVP.findById(req.params.id);if(!rsvp)return res.status(404).json({message:'Guest not found.'});const delivery=await sendReminder(rsvp);rsvp.reminderSentAt=new Date();await rsvp.save();res.json({message:`Reminder accepted by ${delivery.provider==='brevo-api'?'Brevo':'SMTP'}.`,messageId:delivery.messageId})}catch(e){next(e)}});
app.post('/api/admin/reminders',auth,async(req,res,next)=>{try{if(!['preWedding','reception'].includes(req.body?.eventId))return res.status(400).json({message:'Choose an event.'});await connectDb();const guests=await RSVP.find({eventId:req.body.eventId,attending:'yes'});const results=await Promise.allSettled(guests.map(async r=>{await sendReminder(r);r.reminderSentAt=new Date();return r.save()}));res.json({message:'Reminders processed.',sent:results.filter(r=>r.status==='fulfilled').length,failed:results.filter(r=>r.status==='rejected').length})}catch(e){next(e)}});
app.use((error,_req,res,_next)=>{console.error(error.message);res.status(500).json({message:'The server could not complete that request.'})});
