# Snug — a relationship OS

## Goal
A shared, mobile-first PWA where two partners run their life together. Each
person has their own account; both belong to one shared "couple space" and see
each other's changes in real time.

**MVP (current):** auth + pairing, shared grocery list, shared calendar
(mine/theirs/ours, week + month view), home dashboard.

**Later (don't build yet, but keep room for):** chores with rotation, recurring
tasks, date ideas, important dates + reminders, shared notes, budget, push
notifications, Google/Apple calendar sync.

## Name and vibe
The app is called **Snug**. It should feel warm, calm and cozy, not corporate
or productivity-heavy:
- Soft colors (tokens in `globals.css`), rounded shapes (`rounded-2xl`/`rounded-3xl`,
  `rounded-full` buttons), soft shadows instead of hard borders.
- Friendly, couple-centered wording: "Your week together" not "Calendar",
  "Our shopping list" not "Groceries", gentle empty states
  ("Nothing planned. A slow day, maybe?"). No jargon, no exclamation-mark spam.
- Tab labels: Home, Our list, Our week.
- "Snug" is the app title, PWA name and home-screen icon name.

## Owner
The owner is a beginner. Explain changes in plain language, say clearly when
they need to do something themselves (Supabase dashboard, env vars, etc.),
and keep code simple and well-commented.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Supabase: auth, Postgres, realtime (`@supabase/supabase-js`, `@supabase/ssr`)
- PWA via `src/app/manifest.ts` + a hand-written service worker (no plugin)
- Keep dependencies minimal. No UI kit, no date library unless really needed.

## Folder structure
```
supabase/migrations/   numbered .sql files — the source of truth for the DB
scripts/test-security.mjs  security checks: one couple can't see another's data
src/app/(auth)/        login, signup
src/app/onboarding/    create or join a couple
src/app/join/[code]/   invite link landing page
src/app/(app)/         signed-in screens with bottom nav (home, groceries, calendar)
src/features/<name>/   components, queries and hooks for one feature (home/ = dashboard cards)
src/lib/supabase/      Supabase clients (browser, server, middleware)
src/components/        shared UI (BottomNav, ui/ primitives)
public/icons/          PWA icons (regenerate: scripts/make-icons.js)
```

## Data model conventions
- Every shared table has `couple_id uuid not null references couples`.
- Row-level security is ON for every table. Policies use `is_member(couple_id)`
  so one couple can never see another couple's data.
- Joining a couple only happens through the `join_couple(code)` SQL function.
- Event ownership: `owner_id = null` means "ours"; otherwise the owning user.
  "Mine"/"theirs" is computed relative to the viewer.
- Timestamps are `timestamptz`; couples have a `timezone`.
- New feature = new migration file + new table with `couple_id` + RLS policies
  + new checks in `scripts/test-security.mjs`.
- Creating/joining couples goes through SQL functions (`create_couple`,
  `join_couple`, `refresh_invite_code`), called with `supabase.rpc(...)`.
- `getMyCouple()` (src/features/couple/queries.ts) returns the couple, `me` and
  `partner`; the (app) layout redirects to /onboarding when it's null.

## Code conventions
- Server components by default; `"use client"` only when needed (state, realtime).
- Colors come from tokens in `src/app/globals.css` (`bg-surface`, `text-muted`,
  `bg-accent`, `text-me`, `text-partner`). Don't hard-code hex colors in components.
- Mobile-first: design for ~375px width, respect safe-area insets.
- Use the `@/` import alias (maps to `src/`).
- Types/constants needed by both server and browser code go in a plain file
  (e.g. `features/groceries/types.ts`), never in a `"use client"` file.
- Realtime pattern (see `features/groceries/useGroceries.ts`): load initial rows
  on the server, then in the browser subscribe to INSERT/UPDATE with a
  `couple_id=eq.<id>` filter, and to DELETE *without* a filter (Supabase can't
  filter deletes; payload is only the id). Reload on (re)subscribe and when the
  app becomes visible. Optimistic changes; on error, reload. Client-generated
  ids (`crypto.randomUUID()`) so realtime echoes match optimistic rows.
- New realtime tables need `alter publication supabase_realtime add table ...`.
- Anything showing dates/times renders in the browser (client component with a
  "mounted" guard, see `CalendarView.tsx`), because "today" and time zones
  depend on the phone. Date helpers live in `src/lib/dates.ts` (weeks start Monday:
  `WEEK_STARTS_ON`). All-day events: `ends_at` = midnight after the last day.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build — must pass before committing
npm run lint
npm run test:security   # logs in as test accounts, checks row-level security
```
Environment variables (from Supabase → Project Settings → API Keys; copy `.env.example`) go in
`.env.local` (never committed):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build progress
- [x] Step 0: scaffold, app shell, bottom nav, PWA manifest + icons
- [x] Step 1: Supabase clients + email/password auth + profiles (migration 0001 applied)
- [x] Step 2: couples, pairing via invite code/link, security tests (migration 0002 applied)
- [x] Step 3: grocery list with realtime (migration 0003 applied)
- [x] Step 4: calendar (week/month, mine/theirs/ours) (migration 0004 applied)
- [x] Step 5: home dashboard (live "Today" + shopping count; no migration needed)
- [x] Step 6: PWA polish (service worker `public/sw.js`, `public/offline.html`, install card)
- [ ] Deploy to Vercel (owner sets it up; every push to `main` then redeploys)

## PWA notes
- `public/sw.js` only caches the offline page, icons and `/_next/static` files.
  It never caches pages or Supabase data. Bump `VERSION` in it after changes.
- The service worker only registers in production builds (`npm run build && npm start`).
- `InstallCard` shows an install button (Android/Chrome) or Safari instructions (iOS).

## Deploying (Vercel)
- Vercel project imported from GitHub `frankafeiler9-glitch/snug`; pushes to `main` auto-deploy.
- Env vars set in Vercel → Project → Settings → Environment Variables:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (redeploy after changing).
- If "Confirm email" is turned on in Supabase, set Supabase → Authentication →
  URL Configuration → Site URL to the Vercel URL and add `<url>/auth/callback`
  to Redirect URLs.

## Notes for the cloud dev environment
- Node's server-side `fetch` needs the proxy: start the app with
  `NODE_USE_ENV_PROXY=1 npx next start` (or `npm run dev`). Not needed on a normal computer.
- `NEXT_PUBLIC_*` env vars are baked in at build time: rebuild after changing `.env.local`.
- Migrations are applied by the owner by pasting each file in
  `supabase/migrations/` into Supabase → SQL Editor, in order.
