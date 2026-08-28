# Kaizen — Get 1% better, every day

A science-based human performance PWA: a customizable daily tracker, logs, checklists, todos, goals (with sub-goals & if-then plans), feelings & overthinking journals, and an AI weekly review — with a 3-day trial and Razorpay subscriptions.

Built end-to-end on **Next.js (App Router) + MongoDB Atlas**, with **Gemini (primary) → Grok (fallback)** for AI reviews and **Razorpay (UPI-first)** for payments. Installable as a PWA.

## Features
- Fast email/password auth (no email verification; 3-day trial starts on signup).
- Onboarding intake that personalizes the AI (identity + adaptive questions).
- Customizable Daily Tracker (text, number, rating, yes/no, single/multi-select, time). Deleting a field is a soft-delete — past entries keep their data.
- Logs with week / month / custom-range filters + trend chart.
- Checklists (reusable, tick each time, reset), Todos (Pending / Ongoing / Completed + priority + deadline), Goals (sub-goals, equal weightage, if-then + shielding plans).
- Feelings and Overthinking journals (back-datable, editable).
- AI Review: reads your last 7 days, returns what went well / what didn't / why (B=MAP) / 3 tiny steps / a matched success example / identity note. Hard-capped at 2 per day, server-enforced, with a crisis-safety net.
- Subscription gating: after trial, all create/edit/AI actions lock; data stays read-only. ₹49/month, ₹499/year (tax-inclusive, same worldwide).
- PWA: installable, offline app shell, custom favicons/icons.

## Tech stack
- Next.js 14 (App Router), React 18, Tailwind CSS
- MongoDB Atlas via Mongoose
- NextAuth (credentials, JWT)
- Google Gemini + xAI Grok (REST, swappable)
- Razorpay Subscriptions + webhooks
- Nodemailer (password reset), Recharts (charts)

## Prerequisites
- Node.js 18.18+ (or 20+)
- A MongoDB Atlas cluster
- Razorpay account (with Monthly & Yearly Plans created)
- Google Gemini API key and/or xAI Grok API key
- An SMTP provider (for password-reset emails)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill it in:
   ```bash
   cp .env.example .env
   ```
   Key variables:
   - `MONGODB_URI` — Atlas connection string.
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — `http://localhost:3000` locally; your domain in prod.
   - `GEMINI_API_KEY`, `GROK_API_KEY` — AI providers.
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`, plus `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
   - `RAZORPAY_PLAN_MONTHLY` / `RAZORPAY_PLAN_YEARLY` — Plan IDs from the Razorpay dashboard (₹49/month, ₹499/year).
   - `SMTP_*` and `MAIL_FROM` — for password reset.
3. Run locally:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Razorpay setup
1. In the Razorpay Dashboard, create two **Plans**: ₹49 monthly and ₹499 yearly. Put their IDs in `RAZORPAY_PLAN_MONTHLY` / `RAZORPAY_PLAN_YEARLY`.
2. Create a **Webhook** pointing to `https://YOUR_DOMAIN/api/razorpay/webhook` with events: `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`. Put its secret in `RAZORPAY_WEBHOOK_SECRET`.
3. The webhook is the source of truth for subscription status; the client `verify` call is a fast-path unlock.

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import it in Vercel. Framework preset: **Next.js**.
3. Add all environment variables from `.env` to the Vercel project (set `NEXTAUTH_URL` to your Vercel domain).
4. Deploy. Add your custom domain, then update the Razorpay webhook URL to the production domain.
5. In MongoDB Atlas, allow Vercel egress (Atlas: allow access from anywhere `0.0.0.0/0` for serverless, or use Atlas + Vercel integration).

## PWA
- `public/manifest.json` + `public/sw.js` provide installability and an offline app shell.
- Icons live in `public/icons` and `src/app` (Next auto-detects `icon.png`, `favicon.ico`, `apple-icon.png`).

## Security notes
- Every API route scopes queries to the authenticated user's id; no cross-user access.
- Passwords hashed with bcrypt. Sessions are JWT (httpOnly cookie via NextAuth).
- The 2/day AI cap and all write gating are enforced server-side (`src/lib/entitlement.js`), not just in the UI.
- Encryption at rest is provided by MongoDB Atlas. Application-level field encryption was intentionally left out of MVP scope (see the requirements doc); do not log sensitive fields.

## Project structure
```
src/
  app/
    (public) page.js, faq, guide, login, signup, forgot-password, onboarding, offline
    dashboard/ (layout guard + shell) today, tracker, logs, checklists, todos, goals, feelings, overthinking, ai-review, subscribe
    api/ auth, me, onboarding, tracker, checklists, todos, goals, feelings, overthinking, ai-review, razorpay
  components/ DashboardShell, DynamicField, Markdown, Logo, ServiceWorker, PublicHeader
  lib/ db, authOptions, apiAuth, entitlement, ai, razorpay, mailer, clientApi, accessContext
  models/ User, TrackerSchema, TrackerEntry, Checklist, Todo, Goal, Feeling, Overthinking, AiReview
public/ manifest.json, sw.js, icons/, favicons
```

Get 1% better, every day.
