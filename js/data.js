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

/* Current Phase options for Log Round come from the actual synced schedule
   data (state.schedule[].subject) instead of a separate hardcoded list, so
   they can't drift out of sync with what Buildertrend/Outlook actually says.
   extraValue keeps a unit's already-set phase in the list even if it no
   longer appears in the schedule, so it doesn't silently disappear. */
function scheduleSubjectOptions(extraValue){
  const set = new Set();
  for(const s of state.schedule){ if(s.subject) set.add(s.subject.trim()); }
  if(extraValue) set.add(extraValue.trim());
  return [...set].filter(Boolean).sort((a,b)=>a.localeCompare(b));
}

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

// Rebuilt per Josh's "By Phase" spreadsheet: one flat QC list per broad
// construction phase (not one per schedule item like the retired 145-group
// library). matchPhase links a group to the exact schedule item name Josh
// picks as a unit's Current Phase in round logging - only set once he's told
// us which schedule item a given list belongs to; groups without one yet
// still import and stay fully checkable, they just don't surface under
// "Current Phase Checklist" or in the Brief until they're mapped.
const PHASE_CHECKLIST_SEED = [
  {id:'pcg_pre_excavation_qc', name:'PRE-EXCAVATION QC', matchPhase:'Stake', exactMatch:true, items:[
    {id:uid(), text:'dirt dumping zone', subgroup:'QC'},
    {id:uid(), text:'hydrovac utilities', subgroup:'QC'},
    {id:uid(), text:'stake out booked', subgroup:'QC'},
    {id:uid(), text:'cut sheet from cribber', subgroup:'QC'},
    {id:uid(), text:'plans knowledge: grades of buildings and exteriors', subgroup:'QC'},
    {id:uid(), text:'plans knowledge: tar/weeping tile locations', subgroup:'QC'},
    {id:uid(), text:'plans knowledge: locations of exterior utilities on building', subgroup:'QC'},
    {id:uid(), text:'plans knowledge: "how it\'s built before it\'s built"', subgroup:'QC'},
  ]},
  {id:'pcg_excavation_qc', name:'EXCAVATION QC', matchPhase:'Excavation', exactMatch:true, items:[
    {id:uid(), text:'excavation cut as per plan', subgroup:'QC'},
    {id:uid(), text:'over-excavated for worker safety', subgroup:'QC'},
    {id:uid(), text:'utilities undamaged', subgroup:'QC'},
    {id:uid(), text:'dirt tracking cleaned from roads and curbs', subgroup:'QC'},
    {id:uid(), text:'curbs undamaged', subgroup:'QC'},
    {id:uid(), text:'sewer trench cut with adequate slope', subgroup:'QC'},
    {id:uid(), text:'electricy/gas utilities excavated to building', subgroup:'QC'},
    {id:uid(), text:'gas stub uncovered minimum 24"', subgroup:'QC'},
  ]},
  {id:'pcg_sewer_trench_qc', name:'SEWER TRENCH QC', matchPhase:'Install Sewer Trench', exactMatch:true, items:[
    {id:uid(), text:'site signage installed for inspection', subgroup:'QC'},
    {id:uid(), text:'no excess plumbing fittings as per code', subgroup:'QC'},
    {id:uid(), text:'sanitary/storm lines are correct 4" sizing', subgroup:'QC'},
    {id:uid(), text:'lines are stubbed into foundation according to SOG or BSMT', subgroup:'QC'},
    {id:uid(), text:'clean outs installed as per code', subgroup:'QC'},
    {id:uid(), text:'excavators backfilled flushto BOF', subgroup:'QC'},
    {id:uid(), text:'all material and dirt tracking cleaned', subgroup:'QC'},
    {id:uid(), text:'ATCO: book gas riser inspection as per cribbing schedule', subgroup:'QC'},
    {id:uid(), text:'tarps on site for cold weather concrete pours', subgroup:'QC'},
    {id:uid(), text:'water line stubbed out 8-10\' above grade', subgroup:'QC'},
  ]},
  {id:'pcg_foundations_qc', name:'FOUNDATIONS QC', matchPhase:'Strip Walls', exactMatch:true, items:[
    {id:uid(), text:'MARK GRADES: address/utilities/grades', subgroup:'QC'},
    {id:uid(), text:'groundworks gravel on site', subgroup:'QC'},
    {id:uid(), text:'utilities installed in correct locations', subgroup:'QC'},
    {id:uid(), text:'panel backer installed where applicable for utilities', subgroup:'QC'},
    {id:uid(), text:'plumbing knock outs in concrete installed as per plan', subgroup:'QC'},
  ]},
  {id:'pcg_undergrounds_qc', name:'UNDERGROUNDS QC', matchPhase:'Mark Grades', exactMatch:true, items:[
    {id:uid(), text:'electric and data lines installed as per plan', subgroup:'QC'},
    {id:uid(), text:'tar/weeping tile/gravel complete as necessary', subgroup:'QC'},
    {id:uid(), text:'utilities strapped to prevent movement during backfill', subgroup:'QC'},
  ]},
  {id:'pcg_backfill_qc', name:'BACKFILL QC', matchPhase:'Backfill', exactMatch:true, items:[
    {id:uid(), text:'send SI\'s/selections/CO\'s/IFC\'s as applicable', subgroup:'QC'},
    {id:uid(), text:'garaged sloped adequately', subgroup:'QC'},
    {id:uid(), text:'backfill accounting for slabs prep', subgroup:'QC'},
    {id:uid(), text:'exterior backfill to subgrade', subgroup:'QC'},
    {id:uid(), text:'winter heat for groundworks/slabs', subgroup:'QC'},
  ]},
  {id:'pcg_plumbing_groundworks_qc', name:'PLUMBING GROUNDWORKS QC', matchPhase:'Groundworks', exactMatch:true, items:[
    {id:uid(), text:'plumbing groundworks installed as per code', subgroup:'QC'},
    {id:uid(), text:'clean outs installed as per code', subgroup:'QC'},
    {id:uid(), text:'drains installed as per planned location and wall assembly', subgroup:'QC'},
    {id:uid(), text:'plumbing groundworks properly supported from sinking and lateral movement', subgroup:'QC'},
  ]},
  {id:'pcg_concrete_slabs_qc', name:'CONCRETE SLABS QC', matchPhase:'Pour Garage Slab', exactMatch:true, items:[
    {id:uid(), text:'slabs prepped and poured as per grades', subgroup:'QC'},
    {id:uid(), text:'garage 2% slope maintained', subgroup:'QC'},
    {id:uid(), text:'mechanical room height correct to grade', subgroup:'QC'},
    {id:uid(), text:'construction gas meter ordered and installed', subgroup:'QC'},
  ]},
  {id:'pcg_framing_qc', name:'FRAMING QC', matchPhase:'Frame Check', exactMatch:true, items:[
    {id:uid(), text:'architectural layout and dimensions as per plan', subgroup:'QC'},
    {id:uid(), text:'structural layout and dimensions as per plan', subgroup:'QC'},
    {id:uid(), text:'walls/ceilings straight/plumb', subgroup:'QC'},
    {id:uid(), text:'exterior door and window RO\'s square and operational', subgroup:'QC'},
    {id:uid(), text:'floors have no deflection or squeaks', subgroup:'QC'},
    {id:uid(), text:'partition walls built as per architectural and code requirements', subgroup:'QC'},
    {id:uid(), text:'insulation stops installed and secured', subgroup:'QC'},
    {id:uid(), text:'backing allows insulation/poly/drywall installation', subgroup:'QC'},
    {id:uid(), text:'interior door RO\'s to plan and accommodate casing', subgroup:'QC'},
    {id:uid(), text:'framing in for handrail/cabinet/appliance spacing', subgroup:'QC'},
    {id:uid(), text:'framed backing in for mechanical trades', subgroup:'QC'},
    {id:uid(), text:'bathrooms fit tubs/showers as per wall assembly', subgroup:'QC'},
    {id:uid(), text:'backing in for bathroom fixtures', subgroup:'QC'},
    {id:uid(), text:'joist layout in for plumbing drains', subgroup:'QC'},
    {id:uid(), text:'framing plumb/straight for tile locations', subgroup:'QC'},
    {id:uid(), text:'stairs correct for finished layout', subgroup:'QC'},
    {id:uid(), text:'stair headroom to code', subgroup:'QC'},
    {id:uid(), text:'stair handrail/underside backing', subgroup:'QC'},
    {id:uid(), text:'exterior plumb and aligned and backing in for all siding', subgroup:'QC'},
    {id:uid(), text:'fascia/soffit correct for roofing overhangs', subgroup:'QC'},
    {id:uid(), text:'roof access cut out', subgroup:'QC'},
    {id:uid(), text:'exterior partition firestopping installed', subgroup:'QC'},
    {id:uid(), text:'garage RO correct', subgroup:'QC'},
    {id:uid(), text:'garage ceiling and wall backing', subgroup:'QC'},
    {id:uid(), text:'garage structural components as per plan', subgroup:'QC'},
    {id:uid(), text:'deck structural components as per plan', subgroup:'QC'},
    {id:uid(), text:'BELLA: basement stair blocking for foam insulation', subgroup:'QC'},
    {id:uid(), text:'HERITAGE: laundry room fits machines', subgroup:'QC'},
    {id:uid(), text:'HERITAGE: end unit plumbing walls in for HVAC runs at exterior jogs', subgroup:'QC'},
    {id:uid(), text:'HERITAGE: kitchen wall inset for fridge', subgroup:'QC'},
  ]},
  {id:'pcg_rough_in_prep_qc', name:'ROUGH-IN PREP QC', matchPhase:'Load Roof', exactMatch:true, items:[
    {id:uid(), text:'All frame check lists complete', subgroup:'QC'},
    {id:uid(), text:'mud/snow control mats placed for accessibility', subgroup:'QC'},
    {id:uid(), text:'framing cleaned and swept', subgroup:'QC'},
    {id:uid(), text:'all rough-in mark outs completed', subgroup:'QC'},
    {id:uid(), text:'customer selections and flooring cuts finalized and posted in units', subgroup:'QC'},
    {id:uid(), text:'roofing completed', subgroup:'QC'},
    {id:uid(), text:'driveways prepped/poured', subgroup:'QC'},
    {id:uid(), text:'lay down area for drywall garbage and siding material', subgroup:'QC'},
    {id:uid(), text:'roofing material cleaned', subgroup:'QC'},
    {id:uid(), text:'roofing overhangs according to siding specs', subgroup:'QC'},
    {id:uid(), text:'construction heat on site and installed', subgroup:'QC'},
    {id:uid(), text:'construction door knobs installed', subgroup:'QC'},
    {id:uid(), text:'exterior clean and free of trip-hazards for following trades', subgroup:'QC'},
  ]},
  {id:'pcg_rough_in_qc', name:'ROUGH-IN QC', matchPhase:'Firestopping', exactMatch:true, items:[
    {id:uid(), text:'all rough-in\'s complete and photos', subgroup:'QC'},
    {id:uid(), text:'mechanical locations match plans (sinks/tubs/showers/appliances/mechanical room)', subgroup:'QC'},
    {id:uid(), text:'rough-in\'s do not conflict with each other', subgroup:'QC'},
    {id:uid(), text:'no framing damage', subgroup:'QC'},
    {id:uid(), text:'required blocking remains functional', subgroup:'QC'},
    {id:uid(), text:'mechanical clearances maintained', subgroup:'QC'},
    {id:uid(), text:'kitchen OTR to match mark out', subgroup:'QC'},
    {id:uid(), text:'roug-in\'s do not impede drywall, or can be covered by bulkheads', subgroup:'QC'},
    {id:uid(), text:'light switches correct height to stair handrails', subgroup:'QC'},
    {id:uid(), text:'light locations coordinate with bulkhead locations', subgroup:'QC'},
    {id:uid(), text:'penetrations properly fire stopped', subgroup:'QC'},
    {id:uid(), text:'all units cleaned and swept', subgroup:'QC'},
    {id:uid(), text:'gas meters ordered after inspections', subgroup:'QC'},
    {id:uid(), text:'gas exterior stubs address labels', subgroup:'QC'},
    {id:uid(), text:'rough-in components undamaged and protected', subgroup:'QC'},
    {id:uid(), text:'rough-ins coordinate with future finishes (ie. OTR/hoodfan)', subgroup:'QC'},
  ]},
  {id:'pcg_exterior_roof_qc', name:'EXTERIOR/ROOF QC', matchPhase:'Boarding', exactMatch:true, items:[
    {id:uid(), text:'full siding pieces used in visible locations', subgroup:'QC'},
    {id:uid(), text:'tyvek and flashing layered according to design', subgroup:'QC'},
    {id:uid(), text:'siding ready for paint/eavestrough/handrails', subgroup:'QC'},
    {id:uid(), text:'garage doors/weatherstripping installed as per spec', subgroup:'QC'},
    {id:uid(), text:'handrails installed as per spec/code', subgroup:'QC'},
    {id:uid(), text:'all trade materials cleaned and removed', subgroup:'QC'},
    {id:uid(), text:'siding installed as per architectural patterns/colors', subgroup:'QC'},
  ]},
  {id:'pcg_insulation_qc', name:'INSULATION QC', matchPhase:'Insulation', exactMatch:true, items:[
    {id:uid(), text:'insulation batts/foam/blown-in installed as per assemblies', subgroup:'QC'},
    {id:uid(), text:'exterior openings spray foamed and sealed', subgroup:'QC'},
    {id:uid(), text:'framing and mechanical are not damaged', subgroup:'QC'},
    {id:uid(), text:'tubs/showers are not damaged', subgroup:'QC'},
    {id:uid(), text:'continuous air/vapour barrier throughout', subgroup:'QC'},
    {id:uid(), text:'insulation is dry and clean', subgroup:'QC'},
  ]},
  {id:'pcg_drywall_qc', name:'DRYWALL QC', matchPhase:'Taping', exactMatch:true, items:[
    {id:uid(), text:'garages boarded to accommodate garage door installation', subgroup:'QC'},
    {id:uid(), text:'mechanical penetration holes cut tight', subgroup:'QC'},
    {id:uid(), text:'drywall installed as per assemblies', subgroup:'QC'},
    {id:uid(), text:'bulkheads framed/boarded and are straight', subgroup:'QC'},
    {id:uid(), text:'drywall does not conflict with flooring/cabinets/tile', subgroup:'QC'},
    {id:uid(), text:'drywall vacuum includes window/door sills and tubs', subgroup:'QC'},
    {id:uid(), text:'locations for cabinets and mirrors are not bowed', subgroup:'QC'},
  ]},
  {id:'pcg_finishing_ph1_qc', name:'FINISHING PH1 QC', matchPhase:'Paint Vac', exactMatch:true, items:[
    {id:uid(), text:'primer on all surfaces and inside corners cut', subgroup:'QC'},
    {id:uid(), text:'S1 carpentry correct as per selections and flooring', subgroup:'QC'},
    {id:uid(), text:'S1 carpentry straight and secure', subgroup:'QC'},
    {id:uid(), text:'interior doors operate', subgroup:'QC'},
    {id:uid(), text:'cabinets level and plumb', subgroup:'QC'},
    {id:uid(), text:'cabinets accommodate tile backsplash and appliance dimensions', subgroup:'QC'},
    {id:uid(), text:'DW touch ups complete and fix any previous trade damage', subgroup:'QC'},
    {id:uid(), text:'change furnace filter', subgroup:'QC'},
    {id:uid(), text:'cabinet DAP is clean', subgroup:'QC'},
    {id:uid(), text:'cabinet cutouts in for mechanical', subgroup:'QC'},
  ]},
  {id:'pcg_finishing_ph2_qc', name:'FINISHING PH2 QC', matchPhase:'Tile', exactMatch:true, items:[
    {id:uid(), text:'change furnace filter', subgroup:'QC'},
    {id:uid(), text:'tubs clean for tile workers', subgroup:'QC'},
    {id:uid(), text:'paint coverage on all surfaces', subgroup:'QC'},
    {id:uid(), text:'correct countertops installed as per selections', subgroup:'QC'},
    {id:uid(), text:'countertop openings are correct for sinks and appliances', subgroup:'QC'},
    {id:uid(), text:'flush-mount kitchen/bath sinks installed as per selections', subgroup:'QC'},
    {id:uid(), text:'countertop seams/edges flush and tight', subgroup:'QC'},
    {id:uid(), text:'countertop cutouts in for mechanical', subgroup:'QC'},
  ]},
  {id:'pcg_finishing_ph3_qc', name:'FINISHING PH3 QC', matchPhase:'Floor QC', exactMatch:true, items:[
    {id:uid(), text:'tile complete for OTR install and shower glass measuring', subgroup:'QC'},
    {id:uid(), text:'HVAC floor holes cut out', subgroup:'QC'},
    {id:uid(), text:'correct OTR installed as per selections', subgroup:'QC'},
    {id:uid(), text:'LVP installed to be covered by baseboard and cabinet toe kicks', subgroup:'QC'},
    {id:uid(), text:'LVP joints tight and not cracking', subgroup:'QC'},
    {id:uid(), text:'LVP undamaged', subgroup:'QC'},
    {id:uid(), text:'flooring transitions smoothly and tight to baseboard/casing', subgroup:'QC'},
    {id:uid(), text:'carpet free of gaps and loose threads', subgroup:'QC'},
    {id:uid(), text:'mirrors/wire shelves/shower glass have been measured', subgroup:'QC'},
  ]},
  {id:'pcg_finishing_ph4_qc', name:'FINISHING PH4 QC', matchPhase:'Deliver Light Fixtures', exactMatch:true, items:[
    {id:uid(), text:'change furnace filter', subgroup:'QC'},
    {id:uid(), text:'S2 hardward installed and operational', subgroup:'QC'},
    {id:uid(), text:'house numbers installed; correct digits', subgroup:'QC'},
    {id:uid(), text:'mirrors tight to walls and level', subgroup:'QC'},
    {id:uid(), text:'wire shelving correct layout and all level', subgroup:'QC'},
    {id:uid(), text:'shower glass tight to fixtures', subgroup:'QC'},
    {id:uid(), text:'shower glass siliconed and waterproof', subgroup:'QC'},
    {id:uid(), text:'sliding shower doors do not rub each other', subgroup:'QC'},
    {id:uid(), text:'all installs are undamaged', subgroup:'QC'},
    {id:uid(), text:'installed hardware doesn’t impede mechanical', subgroup:'QC'},
  ]},
  {id:'pcg_finishing_finals_qc', name:'FINISHING FINALS QC', matchPhase:'Appliance Install', exactMatch:true, items:[
    {id:uid(), text:'plumbing fixtures as per selections', subgroup:'QC'},
    {id:uid(), text:'plumbing fixtures siliconed/DAP/escutcheons as per plan', subgroup:'QC'},
    {id:uid(), text:'plumbing leak-free', subgroup:'QC'},
    {id:uid(), text:'HVAC AC install as per selections', subgroup:'QC'},
    {id:uid(), text:'HVAC grills tight to floors and walls', subgroup:'QC'},
    {id:uid(), text:'HVAC furnace and HRV controllers tight to walls and operational', subgroup:'QC'},
    {id:uid(), text:'lights correct color as per  selections', subgroup:'QC'},
    {id:uid(), text:'lights centered on sinks/cabinets', subgroup:'QC'},
    {id:uid(), text:'lights tight to ceiling', subgroup:'QC'},
    {id:uid(), text:'switches/outlets tight to walls', subgroup:'QC'},
    {id:uid(), text:'all mechancial devices level/tight/flush', subgroup:'QC'},
    {id:uid(), text:'appliances installed and operational', subgroup:'QC'},
    {id:uid(), text:'appliances level', subgroup:'QC'},
    {id:uid(), text:'mechanical connections to appliances visually good', subgroup:'QC'},
    {id:uid(), text:'DW touch ups ready for final paint', subgroup:'QC'},
    {id:uid(), text:'window screens', subgroup:'QC'},
    {id:uid(), text:'self-closing doors', subgroup:'QC'},
    {id:uid(), text:'WOCD locks', subgroup:'QC'},
    {id:uid(), text:'door hinge screws color-match', subgroup:'QC'},
    {id:uid(), text:'all mechanical fixtures undamaged', subgroup:'QC'},
  ]},
  {id:'pcg_construction_qc', name:'CONSTRUCTION QC', matchPhase:'Construction Walkthrough', exactMatch:true, items:[
    {id:uid(), text:'homeowner eyes crooked/straight/clean', subgroup:'QC'},
    {id:uid(), text:'missing/incomplete fixtures', subgroup:'QC'},
    {id:uid(), text:'all fixtures operate interior and exterior', subgroup:'QC'},
    {id:uid(), text:'wall/ceiling/floor/window damage', subgroup:'QC'},
    {id:uid(), text:'all fixtures/hardware coordination has no conflicts', subgroup:'QC'},
    {id:uid(), text:'homeowner eyes transitions', subgroup:'QC'},
    {id:uid(), text:'exterior is accessible', subgroup:'QC'},
  ]},
  {id:'pcg_tasks_con_qc', name:'CONSTRUCTION QC TASKS', matchPhase:'Construction Clean', exactMatch:true, items:[
    {id:uid(), text:'appliance clocks', subgroup:'QC'},
    {id:uid(), text:'mechanical rooms spotless', subgroup:'QC'},
    {id:uid(), text:'pressure wash garage/porches/decks/driveways', subgroup:'QC'},
    {id:uid(), text:'remove door sill/latch films', subgroup:'QC'},
    {id:uid(), text:'remove smoke detector shower caps', subgroup:'QC'},
    {id:uid(), text:'organize cabinets', subgroup:'QC'},
    {id:uid(), text:'bipass door bumpers', subgroup:'QC'},
    {id:uid(), text:'change furnace filter', subgroup:'QC'},
    {id:uid(), text:'garage door remotes to kitchen', subgroup:'QC'},
    {id:uid(), text:'BELLA/MONARCH: powder room mirror install', subgroup:'QC'},
    {id:uid(), text:'paint tag for TU\'s', subgroup:'QC'},
  ]},
  {id:'pcg_possession_closeout', name:'POSSESSION TASKS', matchPhase:'Pre-Occ Walkthrough', exactMatch:true, items:[
    {id:uid(), text:'HWT turned ON', subgroup:'QC'},
    {id:uid(), text:'Humidifier plugged in and ON', subgroup:'QC'},
    {id:uid(), text:'Appliance clocks', subgroup:'QC'},
    {id:uid(), text:'Doors rekey', subgroup:'QC'},
    {id:uid(), text:'Check all sinks appliances WATER ON', subgroup:'QC'},
  ]},
];

// offsetDays: days BEFORE the matched schedule finish date the item is due.
// matchPhase: text used to match against synced schedule event subjects (case-insensitive substring).
const DEFAULT_MASTER = [
  {id:uid(), name:'Backing / Blocking Verification', milestone:'Framing', area:'All Rooms', offsetDays:5, matchPhase:'framing', notes:'Grab bars, floating vanities, wall-hung TV, heavy shelving — verify backing present before cover-up.'},
  {id:uid(), name:'Pre-Drywall Backing Re-Check', milestone:'Drywall', area:'All Rooms', offsetDays:2, matchPhase:'board', notes:'Last chance to confirm backing before it is covered.'},
];

/* ---------- state ---------- */
let state = { units:[], master:[], instances:[], defs:[], schedule:[], checklistGroups:[], groupInstances:[], planOrder:[], safetyWalkthroughs:[] };
let activeTab = 'brief';
let selectedScheduleUnit = null;
let selectedLogDate = null;
let expandedGroupIds = new Set();
let expandedPhaseOverflow = new Set();
let expandedUnitDefs = new Set();
let selectedRoundHistoryId = {};
let defsFilterTab = 'dated';
let checklistsFilterTab = 'due';
let logSearchQuery = null;
let safetyWalkthroughOpen = false;
let defSearchQuery = '';
let defMissingEstimateOnly = false;
let defOwnerFilter = 'all';
let unitSearchQuery = '';
let inactiveUnitsExpanded = false;

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
  // Trade-owned deficiencies and phase checks don't count against it — those
  // aren't blocks of Josh's personal time the way his own deficiencies are.
  state.dailyAllowanceMinutes = await sget('dailyAllowanceMinutes', 480);
  state.units = await sget('units', DEFAULT_UNITS);
  state.master = await sget('master', DEFAULT_MASTER);
  state.instances = await sget('instances', null);
  state.defs = await sget('defs', []);
  state.schedule = await sget('schedule', []);
  state.planOrder = await sget('planOrder', []);
  state.safetyWalkthroughs = await sget('safetyWalkthroughs', []);
  state.lastBackup = await sget('lastBackup', null);
  state.logHistory = await sget('logHistory', null);
  state.roundHistory = await sget('roundHistory', []);
  state.checklistGroups = await sget('checklistGroups', null);
  if(state.checklistGroups === null){
    state.checklistGroups = PHASE_CHECKLIST_SEED.slice();
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
  await migrateDefTaskFields_v1();
  await migrateChecklistMatchPhases();
  await migrateSafetyWalkthroughShape();
  await migratePhaseChecklistRewrite_v1();
  await migratePossessionExactMatch_v1();
  await migrateClearPhaseChecklists_v1();
  await migratePhaseChecklistByPhaseSeed_v1();
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

/* ---------- unified task model (Phase 1 — deficiencies only) ----------
   Foundation fields shared with any future "what/where/owner/verifier/
   due/follow-up/estimate/priority/status/timestamps/notes" task shape.
   Everything except verifier/followUpDate/startedAt/notes already existed
   on a deficiency under a different name (what=description, where=location,
   owner=owner, due_date=dueDate, estimated_duration=estimatedMinutes,
   created_at/completed_at=createdDate/completedDate) — those are left alone.
   Phase checklist groups/items are intentionally NOT touched: they stay
   their own thing, surfaced by currentPhaseChecklistGroup()/
   buildSuggestedPlan() off round-logging (currentPhase/lastWalkDate), not
   by anything in this migration. */
async function migrateDefTaskFields_v1(){
  const done = await sget('migrated_def_task_fields_v1', false);
  if(done) return;
  for(const d of state.defs){
    if(d.verifier === undefined) d.verifier = null;
    if(d.followUpDate === undefined) d.followUpDate = null;
    if(d.startedAt === undefined) d.startedAt = null;
    if(d.notes === undefined){
      // One-time enrichment: carry the existing single-string pushReason
      // into the new append-only notes log as its first historical entry,
      // without touching pushReason itself (the push/backlog UI still
      // reads/writes that field exactly as before).
      d.notes = d.pushReason
        ? [{ts: d.createdDate || null, text: d.pushReason, source: 'migrated_from_pushReason'}]
        : [];
    }
  }
  await sset('defs', state.defs);
  await sset('migrated_def_task_fields_v1', true);
}

/* Computed, not stored — so editing owner/status through the existing
   modal (openEditDefModal, markDefDoneWithTimeCheck) can never desync a
   cached value. Mirrors the read-only-derived pattern already used by
   dueStatus()/computeRisk()/groupStatus(). MY_ACTION/DELEGATED assumes an
   open item's owner is Josh or Trade (true of every open deficiency in
   current data); Unassigned+open falls back to DELEGATED since nothing in
   the 5-value spec models "nobody assigned yet". */
function unifiedTaskStatus(d){
  if(d.status === 'Done') return 'DONE';
  if(d.status === 'WAIT') return 'WAITING';
  if(d.owner === 'Josh') return 'MY_ACTION';
  return 'DELEGATED';
}

async function setDefVerifier(defId, verifier){
  const d = state.defs.find(x=>x.id===defId);
  if(!d) return;
  d.verifier = verifier || null;
  await sset('defs', state.defs);
}
async function setDefFollowUpDate(defId, date){
  const d = state.defs.find(x=>x.id===defId);
  if(!d) return;
  d.followUpDate = date || null;
  await sset('defs', state.defs);
}
async function markDefStarted(defId){
  const d = state.defs.find(x=>x.id===defId);
  if(!d || d.startedAt) return;
  d.startedAt = new Date().toISOString();
  await sset('defs', state.defs);
}
async function addDefNote(defId, text){
  const d = state.defs.find(x=>x.id===defId);
  if(!d || !text || !text.trim()) return;
  d.notes = d.notes || [];
  d.notes.push({ts: new Date().toISOString(), text: text.trim()});
  await sset('defs', state.defs);
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

/* Backfills itemStatus/itemPhotos/itemNotes on any walkthrough record
   created before the safety checklist rework (e.g. a bare "Start Today's
   Walkthrough" tap with no old-shaped hazards ever added), so it doesn't
   break under the new per-item structure. */
async function migrateSafetyWalkthroughShape(){
  let changed = false;
  for(const w of state.safetyWalkthroughs){
    if(!w.itemStatus){ w.itemStatus = {}; changed = true; }
    if(!w.itemPhotos){ w.itemPhotos = {}; changed = true; }
    if(!w.itemNotes){ w.itemNotes = {}; changed = true; }
  }
  if(changed) await sset('safetyWalkthroughs', state.safetyWalkthroughs);
}

/* One-time swap of the whole phase-checklist library: the old ~30 generic
   groups are replaced with the new schedule-item-linked set (145 groups,
   one per numbered schedule item, each with Blocker/QC sub-lists). Old
   group instances are dropped entirely rather than migrated — their item
   ids don't correspond to anything in the new lists, so there's nothing
   meaningful to carry forward. Runs once, gated by the flag below. */
async function migratePhaseChecklistRewrite_v1(){
  const done = await sget('migrated_phase_checklist_v1', false);
  if(done) return;
  state.checklistGroups = PHASE_CHECKLIST_SEED.slice();
  state.groupInstances = [];
  for(const u of state.units){
    if(u.active){
      for(const g of state.checklistGroups){ state.groupInstances.push(makeGroupInstance(u.id, g.id)); }
    }
  }
  await sset('checklistGroups', state.checklistGroups);
  await sset('groupInstances', state.groupInstances);
  await sset('migrated_phase_checklist_v1', true);
}

/* "Possession" is a common enough substring that it also matches other
   schedule items (e.g. a "Pre-Possession Walkthrough" entry), and since
   groupDueDate() takes the EARLIEST matching finish date across all matches,
   an unrelated earlier-dated entry can make #143's checklist look overdue
   well before the unit has actually reached possession. Switches it to an
   exact subject match, same fix already used for this exact word in the old
   checklist system. */
async function migratePossessionExactMatch_v1(){
  const done = await sget('migrated_possession_exact_match_v1', false);
  if(done) return;
  const g = state.checklistGroups.find(x=>x.num==='143');
  if(g && !g.exactMatch){ g.exactMatch = true; await sset('checklistGroups', state.checklistGroups); }
  await sset('migrated_possession_exact_match_v1', true);
}

/* One-per-schedule-item checklists (145 groups, each with its own QC list)
   proved impossible to keep up with, so this wipes the whole library back
   to empty ahead of Josh re-uploading a smaller, broader set of groups with
   his own item-to-schedule-item mapping. Group instances go with it - same
   as the rewrite this undoes, there's nothing meaningful to carry forward
   once the groups themselves are gone. Runs once, gated by the flag below. */
async function migrateClearPhaseChecklists_v1(){
  const done = await sget('migrated_clear_phase_checklists_v1', false);
  if(done) return;
  state.checklistGroups = [];
  state.groupInstances = [];
  await sset('checklistGroups', state.checklistGroups);
  await sset('groupInstances', state.groupInstances);
  await sset('migrated_clear_phase_checklists_v1', true);
}

/* Loads Josh's "By Phase" rebuild (22 broad QC groups, replacing the empty
   library the clear migration above left behind) and creates an instance of
   each on every active unit. Runs once, gated by the flag below - future
   schedule-item mappings for the still-unmapped groups are applied as small
   patch migrations (same pattern as migratePossessionExactMatch_v1) rather
   than by re-running this one. */
async function migratePhaseChecklistByPhaseSeed_v1(){
  const done = await sget('migrated_phase_checklist_byphase_v1', false);
  if(done) return;
  state.checklistGroups = PHASE_CHECKLIST_SEED.slice();
  state.groupInstances = [];
  for(const u of state.units){
    if(u.active){
      for(const g of state.checklistGroups){ state.groupInstances.push(makeGroupInstance(u.id, g.id)); }
    }
  }
  await sset('checklistGroups', state.checklistGroups);
  await sset('groupInstances', state.groupInstances);
  await sset('migrated_phase_checklist_byphase_v1', true);
}

function makeGroupInstance(unitId, groupId){
  return {id:uid(), unitId, groupId, itemStatus:{}, dueOverride:null, createdDate:todayISO()};
}
/* No longer computed from synced schedule finish dates - Josh tracks actual
   dates in another app and doesn't need this one re-syncing them. Phase
   checklists are surfaced by matching a unit's Current Phase (see
   currentPhaseChecklistGroup below) instead of a due date. dueOverrideGlobal
   (set on the group itself) and dueOverride (set per unit instance) still
   work if a specific date is ever wanted on a specific checklist. */
function groupDueDate(unitId, group){
  return group.dueOverrideGlobal || null;
}
/* Finds the checklist group whose matchPhase corresponds to a unit's
   currently-selected phase (Log Round's Current Phase dropdown, itself
   pulled from real schedule subjects — see scheduleSubjectOptions above),
   so that phase's checklist can be surfaced directly instead of making
   Josh hunt for it in the full group list. */
function currentPhaseChecklistGroup(u){
  if(!u.currentPhase) return null;
  const phase = u.currentPhase.toLowerCase();
  return state.checklistGroups.find(g => {
    if(!g.matchPhase) return false;
    const mp = g.matchPhase.toLowerCase();
    return g.exactMatch ? phase===mp : phase.includes(mp);
  }) || null;
}

function groupCompletion(inst, group){
  const total = group.items.length;
  const done = group.items.filter(it=>inst.itemStatus[it.id]).length;
  return {done, total};
}
function groupStatus(due, done, total){
  if(total>0 && done>=total) return 'done';
  if(!due) return 'open';
  const today = todayISO();
  if(due<today) return 'overdue';
  if(due===today) return 'today';
  return 'open';
}

const PLAN_DEFAULT_ESTIMATE = 30;

/* Builds today's suggested plan: Josh-owned deficiencies + phase-check groups
   due today or overdue, sorted by due date then priority, greedily filled into
   the daily time budget. Trade-owned deficiencies never count against the
   budget — they're rounds follow-ups, not Josh's own task time. */
function buildSuggestedPlan(){
  const today = todayISO();
  const budget = state.dailyAllowanceMinutes || 480;

  const defCandidates = state.defs
    .filter(d=>d.status!=='Done' && d.owner==='Josh' && d.dueDate && d.dueDate<=today && isUnitActiveByLocation(d.location))
    .map(d=>({
      type:'def', due:d.dueDate, priority:d.priority||'Medium', category:d.category||'Construction',
      minutes: d.estimatedMinutes || PLAN_DEFAULT_ESTIMATE,
      ref:d
    }))
    .sort((a,b)=>
      (a.due||'').localeCompare(b.due||'')
      || (CATEGORY_ORDER[a.category]??1)-(CATEGORY_ORDER[b.category]??1)
      || (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1)
      || a.minutes-b.minutes // final tiebreak: shortest estimated time first, so a same-day/same-priority
                             // pile doesn't stall on a long item — clears more, builds momentum
    );

  // Phase checks are never time-budgeted or deferrable — only Josh's own
  // deficiencies compete for his daily allowance, since a phase check isn't a
  // block of Josh's personal time the way his own deficiency is. They surface
  // by matching each active unit's Current Phase (set from round logging),
  // same as the Current Phase Checklist section in Unit Detail — not from a
  // due date, since Josh verifies actual schedule dates in another app.
  const phaseToday = [];
  for(const u of state.units){
    if(!u.active) continue;
    const g = currentPhaseChecklistGroup(u);
    if(!g) continue;
    const gi = state.groupInstances.find(x=>x.unitId===u.id && x.groupId===g.id);
    if(!gi) continue;
    const {done,total} = groupCompletion(gi, g);
    if(total>0 && done>=total) continue;
    const due = gi.dueOverride || groupDueDate(u.id, g);
    phaseToday.push({type:'phase', due, unit:u, group:g, groupInstance:gi});
  }

  const selectedDefs = [], deferred = [];
  let used = 0;
  for(const item of defCandidates){
    if(selectedDefs.length===0 || used+item.minutes<=budget){
      selectedDefs.push(item);
      used += item.minutes;
    } else {
      deferred.push(item);
    }
  }

  const selected = [...selectedDefs, ...phaseToday].sort((a,b)=>(a.due||'').localeCompare(b.due||''));

  // Trade-owned deficiencies due today: never budgeted or ranked against Josh's
  // own time, but still worth surfacing so today's rounds/follow-ups are visible.
  const tradeToday = state.defs.filter(d=>d.status!=='Done' && d.owner==='Trade' && d.dueDate===today && isUnitActiveByLocation(d.location));

  return {selected, deferred, tradeToday, used, budget};
}

/* Items parked as WAITING/DELEGATED (or any open item) whose follow-up date
   has arrived — "time to check on this," not a deadline. Feeds the NOW
   section on Brief as a fallback when nothing is scheduled in today's
   Suggested Plan queue. Sorted the same way as the plan itself. */
function followUpsDue(){
  const today = todayISO();
  return state.defs
    .filter(d=>d.status!=='Done' && d.followUpDate && d.followUpDate<=today && isUnitActiveByLocation(d.location))
    .sort((a,b)=>
      (a.followUpDate||'').localeCompare(b.followUpDate||'')
      || (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1)
      || (a.estimatedMinutes||PLAN_DEFAULT_ESTIMATE)-(b.estimatedMinutes||PLAN_DEFAULT_ESTIMATE)
    );
}

/* ---------- capacity planning (next 5 business days) ---------- */
function nextBusinessDay(iso){
  let d = addDays(iso, 1);
  let dow = new Date(d+'T00:00:00').getDay();
  while(dow===0 || dow===6){ d = addDays(d, 1); dow = new Date(d+'T00:00:00').getDay(); }
  return d;
}
/* Mon-Fri only, no weekends — starts on fromISO itself if it's a business
   day (rolls forward to Monday first if not), then walks forward count-1
   more business days. */
function businessDaysForward(fromISO, count){
  let d = fromISO;
  let dow = new Date(d+'T00:00:00').getDay();
  while(dow===0 || dow===6){ d = addDays(d, 1); dow = new Date(d+'T00:00:00').getDay(); }
  const days = [d];
  while(days.length < count){ d = nextBusinessDay(d); days.push(d); }
  return days;
}

/* Projects Josh's own (MY_ACTION) open workload across the next 5 business
   days against dailyAllowanceMinutes, using the same greedy fill/tiebreak
   as buildSuggestedPlan. Whatever doesn't fit a day carries into the next
   one as a push candidate — cascading, so an overloaded Monday can ripple
   into Tuesday. Read-only: nothing here mutates state or touches a real
   dueDate — confirmPushToNextBusinessDay() below does that, one item at a
   time, only when the user confirms the suggestion. Trade/Delegated items
   are excluded entirely, same as today's budget already excludes them —
   they were never Josh's time to plan against. */
function buildCapacityForecast(){
  const budget = state.dailyAllowanceMinutes || 480;
  const days = businessDaysForward(todayISO(), 5);
  const lastDay = days[days.length-1];
  const pool = state.defs.filter(d=>
    d.status!=='Done' && d.owner==='Josh' && d.dueDate && d.dueDate<=lastDay && isUnitActiveByLocation(d.location)
  );
  const sortKey = (a,b)=>
    (a.dueDate||'').localeCompare(b.dueDate||'')
    || (CATEGORY_ORDER[a.category]??1)-(CATEGORY_ORDER[b.category]??1)
    || (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1)
    || (a.estimatedMinutes||PLAN_DEFAULT_ESTIMATE)-(b.estimatedMinutes||PLAN_DEFAULT_ESTIMATE);

  // Assign every pool item to a forecast day: the first business day whose
  // date is >= its dueDate. Rolls anything overdue (or due today) into day
  // 0, and anything due on a weekend forward onto the next business day —
  // without this, a weekend-due item matches no bucket by exact equality
  // and silently drops out of the forecast entirely.
  const dayIndexFor = (dueDate) => {
    for(let i=0; i<days.length; i++){ if(dueDate<=days[i]) return i; }
    return days.length-1;
  };
  const byDay = days.map(()=>[]);
  for(const item of pool) byDay[dayIndexFor(item.dueDate)].push(item);

  const result = [];
  let carry = [];
  for(let i=0; i<days.length; i++){
    const day = days[i];
    const candidates = [...carry, ...byDay[i]].sort(sortKey);
    const fits = [], pushed = [];
    let used = 0;
    for(const item of candidates){
      const mins = item.estimatedMinutes || PLAN_DEFAULT_ESTIMATE;
      if(fits.length===0 || used+mins<=budget){ fits.push(item); used += mins; }
      else pushed.push(item);
    }
    const isLastDay = i===days.length-1;
    result.push({day, budget, used, fits, pushed: isLastDay ? [] : pushed, overflow: isLastDay ? pushed : []});
    carry = pushed;
  }
  return result;
}

/* Confirms a capacity-forecast push suggestion: moves the item's real due
   date forward one business day, tracked the same way a checklist
   instance's Push button already tracks a backlog push (pushCount/
   pushReason) — deficiencies had those fields since the original import
   but no UI ever wrote to them. One item, one day, at a time; the
   forecast recomputes fresh from the new dueDate on next render. */
async function pushDefToNextBusinessDay(defId, fromDay, toDay){
  const d = state.defs.find(x=>x.id===defId);
  if(!d) return;
  d.pushCount = (d.pushCount||0)+1;
  d.pushReason = `capacity: bumped from ${fromDay} to ${toDay} — day was full`;
  d.dueDate = toDay;
  await sset('defs', state.defs);
}

/* ---------- Josh's own forward-looking task schedule (plannedDate) ----------
   A personal commitment - "I'll actually do this Thursday" - separate from
   dueDate/dueOverride (the real deadline). Nothing here is ever set
   automatically; Josh sets/clears it by hand from a deferred item in the
   Suggested Plan, so a real deadline can't drift and a deferred task can't
   quietly get lost. Ids are prefixed d_/c_ so a single string can resolve to
   either a deficiency or a checklist item. */
function resolveScheduleTask(id){
  if(id.startsWith('d_')){
    const d = state.defs.find(x=>x.id===id.slice(2));
    return d ? {kind:'def', ref:d} : null;
  }
  if(id.startsWith('c_')){
    const gi = state.groupInstances.find(x=>x.id===id.slice(2));
    return gi ? {kind:'check', ref:gi} : null;
  }
  return null;
}
async function setPlannedDate(taskId, date){
  const info = resolveScheduleTask(taskId);
  if(!info) return;
  info.ref.plannedDate = date;
  if(info.kind==='def') await sset('defs', state.defs);
  else await sset('groupInstances', state.groupInstances);
}
async function clearPlannedDate(taskId){
  await setPlannedDate(taskId, null);
}

/* Every open task (deficiency or checklist item) Josh has personally
   scheduled for a future day, grouped for display so the "scheduled out"
   list he's building over time is actually visible somewhere. Today's items
   are excluded since they already show in the main plan above. */
function upcomingPlannedTasks(){
  const today = todayISO();
  const items = [];
  for(const d of state.defs){
    if(d.status==='Done' || !d.plannedDate || d.plannedDate<=today) continue;
    if(!isUnitActiveByLocation(d.location)) continue;
    items.push({id:'d_'+d.id, name:d.description, site:d.location, plannedDate:d.plannedDate});
  }
  for(const u of state.units){
    if(!u.active) continue;
    for(const gi of state.groupInstances.filter(x=>x.unitId===u.id)){
      if(!gi.plannedDate || gi.plannedDate<=today) continue;
      const g = state.checklistGroups.find(x=>x.id===gi.groupId);
      if(!g) continue;
      const {done,total} = groupCompletion(gi, g);
      if(done>=total) continue;
      items.push({id:'c_'+gi.id, name:g.name, site:u.name, plannedDate:gi.plannedDate});
    }
  }
  return items.sort((a,b)=>a.plannedDate.localeCompare(b.plannedDate));
}

/* ---------- manual drag-and-drop order for today's Suggested Plan ----------
   Purely a display-order preference layered on top of buildSuggestedPlan()'s
   own selection/budget logic - it never changes WHICH tasks make today's
   cut, only what order they're shown in. Items not yet touched keep their
   natural computed order and sort after anything Josh has explicitly placed. */
function scheduleItemKey(item){
  return item.type==='def' ? 'd_'+item.ref.id : 'c_'+item.groupInstance.id;
}
function applyManualOrder(items){
  const index = new Map(state.planOrder.map((id,i)=>[id,i]));
  return items.map((item,i)=>({item, i, rank: index.has(scheduleItemKey(item)) ? index.get(scheduleItemKey(item)) : Infinity}))
    .sort((a,b)=> a.rank-b.rank || a.i-b.i)
    .map(x=>x.item);
}
/* Saves the new order and prunes ids that no longer resolve to an open task,
   so this list doesn't grow forever with stale entries from finished work. */
async function savePlanOrder(idsInOrder){
  state.planOrder = idsInOrder.filter(id=>{
    const info = resolveScheduleTask(id);
    return info && !(info.kind==='def' && info.ref.status==='Done');
  });
  await sset('planOrder', state.planOrder);
}

/* ---------- daily safety walkthrough (checklist + per-item photos/notes) ----------
   One record per calendar day, site-wide (not per-unit) - a safety walk
   covers the whole site, not one construction unit. The checklist itself
   (groups/items) is fixed content, not user-editable data, same idea as
   CHECKLIST_GROUPS_SEED for phase checks. Per-item checked state, notes,
   and photos live on the day's walkthrough record, keyed by item id.
   Photos live in Supabase Storage; only the resulting URL is stored here. */
const SAFETY_CHECKLIST_SEED = [
  {id:'job-info', name:'Job Information', items:[
    {id:'medcenter', text:"Post the medical center's number"},
    {id:'toolbox', text:'Keep toolbox talks current'},
    {id:'barricade', text:'Sign/barricade work areas'},
  ]},
  {id:'housekeeping', name:'Housekeeping', items:[
    {id:'trip', text:'Keep work areas clear of trip hazards'},
    {id:'waste', text:'Use waste containers'},
    {id:'walkways', text:'Keep walkways clear'},
    {id:'cords', text:'Keep cords off the floor'},
  ]},
  {id:'fire', name:'Fire Prevention', items:[
    {id:'extinguishers', text:'Keep extinguishers stocked and inspected'},
    {id:'firstaid', text:'Keep first aid kits stocked and inspected'},
    {id:'nosmoking', text:'Enforce no-smoking signage near flammables'},
  ]},
  {id:'tools', name:'Hand, Power & Powder-Actuated Tools', items:[
    {id:'inspecttools', text:'Inspect hand tools'},
    {id:'guards', text:'Keep guards in place'},
    {id:'powdertools', text:'Ensure only authorized operators use powder tools'},
  ]},
  {id:'fallprotection', name:'Fall Protection', items:[
    {id:'railsfalls', text:'Secure rails and cables to prevent falls'},
    {id:'railsobjects', text:'Secure rails and cables to prevent falling objects'},
  ]},
  {id:'ladders', name:'Ladders', items:[
    {id:'ladder36', text:'Ladders must extend 36" above the landing'},
    {id:'laddersecured', text:'Ladders must be secured'},
    {id:'ladderdamaged', text:'Ladders must be pulled if damaged'},
    {id:'ladderopen', text:'Ladders must be fully opened if step-style'},
  ]},
];

function todaySafetyWalkthrough(){
  return state.safetyWalkthroughs.find(w=>w.date===todayISO()) || null;
}
async function ensureTodayWalkthrough(){
  let w = todaySafetyWalkthrough();
  if(!w){
    w = {id:uid(), date:todayISO(), onSiteNotes:'', itemStatus:{}, itemPhotos:{}, itemNotes:{}, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()};
    state.safetyWalkthroughs.push(w);
    await sset('safetyWalkthroughs', state.safetyWalkthroughs);
  }
  return w;
}
async function saveWalkthroughNotes(walkthroughId, notes){
  const w = state.safetyWalkthroughs.find(x=>x.id===walkthroughId);
  if(!w) return;
  w.onSiteNotes = notes;
  w.updatedAt = new Date().toISOString();
  await sset('safetyWalkthroughs', state.safetyWalkthroughs);
}
async function toggleSafetyItem(walkthroughId, itemId, checked){
  const w = state.safetyWalkthroughs.find(x=>x.id===walkthroughId);
  if(!w) return;
  w.itemStatus[itemId] = checked;
  w.updatedAt = new Date().toISOString();
  await sset('safetyWalkthroughs', state.safetyWalkthroughs);
}
async function saveSafetyItemNote(walkthroughId, itemId, note){
  const w = state.safetyWalkthroughs.find(x=>x.id===walkthroughId);
  if(!w) return;
  w.itemNotes[itemId] = note;
  w.updatedAt = new Date().toISOString();
  await sset('safetyWalkthroughs', state.safetyWalkthroughs);
}
async function addSafetyItemPhoto(walkthroughId, itemId, photoUrl){
  const w = state.safetyWalkthroughs.find(x=>x.id===walkthroughId);
  if(!w) return;
  if(!w.itemPhotos[itemId]) w.itemPhotos[itemId] = [];
  w.itemPhotos[itemId].push({id:uid(), photoUrl, createdAt:new Date().toISOString()});
  w.updatedAt = new Date().toISOString();
  await sset('safetyWalkthroughs', state.safetyWalkthroughs);
}
async function removeSafetyItemPhoto(walkthroughId, itemId, photoId){
  const w = state.safetyWalkthroughs.find(x=>x.id===walkthroughId);
  if(!w) return;
  w.itemPhotos[itemId] = (w.itemPhotos[itemId]||[]).filter(p=>p.id!==photoId);
  w.updatedAt = new Date().toISOString();
  await sset('safetyWalkthroughs', state.safetyWalkthroughs);
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

