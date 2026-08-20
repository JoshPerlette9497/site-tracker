/* ---------- select arrow wrapping ----------
   iOS Safari never fully honors appearance:none on <select> - its native
   arrow decoration can't be resized or hidden via CSS on the element
   itself (a long-standing WebKit limitation). Every select gets wrapped
   with an independent CSS-drawn arrow overlay instead, so the visible
   arrow doesn't depend on Safari cooperating. Runs via a MutationObserver
   so it catches every select as it appears, from any tab render or modal,
   without needing to touch each individual render function. */
function wrapSelectArrow(select){
  if(select.parentElement && select.parentElement.classList.contains('select-wrap')) return;
  const wrap = document.createElement('span');
  wrap.className = 'select-wrap';
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  const arrow = document.createElement('span');
  arrow.className = 'select-wrap-arrow';
  wrap.appendChild(arrow);
}
function wrapAllSelects(root){
  root.querySelectorAll('select').forEach(wrapSelectArrow);
}
wrapAllSelects(document.body);
new MutationObserver((mutations)=>{
  for(const m of mutations){
    for(const node of m.addedNodes){
      if(node.nodeType !== 1) continue;
      if(node.tagName === 'SELECT') wrapSelectArrow(node);
      else if(node.querySelectorAll) wrapAllSelects(node);
    }
  }
}).observe(document.body, {childList:true, subtree:true});

/* ---------- tabs ---------- */
document.querySelectorAll('nav.tabs button').forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    activeTab = b.dataset.tab;
    render();
  };
});

/* ---------- access gate ----------
   verifySiteKey returns:
     'ok'       - key confirmed good
     'rejected' - Supabase explicitly denied it (wrong code)
     'unknown'  - couldn't reach Supabase to check (network issue) — NOT treated as rejection,
                  since a flaky mobile connection shouldn't wipe a previously-working code
*/
async function verifySiteKey(key){
  try{
    const writeRes = await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
        'x-site-key': key
      },
      body: JSON.stringify({key:'__key_check', value: JSON.stringify('ok'), updated_at: new Date().toISOString()})
    });
    if(writeRes.status===401 || writeRes.status===403) return 'rejected';
    if(!writeRes.ok) return 'unknown';
    const readRes = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.__key_check&select=value`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'x-site-key': key }
    });
    if(readRes.status===401 || readRes.status===403) return 'rejected';
    if(!readRes.ok) return 'unknown';
    const rows = await readRes.json();
    return (rows && rows.length) ? 'ok' : 'rejected';
  }catch(e){ return 'unknown'; }
}

function promptSiteKeyModal(){
  return new Promise(resolve=>{
    showModal(`
      <h2>Access Code Required</h2>
      <div class="helptext" style="margin-bottom:8px;">Enter the Site Log access code to continue.</div>
      <input id="siteKeyInput" type="password" autocomplete="off">
      <div class="divider"></div>
      <button class="btn" id="siteKeyOk" style="width:100%;">Continue</button>
    `);
    const closeBtn = document.getElementById('modalClose');
    if(closeBtn) closeBtn.style.display = 'none';
    const bg = document.getElementById('modalBg');
    if(bg) bg.onclick = null;
    const input = document.getElementById('siteKeyInput');
    input.focus();
    const submit = ()=>{
      const v = input.value.trim();
      if(!v) return;
      closeModal();
      resolve(v);
    };
    document.getElementById('siteKeyOk').onclick = submit;
    input.onkeydown = (e)=>{ if(e.key==='Enter') submit(); };
  });
}

async function ensureSiteKey(){
  let key = getSiteKey();
  while(true){
    if(key){
      const result = await verifySiteKey(key);
      if(result==='ok' || result==='unknown') return;
      clearSiteKey();
      showToast('Access code rejected — try again.');
      key = null;
    }
    key = await promptSiteKeyModal();
    setSiteKey(key);
  }
}

/* ---------- init ---------- */
(async function init(){
  await ensureSiteKey();
  setHeader();
  await loadAll();
  render();
})();

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(e=>console.error('SW registration failed', e));
  });
}
