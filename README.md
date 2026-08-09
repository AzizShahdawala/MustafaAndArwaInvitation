# Mustafa & Arwa Wedding RSVP

A full-stack MERN RSVP experience for the 10–11 October 2026 wedding celebrations. Guests can respond separately to either event; hosts can securely view attendance, party totals, guest details, and send individual or event-wide Brevo email reminders.

## Stack

- React + Vite frontend, optimized for GitHub Pages
- Express serverless API on Vercel
- MongoDB Atlas via Mongoose
- Brevo transactional email confirmations and reminders
- JWT-protected host dashboard

## Local setup

1. Copy `.env.example` to `.env` and provide MongoDB/Brevo credentials.
2. Run `npm install`.
3. Start the API with `npm run server` and the UI with `npm run dev`.

The requested admin ID and password are the defaults for local use. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a strong `JWT_SECRET` in Vercel. Brevo SMS is not included because transactional SMS requires purchased credits; email reminders work with Brevo's email allowance.

## Deployment

Deploy the repository root to Vercel for the API and add all server variables from `.env.example`. Set the GitHub repository variable `VITE_API_URL` to `https://YOUR-VERCEL-PROJECT.vercel.app/api`, then enable GitHub Pages with GitHub Actions as its source.
