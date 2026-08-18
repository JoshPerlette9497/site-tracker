/* ---------- default seed data ---------- */
const DEFAULT_UNITS = [
  {id:uid(), name:'Aurora B03', project:'Aurora', active:true, btLocation:'Aurora B03', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Aurora B04', project:'Aurora', active:true, btLocation:'Aurora B04', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Aurora B16', project:'Aurora', active:true, btLocation:'Aurora B16', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Aurora B17', project:'Aurora', active:true, btLocation:'Aurora B17', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Aurora B18', project:'Aurora', active:true, btLocation:'Aurora B18', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Juniper B01', project:'Juniper', active:true, btLocation:'Juniper B01', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Juniper B12', project:'Juniper', active:true, btLocation:'Juniper B12', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
  {id:uid(), name:'Juniper B20', project:'Juniper', active:true, btLocation:'Juniper B20', currentPhase:'', crntTrade:'', ctEnd:null, nextTrade:'', lastWalkDate:null, riskOverride:null},
];

const CURRENT_PHASE_OPTIONS = ['Pre-Cribbing','Pre-Excavation','Pre-Undergrounds','Pre-Backfill','Pre-Framing','FRAME CHECK: Pre-IPD','FRAME CHECK: Exterior','FRAME CHECK: ALL Rooms','FRAME CHECK: Garage','FRAME CHECK: Powder Room/Bathrooms','FRAME CHECK: Kitchen','FRAME CHECK: Laundry','FRAME CHECK: Stairs','FRAME CHECK: Living Room/Bedrooms','FRAME CHECK: Mechanical Room','FRAME CHECK: Decks/Porches',"FRAME CHECK: Post-Rough-In's Backframing",'Pre-Rough-ins','Pre-HVAC rough-in','Spray Paint','Pre-rough city inspections','Pre-Insulation and Drywall','Pre-Boarding','Pre-Taping','Pre-S1','Pre-OTR','Pre-Flooring','Pre-S2 Carpentry','Pre-Trade Finals','Pre-Final Inspection and Appliances','Con Walk and Pre-Occupancy: Con Walk','Con Walk and Pre-Occupancy: Stress Tests','Con Walk and Pre-Occupancy: Exterior Pre-Occ','Possession'];

function businessDaysBetween(fromISO, toISO){
  const d = new Date(fromISO);
  const to = new Date(toISO);
  let count = 0;
  while(d < to){
    d.setUTCDate(d.getUTCDate()+1);
    const day = d.getUTCDay();
    if(day!==0 && day!==6) count++;
  }
  return count;
}

/* Mon-Sun range containing today, using the same local-date logic as the
   rest of the app (todayISO/addDays — no timezone conversion beyond that). */
function currentWeekRange(){
  const today = todayISO();
  const dow = new Date(today+'T00:00:00').getDay(); // 0=Sun..6=Sat
  const mondayOffset = dow===0 ? -6 : 1-dow;
  const weekStart = addDays(today, mondayOffset);
  const weekEnd = addDays(weekStart, 6);
  return {weekStart, weekEnd};
}

function computeRisk(u){
  if(u.riskOverride) return u.riskOverride;
  if(!u.lastWalkDate) return '🔴';
  const days = businessDaysBetween(u.lastWalkDate, todayISO());
  if(days<1) return '🟢';
  if(days<2) return '🟡';
  return '🔴';
}

const CHECKLIST_GROUPS_SEED = [
{id:uid(),name:'Pre-Cribbing',milestone:'Excavation',offsetDays:2,matchPhase:'form footings',items:[{id:uid(),text:'booked structural rebar inspection where applicable (5-plex and up)'},{id:uid(),text:'flat hole + party walls cut lower'},{id:uid(),text:'sewer trench backfilled'},{id:uid(),text:'sewer trench slope correct for plumbers'}]},
{id:uid(),name:'Pre-Excavation',milestone:'Excavation',offsetDays:2,matchPhase:'excavation',items:[{id:uid(),text:'Excavation addressing for inspections'},{id:uid(),text:'hydrodig utilities'},{id:uid(),text:'staked out'},{id:uid(),text:'Footing layout to visualize horizontal space + grade layout for vertical space'}]},
{id:uid(),name:'Pre-Undergrounds',milestone:'Excavation',offsetDays:2,matchPhase:'pour walls',items:[{id:uid(),text:'Electric backer panel installed'},{id:uid(),text:'Order gas riser and get Jess from ATCO on site to inspect and work order them'},{id:uid(),text:'MARK GRADES: unit numbers'},{id:uid(),text:'MARK GRADES: UTILITIES'},{id:uid(),text:'Support for gas riser'},{id:uid(),text:'Groundworks gravel'},{id:uid(),text:'MARK GRADES: LANDSCAPING'}]},
{id:uid(),name:'Pre-Backfill',milestone:'Excavation',offsetDays:2,matchPhase:'backfill',items:[{id:uid(),text:'panel backer and meter banks installed (ladder/lift)'},{id:uid(),text:'water main tail stubbed out 8-10ft above grade in mech rooms (Heritage)'}]},
{id:uid(),name:'Pre-Framing',milestone:'Excavation',offsetDays:2,matchPhase:'backfill',items:[{id:uid(),text:'Print/post/send all SI\'s/CO\'s/Selections + notify sticky trades'},{id:uid(),text:'Remove window well braces before framing, where applicable'},{id:uid(),text:'consolidate and notify trades of all IFC\'s/SI/Selections'}]},
{id:uid(),name:'FRAME CHECK: Pre-IPD',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'Joists/trusses accessible for fire stopping'},{id:uid(),text:'Tubs/showers fit AFTER drywall'},{id:uid(),text:'Braces removed'},{id:uid(),text:'Concrete floors flat for flooring install; line up self-leveling'}]},
{id:uid(),name:'FRAME CHECK: Exterior',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'Correct fascia size'},{id:uid(),text:'insulation stops secure to building exterior'},{id:uid(),text:'entry doors operate'},{id:uid(),text:'exterior sheathing lifting holes patched'},{id:uid(),text:'Roof access hatch cut'},{id:uid(),text:'Soffit backing'},{id:uid(),text:'Roof vents cut'},{id:uid(),text:'DensGlass firestopping in proper areas'},{id:uid(),text:'Exterior sheathing flush for siding/stone'}]},
{id:uid(),name:'FRAME CHECK: ALL Rooms',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'1)architectural/structural 2) mechanical 3) drywallers'},{id:uid(),text:'Windows work/correct RO'},{id:uid(),text:'HVAC holes cut/framed'},{id:uid(),text:'Walls and ceilings level/straight/square'},{id:uid(),text:'Light switch locations are convenient'},{id:uid(),text:'top floor insulation stops secure'},{id:uid(),text:'Fire stopped properly at party walls and trusses + no party wall spacer blocks'},{id:uid(),text:'Doors work/correct RO'},{id:uid(),text:'check structural details in all areas where necessary'},{id:uid(),text:'Plumbing walls installed prior to cabinet mark out'},{id:uid(),text:'Floors flat and no deflection/squeaks'},{id:uid(),text:'UNITS CLEANED AND SWEPT'},{id:uid(),text:'top floor attic hatch installed'},{id:uid(),text:'Can it batt insulate/foam insulate/blown insulate/poly/board/tape?'},{id:uid(),text:'top floor uplift blocks'}]},
{id:uid(),name:'FRAME CHECK: Garage',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'door cripples point loaded to garage slab; see structural detail where necessary'},{id:uid(),text:'Exterior and Garage to house doors operate'},{id:uid(),text:'OH door backing'}]},
{id:uid(),name:'FRAME CHECK: Powder Room/Bathrooms',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'TP and towel bar backing installed correct location/height'},{id:uid(),text:'Mirrors on flat/level walls'},{id:uid(),text:'studs @ 20in from back of tub to anchor water lines and valves'},{id:uid(),text:'Joists don\'t compete with plumbing'},{id:uid(),text:'Tub/shower fits AFTER IPD @ 60in length'}]},
{id:uid(),name:'FRAME CHECK: Kitchen',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'(Heritage model) plumbing wall set with 1in gap from exterior wall to give HVAC heat run 7in of room'},{id:uid(),text:'cabinet backing @ 36in and 93in from floor OR studs @ 16in OC'}]},
{id:uid(),name:'FRAME CHECK: Laundry',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'minimum 36in laundry machine depth after plumbing walls (Heritage models)'}]},
{id:uid(),name:'FRAME CHECK: Stairs',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'Stairs centered on stairwells and doors/openings'},{id:uid(),text:'Under stairs backing'},{id:uid(),text:'Stair nosing on/off per selections'},{id:uid(),text:'Handrail backing correct at main runs/winders/landings'},{id:uid(),text:'Baseboard area STRAIGHT'},{id:uid(),text:'headroom correct and sloped ceiling correct (check structural detail where necessary)'},{id:uid(),text:'stairs centered on FINISHED OPENING'},{id:uid(),text:'upper stairs 36in high stub wall correct height and anchored to floors system'}]},
{id:uid(),name:'FRAME CHECK: Living Room/Bedrooms',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'General room list'},{id:uid(),text:'Closet door RO\'s'}]},
{id:uid(),name:'FRAME CHECK: Mechanical Room',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'(Bella\'s) blocking to separate batts from foam insulation'},{id:uid(),text:'(Heritage model) underside of stairs backing @ 1ft OC for more holding power'}]},
{id:uid(),name:'FRAME CHECK: Decks/Porches',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'roof vent holes cut as required'},{id:uid(),text:'roof soffit dropped as necessary'},{id:uid(),text:'posts point loaded to sonotubes or slab'},{id:uid(),text:'deck posts built out as per architectural drawings'}]},
{id:uid(),name:'FRAME CHECK: Post-Rough-In\'s Backframing',milestone:'Framing',offsetDays:2,matchPhase:'hvac rough in',items:[{id:uid(),text:'OH door wall and ceiling backing'},{id:uid(),text:'underside of stairs backing @ 2ft on center'},{id:uid(),text:'firestopping drywall installed at winders/landings where next to party wall'},{id:uid(),text:'Ceiling drops: garages/powder rooms/Bella garage entry hallways'},{id:uid(),text:'Bulkheads'},{id:uid(),text:'handrail backing @ 32in on center; check at winders'},{id:uid(),text:'Bath fan backing'},{id:uid(),text:'Ceiling drop at deck soffit'},{id:uid(),text:'Top floor uplift blocks'},{id:uid(),text:'Garage OH door backing in middle, side posts, ceiling at 10ft in on tracks and 8ft in on motor'}]},
{id:uid(),name:'Pre-Rough-ins',milestone:'Framing',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'Window sheets'},{id:uid(),text:'IPD completed'},{id:uid(),text:'Plumber roof penetrations'},{id:uid(),text:'Construction knobs'},{id:uid(),text:'Cabinets marked out'},{id:uid(),text:'Construction heat in basements or garages'},{id:uid(),text:'Blue mats inside garages and outside front entries for mud control'},{id:uid(),text:'All exterior spotless'}]},
{id:uid(),name:'Pre-HVAC rough-in',milestone:'Rough-In',offsetDays:2,matchPhase:'plumbing rough in',items:[{id:uid(),text:'Plumbers sweep'},{id:uid(),text:'Plumbers cleaned up hole cuts'},{id:uid(),text:'verify plumber rough selections correct'},{id:uid(),text:'Plumbers reinstall studs taken out for moving tubs'}]},
{id:uid(),name:'Spray Paint',milestone:'Rough-In',offsetDays:2,matchPhase:'framing',items:[{id:uid(),text:'flooring layout'},{id:uid(),text:'all HVAC'},{id:uid(),text:'all electrical'}]},
{id:uid(),name:'Pre-rough city inspections',milestone:'Rough-In',offsetDays:2,matchPhase:'fire stopping',items:[{id:uid(),text:'shower head roughs at correct height 7ft max'},{id:uid(),text:'booked architectural and structural inspections + city inspections where applicable'},{id:uid(),text:'waterline pressure holding'},{id:uid(),text:'verify all rough selections correct'},{id:uid(),text:'gas exterior stub address tags'},{id:uid(),text:'gas line pressure holding'},{id:uid(),text:'Spray paint electric and HVAC (one color is fine)'},{id:uid(),text:'Spray paint checklist'},{id:uid(),text:'kitchen OTR vent and wiring centered on range and hidden by cabinet or shroud'},{id:uid(),text:'Sawdust sweep/vac'},{id:uid(),text:'Order gas meters'}]},
{id:uid(),name:'Pre-Insulation and Drywall',milestone:'Rough-In',offsetDays:2,matchPhase:'fire stopping',items:[{id:uid(),text:'Drywall frame check (drywall foreman) is COMPLETE'},{id:uid(),text:'X4 furnace filters each unit'},{id:uid(),text:'All walls and floors can be insulated/boarded/taped with respect to mechanical installs'}]},
{id:uid(),name:'Pre-Boarding',milestone:'Rough-In',offsetDays:2,matchPhase:'fire stopping',items:[{id:uid(),text:'HVAC hood fans proper location to cabinets'},{id:uid(),text:'Framed backing to tie-in insulation/poly'},{id:uid(),text:'Can I board it? Can I tape it?'},{id:uid(),text:'Walls straight for tile'},{id:uid(),text:'Floor cut sheets onto windows and tubs/showers'},{id:uid(),text:'Party wall studs installed'},{id:uid(),text:'Ceiling backing at intersections/dead ends'},{id:uid(),text:'Tub damage'}]},
{id:uid(),name:'Pre-Taping',milestone:'Drywall',offsetDays:2,matchPhase:'boarding',items:[{id:uid(),text:'shower head holes not cut too large'},{id:uid(),text:'long hallways and stairs aren\'t wavy (dead bodies from frame check)'},{id:uid(),text:'OTR vent holes not cut too large'},{id:uid(),text:'Floor cut sheets onto windows and tubs/showers'},{id:uid(),text:'Buried mechanical items: switches/receptacles/bath fans'},{id:uid(),text:'corners straight for tile'},{id:uid(),text:'basement bulkheads steel framed'},{id:uid(),text:'Slokker door stops'}]},
{id:uid(),name:'Pre-S1',milestone:'Drywall',offsetDays:2,matchPhase:'prime',items:[{id:uid(),text:'spotless for priming'},{id:uid(),text:'CHANGE FURNACE FILTER'},{id:uid(),text:'textured, sanded, vacuumed on schedule'},{id:uid(),text:'Vacuum + wipe out showers and tubs'}]},
{id:uid(),name:'Pre-OTR',milestone:'Finishing',offsetDays:2,matchPhase:'floor qc',items:[{id:uid(),text:'tile/granite backsplash installed'},{id:uid(),text:'correct OTR/hood fans delivered as per selections/CO\'s'}]},
{id:uid(),name:'Pre-Flooring',milestone:'Finishing',offsetDays:2,matchPhase:'paint 1st coat',items:[{id:uid(),text:'Floor cut sheets posted'},{id:uid(),text:'self-level concrete assessed and installed where applicable for LVP (AT FRAME CHECK IDEALLY DONE BEFORE DRYWALL START)'},{id:uid(),text:'Tubs cleaned out for tile workers'},{id:uid(),text:'S1 carpenters correct subfloor locations for tile'},{id:uid(),text:'CHANGE FURNACE FILTER'},{id:uid(),text:'baseboard installed at correct height carpet vs. LVP'},{id:uid(),text:'confirm correct flooring and tile delivered'}]},
{id:uid(),name:'Pre-S2 Carpentry',milestone:'Finishing',offsetDays:2,matchPhase:'floor qc',items:[{id:uid(),text:'floor protection put down'},{id:uid(),text:'cleaned/sweeped of garbage and dust'},{id:uid(),text:'S2 hardware correct delivery'},{id:uid(),text:'flooring done installation'},{id:uid(),text:'HVAC holes cut out'},{id:uid(),text:'Swiffer LVP'}]},
{id:uid(),name:'Pre-Trade Finals',milestone:'Finishing',offsetDays:2,matchPhase:'floor qc',items:[{id:uid(),text:'CHANGE FURNACE FILTER'},{id:uid(),text:'S2 carpenter done and cleaned up'},{id:uid(),text:'flooring done and ready for HVAC final'}]},
{id:uid(),name:'Pre-Final Inspection and Appliances',milestone:'Finishing',offsetDays:2,matchPhase:'plumbing final',items:[{id:uid(),text:'con walk to-do list done (Slokker staff + YOU)'},{id:uid(),text:'CONSTRUCTION IS COMPLETE AND ALL IS READY FOR FINAL INSPECTION'},{id:uid(),text:'correct appliances delivered'},{id:uid(),text:'HERITAGES ONLY: remove laundry room doors and DAP baseboard'}]},
{id:uid(),name:'Con Walk and Pre-Occupancy',milestone:'Finishing',offsetDays:2,matchPhase:'construction walk through',items:[{id:uid(),text:'organize cabinets',subgroup:'Con Walk'},{id:uid(),text:'install BELLA powder room mirrors',subgroup:'Con Walk'},{id:uid(),text:'sweep/pressure wash garages/driveways/porches/decks/patios',subgroup:'Con Walk'},{id:uid(),text:'all mechanical OPERATIONAL AND SECURED',subgroup:'Con Walk'},{id:uid(),text:'WOCD locks OPERATIONAL AND SECURED',subgroup:'Con Walk'},{id:uid(),text:'garage door remotes x2 into kitchen drawer with all appliance manuals',subgroup:'Con Walk'},{id:uid(),text:'smoke detector shower caps',subgroup:'Con Walk'},{id:uid(),text:'paint tag out',subgroup:'Con Walk'},{id:uid(),text:'drydex garage man doors',subgroup:'Con Walk'},{id:uid(),text:'appliance clocks',subgroup:'Con Walk'},{id:uid(),text:'mechanical room spotless',subgroup:'Con Walk'},{id:uid(),text:'remove protective film on exterior door latches and sills',subgroup:'Con Walk'},{id:uid(),text:'CHANGE FURNACE FILTER',subgroup:'Con Walk'},{id:uid(),text:'bipass door bumpers',subgroup:'Con Walk'},{id:uid(),text:'handrail brackets reinstalled by painters',subgroup:'Con Walk'},{id:uid(),text:'black entry mat',subgroup:'Con Walk'},{id:uid(),text:'mech room panel labels',subgroup:'Stress Tests'},{id:uid(),text:'lights',subgroup:'Stress Tests'},{id:uid(),text:'smoke detectors',subgroup:'Stress Tests'},{id:uid(),text:'appliances',subgroup:'Stress Tests'},{id:uid(),text:'hot water tanks',subgroup:'Stress Tests'},{id:uid(),text:'bath fans',subgroup:'Stress Tests'},{id:uid(),text:'ventilation fan switch',subgroup:'Stress Tests'},{id:uid(),text:'outlets/switches',subgroup:'Stress Tests'},{id:uid(),text:'humidifier',subgroup:'Stress Tests'},{id:uid(),text:'tubs/sinks',subgroup:'Stress Tests'},{id:uid(),text:'exterior cleaned and graded for safety',subgroup:'Exterior Pre-Occ'},{id:uid(),text:'safe access to units',subgroup:'Exterior Pre-Occ'},{id:uid(),text:'utilities safe access and/or closed and secured',subgroup:'Exterior Pre-Occ'}]},
{id:uid(),name:'Possession',milestone:'Finishing',offsetDays:2,matchPhase:'possession',exactMatch:true,items:[{id:uid(),text:'cleaners done'},{id:uid(),text:'humidifier plugged in and ON'},{id:uid(),text:'check all sinks appliances WATER ON'},{id:uid(),text:'doors rekey'},{id:uid(),text:'cabinets organized'},{id:uid(),text:'appliance clocks'}]}
];
CHECKLIST_GROUPS_SEED.forEach(g => { g.estimatedMinutes = 20; });

// offsetDays: days BEFORE the matched schedule finish date the item is due.
// matchPhase: text used to match against synced schedule event subjects (case-insensitive substring).
const DEFAULT_MASTER = [
  {id:uid(), name:'Backing / Blocking Verification', milestone:'Framing', area:'All Rooms', offsetDays:5, matchPhase:'framing', notes:'Grab bars, floating vanities, wall-hung TV, heavy shelving — verify backing present before cover-up.'},
  {id:uid(), name:'Pre-Drywall Backing Re-Check', milestone:'Drywall', area:'All Rooms', offsetDays:2, matchPhase:'board', notes:'Last chance to confirm backing before it is covered.'},
];

/* ---------- state ---------- */
let state = { units:[], master:[], instances:[], defs:[], schedule:[], checklistGroups:[], groupInstances:[], todayPlan:null, planFeedback:[] };
let activeTab = 'today';
let selectedScheduleUnit = null;
let selectedLogDate = null;
let expandedGroupIds = new Set();
let expandedPhaseOverflow = new Set();
let expandedUnitDefs = new Set();
let defsFilterTab = 'dated';
let logSearchQuery = null;
let defSearchQuery = '';
let defMissingEstimateOnly = false;
let defOwnerFilter = 'all';
let unitSearchQuery = '';
let inactiveUnitsExpanded = false;
let planDraft = null; // working copy of today's AI plan while Josh reviews/edits it before saving

const LOG_HISTORY_SEED = [
{date:'2026-08-04', content:"**AB03:** Stage 1 finish carpenter on site, finishing Thursday 8/6; cabinet install to follow 8/7–8/11. Josh corrected three undersized door openings in unit 2234 and 2236 basements same-day. CSM Flooring scheduled Fri 8/7 to level unit 2234 basement floor.\n**AB04:** Stage 1 finish carpenter on site, finishing Thursday 8/6; cabinet install to follow 8/7–8/11. Basement development for unit 2240 underway: IPD completed today, plumbers rough-in/finish tomorrow, HVAC rough-in 8/6, floor leveling 8/7, electrical rough-in 8/10, full inspection 8/11.\n**AB16:** Painters on site, finishing 8/6. CSM Flooring up next, 8/7–8/14.\n**AB17:** Plumbing final on site, finishing 8/6; HVAC final up next. Added deficiencies to verify shelves/mirrors installed and install Slokker Homes powder room mirror.\n**JB01:** Still waiting on permit to begin construction; following up with office/Scott on 8/7.\n**JB12:** No activity change. Following up with C+J Co on NC rate for slab pour.\n**JB20:** No activity change.\n**Site-wide:** Curb stop walk completed — deficiencies logged for AB02/06/07/08/11/12 and AB13–18. Punch list added: bollard light bases, bollard lights install, city sidewalk/81st St/AB18 path."},
{date:'2026-08-05', content:"**Site-wide:** Main gas valve at entrance needs ATCO to lift to grade. Concrete forms to be removed 8/7 or 8/10. Hydrodig booked 8/11 to expose pipe/valve for ATCO. ATCO gas valve move completed today.\n**Elkwood/Cove leak:** Valve behind 143/145 Elkwood tested, ruled out. Main valve shut off, stopped leak. Landscapers contacted.\n**AB17:** Ensuite shower tile cut too large for valve — CSM Flooring replacing tile 8/6, plumbers reinstalling valve 8/7.\n**AB16:** Standing reminder logged — remove 2nd bin once AB16 reaches Pre-Final Inspection and Appliances phase.\n**Deficiencies added (15):** shower tile/valve, AC full install, Wolfberry signage stickers, Juniper curb stops, hose bib water, Okotoks BBQ, streetlight backfill, green bin move, AB16 2nd bin (conditional), vanity drywall, vanity lights, garage man door lights, unit 156 attendance, parking dirt/lumber, framer checklist.\n**Completed — overdue cleanup (12) + same-day (11):** see full list in Notion.\n**Playbook additions:** Framers clean up when finished; rough-in trades sweep/blow out; exterior spotless after framing.\n**Phz Checks added:** Pre-Rough-ins \"All exterior spotless\" item."},
{date:'2026-08-06', content:"**Completed:** trade email replies; AB03 hose bib check; Juniper curb stop sweep (photos/locations logged); AB17 full QC pass (hardware, latches, ensuite float, shelves/mirrors, plumbing finals); no trespassing signs + fence extension; Citywide Towing seacans cleared off Juniper green space; JB12 slab pour follow-up; bollard light base pours; parking dirt flattened; unit 156 attended.\n**Still open (carried to 8/7):** Nathan grind AB04 retaining wall; AB16 camera still gone; AB18 streetlight backfill; Custom Electric + AFL data wiring; AB04 string line re-expose.\n**Rescheduled:** AB17 powder room mirror → 8/10; C+J sidewalk/81st/AB18 path → pour Monday 8/10.\n**Curb stop check — Juniper:** Bldg 02/2217, Bldg 23/111, Bldg 22/125 need lowering; Bldg 21/135 both valves need lowering; Bldg 09/150 curb stop in sidewalk."},
{date:'2026-08-07', content:"**Completed:** AB04 electricians finished final rough-in (401/402); AB03 & AB04 basement flooring leveling complete; AB17 plumbers reinstalled shower valve; Aurora entry curb/sidewalk complete; Aurora entries cleaned up; site fencing complete; Wolfberry signage stickers installed.\n**Added:** Move DensGlass lift closer to curb for Integrity pickup — due 8/10.\n**Phase Check Log completed:** AB04 \"Pre-rough city inspections\" (10 items) marked done.\n**Rescheduled (9 items) → mostly Mon 8/10**, JB01 permit check → 8/13.\n**Notes:** Built Phase → Buildertrend Schedule Map (33 phases, offset rules). Buildertrend Schedules calendar confirmed live in Outlook."},
{date:'2026-08-10', content:"**Completed:** AB04 string line re-exposed for Custom/AFL data run; curb stop lowering pass complete (AB02/06/07/08/11/12, AB13–18); C+J finished city sidewalk/81st/AB18 path; Hung fixed all Aurora windows; site trailer exterior cleanup; no trespassing signs installed; AB04 unit 402 TV backing installed.\n**Missed/overdue, still open (14 items):** AB16 camera, Citywide Towing seacans (reopened), road patch, OTIS fill, JB20 backfill, AB04 roof/insulation, bollard lights, AB17 mirror/vanity drywall, HVAC/AC install, streetlight backfill, DensGlass lift, private property signs.\n**Phase Check Log overdue/due:** correct appliances (8/4), HERITAGES laundry doors (8/4), construction complete for final inspection (8/4), con walk to-do (8/4), furnace filters x4 (8/1), walls/floors insulated (8/1), drywall frame check (8/1).\n**Note:** compiled retroactively 8/11, no live entry made 8/10."},
{date:'2026-08-11', content:"**Completed (5, all before 8am):** HVAC/AC full install 2204(119); DensGlass lift moved; Citywide Towing seacans confirmed moved to Juniper green space; Hung's window fixes verified; AB04 unit 402 TV backing installed; dead-end road scraped; gas main valve safety-fenced (ATCO pending).\n**Tasks pushed (18 items)** — mostly backlog reasons, carried multiple days.\n**Phase Check Log due today (11 items):** floor protection, furnace filter, Swiffer LVP, cleaned/swept, S2 carpenter, S2 hardware, flooring ready for HVAC, OTR/hoodfan correct, flooring install, HVAC holes, tile/granite backsplash. Plus AB17 (8/4) and AB04 (8/1) carried overdue (7 items).\n**Weather:** High 19°C/Low 11°C, 60% shower chance, wildfire smoke expected.\n**Tomorrow's Buildertrend:** Aurora B03 countertops/drywall touch-up; B04 siding/spray foam; B16 carpet; B17 paint 2nd coat; JB01 no schedule yet (still Pre-Excavation/Waiting on Permit)."},
{date:'2026-08-12', content:"**Completed:** Citywide Towing seacan move confirmed at Juniper green space; private property signs up (fencing complete); curb stop lowering pass verified on-site.\n**Follow-ups closed:** JB01 PEAK utility locates booked; AB17 vanity drywall fix closed out.\n**Tasks pushed (17 items)** — mostly backlog carryover.\n**Phase Check Log:** no items due 8/12 specifically; AB16-template carried overdue (11 items, due 8/11); AB17 carried overdue (4, due 8/4); AB04 carried overdue (3, due 8/1).\n**Weather:** High 14°C/Low 10°C, showers + thunderstorm risk, 5-10mm rain, AQHI 3.\n**Tomorrow's Buildertrend:** B03 drywall touch-up cont.; B04 siding/spray foam/insulation begins; B16 carpet/floor QC/material delivery; B17 construction walk-through; JB01 still no schedule.\n**Data flag:** duplicate seacan-move records need reconciling; stale push-reason text on 2 records flagged for cleanup."},
{date:'2026-08-13', content:"**Completed:** AB17 powder room mirror installed; AB16 camera removed; large batch of AB17 (units 110/112) Phase Check items closed same-day (construction complete for final inspection, con walk to-do, 20+ finish items); trade emails with Regal, Centra, Classic Projects, Aesthetic Construction on unit 110/112 punch lists; Ultralite Doors confirmed AB16 garage door painting done, weatherstripping install requested; AB03 garage door install coordination with Ultralite.\n**Follow-ups closed:** Custom Electric/AFL crossings & data wiring; AB04 insulation blow-out.\n**Tasks pushed (13 items)** — mostly backlog carryover.\n**Phase Check Log:** AB17 due-today items (7 still Not Started: handrail brackets, garage remotes, bipass bumpers, mech room, humidifier, sweep/pressure wash, cabinets); AB16-template + AB04 carried overdue; AB17 completed today (24+ items).\n**Weather:** High 11°C/Low 8°C, 10-15mm rain morning + 5mm evening.\n**Tomorrow's Buildertrend:** B03 paint vac; B04 siding/insulation cont., order ext. paint; B16 OTR delivery, Stage 2 finishing begins; B17 tag touch-up begins; JB01 still no schedule.\n**Data flags:** 3 records with conflicting DONE/DO status across queries — flagged, not counted either way; duplicate seacan record still unreconciled; stale push-reason text flagged again."}
];

async function loadAll(){
  // Daily physical-task time budget, in minutes, for Josh-owned deficiencies only.
  // Trade-owned deficiencies don't count against it — those are rounds/follow-up
  // checks on work the trades do, not tasks Josh personally has to complete.
  state.dailyAllowanceMinutes = await sget('dailyAllowanceMinutes', 180);
  state.units = await sget('units', DEFAULT_UNITS);
  state.master = await sget('master', DEFAULT_MASTER);
  state.instances = await sget('instances', null);
  state.defs = await sget('defs', []);
  state.schedule = await sget('schedule', []);
  state.todayPlan = await sget('todayPlan', null);
  state.planFeedback = await sget('planFeedback', []);
  state.lastBackup = await sget('lastBackup', null);
  state.logHistory = await sget('logHistory', null);
  state.roundHistory = await sget('roundHistory', []);
  state.checklistGroups = await sget('checklistGroups', null);
  if(state.checklistGroups === null){
    state.checklistGroups = CHECKLIST_GROUPS_SEED.slice();
    await sset('checklistGroups', state.checklistGroups);
  }
  state.groupInstances = await sget('groupInstances', null);
  if(state.groupInstances === null){
    state.groupInstances = [];
    for(const u of state.units){ if(u.active){ for(const g of state.checklistGroups){ state.groupInstances.push(makeGroupInstance(u.id,g.id)); } } }
    await sset('groupInstances', state.groupInstances);
  }
  if(state.logHistory === null){
    state.logHistory = LOG_HISTORY_SEED.slice();
    await sset('logHistory', state.logHistory);
  }
  await migrateUnitNames();
  await migrateRoundsFields();
  await migrateDefIds();
  await migrateDefPriority();
  await migrateDefCategory();
  await migrateChecklistMatchPhases();
  if(state.instances === null){
    state.instances = [];
    for(const u of state.units){ if(u.active){ for(const m of state.master){ state.instances.push(makeInstance(u.id,m.id)); } } }
    await sset('instances', state.instances);
  }
  await sset('units', state.units);
  await sset('master', state.master);
  await archivePastDayLog();
}

async function archivePastDayLog(){
  const last = await sget('lastLogSnapshotDate', null);
  const today = todayISO();
  if(last === null){
    await sset('lastLogSnapshotDate', today);
    return;
  }
  if(last < today){
    const alreadyArchived = state.logHistory.some(h=>h.date===last);
    if(!alreadyArchived){
      state.logHistory.push({date:last, content:buildDayLog(last), auto:true});
      await sset('logHistory', state.logHistory);
    }
    await sset('lastLogSnapshotDate', today);
  }
}

const NAME_MIGRATION_MAP = {
  'AB03':'Aurora B03', 'AB04':'Aurora B04', 'AB16':'Aurora B16', 'AB17':'Aurora B17', 'AB18':'Aurora B18',
  'JB01':'Juniper B01', 'JB12':'Juniper B12', 'JB20':'Juniper B20'
};
async function migrateUnitNames(){
  const done = await sget('migrated_unit_names_v2', false);
  if(done) return;
  let changed = false;
  for(const u of state.units){
    if(NAME_MIGRATION_MAP[u.name]){
      u.name = NAME_MIGRATION_MAP[u.name];
      u.btLocation = u.name;
      changed = true;
    }
  }
  if(changed) await sset('units', state.units);
  await sset('migrated_unit_names_v2', true);
}
async function migrateRoundsFields(){
  const done = await sget('migrated_rounds_v1', false);
  if(done) return;
  let changed = false;
  for(const u of state.units){
    if(u.currentPhase===undefined){ u.currentPhase=''; changed=true; }
    if(u.crntTrade===undefined){ u.crntTrade=''; changed=true; }
    if(u.ctEnd===undefined){ u.ctEnd=null; changed=true; }
    if(u.nextTrade===undefined){ u.nextTrade=''; changed=true; }
    if(u.lastWalkDate===undefined){ u.lastWalkDate=null; changed=true; }
    if(u.riskOverride===undefined){ u.riskOverride=null; changed=true; }
  }
  if(changed) await sset('units', state.units);
  await sset('migrated_rounds_v1', true);
}
async function migrateDefIds(){
  let changed = false;
  for(const d of state.defs){
    if(!d.id){ d.id = uid(); changed = true; }
  }
  if(changed) await sset('defs', state.defs);
}
const PRIORITY_ORDER = {High:0, Medium:1, Low:2};
async function migrateDefPriority(){
  let changed = false;
  for(const d of state.defs){
    if(!d.priority){ d.priority = 'Medium'; changed = true; }
  }
  if(changed) await sset('defs', state.defs);
}
const CATEGORY_ORDER = {Safety:0, Construction:1};
async function migrateDefCategory(){
  let changed = false;
  for(const d of state.defs){
    if(!d.category){ d.category = 'Construction'; changed = true; }
  }
  if(changed) await sset('defs', state.defs);
}

const CHECKLIST_MATCH_UPDATES = {
  'Pre-Cribbing': {matchPhase:'form footings', offsetDays:2},
  'Pre-Excavation': {matchPhase:'excavation', offsetDays:2},
  'Pre-Undergrounds': {matchPhase:'pour walls', offsetDays:2},
  'Pre-Backfill': {matchPhase:'backfill', offsetDays:2},
  'Pre-Framing': {matchPhase:'backfill', offsetDays:2},
  'FRAME CHECK: Pre-IPD': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Exterior': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: ALL Rooms': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Garage': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Powder Room/Bathrooms': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Kitchen': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Laundry': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Stairs': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Living Room/Bedrooms': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Mechanical Room': {matchPhase:'framing', offsetDays:2},
  'FRAME CHECK: Decks/Porches': {matchPhase:'framing', offsetDays:2},
  "FRAME CHECK: Post-Rough-In's Backframing": {matchPhase:'hvac rough in', offsetDays:2},
  'Pre-Rough-ins': {matchPhase:'framing', offsetDays:2},
  'Pre-HVAC rough-in': {matchPhase:'plumbing rough in', offsetDays:2},
  'Spray Paint': {matchPhase:'framing', offsetDays:2},
  'Pre-rough city inspections': {matchPhase:'fire stopping', offsetDays:2},
  'Pre-Insulation and Drywall': {matchPhase:'fire stopping', offsetDays:2},
  'Pre-Boarding': {matchPhase:'fire stopping', offsetDays:2},
  'Pre-Taping': {matchPhase:'boarding', offsetDays:2},
  'Pre-S1': {matchPhase:'prime', offsetDays:2},
  'Pre-OTR': {matchPhase:'floor qc', offsetDays:2},
  'Pre-Flooring': {matchPhase:'paint 1st coat', offsetDays:2},
  'Pre-S2 Carpentry': {matchPhase:'floor qc', offsetDays:2},
  'Pre-Trade Finals': {matchPhase:'floor qc', offsetDays:2},
  'Pre-Final Inspection and Appliances': {matchPhase:'plumbing final', offsetDays:2},
  'Con Walk and Pre-Occupancy': {matchPhase:'construction walk through', offsetDays:2},
  'Possession': {matchPhase:'possession', offsetDays:2, exactMatch:true},
};
async function migrateChecklistMatchPhases(){
  let changed = false;
  for(const g of state.checklistGroups){
    const upd = CHECKLIST_MATCH_UPDATES[g.name];
    if(upd){
      if(g.matchPhase !== upd.matchPhase){ g.matchPhase = upd.matchPhase; changed = true; }
      if(g.offsetDays !== upd.offsetDays){ g.offsetDays = upd.offsetDays; changed = true; }
      if(!!g.exactMatch !== !!upd.exactMatch){ g.exactMatch = !!upd.exactMatch; changed = true; }
    }
    if(g.estimatedMinutes !== 20){ g.estimatedMinutes = 20; changed = true; }
  }
  if(changed) await sset('checklistGroups', state.checklistGroups);
}

function makeGroupInstance(unitId, groupId){
  return {id:uid(), unitId, groupId, itemStatus:{}, dueOverride:null, createdDate:todayISO()};
}
function groupDueDate(unitId, group){
  if(group.dueOverrideGlobal) return group.dueOverrideGlobal;
  if(!group.matchPhase) return null;
  const u = state.units.find(x=>x.id===unitId);
  if(!u) return null;
  const phase = group.matchPhase.toLowerCase();
  const matches = state.schedule.filter(s =>
    s.location && s.location.toLowerCase().includes(u.name.toLowerCase()) &&
    s.subject && (group.exactMatch ? s.subject.trim().toLowerCase()===phase : s.subject.toLowerCase().includes(phase))
  );
  if(matches.length===0) return null;
  const finish = matches.map(m=>m.finishDate).sort()[0];
  return addDays(finish, -group.offsetDays);
}
function groupCompletion(inst, group){
  const total = group.items.length;
  const done = group.items.filter(it=>inst.itemStatus[it.id]).length;
  return {done, total};
}
function groupStatus(due, done, total){
  if(!due) return 'open';
  const today = todayISO();
  if(due<today) return (done<total) ? 'overdue' : 'done';
  if(due===today) return (done<total) ? 'today' : 'done';
  return 'open';
}

const PLAN_DEFAULT_ESTIMATE = 30;

/* Builds today's suggested plan: Josh-owned deficiencies + phase-check groups
   due today or overdue, sorted by due date then priority, greedily filled into
   the daily time budget. Trade-owned deficiencies never count against the
   budget — they're rounds follow-ups, not Josh's own task time. */
function buildSuggestedPlan(){
  const today = todayISO();
  const budget = state.dailyAllowanceMinutes || 180;

  const defCandidates = state.defs
    .filter(d=>d.status!=='Done' && d.owner==='Josh' && d.dueDate && d.dueDate<=today && isUnitActiveByLocation(d.location))
    .map(d=>({
      type:'def', due:d.dueDate, priority:d.priority||'Medium', category:d.category||'Construction',
      minutes: d.estimatedMinutes || PLAN_DEFAULT_ESTIMATE,
      ref:d
    }));

  const phaseCandidates = [];
  for(const u of state.units){
    if(!u.active) continue;
    for(const gi of state.groupInstances.filter(x=>x.unitId===u.id)){
      const g = state.checklistGroups.find(x=>x.id===gi.groupId);
      if(!g) continue;
      const due = gi.dueOverride || groupDueDate(u.id, g);
      if(!due || due>today) continue;
      const {done,total} = groupCompletion(gi, g);
      if(done>=total) continue;
      phaseCandidates.push({
        type:'phase', due, priority:'Medium', category:'Construction',
        minutes: g.estimatedMinutes || PLAN_DEFAULT_ESTIMATE,
        unit:u, group:g, groupInstance:gi
      });
    }
  }

  const all = [...defCandidates, ...phaseCandidates].sort((a,b)=>
    (a.due||'').localeCompare(b.due||'')
    || (CATEGORY_ORDER[a.category]??1)-(CATEGORY_ORDER[b.category]??1)
    || (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1)
  );

  const selected = [], deferred = [];
  let used = 0;
  for(const item of all){
    if(selected.length===0 || used+item.minutes<=budget){
      selected.push(item);
      used += item.minutes;
    } else {
      deferred.push(item);
    }
  }

  // Trade-owned deficiencies due today: never budgeted or ranked against Josh's
  // own time, but still worth surfacing so today's rounds/follow-ups are visible.
  const tradeToday = state.defs.filter(d=>d.status!=='Done' && d.owner==='Trade' && d.dueDate===today && isUnitActiveByLocation(d.location));

  return {selected, deferred, tradeToday, used, budget};
}

/* ---------- AI-generated daily plan (todayPlan / planFeedback) ----------
   The actual Claude API call runs OUTSIDE this app (a standalone scheduled
   script, since this is a static public site with no backend to safely hold
   an API key). That script writes {date, generatedAt, suggested, final}
   into the todayPlan key. Task ids in that plan are prefixed d_/c_ so this
   app can resolve them back to live records without trusting anything the
   agent echoed back about the task itself (name, due date, etc. always come
   fresh from state, not from the plan). */

/* Resolves a plan task id back to its current live record. Returns null if
   the underlying deficiency/checklist item no longer exists (deleted, or the
   unit was removed) so the UI can drop it gracefully instead of erroring. */
function resolvePlanTask(id){
  if(id.startsWith('d_')){
    const d = state.defs.find(x=>x.id===id.slice(2));
    if(!d) return null;
    return {id, kind:'def', name:d.description, site:d.location, due:d.dueDate, minutes:d.estimatedMinutes||PLAN_DEFAULT_ESTIMATE, ref:d};
  }
  if(id.startsWith('c_')){
    const gi = state.groupInstances.find(x=>x.id===id.slice(2));
    if(!gi) return null;
    const g = state.checklistGroups.find(x=>x.id===gi.groupId);
    const u = state.units.find(x=>x.id===gi.unitId);
    if(!g || !u) return null;
    const due = gi.dueOverride || groupDueDate(u.id, g);
    return {id, kind:'check', name:g.name, site:u.name, due, minutes:g.estimatedMinutes||PLAN_DEFAULT_ESTIMATE, ref:gi, unit:u, group:g};
  }
  return null;
}

/* Open tasks not already present in the plan being edited, for the "+ Add
   Task" picker. Mirrors buildSuggestedPlan's candidate logic (active units,
   not-Done defs, not-fully-done checklist groups) minus the owner/budget
   filtering, since here Josh is choosing by hand. */
function openPlanCandidates(excludeIds){
  const excl = new Set(excludeIds);
  const defTasks = state.defs
    .filter(d=>d.status!=='Done' && isUnitActiveByLocation(d.location) && !excl.has('d_'+d.id))
    .map(d=>({id:'d_'+d.id, name:d.description, site:d.location, due:d.dueDate}));

  const checkTasks = [];
  for(const u of state.units){
    if(!u.active) continue;
    for(const gi of state.groupInstances.filter(x=>x.unitId===u.id)){
      if(excl.has('c_'+gi.id)) continue;
      const g = state.checklistGroups.find(x=>x.id===gi.groupId);
      if(!g) continue;
      const {done,total} = groupCompletion(gi, g);
      if(done>=total) continue;
      const due = gi.dueOverride || groupDueDate(u.id, g);
      checkTasks.push({id:'c_'+gi.id, name:g.name, site:u.name, due});
    }
  }
  return [...defTasks, ...checkTasks].sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
}

/* Finalizes (or re-finalizes) today's plan: saves the edited schedule/deferred
   as todayPlan.final, and logs one plan_feedback row per scheduled task per
   the agreed shape (suggested vs. final position, side by side). Re-saving
   the same day replaces that day's feedback rows instead of piling up
   duplicates, since Josh can revise a plan more than once before it's done. */
async function finalizePlan(finalSchedule, finalDeferred){
  const today = todayISO();
  const suggested = (state.todayPlan && state.todayPlan.suggested) || {schedule:[], deferred:[]};
  const suggestedPos = {};
  suggested.schedule.forEach((t,i)=>{ suggestedPos[t.id] = i+1; });
  const deferredIds = new Set(suggested.deferred.map(t=>t.id));
  const finalScheduleIds = new Set(finalSchedule.map(t=>t.id));
  const now = new Date().toISOString();

  const rows = [];
  finalSchedule.forEach((t,i)=>{
    const pos = i+1;
    const wasSuggested = suggestedPos[t.id] != null;
    const wasDeferred = deferredIds.has(t.id);
    let action;
    if(wasDeferred) action = 'deferred_override';
    else if(!wasSuggested) action = 'added_manually';
    else if(suggestedPos[t.id] === pos) action = 'approved_unchanged';
    else action = 'reordered';
    rows.push({
      id: uid(), date: today, taskId: t.id,
      suggestedPosition: suggestedPos[t.id] ?? null,
      suggestedStartEstimate: t.start_estimate ?? null,
      action, finalPosition: pos, finalStartEstimate: t.start_estimate ?? null,
      notes: '', timestamp: now
    });
  });
  suggested.schedule.forEach(t=>{
    if(!finalScheduleIds.has(t.id)){
      rows.push({
        id: uid(), date: today, taskId: t.id,
        suggestedPosition: suggestedPos[t.id] ?? null, suggestedStartEstimate: t.start_estimate ?? null,
        action: 'removed', finalPosition: null, finalStartEstimate: null,
        notes: '', timestamp: now
      });
    }
  });

  state.planFeedback = state.planFeedback.filter(r=>r.date!==today).concat(rows);
  state.todayPlan = {...state.todayPlan, date: today, final: {schedule: finalSchedule, deferred: finalDeferred}, finalizedAt: now};
  await sset('planFeedback', state.planFeedback);
  await sset('todayPlan', state.todayPlan);
}

/* % of feedback rows (last 30 days) where Josh approved the AI's suggested
   position unchanged - the single number that says whether the agent is
   getting more or less useful over time. Excludes manually-added tasks
   (no suggestedPosition) since the agent never ranked those to begin with. */
function approveRate30d(){
  const since = addDays(todayISO(), -30);
  const rows = state.planFeedback.filter(r=>r.date>=since && r.suggestedPosition!=null);
  if(rows.length===0) return null;
  const approved = rows.filter(r=>r.action==='approved_unchanged').length;
  return Math.round((approved/rows.length)*100);
}

function makeInstance(unitId, masterId){
  return {id:uid(), unitId, masterId, status:'Open', pushCount:0, pushReason:'', completedDate:null, dueOverride:null, createdDate:todayISO()};
}

/* find best matching schedule finish date for a unit + master check item */
function computeDueDate(unitId, masterItem){
  if(!masterItem.matchPhase) return null;
  const u = state.units.find(x=>x.id===unitId);
  if(!u) return null;
  const matches = state.schedule.filter(s =>
    s.location && s.location.toLowerCase().includes(u.name.toLowerCase()) &&
    s.subject && s.subject.toLowerCase().includes(masterItem.matchPhase.toLowerCase())
  );
  if(matches.length===0) return null;
  // use the earliest finish date among matches
  const finish = matches.map(m=>m.finishDate).sort()[0];
  return addDays(finish, -masterItem.offsetDays);
}

function instanceInfo(inst){
  const m = state.master.find(x=>x.id===inst.masterId);
  const u = state.units.find(x=>x.id===inst.unitId);
  const due = inst.dueOverride || (m ? computeDueDate(inst.unitId, m) : null);
  return {m,u,due};
}

/* Deficiencies are matched to units by name (d.location), not unitId, so a
   missing unit (name typo, or never added) is treated as active — don't
   let a lookup miss silently hide someone's open item. */
function isUnitActiveByLocation(location){
  const u = state.units.find(x=>x.name===location);
  return !u || u.active!==false;
}

async function setUnitActive(unitId, active){
  const u = state.units.find(x=>x.id===unitId);
  if(!u) return;
  u.active = active;
  await sset('units', state.units);
}

function dueStatus(due, status){
  if(status==='Done') return 'done';
  if(!due) return 'open';
  if(due < todayISO()) return 'overdue';
  if(due === todayISO()) return 'today';
  return 'open';
}

/* ---------- fan-out when adding master item ---------- */
async function addMasterItem(item){
  state.master.push(item);
  for(const u of state.units){ if(u.active){ state.instances.push(makeInstance(u.id, item.id)); } }
  await sset('master', state.master);
  await sset('instances', state.instances);
}

async function addUnit(unit){
  state.units.push(unit);
  for(const m of state.master){ state.instances.push(makeInstance(unit.id, m.id)); }
  for(const g of state.checklistGroups){ state.groupInstances.push(makeGroupInstance(unit.id, g.id)); }
  await sset('units', state.units);
  await sset('instances', state.instances);
  await sset('groupInstances', state.groupInstances);
}

