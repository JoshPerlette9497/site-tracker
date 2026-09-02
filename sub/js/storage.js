/* ---------- storage helpers (Supabase-backed) ----------
   Same Supabase project as the main Site Log app (js/storage.js at the repo
   root), but this page talks to a different set of tables:
   subcontractors / site_visits / safety_documents. Those tables use open
   RLS policies (no x-site-key header) on purpose — subcontractors sign in
   from a QR code with zero setup, so there's no passphrase to gate them
   with. See README for the one-time Supabase setup (tables + bucket). */
const SUPABASE_URL = 'https://iafzmkwahiusfdxodgdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnpta3dhaGl1c2ZkeG9kZ2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTE2ODIsImV4cCI6MjEwMjM4NzY4Mn0.-9plVpsptVaOZfVrhrLOovhYuZEghGUSLFx5yr7i-HU';
const SUPABASE_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
const DOCS_BUCKET = 'safety-submissions';

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

/* ---------- profile (device-local "memory") ---------- */
function getProfile(){
  try{ return JSON.parse(localStorage.getItem('subProfile') || 'null'); }
  catch(e){ return null; }
}
function saveProfile(profile){ localStorage.setItem('subProfile', JSON.stringify(profile)); }
function clearProfile(){ localStorage.removeItem('subProfile'); }

async function createSubcontractor(profile){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subcontractors`, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      id: profile.id, name: profile.name, company: profile.company || null,
      trade: profile.trade || null, phone: profile.phone || null,
      created_at: new Date().toISOString()
    })
  });
  if(!res.ok) throw new Error(`Could not save profile (${res.status})`);
}

/* ---------- site visits (sign in / sign out) ---------- */
async function fetchOpenVisit(subcontractorId){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_visits?subcontractor_id=eq.${encodeURIComponent(subcontractorId)}&sign_out_at=is.null&order=sign_in_at.desc&limit=1&select=*`, {
    headers: SUPABASE_HEADERS
  });
  if(!res.ok) throw new Error(`Could not check sign-in status (${res.status})`);
  const rows = await res.json();
  return rows && rows.length ? rows[0] : null;
}
async function signIn(profile){
  const visit = {
    id: uid(), subcontractor_id: profile.id,
    subcontractor_name: profile.name, subcontractor_company: profile.company || null,
    sign_in_at: new Date().toISOString(), sign_out_at: null
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_visits`, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(visit)
  });
  if(!res.ok) throw new Error(`Sign-in failed (${res.status})`);
}
async function signOut(visitId){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_visits?id=eq.${encodeURIComponent(visitId)}`, {
    method: 'PATCH',
    headers: { ...SUPABASE_HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ sign_out_at: new Date().toISOString() })
  });
  if(!res.ok) throw new Error(`Sign-out failed (${res.status})`);
}

/* ---------- safety document submissions ---------- */
async function uploadDocFile(file){
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
  const path = `${new Date().toISOString().slice(0,10)}/${uid()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${DOCS_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Content-Type': file.type || 'application/octet-stream' },
    body: file
  });
  if(!res.ok) throw new Error(`Upload failed (${res.status})`);
  return `${SUPABASE_URL}/storage/v1/object/public/${DOCS_BUCKET}/${path}`;
}
async function submitDocument(profile, type, fileUrl, notes){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/safety_documents`, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      id: uid(), subcontractor_id: profile.id,
      subcontractor_name: profile.name, subcontractor_company: profile.company || null,
      type, file_url: fileUrl, notes: notes || null,
      uploaded_at: new Date().toISOString()
    })
  });
  if(!res.ok) throw new Error(`Could not save submission (${res.status})`);
}

/* ---------- recent activity (this subcontractor only) ---------- */
async function fetchRecentActivity(subcontractorId){
  const [visitsRes, docsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/site_visits?subcontractor_id=eq.${encodeURIComponent(subcontractorId)}&order=sign_in_at.desc&limit=5&select=*`, { headers: SUPABASE_HEADERS }),
    fetch(`${SUPABASE_URL}/rest/v1/safety_documents?subcontractor_id=eq.${encodeURIComponent(subcontractorId)}&order=uploaded_at.desc&limit=5&select=*`, { headers: SUPABASE_HEADERS })
  ]);
  const visits = visitsRes.ok ? await visitsRes.json() : [];
  const docs = docsRes.ok ? await docsRes.json() : [];
  return { visits, docs };
}
