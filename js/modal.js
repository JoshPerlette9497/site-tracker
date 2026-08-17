/* ---------- modal ---------- */
function showModal(html){
  const bg = document.createElement('div');
  bg.className='modal-bg'; bg.id='modalBg';
  bg.innerHTML = `<div class="modal" style="position:relative;"><button class="close" id="modalClose">×</button>${html}</div>`;
  document.body.appendChild(bg);
  document.getElementById('modalClose').onclick = closeModal;
  bg.onclick = (e)=>{ if(e.target===bg) closeModal(); };
}
function closeModal(){ const bg=document.getElementById('modalBg'); if(bg) bg.remove(); }

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

