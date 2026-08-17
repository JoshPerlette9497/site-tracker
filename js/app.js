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
