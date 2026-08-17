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
- RLS policy currently allows anon read/write to everything — fine for single-user personal use, but flag this to Josh if the app ever needs real access control.
- The anon key is in `index.html` under `SUPABASE_ANON_KEY` — safe to keep client-side (that's how Supabase's anon key is designed to work), but real protection would come from tightening RLS policies if this ever needs to be more secure.

## What to do first
1. ~~Split `index.html` into a proper structure.~~ Done — see file layout below.
2. ~~Initialize git, create a GitHub repo, push.~~ Done — private repo at [JoshPerlette9497/site-tracker](https://github.com/JoshPerlette9497/site-tracker).
3. ~~Connect Netlify to the GitHub repo for auto-deploy on push.~~ Done — [slokker-site-log.netlify.app](https://slokker-site-log.netlify.app) (private), auto-deploys from `master` on every push.
4. Keep the Supabase connection exactly as-is — don't recreate the database or table.
5. Preserve the PWA manifest + service worker setup so installability keeps working.

## Deployment
- **GitHub**: private repo `JoshPerlette9497/site-tracker`, default branch `master`.
- **Netlify**: project `slokker-site-log`, deploys from GitHub on every push to `master`. No build command — this is a static site (base directory, build command, and publish directory are all left at their defaults/root). Currently a private Netlify project (only team members can view); use "Make public" in the Netlify UI if Josh wants the URL shareable without a Netlify login.

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
