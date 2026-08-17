function showToast(msg){
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed; bottom:100px; left:16px; right:16px; z-index:100; background:var(--brand-dark); color:#fff; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:600; box-shadow:0 4px 16px rgba(0,0,0,0.25); text-align:center;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 3500);
}
function showConfirm(msg, onYes){
  showModal(`
    <h2>Confirm</h2>
    <div class="helptext" style="margin-bottom:14px;">${escapeHtml(msg)}</div>
    <div class="row" style="gap:8px;">
      <button class="btn ghost" id="confirmNo" style="flex:1;">Cancel</button>
      <button class="btn danger" id="confirmYes" style="flex:1;">Confirm</button>
    </div>
  `);
  document.getElementById('confirmNo').onclick = closeModal;
  document.getElementById('confirmYes').onclick = ()=>{ closeModal(); onYes(); };
}
function showPrompt(msg, onSubmit){
  showModal(`
    <h2>Input Needed</h2>
    <div class="helptext" style="margin-bottom:8px;">${escapeHtml(msg)}</div>
    <input id="promptInput" type="text">
    <div class="divider"></div>
    <button class="btn" id="promptOk" style="width:100%;">OK</button>
  `);
  document.getElementById('promptOk').onclick = ()=>{
    const v = document.getElementById('promptInput').value;
    closeModal(); onSubmit(v);
  };
}

