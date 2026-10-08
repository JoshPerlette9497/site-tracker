/* ---------- rendering ---------- */
const app = document.getElementById('app');

function setHeader(){
  const d = new Date();
  document.getElementById('headerTitle').textContent = 'Site Log';
  document.getElementById('headerSub').textContent = d.toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'});
}

function render(){
  const scrollY = window.scrollY;
  if(activeTab==='brief') renderBrief();
  else if(activeTab==='units') renderUnits();
  else if(activeTab==='master') renderMaster();
  else if(activeTab==='defs') renderDefs();
  else if(activeTab==='log') renderLog();
  else if(activeTab==='schedule') renderSchedule();
  else if(activeTab==='sync') renderSync();
  window.scrollTo(0, scrollY);
}

/* Distinct top section on Brief — always the same place to look for "what's
   next." Just a highlighted preview of the Suggested Plan queue's own first
   item (below, unchanged), so reordering that queue moves NOW with it
   instead of the two drifting apart. Falls back to the oldest overdue
   follow-up when nothing is scheduled — "go check on this" rather than
   nothing at all. */
function nowSection(orderedPlan){
  const top = orderedPlan[0];
  let inner;
  if(top){
    inner = top.type==='def'
      ? cardForDef(top.ref, dueStatus(top.ref.dueDate, top.ref.status))
      : planPhaseCard(top);
  } else {
    const fu = followUpsDue()[0];
    inner = fu ? cardForDef(fu, dueStatus(fu.dueDate, fu.status)) : `<div class="empty">Nothing scheduled — Suggested Plan is clear.</div>`;
  }
  return `<div class="section-title">Now</div><div class="now-card">${inner}</div>`;
}

function renderBrief(){
  const today = todayISO();
  const tomorrow = addDays(today, 1);

  const openDefs = state.defs.filter(d=>d.status!=='Done' && isUnitActiveByLocation(d.location));
  const plan = buildSuggestedPlan();
  const tradeDueSoon = openDefs.filter(d=>d.owner==='Trade' && d.dueDate && d.dueDate<=tomorrow);
  const tradeOpenNoDue = openDefs.filter(d=>d.owner==='Trade' && !d.dueDate);
  const backlogCount = openDefs.filter(d=>(d.pushCount||0)>=1).length;
  const needsTriageCount = openDefs.filter(d=>!d.dueDate).length;

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

  const orderedPlan = applyManualOrder(plan.selected);

  let html = `<div class="section-title">Daily Brief — ${fmtDate(today)}</div>`;

  html += nowSection(orderedPlan);

  html += renderSafetyWalkthroughSection();

  html += `<div class="section-title" style="margin-top:14px;">Suggested Plan<span class="pill">${plan.used}/${plan.budget}m</span></div>`;
  if(plan.selected.length===0){
    html += `<div class="empty">Nothing of yours due or overdue today.</div>`;
  } else {
    html += `<div id="planScheduleList">` + orderedPlan.map(item => draggableScheduleItem(item, item.type==='def'
      ? cardForDef(item.ref, dueStatus(item.ref.dueDate, item.ref.status))
      : planPhaseCard(item)
    )).join('') + `</div>`;
  }
  if(plan.deferred.length>0){
    html += `<div class="section-title" style="margin-top:10px;">Didn't Fit Today<span class="pill">${plan.deferred.length}</span></div>`;
    html += plan.deferred.map(item=>deferredItemRow(item)).join('');
  }
  html += renderUpcomingScheduleSection();

  html += weekOverloadStrip();
  html += capacitySection();

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

  if(needsTriageCount>0){
    html += `<div class="empty" style="margin-top:8px;"><a href="#" id="needsTriageLink">Needs triage (no due date yet): ${needsTriageCount}</a></div>`;
  }
  html += `<div class="empty" style="margin-top:8px;">Backlog (pushed items): ${backlogCount}</div>`;

  app.innerHTML = html;
  wireCardActions();
  wireScheduleActions();
  wireCapacityActions();
  wireWeekOverloadStrip();
  wireDragReorder();
  wireSafetyWalkthroughActions();
  const triageLink = document.getElementById('needsTriageLink');
  if(triageLink) triageLink.onclick = (e)=>{
    e.preventDefault();
    activeTab = 'defs';
    defsFilterTab = 'undated';
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='defs'));
    render();
  };
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
      const startRect = dragEl.getBoundingClientRect();
      const grabOffsetY = e.clientY - startRect.top;
      let lastClientY = e.clientY;

      // Placeholder holds dragEl's spot in normal flow so the rest of the
      // list reflows around it. dragEl itself moves to document.body and
      // becomes a floating card tracking the pointer directly - pulling it
      // fully out of the container means every later querySelectorAll on
      // the container naturally excludes it, no manual filtering needed.
      const placeholder = document.createElement('div');
      placeholder.className = 'plan-drag-placeholder';
      placeholder.style.height = startRect.height + 'px';
      dragEl.before(placeholder);
      document.body.appendChild(dragEl);

      Object.assign(dragEl.style, {
        position:'fixed', left:startRect.left+'px', width:startRect.width+'px',
        top:startRect.top+'px', zIndex:'1000', pointerEvents:'none'
      });
      dragEl.classList.add('dragging');

      // FLIP-animates the rest of the list sliding apart/together as the
      // placeholder (the actual drop target) moves between them.
      function movePlaceholder(){
        const siblings = [...container.querySelectorAll('.plan-schedule-item')];
        let afterElement = null, closestOffset = -Infinity;
        for(const child of siblings){
          const box = child.getBoundingClientRect();
          const offset = lastClientY - box.top - box.height/2;
          if(offset < 0 && offset > closestOffset){ closestOffset = offset; afterElement = child; }
        }
        const alreadyThere = afterElement ? placeholder.nextElementSibling===afterElement : placeholder===container.lastElementChild;
        if(alreadyThere) return;

        const before = new Map(siblings.map(el=>[el, el.getBoundingClientRect()]));
        if(afterElement) container.insertBefore(placeholder, afterElement);
        else container.appendChild(placeholder);
        for(const el of siblings){
          const b = before.get(el), a = el.getBoundingClientRect();
          const dy = b.top - a.top;
          if(dy){
            el.style.transition = 'none';
            el.style.transform = `translateY(${dy}px)`;
            requestAnimationFrame(()=>{
              el.style.transition = 'transform 150ms ease';
              el.style.transform = '';
            });
          }
        }
      }

      let rafId = null;
      const EDGE = 70, MAX_SPEED = 16;
      function tick(){
        dragEl.style.top = (lastClientY - grabOffsetY) + 'px';
        if(lastClientY < EDGE) window.scrollBy(0, -MAX_SPEED * (1 - lastClientY/EDGE));
        else if(lastClientY > window.innerHeight - EDGE) window.scrollBy(0, MAX_SPEED * (1 - (window.innerHeight-lastClientY)/EDGE));
        movePlaceholder();
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);

      const onMove = (ev)=>{ lastClientY = ev.clientY; };
      const onUp = ()=>{
        cancelAnimationFrame(rafId);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        container.insertBefore(dragEl, placeholder);
        placeholder.remove();
        Object.assign(dragEl.style, {position:'', left:'', width:'', top:'', zIndex:'', pointerEvents:''});
        dragEl.classList.remove('dragging');
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
  const totalItems = SAFETY_CHECKLIST_SEED.reduce((n,g)=>n+g.items.length,0);
  const doneItems = w ? SAFETY_CHECKLIST_SEED.reduce((n,g)=>n+g.items.filter(it=>w.itemStatus[it.id]).length,0) : 0;
  const isOpen = safetyWalkthroughOpen;

  let html = `<div class="card">
    <div class="row safety-walkthrough-toggle" style="cursor:pointer;">
      <div>
        <div class="item-name">Daily Safety Walkthrough</div>
        <div class="item-meta">${w ? `${doneItems}/${totalItems} checked` : 'Not started'}</div>
      </div>
      <span style="font-size:16px;">${isOpen?'▾':'▸'}</span>
    </div>`;
  if(isOpen){
    html += `<div style="margin-top:10px;">`;
    if(!w){
      html += `<button class="btn" id="startWalkthroughBtn" style="width:100%;">Start Today's Walkthrough</button>`;
    } else {
      html += `<label>On-Site &amp; Paperwork Notes</label>
        <textarea id="walkthroughNotes" style="min-height:60px;" placeholder="Who's on site today, and have they filled out their daily paperwork?">${escapeHtml(w.onSiteNotes||'')}</textarea>
        <button class="btn small ghost" id="saveWalkthroughNotesBtn" style="margin-top:8px;">Save Notes</button>`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  if(isOpen && w){
    for(const g of SAFETY_CHECKLIST_SEED){
      const done = g.items.filter(it=>w.itemStatus[it.id]).length;
      html += `<div class="section-title" style="margin-top:14px;">${escapeHtml(g.name)}<span class="pill">${done}/${g.items.length}</span></div>`;
      for(const it of g.items){ html += safetyItemRow(w, it); }
    }
  }
  return html;
}

function safetyItemRow(w, it){
  const checked = !!w.itemStatus[it.id];
  const photos = w.itemPhotos[it.id] || [];
  const note = w.itemNotes[it.id] || '';
  let html = `<div class="card safety-item">
    <label style="display:flex; align-items:flex-start; gap:8px; cursor:pointer;">
      <input type="checkbox" class="safety-item-checkbox" data-itemid="${escapeHtml(it.id)}" ${checked?'checked':''} style="width:18px; height:18px; margin-top:2px; flex-shrink:0;">
      <span style="${checked?'text-decoration:line-through; opacity:0.6;':''}">${escapeHtml(it.text)}</span>
    </label>
    <input type="text" class="safety-item-note" data-itemid="${escapeHtml(it.id)}" placeholder="Add note…" value="${escapeHtml(note)}" style="margin-top:8px;">`;
  if(photos.length){
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">`;
    for(const p of photos){
      html += `<div class="hazard-photo">
        <img src="${escapeHtml(p.photoUrl)}" alt="Photo">
        <button class="hazard-photo-remove safety-item-photo-remove" data-itemid="${escapeHtml(it.id)}" data-photoid="${escapeHtml(p.id)}">×</button>
      </div>`;
    }
    html += `</div>`;
  }
  html += `<input type="file" accept="image/*" capture="environment" multiple class="safety-item-photo-input" data-itemid="${escapeHtml(it.id)}" style="display:none;">
    <button class="btn small ghost safety-item-photo-btn" data-itemid="${escapeHtml(it.id)}" style="margin-top:8px;">+ Photos${photos.length?' ('+photos.length+')':''}</button>
  </div>`;
  return html;
}

function wireSafetyWalkthroughActions(){
  document.querySelectorAll('.safety-walkthrough-toggle').forEach(row=>row.onclick=()=>{
    safetyWalkthroughOpen = !safetyWalkthroughOpen;
    render();
  });

  const startBtn = document.getElementById('startWalkthroughBtn');
  if(startBtn) startBtn.onclick = async()=>{ await ensureTodayWalkthrough(); render(); };

  const saveNotesBtn = document.getElementById('saveWalkthroughNotesBtn');
  if(saveNotesBtn) saveNotesBtn.onclick = async()=>{
    const w = todaySafetyWalkthrough();
    if(!w) return;
    await saveWalkthroughNotes(w.id, document.getElementById('walkthroughNotes').value);
    showToast('Notes saved.');
  };

  document.querySelectorAll('.safety-item-checkbox').forEach(cb=>cb.onchange=async(e)=>{
    const w = todaySafetyWalkthrough();
    if(!w) return;
    await toggleSafetyItem(w.id, e.target.dataset.itemid, e.target.checked);
    render();
  });

  document.querySelectorAll('.safety-item-note').forEach(input=>{
    input.onclick = (e)=>e.stopPropagation();
    input.onchange = async(e)=>{
      const w = todaySafetyWalkthrough();
      if(!w) return;
      await saveSafetyItemNote(w.id, e.target.dataset.itemid, e.target.value);
    };
  });

  document.querySelectorAll('.safety-item-photo-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const input = document.querySelector(`.safety-item-photo-input[data-itemid="${btn.dataset.itemid}"]`);
      if(input) input.click();
    };
  });

  document.querySelectorAll('.safety-item-photo-input').forEach(input=>{
    input.onchange = async(e)=>{
      const itemId = e.target.dataset.itemid;
      const files = [...e.target.files];
      if(files.length===0) return;
      const btn = document.querySelector(`.safety-item-photo-btn[data-itemid="${itemId}"]`);
      const originalLabel = btn ? btn.textContent : '';
      if(btn) btn.disabled = true;
      const w = todaySafetyWalkthrough();
      let uploaded = 0, failed = 0;
      for(const file of files){
        if(btn) btn.textContent = `Uploading ${uploaded+failed+1}/${files.length}…`;
        const url = await uploadSafetyPhoto(file);
        if(url){ await addSafetyItemPhoto(w.id, itemId, url); uploaded++; }
        else failed++;
      }
      e.target.value = '';
      if(btn){ btn.disabled = false; btn.textContent = originalLabel; }
      if(failed) showToast(`${uploaded} photo${uploaded===1?'':'s'} uploaded, ${failed} failed.`);
      else showToast(`${uploaded} photo${uploaded===1?'':'s'} added.`);
      render();
    };
  });

  document.querySelectorAll('.safety-item-photo-remove').forEach(b=>b.onclick=(e)=>{
    const itemId = e.target.dataset.itemid, photoId = e.target.dataset.photoid;
    const w = todaySafetyWalkthrough();
    showConfirm('Remove this photo?', async()=>{
      await removeSafetyItemPhoto(w.id, itemId, photoId);
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

/* Week Overload strip: a lightweight, glance-only view of the same 5-day
   forward projection the Capacity section below already computes (reusing
   computeWeekSchedule() via buildCapacityForecast() — no second source of
   truth for load). Not a calendar: shows the rolling 5-BUSINESS-day window
   starting today (same window as Capacity/Suggested Plan), labeled with
   real weekday abbreviations, rather than a fixed Mon-Sun block — this app
   has no weekend capacity budget at all (businessDaysForward skips
   Sat/Sun), so a rigid calendar week would show meaningless cells for
   weekends and could include already-past days of the current week with
   nothing useful to display. Tapping a day expands its task list inline
   right below the strip - one tap deeper, no new screen. */
function weekOverloadStrip(){
  const forecast = buildCapacityForecast();
  let html = `<div class="section-title" style="margin-top:14px;">Week Overload Check</div>`;
  html += `<div class="week-strip">`;
  for(const day of forecast){
    const pct = day.budget>0 ? day.used/day.budget : 0;
    // No pre-existing 3-tier threshold anywhere in this app to copy — the
    // existing Capacity section below is binary (fits/over only). 80% is a
    // new, judgment-call threshold for the middle "tight" tier.
    const tier = day.used>day.budget ? 'over' : pct>=0.8 ? 'tight' : 'fits';
    const selected = expandedWeekStripDay===day.day;
    html += `<div class="week-strip-day${selected?' selected':''}" data-stripday="${day.day}">
      <div class="week-strip-day-label">${fmtWeekday(day.day)}</div>
      <div class="week-strip-bar"><div class="week-strip-bar-fill ${tier}" style="width:${Math.min(100, pct*100)}%;"></div></div>
      <div class="week-strip-day-mins">${day.used}/${day.budget}m</div>
    </div>`;
  }
  html += `</div>`;
  if(expandedWeekStripDay){
    const day = forecast.find(d=>d.day===expandedWeekStripDay);
    if(day){
      html += `<div class="card" style="margin-top:8px;">
        <div class="item-name" style="font-size:13px; margin-bottom:6px;">${fmtDate(day.day)} — ${day.used}/${day.budget}m</div>`;
      if(day.fits.length===0){
        html += `<div class="empty">Nothing scheduled this day.</div>`;
      } else {
        for(const item of day.fits){
          html += `<div class="row" style="margin-top:6px; align-items:center;">
            <div style="flex:1; min-width:0;">
              <div class="item-name" style="font-size:13px;">${escapeHtml(item.description)}</div>
              <div class="item-meta">${escapeHtml(item.location||'—')} · ${item.estimatedMinutes||PLAN_DEFAULT_ESTIMATE}m${priorityTag(item)}</div>
            </div>
          </div>`;
        }
      }
      html += `</div>`;
    }
  }
  return html;
}
function wireWeekOverloadStrip(){
  document.querySelectorAll('[data-stripday]').forEach(el=>el.onclick=()=>{
    const day = el.dataset.stripday;
    expandedWeekStripDay = expandedWeekStripDay===day ? null : day;
    render();
  });
}

/* Next 5 business days: Josh's own workload vs. his daily budget, with
   push suggestions (shortest-time-first, same tiebreak as Suggested Plan)
   for whatever doesn't fit a day. Suggestions are read-only until
   confirmed via the Push button — nothing here touches a real due date. */
function capacitySection(){
  const forecast = buildCapacityForecast();
  let html = `<div class="section-title" style="margin-top:14px;">Capacity — Next 5 Business Days</div>`;
  for(const day of forecast){
    const over = day.used > day.budget;
    const toSuggest = [...day.pushed, ...(day.overflow||[])];
    html += `<div class="card${over?' overdue':''}">
      <div class="row">
        <div class="item-name">${fmtDate(day.day)}</div>
        <span class="stamp ${over?'overdue':'done'}">${day.used}/${day.budget}m</span>
      </div>`;
    if(toSuggest.length){
      const nextDay = nextBusinessDay(day.day);
      html += `<div class="item-meta" style="margin-top:6px;">Won't fit — suggest pushing to ${fmtDate(nextDay)}:</div>`;
      for(const item of toSuggest){
        html += `<div class="row" data-capacity-def="${item.id}" data-capacity-today="${day.day}" data-capacity-next="${nextDay}" style="margin-top:6px; align-items:center; gap:6px;">
          <div style="flex:1; min-width:0;">
            <div class="item-name" style="font-size:13px;">${escapeHtml(item.description)}</div>
            <div class="item-meta">${escapeHtml(item.location||'—')} · ${item.estimatedMinutes||PLAN_DEFAULT_ESTIMATE}m${priorityTag(item)}</div>
          </div>
          <button class="btn small capacity-push">Push</button>
          <button class="btn small ghost capacity-deny">Keep</button>
        </div>`;
      }
    }
    html += `</div>`;
  }
  return html;
}
function wireCapacityActions(){
  document.querySelectorAll('.capacity-push').forEach(b=>b.onclick=async(e)=>{
    const row = e.target.closest('[data-capacity-def]');
    const doPush = async()=>{
      await pushDefToNextBusinessDay(row.dataset.capacityDef, row.dataset.capacityToday, row.dataset.capacityNext);
      showToast('Pushed to '+fmtDate(row.dataset.capacityNext)+'.');
      render();
    };
    // Everything that ever reaches here is already a fixed item (only fixed
    // overflow is ever offered a push suggestion), but the confirm applies
    // on principle to any manual move of a fixed deadline, not just the new
    // capacity-cascade tool below — so it's here too for consistency.
    showConfirm(`This is marked as a fixed deadline — push it to ${fmtDate(row.dataset.capacityNext)} anyway?`, doPush);
  });
  document.querySelectorAll('.capacity-deny').forEach(b=>b.onclick=(e)=>{
    e.target.closest('[data-capacity-def]').remove();
  });
}

/* ---------- Manual capacity cascade (push-to-rebalance) ----------
   Reuses the exact same computeWeekSchedule()/buildCapacityForecast()
   capacity data as the Week Overload strip and the Capacity section above
   — no second source of truth. A purely manual tool: nothing here ever
   runs on its own, every push is one confirmed click at a time, and
   pushing an item off one day never silently cascades further — if that
   creates a new overload on the NEXT day, this just offers to open that
   day's cascade too, as a separate deliberate step. */
function capacityCascadeRowHtml(item, day){
  const isFixed = item.dueType!=='flexible';
  const pinned = !isFixed && item.plannedDate===day;
  return `<div class="card" data-cascadeid="${item.id}">
    <div class="item-name" style="font-size:13px;">${escapeHtml(item.description)}</div>
    <div class="item-meta" style="margin-top:2px;">${escapeHtml(item.location||'—')} · ${item.estimatedMinutes||PLAN_DEFAULT_ESTIMATE}m · ${isFixed?'Fixed':'Flexible'}${pinned?' · 📌 pinned here':''}</div>
    <div class="row" style="margin-top:8px; gap:6px;">
      <button class="btn small ghost cascade-push" data-cascadeid="${item.id}" style="flex:1;">Push to next business day</button>
      ${pinned ? `<button class="btn small ghost cascade-unpin" data-cascadeid="${item.id}">Unpin</button>` : ''}
    </div>
  </div>`;
}
function openCapacityCascadeModal(day){
  const row = literalDayBookings(day);
  const over = row.used >= row.budget;
  let html = `<h2>${fmtDate(day)}</h2>
    <div class="helptext" style="margin-bottom:10px;">${row.used}/${row.budget}m ${over?'— at or over capacity':'— fits'}</div>`;
  if(row.items.length===0){
    html += `<div class="empty">Nothing booked this day.</div>`;
  } else {
    for(const item of row.items){ html += capacityCascadeRowHtml(item, day); }
  }
  html += `<div class="divider"></div><button class="btn small ghost" id="cascadeCloseBtn" style="width:100%;">Close</button>`;
  showModal(html);
  document.getElementById('cascadeCloseBtn').onclick = closeModal;
  wireCapacityCascadeModal(day);
}
function wireCapacityCascadeModal(day){
  document.querySelectorAll('.cascade-push').forEach(btn=>btn.onclick=()=>{
    const id = btn.dataset.cascadeid;
    const item = state.defs.find(x=>x.id===id);
    if(!item) return;
    const nextDay = nextBusinessDay(day);
    const isFixed = item.dueType!=='flexible';
    const doPush = async()=>{
      await pushDefToNextBusinessDay(id, day, nextDay);
      showToast(`Pushed to ${fmtDate(nextDay)}.`);
      // The item just left `day`, so re-show this same day's cascade with
      // the updated list; separately offer the next day's cascade if THAT
      // now needs the same treatment — never auto-opened, always one more
      // deliberate click.
      openCapacityCascadeModal(day);
      const after = literalDayBookings(nextDay);
      if(after.used>=after.budget){
        showToast(`Heads up — ${fmtDate(nextDay)} is now at or over capacity too.`);
      }
    };
    if(isFixed){
      showConfirm(`"${item.description}" is marked as a fixed deadline — push it to ${fmtDate(nextDay)} anyway?`, doPush);
    } else if(nextDay > item.dueDate){
      showConfirm(`Pushing "${item.description}" to ${fmtDate(nextDay)} would move it past its own due date of ${fmtDate(item.dueDate)} — push anyway?`, doPush);
    } else {
      doPush();
    }
  });
  document.querySelectorAll('.cascade-unpin').forEach(btn=>btn.onclick=async()=>{
    await clearPlannedDate('d_'+btn.dataset.cascadeid);
    openCapacityCascadeModal(day);
  });
}

/* After any manual due-date save (Add/Edit/quick-date-picker) on a
   Josh-owned FIXED item, offers the capacity cascade if the day it landed
   on is now at/over capacity. Scoped to fixed items only — a flexible
   item's typed due date isn't necessarily where it actually lands (the
   scheduler picks that), so "the day I just moved this onto" only has a
   literal, unambiguous meaning for a fixed date. Does nothing (returns
   false) if there's nothing to offer, so callers can fall through to
   their own normal finish/close/render. */
function maybeOfferCapacityCascade(def){
  if(def.owner!=='Josh' || !def.dueDate || def.dueType==='flexible') return false;
  const row = literalDayBookings(def.dueDate);
  if(row.used<row.budget) return false;
  showToast(`${fmtDate(def.dueDate)} is now at or over capacity.`);
  openCapacityCascadeModal(def.dueDate);
  return true;
}

function planPhaseCard(item){
  const st = dueStatus(item.due, 'Open');
  const dueText = item.due ? ` · due ${fmtDate(item.due)}` : '';
  return `<div class="card ${st} plan-phase-card" data-unitid="${item.unit.id}" style="cursor:pointer;">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(item.group.name)}</div>
        <div class="item-meta">${escapeHtml(item.unit.name)} · Phase Check${dueText}</div>
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
  const startedMeta = d.startedAt ? ' · started '+new Date(d.startedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) : '';
  const verifierMeta = d.verifier ? ' · verify: '+escapeHtml(d.verifier) : '';
  return `<div class="card ${st} def-card" data-def="${d.id}" style="cursor:pointer;">
    <div class="row">
      <div>
        <div class="item-name">${escapeHtml(d.description)}</div>
        <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):''}${d.status==='WAIT'?' · WAITING':''}${d.pushReason?' · '+escapeHtml(d.pushReason):''}${d.estimatedMinutes?' · '+d.estimatedMinutes+'m':''}${d.plannedDate?' · planned '+fmtDate(d.plannedDate):''}${d.followUpDate?' · follow up '+fmtDate(d.followUpDate):''}${startedMeta}${verifierMeta}${priorityTag(d)}${categoryTag(d)}</div>
      </div>
      <span class="stamp ${st}">${st==='done'?'Done':st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span>
    </div>
    <div class="row" style="margin-top:10px; gap:6px;">
      ${(st!=='done' && !d.startedAt) ? '<button class="btn small ghost act-start">Start</button>' : ''}
      <button class="btn small done-btn defact-done">Mark Done</button>
    </div>
  </div>`;
}

/* Append-only notes log, newest first. ts is either a full ISO datetime
   (addDefNote) or a plain YYYY-MM-DD date (migrated from a legacy
   pushReason) — both slice cleanly to the date fmtDate expects. */
function notesListHtml(notes){
  if(!notes || !notes.length) return `<div class="helptext" style="opacity:0.6;">No notes yet.</div>`;
  return notes.slice().reverse().map(n=>
    `<div class="item-meta" style="margin-bottom:4px;">${n.ts?fmtDate(n.ts.slice(0,10))+' — ':''}${escapeHtml(n.text)}</div>`
  ).join('');
}

const ESTIMATE_MINUTE_OPTIONS = [5, 10, 30, 60, 120];
function estimateOptionsHtml(selected){
  const sel = selected ? Number(selected) : null;
  return `<option value="">—</option>` + ESTIMATE_MINUTE_OPTIONS.map(m=>
    `<option value="${m}" ${sel===m?'selected':''}>${m} min</option>`
  ).join('');
}

/* Fires after saving a deficiency (Add or Edit) whose estimate is over an
   hour — a one-shot ask, not a nag: "Not Now" sets subtaskPromptDismissed
   so it never re-asks for this same item again. No AI involved by design —
   Josh names and sizes the subtasks himself, on the spot. */
function subtaskRowHtml(n){
  // Stacked, not a 3-across flex row — cramming a free-text field next to
  // two short controls fought the global width:100% on every input and
  // squeezed the text field down to ~20px, so typing was invisible.
  return `<div class="subtask-row" style="margin-top:12px; padding-top:10px; border-top:1px solid var(--line);">
    <input type="text" class="subtask-text" placeholder="Subtask ${n}" style="margin-top:0;">
    <div class="row" style="gap:6px; margin-top:6px;">
      <select class="subtask-minutes" style="margin-top:0;">${estimateOptionsHtml()}</select>
      <input type="date" class="subtask-due" title="Due date — leave blank to auto-spread" style="margin-top:0;">
    </div>
  </div>`;
}
function openSubtaskPromptModal(defId, onDone){
  const d = state.defs.find(x=>x.id===defId);
  if(!d){ onDone(); return; }
  showModal(`
    <h2>Break This Down?</h2>
    <div class="helptext" style="margin-bottom:8px;">"${escapeHtml(d.description)}" is estimated at ${d.estimatedMinutes} min. Split it into smaller subtasks?</div>
    <div class="helptext" style="margin-bottom:8px;">Leave a subtask's date blank to spread it automatically across the days between now and ${d.dueDate?fmtDate(d.dueDate):'the due date'} — one per day where possible, so it doesn't all land on one day just because there's room.</div>
    <div id="subtaskRows">${subtaskRowHtml(1)}</div>
    <button class="btn small ghost" id="addSubtaskRow" style="margin-top:8px;">+ Add Subtask</button>
    <div class="divider"></div>
    <button class="btn" id="saveSubtasks" style="width:100%;">Create Subtasks</button>
    <button class="btn small ghost" id="skipSubtasks" style="width:100%; margin-top:6px;">Not Now</button>
  `);
  document.getElementById('addSubtaskRow').onclick = ()=>{
    const rows = document.getElementById('subtaskRows');
    rows.insertAdjacentHTML('beforeend', subtaskRowHtml(rows.children.length+1));
  };
  document.getElementById('saveSubtasks').onclick = async()=>{
    const subtasks = [...document.querySelectorAll('.subtask-row')].map(row=>({
      text: row.querySelector('.subtask-text').value.trim(),
      minutes: Number(row.querySelector('.subtask-minutes').value) || null,
      dueDate: row.querySelector('.subtask-due').value || null
    })).filter(s=>s.text);
    if(!subtasks.length){ showToast('Add at least one subtask, or tap Not Now.'); return; }
    const created = await splitDefIntoSubtasks(defId, subtasks);
    closeModal();
    showToast(`Split into ${created.length} subtask${created.length===1?'':'s'} — showing them below.`);
    // Always surface the freshly created subtasks directly on the
    // Deficiencies tab, regardless of where this was triggered from
    // (Add/Edit/manual) - otherwise they can land wherever their due date
    // put them with nothing indicating anything happened, which was the
    // whole point of fixing this.
    activeTab = 'defs';
    defsFilterTab = created.some(c=>c.dueDate) ? 'dated' : 'undated';
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='defs'));
    render();
  };
  document.getElementById('skipSubtasks').onclick = async()=>{
    await dismissSubtaskPrompt(defId);
    closeModal();
    onDone();
  };
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
  const originalDueDate = d.dueDate;
  let overbookConfirmed = false;
  let fixedMoveConfirmed = false;
  const parent = d.parentId ? state.defs.find(x=>x.id===d.parentId) : null;
  const children = state.defs.filter(x=>x.parentId===d.id);
  showModal(`
    <h2>Edit Deficiency</h2>
    ${parent ? `<div class="helptext" style="margin-bottom:8px;">↳ part of: <a href="#" id="edParentLink" style="color:var(--brand-dark); font-weight:600;">${escapeHtml(parent.description)}</a></div>` : ''}
    <label>Description</label><textarea id="edDesc" style="min-height:60px;">${escapeHtml(d.description)}</textarea>
    <label>Owner</label><select id="edOwner">
      <option value="Trade" ${d.owner==='Trade'?'selected':''}>Trade</option>
      <option value="Josh" ${d.owner==='Josh'?'selected':''}>Josh</option>
      <option value="Unassigned" ${(!d.owner||d.owner==='Unassigned')?'selected':''}>Unassigned</option>
    </select>
    <div class="field-row">
      <div><label>Due Date</label><input id="edDue" type="date" value="${d.dueDate||''}"></div>
      <div><label>Schedule</label>
      <select id="edDueType">
        <option value="fixed" ${(!d.dueType||d.dueType==='fixed')?'selected':''}>Fixed date</option>
        <option value="flexible" ${d.dueType==='flexible'?'selected':''}>Flexible (auto-scheduled)</option>
      </select></div>
    </div>
    <div id="edBookingPreview">${d.owner==='Josh' ? bookingPreviewHtml(d.dueDate, d.id) : ''}</div>
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
    <div class="field-row" style="margin-top:8px;">
      <div><label>Verifier</label><input id="edVerifier" type="text" placeholder="Who confirms it's done?" value="${escapeHtml(d.verifier||'')}"></div>
      <div><label>Follow-up Date</label><input id="edFollowUp" type="date" value="${d.followUpDate||''}"></div>
    </div>
    <label style="margin-top:8px; display:block;">Notes</label>
    <div id="edNotesList" style="max-height:120px; overflow-y:auto; margin-bottom:6px;">${notesListHtml(d.notes)}</div>
    <div class="row" style="gap:6px;">
      <input id="edNewNote" type="text" placeholder="Add a note…" style="flex:1;">
      <button class="btn small" id="edAddNote">Add</button>
    </div>
    ${children.length ? `<label style="margin-top:8px; display:block;">Subtasks (${children.length})</label>
    <div id="edSubtasksList">${children.map(subtaskEditRowHtml).join('')}</div>` : ''}
    ${d.status!=='Done' ? `<button class="btn small ghost" id="edBreakDown" style="width:100%; margin-top:10px;">Break Into Subtasks</button>` : ''}
    <div id="edOverbookWarning" class="helptext" style="color:var(--stamp-amber); display:none; margin-top:8px;"></div>
    <div class="divider"></div>
    <button class="btn" id="edSave" style="width:100%;">Save Changes</button>
  `);
  const updateEdBookingPreview = ()=>{
    const owner = document.getElementById('edOwner').value;
    const dueDate = document.getElementById('edDue').value;
    document.getElementById('edBookingPreview').innerHTML = (owner==='Josh' && dueDate) ? bookingPreviewHtml(dueDate, d.id) : '';
  };
  document.getElementById('edOwner').onchange = (e)=>{
    document.getElementById('edEstimateWrap').style.display = e.target.value==='Trade' ? 'none' : '';
    updateEdBookingPreview();
  };
  document.getElementById('edDue').oninput = updateEdBookingPreview;
  document.getElementById('edAddNote').onclick = async()=>{
    const text = document.getElementById('edNewNote').value.trim();
    if(!text) return;
    await addDefNote(d.id, text);
    document.getElementById('edNewNote').value = '';
    document.getElementById('edNotesList').innerHTML = notesListHtml(d.notes);
  };
  const breakDownBtn = document.getElementById('edBreakDown');
  if(breakDownBtn) breakDownBtn.onclick = ()=>openSubtaskPromptModal(d.id, ()=>render());
  const parentLink = document.getElementById('edParentLink');
  if(parentLink) parentLink.onclick = (e)=>{ e.preventDefault(); openEditDefModal(parent.id, onSaved); };
  document.querySelectorAll('[data-subtask-edit]').forEach(el=>{
    el.onclick = ()=>openEditDefModal(el.dataset.subtaskEdit, onSaved);
  });
  document.getElementById('edSave').onclick = async()=>{
    const desc = document.getElementById('edDesc').value.trim();
    if(!desc){ showToast('Description cannot be empty.'); return; }
    const owner = document.getElementById('edOwner').value;
    const dueDate = document.getElementById('edDue').value || null;
    const dueType = document.getElementById('edDueType').value;
    // A lightweight guard against accidentally sliding a hard commitment —
    // not a block, just a confirm, since the system itself still never
    // moves a fixed item on its own; this only fires when an EXISTING
    // fixed date is actually being changed, not when one's being set for
    // the first time (that's not "moving" anything yet).
    if(dueType==='fixed' && originalDueDate && dueDate!==originalDueDate && !fixedMoveConfirmed){
      fixedMoveConfirmed = true;
      const warn = document.getElementById('edOverbookWarning');
      warn.style.display = 'block';
      warn.textContent = `This is marked as a fixed deadline — tap Save Changes again to move it anyway.`;
      document.getElementById('edSave').textContent = 'Save Changes Anyway';
      return;
    }
    // The overbook warning only makes sense for a fixed date — it's
    // protecting against cramming too many hard-anchored items onto one
    // day, but a flexible item's whole point is that the scheduler spreads
    // it out automatically, so the same nag here would just be noise.
    if(owner==='Josh' && dueDate && dueType==='fixed' && !overbookConfirmed){
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
    d.dueType = dueType;
    // A planned date is a commitment made around a specific due date; once
    // that due date actually changes, the old plan no longer applies to it.
    if(dueDate !== originalDueDate) d.plannedDate = null;
    d.priority = document.getElementById('edPriority').value;
    d.category = document.getElementById('edCategory').value;
    d.verifier = document.getElementById('edVerifier').value.trim() || null;
    d.followUpDate = document.getElementById('edFollowUp').value || null;
    const estVal = document.getElementById('edEstimate').value;
    d.estimatedMinutes = (owner!=='Trade' && estVal) ? Number(estVal) : null;
    await sset('defs', state.defs);
    const finish = ()=>{
      showToast('Deficiency updated.');
      if(onSaved) onSaved();
      if(dueDate !== originalDueDate) maybeOfferCapacityCascade(d);
    };
    if(d.estimatedMinutes >= 30 && d.status!=='Done' && !d.subtaskPromptDismissed){
      openSubtaskPromptModal(d.id, finish);
    } else {
      closeModal();
      finish();
    }
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
  document.querySelectorAll('.act-start').forEach(b=>b.onclick=async(e)=>{
    e.stopPropagation();
    const id = e.target.closest('[data-def]').dataset.def;
    await markDefStarted(id);
    render();
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
  const qcInProgress = qcInspectionInProgress(gi.unitId, g.id);
  let html = `<div class="card ${st}${highlight?' week-urgent':''}">
    <div class="row pcg-toggle" data-giid="${gi.id}" style="cursor:pointer;">
      <div style="min-width:0; flex:1;">
        <div class="item-name">${escapeHtml(g.name)}</div>
        <div class="item-meta">${due?'due '+fmtDate(due):'no schedule match'} · ${done}/${total} done · v${g.version||1}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
        ${highlight?'<span class="stamp week-urgent">This Week</span>':''}
        ${qcInProgress?'<span class="stamp today">QC In Progress</span>':''}
        <span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':st==='done'?'Done':'Open'}</span>
        <span style="font-size:16px;">${isOpen?'▾':'▸'}</span>
      </div>
    </div>`;
  if(isOpen){
    html += `<div class="row" style="margin-top:10px; gap:6px;">
      <button class="btn small qc-start-btn" data-unitid="${gi.unitId}" data-groupid="${g.id}" style="flex:1;">${qcInProgress?'Continue QC Check':'Start QC Check'}</button>
      <button class="btn small ghost qc-history-btn" data-groupid="${g.id}" data-unitid="${gi.unitId}">QC History</button>
    </div>`;
    html += `<div class="item-meta" style="margin-top:10px;">Ongoing completion tracking</div>`;
    html += `<div style="margin-top:4px;">`;
    let lastSub = undefined;
    for(const it of g.items){
      if(it.subgroup !== lastSub){
        html += `<div class="item-meta" style="font-weight:700; margin-top:8px;">${escapeHtml(it.subgroup||'')}</div>`;
        lastSub = it.subgroup;
      }
      const checked = !!gi.itemStatus[it.id];
      html += `<div style="display:flex; align-items:center; gap:4px; padding:5px 0; border-top:1px solid var(--line);">
        <label style="display:flex; align-items:center; gap:8px; font-size:13px; flex:1; cursor:pointer;">
          <input type="checkbox" class="pcg-item" data-giid="${gi.id}" data-itemid="${it.id}" ${checked?'checked':''} style="width:18px; height:18px; margin:0; flex-shrink:0;">
          <span style="${checked?'text-decoration:line-through; opacity:0.55;':''}">${escapeHtml(it.text)}</span>
        </label>
        <button class="pcg-item-remove" data-groupid="${g.id}" data-itemid="${it.id}" title="Remove item" style="background:none; border:none; color:var(--ink-dim); font-size:18px; line-height:1; padding:2px 6px; cursor:pointer; flex-shrink:0;">×</button>
      </div>`;
    }
    const existingSubgroups = [...new Set(g.items.map(it=>it.subgroup).filter(Boolean))];
    const sectionOptions = ['Blocker', ...existingSubgroups.filter(s=>s!=='Blocker')];
    html += `<div class="row" style="margin-top:8px; gap:6px; flex-wrap:wrap;">
      <select class="pcg-additem-section" data-groupid="${g.id}" style="margin-top:0; flex:1 1 120px;">
        ${sectionOptions.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
      </select>
      <input type="text" class="pcg-additem-input" data-groupid="${g.id}" placeholder="Add item…" style="margin-top:0; flex:2 1 160px;">
      <button class="btn small ghost pcg-additem-btn" data-groupid="${g.id}">Add</button>
    </div>`;
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

/* ---------- QC Phase Check + Controlled Checklist Evolution ----------
   Three screens, each a full showModal() replacement of whatever came
   before (this app only ever has one modal open at a time), chained via
   the "Back"/"Finish" buttons rather than nesting:
     openQcCheckModal    - run the frozen checklist (Pass/Issue/NA) + log
                            Discovered Items while inspecting
     openQcReviewModal   - only reached if there's at least one discovery;
                            forces a NEW/MERGED/REJECTED decision on each
     openQcHistoryModal / openQcInspectionDetailModal - read-only history:
                            checklist version log + past inspections */

function qcItemRowHtml(insp, item){
  const result = insp.itemResults[item.id] || '';
  const note = insp.itemNotes[item.id] || '';
  return `<div class="card" style="margin-bottom:6px;">
    <div class="item-name" style="font-size:13px;">${escapeHtml(item.text)}</div>
    <div class="row" style="margin-top:8px; gap:6px;">
      <button class="btn small qc-result-btn ${result==='pass'?'done-btn':'ghost'}" data-result="pass" data-itemid="${item.id}" style="flex:1;">Pass</button>
      <button class="btn small qc-result-btn ${result==='issue'?'danger':'ghost'}" data-result="issue" data-itemid="${item.id}" style="flex:1;">Issue</button>
      <button class="btn small qc-result-btn ${result==='na'?'':'ghost'}" data-result="na" data-itemid="${item.id}" style="flex:1; ${result==='na'?'background:var(--ink-dim); color:#fff;':''}">N/A</button>
    </div>
    ${result==='issue' ? `<input type="text" class="qc-item-note" data-itemid="${item.id}" placeholder="Note (optional)…" value="${escapeHtml(note)}" style="margin-top:8px;">` : ''}
  </div>`;
}

function qcDiscoveryRowHtml(d){
  let html = `<div class="card">
    <div class="item-name" style="font-size:13px;">${escapeHtml(d.description)}</div>
    ${d.severity?`<div class="item-meta" style="margin-top:2px;">Severity: ${escapeHtml(d.severity)}</div>`:''}
    ${d.notes?`<div style="font-size:13px; margin-top:4px;">${escapeHtml(d.notes)}</div>`:''}`;
  if(d.photos.length){
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">`;
    for(const p of d.photos){
      html += `<div class="hazard-photo"><img src="${escapeHtml(p.photoUrl)}" alt="Photo"><button class="hazard-photo-remove qc-disc-photo-remove" data-discid="${d.id}" data-photoid="${p.id}">×</button></div>`;
    }
    html += `</div>`;
  }
  html += `<input type="file" accept="image/*" capture="environment" multiple class="qc-disc-photo-input" data-discid="${d.id}" style="display:none;">
    <div class="row" style="margin-top:8px; gap:6px;">
      <button class="btn small ghost qc-disc-photo-btn" data-discid="${d.id}" style="flex:1;">+ Photo${d.photos.length?' ('+d.photos.length+')':''}</button>
      <button class="btn small danger qc-disc-remove" data-discid="${d.id}" style="flex:1;">Remove</button>
    </div>
  </div>`;
  return html;
}

function qcDiscoveryFormHtml(){
  return `<div class="card">
    <label>What did you notice?</label>
    <textarea id="qcDiscDesc" style="min-height:60px;" placeholder="e.g. Garage duct penetration missing firestop"></textarea>
    <label style="margin-top:8px; display:block;">Severity (optional)</label>
    <select id="qcDiscSeverity">
      <option value="">— none —</option>
      <option value="Low">Low</option>
      <option value="Medium">Medium</option>
      <option value="High">High</option>
    </select>
    <label style="margin-top:8px; display:block;">Notes (optional)</label>
    <textarea id="qcDiscNotes" style="min-height:50px;" placeholder="Details…"></textarea>
    <div class="row" style="margin-top:10px; gap:6px;">
      <button class="btn small ghost" id="qcDiscCancel" style="flex:1;">Cancel</button>
      <button class="btn small" id="qcDiscSave" style="flex:1;">Add Discovery</button>
    </div>
  </div>`;
}

function openQcCheckModal(inspectionId){
  const insp = state.qcInspections.find(x=>x.id===inspectionId);
  if(!insp){ showToast('Could not find that QC check — try reloading.'); return; }
  const u = state.units.find(x=>x.id===insp.unitId);
  let html = `<h2>QC Check</h2>
    <div class="helptext" style="margin-bottom:12px;">${escapeHtml(u?u.name:'')} · ${escapeHtml(insp.phaseName)} · checklist v${insp.checklistVersionNumber} · started ${fmtDate(insp.startedAt.slice(0,10))}</div>`;
  let lastSub;
  for(const it of insp.checklistSnapshot){
    if(it.subgroup !== lastSub){
      html += `<div class="item-meta" style="font-weight:700; margin-top:10px;">${escapeHtml(it.subgroup||'')}</div>`;
      lastSub = it.subgroup;
    }
    html += qcItemRowHtml(insp, it);
  }
  html += `<div class="section-title">Discovered Items<span class="pill">${insp.discoveries.length}</span></div>
    <div class="helptext" style="margin-bottom:8px;">Noticed something not already covered by the checklist above? Record it here — it won't change the checklist on its own; you'll decide that when you finish.</div>`;
  for(const d of insp.discoveries){ html += qcDiscoveryRowHtml(d); }
  if(qcDiscoveryFormOpenFor===insp.id){
    html += qcDiscoveryFormHtml();
  } else {
    html += `<button class="btn small ghost" id="qcAddDiscBtn" style="width:100%;">+ Add Discovered Item</button>`;
  }
  html += `<div class="divider"></div>
    <button class="btn" id="qcFinishBtn" style="width:100%;">Finish QC Check</button>
    <button class="btn small ghost" id="qcBackBtn" style="width:100%; margin-top:8px;">Save &amp; Back to Unit</button>`;
  showModal(html);
  wireQcCheckModal(inspectionId);
}

function wireQcCheckModal(inspectionId){
  const insp = state.qcInspections.find(x=>x.id===inspectionId);
  if(!insp) return;
  document.getElementById('qcBackBtn').onclick = ()=>{ qcDiscoveryFormOpenFor = null; openUnitDetail(insp.unitId); };
  document.querySelectorAll('.qc-result-btn').forEach(btn=>btn.onclick=async()=>{
    await setQcItemResult(inspectionId, btn.dataset.itemid, btn.dataset.result);
    openQcCheckModal(inspectionId);
  });
  document.querySelectorAll('.qc-item-note').forEach(inp=>{
    inp.onchange = async(e)=>{ await setQcItemNote(inspectionId, e.target.dataset.itemid, e.target.value.trim()); };
  });
  const addBtn = document.getElementById('qcAddDiscBtn');
  if(addBtn) addBtn.onclick = ()=>{ qcDiscoveryFormOpenFor = inspectionId; openQcCheckModal(inspectionId); };
  const cancelBtn = document.getElementById('qcDiscCancel');
  if(cancelBtn) cancelBtn.onclick = ()=>{ qcDiscoveryFormOpenFor = null; openQcCheckModal(inspectionId); };
  const saveBtn = document.getElementById('qcDiscSave');
  if(saveBtn) saveBtn.onclick = async()=>{
    const desc = document.getElementById('qcDiscDesc').value.trim();
    if(!desc){ showToast('Describe what you noticed first.'); return; }
    await addQcDiscovery(inspectionId, {
      description: desc,
      severity: document.getElementById('qcDiscSeverity').value,
      notes: document.getElementById('qcDiscNotes').value.trim()
    });
    qcDiscoveryFormOpenFor = null;
    openQcCheckModal(inspectionId);
  };
  document.querySelectorAll('.qc-disc-remove').forEach(btn=>btn.onclick=()=>{
    showConfirm('Remove this discovery? It was only recorded this session and has not been reviewed yet.', async()=>{
      await removeQcDiscovery(inspectionId, btn.dataset.discid);
      openQcCheckModal(inspectionId);
    });
  });
  document.querySelectorAll('.qc-disc-photo-btn').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelector(`.qc-disc-photo-input[data-discid="${btn.dataset.discid}"]`).click();
    };
  });
  document.querySelectorAll('.qc-disc-photo-input').forEach(input=>{
    input.onchange = async(e)=>{
      const discId = e.target.dataset.discid;
      const files = [...e.target.files];
      if(files.length===0) return;
      const btn = document.querySelector(`.qc-disc-photo-btn[data-discid="${discId}"]`);
      const originalLabel = btn ? btn.textContent : '';
      if(btn) btn.disabled = true;
      let uploaded = 0, failed = 0;
      for(const file of files){
        if(btn) btn.textContent = `Uploading ${uploaded+failed+1}/${files.length}…`;
        const url = await uploadSafetyPhoto(file);
        if(url){ await addQcDiscoveryPhoto(inspectionId, discId, url); uploaded++; }
        else failed++;
      }
      if(btn){ btn.disabled = false; btn.textContent = originalLabel; }
      if(failed) showToast(`${uploaded} photo${uploaded===1?'':'s'} uploaded, ${failed} failed.`);
      openQcCheckModal(inspectionId);
    };
  });
  document.querySelectorAll('.qc-disc-photo-remove').forEach(btn=>btn.onclick=()=>{
    showConfirm('Remove this photo?', async()=>{
      await removeQcDiscoveryPhoto(inspectionId, btn.dataset.discid, btn.dataset.photoid);
      openQcCheckModal(inspectionId);
    });
  });
  document.getElementById('qcFinishBtn').onclick = ()=>{
    if(insp.discoveries.length===0){
      finishQcInspection(inspectionId, []).then(()=>{
        showToast('QC Check completed.');
        openUnitDetail(insp.unitId);
      });
    } else {
      openQcReviewModal(inspectionId);
    }
  };
}

function qcReviewDiscoveryHtml(g, d, idx){
  const existingSubgroups = [...new Set(g.items.map(it=>it.subgroup).filter(Boolean))];
  if(!qcReviewDraft[d.id]){
    qcReviewDraft[d.id] = {decision:'REJECTED', wording:d.description, mergeIntoItemId:'', subgroup: existingSubgroups[0]||'QC'};
  }
  const draft = qcReviewDraft[d.id];
  const related = relatedChecklistItems(g.items, d.description);
  const whyMatters = d.severity==='High'
    ? 'High severity — could create meaningful cost, rework, schedule impact, safety risk, warranty issue, or inspection failure if missed.'
    : d.severity==='Medium'
    ? 'Medium severity — weigh how likely this is to recur against how much attention a permanent check would cost.'
    : 'Minor imperfections should generally not become permanent checklist items unless they\'re genuinely likely to recur and worth deliberately checking for every time.';
  let html = `<div class="card">
    <div class="item-name">${idx+1}. ${escapeHtml(d.description)}</div>
    ${d.severity?`<div class="item-meta" style="margin-top:2px;">Severity: ${escapeHtml(d.severity)}</div>`:''}
    ${d.notes?`<div style="font-size:13px; margin-top:4px;">${escapeHtml(d.notes)}</div>`:''}
    <div class="helptext" style="margin-top:6px;">Why it matters: ${whyMatters}</div>`;
  if(related.length){
    html += `<div class="helptext" style="margin-top:6px;"><b>Possibly already covered by:</b><br>${related.map(it=>`• ${escapeHtml(it.text)}`).join('<br>')}</div>`;
  }
  html += `<div class="helptext" style="margin-top:8px; padding:8px; background:var(--surface); border-radius:6px;">Before adding: is this high consequence, reasonably likely to recur, worth actively checking for every time, and not already covered above? If in doubt, merge or don't add — the checklist stays valuable by staying small.</div>`;
  html += `<div class="row" style="margin-top:10px; gap:6px;">
    <button class="btn small qc-decision-btn ${draft.decision==='REJECTED'?'':'ghost'}" data-discid="${d.id}" data-decision="REJECTED" style="flex:1;">Don't Add</button>
    <button class="btn small qc-decision-btn ${draft.decision==='MERGED'?'':'ghost'}" data-discid="${d.id}" data-decision="MERGED" style="flex:1;">Merge</button>
    <button class="btn small qc-decision-btn ${draft.decision==='NEW'?'':'ghost'}" data-discid="${d.id}" data-decision="NEW" style="flex:1;">Add New</button>
  </div>`;
  if(draft.decision==='MERGED'){
    html += `<label style="margin-top:8px; display:block;">Merge into</label>
      <select class="qc-merge-select" data-discid="${d.id}">
        <option value="">— choose an item —</option>
        ${g.items.map(it=>`<option value="${it.id}" ${draft.mergeIntoItemId===it.id?'selected':''}>${escapeHtml(it.text)}</option>`).join('')}
      </select>
      <label style="margin-top:8px; display:block;">New wording for that item</label>
      <textarea class="qc-wording-input" data-discid="${d.id}" style="min-height:50px;">${escapeHtml(draft.wording)}</textarea>`;
  } else if(draft.decision==='NEW'){
    html += `<label style="margin-top:8px; display:block;">Section</label>
      <select class="qc-subgroup-select" data-discid="${d.id}">
        ${existingSubgroups.map(s=>`<option value="${escapeHtml(s)}" ${draft.subgroup===s?'selected':''}>${escapeHtml(s)}</option>`).join('')}
      </select>
      <label style="margin-top:8px; display:block;">New checklist item wording</label>
      <textarea class="qc-wording-input" data-discid="${d.id}" style="min-height:50px;">${escapeHtml(draft.wording)}</textarea>`;
  }
  html += `</div>`;
  return html;
}

function openQcReviewModal(inspectionId){
  const insp = state.qcInspections.find(x=>x.id===inspectionId);
  if(!insp) return;
  const g = state.checklistGroups.find(x=>x.id===insp.groupId);
  let html = `<h2>Review Discoveries</h2>
    <div class="helptext" style="margin-bottom:10px;">Decide whether each discovery should change the checklist. The checklist stays small and high-value on purpose — merge or reject whenever an existing item already covers it, or it's unlikely to recur.</div>`;
  insp.discoveries.forEach((d,i)=>{ html += qcReviewDiscoveryHtml(g, d, i); });
  html += `<div class="divider"></div>
    <button class="btn" id="qcConfirmDecisionsBtn" style="width:100%;">Confirm &amp; Finish QC Check</button>
    <button class="btn small ghost" id="qcReviewBackBtn" style="width:100%; margin-top:8px;">Back to Checklist</button>`;
  showModal(html);
  wireQcReviewModal(inspectionId);
}

function wireQcReviewModal(inspectionId){
  const insp = state.qcInspections.find(x=>x.id===inspectionId);
  if(!insp) return;
  document.getElementById('qcReviewBackBtn').onclick = ()=>openQcCheckModal(inspectionId);
  document.querySelectorAll('.qc-decision-btn').forEach(btn=>btn.onclick=()=>{
    const draft = qcReviewDraft[btn.dataset.discid];
    if(draft) draft.decision = btn.dataset.decision;
    openQcReviewModal(inspectionId);
  });
  document.querySelectorAll('.qc-merge-select').forEach(sel=>sel.onchange=(e)=>{
    const draft = qcReviewDraft[e.target.dataset.discid];
    if(!draft) return;
    draft.mergeIntoItemId = e.target.value;
    const g = state.checklistGroups.find(x=>x.id===insp.groupId);
    const target = g ? g.items.find(it=>it.id===e.target.value) : null;
    if(target) draft.wording = target.text;
    openQcReviewModal(inspectionId);
  });
  document.querySelectorAll('.qc-subgroup-select').forEach(sel=>sel.onchange=(e)=>{
    const draft = qcReviewDraft[e.target.dataset.discid];
    if(draft) draft.subgroup = e.target.value;
  });
  document.querySelectorAll('.qc-wording-input').forEach(inp=>inp.onchange=(e)=>{
    const draft = qcReviewDraft[e.target.dataset.discid];
    if(draft) draft.wording = e.target.value;
  });
  document.getElementById('qcConfirmDecisionsBtn').onclick = async()=>{
    const decisions = [];
    for(const d of insp.discoveries){
      const draft = qcReviewDraft[d.id] || {decision:'REJECTED'};
      if(draft.decision==='NEW' && !draft.wording.trim()){ showToast('Add wording for the new checklist item.'); return; }
      if(draft.decision==='MERGED' && (!draft.mergeIntoItemId || !draft.wording.trim())){ showToast('Choose an item to merge into and confirm its wording.'); return; }
      decisions.push({discoveryId:d.id, decision:draft.decision, wording:draft.wording, mergeIntoItemId:draft.mergeIntoItemId, subgroup:draft.subgroup});
    }
    await finishQcInspection(inspectionId, decisions);
    qcReviewDraft = {};
    showToast('QC Check completed.');
    openUnitDetail(insp.unitId);
  };
}

function openQcHistoryModal(groupId, unitId){
  const g = state.checklistGroups.find(x=>x.id===groupId);
  if(!g) return;
  const u = state.units.find(x=>x.id===unitId);
  const versions = state.checklistVersions.filter(v=>v.groupId===groupId).sort((a,b)=>b.versionNumber-a.versionNumber);
  const inspections = state.qcInspections.filter(q=>q.groupId===groupId && q.unitId===unitId && q.status==='completed')
    .sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));
  let html = `<h2>${escapeHtml(g.name)} — QC History</h2>`;
  html += `<div class="section-title" style="margin-top:0;">Checklist Version History</div>`;
  if(versions.length===0){
    html += `<div class="empty">No version history yet.</div>`;
  } else {
    for(const v of versions){
      html += `<div class="card">
        <div class="item-name" style="font-size:13px;">Version ${v.versionNumber} — ${fmtDate(v.createdDate)}</div>
        <div style="font-size:13px; margin-top:4px;">${escapeHtml(v.reason||'')}</div>
      </div>`;
    }
  }
  html += `<div class="section-title">Inspections at ${escapeHtml(u?u.name:'this unit')}</div>`;
  if(inspections.length===0){
    html += `<div class="empty">No completed QC checks yet.</div>`;
  } else {
    for(const insp of inspections){
      const results = Object.values(insp.itemResults);
      const passCount = results.filter(r=>r==='pass').length;
      const issueCount = results.filter(r=>r==='issue').length;
      const naCount = results.filter(r=>r==='na').length;
      html += `<div class="card qc-insp-row" data-inspid="${insp.id}" style="cursor:pointer;">
        <div class="item-name" style="font-size:13px;">${fmtDate(insp.completedAt.slice(0,10))} — checklist v${insp.checklistVersionNumber}</div>
        <div class="item-meta" style="margin-top:4px;">${passCount} pass · ${issueCount} issue · ${naCount} n/a · ${insp.discoveries.length} discover${insp.discoveries.length===1?'y':'ies'}</div>
      </div>`;
    }
  }
  html += `<div class="divider"></div><button class="btn small ghost" id="qcHistoryBackBtn" style="width:100%;">Close</button>`;
  showModal(html);
  document.getElementById('qcHistoryBackBtn').onclick = ()=>openUnitDetail(unitId);
  document.querySelectorAll('.qc-insp-row').forEach(row=>row.onclick=()=>openQcInspectionDetailModal(row.dataset.inspid));
}

function openQcInspectionDetailModal(inspectionId){
  const insp = state.qcInspections.find(x=>x.id===inspectionId);
  if(!insp) return;
  const u = state.units.find(x=>x.id===insp.unitId);
  let html = `<h2>${escapeHtml(insp.phaseName)} — ${escapeHtml(u?u.name:'')}</h2>
    <div class="helptext" style="margin-bottom:10px;">Checklist v${insp.checklistVersionNumber} · started ${fmtDate(insp.startedAt.slice(0,10))}${insp.completedAt?' · completed '+fmtDate(insp.completedAt.slice(0,10)):' · in progress'}</div>`;
  let lastSub;
  for(const it of insp.checklistSnapshot){
    if(it.subgroup !== lastSub){
      html += `<div class="item-meta" style="font-weight:700; margin-top:10px;">${escapeHtml(it.subgroup||'')}</div>`;
      lastSub = it.subgroup;
    }
    const result = insp.itemResults[it.id] || '';
    const note = insp.itemNotes[it.id] || '';
    const resultLabel = result==='pass'?'Pass':result==='issue'?'Issue':result==='na'?'N/A':'—';
    const resultClass = result==='pass'?'done':result==='issue'?'overdue':'open';
    html += `<div class="card">
      <div class="row"><div class="item-name" style="font-size:13px;">${escapeHtml(it.text)}</div>
      <span class="stamp ${resultClass}">${resultLabel}</span></div>
      ${note?`<div style="font-size:13px; margin-top:4px;">${escapeHtml(note)}</div>`:''}
    </div>`;
  }
  html += `<div class="section-title">Discovered Items<span class="pill">${insp.discoveries.length}</span></div>`;
  if(insp.discoveries.length===0){
    html += `<div class="empty">None recorded.</div>`;
  } else {
    for(const d of insp.discoveries){
      html += `<div class="card">
        <div class="item-name" style="font-size:13px;">${escapeHtml(d.description)}</div>
        ${d.severity?`<div class="item-meta" style="margin-top:2px;">Severity: ${escapeHtml(d.severity)}</div>`:''}
        ${d.notes?`<div style="font-size:13px; margin-top:4px;">${escapeHtml(d.notes)}</div>`:''}
        <div class="item-meta" style="margin-top:6px; font-weight:700;">${escapeHtml(d.decision||'Not reviewed')}</div>
      </div>`;
    }
  }
  html += `<div class="divider"></div><button class="btn small ghost" id="qcDetailBackBtn" style="width:100%;">Back</button>`;
  showModal(html);
  document.getElementById('qcDetailBackBtn').onclick = ()=>openQcHistoryModal(insp.groupId, insp.unitId);
}

function openUnitDetail(unitId){
  const prevModal = document.querySelector('.modal');
  const prevScrollTop = prevModal ? prevModal.scrollTop : 0;
  const u = state.units.find(x=>x.id===unitId);
  const insts = state.instances.filter(i=>i.unitId===unitId);
  const defs = state.defs.filter(d=>d.location===u.name && d.status!=='Done');
  const risk = computeRisk(u);
  let html = `<div class="ud-sticky-header">
    <div><h2 style="margin-bottom:0;">${escapeHtml(u.name)}</h2><div class="helptext">${escapeHtml(u.project)}${u.active?'':' · inactive'}</div></div>
    <div class="ud-sticky-actions">
      <button class="btn small ghost" id="unitArchiveBtn">${u.active?'Mark Complete':'Reactivate'}</button>
      <button class="ud-sticky-close" id="udStickyClose" title="Close" aria-label="Close">×</button>
    </div>
  </div><div class="divider"></div>`;
  html += `<div class="section-title" style="margin-top:0;">Round Info</div>`;
  html += `<div class="card">
    <div class="row"><div class="item-meta">Risk</div><div>${risk}${u.riskOverride?' (manual override)':' (auto)'}</div></div>
    <div class="row" style="margin-top:6px;"><div class="item-meta">Current Phase</div><div style="font-size:13px; text-align:right;">${escapeHtml(u.currentPhase||'—')}</div></div>
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
    // A flat list of every logged round got unreadable once a unit had months
    // of history - show one at a time, picked from a dropdown, defaulting to
    // the most recent.
    if(!history.some(r=>r.id===selectedRoundHistoryId[unitId])){
      selectedRoundHistoryId[unitId] = history[0].id;
    }
    html += `<select id="udRoundHistorySelect" style="margin:0 4px 8px; width:calc(100% - 8px);">
      ${history.map(r=>`<option value="${r.id}" ${r.id===selectedRoundHistoryId[unitId]?'selected':''}>${fmtDate(r.date)} — ${r.risk}</option>`).join('')}
    </select>`;
    const r = history.find(x=>x.id===selectedRoundHistoryId[unitId]);
    html += `<div class="card">
      <div class="item-meta" style="font-weight:700;">${fmtDate(r.date)} — ${r.risk}</div>
      <div class="item-meta" style="margin-top:4px;">${escapeHtml(r.currentPhase||'—')}</div>
      <div class="item-meta">${r.ctEnd?'Trade ends '+fmtDate(r.ctEnd)+' · ':''}Next: ${escapeHtml(r.nextTrade||'—')}</div>
      ${r.notes?`<div style="font-size:13px; margin-top:6px;">${escapeHtml(r.notes)}</div>`:''}
      ${r.tradeCompliance?`<div style="font-size:13px; margin-top:6px;"><b>On time/clean/safety:</b> ${escapeHtml(r.tradeCompliance)}</div>`:''}
      ${r.cleanup?`<div style="font-size:13px; margin-top:4px;"><b>Cleanup:</b> ${escapeHtml(r.cleanup)}</div>`:''}
      ${r.nextTradeRisk?`<div style="font-size:13px; margin-top:4px;"><b>Risk for next trade:</b> ${escapeHtml(r.nextTradeRisk)}</div>`:''}
      ${r.next14Risk?`<div style="font-size:13px; margin-top:4px;"><b>Risk — next 14 days:</b> ${escapeHtml(r.next14Risk)}</div>`:''}
      ${r.next90Prep?`<div style="font-size:13px; margin-top:4px;"><b>Line up — next 1-3 months:</b> ${escapeHtml(r.next90Prep)}</div>`:''}
    </div>`;
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

  const groupInsts = state.groupInstances.filter(gi=>gi.unitId===unitId);
  let groupRows = groupInsts.map(gi=>{
    const g = state.checklistGroups.find(x=>x.id===gi.groupId);
    if(!g) return null;
    const due = gi.dueOverride || groupDueDate(unitId, g);
    const {done,total} = groupCompletion(gi, g);
    const st = groupStatus(due, done, total);
    return {gi, g, due, done, total, st};
  }).filter(Boolean).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));

  // Surface whichever checklist matches the unit's current phase (set in Log
  // Round) front and center, since with a large checklist library it can
  // otherwise take a lot of scrolling/expanding to find the relevant one.
  const currentPhaseGroup = currentPhaseChecklistGroup(u);
  const currentPhaseRow = currentPhaseGroup ? groupRows.find(r=>r.g.id===currentPhaseGroup.id) : null;
  if(currentPhaseRow){
    groupRows = groupRows.filter(r=>r.gi.id!==currentPhaseRow.gi.id);
    html += `<div class="section-title">Current Phase Checklist</div>`;
    html += renderPhaseGroupRow(currentPhaseRow, false);
  }

  html += `<div class="section-title">Phase Checklist</div>`;

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
  // The sticky header above has its own close button (stays visible while
  // scrolling, unlike the generic overlay one) so hide the generic one to
  // avoid showing two - same pattern promptSiteKeyModal() already uses.
  const genericClose = document.getElementById('modalClose');
  if(genericClose) genericClose.style.display = 'none';
  document.getElementById('udStickyClose').onclick = closeModal;
  document.getElementById('logRoundBtn').onclick = ()=>openRoundModal(unitId);
  const roundHistorySelect = document.getElementById('udRoundHistorySelect');
  if(roundHistorySelect) roundHistorySelect.onchange = (e)=>{
    selectedRoundHistoryId[unitId] = e.target.value;
    openUnitDetail(unitId);
  };
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
  document.querySelectorAll('.pcg-item-remove').forEach(btn=>btn.onclick=(e)=>{
    e.stopPropagation();
    const groupId = btn.dataset.groupid, itemId = btn.dataset.itemid;
    const g = state.checklistGroups.find(x=>x.id===groupId);
    if(!g) return;
    const item = g.items.find(it=>it.id===itemId);
    showConfirm(`Remove "${item?item.text:'this item'}" from ${g.name}? This removes it from this checklist everywhere it's used, not just this unit.`, async()=>{
      g.items = g.items.filter(it=>it.id!==itemId);
      await sset('checklistGroups', state.checklistGroups);
      showToast('Item removed.');
      openUnitDetail(unitId);
    });
  });
  document.querySelectorAll('.pcg-additem-btn').forEach(btn=>{
    const addItem = async()=>{
      const groupId = btn.dataset.groupid;
      const input = document.querySelector(`.pcg-additem-input[data-groupid="${groupId}"]`);
      const section = document.querySelector(`.pcg-additem-section[data-groupid="${groupId}"]`);
      const text = input.value.trim();
      if(!text) return;
      const g = state.checklistGroups.find(x=>x.id===groupId);
      if(!g) return;
      const subgroup = section ? section.value : 'Blocker';
      // Insert after the last existing item in the same section, so the new
      // item actually lands in that section instead of just tacking onto the
      // very end of the list (which would visually fall under whatever
      // section happens to be last, usually QC).
      let insertAt = g.items.length;
      for(let i=g.items.length-1; i>=0; i--){
        if(g.items[i].subgroup===subgroup){ insertAt = i+1; break; }
      }
      g.items.splice(insertAt, 0, {id:uid(), text, subgroup});
      await sset('checklistGroups', state.checklistGroups);
      showToast('Item added.');
      openUnitDetail(unitId);
    };
    btn.onclick = (e)=>{ e.stopPropagation(); addItem(); };
  });
  document.querySelectorAll('.pcg-additem-section').forEach(sel=>sel.onclick=(e)=>e.stopPropagation());
  document.querySelectorAll('.pcg-additem-input').forEach(input=>{
    input.onclick = (e)=>e.stopPropagation();
    input.onkeydown = (e)=>{
      if(e.key!=='Enter') return;
      e.stopPropagation();
      document.querySelector(`.pcg-additem-btn[data-groupid="${input.dataset.groupid}"]`).click();
    };
  });
  document.querySelectorAll('.qc-start-btn').forEach(btn=>btn.onclick=async(e)=>{
    e.stopPropagation();
    const qUnitId = btn.dataset.unitid, groupId = btn.dataset.groupid;
    let insp = qcInspectionInProgress(qUnitId, groupId);
    if(!insp) insp = await startQcInspection(qUnitId, groupId);
    openQcCheckModal(insp.id);
  });
  document.querySelectorAll('.qc-history-btn').forEach(btn=>btn.onclick=(e)=>{
    e.stopPropagation();
    openQcHistoryModal(btn.dataset.groupid, btn.dataset.unitid);
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
  const phaseOpts = scheduleSubjectOptions(u.currentPhase).map(p=>`<option value="${escapeHtml(p)}" ${u.currentPhase===p?'selected':''}>${escapeHtml(p)}</option>`).join('');
  const nextTradeOpts = scheduleSubjectOptions(u.nextTrade).map(p=>`<option value="${escapeHtml(p)}" ${u.nextTrade===p?'selected':''}>${escapeHtml(p)}</option>`).join('');
  showModal(`
    <h2>Log Round — ${escapeHtml(u.name)}</h2>
    <div class="helptext" style="margin-bottom:6px;">Sets Last Walk Date to today and saves whatever you update below.</div>
    <label>Current Phase</label>
    <select id="rPhase"><option value="">—</option>${phaseOpts}</select>
    ${phaseOpts?'':'<div class="helptext" style="margin-top:2px;">No schedule synced yet — import one on the Sync tab to populate this list.</div>'}
    <label>Trade End Date</label><input id="rCtEnd" type="date" value="${u.ctEnd||''}">
    <label>Next Trade</label>
    <select id="rNextTrade"><option value="">—</option>${nextTradeOpts}</select>
    <label>Risk Override (leave on Auto unless you need to force it)</label>
    <select id="rRiskOverride">
      <option value="" ${!u.riskOverride?'selected':''}>Auto</option>
      <option value="🟢" ${u.riskOverride==='🟢'?'selected':''}>🟢 Green</option>
      <option value="🟡" ${u.riskOverride==='🟡'?'selected':''}>🟡 Yellow</option>
      <option value="🔴" ${u.riskOverride==='🔴'?'selected':''}>🔴 Red</option>
    </select>
    <label>Notes</label>
    <textarea id="rNotes" style="min-height:60px;" placeholder="Anything worth noting about this round…"></textarea>
    <div class="divider"></div>
    <label>Is the current trade on time / clean / safety forms filled out?</label>
    <textarea id="rTradeCompliance" style="min-height:50px;"></textarea>
    <label>If they finished today or yesterday, did they clean up?</label>
    <textarea id="rCleanup" style="min-height:50px;"></textarea>
    <label>What could go wrong for the next trade?</label>
    <textarea id="rNextTradeRisk" style="min-height:50px;"></textarea>
    <label>What could go wrong in the next 14 days?</label>
    <textarea id="rNext14Risk" style="min-height:50px;"></textarea>
    <label>What do I need to line up in the next 1-3 months?</label>
    <textarea id="rNext90Prep" style="min-height:50px;"></textarea>
    <div class="divider"></div>
    <button class="btn" id="rSave" style="width:100%;">Save Round</button>
  `);
  document.getElementById('rSave').onclick = async()=>{
    u.currentPhase = document.getElementById('rPhase').value;
    u.crntTrade = u.currentPhase;
    u.ctEnd = document.getElementById('rCtEnd').value || null;
    u.nextTrade = document.getElementById('rNextTrade').value;
    u.riskOverride = document.getElementById('rRiskOverride').value || null;
    u.lastWalkDate = todayISO();
    await sset('units', state.units);
    state.roundHistory.push({
      id:uid(), unitId:u.id, unitName:u.name, date:todayISO(),
      currentPhase:u.currentPhase, crntTrade:u.crntTrade, ctEnd:u.ctEnd,
      nextTrade:u.nextTrade, risk:computeRisk(u), notes:document.getElementById('rNotes').value.trim(),
      tradeCompliance:document.getElementById('rTradeCompliance').value.trim(),
      cleanup:document.getElementById('rCleanup').value.trim(),
      nextTradeRisk:document.getElementById('rNextTradeRisk').value.trim(),
      next14Risk:document.getElementById('rNext14Risk').value.trim(),
      next90Prep:document.getElementById('rNext90Prep').value.trim()
    });
    await sset('roundHistory', state.roundHistory);
    delete selectedRoundHistoryId[unitId]; // jump the dropdown back to the just-logged (newest) round
    closeModal();
    showToast('Round logged for ' + u.name);
    openUnitDetail(unitId);
  };
}

/* Cross-unit view of every phase-checklist group that isn't fully checked
   off yet, mirroring how the Deficiencies tab shows all open deficiencies
   from every unit in one place instead of having to open each unit to see
   what's outstanding there. With 145 groups per unit, "not yet complete"
   alone would be an overwhelming flat list, so it's split the same way
   Deficiencies splits Due Date/No Date/Done - here Due Date / In Progress
   (started but no computed due date) / Not Started - defaulting to Due Date. */
function renderActiveChecklistsSection(){
  const activeUnitIds = new Set(state.units.filter(u=>u.active).map(u=>u.id));
  const rows = state.groupInstances.filter(gi=>activeUnitIds.has(gi.unitId)).map(gi=>{
    const g = state.checklistGroups.find(x=>x.id===gi.groupId);
    const u = state.units.find(x=>x.id===gi.unitId);
    if(!g || !u) return null;
    const due = gi.dueOverride || groupDueDate(gi.unitId, g);
    const {done,total} = groupCompletion(gi, g);
    if(done>=total) return null;
    const st = groupStatus(due, done, total);
    return {gi, g, u, due, done, total, st};
  }).filter(Boolean);

  const dueRows = rows.filter(r=>r.due).sort((a,b)=>a.due.localeCompare(b.due));
  const progressRows = rows.filter(r=>!r.due && r.done>0);
  const notStartedRows = rows.filter(r=>!r.due && r.done===0);
  if(!['due','progress','notstarted'].includes(checklistsFilterTab)) checklistsFilterTab = 'due';
  const shown = checklistsFilterTab==='due' ? dueRows : checklistsFilterTab==='progress' ? progressRows : notStartedRows;

  let html = `<div class="section-title">Active Checklists<span class="pill">${rows.length}</span></div>`;
  html += `<div style="display:flex; gap:6px; margin:0 4px 14px;">
    <button class="btn small checklists-filter-pick ${checklistsFilterTab==='due'?'':'ghost'}" data-filter="due" style="flex:1;">Due Date <span class="pill">${dueRows.length}</span></button>
    <button class="btn small checklists-filter-pick ${checklistsFilterTab==='progress'?'':'ghost'}" data-filter="progress" style="flex:1;">In Progress <span class="pill">${progressRows.length}</span></button>
    <button class="btn small checklists-filter-pick ${checklistsFilterTab==='notstarted'?'':'ghost'}" data-filter="notstarted" style="flex:1;">Not Started <span class="pill">${notStartedRows.length}</span></button>
  </div>`;
  if(shown.length===0){
    html += `<div class="empty">Nothing here.</div>`;
  } else {
    for(const r of shown){
      html += `<div class="card ${r.st} active-checklist-row" data-unitid="${r.u.id}" style="cursor:pointer;">
        <div class="row">
          <div style="min-width:0; flex:1;">
            <div class="item-name">${escapeHtml(r.g.name)}</div>
            <div class="item-meta">${escapeHtml(r.u.name)} · ${r.done}/${r.total} done${r.due?' · due '+fmtDate(r.due):''}</div>
          </div>
          <span class="stamp ${r.st}" style="flex-shrink:0;">${r.st==='overdue'?'Overdue':r.st==='today'?'Today':'Open'}</span>
        </div>
      </div>`;
    }
  }
  return html;
}

function renderMaster(){
  let html = renderActiveChecklistsSection();
  html += `<div class="section-title" style="margin-top:14px;">Checklist Master<button class="btn small" id="addMasterBtn">+ Add Item</button></div>
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
  document.querySelectorAll('.checklists-filter-pick').forEach(b=>b.onclick=()=>{
    checklistsFilterTab = b.dataset.filter; render();
  });
  document.querySelectorAll('.active-checklist-row').forEach(card=>card.onclick=()=>{
    openUnitDetail(card.dataset.unitid);
  });
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

  html += `<button class="btn small ghost" id="copyDefListBtn" style="margin:0 4px 14px; width:calc(100% - 8px);">Copy List (respects filters above)</button>`;

  html += `<div id="defsListContainer">`;
  if(defsFilterTab==='dated'){
    for(const p of parentsSurfacedIn(dated)){ html += splitParentRowHtml(p); }
    if(dated.length===0) html += `<div class="empty">Nothing with a due date yet.</div>`;
    for(const d of dated){ html += defRowWithActions(d); }
  } else if(defsFilterTab==='undated'){
    for(const p of parentsSurfacedIn(undated)){ html += splitParentRowHtml(p); }
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
  document.getElementById('copyDefListBtn').onclick = async ()=>{
    const items = [...document.querySelectorAll('#defsListContainer > div')]
      .filter(card => card.style.display !== 'none')
      .map(card => state.defs.find(d=>d.id===card.dataset.def2))
      .filter(Boolean);
    if(items.length===0){ showToast('Nothing to copy — the list is empty.'); return; }
    const text = items.map(d=>{
      const when = d.status==='Done' ? `done${d.completedDate?' '+fmtDate(d.completedDate):''}` : (d.dueDate ? `due ${fmtDate(d.dueDate)}` : 'no due date');
      return `${d.description} — ${when}`;
    }).join('\n');
    try{
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${items.length} item${items.length===1?'':'s'} to clipboard.`);
    }catch(e){
      console.error('clipboard copy failed', e);
      showToast("Couldn't copy — check clipboard permissions and try again.");
    }
  };
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

/* Makes the parent<->subtask link visible right on the list row, in
   whichever tab either one happens to land in — otherwise a subtask is
   just an ordinary-looking item with no visible trace of what it's part
   of, and a split parent (always Done, so always on the Done tab) shows
   nothing beyond its own description even though it's the reason the
   subtasks exist. */
function subtaskLineageTag(d){
  if(d.parentId){
    const parent = state.defs.find(x=>x.id===d.parentId);
    if(parent) return ` · ↳ part of: ${escapeHtml(parent.description)}`;
  }
  const childCount = state.defs.filter(x=>x.parentId===d.id).length;
  return childCount>0 ? ` · split into ${childCount} subtask${childCount===1?'':'s'}` : '';
}

/* A split parent is always status:'Done' (it isn't really finished — its
   work moved to its subtasks), so it never appears in the dated/undated
   lists on its own. Surfacing a read-only copy here, right above whichever
   tab its subtasks landed in, keeps the parent visible next to the pieces
   it was broken into instead of only being findable by digging through the
   Done tab. */
function parentsSurfacedIn(list){
  const parentIds = new Set();
  for(const c of list){ if(c.parentId) parentIds.add(c.parentId); }
  return [...parentIds].map(pid=>state.defs.find(d=>d.id===pid)).filter(Boolean);
}
function splitParentRowHtml(p){
  const childCount = state.defs.filter(x=>x.parentId===p.id).length;
  return `<div class="card def2-card" data-def2="${p.id}" data-hasestimate="${p.estimatedMinutes?'1':'0'}" data-owner="${escapeHtml(p.owner||'')}" style="cursor:pointer; opacity:0.75; border-style:dashed;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(p.description)}</div>
      <div class="item-meta">${escapeHtml(p.location||'—')} · split into ${childCount} subtask${childCount===1?'':'s'}</div>
    </div><span class="stamp open">Split</span></div>
  </div>`;
}

function defRowDone(d){
  return `<div class="card done def2-card" data-def2="${d.id}" data-hasestimate="${d.estimatedMinutes?'1':'0'}" data-owner="${escapeHtml(d.owner||'')}" style="cursor:pointer;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.completedDate?' · completed '+fmtDate(d.completedDate):''}${priorityTag(d)}${categoryTag(d)}${subtaskLineageTag(d)}</div>
    </div><span class="stamp done">Done</span></div>
  </div>`;
}

function subtaskEditRowHtml(c){
  const st = dueStatus(c.dueDate, c.status);
  const stampClass = c.status==='Done' ? 'done' : st;
  const stampLabel = c.status==='Done' ? 'Done' : (st==='overdue'?'Overdue':st==='today'?'Today':'Open');
  return `<div class="card" data-subtask-edit="${c.id}" style="cursor:pointer; padding:8px 10px; margin-bottom:6px;">
    <div class="row"><div>
      <div class="item-name" style="font-size:13px;">${escapeHtml(c.description)}</div>
      <div class="item-meta">${c.dueDate?'due '+fmtDate(c.dueDate):'no due date'}</div>
    </div><span class="stamp ${stampClass}">${stampLabel}</span></div>
  </div>`;
}

function defRowWithActions(d, showDatePicker){
  const st = dueStatus(d.dueDate, d.status);
  const needsEstimate = d.owner!=='Trade';
  return `<div class="card ${st} def2-card" data-def2="${d.id}" data-hasestimate="${d.estimatedMinutes?'1':'0'}" data-owner="${escapeHtml(d.owner||'')}" style="cursor:pointer;">
    <div class="row"><div>
      <div class="item-name">${escapeHtml(d.description)}</div>
      <div class="item-meta">${escapeHtml(d.location||'—')} · ${escapeHtml(d.owner||'Unassigned')}${d.dueDate?' · due '+fmtDate(d.dueDate):' · no due date'}${d.status==='WAIT'?' · WAITING':''}${d.plannedDate?' · planned '+fmtDate(d.plannedDate):''}${priorityTag(d)}${categoryTag(d)}${subtaskLineageTag(d)}</div>
    </div><span class="stamp ${st}">${st==='overdue'?'Overdue':st==='today'?'Today':'Open'}</span></div>
    ${showDatePicker ? `<div class="row" style="margin-top:8px; gap:6px;">
      <input type="date" class="def-quickdate" style="margin-top:0;">
      <button class="btn small def-savedate">Set Date</button>
    </div>
    ${d.owner==='Josh' ? `<div class="def-quickdate-preview"></div>` : ''}` : ''}
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
    d2.plannedDate = null; // old plan (if any) was made around whatever due date this had before
    await sset('defs', state.defs);
    showToast('Due date set.');
    render();
    maybeOfferCapacityCascade(d2);
  });
  document.querySelectorAll('.def-quickdate').forEach(el=>{
    el.onclick=(e)=>e.stopPropagation();
    el.oninput=(e)=>{
      const card = e.target.closest('[data-def2]');
      const preview = card.querySelector('.def-quickdate-preview');
      if(preview) preview.innerHTML = e.target.value ? bookingPreviewHtml(e.target.value, card.dataset.def2) : '';
    };
  });
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
          owner:r.owner||'Unassigned', status:r.status||'DO', dueDate:r.dueDate||null, dueType:r.dueType||'fixed',
          priority:r.priority||'Medium',
          pushCount:r.pushCount||0, pushReason:r.pushReason||'',
          verifier:r.verifier||null, followUpDate:r.followUpDate||null, startedAt:null, notes:[]
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
  return bookingsForDate(dueDate, excludeId).items.length;
}

/* Live "what's booked" preview shown under a due-date field while picking
   it, so Josh can see what else lands on that day before committing to it
   — not gated behind the >=2 overbook threshold the Save-time warning
   uses, since even one other item can be worth knowing about. Same
   fits/tight/over color coding as the Week Overload strip, reusing the
   identical 80%-of-budget threshold for "tight". */
function bookingPreviewHtml(dueDate, excludeId){
  if(!dueDate) return '';
  const {items, used, budget} = bookingsForDate(dueDate, excludeId);
  const pct = budget>0 ? used/budget : 0;
  const tier = used>budget ? 'over' : pct>=0.8 ? 'tight' : 'fits';
  const color = tier==='over' ? 'var(--stamp-red)' : tier==='tight' ? 'var(--stamp-amber)' : 'var(--ink-dim)';
  let html = `<div class="helptext" style="margin-top:6px; color:${color};">
    <b>${items.length} item${items.length===1?'':'s'} · ${used}/${budget}m</b> already booked ${fmtDate(dueDate)}`;
  if(items.length){
    html += `<div style="margin-top:2px;">${items.map(it=>`• ${escapeHtml(it.description)} (${it.estimatedMinutes||PLAN_DEFAULT_ESTIMATE}m)`).join('<br>')}</div>`;
  }
  html += `</div>`;
  return html;
}

/* Quick capture — the deliberately-skipped-until-now "capture button" from
   the original roadmap. One field, no decisions forced up front: no
   location/owner/due date/priority/estimate required. Everything jotted
   here lands as owner Unassigned with no due date, so it surfaces exactly
   where the app's existing (pre-dating this work) triage filters already
   look for it — Deficiencies → No Date, and Missing Estimate — without
   needing any new filter built for it. */
function openCaptureModal(){
  // Active units only, strict dropdown — no free text. A captured item's
  // location has to be a real unit you're actively tracking, not a typo or
  // an arbitrary string; the blank first option keeps location itself
  // optional, matching Capture's "nothing else required" design.
  const activeUnitOptions = state.units.filter(u=>u.active)
    .map(u=>`<option value="${escapeHtml(u.name)}">${escapeHtml(u.name)}</option>`).join('');
  showModal(`
    <h2>Capture</h2>
    <div class="helptext" style="margin-bottom:8px;">Jot it down now — nothing else required. Find it later under Deficiencies → No Date (or Missing Estimate) to fill in the rest.</div>
    <label>What's going on?</label>
    <textarea id="capText" style="min-height:80px;"></textarea>
    <label>Location (optional)</label>
    <select id="capLocation">
      <option value="">— none —</option>
      ${activeUnitOptions}
    </select>
    <div class="divider"></div>
    <button class="btn" id="capSave" style="width:100%;">Capture</button>
  `);
  const textEl = document.getElementById('capText');
  textEl.focus();
  document.getElementById('capSave').onclick = async()=>{
    const text = textEl.value.trim();
    if(!text){ showToast('Jot something down first.'); return; }
    state.defs.push({
      id:uid(), location:document.getElementById('capLocation').value, description:text,
      owner:'Unassigned', dueDate:null, dueType:'fixed', priority:'Medium', category:'Construction',
      estimatedMinutes:null, status:'DO', pushCount:0, pushReason:'', createdDate:todayISO(),
      verifier:null, followUpDate:null, startedAt:null, notes:[]
    });
    await sset('defs', state.defs);
    closeModal();
    showToast('Captured — find it under Deficiencies → No Date.');
    render();
  };
}

function openDefModal(prefillLocation, onSaved){
  // Active units only, strict dropdown — same as Capture. If this was
  // opened from a specific unit's own detail page (prefillLocation) and
  // that unit happens to be inactive (e.g. logging something noticed
  // right after marking it complete), include it too so the prefill still
  // resolves — it just won't appear for manual/blank-start Add flows.
  const activeUnits = state.units.filter(u=>u.active);
  const prefillUnit = prefillLocation && !activeUnits.some(u=>u.name===prefillLocation)
    ? state.units.find(u=>u.name===prefillLocation) : null;
  const unitOptions = [...activeUnits, ...(prefillUnit?[prefillUnit]:[])]
    .map(u=>`<option value="${escapeHtml(u.name)}" ${u.name===prefillLocation?'selected':''}>${escapeHtml(u.name)}</option>`).join('');
  let overbookConfirmed = false;
  showModal(`
    <h2>Add Deficiency</h2>
    <label>Location</label>
    <select id="dLocation">
      <option value="">— none —</option>
      ${unitOptions}
    </select>
    <label>Description</label><textarea id="dDesc" style="min-height:60px;"></textarea>
    <label>Owner</label><select id="dOwner"><option>Trade</option><option>Josh</option><option>Unassigned</option></select>
    <div class="field-row">
      <div><label>Due Date</label><input id="dDue" type="date"></div>
      <div><label>Schedule</label>
      <select id="dDueType">
        <option value="fixed" selected>Fixed date</option>
        <option value="flexible">Flexible (auto-scheduled)</option>
      </select></div>
    </div>
    <div id="dBookingPreview"></div>
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
  const updateDBookingPreview = ()=>{
    const owner = document.getElementById('dOwner').value;
    const dueDate = document.getElementById('dDue').value;
    document.getElementById('dBookingPreview').innerHTML = (owner==='Josh' && dueDate) ? bookingPreviewHtml(dueDate, null) : '';
  };
  document.getElementById('dOwner').onchange = (e)=>{
    document.getElementById('dEstimateWrap').style.display = e.target.value==='Trade' ? 'none' : '';
    updateDBookingPreview();
  };
  document.getElementById('dDue').oninput = updateDBookingPreview;
  document.getElementById('dSave').onclick = async()=>{
    const desc = document.getElementById('dDesc').value.trim();
    if(!desc) return;
    const owner = document.getElementById('dOwner').value;
    const dueDate = document.getElementById('dDue').value || null;
    const dueType = document.getElementById('dDueType').value;
    if(owner==='Josh' && dueDate && dueType==='fixed' && !overbookConfirmed){
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
    const newDef = {
      id:uid(), location:document.getElementById('dLocation').value, description:desc,
      owner, dueDate, dueType, priority:document.getElementById('dPriority').value,
      category: document.getElementById('dCategory').value,
      estimatedMinutes: (owner!=='Trade' && estVal) ? Number(estVal) : null,
      status:'DO', pushCount:0, pushReason:'', createdDate:todayISO(),
      verifier:null, followUpDate:null, startedAt:null, notes:[]
    };
    state.defs.push(newDef);
    await sset('defs', state.defs);
    const finish = ()=>{
      if(onSaved) onSaved(); else render();
      maybeOfferCapacityCascade(newDef);
    };
    if(newDef.estimatedMinutes >= 30) openSubtaskPromptModal(newDef.id, finish);
    else { closeModal(); finish(); }
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
      state.checklistGroups = data.checklistGroups || PHASE_CHECKLIST_SEED.slice();
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
      activeTab='brief';
      document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='brief'));
      render();
      showToast('Restored. Data from ' + (data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'backup file') + '.');
    }catch(e){ showToast('Restore failed: ' + e.message); }
  });
}

