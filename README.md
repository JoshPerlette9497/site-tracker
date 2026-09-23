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

### Unified task model — Phase 1 (deficiencies only)
`defs` items now carry a shared task shape, added in `js/data.js` (`migrateDefTaskFields_v1`, `unifiedTaskStatus`): `verifier`, `followUpDate` (distinct from `dueDate` — a check-back reminder, not a deadline), `startedAt`, and an append-only `notes[]` log (seeded from any existing `pushReason` on migration, which itself is untouched and still drives the push/backlog UI). `unifiedTaskStatus(d)` is computed on read, never stored, so it can't desync from `owner`/`status` edited through the existing Add/Edit Deficiency modals.

Deliberately **not** touched: phase checklist groups/items (`checklistGroups`/`groupInstances`) and the legacy `master`/`instances` pair. They stay their own thing — surfaced by `currentPhaseChecklistGroup()`/`buildSuggestedPlan()` off round-logging (`currentPhase`/`lastWalkDate`), which this phase leaves completely alone.

### Phase 2 — NOW section
`buildSuggestedPlan()`'s tiebreak order is now due date → category → priority → shortest `estimatedMinutes` (previously fell back to array order past priority). The **Today tab was deleted** — Brief is now the sole/default tab (`activeTab` defaults to `'brief'`; `renderToday`/`cardForInstance` removed). Brief opens with a **Now** section (`nowSection()` in `js/render.js`): a pinned, visually distinct (`.now-card`) preview of the Suggested Plan queue's own first item — not a separate selection, so reordering the queue via drag moves Now with it. Falls back to the earliest open item whose new `followUpDate` has arrived (`followUpsDue()` in `js/data.js`) when the queue is empty — the first real consumer of that Phase 1 field. No conflict/time-of-day detection (nothing in the model has a time component) — scheduling around fixed commitments stays manual.

**Closing the loop on the Phase 1 fields:** the Edit Deficiency modal now has Verifier and Follow-up Date inputs, plus an append-only Notes log (add-only from the UI — existing notes aren't editable, matching the field's design). Every open deficiency card also gets a **Start** button (hidden once `startedAt` is set) so `startedAt` has a real trigger instead of being unreachable. Verified end-to-end in a headless browser: notes append correctly, verifier/follow-up persist through the existing overbook-warning double-confirm flow, Start sets `startedAt` and removes itself from the card.

### Phase 3 — Capacity planning
A **Capacity** section on Brief (`capacitySection()`/`buildCapacityForecast()`) projects Josh's own (`MY_ACTION`-equivalent, owner-`Josh`) open workload against `dailyAllowanceMinutes` across the **next 5 business days** (`businessDaysForward()`/`nextBusinessDay()` in `js/data.js` — Mon–Fri only, weekend due dates roll forward onto the next business day rather than silently dropping out of the forecast). Uses the same greedy fill and tiebreak as `buildSuggestedPlan()`; whatever doesn't fit a day cascades into the next day as a push suggestion. Confirming a suggestion (**Push** button) moves the item's real `dueDate` forward one business day and records it via `pushCount`/`pushReason` — the same backlog-push semantics a checklist instance's Push button already tracked, but deficiencies had the fields with no UI writing to them until now. **Keep** dismisses a suggestion for the current render only (no data change — it'll resurface next time if the underlying due-date pile-up is still there). Trade/Delegated items are excluded entirely, same as `buildSuggestedPlan()` already excludes them. Verified in an isolated Node harness (weekend rollover, cascade behavior, push confirmation) and a headless browser against real deficiency data with a deliberately tiny budget to force overflow.

### Phase 4 — Subtask breakdown (no AI)
Originally scoped as an "AI prioritizer," but the app has no backend and no LLM API key can safely live in client JS (unlike the Supabase anon key, which is safe only because of its RLS policy) — so this shipped as a plain rule-based prompt instead, no model call involved. Saving a deficiency (Add or Edit) whose estimate crosses 60 minutes triggers `openSubtaskPromptModal()`: Josh names and sizes as many subtasks as he wants on the spot. Confirming (`splitDefIntoSubtasks()` in `js/data.js`) creates each subtask as a **full standalone deficiency** (own owner/due date/status/etc., tagged with `parentId` for provenance only — nothing reads it yet) rather than a lightweight sub-item, so subtasks work with Suggested Plan, capacity planning, and follow-ups with zero special-casing. The parent is marked `Done` with no `completedDate` (it wasn't completed, it was decomposed) and gets a note recording what it was split into — reuses the existing `status!=='Done'` filter everywhere instead of threading a new status value through every query. Declining ("Not Now") sets `subtaskPromptDismissed` so it's a one-shot ask, not a nag on every future edit. Verified in a headless browser: prompt fires on crossing the threshold from both Add and Edit, subtasks persist correctly, decline suppresses re-prompting on a later re-save.

### Phase 5 — Capture button
The last item from the original roadmap that had been deliberately deferred. `#captureFab` is a floating button, fixed outside `#app` (index.html, alongside `nav.tabs` rather than inside a per-tab render) so it persists across every tab without needing to be re-added by each render function. Opens `openCaptureModal()` (`js/render.js`) — a single required field (the note), everything else optional. Captured items land as owner `Unassigned` with no due date and no estimate, which — no new filter code needed — is exactly what the **pre-existing** (predates this work) Deficiencies → "No Date" tab and "Missing estimate only" toggle already surface, inline-editable right in that list. Brief also gets a **Needs triage** line (next to the existing Backlog line) linking straight to that filtered view, so nothing requires remembering to go look. Verified in a headless browser: FAB persists across tab switches, a captured item lands with the right (empty) fields, and the triage link correctly navigates and shows it.

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
