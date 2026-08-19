/* ---------- rendering ---------- */
const app = document.getElementById('app');

function setHeader(){
  const d = new Date();
  document.getElementById('headerTitle').textContent = 'Site Log';
  document.getElementById('headerSub').textContent = d.toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'});
}

function render(){
  const scrollY = window.scrollY;
  if(activeTab==='today') renderToday();
  else if(activeTab==='brief') renderBrief();
  else if(activeTab==='units') renderUnits();
  else if(activeTab==='master') renderMaster();
  else if(activeTab==='defs') renderDefs();
  else if(activeTab==='log') renderLog();
  else if(activeTab==='schedule') renderSchedule();
  else if(activeTab==='sync') renderSync();
  window.scrollTo(0, scrollY);
}

function renderBrief(){
  const today = todayISO();
  const tomorrow = addDays(today, 1);

  const openDefs = state.defs.filter(d=>d.status!=='Done' && isUnitActiveByLocation(d.location));
  const plan = buildSuggestedPlan();
  const tradeDueSoon = openDefs.filter(d=>d.owner==='Trade' && d.dueDate && d.dueDate<=tomorrow);
  const tradeOpenNoDue = openDefs.filter(d=>d.owner==='Trade' && !d.dueDate);
  const backlogCount = openDefs.filter(d=>(d.pushCount||0)>=1).length;

  const checklistOverdue = [], checklistDueToday = [], checklistCompletedToday = [];
  for(const inst of state.instances){
    const {m,u,due} = instanceInfo(inst);
    if(!m||!u||!u.active) continue;
    if(inst.status==='Done' && inst.completedDate===today) checklistCompletedToday.push(`${u.name}: ${m.name}`);
    else if(due===today) checklistDueToday.push(`${u.name}: ${m.name}`);
    else if(due && due<today && inst.status!=='Done') checklistOverdue.push(`${u.name}: ${m.name}`);
  }

  const finishingSoon = state.schedule.filter(e=>e.finishDate && e.finishDate>=today && e.finishDate<=tomorrow)
    .sort((a,b)=>(a.finishDate||'').localeCompare(b.finishDate||''));

  let html = `<div class="section-title">Daily Brief — ${fmtDate(today)}</div>`;

  html += renderSafetyWalkthroughSection();

  html += `<div class="section-title" style="margin-top:14px;">Suggested Plan<span class="pill">${plan.used}/${plan.budget}m</span></div>`;
  if(plan.selected.length===0){
    html += `<div class="empty">Nothing of yours due or overdue today.</div>`;
  } else {
    html += `<div id="planScheduleList">` + applyManualOrder(plan.selected).map(item => draggableScheduleItem(item, item.type==='def'
      ? cardForDef(item.ref, dueStatus(item.ref.dueDate, item.ref.status))
      : planPhaseCard(item)
    )).join('') + `</div>`;
  }
  if(plan.deferred.length>0){
    html += `<div class="section-title" style="margin-top:10px;">Didn't Fit Today<span class="pill">${plan.deferred.length}</span></div>`;
    html += plan.deferred.map(item=>deferredItemRow(item)).join('');
  }
  html += renderUpcomingScheduleSection();

  html += `<div class="section-title">Trade — Due Today/Tomorrow<span class="pill">${tradeDueSoon.length}</span></div>`;
  html += tradeDueSoon.length ? tradeDueSoon.map(d=>cardForDef(d, dueStatus(d.dueDate, d.status))).join('') : `<div class="empty">None due soon.</div>`;

  html += `<div class="section-title">Trade — Open, No Due Date<span class="pill">${tradeOpenNoDue.length}</span></div>`;
  html += tradeOpenNoDue.length ? tradeOpenNoDue.map(d=>cardForDef(d, dueStatus(d.dueDate, d.status))).join('') : `<div class="empty">None.</div>`;

  html += `<div class="section-title">Buildertrend — Finishing Today/Tomorrow<span class="pill">${finishingSoon.length}</span></div>`;
  if(finishingSoon.length){
    for(const e of finishingSoon){
      html += `<div class="card"><div class="row"><div style="font-size:13px;">${escapeHtml(e.location)} — ${escapeHtml(e.subject)}</div><div class="item-meta">${fmtDate(e.finishDate)}</div></div></div>`;
    }
  } else html += `<div class="empty">Nothing finishing today or tomorrow.</div>`;

  html += `<div class="section-title">Phase Checks</div>`;
  html += `<div class="card">
    <div class="item-meta"><b>${checklistOverdue.length}</b> overdue</div>
    <div class="item-meta"><b>${checklistDueToday.length}</b> due today</div>
    <div class="item-meta"><b>${checklistCompletedToday.length}</b> completed today</div>
  </div>`;

  html += `<div class="empty" style="margin-top:8px;">Backlog (pushed items): ${backlogCount}</div>`;

  app.innerHTML = html;
  wireCardActions();
  wireScheduleActions();
  wireDragReorder();
  wireSafetyWalkthroughActions();
}

/* Wraps a scheduled-plan card with a drag handle so Josh can reorder today's
   list by hand. Uses Pointer Events (not native HTML5 drag-and-drop, which
   doesn't work reliably on mobile Safari/touch) so it works the same on
   phone and desktop. */
function draggableScheduleItem(item, innerHtml){
  const planId = scheduleItemKey(item);
  return `<div class="plan-schedule-item" data-planid="${escapeHtml(planId)}">
    <div class="drag-handle" title="Drag to reorder">⠿</div>
    <div class="plan-schedule-item-body">${innerHtml}</div>
  </div>`;
}

function wireDragReorder(){
  const container = document.getElementById('planScheduleList');
  if(!container) return;
  container.querySelectorAll('.drag-handle').forEach(handle=>{
    handle.addEventListener('pointerdown', (e)=>{
      e.preventDefault();
      const dragEl = handle.closest('.plan-schedule-item');
      dragEl.classList.add('dragging');

      const onMove = (ev)=>{
        // Find the item whose midpoint sits just below the pointer, and drop
        // dragEl right before it (or at the end if the pointer is past everyone).
        let afterElement = null, closestOffset = -Infinity;
        for(const child of container.querySelectorAll('.plan-schedule-item:not(.dragging)')){
          const box = child.getBoundingClientRect();
          const offset = ev.clientY - box.top - box.height/2;
          if(offset < 0 && offset > closestOffset){ closestOffset = offset; afterElement = child; }
        }
        if(afterElement) container.insertBefore(dragEl, afterElement);
        else container.appendChild(dragEl);
      };
      const onUp = ()=>{
        dragEl.classList.remove('dragging');
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        const newOrder = [...container.querySelectorAll('.plan-schedule-item')].map(el=>el.dataset.planid);
        savePlanOrder(newOrder);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  });
}

/* Daily safety walkthrough: a free-text on-site/paperwork note plus hazard
   photos, one record per calendar day, site-wide. Shown first on Brief -
   safety always comes before everything else in this app. */
function renderSafetyWalkthroughSection(){
  const w = todaySafetyWalkthrough();
  let html = `<div class="section-title">Daily Safety Walkthrough</div>`;
  if(!w){
    html += `<div class="card"><button class="btn" id="startWalkthroughBtn" style="width:100%;">Start Today's Walkthrough</button></div>`;
    return html;
  }
  html += `<div class="card">
    <label>On-Site &amp; Paperwork Notes</label>
    <textarea id="walkthroughNotes" style="min-height:60px;" placeholder="Who's on site today, and have they filled out their daily paperwork?">${escapeHtml(w.onSiteNotes||'')}</textarea>
    <button class="btn small ghost" id="saveWalkthroughNotesBtn" style="margin-top:8px;">Save Notes</button>
  </div>`;
  html += `<div class="item-meta" style="margin:10px 4px 6px; font-weight:700;">Hazard Photos<span class="pill" style="margin-left:6px;">${w.hazards.length}</span></div>`;
  if(w.hazards.length){
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;">`;
    for(const h of w.hazards){
      html += `<div class="hazard-photo">
        <img src="${escapeHtml(h.photoUrl)}" alt="Hazard photo">
        <button class="hazard-photo-remove" data-hazardid="${escapeHtml(h.id)}">×</button>
      </div>`;
    }
    html += `</div>`;
  }
  html += `<input type="file" accept="image/*" capture="environment" id="hazardPhotoInput" style="display:none;">
    <button class="btn small" id="addHazardPhotoBtn">+ Add Hazard Photo</button>`;
  return html;
}

function wireSafetyWalkthroughActions(){
  const startBtn = document.getElementById('startWalkthroughBtn');
  if(startBtn) startBtn.onclick = async()=>{ await ensureTodayWalkthrough(); render(); };

  const saveNotesBtn = document.getElementById('saveWalkthroughNotesBtn');
  if(saveNotesBtn) saveNotesBtn.onclick = async()=>{
    const w = todaySafetyWalkthrough();
    if(!w) return;
    await saveWalkthroughNotes(w.id, document.getElementById('walkthroughNotes').value);
    showToast('Notes saved.');
  };

  const addPhotoBtn = document.getElementById('addHazardPhotoBtn');
  const photoInput = document.getElementById('hazardPhotoInput');
  if(addPhotoBtn && photoInput){
    addPhotoBtn.onclick = ()=>photoInput.click();
    photoInput.onchange = async(e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const originalLabel = addPhotoBtn.textContent;
      addPhotoBtn.disabled = true; addPhotoBtn.textContent = 'Uploading…';
      const url = await uploadHazardPhoto(file);
      addPhotoBtn.disabled = false; addPhotoBtn.textContent = originalLabel;
      photoInput.value = '';
      if(!url){ showToast("Couldn't upload photo — check your connection and try again."); return; }
      const w = todaySafetyWalkthrough();
      await addHazardPhoto(w.id, url);
      render();
    };
  }

  document.querySelectorAll('.hazard-photo-remove').forEach(b=>b.onclick=(e)=>{
    const hazardId = e.target.dataset.hazardid;
    const w = todaySafetyWalkthrough();
    showConfirm('Remove this hazard photo?', async()=>{
      await removeHazardPhoto(w.id, hazardId);
      render();
    });
  });
}

/* One overflow (didn't-fit-budget) row from buildSuggestedPlan()'s deferred
   list, with a way to schedule it to a future day (see plannedDate below). */
function deferredItemRow(item){
  const isDef = item.type==='def';
  const planId = isDef ? 'd_'+item.ref.id : 'c_'+item.groupInstance.id;
  const name = isDef ? item.ref.description : item.group.name;
  const site = isDef ? item.ref.location : item.unit.name;
  const plannedDate = isDef ? item.ref.plannedDate : item.groupInstance.plannedDate;
  return `<div class="card" data-planid="${escapeHtml(planId)}">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(name)}</div>
        <div class="item-meta">${escapeHtml(site||'—')}${item.due?' · due '+fmtDate(item.due):''} · ${item.minutes}m</div>
        ${plannedDate?`<div class="item-meta">You planned this for ${fmtDate(plannedDate)} · <a href="#" class="plan-clear-date">clear</a></div>`:''}
      </div>
    </div>
    <div class="row" style="margin-top:8px; gap:6px;">
      <input type="date" class="plan-quickdate" style="margin-top:0;" min="${addDays(todayISO(),1)}" value="${plannedDate||''}">
      <button class="btn small plan-savedate">Schedule</button>
    </div>
  </div>`;
}

/* The forward-looking schedule Josh builds by hand over time, one "Schedule"
   tap at a time from the deferred list above - never written by the agent,
   never touches a real due date. Grouped by day so it reads like an actual
   plan, not just a pile of dated tasks. */
function renderUpcomingScheduleSection(){
  const items = upcomingPlannedTasks();
  if(items.length===0) return '';
  let html = `<div class="section-title" style="margin-top:14px;">Your Upcoming Schedule<span class="pill">${items.length}</span></div>`;
  let lastDate = null;
  for(const it of items){
    if(it.plannedDate !== lastDate){
      html += `<div class="item-meta" style="font-weight:700; margin:8px 4px 2px;">${fmtDate(it.plannedDate)}</div>`;
      lastDate = it.plannedDate;
    }
    html += `<div class="card" data-planid="${escapeHtml(it.id)}">
      <div class="row"><div>
        <div class="item-name">${escapeHtml(it.name)}</div>
        <div class="item-meta">${escapeHtml(it.site||'—')}</div>
      </div>
      <a href="#" class="plan-clear-date" style="font-size:12px;">clear</a>
      </div>
    </div>`;
  }
  return html;
}

function wireScheduleActions(){
  document.querySelectorAll('.plan-savedate').forEach(b=>b.onclick=async(e)=>{
    const card = e.target.closest('[data-planid]');
    const id = card.dataset.planid;
    const val = card.querySelector('.plan-quickdate').value;
    if(!val){ showToast('Pick a date first.'); return; }
    await setPlannedDate(id, val);
    showToast('Scheduled.');
    render();
  });
  document.querySelectorAll('.plan-quickdate').forEach(el=>el.onclick=(e)=>e.stopPropagation());
  document.querySelectorAll('.plan-clear-date').forEach(a=>a.onclick=async(e)=>{
    e.preventDefault();
    const id = e.target.closest('[data-planid]').dataset.planid;
    await clearPlannedDate(id);
    render();
  });
}

function renderToday(){
  const rows = state.instances.map(inst=>{
    const {m,u,due} = instanceInfo(inst);
    if(!m||!u||!u.active) return null;
    return {inst,m,u,due,st:dueStatus(due, inst.status)};
  }).filter(Boolean).filter(r=>r.st==='overdue'||r.st==='today');

  const defRows = state.defs.filter(d=>d.status!=='Done' && isUnitActiveByLocation(d.location)).map(d=>{
    return {d,st:dueStatus(d.dueDate, d.status)};
  }).filter(r=>r.st==='overdue'||r.st==='today');

  rows.sort((a,b)=> (a.due||'').localeCompare(b.due||''));

  let html = `<div class="section-title">Checklist — Due Today / Overdue<span class="pill">${rows.length}</span></div>`;
  if(rows.length===0) html += `<div class="empty">Nothing due today or overdue. Nice.</div>`;
  for(const r of rows){
    html += cardForInstance(r.inst, r.m, r.u, r.due, r.st);
  }

  html += `<div class="section-title">Deficiencies — Due Today / Overdue<span class="pill">${defRows.length}</span></div>`;
  if(defRows.length===0) html += `<div class="empty">No deficiencies due.</div>`;
  for(const r of defRows){
    html += cardForDef(r.d, r.st);
  }
  app.innerHTML = html;
  wireCardActions();
}

function cardForInstance(inst, m, u, due, st){
  return `<div class="card ${st}" data-inst="${inst.id}">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(m.name)}</div>
        <div class="item-meta">${escapeHtml(u.name)} · ${escapeHtml(m.milestone)}${m.area?' · '+escapeHtml(m.area):''} · due ${fmtDate(due)}</div>
      </div>
      <span class="stamp ${st}">${st==='done'?'Done':st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span>
    </div>
    <div class="row" style="margin-top:10px; gap:6px;">
      <button class="btn small done-btn act-done">Mark Done</button>
      <button class="btn small ghost act-push">Push</button>
    </div>
  </div>`;
}

function planPhaseCard(item){
  const st = dueStatus(item.due, 'Open');
  return `<div class="card ${st} plan-phase-card" data-unitid="${item.unit.id}" style="cursor:pointer;">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(item.group.name)}</div>
        <div class="item-meta">${escapeHtml(item.unit.name)} · Phase Check · due ${fmtDate(item.due)} · ${item.minutes}m</div>
      </div>
      <span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span>
    </div>
  </div>`;
}

function priorityTag(d){
  if(d.priority==='High') return ` · <b style="color:var(--stamp-red);">HIGH</b>`;
  if(d.priority==='Low') return ` · <span style="opacity:0.6;">low</span>`;
  return '';
}

function categoryTag(d){
  if(d.category==='Safety') return ` · <b style="color:var(--stamp-red);">⚠ SAFETY</b>`;
  return '';
}

function cardForDef(d, st){
  return `<div class="card ${st} def-card" data-def="${d.id}" style="cursor:pointer;">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(d.description)}</div>
        <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):''}${d.status==='WAIT'?' · WAITING':''}${d.pushReason?' · '+escapeHtml(d.pushReason):''}${d.estimatedMinutes?' · '+d.estimatedMinutes+'m':''}${d.plannedDate?' · planned '+fmtDate(d.plannedDate):''}${priorityTag(d)}${categoryTag(d)}</div>
      </div>
      <span class="stamp ${st}">${st==='done'?'Done':st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span>
    </div>
    <div class="row" style="margin-top:10px; gap:6px;">
      <button class="btn small done-btn defact-done">Mark Done</button>
    </div>
  </div>`;
}

const ESTIMATE_MINUTE_OPTIONS = [5, 10, 30, 60, 120];
function estimateOptionsHtml(selected){
  const sel = selected ? Number(selected) : null;
  return `<option value="">—</option>` + ESTIMATE_MINUTE_OPTIONS.map(m=>
    `<option value="${m}" ${sel===m?'selected':''}>${m} min</option>`
  ).join('');
}

/* Marks a deficiency done. Josh-owned items get asked how long it actually
   took first (builds real actual-vs-estimate history); Trade-owned items
   don't need that since Trade time was never budgeted in the first place. */
function markDefDoneWithTimeCheck(id, onComplete){
  const d = state.defs.find(x=>x.id===id);
  if(!d){ showToast('Could not find that deficiency — try reloading.'); return; }
  if(d.owner!=='Josh'){
    (async()=>{
      d.status='Done'; d.completedDate=todayISO();
      await sset('defs', state.defs);
      onComplete();
    })();
    return;
  }
  showModal(`
    <h2>Time Spent</h2>
    <div class="helptext" style="margin-bottom:8px;">How long did this actually take?</div>
    <div class="item-name" style="margin-bottom:10px;">${escapeHtml(d.description)}</div>
    <select id="actualTimeSelect">${estimateOptionsHtml(d.estimatedMinutes)}</select>
    <div class="divider"></div>
    <button class="btn" id="actualTimeSave" style="width:100%;">Mark Done</button>
  `);
  document.getElementById('actualTimeSave').onclick = async()=>{
    const val = document.getElementById('actualTimeSelect').value;
    d.actualMinutes = val ? Number(val) : null;
    d.status='Done'; d.completedDate=todayISO();
    await sset('defs', state.defs);
    closeModal();
    onComplete();
  };
}

function openEditDefModal(defId, onSaved){
  const d = state.defs.find(x=>x.id===defId);
  if(!d){ showToast('Could not find that deficiency — try reloading.'); return; }
  let overbookConfirmed = false;
  showModal(`
    <h2>Edit Deficiency</h2>
    <label>Description</label><textarea id="edDesc" style="min-height:60px;">${escapeHtml(d.description)}</textarea>
    <div class="field-row">
      <div><label>Owner</label><select id="edOwner">
        <option value="Trade" ${d.owner==='Trade'?'selected':''}>Trade</option>
        <option value="Josh" ${d.owner==='Josh'?'selected':''}>Josh</option>
        <option value="Unassigned" ${(!d.owner||d.owner==='Unassigned')?'selected':''}>Unassigned</option>
      </select></div>
      <div><label>Due Date</label><input id="edDue" type="date" value="${d.dueDate||''}"></div>
    </div>
    <div class="field-row">
      <div><label>Priority</label>
      <select id="edPriority">
        <option value="High" ${d.priority==='High'?'selected':''}>High</option>
        <option value="Medium" ${(!d.priority||d.priority==='Medium')?'selected':''}>Medium</option>
        <option value="Low" ${d.priority==='Low'?'selected':''}>Low</option>
      </select></div>
      <div id="edEstimateWrap" style="${d.owner==='Trade'?'display:none;':''}"><label>Est. Time</label><select id="edEstimate">${estimateOptionsHtml(d.estimatedMinutes)}</select></div>
    </div>
    <label>Category</label>
    <select id="edCategory">
      <option value="Construction" ${(!d.category||d.category==='Construction')?'selected':''}>Construction</option>
      <option value="Safety" ${d.category==='Safety'?'selected':''}>Safety</option>
    </select>
    <div id="edOverbookWarning" class="helptext" style="color:var(--stamp-amber); display:none; margin-top:8px;"></div>
    <div class="divider"></div>
    <button class="btn" id="edSave" style="width:100%;">Save Changes</button>
  `);
  document.getElementById('edOwner').onchange = (e)=>{
    document.getElementById('edEstimateWrap').style.display = e.target.value==='Trade' ? 'none' : '';
  };
  document.getElementById('edSave').onclick = async()=>{
    const desc = document.getElementById('edDesc').value.trim();
    if(!desc){ showToast('Description cannot be empty.'); return; }
    const owner = document.getElementById('edOwner').value;
    const dueDate = document.getElementById('edDue').value || null;
    if(owner==='Josh' && dueDate && !overbookConfirmed){
      const count = joshBookingCount(dueDate, d.id);
      if(count>=2){
        overbookConfirmed = true;
        const warn = document.getElementById('edOverbookWarning');
        warn.style.display = 'block';
        warn.textContent = `You already have ${count} items of yours due ${fmtDate(dueDate)}. Tap Save Changes again to save anyway.`;
        document.getElementById('edSave').textContent = 'Save Anyway';
        return;
      }
    }
    d.description = desc;
    d.owner = owner;
    d.dueDate = dueDate;
    d.priority = document.getElementById('edPriority').value;
    d.category = document.getElementById('edCategory').value;
    const estVal = document.getElementById('edEstimate').value;
    d.estimatedMinutes = (owner!=='Trade' && estVal) ? Number(estVal) : null;
    await sset('defs', state.defs);
    closeModal();
    showToast('Deficiency updated.');
    if(onSaved) onSaved();
  };
}

function wireCardActions(){
  document.querySelectorAll('.act-done').forEach(b=>b.onclick=async(e)=>{
    const id = e.target.closest('[data-inst]').dataset.inst;
    const inst = state.instances.find(i=>i.id===id);
    inst.status='Done'; inst.completedDate=todayISO();
    await sset('instances', state.instances); render();
  });
  document.querySelectorAll('.act-push').forEach(b=>b.onclick=async(e)=>{
    const id = e.target.closest('[data-inst]').dataset.inst;
    const inst = state.instances.find(i=>i.id===id);
    showPrompt('Push reason?', async(reason)=>{
      inst.pushCount = (inst.pushCount||0)+1; inst.pushReason = reason;
      inst.dueOverride = addDays(todayISO(), 1);
      await sset('instances', state.instances); render();
    });
  });
  document.querySelectorAll('.defact-done').forEach(b=>b.onclick=(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-def]').dataset.def;
    markDefDoneWithTimeCheck(id, render);
  });
  document.querySelectorAll('.def-card').forEach(card=>card.onclick=(e)=>{
    if(e.target.closest('button')) return;
    openEditDefModal(card.dataset.def, render);
  });
  document.querySelectorAll('.plan-phase-card').forEach(card=>card.onclick=()=>{
    openUnitDetail(card.dataset.unitid);
  });
}

function unitCard(u){
  const insts = state.instances.filter(i=>i.unitId===u.id);
  const openCount = insts.filter(i=>i.status!=='Done').length;
  const defCount = state.defs.filter(d=>d.location===u.name && d.status!=='Done').length;
  const risk = computeRisk(u);
  return `<div class="card" data-unit="${u.id}">
    <div class="row">
      <div>
        <div class="item-name">${risk} ${escapeHtml(u.name)}${u.active?'':' (inactive)'}</div>
        <div class="item-meta">${openCount} open checklist · ${defCount} open deficiencies${u.currentPhase?' · '+escapeHtml(u.currentPhase):''}</div>
        <div class="item-meta">${u.lastWalkDate? 'Last walk '+fmtDate(u.lastWalkDate) : 'Never walked'}</div>
      </div>
      <button class="btn small ghost unit-open">Open</button>
    </div>
  </div>`;
}

function renderUnits(){
  let html = `<div class="section-title">Units<div style="display:flex; gap:6px;"><button class="btn small ghost" id="bulkWalkBtn">Set Walk Date</button><button class="btn small" id="addUnitBtn">+ Add Unit</button></div></div>`;
  html += `<input id="unitSearchInput" placeholder="Search units…" value="${escapeHtml(unitSearchQuery)}" style="margin:8px 4px 4px; width:calc(100% - 8px);">`;
  const activeUnits = state.units.filter(u=>u.active);
  const inactiveUnits = state.units.filter(u=>!u.active);
  const byProject = {};
  for(const u of activeUnits){ (byProject[u.project]=byProject[u.project]||[]).push(u); }
  const riskOrder = {'🔴':0,'🟠':1,'🟡':2,'🟢':3};
  for(const proj in byProject){
    html += `<div class="unit-group" data-project="${escapeHtml(proj)}">`;
    html += `<div style="margin:10px 4px 4px; color:var(--ink-dim); font-size:12px; font-weight:700;">${escapeHtml(proj)}</div>`;
    const sorted = byProject[proj].slice().sort((a,b)=>riskOrder[computeRisk(a)]-riskOrder[computeRisk(b)]);
    for(const u of sorted){ html += unitCard(u); }
    html += `</div>`;
  }
  if(inactiveUnits.length){
    html += `<div class="unit-group" data-project="__inactive">`;
    html += `<div class="card inactive-units-toggle" style="cursor:pointer;">
      <div class="row"><div class="item-name" style="font-size:14px;">${inactiveUnitsExpanded?'▾':'▸'} Completed / Inactive Units<span class="pill">${inactiveUnits.length}</span></div></div>
    </div>`;
    if(inactiveUnitsExpanded){
      const sorted = inactiveUnits.slice().sort((a,b)=>a.name.localeCompare(b.name));
      for(const u of sorted){ html += unitCard(u); }
    }
    html += `</div>`;
  }
  app.innerHTML = html;
  document.getElementById('addUnitBtn').onclick = ()=>openUnitModal();
  document.getElementById('bulkWalkBtn').onclick = ()=>openBulkWalkModal();
  document.getElementById('unitSearchInput').oninput = (e)=>{
    unitSearchQuery = e.target.value;
    applyUnitSearchFilter();
  };
  const inactiveToggle = document.querySelector('.inactive-units-toggle');
  if(inactiveToggle) inactiveToggle.onclick = ()=>{ inactiveUnitsExpanded = !inactiveUnitsExpanded; render(); };
  document.querySelectorAll('[data-unit] .unit-open').forEach(b=>b.onclick=(e)=>{
    const id = e.target.closest('[data-unit]').dataset.unit;
    openUnitDetail(id);
  });
  applyUnitSearchFilter();
}

function applyUnitSearchFilter(){
  const q = (unitSearchQuery||'').trim().toLowerCase();
  document.querySelectorAll('.unit-group').forEach(group=>{
    const cards = group.querySelectorAll('[data-unit]');
    if(cards.length===0){ group.style.display = ''; return; } // e.g. collapsed inactive-units toggle, nothing to search yet
    let anyVisible = false;
    cards.forEach(card=>{
      const match = !q || card.textContent.toLowerCase().includes(q);
      card.style.display = match ? '' : 'none';
      if(match) anyVisible = true;
    });
    group.style.display = anyVisible ? '' : 'none';
  });
}

function openBulkWalkModal(){
  showModal(`
    <h2>Set Walk Date — All Units</h2>
    <div class="helptext" style="margin-bottom:6px;">Sets Last Walk Date for every unit. Does not log a round or change phase/trade info.</div>
    <label>Walk Date</label><input id="bwDate" type="date" value="${todayISO()}">
    <div class="divider"></div>
    <button class="btn" id="bwSave" style="width:100%;">Apply to All Units</button>
  `);
  document.getElementById('bwSave').onclick = async()=>{
    const date = document.getElementById('bwDate').value;
    if(!date) return;
    state.units.forEach(u=>u.lastWalkDate=date);
    await sset('units', state.units);
    closeModal();
    showToast(`Set walk date to ${fmtDate(date)} for ${state.units.length} units`);
    render();
  };
}

function openUnitModal(){
  showModal(`
    <h2>Add Unit</h2>
    <div class="helptext" style="margin-bottom:4px;">Use the exact Buildertrend title (e.g. "Aurora B19") so schedule sync matches automatically.</div>
    <label>Unit Name (must match Buildertrend)</label><input id="mUnitName" placeholder="e.g. Aurora B19">
    <label>Project</label><input id="mUnitProject" placeholder="Aurora / Juniper / Wolfberry">
    <div class="divider"></div>
    <button class="btn" id="mUnitSave">Add Unit — applies full checklist immediately</button>
  `);
  document.getElementById('mUnitSave').onclick = async()=>{
    const name = document.getElementById('mUnitName').value.trim();
    const project = document.getElementById('mUnitProject').value.trim() || 'Aurora';
    if(!name) return;
    await addUnit({id:uid(), name, project, active:true, btLocation:name});
    closeModal(); render();
  };
}

function renderPhaseGroupRow(row, highlight){
  const {gi,g,due,done,total,st} = row;
  const isOpen = expandedGroupIds.has(gi.id);
  let html = `<div class="card ${st}${highlight?' week-urgent':''}">
    <div class="row pcg-toggle" data-giid="${gi.id}" style="cursor:pointer;">
      <div>
        <div class="item-name">${escapeHtml(g.name)}</div>
        <div class="item-meta">${due?'due '+fmtDate(due):'no schedule match'} · ${done}/${total} done</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        ${highlight?'<span class="stamp week-urgent">This Week</span>':''}
        <span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':st==='done'?'Done':'Open'}</span>
        <span style="font-size:16px;">${isOpen?'▾':'▸'}</span>
      </div>
    </div>`;
  if(isOpen){
    html += `<div style="margin-top:10px;">`;
    let lastSub = undefined;
    for(const it of g.items){
      if(it.subgroup !== lastSub){
        html += `<div class="item-meta" style="font-weight:700; margin-top:8px;">${escapeHtml(it.subgroup||'')}</div>`;
        lastSub = it.subgroup;
      }
      const checked = !!gi.itemStatus[it.id];
      html += `<label style="display:flex; align-items:center; gap:8px; padding:5px 0; border-top:1px solid var(--line); font-size:13px;">
        <input type="checkbox" class="pcg-item" data-giid="${gi.id}" data-itemid="${it.id}" ${checked?'checked':''} style="width:18px; height:18px; margin:0;">
        <span style="${checked?'text-decoration:line-through; opacity:0.55;':''}">${escapeHtml(it.text)}</span>
      </label>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function openUnitDetail(unitId){
  const prevModal = document.querySelector('.modal');
  const prevScrollTop = prevModal ? prevModal.scrollTop : 0;
  const u = state.units.find(x=>x.id===unitId);
  const insts = state.instances.filter(i=>i.unitId===unitId);
  const defs = state.defs.filter(d=>d.location===u.name && d.status!=='Done');
  const risk = computeRisk(u);
  let html = `<div class="row"><div><h2 style="margin-bottom:0;">${escapeHtml(u.name)}</h2><div class="helptext">${escapeHtml(u.project)}${u.active?'':' · inactive'}</div></div>
    <button class="btn small ghost" id="unitArchiveBtn">${u.active?'Mark Complete':'Reactivate'}</button>
  </div><div class="divider"></div>`;
  html += `<div class="section-title" style="margin-top:0;">Round Info</div>`;
  html += `<div class="card">
    <div class="row"><div class="item-meta">Risk</div><div>${risk}${u.riskOverride?' (manual override)':' (auto)'}</div></div>
    <div class="row" style="margin-top:6px;"><div class="item-meta">Current Phase</div><div style="font-size:13px; text-align:right;">${escapeHtml(u.currentPhase||'—')}</div></div>
    <div class="row" style="margin-top:6px;"><div class="item-meta">Current Trade</div><div style="font-size:13px;">${escapeHtml(u.crntTrade||'—')}</div></div>
    <div class="row" style="margin-top:6px;"><div class="item-meta">Trade End</div><div style="font-size:13px;">${fmtDate(u.ctEnd)}</div></div>
    <div class="row" style="margin-top:6px;"><div class="item-meta">Next Trade</div><div style="font-size:13px;">${escapeHtml(u.nextTrade||'—')}</div></div>
    <div class="row" style="margin-top:6px;"><div class="item-meta">Last Walk</div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:13px;">${u.lastWalkDate?fmtDate(u.lastWalkDate):'Never'}</span>
        <button class="btn small ghost" id="editWalkBtn">Edit</button>
      </div>
    </div>
    <button class="btn" id="logRoundBtn" style="width:100%; margin-top:10px;">Log Round</button>
  </div>`;
  const history = state.roundHistory.filter(r=>r.unitId===unitId).slice().sort((a,b)=>b.date.localeCompare(a.date));
  html += `<div class="section-title">Round History<span class="pill">${history.length}</span></div>`;
  if(history.length===0){
    html += `<div class="empty">No rounds logged yet.</div>`;
  } else {
    for(const r of history){
      html += `<div class="card">
        <div class="item-meta" style="font-weight:700;">${fmtDate(r.date)} — ${r.risk}</div>
        <div class="item-meta" style="margin-top:4px;">${escapeHtml(r.currentPhase||'—')}</div>
        <div class="item-meta">Trade: ${escapeHtml(r.crntTrade||'—')}${r.ctEnd?' (ends '+fmtDate(r.ctEnd)+')':''} · Next: ${escapeHtml(r.nextTrade||'—')}</div>
      </div>`;
    }
  }
  html += `<div class="section-title">Deficiencies<button class="btn small" id="udAddDefBtn">+ Add</button></div>`;
  if(defs.length===0){
    html += `<div class="empty">None open for this unit.</div>`;
  } else {
    const defsOpen = expandedUnitDefs.has(unitId);
    html += `<div class="card def-list-toggle" data-unitid="${unitId}" style="cursor:pointer;">
      <div class="row"><div class="item-name" style="font-size:14px;">${defsOpen?'▾':'▸'} ${defs.length} open deficienc${defs.length===1?'y':'ies'}</div></div>
    </div>`;
    if(defsOpen){
      const sortedDefs = defs.slice().sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
      for(const d of sortedDefs){
        const st = dueStatus(d.dueDate, d.status);
        html += `<div class="card ${st} uddef-card" data-uddef="${d.id}" style="cursor:pointer;"><div class="row"><div>
          <div class="item-name">${escapeHtml(d.description)}</div>
          <div class="item-meta">${escapeHtml(d.owner||'Unassigned')} · ${d.status}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}${priorityTag(d)}${categoryTag(d)}</div>
          </div><span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span></div>
          <div class="row" style="margin-top:8px; gap:6px;">
            <button class="btn small done-btn ud-def-done">Mark Done</button>
            <button class="btn small danger ud-def-remove">Remove</button>
          </div>
        </div>`;
      }
    }
  }

  html += `<div class="section-title">Phase Checklist</div>`;
  const groupInsts = state.groupInstances.filter(gi=>gi.unitId===unitId);
  const groupRows = groupInsts.map(gi=>{
    const g = state.checklistGroups.find(x=>x.id===gi.groupId);
    if(!g) return null;
    const due = gi.dueOverride || groupDueDate(unitId, g);
    const {done,total} = groupCompletion(gi, g);
    const st = groupStatus(due, done, total);
    return {gi, g, due, done, total, st};
  }).filter(Boolean).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));

  // Highlight the 1-2 phases due this week (Mon-Sun) so they stand out;
  // everything else — past or future — sits in the collapsed dropdown below.
  const {weekStart, weekEnd} = currentWeekRange();
  const weekRows = groupRows.filter(r=>r.due && r.due>=weekStart && r.due<=weekEnd && r.st!=='done');
  const highlightRows = weekRows.slice(0, 2);
  const highlightIds = new Set(highlightRows.map(r=>r.gi.id));
  const restRows = groupRows.filter(r=>!highlightIds.has(r.gi.id));

  for(const row of highlightRows){ html += renderPhaseGroupRow(row, true); }
  if(groupRows.length===0){
    html += `<div class="empty">No phase checklist groups yet.</div>`;
  } else if(restRows.length){
    const overflowOpen = expandedPhaseOverflow.has(unitId);
    html += `<div class="card phase-overflow-toggle" data-unitid="${unitId}" style="cursor:pointer;">
      <div class="row"><div class="item-name" style="font-size:14px;">${overflowOpen?'▾':'▸'} ${restRows.length} more phase check${restRows.length===1?'':'s'}</div></div>
    </div>`;
    if(overflowOpen){
      for(const row of restRows){ html += renderPhaseGroupRow(row); }
    }
  }

  html += `<div class="section-title">Ad-hoc Checklist</div>`;
  for(const inst of insts){
    const {m,due} = instanceInfo(inst);
    if(!m) continue;
    const st = dueStatus(due, inst.status);
    html += `<div class="card ${st}"><div class="row"><div>
      <div class="item-name">${escapeHtml(m.name)}</div>
      <div class="item-meta">${escapeHtml(m.milestone)} · due ${fmtDate(due)}</div>
      </div><span class="stamp ${st}">${st}</span></div></div>`;
  }
  showModal(html);
  const newModal = document.querySelector('.modal');
  if(newModal) newModal.scrollTop = prevScrollTop;
  document.getElementById('logRoundBtn').onclick = ()=>openRoundModal(unitId);
  document.getElementById('editWalkBtn').onclick = ()=>openEditWalkModal(unitId);
  document.getElementById('unitArchiveBtn').onclick = ()=>{
    if(u.active){
      closeModal();
      showConfirm(`Mark ${u.name} complete? It'll drop out of daily checks and the Suggested Plan, but its round history and deficiencies stay on record — you can reactivate it any time.`, async()=>{
        await setUnitActive(unitId, false);
        showToast(`${u.name} marked complete.`);
        openUnitDetail(unitId);
      });
    } else {
      (async()=>{
        await setUnitActive(unitId, true);
        showToast(`${u.name} reactivated.`);
        openUnitDetail(unitId);
      })();
    }
  };
  document.querySelectorAll('.pcg-toggle').forEach(el=>el.onclick=()=>{
    const id = el.dataset.giid;
    if(expandedGroupIds.has(id)) expandedGroupIds.delete(id); else expandedGroupIds.add(id);
    openUnitDetail(unitId);
  });
  const overflowToggle = document.querySelector('.phase-overflow-toggle');
  if(overflowToggle) overflowToggle.onclick = ()=>{
    if(expandedPhaseOverflow.has(unitId)) expandedPhaseOverflow.delete(unitId); else expandedPhaseOverflow.add(unitId);
    openUnitDetail(unitId);
  };
  const defListToggle = document.querySelector('.def-list-toggle');
  if(defListToggle) defListToggle.onclick = ()=>{
    if(expandedUnitDefs.has(unitId)) expandedUnitDefs.delete(unitId); else expandedUnitDefs.add(unitId);
    openUnitDetail(unitId);
  };
  document.querySelectorAll('.pcg-item').forEach(el=>el.onclick=async(e)=>{
    e.stopPropagation();
    const giid = el.dataset.giid, itemid = el.dataset.itemid;
    const gi = state.groupInstances.find(x=>x.id===giid);
    gi.itemStatus[itemid] = el.checked;
    await sset('groupInstances', state.groupInstances);
    openUnitDetail(unitId);
  });
  document.getElementById('udAddDefBtn').onclick = ()=>{
    closeModal();
    openDefModal(u.name, ()=>openUnitDetail(unitId));
  };
  document.querySelectorAll('.ud-def-done').forEach(b=>b.onclick=(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-uddef]').dataset.uddef;
    markDefDoneWithTimeCheck(id, ()=>{
      showToast('Marked done.');
      openUnitDetail(unitId);
    });
  });
  document.querySelectorAll('.ud-def-remove').forEach(b=>b.onclick=(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-uddef]').dataset.uddef;
    const d2 = state.defs.find(d=>d.id===id);
    closeModal();
    showConfirm(`Remove "${d2.description}" permanently? This cannot be undone.`, async()=>{
      state.defs = state.defs.filter(d=>d.id!==id);
      await sset('defs', state.defs);
      showToast('Removed.');
      openUnitDetail(unitId);
    });
  });
  document.querySelectorAll('.uddef-card').forEach(card=>card.onclick=(e)=>{
    if(e.target.closest('button')) return;
    const id = card.dataset.uddef;
    closeModal();
    openEditDefModal(id, ()=>openUnitDetail(unitId));
  });
}

function openEditWalkModal(unitId){
  const u = state.units.find(x=>x.id===unitId);
  showModal(`
    <h2>Edit Walk Date — ${escapeHtml(u.name)}</h2>
    <div class="helptext" style="margin-bottom:6px;">Only changes Last Walk Date. Does not log a round or change phase/trade info.</div>
    <label>Last Walk Date</label><input id="ewDate" type="date" value="${u.lastWalkDate||''}">
    <div class="divider"></div>
    <button class="btn" id="ewSave" style="width:100%;">Save</button>
  `);
  document.getElementById('ewSave').onclick = async()=>{
    u.lastWalkDate = document.getElementById('ewDate').value || null;
    await sset('units', state.units);
    closeModal();
    showToast('Walk date updated for ' + u.name);
    openUnitDetail(unitId);
  };
}

function openRoundModal(unitId){
  const u = state.units.find(x=>x.id===unitId);
  const phaseOpts = CURRENT_PHASE_OPTIONS.map(p=>`<option value="${escapeHtml(p)}" ${u.currentPhase===p?'selected':''}>${escapeHtml(p)}</option>`).join('');
  showModal(`
    <h2>Log Round — ${escapeHtml(u.name)}</h2>
    <div class="helptext" style="margin-bottom:6px;">Sets Last Walk Date to today and saves whatever you update below.</div>
    <label>Current Phase</label>
    <select id="rPhase"><option value="">—</option>${phaseOpts}</select>
    <div class="field-row">
      <div><label>Current Trade</label><input id="rCrntTrade" value="${escapeHtml(u.crntTrade||'')}"></div>
      <div><label>Trade End Date</label><input id="rCtEnd" type="date" value="${u.ctEnd||''}"></div>
    </div>
    <label>Next Trade</label><input id="rNextTrade" value="${escapeHtml(u.nextTrade||'')}">
    <label>Risk Override (leave on Auto unless you need to force it)</label>
    <select id="rRiskOverride">
      <option value="" ${!u.riskOverride?'selected':''}>Auto</option>
      <option value="🟢" ${u.riskOverride==='🟢'?'selected':''}>🟢 Green</option>
      <option value="🟡" ${u.riskOverride==='🟡'?'selected':''}>🟡 Yellow</option>
      <option value="🔴" ${u.riskOverride==='🔴'?'selected':''}>🔴 Red</option>
    </select>
    <div class="divider"></div>
    <button class="btn" id="rSave" style="width:100%;">Save Round</button>
  `);
  document.getElementById('rSave').onclick = async()=>{
    u.currentPhase = document.getElementById('rPhase').value;
    u.crntTrade = document.getElementById('rCrntTrade').value.trim();
    u.ctEnd = document.getElementById('rCtEnd').value || null;
    u.nextTrade = document.getElementById('rNextTrade').value.trim();
    u.riskOverride = document.getElementById('rRiskOverride').value || null;
    u.lastWalkDate = todayISO();
    await sset('units', state.units);
    state.roundHistory.push({
      id:uid(), unitId:u.id, unitName:u.name, date:todayISO(),
      currentPhase:u.currentPhase, crntTrade:u.crntTrade, ctEnd:u.ctEnd,
      nextTrade:u.nextTrade, risk:computeRisk(u)
    });
    await sset('roundHistory', state.roundHistory);
    closeModal();
    showToast('Round logged for ' + u.name);
    openUnitDetail(unitId);
  };
}

function renderMaster(){
  let html = `<div class="section-title">Checklist Master<button class="btn small" id="addMasterBtn">+ Add Item</button></div>
  <div class="helptext" style="margin:0 4px 12px;">New items apply to every active unit immediately.</div>`;
  for(const m of state.master){
    html += `<div class="card" data-master="${m.id}">
      <div class="row">
        <div>
          <div class="item-name">${escapeHtml(m.name)}</div>
          <div class="item-meta">${escapeHtml(m.milestone)}${m.area?' · '+escapeHtml(m.area):''} · ${m.offsetDays}d before match "${escapeHtml(m.matchPhase||'—')}"</div>
        </div>
        <button class="btn small ghost master-del">Remove</button>
      </div>
    </div>`;
  }
  app.innerHTML = html;
  document.getElementById('addMasterBtn').onclick = ()=>openMasterModal();
  document.querySelectorAll('.master-del').forEach(b=>b.onclick=async(e)=>{
    const id = e.target.closest('[data-master]').dataset.master;
    showConfirm('Remove this item from the master checklist? Existing unit instances stay but no due date will compute.', async()=>{
      state.master = state.master.filter(m=>m.id!==id);
      await sset('master', state.master); render();
    });
  });
}

function openMasterModal(){
  showModal(`
    <h2>Add Checklist Item</h2>
    <label>Name</label><input id="mmName" placeholder="e.g. Verify grab bar backing">
    <div class="field-row">
      <div><label>Milestone</label>
        <select id="mmMilestone">
          <option>Excavation</option><option>Framing</option><option>Rough-In</option><option>Drywall</option><option>Finishing</option>
        </select>
      </div>
      <div><label>Area (optional)</label><input id="mmArea" placeholder="Kitchen / Stairs / All Rooms"></div>
    </div>
    <div class="field-row">
      <div><label>Days Before Match</label><input id="mmOffset" type="number" value="2"></div>
      <div><label>Match Phase Text</label><input id="mmMatch" placeholder="e.g. framing, board, roofing"></div>
    </div>
    <label>Notes (optional)</label><textarea id="mmNotes" style="min-height:50px;"></textarea>
    <div class="divider"></div>
    <button class="btn" id="mmSave">Add — fans out to all active units now</button>
  `);
  document.getElementById('mmSave').onclick = async()=>{
    const name = document.getElementById('mmName').value.trim();
    if(!name) return;
    const item = {
      id:uid(), name,
      milestone: document.getElementById('mmMilestone').value,
      area: document.getElementById('mmArea').value.trim(),
      offsetDays: parseInt(document.getElementById('mmOffset').value)||0,
      matchPhase: document.getElementById('mmMatch').value.trim(),
      notes: document.getElementById('mmNotes').value.trim(),
    };
    await addMasterItem(item);
    closeModal(); render();
  };
}

function renderDefs(){
  const open = state.defs.filter(d=>d.status!=='Done');
  const dated = open.filter(d=>d.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const undated = open.filter(d=>!d.dueDate);
  const done = state.defs.filter(d=>d.status==='Done').sort((a,b)=>(b.completedDate||'').localeCompare(a.completedDate||''));
  if(!['dated','undated','done'].includes(defsFilterTab)) defsFilterTab = 'dated';

  let html = `<div class="section-title">Deficiencies<span><button class="btn small ghost" id="importDefBtn">Import</button> <button class="btn small" id="addDefBtn">+ Add</button></span></div>`;

  html += `<input id="defSearchInput" placeholder="Search deficiencies…" value="${escapeHtml(defSearchQuery)}" style="margin:8px 4px 0; width:calc(100% - 8px);">`;
  html += `<label style="display:flex; align-items:center; gap:6px; margin:8px 4px 0; text-transform:none; letter-spacing:normal; font-size:13px; color:var(--ink);">
    <input type="checkbox" id="defMissingEstimateToggle" ${defMissingEstimateOnly?'checked':''} style="width:16px; height:16px; margin:0;">
    Missing estimate only
  </label>`;

  html += `<div style="display:flex; gap:6px; margin:10px 4px 0;">
    <button class="btn small def-owner-pick ${defOwnerFilter==='all'?'':'ghost'}" data-owner="all" style="flex:1;">All</button>
    <button class="btn small def-owner-pick ${defOwnerFilter==='josh'?'':'ghost'}" data-owner="josh" style="flex:1;">Mine</button>
    <button class="btn small def-owner-pick ${defOwnerFilter==='trade'?'':'ghost'}" data-owner="trade" style="flex:1;">Trade</button>
  </div>`;

  html += `<div style="display:flex; gap:6px; margin:10px 4px 14px;">
    <button class="btn small defs-filter-pick ${defsFilterTab==='dated'?'':'ghost'}" data-filter="dated" style="flex:1;">Due Date <span class="pill">${dated.length}</span></button>
    <button class="btn small defs-filter-pick ${defsFilterTab==='undated'?'':'ghost'}" data-filter="undated" style="flex:1;">No Date <span class="pill">${undated.length}</span></button>
    <button class="btn small defs-filter-pick ${defsFilterTab==='done'?'':'ghost'}" data-filter="done" style="flex:1;">Done <span class="pill">${done.length}</span></button>
  </div>`;

  html += `<div id="defsListContainer">`;
  if(defsFilterTab==='dated'){
    if(dated.length===0) html += `<div class="empty">Nothing with a due date yet.</div>`;
    for(const d of dated){ html += defRowWithActions(d); }
  } else if(defsFilterTab==='undated'){
    if(undated.length===0) html += `<div class="empty">Everything has a due date.</div>`;
    for(const d of undated){ html += defRowWithActions(d, true); }
  } else {
    if(done.length===0) html += `<div class="empty">Nothing marked done yet.</div>`;
    for(const d of done){ html += defRowDone(d); }
  }
  html += `</div>`;

  app.innerHTML = html;
  document.getElementById('addDefBtn').onclick = ()=>openDefModal();
  document.getElementById('importDefBtn').onclick = ()=>openDefImportModal();
  document.getElementById('defSearchInput').oninput = (e)=>{
    defSearchQuery = e.target.value;
    applyDefSearchFilter();
  };
  document.getElementById('defMissingEstimateToggle').onchange = (e)=>{
    defMissingEstimateOnly = e.target.checked;
    applyDefSearchFilter();
  };
  document.querySelectorAll('.defs-filter-pick').forEach(b=>b.onclick=()=>{
    defsFilterTab = b.dataset.filter;
    render();
  });
  document.querySelectorAll('.def-owner-pick').forEach(b=>b.onclick=()=>{
    defOwnerFilter = b.dataset.owner;
    render();
  });
  wireDefRowActions();
  applyDefSearchFilter();
}

function applyDefSearchFilter(){
  const q = (defSearchQuery||'').trim().toLowerCase();
  document.querySelectorAll('#defsListContainer > div').forEach(card=>{
    const matchesSearch = !q || card.textContent.toLowerCase().includes(q);
    const matchesEstimate = !defMissingEstimateOnly || (card.dataset.hasestimate==='0' && card.dataset.owner!=='Trade');
    const matchesOwner = defOwnerFilter==='all'
      || (defOwnerFilter==='josh' && card.dataset.owner==='Josh')
      || (defOwnerFilter==='trade' && card.dataset.owner==='Trade');
    card.style.display = (matchesSearch && matchesEstimate && matchesOwner) ? '' : 'none';
  });
}

function defRowDone(d){
  return `<div class="card done def2-card" data-def2="${d.id}" data-hasestimate="${d.estimatedMinutes?'1':'0'}" data-owner="${escapeHtml(d.owner||'')}" style="cursor:pointer;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.completedDate?' · completed '+fmtDate(d.completedDate):''}${priorityTag(d)}${categoryTag(d)}</div>
    </div><span class="stamp done">Done</span></div>
  </div>`;
}

function defRowWithActions(d, showDatePicker){
  const st = dueStatus(d.dueDate, d.status);
  const needsEstimate = d.owner!=='Trade';
  return `<div class="card ${st} def2-card" data-def2="${d.id}" data-hasestimate="${d.estimatedMinutes?'1':'0'}" data-owner="${escapeHtml(d.owner||'')}" style="cursor:pointer;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}${d.status==='WAIT'?' · WAITING':''}${d.plannedDate?' · planned '+fmtDate(d.plannedDate):''}${priorityTag(d)}${categoryTag(d)}</div>
    </div><span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span></div>
    ${showDatePicker ? `<div class="row" style="margin-top:8px; gap:6px;">
      <input type="date" class="def-quickdate" style="margin-top:0;">
      <button class="btn small def-savedate">Set Date</button>
    </div>` : ''}
    <div class="row" style="margin-top:8px; gap:6px;">
      ${needsEstimate ? `<select class="def-quickestimate" style="margin-top:0;">${estimateOptionsHtml(d.estimatedMinutes)}</select>` : ''}
      <button class="btn small done-btn def2-done">Mark Done</button>
    </div>
  </div>`;
}

function wireDefRowActions(){
  document.querySelectorAll('.def2-done').forEach(b=>b.onclick=(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-def2]').dataset.def2;
    markDefDoneWithTimeCheck(id, render);
  });
  document.querySelectorAll('.def-savedate').forEach(b=>b.onclick=async(e)=>{
    e.stopPropagation();
    const card = e.target.closest('[data-def2]');
    const id = card.dataset.def2;
    const val = card.querySelector('.def-quickdate').value;
    if(!val){ showToast('Pick a date first.'); return; }
    const d2 = state.defs.find(d=>d.id===id);
    d2.dueDate = val;
    await sset('defs', state.defs);
    showToast('Due date set.');
    render();
  });
  document.querySelectorAll('.def-quickdate').forEach(el=>el.onclick=(e)=>e.stopPropagation());
  document.querySelectorAll('.def-quickestimate').forEach(el=>{
    el.onclick=(e)=>e.stopPropagation();
    el.onchange=async(e)=>{
      const card = e.target.closest('[data-def2]');
      const id = card.dataset.def2;
      const d2 = state.defs.find(d=>d.id===id);
      if(!d2) return;
      const val = e.target.value;
      d2.estimatedMinutes = val ? Number(val) : null;
      card.dataset.hasestimate = val ? '1' : '0';
      await sset('defs', state.defs);
      applyDefSearchFilter();
    };
  });
  document.querySelectorAll('.def2-card').forEach(card=>card.onclick=(e)=>{
    if(e.target.closest('button, input')) return;
    openEditDefModal(card.dataset.def2, render);
  });
}

function openDefImportModal(){
  showModal(`
    <h2>Import Deficiencies</h2>
    <div class="helptext" style="margin-bottom:6px;">Paste a JSON array. "location" can be a unit name (e.g. "AB17") or a site-wide/category value (e.g. "AURORA/JUNIPER SITE"). Duplicate description+location pairs are skipped.</div>
    <textarea id="defImportPaste" style="min-height:140px;" placeholder='[{"location":"AB16","description":"...","owner":"Trade","status":"WAIT","dueDate":"2026-08-14","pushCount":0,"pushReason":""}]'></textarea>
    <div class="divider"></div>
    <button class="btn" id="defImportSave">Import</button>
  `);
  document.getElementById('defImportSave').onclick = async()=>{
    try{
      const raw = JSON.parse(document.getElementById('defImportPaste').value);
      let added=0, skipped=0;
      for(const r of raw){
        const dup = state.defs.some(d=>d.description===r.description && d.location===r.location);
        if(dup){ skipped++; continue; }
        state.defs.push({
          id:uid(), location:r.location||'', description:r.description||'(no description)',
          owner:r.owner||'Unassigned', status:r.status||'DO', dueDate:r.dueDate||null,
          priority:r.priority||'Medium',
          pushCount:r.pushCount||0, pushReason:r.pushReason||''
        });
        added++;
      }
      await sset('defs', state.defs);
      closeModal(); render();
      showToast(`Imported ${added} deficiencies. Skipped ${skipped} duplicates.`);
    }catch(e){ showToast('Could not parse JSON: ' + e.message); }
  };
}

function joshBookingCount(dueDate, excludeId){
  return state.defs.filter(d=>d.id!==excludeId && d.owner==='Josh' && d.dueDate===dueDate && d.status!=='Done').length;
}

function openDefModal(prefillLocation, onSaved){
  const dl = state.units.map(u=>`<option value="${escapeHtml(u.name)}">`).join('');
  let overbookConfirmed = false;
  showModal(`
    <h2>Add Deficiency</h2>
    <label>Location</label>
    <input id="dLocation" list="unitSuggest" placeholder="e.g. AB17 or AURORA/JUNIPER SITE" value="${escapeHtml(prefillLocation||'')}">
    <datalist id="unitSuggest">${dl}</datalist>
    <label>Description</label><textarea id="dDesc" style="min-height:60px;"></textarea>
    <div class="field-row">
      <div><label>Owner</label><select id="dOwner"><option>Trade</option><option>Josh</option><option>Unassigned</option></select></div>
      <div><label>Due Date</label><input id="dDue" type="date"></div>
    </div>
    <div class="field-row">
      <div><label>Priority</label>
      <select id="dPriority">
        <option value="High">High</option>
        <option value="Medium" selected>Medium</option>
        <option value="Low">Low</option>
      </select></div>
      <div id="dEstimateWrap" style="display:none;"><label>Est. Time</label><select id="dEstimate">${estimateOptionsHtml()}</select></div>
    </div>
    <label>Category</label>
    <select id="dCategory">
      <option value="Construction" selected>Construction</option>
      <option value="Safety">Safety</option>
    </select>
    <div id="dOverbookWarning" class="helptext" style="color:var(--stamp-amber); display:none; margin-top:8px;"></div>
    <div class="divider"></div>
    <button class="btn" id="dSave">Add Deficiency</button>
  `);
  document.getElementById('dOwner').onchange = (e)=>{
    document.getElementById('dEstimateWrap').style.display = e.target.value==='Trade' ? 'none' : '';
  };
  document.getElementById('dSave').onclick = async()=>{
    const desc = document.getElementById('dDesc').value.trim();
    if(!desc) return;
    const owner = document.getElementById('dOwner').value;
    const dueDate = document.getElementById('dDue').value || null;
    if(owner==='Josh' && dueDate && !overbookConfirmed){
      const count = joshBookingCount(dueDate);
      if(count>=2){
        overbookConfirmed = true;
        const warn = document.getElementById('dOverbookWarning');
        warn.style.display = 'block';
        warn.textContent = `You already have ${count} items of yours due ${fmtDate(dueDate)}. Tap Add Deficiency again to add anyway.`;
        document.getElementById('dSave').textContent = 'Add Anyway';
        return;
      }
    }
    const estVal = document.getElementById('dEstimate').value;
    state.defs.push({
      id:uid(), location:document.getElementById('dLocation').value.trim(), description:desc,
      owner, dueDate, priority:document.getElementById('dPriority').value,
      category: document.getElementById('dCategory').value,
      estimatedMinutes: (owner!=='Trade' && estVal) ? Number(estVal) : null,
      status:'DO', pushCount:0, pushReason:'', createdDate:todayISO()
    });
    await sset('defs', state.defs); closeModal();
    if(onSaved) onSaved(); else render();
  };
}

function mdToHtml(text){
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\n/g, '<br>');
}

function buildBriefSummary(date){
  const openDefs = state.defs.filter(d=>d.status!=='Done');
  const mineAll = openDefs.filter(d=>d.owner==='Josh' && d.dueDate && d.dueDate<=date)
    .sort((a,b)=> (a.dueDate||'').localeCompare(b.dueDate||'')
      || (CATEGORY_ORDER[a.category||'Construction']??1)-(CATEGORY_ORDER[b.category||'Construction']??1)
      || (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1));
  const mine = mineAll.slice(0,2);
  const tradeDueSoon = openDefs.filter(d=>d.owner==='Trade' && d.dueDate && d.dueDate<=addDays(date,1));
  let html = `<b>Planned (Brief):</b><br>`;
  html += `Mine to drive: ` + (mine.length ? mine.map(d=>escapeHtml(d.description)).join('; ') : 'none');
  html += `<br>Trade due today/tomorrow: ${tradeDueSoon.length}`;
  return html;
}

function buildDayLog(date){
  const isToday = date === todayISO();
  const roundsOnDate = state.roundHistory.filter(r=>r.date===date);
  const defsAdded = state.defs.filter(d=>d.createdDate===date);
  const defsCompletedOnDate = state.defs.filter(d=>d.completedDate===date);
  const checklistAddedOnDate = [], checklistCompletedOnDate = [], checklistDueToday = [], checklistOverdue = [];
  for(const inst of state.instances){
    const {m,due} = instanceInfo(inst);
    if(!m) continue;
    if(inst.createdDate===date) checklistAddedOnDate.push(m.name);
    if(inst.status==='Done' && inst.completedDate===date) checklistCompletedOnDate.push(m.name);
    if(isToday){
      if(due===date && inst.status!=='Done') checklistDueToday.push(m.name);
      else if(due && due<date && inst.status!=='Done') checklistOverdue.push(m.name);
    }
  }
  let html = buildBriefSummary(date);
  html += `<br><br><b>Rounds logged (${roundsOnDate.length}):</b><br>` + (roundsOnDate.length? roundsOnDate.map(r=>escapeHtml(r.unitName+' — '+r.risk+' — '+(r.currentPhase||'—'))).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Deficiencies added (${defsAdded.length}):</b><br>` + (defsAdded.length? defsAdded.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Deficiencies completed (${defsCompletedOnDate.length}):</b><br>` + (defsCompletedOnDate.length? defsCompletedOnDate.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  if(isToday){
    const defsOverdue = state.defs.filter(d=>d.status!=='Done' && d.dueDate && d.dueDate<date);
    const defsDueToday = state.defs.filter(d=>d.status!=='Done' && d.dueDate===date);
    html += `<br><br><b>Deficiencies due today (${defsDueToday.length}):</b><br>` + (defsDueToday.length? defsDueToday.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
    html += `<br><br><b>Deficiencies overdue (${defsOverdue.length}):</b><br>` + (defsOverdue.length? defsOverdue.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  }
  html += `<br><br><b>Checklist items added (${checklistAddedOnDate.length}):</b><br>` + (checklistAddedOnDate.length? checklistAddedOnDate.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  if(isToday){
    html += `<br><br><b>Checklist due today (${checklistDueToday.length}):</b><br>` + (checklistDueToday.length? checklistDueToday.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
    html += `<br><br><b>Checklist overdue (${checklistOverdue.length}):</b><br>` + (checklistOverdue.length? checklistOverdue.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  }
  html += `<br><br><b>Checklist items completed (${checklistCompletedOnDate.length}):</b><br>` + (checklistCompletedOnDate.length? checklistCompletedOnDate.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  return html;
}

function stripMarkup(raw){
  return (raw||'')
    .replace(/<[^>]+>/g,' ')
    .replace(/\*\*/g,'')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/\s+/g,' ').trim();
}

function searchLogHistory(query){
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length) return [];
  const today = todayISO();
  const entries = state.logHistory.filter(h=>h.date!==today).map(h=>({date:h.date, content:h.content}));
  entries.push({date:today, content:buildDayLog(today)});
  const results = [];
  for(const e of entries){
    const plain = stripMarkup(e.content);
    const lower = plain.toLowerCase();
    let score = 0;
    for(const w of words){
      let idx = lower.indexOf(w);
      while(idx!==-1){ score++; idx = lower.indexOf(w, idx+w.length); }
    }
    if(score===0) continue;
    const firstIdx = words.map(w=>lower.indexOf(w)).filter(i=>i!==-1).sort((a,b)=>a-b)[0];
    const start = Math.max(0, firstIdx-40);
    let snippet = plain.slice(start, start+160);
    if(start>0) snippet = '…'+snippet;
    if(start+160<plain.length) snippet += '…';
    results.push({date:e.date, score, snippet});
  }
  results.sort((a,b)=> b.score-a.score || b.date.localeCompare(a.date));
  return results.slice(0,20);
}

function renderLog(){
  const today = todayISO();
  if(!selectedLogDate) selectedLogDate = today;

  let html = `<div class="section-title">Daily Log</div>`;
  html += `<div class="field-row" style="margin-bottom:4px;">
    <input id="logSearchInput" placeholder="Search logs (e.g. drywall, permit, AB17)" value="${escapeHtml(logSearchQuery||'')}" style="margin-top:0;">
    <button class="btn small" id="logSearchBtn" style="flex-shrink:0; margin-top:0;">Search</button>
  </div>`;

  if(logSearchQuery){
    const results = searchLogHistory(logSearchQuery);
    html += `<div class="section-title" style="margin-top:10px;">Results for "${escapeHtml(logSearchQuery)}"<button class="btn small ghost" id="logSearchClear">Clear</button></div>`;
    if(results.length===0) html += `<div class="empty">No matches found.</div>`;
    for(const r of results){
      html += `<div class="card log-search-result" data-date="${r.date}" style="cursor:pointer;">
        <div class="item-meta" style="font-weight:700;">${r.date===today?'Today':fmtDate(r.date)}</div>
        <div style="font-size:13px; margin-top:4px;">${escapeHtml(r.snippet)}</div>
      </div>`;
    }
    app.innerHTML = html;
    wireLogSearchBox();
    document.getElementById('logSearchClear').onclick = ()=>{ logSearchQuery = null; render(); };
    document.querySelectorAll('.log-search-result').forEach(card=>card.onclick=()=>{
      selectedLogDate = card.dataset.date;
      logSearchQuery = null;
      render();
    });
    return;
  }

  html += `<div class="field-row" style="margin-top:4px; margin-bottom:8px;">
    <button class="btn small ghost" id="logTodayBtn" style="flex-shrink:0; margin-top:0;">Today</button>
    <input id="logDatePick" type="date" value="${selectedLogDate}" style="margin-top:0;">
  </div>`;

  const hist = state.logHistory.find(h=>h.date===selectedLogDate);
  html += `<div class="card">`;
  if(selectedLogDate===today){
    html += `<div class="item-meta" style="font-weight:700; margin-bottom:8px;">LIVE — updates automatically</div>`;
    html += `<div style="font-size:13px; line-height:1.6;">${buildDayLog(today)}</div>`;
  } else if(hist && hist.auto){
    html += `<div class="item-meta" style="font-weight:700; margin-bottom:8px; opacity:0.7;">AUTO-ARCHIVED — captured at day's end</div>`;
    html += `<div style="font-size:13px; line-height:1.6;">${hist.content}</div>`;
  } else if(hist){
    html += `<div class="item-meta" style="font-weight:700; margin-bottom:8px; opacity:0.7;">READ-ONLY HISTORY — imported from Notion</div>`;
    html += `<div style="font-size:13px; line-height:1.6;">${mdToHtml(hist.content)}</div>`;
  } else {
    html += `<div class="empty">No log for this date.</div>`;
  }
  html += `</div>`;

  app.innerHTML = html;
  wireLogSearchBox();
  document.getElementById('logTodayBtn').onclick = ()=>{ selectedLogDate = today; render(); };
  document.getElementById('logDatePick').onchange = (e)=>{ selectedLogDate = e.target.value; render(); };
}

function wireLogSearchBox(){
  const doSearch = ()=>{
    const q = document.getElementById('logSearchInput').value.trim();
    logSearchQuery = q || null;
    render();
  };
  document.getElementById('logSearchBtn').onclick = doSearch;
  document.getElementById('logSearchInput').onkeydown = (e)=>{ if(e.key==='Enter') doSearch(); };
}

function renderSchedule(){
  const today = todayISO();
  const inThreeDays = addDays(today, 3);
  if(state.schedule.length===0){
    app.innerHTML = `<div class="section-title">Buildertrend Schedule</div><div class="empty">No schedule data yet. Go to Sync to import.</div>`;
    return;
  }
  const byUnit = {};
  for(const ev of state.schedule){
    const u = state.units.find(x=>x.name===ev.location);
    const key = u ? u.name : (ev.location||'Unmatched');
    (byUnit[key]=byUnit[key]||[]).push(ev);
  }
  const unitNames = Object.keys(byUnit).sort();
  if(!selectedScheduleUnit || !unitNames.includes(selectedScheduleUnit)){
    selectedScheduleUnit = unitNames[0];
  }

  let html = `<div class="section-title">Buildertrend Schedule</div>`;
  html += `<div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:6px;">`;
  for(const uname of unitNames){
    const isSel = uname===selectedScheduleUnit;
    html += `<button class="btn ${isSel?'':'ghost'} small schedule-unit-pick" data-uname="${escapeHtml(uname)}" style="flex-shrink:0; white-space:nowrap;">${escapeHtml(uname)}</button>`;
  }
  html += `</div>`;

  const events = byUnit[selectedScheduleUnit].slice().sort((a,b)=>(a.finishDate||'').localeCompare(b.finishDate||''));
  const starting = events.filter(e=>e.finishDate && e.finishDate>=today && e.finishDate<=inThreeDays);
  const active = events.filter(e=>e.finishDate && e.finishDate>today && !(e.finishDate<=inThreeDays));
  const past = events.filter(e=>e.finishDate && e.finishDate<today);

  html += `<div class="card">`;
  if(starting.length){
    html += `<div class="item-meta" style="font-weight:700; color:var(--stamp-amber);">FINISHING SOON</div>`;
    for(const e of starting) html += scheduleRow(e, true);
  }
  if(active.length){
    html += `<div class="item-meta" style="font-weight:700; margin-top:10px; color:#1E7A3D;">UPCOMING</div>`;
    for(const e of active) html += scheduleRow(e, false);
  }
  if(past.length){
    html += `<div class="item-meta" style="font-weight:700; margin-top:10px; opacity:0.6;">PAST</div>`;
    for(const e of past) html += scheduleRow(e, false, true);
  }
  if(!starting.length && !active.length && !past.length){
    html += `<div class="empty">No schedule events for this unit.</div>`;
  }
  html += `</div>`;

  app.innerHTML = html;
  document.querySelectorAll('.schedule-unit-pick').forEach(b=>b.onclick=()=>{
    selectedScheduleUnit = b.dataset.uname;
    render();
  });
}
function scheduleRow(e, urgent, faded){
  return `<div class="row" style="padding:5px 0; border-top:1px solid var(--line); opacity:${faded?0.55:1};">
    <div style="font-size:13px;">${escapeHtml(e.subject||'')}</div>
    <div style="font-size:12px; color:${urgent?'var(--stamp-amber)':'var(--ink-dim)'}; font-weight:${urgent?'700':'400'}; white-space:nowrap;">${fmtDate(e.finishDate)}</div>
  </div>`;
}

function renderSync(){
  const count = state.schedule.length;
  const lastBackupText = state.lastBackup ? `Last backup: ${new Date(state.lastBackup).toLocaleString()}` : 'No backup taken yet.';
  html = `<div class="section-title">Buildertrend Sync</div>
  <div class="card">
    <div class="item-meta" style="margin-bottom:8px;">${count} schedule events loaded. Due dates compute automatically once a schedule event's subject matches a checklist item's match text, for the right unit.</div>
    <div class="helptext">To refresh: ask Claude to "pull the Buildertrend schedule" — it reads your Outlook calendar and gives you a JSON block. Paste it below and tap Import. This replaces manual date entry with a one-line ask.</div>
  </div>
  <label>Paste Schedule JSON</label>
  <textarea id="syncPaste" placeholder='[{"location":"Aurora B03","subject":"Roofing","finishDate":"2026-08-14"}]'></textarea>
  <button class="btn" id="syncImportBtn" style="margin-top:10px;">Import</button>
  <div class="divider"></div>
  <div class="section-title">Backup & Restore</div>
  <div class="card">
    <div class="helptext" style="margin-bottom:10px;">${lastBackupText}</div>
    <button class="btn" id="backupBtn" style="width:100%;">Download Backup (.json)</button>
  </div>
  <div class="card">
    <div class="helptext" style="margin-bottom:8px;">Restore from a backup file. This replaces everything currently in the app — units, checklist, deficiencies, schedule.</div>
    <input type="file" id="restoreFile" accept="application/json" style="margin-top:0;">
    <button class="btn danger" id="restoreBtn" style="width:100%; margin-top:10px;">Restore From File</button>
  </div>
  <div class="divider"></div>
  <div class="section-title">Security</div>
  <div class="card">
    <div class="helptext" style="margin-bottom:8px;">Clears the access code saved on this device. You'll be asked to re-enter it next load.</div>
    <button class="btn ghost" id="changeKeyBtn" style="width:100%;">Change Access Code</button>
  </div>`;
  app.innerHTML = html;
  document.getElementById('syncImportBtn').onclick = async()=>{
    try{
      const raw = JSON.parse(document.getElementById('syncPaste').value);
      const mapped = raw.map(r=>({...r, id:uid()}));
      state.schedule = mapped;
      await sset('schedule', state.schedule);
      render();
      showToast('Imported ' + mapped.length + ' schedule events.');
    }catch(e){ showToast('Could not parse JSON: ' + e.message); }
  };
  document.getElementById('backupBtn').onclick = doBackup;
  document.getElementById('restoreBtn').onclick = doRestore;
  document.getElementById('changeKeyBtn').onclick = ()=>{
    showConfirm('Clear the saved access code on this device? You will need to re-enter it.', ()=>{
      clearSiteKey();
      location.reload();
    });
  };
}

async function doBackup(){
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    units: state.units, master: state.master, instances: state.instances,
    defs: state.defs, schedule: state.schedule,
    checklistGroups: state.checklistGroups, groupInstances: state.groupInstances,
    roundHistory: state.roundHistory, logHistory: state.logHistory
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `sitelog-backup-${stamp}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  await sset('lastBackup', new Date().toISOString());
  state.lastBackup = new Date().toISOString();
  render();
}

async function doRestore(){
  const fileInput = document.getElementById('restoreFile');
  const file = fileInput.files[0];
  if(!file){ showToast('Choose a backup file first.'); return; }
  showConfirm('This replaces all current data in the app with the contents of this backup. Continue?', async()=>{
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(!data.units || !data.master) throw new Error('File does not look like a Site Log backup.');
      state.units = data.units; state.master = data.master; state.instances = data.instances||[];
      state.defs = data.defs||[]; state.schedule = data.schedule||[];
      state.checklistGroups = data.checklistGroups || CHECKLIST_GROUPS_SEED.slice();
      state.groupInstances = data.groupInstances || [];
      state.roundHistory = data.roundHistory || [];
      state.logHistory = data.logHistory || LOG_HISTORY_SEED.slice();
      await sset('units', state.units); await sset('master', state.master);
      await sset('instances', state.instances); await sset('defs', state.defs);
      await sset('schedule', state.schedule);
      await sset('checklistGroups', state.checklistGroups);
      await sset('groupInstances', state.groupInstances);
      await sset('roundHistory', state.roundHistory);
      await sset('logHistory', state.logHistory);
      await sset('migrated_unit_names_v2', true);
      await sset('migrated_rounds_v1', true);
      activeTab='today';
      document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='today'));
      render();
      showToast('Restored. Data from ' + (data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'backup file') + '.');
    }catch(e){ showToast('Restore failed: ' + e.message); }
  });
}

