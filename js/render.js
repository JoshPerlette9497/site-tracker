/* ---------- rendering ---------- */
const app = document.getElementById('app');

function setHeader(){
  const d = new Date();
  document.getElementById('headerTitle').textContent = 'Site Log';
  document.getElementById('headerSub').textContent = d.toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'});
}

function render(){
  if(activeTab==='today') renderToday();
  else if(activeTab==='brief') renderBrief();
  else if(activeTab==='units') renderUnits();
  else if(activeTab==='master') renderMaster();
  else if(activeTab==='defs') renderDefs();
  else if(activeTab==='log') renderLog();
  else if(activeTab==='schedule') renderSchedule();
  else if(activeTab==='sync') renderSync();
}

function renderBrief(){
  const today = todayISO();
  const tomorrow = addDays(today, 1);

  const openDefs = state.defs.filter(d=>d.status!=='Done');
  const MINE_CAP = 2;
  const mineAll = openDefs.filter(d=>d.owner==='Josh' && d.dueDate && d.dueDate<=today)
    .sort((a,b)=> (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1) || (a.dueDate||'').localeCompare(b.dueDate||''));
  const mine = mineAll.slice(0, MINE_CAP);
  const mineHiddenCount = mineAll.length - mine.length;
  const tradeDueSoon = openDefs.filter(d=>d.owner==='Trade' && d.dueDate && d.dueDate<=tomorrow);
  const tradeOpenNoDue = openDefs.filter(d=>d.owner==='Trade' && !d.dueDate);
  const backlogCount = openDefs.filter(d=>(d.pushCount||0)>=1).length;

  const checklistOverdue = [], checklistDueToday = [], checklistCompletedToday = [];
  for(const inst of state.instances){
    const {m,u,due} = instanceInfo(inst);
    if(!m||!u) continue;
    if(inst.status==='Done' && inst.completedDate===today) checklistCompletedToday.push(`${u.name}: ${m.name}`);
    else if(due===today) checklistDueToday.push(`${u.name}: ${m.name}`);
    else if(due && due<today && inst.status!=='Done') checklistOverdue.push(`${u.name}: ${m.name}`);
  }

  const finishingSoon = state.schedule.filter(e=>e.finishDate && e.finishDate>=today && e.finishDate<=tomorrow)
    .sort((a,b)=>(a.finishDate||'').localeCompare(b.finishDate||''));

  let html = `<div class="section-title">Daily Brief — ${fmtDate(today)}</div>`;

  html += `<div class="section-title" style="margin-top:14px;">Mine to Drive<span class="pill">${mine.length}</span></div>`;
  html += mine.length ? mine.map(d=>cardForDef(d, dueStatus(d.dueDate, d.status))).join('') : `<div class="empty">Nothing of yours due or overdue.</div>`;
  if(mineHiddenCount>0) html += `<div class="empty" style="margin-top:0;">+${mineHiddenCount} more of yours waiting — see Deficiencies tab to reprioritize or spread out.</div>`;

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
}

function renderToday(){
  const rows = state.instances.map(inst=>{
    const {m,u,due} = instanceInfo(inst);
    if(!m||!u) return null;
    return {inst,m,u,due,st:dueStatus(due, inst.status)};
  }).filter(Boolean).filter(r=>r.st==='overdue'||r.st==='today');

  const defRows = state.defs.filter(d=>d.status!=='Done').map(d=>{
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

function priorityTag(d){
  if(d.priority==='High') return ` · <b style="color:var(--stamp-red);">HIGH</b>`;
  if(d.priority==='Low') return ` · <span style="opacity:0.6;">low</span>`;
  return '';
}

function cardForDef(d, st){
  return `<div class="card ${st} def-card" data-def="${d.id}" style="cursor:pointer;">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(d.description)}</div>
        <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):''}${d.status==='WAIT'?' · WAITING':''}${d.pushReason?' · '+escapeHtml(d.pushReason):''}${priorityTag(d)}</div>
      </div>
      <span class="stamp ${st}">${st==='done'?'Done':st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span>
    </div>
    <div class="row" style="margin-top:10px; gap:6px;">
      <button class="btn small done-btn defact-done">Mark Done</button>
    </div>
  </div>`;
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
    <label>Priority</label>
    <select id="edPriority">
      <option value="High" ${d.priority==='High'?'selected':''}>High</option>
      <option value="Medium" ${(!d.priority||d.priority==='Medium')?'selected':''}>Medium</option>
      <option value="Low" ${d.priority==='Low'?'selected':''}>Low</option>
    </select>
    <div id="edOverbookWarning" class="helptext" style="color:var(--stamp-amber); display:none; margin-top:8px;"></div>
    <div class="divider"></div>
    <button class="btn" id="edSave" style="width:100%;">Save Changes</button>
  `);
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
  document.querySelectorAll('.defact-done').forEach(b=>b.onclick=async(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-def]').dataset.def;
    const d = state.defs.find(x=>x.id===id);
    if(!d){ showToast('Could not find that deficiency — try reloading.'); return; }
    d.status='Done'; d.completedDate=todayISO();
    await sset('defs', state.defs); render();
  });
  document.querySelectorAll('.def-card').forEach(card=>card.onclick=(e)=>{
    if(e.target.closest('button')) return;
    openEditDefModal(card.dataset.def, render);
  });
}

function renderUnits(){
  let html = `<div class="section-title">Units<div style="display:flex; gap:6px;"><button class="btn small ghost" id="bulkWalkBtn">Set Walk Date</button><button class="btn small" id="addUnitBtn">+ Add Unit</button></div></div>`;
  html += `<input id="unitSearchInput" placeholder="Search units…" value="${escapeHtml(unitSearchQuery)}" style="margin:8px 4px 4px; width:calc(100% - 8px);">`;
  const byProject = {};
  for(const u of state.units){ (byProject[u.project]=byProject[u.project]||[]).push(u); }
  const riskOrder = {'🔴':0,'🟠':1,'🟡':2,'🟢':3};
  for(const proj in byProject){
    html += `<div class="unit-group" data-project="${escapeHtml(proj)}">`;
    html += `<div style="margin:10px 4px 4px; color:var(--ink-dim); font-size:12px; font-weight:700;">${escapeHtml(proj)}</div>`;
    const sorted = byProject[proj].slice().sort((a,b)=>riskOrder[computeRisk(a)]-riskOrder[computeRisk(b)]);
    for(const u of sorted){
      const insts = state.instances.filter(i=>i.unitId===u.id);
      const openCount = insts.filter(i=>i.status!=='Done').length;
      const defCount = state.defs.filter(d=>d.location===u.name && d.status!=='Done').length;
      const risk = computeRisk(u);
      html += `<div class="card" data-unit="${u.id}">
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
    html += `</div>`;
  }
  app.innerHTML = html;
  document.getElementById('addUnitBtn').onclick = ()=>openUnitModal();
  document.getElementById('bulkWalkBtn').onclick = ()=>openBulkWalkModal();
  document.getElementById('unitSearchInput').oninput = (e)=>{
    unitSearchQuery = e.target.value;
    applyUnitSearchFilter();
  };
  document.querySelectorAll('[data-unit] .unit-open').forEach(b=>b.onclick=(e)=>{
    const id = e.target.closest('[data-unit]').dataset.unit;
    openUnitDetail(id);
  });
  applyUnitSearchFilter();
}

function applyUnitSearchFilter(){
  const q = (unitSearchQuery||'').trim().toLowerCase();
  document.querySelectorAll('.unit-group').forEach(group=>{
    let anyVisible = false;
    group.querySelectorAll('[data-unit]').forEach(card=>{
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

function renderPhaseGroupRow(row){
  const {gi,g,due,done,total,st} = row;
  const isOpen = expandedGroupIds.has(gi.id);
  let html = `<div class="card ${st}">
    <div class="row pcg-toggle" data-giid="${gi.id}" style="cursor:pointer;">
      <div>
        <div class="item-name">${escapeHtml(g.name)}</div>
        <div class="item-meta">${due?'due '+fmtDate(due):'no schedule match'} · ${done}/${total} done</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
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
  const u = state.units.find(x=>x.id===unitId);
  const insts = state.instances.filter(i=>i.unitId===unitId);
  const defs = state.defs.filter(d=>d.location===u.name && d.status!=='Done');
  const risk = computeRisk(u);
  let html = `<h2>${escapeHtml(u.name)}</h2><div class="helptext">${escapeHtml(u.project)}</div><div class="divider"></div>`;
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
          <div class="item-meta">${escapeHtml(d.owner||'Unassigned')} · ${d.status}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}${priorityTag(d)}</div>
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

  const phaseCutoff = addDays(todayISO(), 14);
  const dueSoonRows = groupRows.filter(r=>r.due && r.due<=phaseCutoff);
  const laterRows = groupRows.filter(r=>!(r.due && r.due<=phaseCutoff));

  for(const row of dueSoonRows){ html += renderPhaseGroupRow(row); }
  if(dueSoonRows.length===0 && laterRows.length===0) html += `<div class="empty">No phase checklist groups yet.</div>`;
  if(laterRows.length){
    const overflowOpen = expandedPhaseOverflow.has(unitId);
    html += `<div class="card phase-overflow-toggle" data-unitid="${unitId}" style="cursor:pointer;">
      <div class="row"><div class="item-name" style="font-size:14px;">${overflowOpen?'▾':'▸'} ${laterRows.length} more (due later than 14 days, or no schedule match)</div></div>
    </div>`;
    if(overflowOpen){
      for(const row of laterRows){ html += renderPhaseGroupRow(row); }
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
  document.getElementById('logRoundBtn').onclick = ()=>openRoundModal(unitId);
  document.getElementById('editWalkBtn').onclick = ()=>openEditWalkModal(unitId);
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
  document.querySelectorAll('.ud-def-done').forEach(b=>b.onclick=async(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-uddef]').dataset.uddef;
    const d2 = state.defs.find(d=>d.id===id);
    if(!d2){ showToast('Could not find that deficiency — try reloading.'); return; }
    d2.status='Done'; d2.completedDate=todayISO();
    await sset('defs', state.defs);
    closeModal();
    showToast('Marked done.');
    openUnitDetail(unitId);
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
      <option value="🟠" ${u.riskOverride==='🟠'?'selected':''}>🟠 Orange</option>
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
  document.querySelectorAll('.defs-filter-pick').forEach(b=>b.onclick=()=>{
    defsFilterTab = b.dataset.filter;
    render();
  });
  wireDefRowActions();
  applyDefSearchFilter();
}

function applyDefSearchFilter(){
  const q = (defSearchQuery||'').trim().toLowerCase();
  document.querySelectorAll('#defsListContainer > div').forEach(card=>{
    const match = !q || card.textContent.toLowerCase().includes(q);
    card.style.display = match ? '' : 'none';
  });
}

function defRowDone(d){
  return `<div class="card done def2-card" data-def2="${d.id}" style="cursor:pointer;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.completedDate?' · completed '+fmtDate(d.completedDate):''}${priorityTag(d)}</div>
    </div><span class="stamp done">Done</span></div>
  </div>`;
}

function defRowWithActions(d, showDatePicker){
  const st = dueStatus(d.dueDate, d.status);
  return `<div class="card ${st} def2-card" data-def2="${d.id}" style="cursor:pointer;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}${d.status==='WAIT'?' · WAITING':''}${priorityTag(d)}</div>
    </div><span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span></div>
    ${showDatePicker ? `<div class="row" style="margin-top:8px; gap:6px;">
      <input type="date" class="def-quickdate" style="margin-top:0;">
      <button class="btn small def-savedate">Set Date</button>
    </div>` : ''}
    <div class="row" style="margin-top:8px;"><button class="btn small done-btn def2-done">Mark Done</button></div>
  </div>`;
}

function wireDefRowActions(){
  document.querySelectorAll('.def2-done').forEach(b=>b.onclick=async(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-def2]').dataset.def2;
    const d2 = state.defs.find(d=>d.id===id);
    if(!d2){ showToast('Could not find that deficiency — try reloading.'); return; }
    d2.status='Done'; d2.completedDate=todayISO();
    await sset('defs', state.defs); render();
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
    <label>Priority</label>
    <select id="dPriority">
      <option value="High">High</option>
      <option value="Medium" selected>Medium</option>
      <option value="Low">Low</option>
    </select>
    <div id="dOverbookWarning" class="helptext" style="color:var(--stamp-amber); display:none; margin-top:8px;"></div>
    <div class="divider"></div>
    <button class="btn" id="dSave">Add Deficiency</button>
  `);
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
    state.defs.push({
      id:uid(), location:document.getElementById('dLocation').value.trim(), description:desc,
      owner, dueDate, priority:document.getElementById('dPriority').value,
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
    .sort((a,b)=> (PRIORITY_ORDER[a.priority]??1)-(PRIORITY_ORDER[b.priority]??1) || (a.dueDate||'').localeCompare(b.dueDate||''));
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

