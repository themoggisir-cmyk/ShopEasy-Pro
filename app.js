(() => {
  const cfg = window.PRANK_CONFIG || {};
  const hasSupabase = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('PASTE_') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('PASTE_');
  const db = hasSupabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const $ = id => document.getElementById(id);
  const terminal = $('terminal');
  const sideLog = $('sideLog');
  const packetLog = $('packetLog');
  const progressBar = $('progressBar');
  const progressValue = $('progressValue');
  const progressLabel = $('progressLabel');
  const topStatus = $('topStatus');
  const screen = $('screen');
  let visitId = null, startedAt = Date.now(), revealReached = false, running = false;
  const sessionKey = crypto.randomUUID();

  const visitorKey = localStorage.getItem('prank_visitor_id') || crypto.randomUUID();
  localStorage.setItem('prank_visitor_id', visitorKey);
  $('sessionCode').textContent = Math.random().toString(36).slice(2, 8).toUpperCase();
  $('nodeCode').textContent = `N-${Math.floor(100 + Math.random() * 899)}`;

  const ua = navigator.userAgent;
  const deviceType = /Mobi|Android/i.test(ua) ? 'Mobile' : /Tablet|iPad/i.test(ua) ? 'Tablet' : 'Desktop';
  const browser = ua.includes('Edg/') ? 'Edge' : ua.includes('OPR/') ? 'Opera' : ua.includes('Chrome/') ? 'Chrome' : ua.includes('Safari/') && !ua.includes('Chrome/') ? 'Safari' : ua.includes('Firefox/') ? 'Firefox' : 'Other';

  async function logOpen(){
    if(!db) return;
    try{
      const {error}=await db.from('prank_visits').insert({session_key:sessionKey,visitor_key:visitorKey,device_type:deviceType,browser,screen_size:`${innerWidth}x${innerHeight}`,referrer:document.referrer||'Direct',user_agent:ua.slice(0,500)});
      if(!error) visitId=sessionKey;
    }catch{}
  }
  async function updateVisit(extra={}){ if(db&&visitId){ try{ await db.from('prank_visits').update(extra).eq('session_key',visitId); }catch{} } }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rand = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
  const hex = (len=16)=>Array.from({length:len},()=>"ABCDEF0123456789"[rand(0,15)]).join('');
  const ip = ()=>`${rand(10,223)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`;
  const port = ()=>[22,53,80,443,8080,8443,9001,51820][rand(0,7)];
  const pid = ()=>rand(1000,9999);
  const ts = ()=>new Date().toLocaleTimeString('en-GB',{hour12:false});

  function append(target,text,cls=''){
    const div=document.createElement('div');
    div.className=`line ${cls}`;
    div.textContent=text;
    target.appendChild(div);
    while(target.children.length>95) target.removeChild(target.firstChild);
    target.scrollTop=target.scrollHeight;
  }

  const codeFactories = [
    ()=>`[${ts()}] kernel: task[${pid()}] spawned /usr/bin/secure-agent --silent`,
    ()=>`[${ts()}] net.rx  ${ip()}:${port()}  seq=${rand(100000,999999)}  ttl=${rand(48,128)}  len=${rand(64,1500)}`,
    ()=>`[${ts()}] net.tx  ${ip()}:${port()}  ack=${rand(100000,999999)}  win=${rand(1024,65535)}`,
    ()=>`[${ts()}] crypto: aes-256-gcm block=${hex(8)} nonce=${hex(24)} status=OK`,
    ()=>`[${ts()}] syscall openat(AT_FDCWD,"/sys/runtime/${hex(6)}",O_RDONLY)=3`,
    ()=>`[${ts()}] mmap(NULL,${rand(4096,65536)},PROT_READ|PROT_WRITE,MAP_PRIVATE,-1,0)=0x${hex(12)}`,
    ()=>`[${ts()}] module.scan_${rand(1,64).toString().padStart(2,'0')} hash=${hex(40)} verified`,
    ()=>`[${ts()}] route add ${ip()}/32 via ${ip()} metric ${rand(1,99)}`,
    ()=>`[${ts()}] tls.handshake cipher=TLS_AES_256_GCM_SHA384 key=${hex(32)}`,
    ()=>`[${ts()}] thread-${rand(1,32)} mutex_lock(0x${hex(10)}) -> success`,
    ()=>`[${ts()}] fs.index inode=${rand(10000,999999)} mode=0644 checksum=${hex(16)}`,
    ()=>`[${ts()}] auth.policy rule_${rand(1,18).toString().padStart(2,'0')} => ALLOW`,
    ()=>`[${ts()}] mem.read 0x${hex(12)} +${rand(8,256)} bytes [${hex(12)}]`,
    ()=>`[${ts()}] daemon secure-relay[${pid()}]: heartbeat ${rand(12,96)}ms`,
    ()=>`[${ts()}] execve("/bin/sh",["sh","-c","verify --node ${hex(6)}"],envp)=0`
  ];

  const sideFactories = [
    ()=>`PID ${pid()}  cpu ${rand(1,97)}%  mem ${rand(18,940)}M`,
    ()=>`node-${rand(1,18)}  ${rand(1,15)}ms  ONLINE`,
    ()=>`key ${hex(8)}  rotate ${rand(2,59)}s`,
    ()=>`queue ${rand(0,99).toString().padStart(2,'0')}  jobs ${rand(1,32)}`,
    ()=>`sig ${hex(12)}  PASS`,
    ()=>`chan ${rand(1,9)}  packets ${rand(120,9999)}`
  ];

  const packetFactories = [
    ()=>`${ip()}:${port()} > ${ip()}:${port()} [SYN] seq ${rand(1000,99999)}`,
    ()=>`${ip()}:${port()} > ${ip()}:${port()} [ACK] win ${rand(1024,65535)}`,
    ()=>`0x${hex(4)}  ${hex(2)} ${hex(2)} ${hex(2)} ${hex(2)}  ${hex(8)} ${hex(8)}`,
    ()=>`udp ${rand(64,1400)} ${ip()} -> ${ip()} checksum 0x${hex(4)}`
  ];

  function startMatrix(){
    const canvas=$('matrixCanvas'),ctx=canvas.getContext('2d');
    function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
    resize(); addEventListener('resize',resize);
    const chars='01ABCDEF$#<>/\\[]{}'; const font=14; let drops=[];
    function reset(){drops=Array(Math.ceil(canvas.width/font)).fill(1);} reset();
    setInterval(()=>{
      ctx.fillStyle='rgba(0,5,2,.09)';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='rgba(70,255,145,.7)';ctx.font=`${font}px monospace`;
      drops.forEach((y,i)=>{ctx.fillText(chars[rand(0,chars.length-1)],i*font,y*font);if(y*font>canvas.height&&Math.random()>.975)drops[i]=0;drops[i]++;});
    },48);
  }

  function setProgress(v,label){progressBar.style.width=`${v}%`;progressValue.textContent=`${v}%`;progressLabel.textContent=label;}

  let glitchTimer = null;
  function startCyberGlitch(){
    screen.classList.add('cyber-running');
    const hit=()=>{
      if(!screen.classList.contains('cyber-running')) return;
      const classes=['glitch-hit','glitch-slice'];
      const chosen=classes[rand(0,classes.length-1)];
      screen.classList.add(chosen);
      if(Math.random()>.82) screen.classList.add('signal-drop');
      navigator.vibrate?.(Math.random()>.72?[12,18,8]:6);
      setTimeout(()=>screen.classList.remove(chosen,'signal-drop'),rand(70,170));
      glitchTimer=setTimeout(hit,rand(260,760));
    };
    glitchTimer=setTimeout(hit,220);
  }
  function stopCyberGlitch(){
    clearTimeout(glitchTimer);
    glitchTimer=null;
    screen.classList.remove('cyber-running','glitch-hit','glitch-slice','signal-drop');
  }

  async function runDenseStream(durationMs, pace=26){
    const start=performance.now();
    while(performance.now()-start<durationMs){
      const burst=rand(2,5);
      for(let i=0;i<burst;i++) append(terminal,codeFactories[rand(0,codeFactories.length-1)](),Math.random()<.08?'warn':'');
      if(Math.random()>.35) append(sideLog,sideFactories[rand(0,sideFactories.length-1)]());
      if(Math.random()>.2) append(packetLog,packetFactories[rand(0,packetFactories.length-1)]());
      if(Math.random()>.72) navigator.vibrate?.(8);
      await wait(pace+rand(0,22));
    }
  }

  async function phase(status,progress,label,duration,pace){
    topStatus.textContent=status; setProgress(progress,label);
    append(terminal,`>>> ${status} :: ${label}`,'section');
    await runDenseStream(duration,pace);
  }

  async function runPrank(){
    if(running)return; running=true; startedAt=Date.now(); revealReached=false;
    terminal.innerHTML='';sideLog.innerHTML='';packetLog.innerHTML='';
    $('systemMessage').classList.add('hidden');$('consoleGrid').classList.remove('hidden');$('progressWrap').classList.remove('hidden');
    startCyberGlitch();
    ['reveal2','reveal3','replayBtn','creatorFooter'].forEach(id=>$(id).classList.add('hidden')); $('visitorMessage').value=''; $('messageStatus').textContent=''; $('sendMessageBtn').disabled=false;

    await phase('BOOTSTRAP',8,'Loading low-level runtime modules...',1800,34);
    await phase('ROUTING',22,'Opening encrypted relay chain...',2300,28);
    await phase('HANDSHAKE',39,'Negotiating session keys...',2200,25);
    await phase('SCANNING',58,'Executing multi-threaded integrity scan...',3200,18);
    screen.classList.add('alerting'); navigator.vibrate?.([80,40,80]);
    append(terminal,'AUTHENTICATION SUCCESSFUL','success');
    append(terminal,'ACCESS REQUEST ACCEPTED','success');
    await wait(900);screen.classList.remove('alerting');
    await phase('EXECUTING',79,'Running protected process chain...',3200,16);
    await phase('FINALIZING',94,'Compiling session result...',1800,24);
    setProgress(100,'Secure process complete');
    append(terminal,'SYSTEM OVERRIDE COMPLETE','warn');
    await runDenseStream(1200,15);

    await wait(850);
    stopCyberGlitch();
    $('consoleGrid').classList.add('hidden');$('progressWrap').classList.add('hidden');$('systemMessage').classList.remove('hidden');
    screen.classList.add('hacked-glitching');
    navigator.vibrate?.([100,60,100]);
    await wait(5000);
    screen.classList.remove('hacked-glitching');
    screen.classList.add('final-glitch');
    $('reveal2').classList.remove('hidden');
    await wait(700);
    $('reveal3').classList.remove('hidden');
    await wait(650);
    screen.classList.remove('final-glitch');
    revealReached=true; running=false;
    updateVisit({reveal_reached:true,session_seconds:Math.round((Date.now()-startedAt)/1000)});
  }


  async function sendVisitorMessage(){
    const input=$('visitorMessage');
    const button=$('sendMessageBtn');
    const status=$('messageStatus');
    const message=input.value.trim();
    if(!message){ status.textContent='Message likho.'; input.focus(); return; }
    if(message.length>140){ status.textContent='Message 140 characters se chhota rakho.'; return; }
    button.disabled=true; status.textContent='Sending...';
    if(!db||!visitId){
      status.textContent='Message service connect nahi hui. Supabase setup check karo.';
      button.disabled=false; return;
    }
    try{
      const {error}=await db.from('prank_visits').update({visitor_message:message,message_sent_at:new Date().toISOString()}).eq('session_key',visitId);
      if(error) throw error;
      status.textContent='Message sent ✓'; input.disabled=true; setTimeout(()=>$('creatorFooter').classList.remove('hidden'),1500);
    }catch(e){
      status.textContent='Message send nahi hua. Updated supabase.sql run karo.';
      button.disabled=false;
    }
  }

  $('sendMessageBtn').addEventListener('click',sendVisitorMessage);
  $('visitorMessage').addEventListener('keydown',e=>{if(e.key==='Enter')sendVisitorMessage();});

  $('replayBtn').addEventListener('click',runPrank);
  $('exitBtn').addEventListener('click',()=>{document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#020403;color:#eaffef;font-family:system-ui;text-align:center;padding:20px"><div><h2>Simulation closed</h2><p>No files or personal data were accessed.</p></div></div>';});
  addEventListener('pagehide',()=>updateVisit({session_seconds:Math.round((Date.now()-startedAt)/1000),reveal_reached:revealReached}));

  startMatrix();logOpen();setTimeout(runPrank,250);
})();
