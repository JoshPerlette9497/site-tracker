# Site Log — To Do

- [x] Test chat-safe writes
- [x] Test ordered phase dropdown
- [ ] Test Playbook engine — Look-Ahead screen, what-if preview/Apply, Playbook editor, rough-in phases in dropdowns (see README "Playbook engine" section for full test plan). Built and headless-tested; not marked done per Josh's own instruction — he tests everything himself.
- [ ] Fill in the `needsInput` rules in the Playbook editor once real numbers are known: cribber's required over-dig clearance (pb_003), real sewer-inspection lead time (pb_004), metal roof duration if applicable (pb_009)
- [ ] Decide whether Playbook-generated tasks should default to `owner: 'Josh'` (current default) or `owner: 'Trade'` for some rule types — flagged as a judgment call in the README
- [ ] Tune `phaseDurations` for real phases (all default to 3 days right now) and consider shortening Roofing/rough-in durations to compensate for the known real-world overlap (v1 projects them in a line)
- [ ] Week Overload view doesn't use the new week-view hook (`playbookProjectedTransitions()`) yet — data is exposed but not wired into that screen
