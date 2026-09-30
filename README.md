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

### Cleanup — legacy master/instances checklist cleared
`migrateClearLegacyMasterChecklist_v1()` (`js/data.js`) one-time-clears the original `master`/`instances` seed pair ("Backing / Blocking Verification", "Pre-Drywall Backing Re-Check" — cloned onto every unit at initial setup, predating the real phase-checklist rebuild) that was still showing up under "Ad-hoc Checklist" on every Unit Detail page. Data only — the "Checklist Master" tab (`renderMaster()`/`openMasterModal()`/`addMasterItem()`) is untouched and stays fully usable if a real master-checklist item is ever added. Same pattern this file already used three times (`migrateClearPhaseChecklists_v1` etc.). Verified against the real backup (2 master items, 20 instance rows across 10 units, matching exactly) and in a headless browser: items gone from Unit Detail, Checklist Master tab still functional, no errors.

### Fixed vs. flexible due dates — auto-scheduling
Before building, an audit found this request's premise ("task-prioritizer system," "fixed_commitments," a priority-tier scheme with a "near-due checklist items" tier, "longest duration" tiebreak) didn't match anything in the actual codebase — flagged to Josh, who confirmed the resolution before any code was written:
- Tiebreak stays **shortest** duration first (the existing, already-tested Suggested Plan/Capacity behavior), not longest.
- Scope is **deficiencies only** — checklist items stay untouched, preserving the boundary set earlier this session.
- The auto-scheduling window is **capped at the existing 5 business days** (`businessDaysForward`), not dynamic per task.

**What was built:** `defs` gain `dueType` (`'fixed'`|`'flexible'`, migrated/defaulted to `'fixed'` everywhere — zero behavior change for anything not explicitly opted in) via `migrateDefDueType_v1()`. `computeWeekSchedule()` (`js/data.js`) is the new single source of truth, replacing the internals of `buildCapacityForecast()`: **fixed** items keep the exact pre-existing cascade-from-due-date behavior (unchanged code path); **flexible** items are placed by earliest-deadline-first, first-fit-from-today — processed in due-date-ascending order (least slack gets first pick of capacity), each one taking the earliest day in `[today, min(dueDate, 5th business day)]` with room, forced onto the day nearest its deadline if nothing in the window fits. `buildSuggestedPlan()` (today's queue — Now/Suggested Plan) and `buildCapacityForecast()` (the week view) both now derive from the same `computeWeekSchedule()` call, so a flexible item placed "today" can never disagree between the two views.

**Judgment calls, for review:**
- `scheduledDate` is **computed on read, never stored** — deviates from the literal "add a field" ask, but matches the established pattern in this file (`unifiedTaskStatus`, `dueStatus`, `computeRisk`) and gets Josh's "re-enters the pool fresh, re-evaluated alongside everything else" rescheduling requirement for free, with zero roll-forward code needed.
- "Escalate within 2 days of due_date" needed **no special-case code** — due-date-ascending processing plus a shrinking placement window already pushes an approaching-deadline flexible item toward the front of the queue and the start of its own window as time passes. Worth double-checking this actually reads as "escalated" to Josh in practice, since there's no explicit tier promotion happening.
- The overbook double-confirm warning (Add/Edit modals) now **only fires for fixed dates** — it exists to stop cramming too many hard-anchored items onto one day, which doesn't apply to something the scheduler is already spreading out automatically.
- **Worth flagging directly**: earliest-fit-from-today means a flexible item due a week out can still land on *today* if there's room, purely because nothing claimed that slot first — not spread evenly across its window. Confirmed as correct against the literal spec ("prefer a day or more before deadline") in a dedicated test case, but if the felt experience should instead lean toward *closer to today without cramming it in immediately*, that's a different algorithm and worth raising.

Verified with a 7-case Node harness (fixed-only regression against the pre-existing algorithm, front-loading with open capacity, flexible correctly skipping a nearly-full fixed day, urgent-vs-relaxed flexible competing for the same day, forced placement when a whole window is full, Suggested-Plan/Capacity consistency, weekend due-date rollover) and a headless browser against both synthetic and the real 230-deficiency dataset (all defaulting to fixed with zero regression, then a mixed scenario with no errors). Add/Edit modals gained a Schedule (Fixed date / Flexible) select; display is identical either way per spec — nothing in `cardForDef` changed.

### Subtask due-date spread
Audit found the original subtask feature gave every subtask the **same due date as the parent** (no spreading) and the breakdown modal collected no date at all — so Josh's "break a task into one piece per day" workflow required manually editing each subtask's date afterward, and even then a `flexible` subtask could let the auto-scheduler re-clump them the moment a day had spare capacity, undoing a deliberate spread.

Each subtask row in the breakdown modal now has an optional due-date field. `suggestSubtaskDueDates()` (`js/data.js`) fills in whatever's left blank — evenly spread across the business days from today through the parent's real due date (`businessDaysUntil()`, new alongside `businessDaysForward()`), first subtask landing today, last landing on the due date itself. Any date Josh sets by hand is kept as-is; blanks are filled independently by index position in the full spread, not gap-filled around the manual ones — simpler, but means a manual date can occasionally land on the same day as an auto-filled one (verified, not a bug — flagged here as a known simplification). Every subtask from this flow is **always `dueType:'fixed'`**, regardless of what the parent was — deliberate placement, not something the scheduler should be free to optimize away.

Verified with a dedicated Node harness (exact N-days-equals-N-subtasks case with no repeats, uneven spreads, weekend due-date rollover, no-due-date fallback, more subtasks than available days degrading gracefully instead of erroring, manual dates respected alongside auto-filled ones) and a headless browser: 4 subtasks with blank dates landed on 4 distinct business days, all fixed, no errors.

### Subtask usability fixes
Three real bugs/gaps found by reproducing each in a headless browser (not assumed):

1. **The subtask text field was ~22px wide, unusable.** `subtaskRowHtml()`'s three fields (free-text, minutes select, date input) sat in one flex row; the two short fields had no explicit `flex`, so the global `input,select,textarea{width:100%}` rule became their flex-basis and squeezed the free-text field (`flex:1`, flex-basis 0) down to almost nothing — confirmed with a screenshot and computed `getBoundingClientRect()` (22px before, 358px after). Fixed by stacking: the text field gets its own full-width line, the minutes/date pair sits below in their own row — the same pattern every other multi-field group in this app already uses, instead of patching the 3-way flex fight.
2. **Created subtasks were invisible** — `splitDefIntoSubtasks()` was working correctly (verified: subtask and `parentId` both persisted), but nothing surfaced them: they could land in "No Date" while Josh was looking at the default "Due Date" tab, and the parent (always marked Done, always on the Done tab) showed no trace of having been split — that information only existed in its Notes, unread. Fixed two ways: `subtaskLineageTag()` adds a small `· ↳ part of: <parent>` or `· split into N subtasks` fragment to both `defRowWithActions()` and `defRowDone()`'s item-meta line, visible on the row itself in any tab; and `openSubtaskPromptModal()`'s save handler now always jumps to the Deficiencies tab (filtered to "Due Date" or "No Date" depending on whether the new subtasks got dates) right after creating them, regardless of where the modal was opened from.
3. **No way to break down an existing item after the fact.** The only trigger was the automatic >=30-minute prompt at Add/Edit save — an item created before this feature existed, or one already dismissed once (`subtaskPromptDismissed`), had no path back in. Added a "Break Into Subtasks" button to the Edit Deficiency modal (hidden once the item is Done) that opens the same `openSubtaskPromptModal()` directly, bypassing the estimate/dismissed gates entirely since this is an explicit manual request.

Verified in a headless browser: text field width before/after, full create→navigate→tag flow end-to-end (parent shows "split into 2 subtasks", subtask shows "part of: ..."), and the manual button working on a 15-minute already-dismissed item while correctly staying hidden on a Done one.

### Subtasks visible inside the Edit Deficiency modal itself
Follow-up to the fixes above: the list-row tag (`subtaskLineageTag()`) told Josh a deficiency had been split, but opening the parent's own Edit modal showed nothing beyond the description — no way to see or jump to the actual subtasks without going back to the list and finding each one. `openEditDefModal()` now computes `children = state.defs.filter(x=>x.parentId===d.id)` and, when non-empty, renders a "Subtasks (N)" section listing each child (description, due date or "no due date", status stamp) as a tappable row; tapping one reopens the modal for that subtask. The reverse direction was added too: if the item being edited is itself a subtask (`d.parentId` set), the modal now shows a "↳ part of: `<parent description>`" link at the top that reopens the parent's modal — so Josh can move back and forth between a split item and its pieces without leaving the modal flow.

Verified in a headless browser: seeded a Done parent with two subtasks, opened the parent's Edit modal and confirmed both subtask rows render with their due dates and no stray "part of" link (the parent has no `parentId`); clicked a subtask row and confirmed it navigated to that subtask's own modal, which showed the "part of" link with the parent's description; clicked that link and confirmed it navigated back to the parent's modal with its two subtask rows still intact.

### Split parents surfaced on the Due Date / No Date lists, not just Done
Josh reported: "I can see all subtasks in the full deficiencies list but none of the parent tasks." Reproduced the real flow (Add Deficiency → 60 min estimate → split into 2 subtasks) end to end — not a data bug: the parent saves correctly with `status:'Done'` and does show up, but only under the Done tab, while `openSubtaskPromptModal()`'s save handler (added in the fix above) auto-switches to whichever tab the new subtasks landed in (Due Date or No Date). A split parent isn't actually finished work, so filing it only under "Done" — a tab Josh has no reason to check for it — buried it away from the very subtasks it was broken into.

Asked Josh where he'd want it instead of guessing between the several reasonable options (relabel it in Done only; a dedicated 4th "Split" tab; or surface it read-only alongside its subtasks). He chose the third: keep the parent's `status:'Done'` as-is (no change to completion stats or capacity math), but also render a read-only copy of it at the top of the Due Date and/or No Date tab(s) its subtasks landed in. `parentsSurfacedIn(list)` (`js/render.js`) collects the unique parents of whatever's in the currently-shown list; `splitParentRowHtml(p)` renders each as a dashed, slightly-faded card with a distinct "Split" stamp (not "Done", not a real due-status stamp) and no action buttons — tapping it opens the same Edit modal as any other row (subtasks-inside-modal from the fix above). A parent whose subtasks span both tabs (one dated, one not) surfaces in both.

Verified in a headless browser: the real create-flow reproduction above now shows the parent row alongside its two subtasks on the Due Date tab (previously only found under Done); a seeded parent with one dated + one undated child correctly surfaces in both tabs with a "Split" stamp, no buttons or inputs on the row; and tapping the surfaced row opens that parent's own Edit modal with its subtasks section intact.

### Capture location — dropdown of active units only
`openCaptureModal()`'s location field was free text with a `<datalist>` of suggestions — nothing stopped a typo or an arbitrary string from being saved. It's now a strict `<select>` built from `state.units.filter(u=>u.active)`, plus a blank "— none —" first option (kept, since Capture's whole design is "nothing else required" — this only constrains location to a real active unit *when one is given*, it doesn't force one). Scoped to Capture only initially — the Add Deficiency modal's location field followed the same day (see below).

### Add Deficiency location — same dropdown treatment
Same change applied to `openDefModal()`: free-text-with-datalist replaced by a strict `<select>` of active units, blank-optional, matching Capture exactly. One wrinkle Capture didn't have: this modal is also opened pre-filled from a specific unit's own detail page (`openUnitDetail()`'s "+ Add" button passes that unit's name as `prefillLocation`), and that unit can be **inactive** (e.g. logging something noticed right after marking a unit complete) — restricting the list to active-only would have silently broken that prefill. Fixed by including the prefilled unit in the option list even when inactive, so it still resolves and shows selected; it just doesn't appear as a choice for a blank/manual Add. Verified in a headless browser: dropdown excludes inactive units for a normal Add, correctly prefills and preserves an inactive unit when opened from that unit's own detail page, saves correctly either way.

### Button press feedback + duplicate-tap guard
Josh reported: taps felt "stagnant" with no visible sign anything had registered, which led to tapping Add/Save multiple times and ending up with duplicate entries. Root cause: `*{-webkit-tap-highlight-color:transparent;}` (near the top of `style.css`) strips iOS Safari's native tap flash so it doesn't clash with the app's own colors, but nothing was added in its place — so on a real phone, a tap gave zero visual feedback, and a save handler that has to await a Supabase write before closing its modal made that gap in feedback last long enough to invite a second, third tap.

Fixed two ways, addressing both the feeling and the actual consequence:
1. **Visible press feedback.** `style.css` now gives `.btn`, `.capture-fab`, `nav.tabs button`, and every clickable row (any `.card` with inline `cursor:pointer` — covers `.def2-card` and friends without needing to enumerate every specific class) an `:active` state: a quick scale-down + darken/brightness shift on a fast (0.08s) transition, so a tap visibly "presses" the instant it lands, independent of how long the actual save takes.
2. **A real double-submit guard, not just cosmetic.** A single capturing-phase `click` listener in `js/app.js` disables whichever `<button>` was just clicked and re-enables it ~500ms later — done once, globally, rather than touching each of the ~25 individual save/add handlers across this codebase. This relies on a real (and verified) browser behavior: setting `disabled = true` on an element *during* the capture phase of its own click does not cancel that same click's dispatch — the button's own handler still runs to completion — it only blocks a *second*, rapid click on that same button from doing anything. A deliberate second click after the 500ms window (e.g. confirming an overbook warning — "Save Anyway") still works normally.

Verified in a headless browser: confirmed the `:active` transform actually applies (had to root-cause two false test failures first — `Element.matches(':active')` doesn't reliably reflect CDP-synthetic mouse presses in this environment even though the style itself is correctly applied, and a blocked-network "couldn't save" toast can transiently sit on top of the element being tested — neither was a real bug, both were headless-test artifacts, caught by checking `document.elementFromPoint()` and computed style directly instead of trusting `.matches()`); a rapid double-click on "+ Add Subtask" added exactly one row, not two, and the button re-enabled and worked again after the debounce window; and the existing overbook-confirm flow (click "Add Deficiency" → warning appears → click "Add Anyway") still saves correctly when the second click comes after the window, so the guard doesn't interfere with intentional same-button double-clicks.

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
- **Netlify**: retired as of production traffic, but its GitHub App integration stayed connected to this repo long after that — it kept auto-building a deploy preview (and sending email notifications) on every pull request, unrelated to the "retired" note above being written. Confirmed fully disconnected 2026-09-27 (Josh uninstalled the Netlify GitHub App). If Netlify activity ever resumes unexpectedly, check GitHub repo Settings → Integrations → GitHub Apps first, not just the Netlify dashboard — the two are separate connections and both need to be gone.

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
