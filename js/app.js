/* ---------- tabs ---------- */
document.querySelectorAll('nav.tabs button').forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    activeTab = b.dataset.tab;
    render();
  };
});

/* ---------- init ---------- */
(async function init(){
  setHeader();
  await loadAll();
  render();
})();

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(e=>console.error('SW registration failed', e));
  });
}
