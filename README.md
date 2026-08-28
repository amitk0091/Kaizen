# Kaizen — Personal Growth OS

A mobile-first self-improvement SaaS. **Next.js (App Router) · React · Serwist (PWA) · IndexedDB/Dexie (offline) · MongoDB (Mongoose) · Tailwind (responsive + dark/light) · Next API routes for auth, AI (Gemini/Grok), and Razorpay payments.**

Think clearly. Grow daily. Todos, checklists, goals (SMART + WOOP), habits, a custom-form daily diary, learnings with spaced repetition, a CBT-informed mind dump, and an AI reflection coach.

---

## 1. Prerequisites
- Node.js 18.17+ (Node 20 recommended)
- A MongoDB database (MongoDB Atlas free tier works)
- (Optional to run) Google Gemini and/or xAI (Grok) API keys — without them the AI review falls back to an on-device heuristic
- (Optional to run) A Razorpay account (test mode) for payments

## 2. Setup
```bash
npm install
cp .env.example .env        # then fill in the values
npm run dev                 # http://localhost:3000
```
For a production build:
```bash
npm run build && npm start
```

## 3. Environment variables
See `.env.example`. Key ones:
- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — long random string (`openssl rand -base64 48`)
- `SESSION_DAYS` — session length in days (default **30**, per the "keep users logged in ≥ 1 month" requirement)
- `GEMINI_API_KEY` / `GEMINI_MODEL` (gemini-1.5-flash) — primary AI
- `XAI_API_KEY` / `XAI_MODEL` (grok) / `XAI_BASE_URL` — fallback AI
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- `PRICE_MONTHLY_PAISE=4900` (₹49) / `PRICE_YEARLY_PAISE=49900` (₹499)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_APP_URL`

## 4. How the key requirements are met
- **Fast login/signup:** minimal fields (email + password). `POST /api/auth/{signup,login}` hash with bcrypt, then set an httpOnly JWT cookie immediately — one round trip, no email verification wall.
- **Stay logged in ≥ 1 month:** the session cookie is a signed JWT with a **30-day** lifetime (configurable via `SESSION_DAYS`). `/api/auth/me` uses a **sliding session** — every visit re-issues the cookie, so active users effectively never get logged out.
- **Offline-first PWA:** Serwist service worker (`src/app/sw.ts`) precaches the app shell; user data lives in **IndexedDB via Dexie** (`src/lib/db.ts`). The Zustand store (`src/store/useStore.ts`) paints instantly from IndexedDB, then reconciles with the server (last-write-wins) and pushes changes (debounced, retried when back online). Installable via `src/app/manifest.ts`.
- **MongoDB:** `User`, `UserState` (whole app-state blob per user for simple, reliable sync), and `Subscription` models in `src/lib/models.ts`.
- **AI (Gemini + Grok), 1/day:** `POST /api/ai/review` builds a grounded prompt from the user's data, calls Gemini (falls back to Grok, then to a local heuristic), and enforces one review per day via `user.lastReviewAt`.
- **Razorpay (Individual):** `POST /api/payments/order` creates an order; `POST /api/payments/verify` verifies the signature and extends the subscription (₹49 → +30 days, ₹499 → +365 days); `POST /api/payments/webhook` is the server-to-server source of truth. 3-day free trial is created at signup.
- **Responsive + dark/light:** Tailwind with CSS-variable design tokens; sidebar on desktop, bottom nav on mobile; theme toggle persisted and applied before paint (no flash).

## 5. Project structure
```
src/
  app/
    api/
      auth/{signup,login,logout,me}/route.ts
      state/route.ts            # offline sync (GET pull / PUT push)
      ai/review/route.ts        # Gemini -> Grok -> heuristic, 1/day
      payments/{order,verify,webhook}/route.ts
    app/                        # authenticated app (guarded layout + shell page)
    login/                      # fast login/signup
    offline/                    # offline fallback
    layout.tsx  page.tsx  globals.css  manifest.ts  sw.ts
  components/                   # Home, Todos, Habits, Goals, Checklists, Diary,
                                # Learnings, MindDump, Review, Help, Onboarding, Paywall, ui
  lib/                          # mongo, models, auth, subscription, types, db(Dexie), api, review
  store/useStore.ts             # Zustand offline-first store
```

## 6. Deployment notes
- Deploy on Vercel (automatic HTTPS, required for PWAs). Set all env vars in the dashboard.
- Add real PNG icons in `public/icons/` (see the README there) before shipping installable PWA.
- Configure the Razorpay webhook URL to `https://YOUR_DOMAIN/api/payments/webhook` and set `RAZORPAY_WEBHOOK_SECRET`.
- For true recurring billing, upgrade `order/verify` to the Razorpay **Subscriptions** API; the current flow extends access per successful payment.

## 7. Security & privacy
- Passwords hashed with bcrypt; sessions are signed JWTs in httpOnly, SameSite=Lax cookies (Secure in production).
- Verify Razorpay signatures on both `verify` and `webhook` before granting access.
- The AI prompt sends a compact summary of the user's data; add per-module opt-out and explicit consent before production (see the PRD privacy section).

## 8. Roadmap hooks (from the PRD)
Weekly/monthly review ritual, insights dashboard, focus timer, push reminders, per-module AI consent toggles, data export/delete endpoints, and win-back emails.

---
Kaizen is a self-improvement tool — not medical, psychological, financial, or legal advice.

---

## Security & data protection

Kaizen holds deeply personal data (diary, feelings, mind dumps), so security is treated as a first-class requirement.

### Access control — the paywall cannot be bypassed
- **Server is the source of truth.** Entitlement (active trial or paid subscription) is checked server-side in `isEntitledUser()` on every mutating/paid endpoint: `PUT /api/state` (saving data) and `POST /api/ai/review`. The browser UI paywall is only for UX — deleting it or calling the API directly still returns **HTTP 402**.
- **Reads stay open** so users can always view and export their own data, even after the trial ends. Only creating/editing/syncing and AI reviews are gated.
- **3-day trial** is created at signup and enforced by `currentPeriodEnd`; there is no client flag that grants access.

### Payment integrity (no "pay ₹49, get a year")
- The verify endpoint **fetches the order from Razorpay** and reads the authoritative `plan` and `amount` from server-created order notes — the client's `plan` value is ignored.
- Signature verification uses **constant-time comparison** (`crypto.timingSafeEqual`).
- Orders are checked to **belong to the logged-in user**, must be `status: paid`, and the paid amount must match the server-side price.
- Webhooks verify the signature and are **idempotent** (a payment id is processed once).

### Authentication
- Passwords hashed with **bcrypt (cost 12)**. Minimum 8 characters.
- Sessions are **signed JWTs (HS256, algorithm-pinned)** in an **httpOnly, Secure, SameSite=Lax** cookie, 30-day sliding window (stays logged in ≥ 1 month per spec).
- **`JWT_SECRET` is mandatory in production** (≥ 32 chars) — the app throws on startup if it's missing/weak, preventing forgeable sessions.
- **Rate limiting** on login/signup/order to blunt brute-force and abuse. (In-memory per instance — back it with Upstash Redis for multi-instance/serverless; see note in `guard.ts`.)
- Login runs a constant-time password compare even for unknown emails to reduce user-enumeration timing leaks.

### Data protection
- **Encryption at rest:** the user's entire data blob is encrypted with **AES-256-GCM** (`DATA_ENCRYPTION_KEY`) before it is written to MongoDB. A database breach exposes only ciphertext. Set `DATA_ENCRYPTION_KEY` in production (`openssl rand -base64 48`).
- **Input validation** on all endpoints (typed email/password, plan whitelist) — also defends against NoSQL operator injection.
- **1 MB payload cap** on the state blob to prevent storage-abuse/DoS.

### Transport & headers
- **HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy** set on every response via `next.config.mjs`. CSP allow-lists only Razorpay checkout.
- **CSRF defense-in-depth:** SameSite cookies plus an Origin check on all state-changing requests.

### Required production env
`JWT_SECRET` (≥32 chars) · `DATA_ENCRYPTION_KEY` · `MONGODB_URI` · `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`. Serve only over HTTPS.

### Recommended before public launch
- Move rate limiting to Redis (Upstash) so it holds across serverless instances.
- Add a password-reset flow and optional 2FA.
- Consider MongoDB Atlas encryption/field-level encryption and IP allow-listing in addition to app-level encryption.
