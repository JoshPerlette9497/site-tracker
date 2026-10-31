/* ---------- storage helpers (Supabase-backed) ---------- */
const SUPABASE_URL = 'https://iafzmkwahiusfdxodgdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnpta3dhaGl1c2ZkeG9kZ2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTE2ODIsImV4cCI6MjEwMjM4NzY4Mn0.-9plVpsptVaOZfVrhrLOovhYuZEghGUSLFx5yr7i-HU';

function getSiteKey(){ return localStorage.getItem('siteLogKey') || ''; }
function setSiteKey(key){ localStorage.setItem('siteLogKey', key); }
function clearSiteKey(){ localStorage.removeItem('siteLogKey'); }

function _sbHeaders(extra){
  return Object.assign({ apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'x-site-key': getSiteKey() }, extra||{});
}

/* ---------- chat-safe writes ----------
   Both this app AND a Claude chat session connected directly to Supabase
   can edit the same app_data rows now, so a plain "load whole array, mutate
   it, save the whole array back" pattern (the old sget/sset) can silently
   erase whatever the other side just wrote. sget/sset keep their exact same
   signatures everywhere else in the app (every one of the ~130 call sites
   in data.js/render.js is untouched) - everything below is new internals
   those two functions now run through.

   The approach, in one paragraph: every app_data row carries a `version`
   that only the database ever increments (see the migration - a trigger
   bumps it on every UPDATE, ignoring anything the client sends). This
   module remembers, per key, the version and value it last confirmed with
   the server ("base"). A save calls save_app_data(key, value, expectedVersion)
   via RPC; if the row's real version still matches what we expected, the
   write lands and we learn the new version. If someone else (the app on
   another device, or chat) saved first, the RPC changes nothing and hands
   back the row as it actually is right now - we three-way-merge our base/
   our edit/their value, and try again (up to 3 total attempts). Separately,
   a short poll plus a refresh-on-focus pulls in whatever a chat edit (or a
   change from another device) wrote, even if we never tried to save
   anything ourselves, so a quiet device doesn't just drift out of date. */

/* key -> {version: number|null, base: <last value confirmed with the server>}
   version is null only for a key this device has never seen exist on the
   server (sget returned the caller's fallback because there was no row
   yet). base is a deep, JSON-safe snapshot - never the live `state[key]`
   reference itself - so later local edits to state[key] can be compared
   against it. */
const _syncState = {};
/* Keys with a save actively in flight (including its merge/retry loop) -
   the background poll/focus-refresh skips these rather than racing a
   concurrent merge against the same key. */
const _saveInFlight = {};

function _cloneValue(v){ return v===undefined ? undefined : JSON.parse(JSON.stringify(v)); }

function _deepEqual(a, b){
  if(a === b) return true;
  if(a===null || b===null || typeof a!=='object' || typeof b!=='object') return false;
  if(Array.isArray(a) !== Array.isArray(b)) return false;
  if(Array.isArray(a)){
    if(a.length !== b.length) return false;
    for(let i=0;i<a.length;i++) if(!_deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  if(ka.length !== kb.length) return false;
  for(const k of ka){ if(!Object.prototype.hasOwnProperty.call(b,k) || !_deepEqual(a[k], b[k])) return false; }
  return true;
}

/* A plain key->value map (only groupInstances.itemStatus uses this today)
   merged key-by-key with the same added/changed/deleted-wins-as-remote
   rules as the id-array merge below, just at the key level instead of the
   id level. */
function _mergeKeyedMap(base, local, remote){
  base = (base && typeof base==='object') ? base : {};
  local = (local && typeof local==='object') ? local : {};
  remote = (remote && typeof remote==='object') ? remote : {};
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  const out = {};
  for(const k of keys){
    const hasBase = Object.prototype.hasOwnProperty.call(base, k);
    const hasLocal = Object.prototype.hasOwnProperty.call(local, k);
    const hasRemote = Object.prototype.hasOwnProperty.call(remote, k);
    const localChanged = hasLocal !== hasBase || (hasLocal && hasBase && !_deepEqual(local[k], base[k]));
    const remoteChanged = hasRemote !== hasBase || (hasRemote && hasBase && !_deepEqual(remote[k], base[k]));
    let keep, val;
    if(remoteChanged){ keep = hasRemote; val = remote[k]; } // covers both "remote changed only" and "both changed" (remote wins)
    else if(localChanged){ keep = hasLocal; val = local[k]; }
    else { keep = hasBase; val = base[k]; }
    if(keep) out[k] = val;
  }
  return out;
}

/* One item present on both sides, changed on both - merge field by field.
   Same field changed on both -> remote wins. itemStatus (groupInstances)
   gets its own key-by-key merge instead of a wholesale replace, per the
   explicit spec for that field. */
function _mergeObjectFields(base, local, remote){
  base = (base && typeof base==='object') ? base : {};
  local = (local && typeof local==='object') ? local : {};
  remote = (remote && typeof remote==='object') ? remote : {};
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  const out = {};
  for(const k of keys){
    const b = base[k], l = local[k], r = remote[k];
    const localChanged = !_deepEqual(l, b);
    const remoteChanged = !_deepEqual(r, b);
    if(k==='itemStatus' && localChanged && remoteChanged
       && l && typeof l==='object' && r && typeof r==='object'){
      out[k] = _mergeKeyedMap(b && typeof b==='object' ? b : {}, l, r);
    } else if(remoteChanged){
      out[k] = r; // "remote changed only" and "both changed, same field" both resolve to remote
    } else if(localChanged){
      out[k] = l;
    } else {
      out[k] = l; // === b === r
    }
  }
  return out;
}

function _looksLikeIdArray(arr){
  if(!Array.isArray(arr) || arr.length===0) return false;
  return arr.every(it => it && typeof it==='object' && !Array.isArray(it) && Object.prototype.hasOwnProperty.call(it, 'id'));
}

/* Three-way merge for an array of objects keyed by `id` (defs,
   groupInstances, units, checklistGroups, and anything else shaped like
   that - detected structurally, not by a hardcoded list of key names, so
   it keeps working if a new id-keyed array shows up later).
     - changed locally only            -> local
     - unchanged locally                -> remote (this is how a chat edit survives)
     - added either side                -> kept
     - deleted one side, unchanged other -> deleted
     - changed on both sides            -> field-level merge (_mergeObjectFields)
     - deleted one side, changed other  -> remote wins (edit survives if
       remote edited+local deleted; deletion wins if remote deleted+local
       edited) - the same "remote wins the conflict" tie-break used
       everywhere else here, extended to this one case the spec didn't
       spell out explicitly. */
function _mergeArrayById(base, local, remote){
  base = Array.isArray(base) ? base : [];
  local = Array.isArray(local) ? local : [];
  remote = Array.isArray(remote) ? remote : [];
  const byId = (arr) => { const m = new Map(); for(const item of arr){ if(item && item.id!=null) m.set(item.id, item); } return m; };
  const baseMap = byId(base), localMap = byId(local), remoteMap = byId(remote);

  // Preserve local's own order for ids it still has (so an untouched array
  // round-trips with identical order), then append anything new from
  // remote, then anything left over from base as a last-resort safety net.
  const order = [];
  const seen = new Set();
  for(const arr of [local, remote, base]){
    for(const item of arr){
      if(item && item.id!=null && !seen.has(item.id)){ order.push(item.id); seen.add(item.id); }
    }
  }

  const out = [];
  for(const id of order){
    const hasBase = baseMap.has(id), hasLocal = localMap.has(id), hasRemote = remoteMap.has(id);
    const b = baseMap.get(id), l = localMap.get(id), r = remoteMap.get(id);
    const localChanged = hasLocal !== hasBase || (hasLocal && hasBase && !_deepEqual(l, b));
    const remoteChanged = hasRemote !== hasBase || (hasRemote && hasBase && !_deepEqual(r, b));

    if(localChanged && remoteChanged){
      if(hasLocal && hasRemote) out.push(_mergeObjectFields(hasBase?b:{}, l, r));
      else if(hasRemote) out.push(r); // local deleted, remote edited -> edit survives
      // else hasLocal only (remote deleted, local edited) -> deletion wins, omit
      continue;
    }
    if(remoteChanged){ if(hasRemote) out.push(r); continue; } // includes remote-added, and remote-deleted (omit)
    if(localChanged){ if(hasLocal) out.push(l); continue; } // includes local-added, and local-deleted (omit)
    if(hasBase) out.push(b); // unchanged everywhere
  }
  return out;
}

/* Top-level dispatcher for one app_data key's value. Id-keyed arrays get
   the per-item three-way merge above; everything else (plain strings,
   booleans/flags, planOrder, and id-less arrays like logHistory or
   fridayReviewCompletions) is a single opaque value - unchanged locally
   means it's safe to take remote's version, changed locally means the
   local edit wins outright (there's no sensible way to merge inside an
   opaque value or a plain string). */
function _mergeValueForKey(base, local, remote){
  if([base, local, remote].some(_looksLikeIdArray)) return _mergeArrayById(base, local, remote);
  if(_deepEqual(local, base)) return remote===undefined ? local : remote;
  return local;
}

function _applyMergedToState(key, merged){
  if(typeof state==='object' && state && Object.prototype.hasOwnProperty.call(state, key)) state[key] = merged;
}

async function sget(key, fallback){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value,version`, {
      headers: _sbHeaders()
    });
    if(!res.ok){
      if(!_syncState[key]) _syncState[key] = { version: null, base: _cloneValue(fallback) };
      return fallback;
    }
    const rows = await res.json();
    if(rows && rows.length){
      const value = JSON.parse(rows[0].value);
      _syncState[key] = { version: rows[0].version, base: _cloneValue(value) };
      return value;
    }
    _syncState[key] = { version: null, base: _cloneValue(fallback) };
    return fallback;
  }catch(e){
    console.error('storage get failed', key, e);
    if(!_syncState[key]) _syncState[key] = { version: null, base: _cloneValue(fallback) };
    return fallback;
  }
}

const CHAT_SAFE_MAX_SAVE_ATTEMPTS = 3;

async function sset(key, value){
  _saveInFlight[key] = true;
  try{
    return await _saveVersioned(key, value, 1);
  } finally {
    delete _saveInFlight[key];
  }
}

async function _saveVersioned(key, value, attempt){
  const tracked = _syncState[key] || { version: null, base: undefined };
  let res;
  try{
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_app_data`, {
      method: 'POST',
      headers: _sbHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_key: key, p_value: JSON.stringify(value), p_expected_version: tracked.version })
    });
  }catch(e){
    console.error('storage set failed', key, e);
    if(typeof showToast==='function') showToast(`Couldn't save "${key}" — check your connection and try again.`);
    return false;
  }
  if(!res.ok){
    console.error('storage set failed', key, res.status, await res.text().catch(()=>''));
    if(typeof showToast==='function') showToast(`Couldn't save "${key}" — check your connection and try again.`);
    return false;
  }
  const result = await res.json();
  if(result && result.ok){
    _syncState[key] = { version: result.version, base: _cloneValue(value) };
    return true;
  }

  // Conflict: someone else (chat, or another device) saved this key first.
  if(attempt >= CHAT_SAFE_MAX_SAVE_ATTEMPTS){
    if(typeof showToast==='function') showToast(`Couldn't save — refreshing…`);
    setTimeout(()=>location.reload(), 1200);
    return false;
  }
  const remoteValue = (result && result.value!=null) ? JSON.parse(result.value) : undefined;
  const merged = _mergeValueForKey(tracked.base, value, remoteValue);
  _syncState[key] = { version: (result && result.version) || null, base: _cloneValue(remoteValue) };
  _applyMergedToState(key, merged);
  if(typeof render==='function') render();
  return _saveVersioned(key, merged, attempt+1);
}

/* Pulls the current server value+version for one key and merges it into
   live state if it's newer than what this device already has - used by
   both the background poll (for keys the poll noticed had moved on) and
   the focus/visibility refresh (unconditionally, for every tracked key). */
async function _refreshKeyFromServer(key){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value,version`, {
      headers: _sbHeaders()
    });
    if(!res.ok) return false;
    const rows = await res.json();
    if(!rows || !rows.length) return false;
    const remoteVersion = rows[0].version;
    const tracked = _syncState[key] || { version: null, base: undefined };
    if(tracked.version!==null && remoteVersion<=tracked.version) return false;
    const remoteValue = JSON.parse(rows[0].value);
    const hasLocalState = typeof state==='object' && state && Object.prototype.hasOwnProperty.call(state, key);
    const localValue = hasLocalState ? state[key] : tracked.base;
    const merged = _mergeValueForKey(tracked.base, localValue, remoteValue);
    _syncState[key] = { version: remoteVersion, base: _cloneValue(remoteValue) };
    _applyMergedToState(key, merged);
    return true;
  }catch(e){ console.error('background refresh failed', key, e); return false; }
}

/* Cheap check across every tracked key (one small request for key+version
   only), then a full fetch+merge only for whichever keys actually moved. */
async function _pollAllKeys(){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?select=key,version`, { headers: _sbHeaders() });
    if(!res.ok) return;
    const rows = await res.json();
    let changedAny = false;
    for(const row of rows){
      if(_saveInFlight[row.key]) continue; // a save is already reconciling this key
      const tracked = _syncState[row.key];
      if(!tracked) continue; // a key this device hasn't loaded this session - nothing local to merge into
      if(tracked.version===null || row.version > tracked.version){
        if(await _refreshKeyFromServer(row.key)) changedAny = true;
      }
    }
    if(changedAny && typeof render==='function') render();
  }catch(e){ console.error('background poll failed', e); }
}

/* Re-fetches every key this device has ever loaded and merges in whatever
   changed, unconditionally - used on focus/visibility, where "has this
   drifted while I wasn't looking" is exactly the question being asked. */
async function _refetchAllTrackedKeys(){
  let changedAny = false;
  for(const key of Object.keys(_syncState)){
    if(_saveInFlight[key]) continue;
    if(await _refreshKeyFromServer(key)) changedAny = true;
  }
  if(changedAny && typeof render==='function') render();
}

/* Started once from app.js after the first loadAll()+render(). Supabase
   Realtime (true push updates) is NOT used here even though app_data is in
   the realtime publication (see the migration) - this table's RLS gates
   every request on a custom x-site-key HTTP header, which is a
   PostgREST-only mechanism Realtime's postgres_changes delivery path can't
   see, so a real subscription would either deliver nothing (fails closed)
   or require loosening the policy so anyone with the public anon key can
   read everything without the site-key passphrase (a real regression, not
   made silently). Polling every few seconds over the same site-key-gated
   REST endpoint gets the "within seconds, no reload" behavior without
   touching that security model at all. */
const CHAT_SAFE_POLL_INTERVAL_MS = 4000;
let _chatSafeSyncStarted = false;
function startChatSafeSync(){
  if(_chatSafeSyncStarted) return;
  _chatSafeSyncStarted = true;
  setInterval(()=>{ if(!document.hidden) _pollAllKeys(); }, CHAT_SAFE_POLL_INTERVAL_MS);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) _refetchAllTrackedKeys(); });
  window.addEventListener('focus', _refetchAllTrackedKeys);
}

/* Supabase Storage bucket for safety-walkthrough photos - must be created
   (and set to "Public bucket") in the Supabase dashboard first; this app
   has no way to provision infrastructure on its own. See README for the
   one-time setup. */
const SUPABASE_STORAGE_BUCKET = 'hazard-photos';
async function uploadSafetyPhoto(file){
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
  const path = `${todayISO()}/${uid()}.${ext}`;
  try{
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${path}`, {
      method: 'POST',
      headers: _sbHeaders({ 'Content-Type': file.type || 'image/jpeg' }),
      body: file
    });
    if(!res.ok){
      console.error('safety photo upload failed', res.status, await res.text().catch(()=>''));
      return null;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${path}`;
  }catch(e){
    console.error('safety photo upload failed', e);
    return null;
  }
}
function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function addDays(iso, n){ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function fmtDate(iso){ if(!iso) return '—'; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtWeekday(iso){ if(!iso) return '—'; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-US',{weekday:'short'}); }
