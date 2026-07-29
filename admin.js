(() => {
 const cfg=window.PRANK_CONFIG||{}; const valid=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes('PASTE_');
 if(!valid){document.getElementById('loginMsg').textContent='First add Supabase URL and anon key in config.js';return;}
 const db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY); let visits=[];
 const $=id=>document.getElementById(id);
 async function check(){const {data:{session}}=await db.auth.getSession();if(session&&session.user.email===cfg.ADMIN_EMAIL)show();}
 async function login(){ $('loginMsg').textContent=''; const email=$('email').value.trim(),password=$('password').value;
  if(email!==cfg.ADMIN_EMAIL){$('loginMsg').textContent='This email is not allowed.';return;}
  const {error}=await db.auth.signInWithPassword({email,password}); if(error){$('loginMsg').textContent=error.message;return;} show();}
 async function show(){ $('loginBox').classList.add('hidden');$('dashboard').classList.remove('hidden');await load();}
 async function load(){const {data,error}=await db.from('prank_visits').select('*').order('opened_at',{ascending:false}).limit(1000);if(error){alert(error.message);return;}visits=data||[];render(visits);}
 function render(data){$('total').textContent=data.length;$('unique').textContent=new Set(data.map(v=>v.visitor_key)).size;$('reveals').textContent=data.filter(v=>v.reveal_reached).length;const secs=data.map(v=>v.session_seconds||0);$('avg').textContent=(secs.length?Math.round(secs.reduce((a,b)=>a+b,0)/secs.length):0)+'s';$('rows').innerHTML=data.map((v,i)=>`<tr><td>Visitor #${String(data.length-i).padStart(3,'0')}</td><td>${new Date(v.opened_at).toLocaleString('en-IN')}</td><td>${esc(v.device_type)}</td><td>${esc(v.browser)}</td><td>${esc(v.screen_size)}</td><td>${v.session_seconds||0}s</td><td class="${v.reveal_reached?'yes':'no'}">${v.reveal_reached?'Yes':'No'}</td><td>${esc(v.visitor_message||'—')}</td><td>${esc(v.referrer||'Direct')}</td></tr>`).join('');}
 function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
 function csv(){const head=['opened_at','visitor_key','device_type','browser','screen_size','session_seconds','reveal_reached','visitor_message','message_sent_at','referrer'];const lines=[head.join(','),...visits.map(v=>head.map(k=>`"${String(v[k]??'').replace(/"/g,'""')}"`).join(','))];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download='prank-visits.csv';a.click();URL.revokeObjectURL(a.href);}
 $('loginBtn').onclick=login;$('password').addEventListener('keydown',e=>{if(e.key==='Enter')login();});$('logoutBtn').onclick=async()=>{await db.auth.signOut();location.reload();};$('refreshBtn').onclick=load;$('csvBtn').onclick=csv;$('search').oninput=e=>{const q=e.target.value.toLowerCase();render(visits.filter(v=>JSON.stringify(v).toLowerCase().includes(q)));};check();
})();
