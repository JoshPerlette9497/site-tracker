/* ---------- storage helpers (Supabase-backed) ---------- */
const SUPABASE_URL = 'https://iafzmkwahiusfdxodgdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnpta3dhaGl1c2ZkeG9kZ2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTE2ODIsImV4cCI6MjEwMjM4NzY4Mn0.-9plVpsptVaOZfVrhrLOovhYuZEghGUSLFx5yr7i-HU';

function getSiteKey(){ return localStorage.getItem('siteLogKey') || ''; }
function setSiteKey(key){ localStorage.setItem('siteLogKey', key); }
function clearSiteKey(){ localStorage.removeItem('siteLogKey'); }

async function sget(key, fallback){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'x-site-key': getSiteKey() }
    });
    if(!res.ok) return fallback;
    const rows = await res.json();
    if(rows && rows.length) return JSON.parse(rows[0].value);
    return fallback;
  }catch(e){ console.error('storage get failed', key, e); return fallback; }
}
async function sset(key, value){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'x-site-key': getSiteKey()
      },
      body: JSON.stringify({key, value: JSON.stringify(value), updated_at: new Date().toISOString()})
    });
    if(!res.ok){
      console.error('storage set failed', key, res.status, await res.text().catch(()=>''));
      if(typeof showToast==='function') showToast(`Couldn't save "${key}" — check your connection and try again.`);
      return false;
    }
    return true;
  }catch(e){
    console.error('storage set failed', key, e);
    if(typeof showToast==='function') showToast(`Couldn't save "${key}" — check your connection and try again.`);
    return false;
  }
}
function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function addDays(iso, n){ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function fmtDate(iso){ if(!iso) return '—'; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }

