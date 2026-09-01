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

const PHASE_CHECKLIST_SEED = [
{id:uid(),name:"#1 — Apply for Temp Gas 2PSI (Josh/Stacie)",milestone:"Foundation",num:"1",category:"LT",offsetDays:0,matchPhase:"Apply for Temp Gas 2PSI",items:[{id:uid(),text:"Timing takes 3 weeks for application approval, then 3 more for install.",subgroup:'Blocker'}]},
{id:uid(),name:"#2 — Stake (Geomatics/Scott)",milestone:"Foundation",num:"2",category:null,offsetDays:0,matchPhase:"Stake",items:[{id:uid(),text:"None",subgroup:'Blocker'},{id:uid(),text:"Excavation addressing for inspections",subgroup:"QC — Pre-Excavation"},{id:uid(),text:"Hydrodig utilities",subgroup:"QC — Pre-Excavation"},{id:uid(),text:"Staked out",subgroup:"QC — Pre-Excavation"},{id:uid(),text:"Footing layout to visualize horizontal space + grade layout for vertical space",subgroup:"QC — Pre-Excavation"}]},
{id:uid(),name:"#3 — Excavation (Clover Hill)",milestone:"Foundation",num:"3",category:"LT/SEQ",offsetDays:0,matchPhase:"Excavation",items:[{id:uid(),text:"needs a dirt dumping zone",subgroup:'Blocker'},{id:uid(),text:"I personally need to know what the excavation should look like so the Cribber has something flat, and properly stepped, to build forms on",subgroup:'Blocker'},{id:uid(),text:"Booked structural rebar inspection where applicable (5-plex and up)",subgroup:"QC — Pre-Cribbing"},{id:uid(),text:"Flat hole + party walls cut lower",subgroup:"QC — Pre-Cribbing"},{id:uid(),text:"Sewer trench backfilled",subgroup:"QC — Pre-Cribbing"},{id:uid(),text:"Sewer trench slope correct for plumbers",subgroup:"QC — Pre-Cribbing"}]},
{id:uid(),name:"#4 — Order Windows (Scott)",milestone:"Foundation",num:"4",category:"LT",offsetDays:0,matchPhase:"Order Windows",items:[{id:uid(),text:"Lead time 8 weeks",subgroup:'Blocker'}]},
{id:uid(),name:"#6 — Repin Footing/Elevation check (Geomatics/Scott)",milestone:"Foundation",num:"6",category:null,offsetDays:0,matchPhase:"Repin Footing/Elevation check",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#7 — Soil Bearing Testing (Almor/Scott)",milestone:"Foundation",num:"7",category:"SEQ",offsetDays:0,matchPhase:"Soil Bearing Testing",items:[{id:uid(),text:"Excavators have to be 100% conplete",subgroup:'Blocker'}]},
{id:uid(),name:"#8 — Sewer trench install (EZ Plumbing)",milestone:"Foundation",num:"8",category:"SEQ",offsetDays:0,matchPhase:"Sewer trench install",items:[{id:uid(),text:"Timing has to happen in one day. Delay spreads out remaining schedule.",subgroup:'Blocker'},{id:uid(),text:"It's blocked by excavators needing to dig trench correctly and properly sloped",subgroup:'Blocker'}]},
{id:uid(),name:"#9 — Sewer trench inspection (Scott)",milestone:"Foundation",num:"9",category:"SEQ",offsetDays:0,matchPhase:"Sewer trench inspection",items:[{id:uid(),text:"Needs site signage or inspector will leave",subgroup:'Blocker'}]},
{id:uid(),name:"#10 — Backfill Sewer trench (Clover Hill)",milestone:"Foundation",num:"10",category:"BK",offsetDays:0,matchPhase:"Backfill Sewer trench",items:[{id:uid(),text:"Excavator needs to know a few days in advance so they can arrive on correct date",subgroup:'Blocker'}]},
{id:uid(),name:"#11 — Form Footings (TM Formworks)",milestone:"Foundation",num:"11",category:"SEQ/LT",offsetDays:0,matchPhase:"Form Footings",items:[{id:uid(),text:"Excavators need to dig flat and level.",subgroup:'Blocker'},{id:uid(),text:"Cribbers need garbage bin",subgroup:'Blocker'},{id:uid(),text:"it needs power on site too",subgroup:'Blocker'}]},
{id:uid(),name:"#12 — Footing Rebar Inspection (Bravura/Scott)",milestone:"Foundation",num:"12",category:null,offsetDays:0,matchPhase:"Footing Rebar Inspection",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#13 — Concrete test (Almor/Scott)",milestone:"Foundation",num:"13",category:null,offsetDays:0,matchPhase:"Concrete test",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#14 — Pour Footings (Kerridge/TM)",milestone:"Foundation",num:"14",category:"LT",offsetDays:0,matchPhase:"Pour Footings",items:[{id:uid(),text:"If weather is cold, tarps have to be on site to cover after pouring concrete",subgroup:'Blocker'}]},
{id:uid(),name:"#15 — Tarp Footing (Winter) (Scott)",milestone:"Foundation",num:"15",category:"LT",offsetDays:0,matchPhase:"Tarp Footing",items:[{id:uid(),text:"Same as above (see #14)",subgroup:'Blocker'}]},
{id:uid(),name:"#16 — Form Walls (TM Formworks)",milestone:"Foundation",num:"16",category:"SEQ/LT",offsetDays:0,matchPhase:"Form Walls",items:[{id:uid(),text:"Same as footings (see #11)",subgroup:'Blocker'}]},
{id:uid(),name:"#17 — Foundation Rebar Inspection (Bravura/Scott)",milestone:"Foundation",num:"17",category:null,offsetDays:0,matchPhase:"Foundation Rebar Inspection",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#17b — Structural Rebar Inspection (5-plex and up only — not applicable to B17 or 4-plex) (Bravura/Scott)",milestone:"Foundation",num:"17b",category:"INS",offsetDays:0,matchPhase:"Structural Rebar Inspection",items:[{id:uid(),text:"Booked structural rebar inspection where applicable (5-plex and up)",subgroup:'Blocker'}]},
{id:uid(),name:"#18 — Confirm Lenbeth",milestone:"Foundation",num:"18",category:null,offsetDays:0,matchPhase:"Confirm Lenbeth",items:[{id:uid(),text:"Not needed on this project",subgroup:'Blocker'}]},
{id:uid(),name:"#19 — Order Gas Riser (Josh/Stacie)",milestone:"Foundation",num:"19",category:"LT/SEQ",offsetDays:0,matchPhase:"Order Gas Riser",items:[{id:uid(),text:"2 week lead time on ordering an inspection, inspection date has to be booked on the day after walls are stripped, and then 1 week lead time from inspection sign off to install",subgroup:'Blocker'},{id:uid(),text:"Order gas riser and get Jess from ATCO on site to inspect and work order them",subgroup:'Blocker'}]},
{id:uid(),name:"#20 — Concrete test (Almor/Scott)",milestone:"Foundation",num:"20",category:null,offsetDays:0,matchPhase:"Concrete test",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#21 — Pour Walls (Kerridge/TM)",milestone:"Foundation",num:"21",category:"LT",offsetDays:0,matchPhase:"Pour Walls",items:[{id:uid(),text:"Same (see #14)",subgroup:'Blocker'}]},
{id:uid(),name:"#22 — Tarp Walls (Winter) (Scott)",milestone:"Foundation",num:"22",category:"LT",offsetDays:0,matchPhase:"Tarp Walls",items:[{id:uid(),text:"Same (see #14)",subgroup:'Blocker'}]},
{id:uid(),name:"#23 — Strip Walls (TM Formworks)",milestone:"Foundation",num:"23",category:null,offsetDays:0,matchPhase:"Strip Walls",items:[{id:uid(),text:"None",subgroup:'Blocker'},{id:uid(),text:"Electric backer panel installed",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"Order gas riser and get Jess from ATCO on site to inspect and work order them",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"MARK GRADES: unit numbers",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"MARK GRADES: UTILITIES",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"Support for gas riser",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"Groundworks gravel",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"MARK GRADES: LANDSCAPING",subgroup:"QC — Pre-Undergrounds"},{id:uid(),text:"Panel backer and meter banks installed (ladder/lift)",subgroup:"QC — Pre-Backfill"},{id:uid(),text:"Water main tail stubbed out 8-10ft above grade in mech rooms (Heritage)",subgroup:"QC — Pre-Backfill"}]},
{id:uid(),name:"#24 — Electrical Conduits (Custom Electric)",milestone:"Foundation",num:"24",category:"SEQ",offsetDays:0,matchPhase:"Electrical Conduits",items:[{id:uid(),text:"Need proper knockout access holes in concrete foundation walls and footings from cribbers",subgroup:'Blocker'}]},
{id:uid(),name:"#25 — Install EP Frost Wall + Siding Backer",milestone:"Foundation",num:"25",category:"SEQ",offsetDays:0,matchPhase:"Install EP Frost Wall + Siding Backer",items:[{id:uid(),text:"Needs 1st level walls framed",subgroup:'Blocker'}]},
{id:uid(),name:"#26 — Install Gas Riser (Scott)",milestone:"Foundation",num:"26",category:"SEQ/QC",offsetDays:0,matchPhase:"Install Gas Riser",items:[{id:uid(),text:"Stub end needs to remain 2' uncovered for proper tie in, so ensure it is excavated properly",subgroup:'Blocker'}]},
{id:uid(),name:"#27 — Install Telus/Shaw stubs (Custom Electric)",milestone:"Foundation",num:"27",category:null,offsetDays:0,matchPhase:"Install Telus/Shaw stubs",items:[{id:uid(),text:"No",subgroup:'Blocker'}]},
{id:uid(),name:"#28 — Mark Grades (Scott)",milestone:"Foundation",num:"28",category:"SEQ",offsetDays:0,matchPhase:"Mark Grades",items:[{id:uid(),text:"I need to personally know the foundation plan ahead of time to visually see where utilities will attach to the house, where final grades are, and if those grades affect utility heights",subgroup:'Blocker'}]},
{id:uid(),name:"#29 — Order Joists/lumber (Scott)",milestone:"Foundation",num:"29",category:"LT",offsetDays:0,matchPhase:"Order Joists/lumber",items:[{id:uid(),text:"6 week lead time",subgroup:'Blocker'}]},
{id:uid(),name:"#30 — Tar/Weeping Tile/Gravel",milestone:"Foundation",num:"30",category:"SEQ",offsetDays:0,matchPhase:"Tar/Weeping Tile/Gravel",items:[{id:uid(),text:"Not necessary on this project. But for future projects it requires all utilities to be installed first",subgroup:'Blocker'}]},
{id:uid(),name:"#31 — Basement Ground Works (EZ Plumbing)",milestone:"Foundation",num:"31",category:"BK/SEQ/LT",offsetDays:0,matchPhase:"Basement Ground Works",items:[{id:uid(),text:"Timing of holding concrete company to schedule",subgroup:'Blocker'},{id:uid(),text:"Winter requires heaters",subgroup:'Blocker'},{id:uid(),text:"Excavators required to backfill to specific height so concrete workers don't need to top it up or dig anything down further",subgroup:'Blocker'}]},
{id:uid(),name:"#32 — Foundation/Electric Underground Inspection (Scott)",milestone:"Foundation",num:"32",category:"BK/INS",offsetDays:0,matchPhase:"Foundation/Electric Underground Inspection",items:[{id:uid(),text:"Timing electrician needs 3 week lead time to book inspection",subgroup:'Blocker'}]},
{id:uid(),name:"#33 — Backfill (Clover Hill)",milestone:"Foundation",num:"33",category:"SEQ/INS",offsetDays:0,matchPhase:"Backfill",items:[{id:uid(),text:"Inspection sign off and all utilities installed",subgroup:'Blocker'},{id:uid(),text:"Print/post/send all SI's/CO's/Selections + notify sticky trades",subgroup:"QC — Pre-Framing"},{id:uid(),text:"Remove window well braces before framing, where applicable",subgroup:"QC — Pre-Framing"},{id:uid(),text:"Consolidate and notify trades of all IFC's/SI/Selections",subgroup:"QC — Pre-Framing"}]},
{id:uid(),name:"#34 — Ground Works inspection (Scott)",milestone:"Foundation",num:"34",category:"BK",offsetDays:0,matchPhase:"Ground Works inspection",items:[{id:uid(),text:"Timing plumbers to have groundworks done on schedule",subgroup:'Blocker'},{id:uid(),text:"Winter groundworks needs an extra day for anything frozen",subgroup:'Blocker'},{id:uid(),text:"Excavators can't backfill too high or plumbers are digging and taking more time",subgroup:'Blocker'}]},
{id:uid(),name:"#35 — Order Temporary Gas Meter (Josh/Stacie)",milestone:"Foundation",num:"35",category:"SEQ",offsetDays:0,matchPhase:"Order Temporary Gas Meter",items:[{id:uid(),text:"Dependent on ordering and 1st level walls framed",subgroup:'Blocker'},{id:uid(),text:"riser install needs Cribber to install a 2x10 board in foundation wall in order to mount the gas meter",subgroup:'Blocker'}]},
{id:uid(),name:"#36 — Prep Garage Slab (C&J Construction)",milestone:"Foundation",num:"36",category:"LT/BK",offsetDays:0,matchPhase:"Prep Garage Slab",items:[{id:uid(),text:"Winter needs heat and tarps",subgroup:'Blocker'},{id:uid(),text:"Timing concrete workers to hold schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#39 — Install Electrical Masts/Panels (Custom Electric)",milestone:"Foundation",num:"39",category:"SEQ",offsetDays:0,matchPhase:"Install Electrical Masts/Panels",items:[{id:uid(),text:"Both need 1st level walls framed (masts/panels)",subgroup:'Blocker'},{id:uid(),text:"Panels also need 1st round IPD completed",subgroup:'Blocker'}]},
{id:uid(),name:"#40 — Pour Garage Slab (C&J Construction)",milestone:"Foundation",num:"40",category:"LT/BK",offsetDays:0,matchPhase:"Pour Garage Slab",items:[{id:uid(),text:"Same as form garage slab (see #36)",subgroup:'Blocker'}]},
{id:uid(),name:"#41 — Prep Basement Slab (C&J Construction)",milestone:"Foundation",num:"41",category:"LT/BK",offsetDays:0,matchPhase:"Prep Basement Slab",items:[{id:uid(),text:"Same as 40",subgroup:'Blocker'}]},
{id:uid(),name:"#42 — Electric Conduit and Services Inspection (Custom Electric)",milestone:"Foundation",num:"42",category:"SEQ",offsetDays:0,matchPhase:"Electric Conduit and Services Inspection",items:[{id:uid(),text:"Framing and roofing need to be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#44 — Pour Basement Slab (C&J Construction)",milestone:"Foundation",num:"44",category:"LT/BK",offsetDays:0,matchPhase:"Pour Basement Slab",items:[{id:uid(),text:"Same as garage slab (see #36)",subgroup:'Blocker'}]},
{id:uid(),name:"#52 — Install Temporary Gas Meter (Josh)",milestone:"Foundation",num:"52",category:"SEQ",offsetDays:0,matchPhase:"Install Temporary Gas Meter",items:[{id:uid(),text:"Dependent on ordering and 1st level walls framed",subgroup:'Blocker'}]},
{id:uid(),name:"#5 — Order Stairs (Alberta Stairworks)",milestone:"Framing",num:"5",category:"LT",offsetDays:0,matchPhase:"Order Stairs",items:[{id:uid(),text:"4 week lead time",subgroup:'Blocker'}]},
{id:uid(),name:"#37 — Set Up energy provider Gas Power (Stacie)",milestone:"Framing",num:"37",category:null,offsetDays:0,matchPhase:"Set Up energy provider Gas Power",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#38 — Deliver First Floor Joists & Walls (Integrity Building Products)",milestone:"Framing",num:"38",category:"LT",offsetDays:0,matchPhase:"Deliver First Floor Joists & Walls",items:[{id:uid(),text:"6 week lead time",subgroup:'Blocker'}]},
{id:uid(),name:"#43 — Order Electrical Meters (Stacie)",milestone:"Framing",num:"43",category:"SEQ",offsetDays:0,matchPhase:"Order Electrical Meters",items:[{id:uid(),text:"Need electric service inspection from foundation signed off",subgroup:'Blocker'}]},
{id:uid(),name:"#45 — Framing (Stick Frame) (2111484 AB Ltd.)",milestone:"Framing",num:"45",category:"SEQ/LT",offsetDays:0,matchPhase:"Framing",items:[{id:uid(),text:"Accurate plans, reviewed, and I know \"how the building is built before it's built\"",subgroup:'Blocker'},{id:uid(),text:"Customer selections finalized",subgroup:'Blocker'},{id:uid(),text:"Lumber and stairs delivered",subgroup:'Blocker'},{id:uid(),text:"Print/post/send all SI's/CO's/Selections + notify sticky trades",subgroup:'Blocker'},{id:uid(),text:"Consolidate and notify trades of all IFC's/SI/Selections",subgroup:'Blocker'}]},
{id:uid(),name:"#46 — Stair Supply (Alberta Stairworks)",milestone:"Framing",num:"46",category:"LT",offsetDays:0,matchPhase:"Stair Supply",items:[{id:uid(),text:"Same (see #5)",subgroup:'Blocker'}]},
{id:uid(),name:"#47 — Deliver 2nd Floor Lumber (Integrity Building Products)",milestone:"Framing",num:"47",category:null,offsetDays:0,matchPhase:"Deliver 2nd Floor Lumber",items:[{id:uid(),text:"No",subgroup:'Blocker'}]},
{id:uid(),name:"#48 — Deliver 3rd Floor Lumber (Integrity Building Products)",milestone:"Framing",num:"48",category:null,offsetDays:0,matchPhase:"Deliver 3rd Floor Lumber",items:[{id:uid(),text:"No",subgroup:'Blocker'}]},
{id:uid(),name:"#49 — Window Delivery (Centra Windows)",milestone:"Framing",num:"49",category:"LT",offsetDays:0,matchPhase:"Window Delivery",items:[{id:uid(),text:"Same (see #4)",subgroup:'Blocker'}]},
{id:uid(),name:"#50 — Deliver Roof Trusses (Integrity Building Products)",milestone:"Framing",num:"50",category:null,offsetDays:0,matchPhase:"Deliver Roof Trusses",items:[{id:uid(),text:"No",subgroup:'Blocker'}]},
{id:uid(),name:"#51 — Deliver Roof/deck Lumber (Integrity Building Products)",milestone:"Framing",num:"51",category:null,offsetDays:0,matchPhase:"Deliver Roof/deck Lumber",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#53 — Deliver Tubs (EZ Plumbing)",milestone:"Framing",num:"53",category:"SEQ/QC",offsetDays:0,matchPhase:"Deliver Tubs",items:[{id:uid(),text:"Garages cleared for tub storage at delivery",subgroup:'Blocker'},{id:uid(),text:"Sign off at delivery to ensure no damage",subgroup:'Blocker'},{id:uid(),text:"customer selections need to be finalized so we know which units get which tubs for an entire building",subgroup:'Blocker'}]},
{id:uid(),name:"#55 — Frame Check (Scott)",milestone:"Framing",num:"55",category:"SEQ",offsetDays:0,matchPhase:"Frame Check",items:[{id:uid(),text:"All framing has to be complete 100%",subgroup:'Blocker'},{id:uid(),text:"Joists/trusses accessible for fire stopping",subgroup:"QC — FRAME CHECK: Pre-IPD"},{id:uid(),text:"Tubs/showers fit AFTER drywall",subgroup:"QC — FRAME CHECK: Pre-IPD"},{id:uid(),text:"Braces removed",subgroup:"QC — FRAME CHECK: Pre-IPD"},{id:uid(),text:"Concrete floors flat for flooring install; line up self-leveling",subgroup:"QC — FRAME CHECK: Pre-IPD"},{id:uid(),text:"Correct fascia size",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Insulation stops secure to building exterior",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Entry doors operate",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Exterior sheathing lifting holes patched",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Roof access hatch cut",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Soffit backing",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Roof vents cut",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"DensGlass firestopping in proper areas",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"Exterior sheathing flush for siding/stone",subgroup:"QC — FRAME CHECK: Exterior"},{id:uid(),text:"1) architectural/structural 2) mechanical 3) drywallers",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Windows work/correct RO",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"HVAC holes cut/framed",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Walls and ceilings level/straight/square",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Light switch locations are convenient",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Top floor insulation stops secure",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Fire stopped properly at party walls and trusses + no party wall spacer blocks",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Doors work/correct RO",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Check structural details in all areas where necessary",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Plumbing walls installed prior to cabinet mark out",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Floors flat and no deflection/squeaks",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"UNITS CLEANED AND SWEPT",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Top floor attic hatch installed",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Can it batt insulate/foam insulate/blown insulate/poly/board/tape?",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Top floor uplift blocks",subgroup:"QC — FRAME CHECK: ALL Rooms"},{id:uid(),text:"Door cripples point loaded to garage slab; see structural detail where necessary",subgroup:"QC — FRAME CHECK: Garage"},{id:uid(),text:"Exterior and Garage to house doors operate",subgroup:"QC — FRAME CHECK: Garage"},{id:uid(),text:"OH door backing",subgroup:"QC — FRAME CHECK: Garage"},{id:uid(),text:"TP and towel bar backing installed correct location/height",subgroup:"QC — FRAME CHECK: Powder Room/Bathrooms"},{id:uid(),text:"Mirrors on flat/level walls",subgroup:"QC — FRAME CHECK: Powder Room/Bathrooms"},{id:uid(),text:"Studs @ 20in from back of tub to anchor water lines and valves",subgroup:"QC — FRAME CHECK: Powder Room/Bathrooms"},{id:uid(),text:"Joists don't compete with plumbing",subgroup:"QC — FRAME CHECK: Powder Room/Bathrooms"},{id:uid(),text:"Tub/shower fits AFTER IPD @ 60in length",subgroup:"QC — FRAME CHECK: Powder Room/Bathrooms"},{id:uid(),text:"(Heritage model) plumbing wall set with 1in gap from exterior wall to give HVAC heat run 7in of room",subgroup:"QC — FRAME CHECK: Kitchen"},{id:uid(),text:"Cabinet backing @ 36in and 93in from floor OR studs @ 16in OC",subgroup:"QC — FRAME CHECK: Kitchen"},{id:uid(),text:"Minimum 36in laundry machine depth after plumbing walls (Heritage models)",subgroup:"QC — FRAME CHECK: Laundry"},{id:uid(),text:"Stairs centered on stairwells and doors/openings",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Under stairs backing",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Stair nosing on/off per selections",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Handrail backing correct at main runs/winders/landings",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Baseboard area STRAIGHT",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Headroom correct and sloped ceiling correct (check structural detail where necessary)",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Stairs centered on FINISHED OPENING",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"Upper stairs 36in high stub wall correct height and anchored to floors system",subgroup:"QC — FRAME CHECK: Stairs"},{id:uid(),text:"General room list",subgroup:"QC — FRAME CHECK: Living Room/Bedrooms"},{id:uid(),text:"Closet door RO's",subgroup:"QC — FRAME CHECK: Living Room/Bedrooms"},{id:uid(),text:"(Bella's) blocking to separate batts from foam insulation",subgroup:"QC — FRAME CHECK: Mechanical Room"},{id:uid(),text:"(Heritage model) underside of stairs backing @ 1ft OC for more holding power",subgroup:"QC — FRAME CHECK: Mechanical Room"},{id:uid(),text:"Roof vent holes cut as required",subgroup:"QC — FRAME CHECK: Decks/Porches"},{id:uid(),text:"Roof soffit dropped as necessary",subgroup:"QC — FRAME CHECK: Decks/Porches"},{id:uid(),text:"Posts point loaded to sonotubes or slab",subgroup:"QC — FRAME CHECK: Decks/Porches"},{id:uid(),text:"Deck posts built out as per architectural drawings",subgroup:"QC — FRAME CHECK: Decks/Porches"},{id:uid(),text:"OH door wall and ceiling backing",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Underside of stairs backing @ 2ft on center",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Firestopping drywall installed at winders/landings where next to party wall",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Ceiling drops: garages/powder rooms/Bella garage entry hallways",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Bulkheads",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Handrail backing @ 32in on center; check at winders",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Bath fan backing",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Ceiling drop at deck soffit",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Top floor uplift blocks",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Garage OH door backing in middle, side posts, ceiling at 10ft in on tracks and 8ft in on motor",subgroup:"QC — FRAME CHECK: Post-Rough-In's Backframing"},{id:uid(),text:"Window sheets",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"IPD completed",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"Plumber roof penetrations",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"Construction knobs",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"Cabinets marked out",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"Construction heat in basements or garages",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"Blue mats inside garages and outside front entries for mud control",subgroup:"QC — Pre-Rough-ins"},{id:uid(),text:"All exterior spotless",subgroup:"QC — Pre-Rough-ins"}]},
{id:uid(),name:"#56 — HVAC mark Out (Cooper Mechanical)",milestone:"Framing",num:"56",category:"SEQ",offsetDays:0,matchPhase:"HVAC mark Out",items:[{id:uid(),text:"Framing must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#58 — Prep/Pour Driveway",milestone:"Framing",num:"58",category:"BK/LT/SEQ",offsetDays:0,matchPhase:"Prep/Pour Driveway",items:[{id:uid(),text:"Timing holding concrete workers to schedule",subgroup:'Blocker'},{id:uid(),text:"Winter requires tarps",subgroup:'Blocker'},{id:uid(),text:"Framing needs to be done",subgroup:'Blocker'},{id:uid(),text:"Excavators need to ensure it isn't backfilled too high",subgroup:'Blocker'}]},
{id:uid(),name:"#61 — As Build Survey (Geomatics/Scott)",milestone:"Framing",num:"61",category:"SEQ",offsetDays:0,matchPhase:"As Build Survey",items:[{id:uid(),text:"Framing must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#64 — Submit Main Floor Geodetic Elevation to City (Geomatics/Scott)",milestone:"Framing",num:"64",category:"SEQ",offsetDays:0,matchPhase:"Submit Main Floor Geodetic Elevation to City",items:[{id:uid(),text:"Pour basement slab must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#54 — Fire Caulk trusses (Icon Insulation)",milestone:"Rough-Ins",num:"54",category:"SEQ",offsetDays:0,matchPhase:"Fire Caulk trusses",items:[{id:uid(),text:"Framing complete",subgroup:'Blocker'}]},
{id:uid(),name:"#57 — IPDs/Fire caulk joists (Capital Drywall/Icon Insulation)",milestone:"Rough-Ins",num:"57",category:"SEQ",offsetDays:0,matchPhase:"IPDs/Fire caulk joists",items:[{id:uid(),text:"Same (see #54)",subgroup:'Blocker'},{id:uid(),text:"units have to be accessible with mud/snow control mats to mitigate slips and trips",subgroup:'Blocker'}]},
{id:uid(),name:"#62 — Cabinet MarkOut (Woodcraft Kitchen Cabinets)",milestone:"Rough-Ins",num:"62",category:"SEQ",offsetDays:0,matchPhase:"Cabinet MarkOut",items:[{id:uid(),text:"Framing complete AND cleaned/swept",subgroup:'Blocker'},{id:uid(),text:"Customer selections finalized",subgroup:'Blocker'}]},
{id:uid(),name:"#66 — Plumbing Rough In (EZ Plumbing)",milestone:"Rough-Ins",num:"66",category:"SEQ/QC",offsetDays:0,matchPhase:"Plumbing Rough In",items:[{id:uid(),text:"Framing cleaned/swept",subgroup:'Blocker'},{id:uid(),text:"Partition wall studs all installed",subgroup:'Blocker'},{id:uid(),text:"Framers verify no joists are blocking plumbing drains",subgroup:'Blocker'},{id:uid(),text:"All rough-in's to clean/sweep as they go. Leaving clean units for next trade",subgroup:'Blocker'},{id:uid(),text:"Plumbers sweep",subgroup:"QC — Pre-HVAC rough-in"},{id:uid(),text:"Plumbers cleaned up hole cuts",subgroup:"QC — Pre-HVAC rough-in"},{id:uid(),text:"Verify plumber rough selections correct",subgroup:"QC — Pre-HVAC rough-in"},{id:uid(),text:"Plumbers reinstall studs taken out for moving tubs",subgroup:"QC — Pre-HVAC rough-in"}]},
{id:uid(),name:"#71 — Install Temporary Water (EZ Plumbing)",milestone:"Rough-Ins",num:"71",category:"SEQ",offsetDays:0,matchPhase:"Install Temporary Water",items:[{id:uid(),text:"Plumbing to be complete",subgroup:'Blocker'},{id:uid(),text:"curb valve needs to be uncovered and accessible",subgroup:'Blocker'}]},
{id:uid(),name:"#72 — HVAC Rough In (Cooper Mechanical)",milestone:"Rough-Ins",num:"72",category:"SEQ",offsetDays:0,matchPhase:"HVAC Rough In",items:[{id:uid(),text:"HVAC rough requires start 3 days after plumbing start so they get ahead.",subgroup:'Blocker'},{id:uid(),text:"ALL ROUGH-IN's to be working unit by unit so they don't cross over each other's work",subgroup:'Blocker'}]},
{id:uid(),name:"#74 — Back Framing (Bulk Heads) (2111484 AB Ltd.)",milestone:"Rough-Ins",num:"74",category:"SEQ/QC",offsetDays:0,matchPhase:"Back Framing",items:[{id:uid(),text:"Framing complete and framer has QC their work",subgroup:'Blocker'}]},
{id:uid(),name:"#75 — Gas Rough In (EZ Plumbing)",milestone:"Rough-Ins",num:"75",category:"BK",offsetDays:0,matchPhase:"Gas Rough In",items:[{id:uid(),text:"Holding plumbers to schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#76 — Electrical/Low voltage Rough Ins (Custom Electric)",milestone:"Rough-Ins",num:"76",category:"SEQ",offsetDays:0,matchPhase:"Electrical/Low voltage Rough Ins",items:[{id:uid(),text:"3 days start after HVAC start",subgroup:'Blocker'}]},
{id:uid(),name:"#78 — Fire Stopping (Icon Insulation)",milestone:"Rough-Ins",num:"78",category:"SEQ",offsetDays:0,matchPhase:"Fire Stopping",items:[{id:uid(),text:"All rough-in's to be complete",subgroup:'Blocker'},{id:uid(),text:"Flooring layout",subgroup:"QC — Spray Paint"},{id:uid(),text:"All HVAC",subgroup:"QC — Spray Paint"},{id:uid(),text:"All electrical",subgroup:"QC — Spray Paint"},{id:uid(),text:"Shower head roughs at correct height 7ft max",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Booked architectural and structural inspections + city inspections where applicable",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Waterline pressure holding",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Verify all rough selections correct",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Gas exterior stub address tags",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Gas line pressure holding",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Spray paint electric and HVAC (one color is fine)",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Spray paint checklist",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Kitchen OTR vent and wiring centered on range and hidden by cabinet or shroud",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Sawdust sweep/vac",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Order gas meters",subgroup:"QC — Pre-rough city inspections"},{id:uid(),text:"Drywall frame check (drywall foreman) is COMPLETE",subgroup:"QC — Pre-Insulation and Drywall"},{id:uid(),text:"X4 furnace filters each unit",subgroup:"QC — Pre-Insulation and Drywall"},{id:uid(),text:"All walls and floors can be insulated/boarded/taped with respect to mechanical installs",subgroup:"QC — Pre-Insulation and Drywall"}]},
{id:uid(),name:"#80 — Rough in Inspections (Scott)",milestone:"Rough-Ins",num:"80",category:"SEQ/INS",offsetDays:0,matchPhase:"Rough in Inspections",items:[{id:uid(),text:"All rough ins and framing and backframing no to be complete",subgroup:'Blocker'},{id:uid(),text:"Booked architectural and structural inspections + city inspections where applicable",subgroup:'Blocker'}]},
{id:uid(),name:"#59 — Wrap building/Battons/Soffit (Classic Projects Inc.)",milestone:"Exteriors",num:"59",category:"SEQ/LT",offsetDays:0,matchPhase:"Wrap building/Battons/Soffit",items:[{id:uid(),text:"Framing to be complete and roofing done. Power on site for siders",subgroup:'Blocker'}]},
{id:uid(),name:"#60 — Install Roof Plumbing Penetrations (EZ Plumbing)",milestone:"Exteriors",num:"60",category:"BK/SEQ",offsetDays:0,matchPhase:"Install Roof Plumbing Penetrations",items:[{id:uid(),text:"Hold plumbers to schedule",subgroup:'Blocker'},{id:uid(),text:"Framing to be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#63 — Load Roof (Airdrie Roofing)",milestone:"Exteriors",num:"63",category:"SEQ",offsetDays:0,matchPhase:"Load Roof",items:[{id:uid(),text:"Framing to be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#65 — Vinyl decks Install (McLean Contracting)",milestone:"Exteriors",num:"65",category:"SEQ",offsetDays:0,matchPhase:"Vinyl decks Install",items:[{id:uid(),text:"Roofing to be complete and framing to be complete.",subgroup:'Blocker'},{id:uid(),text:"I can get the vinyl boots installed at patio door sills once framing is 2 weeks into work so they can install their patio doors.",subgroup:'Blocker'}]},
{id:uid(),name:"#67 — Roofing (Airdrie Roofing)",milestone:"Exteriors",num:"67",category:"SEQ/QC",offsetDays:0,matchPhase:"Roofing",items:[{id:uid(),text:"Framing to be complete, and framers fix anything the roofer needs BEFORE they come onsite (roof company does a frame check pre-emotive before loading)",subgroup:'Blocker'}]},
{id:uid(),name:"#68 — Siding (Classic Projects Inc.)",milestone:"Exteriors",num:"68",category:"SEQ/LT",offsetDays:0,matchPhase:"Siding",items:[{id:uid(),text:"Lay down area for material on driveway. So driveway needs to be poured 2 weeks prior at minimum",subgroup:'Blocker'}]},
{id:uid(),name:"#69 — Order Exterior Paint and Trough (Josh)",milestone:"Exteriors",num:"69",category:"SEQ",offsetDays:0,matchPhase:"Order Exterior Paint and Trough",items:[{id:uid(),text:"Siding and stucco and stonework done",subgroup:'Blocker'}]},
{id:uid(),name:"#70 — Order/Measure Exterior Rails (Josh)",milestone:"Exteriors",num:"70",category:"SEQ",offsetDays:0,matchPhase:"Order/Measure Exterior Rails",items:[{id:uid(),text:"Framing must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#73 — Exterior Paint and Eavestrough (Classic Projects Inc.)",milestone:"Exteriors",num:"73",category:"SEQ",offsetDays:0,matchPhase:"Exterior Paint and Eavestrough",items:[{id:uid(),text:"Same as 69",subgroup:'Blocker'}]},
{id:uid(),name:"#77 — Exterior Stone (ROVAS Construction)",milestone:"Exteriors",num:"77",category:"SEQ",offsetDays:0,matchPhase:"Exterior Stone",items:[{id:uid(),text:"Siding to be 4 days away from finishing their work",subgroup:'Blocker'},{id:uid(),text:"77 also requires driveway poured",subgroup:'Blocker'}]},
{id:uid(),name:"#79 — Rough Grading and Parging",milestone:"Exteriors",num:"79",category:"SEQ",offsetDays:0,matchPhase:"Rough Grading and Parging",items:[{id:uid(),text:"79 requires all framing and concrete work, siding/stine/stucco comete",subgroup:'Blocker'}]},
{id:uid(),name:"#87 — OH Door Install (Ultra-Lite Overhead Doors)",milestone:"Exteriors",num:"87",category:"SEQ/LT",offsetDays:0,matchPhase:"OH Door Install",items:[{id:uid(),text:"Needs drywall in garages first. 4 week lead time. Power on site for installers to test and doors to lock",subgroup:'Blocker'}]},
{id:uid(),name:"#92 — Exterior Rails (McLean Contracting)",milestone:"Exteriors",num:"92",category:"SEQ",offsetDays:0,matchPhase:"Exterior Rails",items:[{id:uid(),text:"All exterior work must be complete first",subgroup:'Blocker'}]},
{id:uid(),name:"#81 — Insulation (Capital Drywall)",milestone:"Insul/Drywall",num:"81",category:"SEQ/INS",offsetDays:0,matchPhase:"Insulation",items:[{id:uid(),text:"Rough in inspections passed",subgroup:'Blocker'},{id:uid(),text:"all rough-in trades MUST have cleaned and swept before finishing",subgroup:'Blocker'},{id:uid(),text:"Drywall frame check (drywall foreman) is COMPLETE",subgroup:'Blocker'},{id:uid(),text:"x4 furnace filters each unit",subgroup:'Blocker'},{id:uid(),text:"All walls and floors can be insulated/boarded/taped with respect to mechanical installs",subgroup:'Blocker'},{id:uid(),text:"HVAC hood fans proper location to cabinets",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Framed backing to tie-in insulation/poly",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Can I board it? Can I tape it?",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Walls straight for tile",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Floor cut sheets onto windows and tubs/showers",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Party wall studs installed",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Ceiling backing at intersections/dead ends",subgroup:"QC — Pre-Boarding"},{id:uid(),text:"Tub damage",subgroup:"QC — Pre-Boarding"}]},
{id:uid(),name:"#82 — Spray Foam (Capital Drywall)",milestone:"Insul/Drywall",num:"82",category:"SEQ/INS",offsetDays:0,matchPhase:"Spray Foam",items:[{id:uid(),text:"Same (see #81)",subgroup:'Blocker'}]},
{id:uid(),name:"#83 — Insulation Inspection (Capital Drywall)",milestone:"Insul/Drywall",num:"83",category:null,offsetDays:0,matchPhase:"Insulation Inspection",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#84 — Board (Capital Drywall)",milestone:"Insul/Drywall",num:"84",category:"SEQ/LT",offsetDays:0,matchPhase:"Board",items:[{id:uid(),text:"Backframing completed and drywall foreman to provide any framing notes for framer to complete before insulating starts",subgroup:'Blocker'},{id:uid(),text:"Furnaces turned on",subgroup:'Blocker'},{id:uid(),text:"Lay down area on driveway to be shared with siding, so drywallers can have garbage bin space too",subgroup:'Blocker'},{id:uid(),text:"Shower head holes not cut too large",subgroup:"QC — Pre-Taping"},{id:uid(),text:"Long hallways and stairs aren't wavy (dead bodies from frame check)",subgroup:"QC — Pre-Taping"},{id:uid(),text:"OTR vent holes not cut too large",subgroup:"QC — Pre-Taping"},{id:uid(),text:"Floor cut sheets onto windows and tubs/showers",subgroup:"QC — Pre-Taping"},{id:uid(),text:"Buried mechanical items: switches/receptacles/bath fans",subgroup:"QC — Pre-Taping"},{id:uid(),text:"Corners straight for tile",subgroup:"QC — Pre-Taping"},{id:uid(),text:"Basement bulkheads steel framed",subgroup:"QC — Pre-Taping"},{id:uid(),text:"Slokker door stops",subgroup:"QC — Pre-Taping"}]},
{id:uid(),name:"#85 — Tape (Capital Drywall)",milestone:"Insul/Drywall",num:"85",category:"SEQ",offsetDays:0,matchPhase:"Tape",items:[{id:uid(),text:"Boarding to be done",subgroup:'Blocker'}]},
{id:uid(),name:"#86 — Tape Garages",milestone:"Insul/Drywall",num:"86",category:"SEQ/LT",offsetDays:0,matchPhase:"Tape Garages",items:[{id:uid(),text:"OH door install complete.",subgroup:'Blocker'},{id:uid(),text:"Winter needs heaters",subgroup:'Blocker'}]},
{id:uid(),name:"#88 — Texture (Capital Drywall)",milestone:"Insul/Drywall",num:"88",category:"SEQ",offsetDays:0,matchPhase:"Texture",items:[{id:uid(),text:"Furnaces turned on",subgroup:'Blocker'},{id:uid(),text:"Spotless for priming",subgroup:"QC — Pre-S1"},{id:uid(),text:"CHANGE FURNACE FILTER",subgroup:"QC — Pre-S1"},{id:uid(),text:"Textured, sanded, vacuumed on schedule",subgroup:"QC — Pre-S1"},{id:uid(),text:"Vacuum + wipe out showers and tubs",subgroup:"QC — Pre-S1"}]},
{id:uid(),name:"#89 — Drywall Vac (Capital Drywall)",milestone:"Insul/Drywall",num:"89",category:"BK",offsetDays:0,matchPhase:"Drywall Vac",items:[{id:uid(),text:"Holding drywallers to schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#90 — Prime (Super Sam Painting)",milestone:"Finishing",num:"90",category:"SEQ",offsetDays:0,matchPhase:"Prime",items:[{id:uid(),text:"Drywall vac complete",subgroup:'Blocker'}]},
{id:uid(),name:"#91 — Stage 1 Finish Material Delivery (Regal Building Materials)",milestone:"Finishing",num:"91",category:"SEQ",offsetDays:0,matchPhase:"Stage 1 Finish Material Delivery",items:[{id:uid(),text:"Units accessible from driveways.",subgroup:'Blocker'}]},
{id:uid(),name:"#93 — Pre Final (Custom Electric)",milestone:"Finishing",num:"93",category:"BK",offsetDays:0,matchPhase:"Pre Final",items:[{id:uid(),text:"Holding electricians to schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#94 — Stage 1 Finishing (Red Sky Contracting)",milestone:"Finishing",num:"94",category:"SEQ/QC",offsetDays:0,matchPhase:"Stage 1 Finishing",items:[{id:uid(),text:"I need to know locations of tile floor upgrades, and LVP flooring locations.",subgroup:'Blocker'},{id:uid(),text:"all door openings to be correct",subgroup:'Blocker'}]},
{id:uid(),name:"#95 — Install cabinets (Woodcraft Kitchen Cabinets)",milestone:"Finishing",num:"95",category:"BK/LT",offsetDays:0,matchPhase:"Install cabinets",items:[{id:uid(),text:"Holding cabinets to schedule. 4 week lead time",subgroup:'Blocker'}]},
{id:uid(),name:"#96 — Drywall Touch up (Capital Drywall)",milestone:"Finishing",num:"96",category:"SEQ",offsetDays:0,matchPhase:"Drywall Touch up",items:[{id:uid(),text:"Cabinets done and cleaned up",subgroup:'Blocker'}]},
{id:uid(),name:"#97 — Template countertops (OK Granite)",milestone:"Finishing",num:"97",category:"SEQ",offsetDays:0,matchPhase:"Template countertops",items:[{id:uid(),text:"Cabinets installed",subgroup:'Blocker'}]},
{id:uid(),name:"#98 — Paint Vac (Finishing Supervisor/Scott)",milestone:"Finishing",num:"98",category:"SEQ",offsetDays:0,matchPhase:"Paint Vac",items:[{id:uid(),text:"Drywall touch ups done",subgroup:'Blocker'}]},
{id:uid(),name:"#99 — Paint 1st coat (Super Sam Painting)",milestone:"Finishing",num:"99",category:"SEQ",offsetDays:0,matchPhase:"Paint 1st coat",items:[{id:uid(),text:"Lights on.",subgroup:'Blocker'},{id:uid(),text:"Furnace on.",subgroup:'Blocker'},{id:uid(),text:"Floor cut sheets posted",subgroup:"QC — Pre-Flooring"},{id:uid(),text:"Self-level concrete assessed and installed where applicable for LVP (AT FRAME CHECK IDEALLY DONE BEFORE DRYWALL START)",subgroup:"QC — Pre-Flooring"},{id:uid(),text:"Tubs cleaned out for tile workers",subgroup:"QC — Pre-Flooring"},{id:uid(),text:"S1 carpenters correct subfloor locations for tile",subgroup:"QC — Pre-Flooring"},{id:uid(),text:"CHANGE FURNACE FILTER",subgroup:"QC — Pre-Flooring"},{id:uid(),text:"Baseboard installed at correct height carpet vs. LVP",subgroup:"QC — Pre-Flooring"},{id:uid(),text:"Confirm correct flooring and tile delivered",subgroup:"QC — Pre-Flooring"}]},
{id:uid(),name:"#100 — Paint Woodwork (Super Sam Painting)",milestone:"Finishing",num:"100",category:"SEQ",offsetDays:0,matchPhase:"Paint Woodwork",items:[{id:uid(),text:"Same (see #99)",subgroup:'Blocker'}]},
{id:uid(),name:"#101 — Schedule Possession/walkthrough dates (Stacie)",milestone:"Finishing",num:"101",category:null,offsetDays:0,matchPhase:"Schedule Possession/walkthrough dates",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#102 — Install Granite/Quartz Countertops (OK Granite)",milestone:"Finishing",num:"102",category:"SEQ",offsetDays:0,matchPhase:"Install Granite/Quartz Countertops",items:[{id:uid(),text:"I need to know correct customer selections for cohnters",subgroup:'Blocker'}]},
{id:uid(),name:"#103 — Flooring delivery (CSM Interiors)",milestone:"Finishing",num:"103",category:"SEQ",offsetDays:0,matchPhase:"Flooring delivery",items:[{id:uid(),text:"All previous trades cleaned up. Lay down area accessible and not blocking painters",subgroup:'Blocker'}]},
{id:uid(),name:"#104 — Tile (CSM Interiors)",milestone:"Finishing",num:"104",category:"QC",offsetDays:0,matchPhase:"Tile",items:[{id:uid(),text:"At framing stage, need to check all tile locations that framing is plumb and not bowed anywhere",subgroup:'Blocker'}]},
{id:uid(),name:"#105 — LVP (CSM Interiors)",milestone:"Finishing",num:"105",category:"SEQ/LT",offsetDays:0,matchPhase:"LVP",items:[{id:uid(),text:"Need to know LVP locations so framers can adjust stair nosing at framing if necessary",subgroup:'Blocker'},{id:uid(),text:"a 4 week lead time on self-leveling concrete. It has to be assessed and leveled at rough-in stage so it is ready for LVP",subgroup:'Blocker'},{id:uid(),text:"Tile/granite backsplash installed",subgroup:"QC — Pre-OTR"},{id:uid(),text:"Correct OTR/hood fans delivered as per selections/CO's",subgroup:"QC — Pre-OTR"}]},
{id:uid(),name:"#106 — Measure Mirrors/Shower Glass (Regal Shelf & Mirror)",milestone:"Finishing",num:"106",category:"SEQ",offsetDays:0,matchPhase:"Measure Mirrors/Shower Glass",items:[{id:uid(),text:"Tile must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#107 — Measure Wire shelves (Regal Shelf & Mirror)",milestone:"Finishing",num:"107",category:"SEQ",offsetDays:0,matchPhase:"Measure Wire shelves",items:[{id:uid(),text:"Same (see #106)",subgroup:'Blocker'}]},
{id:uid(),name:"#108 — Slokker QC (Finishing Supervisor/Scott)",milestone:"Finishing",num:"108",category:"SEQ",offsetDays:0,matchPhase:"Slokker QC",items:[{id:uid(),text:"Flooring must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#109 — Carpet (CSM Interiors)",milestone:"Finishing",num:"109",category:"SEQ/LT",offsetDays:0,matchPhase:"Carpet",items:[{id:uid(),text:"Same as LVP (see #105)",subgroup:'Blocker'},{id:uid(),text:"Floor protection put down",subgroup:"QC — Pre-S2 Carpentry"},{id:uid(),text:"Cleaned/sweeped of garbage and dust",subgroup:"QC — Pre-S2 Carpentry"},{id:uid(),text:"S2 hardware correct delivery",subgroup:"QC — Pre-S2 Carpentry"},{id:uid(),text:"Flooring done installation",subgroup:"QC — Pre-S2 Carpentry"},{id:uid(),text:"HVAC holes cut out",subgroup:"QC — Pre-S2 Carpentry"},{id:uid(),text:"Swiffer LVP",subgroup:"QC — Pre-S2 Carpentry"}]},
{id:uid(),name:"#110 — Floor QC (CSM Interiors)",milestone:"Finishing",num:"110",category:"SEQ",offsetDays:0,matchPhase:"Floor QC",items:[{id:uid(),text:"Same as Slokker QC (see #108)",subgroup:'Blocker'}]},
{id:uid(),name:"#111 — Stage 2 Finish Material Delivery (Regal Building Materials)",milestone:"Finishing",num:"111",category:"SEQ",offsetDays:0,matchPhase:"Stage 2 Finish Material Delivery",items:[{id:uid(),text:"Need to know customer selections so we receive correct hardware",subgroup:'Blocker'}]},
{id:uid(),name:"#112 — Deliver OTR/Hoodfan (The Brick Warehouse)",milestone:"Finishing",num:"112",category:"SEQ",offsetDays:0,matchPhase:"Deliver OTR/Hoodfan",items:[{id:uid(),text:"Tile must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#113 — Stage 2 Finishing (Red Sky Contracting)",milestone:"Finishing",num:"113",category:"LT/SEQ",offsetDays:0,matchPhase:"Stage 2 Finishing",items:[{id:uid(),text:"All stage 2 delivery must be on site and no backorders",subgroup:'Blocker'},{id:uid(),text:"Painters to DAP and paint laundry room after stage 2 carpenters.",subgroup:'Blocker'},{id:uid(),text:"Laundry room doors removed",subgroup:'Blocker'},{id:uid(),text:"CHANGE FURNACE FILTER",subgroup:"QC — Pre-Trade Finals"},{id:uid(),text:"S2 carpenter done and cleaned up",subgroup:"QC — Pre-Trade Finals"},{id:uid(),text:"Flooring done and ready for HVAC final",subgroup:"QC — Pre-Trade Finals"}]},
{id:uid(),name:"#114 — Install OTR/Hoodfan (The Brick Warehouse)",milestone:"Finishing",num:"114",category:"SEQ",offsetDays:0,matchPhase:"Install OTR/Hoodfan",items:[{id:uid(),text:"Same as deliver (see #112)",subgroup:'Blocker'}]},
{id:uid(),name:"#115 — Deliver Light fixtures (Signature Lighting)",milestone:"Finishing",num:"115",category:null,offsetDays:0,matchPhase:"Deliver Light fixtures",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#116 — Install Mirrors (Regal Shelf & Mirror)",milestone:"Finishing",num:"116",category:"BK",offsetDays:0,matchPhase:"Install Mirrors",items:[{id:uid(),text:"Holding schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#117 — Install shower glass (Regal Shelf & Mirror)",milestone:"Finishing",num:"117",category:"BK",offsetDays:0,matchPhase:"Install shower glass",items:[{id:uid(),text:"Same (see #116)",subgroup:'Blocker'}]},
{id:uid(),name:"#118 — Install Wire Shelving (Regal Shelf & Mirror)",milestone:"Finishing",num:"118",category:"BK",offsetDays:0,matchPhase:"Install Wire Shelving",items:[{id:uid(),text:"Same (see #116)",subgroup:'Blocker'}]},
{id:uid(),name:"#119 — Cabinet Final (Woodcraft Kitchen Cabinets)",milestone:"Finishing",num:"119",category:"SEQ",offsetDays:0,matchPhase:"Cabinet Final",items:[{id:uid(),text:"Flooring must be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#120 — Electrical Final (Custom Electric)",milestone:"Finishing",num:"120",category:"BK",offsetDays:0,matchPhase:"Electrical Final",items:[{id:uid(),text:"Holding schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#121 — HVAC Final (Cooper Mechanical)",milestone:"Finishing",num:"121",category:"BK",offsetDays:0,matchPhase:"HVAC Final",items:[{id:uid(),text:"Same (see #120)",subgroup:'Blocker'}]},
{id:uid(),name:"#122 — DCP Inspection (Finishing Supervisor/Scott/Stacie)",milestone:"Finishing",num:"122",category:"SEQ",offsetDays:0,matchPhase:"DCP Inspection",items:[{id:uid(),text:"All exterior work and landscaping conplete",subgroup:'Blocker'}]},
{id:uid(),name:"#123 — Appliance delivery (The Brick Warehouse)",milestone:"Finishing",num:"123",category:"SEQ",offsetDays:0,matchPhase:"Appliance delivery",items:[{id:uid(),text:"Painters to DAP and paint laundry room after stage 2 carpenters.",subgroup:'Blocker'},{id:uid(),text:"Laundry room doors removed",subgroup:'Blocker'}]},
{id:uid(),name:"#124 — Architectural/Mech Final Inspection (Finishing Supervisor/Scott)",milestone:"Finishing",num:"124",category:"SEQ",offsetDays:0,matchPhase:"Architectural/Mech Final Inspection",items:[{id:uid(),text:"All work completed",subgroup:'Blocker'}]},
{id:uid(),name:"#125 — Plumbing Final (EZ Plumbing)",milestone:"Finishing",num:"125",category:"BK",offsetDays:0,matchPhase:"Plumbing Final",items:[{id:uid(),text:"Holding schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#126 — Appliance Install (The Brick Warehouse)",milestone:"Finishing",num:"126",category:"SEQ/QC",offsetDays:0,matchPhase:"Appliance Install",items:[{id:uid(),text:"Plumbing final must be complete and appliance delivery needs to bring correct appliances and place them in correct locations; laundry stacked and place inside laundry room",subgroup:'Blocker'}]},
{id:uid(),name:"#127 — C-2 Schedules Sign off (Finishing Supervisor/Scott)",milestone:"Finishing",num:"127",category:"SEQ",offsetDays:0,matchPhase:"C-2 Schedules Sign off",items:[{id:uid(),text:"Same architectural (see #124)",subgroup:'Blocker'}]},
{id:uid(),name:"#128 — Drywall touchups & sand (Capital Drywall)",milestone:"Finishing",num:"128",category:"BK",offsetDays:0,matchPhase:"Drywall touchups & sand",items:[{id:uid(),text:"Holding schedule",subgroup:'Blocker'}]},
{id:uid(),name:"#129 — Window Final (Centra Windows)",milestone:"Finishing",num:"129",category:null,offsetDays:0,matchPhase:"Window Final",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#130 — Order Water Meters",milestone:"Finishing",num:"130",category:"SEQ/LT",offsetDays:0,matchPhase:"Order Water Meters",items:[{id:uid(),text:"Plumbing final must be done, and 1 week lead time on install",subgroup:'Blocker'}]},
{id:uid(),name:"#131 — Construction Clean (Pierrefect Cleaning)",milestone:"Finishing",num:"131",category:"SEQ",offsetDays:0,matchPhase:"Construction Clean",items:[{id:uid(),text:"All previous work must be done and cleaned up. Extra material removed and not just left in units",subgroup:'Blocker'},{id:uid(),text:"construction clean also requires drywall touch up to be done",subgroup:'Blocker'},{id:uid(),text:"Con walk to-do list done (Slokker staff + YOU)",subgroup:"QC — Pre-Final Inspection and Appliances"},{id:uid(),text:"CONSTRUCTION IS COMPLETE AND ALL IS READY FOR FINAL INSPECTION",subgroup:"QC — Pre-Final Inspection and Appliances"},{id:uid(),text:"Correct appliances delivered",subgroup:"QC — Pre-Final Inspection and Appliances"},{id:uid(),text:"HERITAGES ONLY: remove laundry room doors and DAP baseboard",subgroup:"QC — Pre-Final Inspection and Appliances"},{id:uid(),text:"Organize cabinets",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Install BELLA powder room mirrors",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Sweep/pressure wash garages/driveways/porches/decks/patios",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"All mechanical OPERATIONAL AND SECURED",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"WOCD locks OPERATIONAL AND SECURED",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Garage door remotes x2 into kitchen drawer with all appliance manuals",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Smoke detector shower caps",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Paint tag out",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Drydex garage man doors",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Appliance clocks",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Mechanical room spotless",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Remove protective film on exterior door latches and sills",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"CHANGE FURNACE FILTER",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Bipass door bumpers",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Handrail brackets reinstalled by painters",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Black entry mat",subgroup:"QC — Con Walk and Pre-Occupancy: Con Walk"},{id:uid(),text:"Mech room panel labels",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Lights",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Smoke detectors",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Appliances",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Hot water tanks",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Bath fans",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Ventilation fan switch",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Outlets/switches",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Humidifier",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Tubs/sinks",subgroup:"QC — Con Walk and Pre-Occupancy: Stress Tests"},{id:uid(),text:"Exterior cleaned and graded for safety",subgroup:"QC — Con Walk and Pre-Occupancy: Exterior Pre-Occ"},{id:uid(),text:"Safe access to units",subgroup:"QC — Con Walk and Pre-Occupancy: Exterior Pre-Occ"},{id:uid(),text:"Utilities safe access and/or closed and secured",subgroup:"QC — Con Walk and Pre-Occupancy: Exterior Pre-Occ"}]},
{id:uid(),name:"#132 — Paint 2nd coat (Super Sam Painting)",milestone:"Finishing",num:"132",category:"SEQ",offsetDays:0,matchPhase:"Paint 2nd coat",items:[{id:uid(),text:"construction clean to be done",subgroup:'Blocker'}]},
{id:uid(),name:"#133 — Construction Walk Through (Finishing Supervisor/Scott)",milestone:"Finishing",num:"133",category:"SEQ",offsetDays:0,matchPhase:"Construction Walk Through",items:[{id:uid(),text:"All work must be done prior and construction clean done. This can overlap 2nd coat paint on scheduling",subgroup:'Blocker'}]},
{id:uid(),name:"#134 — Construction tag touch up (Super Sam Painting)",milestone:"Finishing",num:"134",category:"SEQ",offsetDays:0,matchPhase:"Construction tag touch up",items:[{id:uid(),text:"2nd coat paint to be done",subgroup:'Blocker'}]},
{id:uid(),name:"#135 — Furnace Clean (Alberta Home Services)",milestone:"Finishing",num:"135",category:"LT",offsetDays:0,matchPhase:"Furnace Clean",items:[{id:uid(),text:"2 week lead time, order in advance",subgroup:'Blocker'}]},
{id:uid(),name:"#136 — Final City Inspection (Finishing Supervisor/Scott)",milestone:"Finishing",num:"136",category:"SEQ",offsetDays:0,matchPhase:"Final City Inspection",items:[{id:uid(),text:"All work to be completed and verified any city inspection items pre-emptively caught and fixed before inspection (I already have a separate list)",subgroup:'Blocker'}]},
{id:uid(),name:"#137 — Pre-occ clean (Pierrefect Cleaning)",milestone:"Finishing",num:"137",category:null,offsetDays:0,matchPhase:"Pre-occ clean",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#138 — Post Substantial Completion (Whole Building) (Finishing Supervisor/Scott/Stacie)",milestone:"Finishing",num:"138",category:null,offsetDays:0,matchPhase:"Post Substantial Completion",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#139 — Pre-occ walkthrough (Stacie)",milestone:"Finishing",num:"139",category:"SEQ",offsetDays:0,matchPhase:"Pre-occ walkthrough",items:[{id:uid(),text:"Construction QC items to be complete",subgroup:'Blocker'}]},
{id:uid(),name:"#140 — Correct Deficiencies (Finishing Supervisor/Scott)",milestone:"Finishing",num:"140",category:"BK",offsetDays:0,matchPhase:"Correct Deficiencies",items:[{id:uid(),text:"Holding schedule. 48 hour due date",subgroup:'Blocker'}]},
{id:uid(),name:"#141 — Owner Tag touch up (Super Sam Painting)",milestone:"Finishing",num:"141",category:"BK",offsetDays:0,matchPhase:"Owner Tag touch up",items:[{id:uid(),text:"Holding schedule. 48 hour due date",subgroup:'Blocker'}]},
{id:uid(),name:"#142 — Possession Clean (Pierrefect Cleaning)",milestone:"Finishing",num:"142",category:null,offsetDays:0,matchPhase:"Possession Clean",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
{id:uid(),name:"#143 — Possession (Stacie)",milestone:"Finishing",num:"143",category:"SEQ",offsetDays:0,matchPhase:"Possession",exactMatch:true,items:[{id:uid(),text:"All previous touch ups and fixes complete",subgroup:'Blocker'},{id:uid(),text:"Cleaners done",subgroup:"QC — Possession"},{id:uid(),text:"Humidifier plugged in and ON",subgroup:"QC — Possession"},{id:uid(),text:"Check all sinks appliances WATER ON",subgroup:"QC — Possession"},{id:uid(),text:"Doors rekey",subgroup:"QC — Possession"},{id:uid(),text:"Cabinets organized",subgroup:"QC — Possession"},{id:uid(),text:"Appliance clocks",subgroup:"QC — Possession"}]},
{id:uid(),name:"#144 — Release Holdback (Whole Building) (Stephanie Shepherd)",milestone:"Finishing",num:"144",category:null,offsetDays:0,matchPhase:"Release Holdback",items:[{id:uid(),text:"None",subgroup:'Blocker'}]},
];
PHASE_CHECKLIST_SEED.forEach(g => { g.estimatedMinutes = 15; });

// offsetDays: days BEFORE the matched schedule finish date the item is due.
// matchPhase: text used to match against synced schedule event subjects (case-insensitive substring).
const DEFAULT_MASTER = [
  {id:uid(), name:'Backing / Blocking Verification', milestone:'Framing', area:'All Rooms', offsetDays:5, matchPhase:'framing', notes:'Grab bars, floating vanities, wall-hung TV, heavy shelving — verify backing present before cover-up.'},
  {id:uid(), name:'Pre-Drywall Backing Re-Check', milestone:'Drywall', area:'All Rooms', offsetDays:2, matchPhase:'board', notes:'Last chance to confirm backing before it is covered.'},
];

/* ---------- state ---------- */
let state = { units:[], master:[], instances:[], defs:[], schedule:[], checklistGroups:[], groupInstances:[], planOrder:[], safetyWalkthroughs:[] };
let activeTab = 'today';
let selectedScheduleUnit = null;
let selectedLogDate = null;
let expandedGroupIds = new Set();
let expandedPhaseOverflow = new Set();
let expandedUnitDefs = new Set();
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
  state.dailyAllowanceMinutes = await sget('dailyAllowanceMinutes', 240);
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
  await migrateChecklistMatchPhases();
  await migrateSafetyWalkthroughShape();
  await migratePhaseChecklistRewrite_v1();
  await migratePossessionExactMatch_v1();
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
    s.subject && (group.exactMatch ? s.subject.trim().toLowerCase()===phase : s.subject.toLowerCase().includes(phase)) &&
    s.finishDate
  );
  if(matches.length===0) return null;
  const finish = matches.map(m=>m.finishDate).sort()[0];
  return addDays(finish, -group.offsetDays);
}
/* Finds the checklist group whose matchPhase corresponds to a unit's
   currently-selected phase (Log Round's Current Phase dropdown, itself
   pulled from real schedule subjects — see scheduleSubjectOptions above),
   so that phase's checklist can be surfaced directly instead of making
   Josh hunt for it in the full group list. */
function currentPhaseChecklistGroup(u){
  if(!u.currentPhase) return null;
  const phase = u.currentPhase.toLowerCase();
  return state.checklistGroups.find(g => g.matchPhase && phase.includes(g.matchPhase.toLowerCase())) || null;
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
  const budget = state.dailyAllowanceMinutes || 240;

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
    );

  // Phase checks are never time-budgeted or deferrable — only Josh's own
  // deficiencies compete for his daily allowance, since a phase check isn't a
  // block of Josh's personal time the way his own deficiency is.
  const phaseToday = [];
  for(const u of state.units){
    if(!u.active) continue;
    for(const gi of state.groupInstances.filter(x=>x.unitId===u.id)){
      const g = state.checklistGroups.find(x=>x.id===gi.groupId);
      if(!g) continue;
      const due = gi.dueOverride || groupDueDate(u.id, g);
      if(!due || due>today) continue;
      const {done,total} = groupCompletion(gi, g);
      if(done>=total) continue;
      phaseToday.push({type:'phase', due, unit:u, group:g, groupInstance:gi});
    }
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

