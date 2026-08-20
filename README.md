# Site Log — Handoff Notes for Claude Code

This is a construction site management PWA for Josh Perlette (site superintendent at Slokker Homes), currently a single-file HTML app. It needs to be restructured into a proper multi-file project, put in git, pushed to GitHub, and connected to Netlify for auto-deploy.

## What this app does
- **Today / Brief**: daily priorities, due/overdue deficiencies and checklist items
- **Units**: per-unit "Rounds" — current phase, current/next trade, risk level (auto-computed from days since last walk), round history
- **Phase Checklist**: 32 checklist groups (191 items total) matching Slokker's construction phases, each with a computed due date, collapsible checkbox list, and completion count (e.g. "6/10")
- **Deficiencies**: location-based (unit or site-wide), due dates, owner (Trade/Josh/Unassigned), push/backlog tracking
- **Schedule**: Buildertrend schedule data (manually synced — Buildertrend has no API, so this is pasted in from Outlook calendar data periodically)
- **Log**: daily log, auto-generated from activity + historical entries migrated from Notion
- **Sync**: schedule import, deficiency import, backup/restore (full JSON export/import)

## Data / Storage
Currently backed by Supabase (already set up):
- Project URL: `https://iafzmkwahiusfdxodgdi.supabase.co`
- Single table `app_data (key text primary key, value text, updated_at timestamptz)` — a simple key-value store. The app reads/writes JSON blobs by key (`units`, `defs`, `schedule`, `checklistGroups`, `groupInstances`, `roundHistory`, `logHistory`, `master`, `instances`, `lastBackup`).
- RLS policy on `app_data` requires every request to carry an `x-site-key` header matching a shared passphrase (see "Access code" below) — replaced the old wide-open anon policy once the site moved to a public GitHub Pages URL.
- The anon key is in `js/storage.js` under `SUPABASE_ANON_KEY` — safe to keep client-side (that's how Supabase's anon key is designed to work); the RLS policy above is what actually gates read/write access now.

## Safety walkthrough photo storage (one-time setup required)
The daily Safety Walkthrough feature (Brief tab) uploads per-checklist-item
photos to a Supabase Storage bucket named `hazard-photos` (`js/storage.js`:
`uploadSafetyPhoto()`). This bucket does **not exist by default** — Claude
Code can't provision Supabase infrastructure, so Josh needs to create it
once via the Supabase dashboard:

1. Supabase dashboard → **Storage** → **New bucket** → name it exactly `hazard-photos`.
2. Set it to **Public bucket** (matches this app's existing trust model: the
   anon key is already public by design, and the real access gate is the
   `x-site-key` passphrase at the app layer, not per-object security). A
   fully private bucket would need custom Storage RLS policies referencing
   request headers — possible, but meaningfully more setup/risk than this
   app's current model calls for.
3. That's it — no policies to write. Until this bucket exists, photo
   uploads will fail with a toast ("Couldn't upload photo...") but nothing
   else in the app breaks.

Note the tradeoff: hazard photo URLs are public-if-guessed (protected by
URL obscurity, not auth) — same posture as the rest of this public-repo app,
but worth knowing before storing anything sensitive as a "hazard photo."

## Access code
- The app prompts for a passphrase on first load per device (`js/app.js`: `ensureSiteKey()`), stores it in `localStorage`, and sends it as the `x-site-key` header on every Supabase request (`js/storage.js`).
- A wrong/missing code is verified against Supabase with a real write+read round-trip — on rejection it clears the stored value and re-prompts rather than silently loading empty/default data.
- To rotate the passphrase: update the Supabase RLS policy's literal value, then have Josh clear it on each device via Sync tab → "Change Access Code" (or just clear `localStorage` for the site).
- The passphrase itself is never committed to this repo — it only lives in the Supabase policy and in whatever's typed into the app.

## What to do first
1. ~~Split `index.html` into a proper structure.~~ Done — see file layout below.
2. ~~Initialize git, create a GitHub repo, push.~~ Done — public repo at [JoshPerlette9497/site-tracker](https://github.com/JoshPerlette9497/site-tracker).
3. ~~Connect Netlify to the GitHub repo for auto-deploy on push.~~ Superseded — moved to GitHub Pages (see Deployment) once Netlify's free-tier usage cap started billing.
4. Keep the Supabase connection exactly as-is — don't recreate the database or table.
5. Preserve the PWA manifest + service worker setup so installability keeps working.

## Deployment
- **GitHub**: public repo `JoshPerlette9497/site-tracker`, default branch `master`. Made public specifically so GitHub Pages could serve it for free (Pages on private repos requires a paid GitHub plan); the repo being public is fine since the app's actual data is gated by the Supabase access-code policy above, not by hiding the source.
- **GitHub Pages**: [joshperlette9497.github.io/site-tracker](https://joshperlette9497.github.io/site-tracker/), deploys from `master` root on every push (Settings → Pages → Deploy from a branch). No build step — same static files Netlify used to serve.
- **Netlify**: retired. The project previously lived at `slokker-site-log.netlify.app`; moved off it once its free tier usage cap started incurring charges. Safe to delete/downgrade that Netlify site now that Pages is confirmed working.

## Files in this folder
- `index.html` — HTML shell only (header, tab nav, `<main>` mount point); loads `style.css` and the `js/` modules
- `style.css` — all app styling (extracted from the old inline `<style>` block)
- `js/storage.js` — Supabase config + `sget`/`sset` key-value helpers, plus date/id utility functions
- `js/dialogs.js` — `showToast`/`showConfirm`/`showPrompt` (non-native dialog replacements)
- `js/modal.js` — generic modal show/close + `escapeHtml`
- `js/data.js` — seed data (units, checklist groups, master checklist, log history), app `state`, load/migration logic, instance/group helper functions
- `js/render.js` — all per-tab render functions, card/row builders, modals for units/defs/master, backup/restore
- `js/app.js` — tab-click wiring + app bootstrap (`init()`), loaded last since it invokes everything above
- `manifest.json` — PWA manifest
- `sw.js` — service worker (network-first app shell caching, never intercepts Supabase calls); cache bumped to `sitelog-v2` and app-shell list updated for the new files
- `icon-192.png`, `icon-512.png` — app icons (Slokker brand teal, generated placeholders — fine to keep or redesign)

Load order in `index.html` matters: `storage.js` must load before `data.js` (seed data calls `uid()` at load time); `app.js` must load last (it calls `loadAll()`/`render()`/`setHeader()` from the other files). Everything is still plain global-scope scripts (no ES modules, no bundler) — kept that way to match the original single-file app's structure with minimal risk.
