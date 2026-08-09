import nodemailer from 'nodemailer';
import { EVENTS } from './events.js';

const esc = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

let transporter;
function mailer() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM_EMAIL) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}

async function send({ to, subject, html }) {
  if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: process.env.BREVO_SENDER_NAME || process.env.SMTP_FROM_NAME || 'Mustafa & Arwa', email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: to }], subject, htmlContent: html
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Brevo rejected the email (${response.status}): ${body.message || 'unknown error'}`);
    console.log('[email] accepted by Brevo API', { messageId: body.messageId, subject });
    return { provider: 'brevo-api', messageId: body.messageId };
  }
  const smtp = mailer();
  if (!smtp) throw new Error('Email is not configured. Add Brevo API or SMTP environment variables before sending reminders.');
  const result = await smtp.sendMail({ from: { name: process.env.SMTP_FROM_NAME || 'Mustafa & Arwa', address: process.env.SMTP_FROM_EMAIL }, to, subject, html });
  if (!result.accepted?.length || result.rejected?.length) throw new Error(`SMTP did not accept the recipient${result.response ? `: ${result.response}` : '.'}`);
  console.log('[email] accepted by SMTP', { messageId: result.messageId, response: result.response, subject });
  return { provider: 'smtp', messageId: result.messageId };
}

const frame = (name, event, message) => `<!doctype html><html><body style="margin:0;background:#07112d;padding:24px;font-family:Arial,sans-serif;color:#292237"><div style="max-width:580px;margin:auto;background:#faf5ef;border-radius:12px;overflow:hidden"><div style="padding:34px;text-align:center;background:#172044;color:#f8f1e8"><div style="font-family:Georgia,serif;font-size:38px">Mustafa <span style="color:#db9caa">♥</span> Arwa</div></div><div style="padding:34px"><p>Dear ${esc(name)},</p><p>${message}</p><div style="border-left:3px solid #c48796;padding:4px 18px;margin:24px 0"><h2 style="font-family:Georgia,serif;margin:0 0 8px">${event.title}</h2><div>${event.date} · ${event.time}</div><strong>${event.venue}</strong><div>${event.address}</div><small>${event.note}</small></div><p>With love,<br>Mustafa, Arwa &amp; family</p></div></div></body></html>`;

export function sendConfirmation(rsvp) {
  const event = EVENTS[rsvp.eventId];
  const message = rsvp.attending === 'yes' ? `Shukran for your RSVP. We are delighted to celebrate with your party of ${rsvp.guestCount}.` : 'Thank you for letting us know. You will be warmly missed.';
  return send({ to: rsvp.email, subject: `RSVP confirmed · ${event.title}`, html: frame(rsvp.name, event, message) });
}

export function sendReminder(rsvp) {
  const event = EVENTS[rsvp.eventId];
  return send({ to: rsvp.email, subject: `A gentle reminder · ${event.title}`, html: frame(rsvp.name, event, 'Our celebration is getting closer, and we cannot wait to welcome you. Here are the event details for your diary.') });
}
