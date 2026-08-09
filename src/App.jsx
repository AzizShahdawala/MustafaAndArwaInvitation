import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { EVENTS, EVENT_SLUGS } from './events';
import { request } from './api';

const Field = ({ label, ...props }) => <label className="field"><span>{label}</span><input {...props} /></label>;

function Loader() {
  return <div className="loader"><div className="loader-ring"><span>م</span><span className="heart">♥</span><span>ع</span></div><p>Preparing a little celebration…</p></div>;
}

function Layout({ children, guest = false }) {
  return <div className="site-shell"><header><Link className="brand" to="/">M <i>♥</i> A</Link>{!guest && <nav><Link to="/">Invitations</Link><Link to="/admin">Host login</Link></nav>}</header>{children}<footer><span>Made with love for Mustafa &amp; Arwa</span><span>Developed by <a href="https://www.azizshahda.com" target="_blank" rel="noreferrer">Aziz Shahdawala</a></span></footer></div>;
}

function Home() {
  return <Layout><main className="center"><section className="chooser"><p className="arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p><p className="kicker">Mustafa &amp; Arwa</p><h1>Invitation links</h1><p>Choose an event to preview its private, shareable invitation.</p><div className="chooser-links">{Object.values(EVENTS).map(event => <Link className="button" key={event.id} to={`/invitation/${event.slug}`}>{event.title}</Link>)}</div></section></main></Layout>;
}

function Invitation() {
  const { slug } = useParams();
  const event = EVENT_SLUGS[slug];
  if (!event) return <Navigate to="/" replace />;
  return <Layout guest><main><section className={`hero single-event ${event.theme}`}><div className="stars"/><p className="arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p><p className="kicker">Together with their families</p><h1>Mustafa <em>weds</em> Arwa</h1><p className="intro">We would be honoured by your presence as we celebrate this beautiful beginning.</p><article className={`event-card ${event.theme}`}><span className="event-icon">{event.icon}</span><p>{event.eyebrow}</p><h2>{event.title}</h2><time>{event.date}</time><strong>{event.time}</strong><span>{event.venue}</span><small>{event.address}</small><b>{event.note}</b><Link className="button" to={`/invitation/${event.slug}/rsvp`}>RSVP for this event</Link></article></section></main></Layout>;
}

function RSVP() {
  const { slug } = useParams(); const event = EVENT_SLUGS[slug];
  const [form, setForm] = useState({ name: '', email: '', phone: '', attending: 'yes', guestCount: 1, dietaryNotes: '', message: '' });
  const [status, setStatus] = useState('idle'); const [error, setError] = useState('');
  if (!event) return <Navigate to="/" replace />;
  const submit = async e => { e.preventDefault(); setStatus('loading'); setError(''); try { await request('/rsvps', { method: 'POST', body: JSON.stringify({ ...form, eventId: event.id, guestCount: form.attending === 'yes' ? Number(form.guestCount) : 0 }) }); setStatus('success'); } catch (err) { setError(err.message); setStatus('idle'); } };
  if (status === 'success') return <Layout guest><main className="center"><section className="success"><span>♥</span><h1>Shukran, {form.name.split(' ')[0]}!</h1><p>Your response for {event.title} has been received. A confirmation is on its way to your inbox.</p><Link className="button" to={`/invitation/${event.slug}`}>Back to invitation</Link></section></main></Layout>;
  return <Layout guest><main className="form-page"><section className="event-summary"><p>{event.eyebrow}</p><h1>{event.title}</h1><div><time>{event.date}</time><strong>{event.time}</strong><span>{event.venue}</span><small>{event.address}</small></div><p>{event.note}</p></section><form className="rsvp-form" onSubmit={submit}><p className="kicker">Kindly respond</p><h2>Will you celebrate with us?</h2><Field label="Full name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required minLength="2" autoComplete="name"/><Field label="Email address *" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required autoComplete="email"/><Field label="Phone number *" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required pattern="[+0-9 ()-]{7,18}" autoComplete="tel"/><label className="field"><span>Are you attending? *</span><select value={form.attending} onChange={e=>setForm({...form,attending:e.target.value})}><option value="yes">Joyfully accepts</option><option value="no">Regretfully declines</option></select></label>{form.attending==='yes'&&<Field label="Total people attending *" type="number" min="1" max="20" value={form.guestCount} onChange={e=>setForm({...form,guestCount:e.target.value})} required/>}<Field label="Dietary or accessibility notes" value={form.dietaryNotes} onChange={e=>setForm({...form,dietaryNotes:e.target.value})} maxLength="300"/><label className="field"><span>A note for the couple</span><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} maxLength="500" /></label>{error&&<p className="error">{error}</p>}<button className="button" disabled={status==='loading'}>{status==='loading'?'Sending…':'Send my response'}</button><p className="privacy">Your details are used only for this celebration and event updates.</p></form></main></Layout>;
}

function SummaryCards({ summary }) {
  const cards = [['responses','Responses'],['attending','Attending'],['guests','Total guests'],['declined','Declined']];
  return <section className="stats">{cards.map(([key,label])=><article key={key}><strong>{summary[key]}</strong><span>{label}</span></article>)}</section>;
}

function Admin() {
  const nav=useNavigate(); const [credentials,setCredentials]=useState({username:'',password:''}); const [token,setToken]=useState(()=>sessionStorage.getItem('rsvpToken')); const [data,setData]=useState(null); const [eventFilter,setEventFilter]=useState('all'); const [error,setError]=useState(''); const [notice,setNotice]=useState(''); const [busy,setBusy]=useState('');
  const load=async(t=token)=>{try{const result=await request('/admin/rsvps',{headers:{Authorization:`Bearer ${t}`}});setData(result)}catch(e){sessionStorage.removeItem('rsvpToken');setToken(null);setError(e.message)}};
  useEffect(()=>{if(token)load()},[token]);
  const login=async e=>{e.preventDefault();setError('');try{const r=await request('/admin/login',{method:'POST',body:JSON.stringify(credentials)});sessionStorage.setItem('rsvpToken',r.token);setToken(r.token)}catch(e){setError(e.message)}};
  const remind=async id=>{if(!confirm('Send an email reminder now?'))return;setBusy(id);setError('');setNotice('');try{const result=await request(`/admin/reminders/${id}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});setNotice(result.message);await load()}catch(e){setError(e.message)}finally{setBusy('')}};
  const groupRemind=async eventId=>{if(!confirm('Send reminders to every attending guest for this event?'))return;setBusy(eventId);setError('');setNotice('');try{const result=await request('/admin/reminders',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({eventId})});setNotice(`${result.sent} reminder${result.sent===1?'':'s'} sent${result.failed?`; ${result.failed} failed`:''}.`);await load()}catch(e){setError(e.message)}finally{setBusy('')}};
  const rows=useMemo(()=>data?.rsvps.filter(r=>eventFilter==='all'||r.eventId===eventFilter)||[],[data,eventFilter]);
  const activeSummary=eventFilter==='all'?data?.summary:data?.byEvent?.[eventFilter];
  if(!token)return <Layout><main className="center"><form className="login-card" onSubmit={login}><p className="kicker">Hosts only</p><h1>RSVP dashboard</h1><Field label="Admin ID" value={credentials.username} onChange={e=>setCredentials({...credentials,username:e.target.value})} required/><Field label="Password" type="password" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} required/>{error&&<p className="error">{error}</p>}<button className="button">Sign in</button></form></main></Layout>;
  if(!data)return <Loader/>;
  return <Layout><main className="dashboard"><div className="dash-head"><div><p className="kicker">Hosts dashboard</p><h1>Guest responses</h1></div><button className="text-button" onClick={()=>{sessionStorage.removeItem('rsvpToken');setToken(null);nav('/admin')}}>Sign out</button></div><div className="event-tabs" role="group" aria-label="Filter dashboard by event"><button className={eventFilter==='all'?'active':''} onClick={()=>setEventFilter('all')}>All events</button>{Object.values(EVENTS).map(e=><button className={eventFilter===e.id?'active':''} key={e.id} onClick={()=>setEventFilter(e.id)}>{e.title}</button>)}</div>{activeSummary&&<SummaryCards summary={activeSummary}/>}<div className="toolbar"><strong>{eventFilter==='all'?'All guest responses':EVENTS[eventFilter].title}</strong>{eventFilter!=='all'&&<button className="button small" disabled={!!busy} onClick={()=>groupRemind(eventFilter)}>{busy===eventFilter?'Sending…':'Email all attending'}</button>}</div>{error&&<p className="error">{error}</p>}{notice&&<p className="notice">{notice}</p>}<div className="table-wrap"><table><thead><tr><th>Guest</th><th>Event</th><th>Reply</th><th>Party</th><th>Contact</th><th>Submitted</th><th>Reminder</th></tr></thead><tbody>{rows.map(r=><tr key={r._id}><td><strong>{r.name}</strong>{r.dietaryNotes&&<small>{r.dietaryNotes}</small>}{r.message&&<small>“{r.message}”</small>}</td><td>{EVENTS[r.eventId]?.title}</td><td><span className={`pill ${r.attending}`}>{r.attending==='yes'?'Attending':'Declined'}</span></td><td>{r.guestCount}</td><td><a href={`mailto:${r.email}`}>{r.email}</a><small>{r.phone}</small></td><td>{new Date(r.createdAt).toLocaleDateString()}</td><td><button className="text-button" disabled={busy===r._id} onClick={()=>remind(r._id)}>{busy===r._id?'Sending…':r.reminderSentAt?'Send again':'Send'}</button></td></tr>)}</tbody></table>{!rows.length&&<p className="empty">No responses here yet.</p>}</div></main></Layout>;
}

function LegacyRSVP(){const {eventId}=useParams();const event=EVENTS[eventId];return <Navigate to={event?`/invitation/${event.slug}/rsvp`:'/'} replace/>}

export default function App(){const [ready,setReady]=useState(false);useEffect(()=>{const t=setTimeout(()=>setReady(true),600);return()=>clearTimeout(t)},[]);if(!ready)return <Loader/>;return <Routes><Route path="/" element={<Home/>}/><Route path="/invitation/:slug" element={<Invitation/>}/><Route path="/invitation/:slug/rsvp" element={<RSVP/>}/><Route path="/rsvp/:eventId" element={<LegacyRSVP/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
