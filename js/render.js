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
  const mine = openDefs.filter(d=>d.owner==='Josh' && d.dueDate && d.dueDate<=today).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
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

function cardForDef(d, st){
  return `<div class="card ${st}" data-def="${d.id}">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(d.description)}</div>
        <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):''}${d.status==='WAIT'?' · WAITING':''}${d.pushReason?' · '+escapeHtml(d.pushReason):''}</div>
      </div>
      <span class="stamp ${st}">${st==='done'?'Done':st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span>
    </div>
    <div class="row" style="margin-top:10px; gap:6px;">
      <button class="btn small done-btn defact-done">Mark Done</button>
    </div>
  </div>`;
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
    const id = e.target.closest('[data-def]').dataset.def;
    const d = state.defs.find(x=>x.id===id);
    d.status='Done'; d.completedDate=todayISO();
    await sset('defs', state.defs); render();
  });
}

function renderUnits(){
  let html = `<div class="section-title">Units<div style="display:flex; gap:6px;"><button class="btn small ghost" id="bulkWalkBtn">Set Walk Date</button><button class="btn small" id="addUnitBtn">+ Add Unit</button></div></div>`;
  const byProject = {};
  for(const u of state.units){ (byProject[u.project]=byProject[u.project]||[]).push(u); }
  const riskOrder = {'🔴':0,'🟠':1,'🟡':2,'🟢':3};
  for(const proj in byProject){
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
  }
  app.innerHTML = html;
  document.getElementById('addUnitBtn').onclick = ()=>openUnitModal();
  document.getElementById('bulkWalkBtn').onclick = ()=>openBulkWalkModal();
  document.querySelectorAll('[data-unit] .unit-open').forEach(b=>b.onclick=(e)=>{
    const id = e.target.closest('[data-unit]').dataset.unit;
    openUnitDetail(id);
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

function openUnitDetail(unitId){
  const u = state.units.find(x=>x.id===unitId);
  const insts = state.instances.filter(i=>i.unitId===unitId);
  const defs = state.defs.filter(d=>d.location===u.name);
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

  for(const row of groupRows){
    const {gi,g,due,done,total,st} = row;
    const isOpen = expandedGroupIds.has(gi.id);
    html += `<div class="card ${st}">
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
  html += `<div class="section-title">Deficiencies<button class="btn small" id="udAddDefBtn">+ Add</button></div>`;
  if(defs.length===0) html += `<div class="empty">None tied to this unit specifically.</div>`;
  const sortedDefs = defs.slice().sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  for(const d of sortedDefs){
    const st = dueStatus(d.dueDate, d.status);
    html += `<div class="card ${st}" data-uddef="${d.id}"><div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.owner||'Unassigned')} · ${d.status}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}</div>
      </div><span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span></div>
      <div class="row" style="margin-top:8px; gap:6px;">
        <button class="btn small done-btn ud-def-done">Mark Done</button>
        <button class="btn small danger ud-def-remove">Remove</button>
      </div>
    </div>`;
  }
  showModal(html);
  document.getElementById('logRoundBtn').onclick = ()=>openRoundModal(unitId);
  document.getElementById('editWalkBtn').onclick = ()=>openEditWalkModal(unitId);
  document.querySelectorAll('.pcg-toggle').forEach(el=>el.onclick=()=>{
    const id = el.dataset.giid;
    if(expandedGroupIds.has(id)) expandedGroupIds.delete(id); else expandedGroupIds.add(id);
    openUnitDetail(unitId);
  });
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
    const id = e.target.closest('[data-uddef]').dataset.uddef;
    const d2 = state.defs.find(d=>d.id===id);
    d2.status='Done'; d2.completedDate=todayISO();
    await sset('defs', state.defs);
    closeModal();
    showToast('Marked done.');
    openUnitDetail(unitId);
  });
  document.querySelectorAll('.ud-def-remove').forEach(b=>b.onclick=(e)=>{
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
  let html = `<div class="section-title">Deficiencies<span><button class="btn small ghost" id="importDefBtn">Import</button> <button class="btn small" id="addDefBtn">+ Add</button></span></div>`;
  if(state.defs.length===0) html += `<div class="empty">No deficiencies logged.</div>`;
  const open = state.defs.filter(d=>d.status!=='Done');
  const dated = open.filter(d=>d.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const undated = open.filter(d=>!d.dueDate);

  html += `<div class="section-title" style="margin-top:14px;">By Due Date<span class="pill">${dated.length}</span></div>`;
  if(dated.length===0) html += `<div class="empty">Nothing with a due date yet.</div>`;
  for(const d of dated){ html += defRowWithActions(d); }

  html += `<div class="section-title">No Due Date<span class="pill">${undated.length}</span></div>`;
  if(undated.length===0) html += `<div class="empty">Everything has a due date.</div>`;
  for(const d of undated){ html += defRowWithActions(d, true); }

  app.innerHTML = html;
  document.getElementById('addDefBtn').onclick = ()=>openDefModal();
  document.getElementById('importDefBtn').onclick = ()=>openDefImportModal();
  wireDefRowActions();
}

function defRowWithActions(d, showDatePicker){
  const st = dueStatus(d.dueDate, d.status);
  return `<div class="card ${st}" data-def2="${d.id}">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}${d.status==='WAIT'?' · WAITING':''}</div>
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
    const id = e.target.closest('[data-def2]').dataset.def2;
    const d2 = state.defs.find(d=>d.id===id);
    d2.status='Done'; d2.completedDate=todayISO();
    await sset('defs', state.defs); render();
  });
  document.querySelectorAll('.def-savedate').forEach(b=>b.onclick=async(e)=>{
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

function openDefModal(prefillLocation, onSaved){
  const dl = state.units.map(u=>`<option value="${escapeHtml(u.name)}">`).join('');
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
    <div class="divider"></div>
    <button class="btn" id="dSave">Add Deficiency</button>
  `);
  document.getElementById('dSave').onclick = async()=>{
    const desc = document.getElementById('dDesc').value.trim();
    if(!desc) return;
    state.defs.push({
      id:uid(), location:document.getElementById('dLocation').value.trim(), description:desc,
      owner:document.getElementById('dOwner').value, dueDate:document.getElementById('dDue').value||null,
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

function buildTodaysLog(){
  const today = todayISO();
  const roundsToday = state.roundHistory.filter(r=>r.date===today);
  const defsAdded = state.defs.filter(d=>d.createdDate===today);
  const defsCompleted = state.defs.filter(d=>d.status==='Done');
  const defsOverdue = state.defs.filter(d=>d.status!=='Done' && d.dueDate && d.dueDate<today);
  const defsDueToday = state.defs.filter(d=>d.status!=='Done' && d.dueDate===today);
  const checklistAddedToday = [], checklistDueToday = [], checklistOverdue = [], checklistCompletedToday = [];
  for(const inst of state.instances){
    const {m,due} = instanceInfo(inst);
    if(!m) continue;
    if(inst.createdDate===today) checklistAddedToday.push(m.name);
    if(inst.status==='Done' && inst.completedDate===today) checklistCompletedToday.push(m.name);
    else if(due===today) checklistDueToday.push(m.name);
    else if(due && due<today && inst.status!=='Done') checklistOverdue.push(m.name);
  }
  let html = '';
  html += `<b>Rounds logged today (${roundsToday.length}):</b><br>` + (roundsToday.length? roundsToday.map(r=>escapeHtml(r.unitName+' — '+r.risk+' — '+(r.currentPhase||'—'))).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Deficiencies added today (${defsAdded.length}):</b><br>` + (defsAdded.length? defsAdded.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Deficiencies due today (${defsDueToday.length}):</b><br>` + (defsDueToday.length? defsDueToday.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Deficiencies overdue (${defsOverdue.length}):</b><br>` + (defsOverdue.length? defsOverdue.map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Deficiencies completed today (${defsCompleted.filter(d=>d.completedDate===today).length}):</b><br>` + (defsCompleted.some(d=>d.completedDate===today)? defsCompleted.filter(d=>d.completedDate===today).map(d=>escapeHtml(d.description)).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Checklist items added today (${checklistAddedToday.length}):</b><br>` + (checklistAddedToday.length? checklistAddedToday.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Checklist due today (${checklistDueToday.length}):</b><br>` + (checklistDueToday.length? checklistDueToday.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Checklist overdue (${checklistOverdue.length}):</b><br>` + (checklistOverdue.length? checklistOverdue.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  html += `<br><br><b>Checklist completed today (${checklistCompletedToday.length}):</b><br>` + (checklistCompletedToday.length? checklistCompletedToday.map(escapeHtml).join('<br>') : '<span style="opacity:0.6">none</span>');
  return html;
}

function renderLog(){
  const today = todayISO();
  const historyDates = state.logHistory.map(h=>h.date);
  const allDates = [today, ...historyDates.filter(d=>d!==today)].sort().reverse();
  if(!selectedLogDate || !allDates.includes(selectedLogDate)) selectedLogDate = today;

  let html = `<div class="section-title">Daily Log</div>`;
  html += `<div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px;">`;
  for(const d of allDates){
    const isSel = d===selectedLogDate;
    const label = d===today ? 'Today' : fmtDate(d);
    html += `<button class="btn ${isSel?'':'ghost'} small log-date-pick" data-date="${d}" style="flex-shrink:0; white-space:nowrap;">${label}</button>`;
  }
  html += `</div>`;

  const hist = state.logHistory.find(h=>h.date===selectedLogDate);
  html += `<div class="card">`;
  if(selectedLogDate===today){
    html += `<div class="item-meta" style="font-weight:700; margin-bottom:8px;">LIVE — updates automatically</div>`;
    html += `<div style="font-size:13px; line-height:1.6;">${buildTodaysLog()}</div>`;
  } else if(hist){
    html += `<div class="item-meta" style="font-weight:700; margin-bottom:8px; opacity:0.7;">READ-ONLY HISTORY — imported from Notion</div>`;
    html += `<div style="font-size:13px; line-height:1.6;">${mdToHtml(hist.content)}</div>`;
  } else {
    html += `<div class="empty">No log for this date.</div>`;
  }
  html += `</div>`;

  app.innerHTML = html;
  document.querySelectorAll('.log-date-pick').forEach(b=>b.onclick=()=>{
    selectedLogDate = b.dataset.date;
    render();
  });
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

