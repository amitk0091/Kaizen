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
