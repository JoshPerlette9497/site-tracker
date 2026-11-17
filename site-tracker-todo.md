# Site Log — To Do

- [x] Test chat-safe writes
- [x] Test ordered phase dropdown
- [ ] Test Playbook engine — Look-Ahead screen, what-if preview/Apply, Playbook editor, rough-in phases in dropdowns (see README "Playbook engine" section for full test plan). Built and headless-tested; not marked done per Josh's own instruction — he tests everything himself.
- [x] Fill in the `needsInput` rules with real numbers: cribber's over-dig clearance (pb_003 → 24"), sewer-inspection lead time (pb_004 → 1-2 business days), metal roof duration (pb_009 → ~10 days vs ~7 for shingles)
- [ ] If this unit has a metal roof: set its Roofing phase duration to ~10 days in the Playbook editor (pb_009 now reminds you of this, but it's a per-unit override you still have to make — the global default stays 3 days)
- [ ] Decide whether Playbook-generated tasks should default to `owner: 'Josh'` (current default) or `owner: 'Trade'` for some rule types — flagged as a judgment call in the README
- [ ] Tune `phaseDurations` for real phases (all default to 3 days right now) and consider shortening Roofing/rough-in durations to compensate for the known real-world overlap (v1 projects them in a line)
- [ ] Week Overload view doesn't use the new week-view hook (`playbookProjectedTransitions()`) yet — data is exposed but not wired into that screen
