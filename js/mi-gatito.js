(function(){
  var SAVE_KEY = 'miGatitoSave';
  var DECAY_RATE = 100/900; // se vacia del todo en 15 minutos activos
  var SLEEP_RATE = 8; // recupera energia por segundo mientras duerme
  var MAX_OFFLINE_SECONDS = 6*3600;

  var VARIANTS = [
    {id:'carey', name:'Carey', base:'#f0dcc0', patches:[
      {x:-18,y:15,rx:14,ry:11,color:'#2b2320'},
      {x:20,y:8,rx:12,ry:10,color:'#d9772e'},
      {x:0,y:36,rx:11,ry:9,color:'#2b2320'},
      {x:-16,y:-40,rx:11,ry:9,color:'#d9772e'},
      {x:14,y:-46,rx:9,ry:8,color:'#2b2320'}
    ]},
    {id:'tuxedo', name:'Blanco y Negro', base:'#faf7f2', patches:[
      {x:0,y:-46,rx:22,ry:16,color:'#252019'},
      {x:0,y:28,rx:26,ry:22,color:'#252019'}
    ]},
    {id:'naranja', name:'Naranja', base:'#e8874a', stripes:true, stripeColor:'#c96a2e'},
    {id:'negro', name:'Negro', base:'#2b2320'},
    {id:'blanco', name:'Blanco', base:'#faf7f2'},
    {id:'gris', name:'Gris', base:'#9098a0', stripes:true, stripeColor:'#767d85'}
  ];
  var VARIANTS_BY_ID = {};
  VARIANTS.forEach(function(v){ VARIANTS_BY_ID[v.id] = v; });

  var FOODS = [
    {id:'pescado', name:'Pescado', icon:'🐟', value:25},
    {id:'leche', name:'Leche', icon:'🥛', value:15},
    {id:'pollo', name:'Pollo', icon:'🍗', value:30},
    {id:'croquetas', name:'Croquetas', icon:'🍪', value:20}
  ];

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GATO_W = 220, GATO_H = 220;

  var portalView = document.getElementById('portalView');
  var gatoView = document.getElementById('gatoView');
  var playGatoBtn = document.getElementById('playGatoBtn');
  var backFromGatoBtn = document.getElementById('backFromGatoBtn');
  var muteBtn = document.getElementById('gatoMuteBtn');

  var adoptView = document.getElementById('gatoAdoptView');
  var homeView = document.getElementById('gatoHomeView');
  var adoptGrid = document.getElementById('adoptGrid');
  var changeBtn = document.getElementById('gatoChangeBtn');

  var statHambreEl = document.getElementById('statHambre');
  var statHigieneEl = document.getElementById('statHigiene');
  var statEnergiaEl = document.getElementById('statEnergia');
  var statFelicidadEl = document.getElementById('statFelicidad');
  var canvas = document.getElementById('gatoCanvas');
  var ctx = canvas.getContext('2d');
  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = GATO_W*dpr;
    canvas.height = GATO_H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  var roomComerBtn = document.getElementById('roomComerBtn');
  var roomBanarBtn = document.getElementById('roomBanarBtn');
  var roomDormirBtn = document.getElementById('roomDormirBtn');
  var roomJugarBtn = document.getElementById('roomJugarBtn');
  var roomMimosBtn = document.getElementById('roomMimosBtn');

  var comerOverlay = document.getElementById('comerOverlay');
  var foodGrid = document.getElementById('foodGrid');
  var comerCloseBtn = document.getElementById('comerCloseBtn');

  var banarOverlay = document.getElementById('banarOverlay');
  var scrubArea = document.getElementById('scrubArea');
  var banarCloseBtn = document.getElementById('banarCloseBtn');

  var dormirOverlay = document.getElementById('dormirOverlay');
  var sleepZzz = document.getElementById('sleepZzz');
  var sleepToggleBtn = document.getElementById('sleepToggleBtn');
  var dormirCloseBtn = document.getElementById('dormirCloseBtn');

  var jugarMenuOverlay = document.getElementById('jugarMenuOverlay');
  var selectFutbolBtn = document.getElementById('selectFutbolBtn');
  var selectBasquetBtn = document.getElementById('selectBasquetBtn');
  var selectVoleyBtn = document.getElementById('selectVoleyBtn');
  var jugarMenuCloseBtn = document.getElementById('jugarMenuCloseBtn');

  var MINI_W = 280, MINI_H = 320;
  function fitMiniCanvas(canvasEl, mctx){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasEl.width = MINI_W*dpr;
    canvasEl.height = MINI_H*dpr;
    mctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function miniCanvasPoint(canvasEl, e){
    var rect = canvasEl.getBoundingClientRect();
    var scaleX = MINI_W/rect.width, scaleY = MINI_H/rect.height;
    return {x:(e.clientX-rect.left)*scaleX, y:(e.clientY-rect.top)*scaleY};
  }

  var futbolOverlay = document.getElementById('futbolOverlay');
  var futbolHintEl = document.getElementById('futbolHint');
  var futbolScoreEl = document.getElementById('futbolScore');
  var futbolResultEl = document.getElementById('futbolResult');
  var futbolCanvas = document.getElementById('futbolCanvas');
  var futbolCtx = futbolCanvas.getContext('2d');
  var futbolCloseBtn = document.getElementById('futbolCloseBtn');
  fitMiniCanvas(futbolCanvas, futbolCtx);
  window.addEventListener('resize', function(){ fitMiniCanvas(futbolCanvas, futbolCtx); });

  var basquetOverlay = document.getElementById('basquetOverlay');
  var basquetHintEl = document.getElementById('basquetHint');
  var basquetScoreEl = document.getElementById('basquetScore');
  var basquetResultEl = document.getElementById('basquetResult');
  var basquetCanvas = document.getElementById('basquetCanvas');
  var basquetCtx = basquetCanvas.getContext('2d');
  var basquetCloseBtn = document.getElementById('basquetCloseBtn');
  fitMiniCanvas(basquetCanvas, basquetCtx);
  window.addEventListener('resize', function(){ fitMiniCanvas(basquetCanvas, basquetCtx); });

  var voleyOverlay = document.getElementById('voleyOverlay');
  var voleyHintEl = document.getElementById('voleyHint');
  var voleyScoreEl = document.getElementById('voleyScore');
  var voleyResultEl = document.getElementById('voleyResult');
  var voleyCanvas = document.getElementById('voleyCanvas');
  var voleyCtx = voleyCanvas.getContext('2d');
  var voleyCloseBtn = document.getElementById('voleyCloseBtn');
  fitMiniCanvas(voleyCanvas, voleyCtx);
  window.addEventListener('resize', function(){ fitMiniCanvas(voleyCanvas, voleyCtx); });

  var mimosOverlay = document.getElementById('mimosOverlay');
  var mimosArea = document.getElementById('mimosArea');
  var mimosCloseBtn = document.getElementById('mimosCloseBtn');

  var muted = false;
  var audioCtx = null;
  function ensureAudio(){
    if (!audioCtx){
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ audioCtx = null; }
    }
  }
  function beep(freq, dur, type){
    if (muted || !audioCtx) return;
    var t0 = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  muteBtn.addEventListener('click', function(){
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
  });

  var adopted = null;
  var hambre = 80, higiene = 80, energia = 80, felicidad = 80;
  var lastActive = Date.now();
  var roomOpen = null;
  var sleeping = false;

  function clamp100(n){ return Math.max(0, Math.min(100, n)); }
  function clamp01(n){ return Math.max(0, Math.min(1, n)); }

  function loadProgress(){
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw){
        var data = JSON.parse(raw);
        adopted = data.adopted || null;
        hambre = data.hambre!==undefined ? data.hambre : 80;
        higiene = data.higiene!==undefined ? data.higiene : 80;
        energia = data.energia!==undefined ? data.energia : 80;
        felicidad = data.felicidad!==undefined ? data.felicidad : 80;
        lastActive = data.lastActive || Date.now();
      }
    } catch(e){}
  }
  function saveProgress(){
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        adopted: adopted, hambre: hambre, higiene: higiene,
        energia: energia, felicidad: felicidad, lastActive: Date.now()
      }));
    } catch(e){}
  }

  function applyOfflineDecay(){
    var now = Date.now();
    var elapsed = Math.max(0, (now-lastActive)/1000);
    elapsed = Math.min(elapsed, MAX_OFFLINE_SECONDS);
    var loss = DECAY_RATE*elapsed;
    hambre = clamp100(hambre-loss);
    higiene = clamp100(higiene-loss);
    energia = clamp100(energia-loss);
    felicidad = clamp100(felicidad-loss);
    lastActive = now;
  }

  // ---------- Dibujo del gato ----------
  function drawCat(cx, cy, scale, variant, mood, bob, t, rotation){
    ctx.save();
    ctx.translate(cx, cy+(bob||0));
    if (rotation) ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.strokeStyle = variant.base;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(32, 15);
    ctx.quadraticCurveTo(58, 0, 50, -35);
    ctx.stroke();

    ctx.fillStyle = variant.base;
    ctx.beginPath();
    ctx.ellipse(0, 22, 44, 36, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -28, 36, 0, Math.PI*2);
    ctx.fill();

    if (variant.patches){
      variant.patches.forEach(function(p){
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI*2);
        ctx.fill();
      });
    }
    if (variant.stripes){
      ctx.strokeStyle = variant.stripeColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      [[-22,4,-16,24],[-2,-2,4,20],[16,4,22,24]].forEach(function(s){
        ctx.beginPath(); ctx.moveTo(s[0],s[1]); ctx.lineTo(s[2],s[3]); ctx.stroke();
      });
    }

    ctx.fillStyle = variant.base;
    ctx.beginPath();
    ctx.moveTo(-28,-50); ctx.lineTo(-38,-78); ctx.lineTo(-10,-58); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(28,-50); ctx.lineTo(38,-78); ctx.lineTo(10,-58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff9fc0';
    ctx.beginPath();
    ctx.moveTo(-25,-53); ctx.lineTo(-31,-70); ctx.lineTo(-15,-59); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(25,-53); ctx.lineTo(31,-70); ctx.lineTo(15,-59); ctx.closePath(); ctx.fill();

    drawFace(mood, t);

    ctx.restore();
  }

  function drawFace(mood, t){
    var blink = !reducedMotion && Math.sin((t||0)*0.7) > 0.985;
    ctx.fillStyle = '#241a3d';
    if (mood==='sleepy'){
      ctx.strokeStyle='#241a3d'; ctx.lineWidth=3; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-17,-30); ctx.quadraticCurveTo(-10,-25,-3,-30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3,-30); ctx.quadraticCurveTo(10,-25,17,-30); ctx.stroke();
    } else if (mood==='happy'){
      ctx.strokeStyle='#241a3d'; ctx.lineWidth=3.5; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-19,-28); ctx.lineTo(-11,-35); ctx.lineTo(-3,-28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3,-28); ctx.lineTo(11,-35); ctx.lineTo(19,-28); ctx.stroke();
    } else if (!blink){
      ctx.beginPath(); ctx.arc(-10,-30,3.6,0,Math.PI*2); ctx.arc(10,-30,3.6,0,Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle='#241a3d'; ctx.lineWidth=2.5; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-13,-30); ctx.lineTo(-7,-30); ctx.moveTo(7,-30); ctx.lineTo(13,-30); ctx.stroke();
    }

    ctx.fillStyle = '#ff8fc0';
    ctx.beginPath();
    ctx.moveTo(-4,-22); ctx.lineTo(4,-22); ctx.lineTo(0,-18); ctx.closePath(); ctx.fill();

    ctx.strokeStyle = '#241a3d';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (mood==='sad'){
      ctx.beginPath(); ctx.moveTo(-9,-10); ctx.quadraticCurveTo(0,-15,9,-10); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0,-18); ctx.quadraticCurveTo(-6,-11,-11,-13);
      ctx.moveTo(0,-18); ctx.quadraticCurveTo(6,-11,11,-13);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(40,30,20,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-15,-20); ctx.lineTo(-32,-24);
    ctx.moveTo(-15,-16); ctx.lineTo(-32,-13);
    ctx.moveTo(15,-20); ctx.lineTo(32,-24);
    ctx.moveTo(15,-16); ctx.lineTo(32,-13);
    ctx.stroke();
  }

  function computeMood(){
    if (sleeping) return 'sleepy';
    if (energia < 18) return 'sleepy';
    var avg = (hambre+higiene+energia+felicidad)/4;
    if (avg < 35) return 'sad';
    if (avg > 75) return 'happy';
    return 'neutral';
  }

  // ---------- Pantalla de adopcion ----------
  function buildAdoptGrid(){
    adoptGrid.innerHTML = '';
    VARIANTS.forEach(function(v){
      var card = document.createElement('div');
      card.className = 'adopt-card';
      var c = document.createElement('canvas');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = 90*dpr; c.height = 90*dpr;
      c.style.width = '90px'; c.style.height = '90px';
      var cctx = c.getContext('2d');
      cctx.setTransform(dpr,0,0,dpr,0,0);
      cctx.save();
      cctx.translate(45, 56);
      cctx.scale(0.5, 0.5);
      drawVariantPreview(cctx, v);
      cctx.restore();
      var h3 = document.createElement('h3');
      h3.textContent = v.name;
      var btn = document.createElement('button');
      btn.textContent = 'Adoptar';
      btn.addEventListener('click', function(){ adoptCat(v.id); });
      card.appendChild(c);
      card.appendChild(h3);
      card.appendChild(btn);
      adoptGrid.appendChild(card);
    });
  }

  function drawVariantPreview(targetCtx, variant){
    var prevCtx = ctx;
    ctx = targetCtx;
    drawCat(0, 0, 1, variant, 'happy', 0, 0);
    ctx = prevCtx;
  }

  function adoptCat(id){
    adopted = id;
    hambre = 80; higiene = 80; energia = 80; felicidad = 80;
    lastActive = Date.now();
    saveProgress();
    beep(1046, 0.15, 'triangle');
    showHomeView();
  }

  changeBtn.addEventListener('click', function(){
    var ok = window.confirm('¿Seguro que querés adoptar otro gatito? Vas a dejar ir al que tenés ahora.');
    if (!ok) return;
    adopted = null;
    saveProgress();
    showAdoptView();
  });

  function showAdoptView(){
    adoptView.classList.remove('is-hidden');
    homeView.classList.add('is-hidden');
    pauseHomeLoop();
  }
  function showHomeView(){
    adoptView.classList.add('is-hidden');
    homeView.classList.remove('is-hidden');
    updateStatBars();
    startHomeLoop();
  }

  // ---------- Barras de estado ----------
  function statClass(base, value){
    return base + (value < 25 ? ' low' : '');
  }
  function updateStatBars(){
    statHambreEl.style.width = hambre+'%';
    statHambreEl.className = statClass('stat-fill hunger', hambre);
    statHigieneEl.style.width = higiene+'%';
    statHigieneEl.className = statClass('stat-fill hygiene', higiene);
    statEnergiaEl.style.width = energia+'%';
    statEnergiaEl.className = statClass('stat-fill energy', energia);
    statFelicidadEl.style.width = felicidad+'%';
    statFelicidadEl.className = statClass('stat-fill happy', felicidad);
  }

  // ---------- Bucle principal (decaimiento + dibujo) ----------
  var homeLoopRunning = false;
  var lastTime = null;
  function startHomeLoop(){
    if (homeLoopRunning) return;
    homeLoopRunning = true;
    lastTime = null;
    requestAnimationFrame(homeLoop);
  }
  function pauseHomeLoop(){
    homeLoopRunning = false;
  }
  function homeLoop(ts){
    if (!homeLoopRunning) return;
    if (lastTime===null) lastTime = ts;
    var dt = Math.min(0.25, (ts-lastTime)/1000);
    lastTime = ts;
    var t = ts/1000;

    if (!roomOpen){
      hambre = clamp100(hambre - DECAY_RATE*dt);
      higiene = clamp100(higiene - DECAY_RATE*dt);
      energia = clamp100(energia - DECAY_RATE*dt);
      felicidad = clamp100(felicidad - DECAY_RATE*dt);
      updateStatBars();
    } else if (sleeping){
      energia = clamp100(energia + SLEEP_RATE*dt);
      updateStatBars();
      if (energia >= 100) stopSleeping();
    }

    var bob = reducedMotion ? 0 : Math.sin(t*2)*4;
    ctx.clearRect(0,0,GATO_W,GATO_H);
    if (adopted){
      drawCat(GATO_W/2, GATO_H/2+40, 1.35, VARIANTS_BY_ID[adopted], computeMood(), bob, t);
    }
    requestAnimationFrame(homeLoop);
  }

  // ---------- Salas: gestion generica ----------
  var allRoomOverlays = [comerOverlay, banarOverlay, dormirOverlay, jugarMenuOverlay, futbolOverlay, basquetOverlay, voleyOverlay, mimosOverlay];
  function closeAllRooms(){
    allRoomOverlays.forEach(function(o){ o.classList.add('is-hidden'); });
    roomOpen = null;
    if (sleeping) stopSleeping();
  }
  function openRoom(overlayEl, name){
    closeAllRooms();
    overlayEl.classList.remove('is-hidden');
    roomOpen = name;
  }

  roomComerBtn.addEventListener('click', function(){ ensureAudio(); openComer(); });
  roomBanarBtn.addEventListener('click', function(){ ensureAudio(); openRoom(banarOverlay, 'banar'); });
  roomDormirBtn.addEventListener('click', function(){ ensureAudio(); openRoom(dormirOverlay, 'dormir'); });
  roomJugarBtn.addEventListener('click', function(){ ensureAudio(); openRoom(jugarMenuOverlay, 'jugar'); });
  roomMimosBtn.addEventListener('click', function(){ ensureAudio(); openRoom(mimosOverlay, 'mimos'); });

  comerCloseBtn.addEventListener('click', function(){ closeAllRooms(); saveProgress(); });
  banarCloseBtn.addEventListener('click', function(){ closeAllRooms(); saveProgress(); });
  dormirCloseBtn.addEventListener('click', function(){ closeAllRooms(); saveProgress(); });
  jugarMenuCloseBtn.addEventListener('click', function(){ closeAllRooms(); saveProgress(); });
  mimosCloseBtn.addEventListener('click', function(){ closeAllRooms(); saveProgress(); });

  // ---------- Sala: Comer ----------
  var feedCooldown = 0;
  function openComer(){
    openRoom(comerOverlay, 'comer');
    renderFoodGrid();
  }
  function renderFoodGrid(){
    foodGrid.innerHTML = '';
    FOODS.forEach(function(food){
      var btn = document.createElement('button');
      btn.className = 'food-btn';
      btn.innerHTML = '<span class="food-icon">'+food.icon+'</span><span>'+food.name+'</span>';
      btn.disabled = feedCooldown > 0;
      btn.addEventListener('click', function(){ feedCat(food); });
      foodGrid.appendChild(btn);
    });
  }
  function feedCat(food){
    if (feedCooldown > 0) return;
    hambre = clamp100(hambre + food.value);
    updateStatBars();
    beep(600, 0.08, 'sine');
    feedCooldown = 0.8;
    renderFoodGrid();
    saveProgress();
    var iv = setInterval(function(){
      feedCooldown -= 0.1;
      if (feedCooldown <= 0){
        feedCooldown = 0;
        clearInterval(iv);
        renderFoodGrid();
      }
    }, 100);
  }

  // ---------- Sala: Bañar ----------
  scrubArea.addEventListener('click', function(e){
    higiene = clamp100(higiene + 8);
    updateStatBars();
    beep(700+Math.random()*200, 0.06, 'sine');
    var bubble = document.createElement('div');
    bubble.className = 'bubble-pop';
    bubble.textContent = '🫧';
    bubble.style.left = (50 + (Math.random()*40-20)) + '%';
    bubble.style.top = '20%';
    banarOverlay.appendChild(bubble);
    setTimeout(function(){ if (bubble.parentNode) bubble.parentNode.removeChild(bubble); }, 720);
    saveProgress();
  });

  // ---------- Sala: Dormir ----------
  function stopSleeping(){
    sleeping = false;
    sleepZzz.classList.remove('active');
    sleepToggleBtn.textContent = 'Dormir';
    saveProgress();
  }
  sleepToggleBtn.addEventListener('click', function(){
    sleeping = !sleeping;
    if (sleeping){
      sleepZzz.classList.add('active');
      sleepToggleBtn.textContent = 'Despertar';
      beep(300, 0.2, 'sine');
    } else {
      stopSleeping();
    }
  });

  // ---------- Sala: Jugar (menu) ----------
  selectFutbolBtn.addEventListener('click', function(){ launchFutbol(); });
  selectBasquetBtn.addEventListener('click', function(){ launchBasquet(); });
  selectVoleyBtn.addEventListener('click', function(){ launchVoley(); });

  // ---------- Sala: Jugar / Fútbol (penales con arquero) ----------
  var GOAL = {left:34, right:246, top:46, bottom:158};
  var GOAL_MARGIN = 14;
  var KICK_SPOT = {x:140, y:300};
  var KEEPER_START = {x:140, y:104};
  var FUTBOL_ROUNDS = 5;

  var futbolRound = 0, futbolGoals = 0;
  var futbolState = 'idle'; // 'aiming' | 'anim' | 'result' | 'done'
  var futbolBall = {x:KICK_SPOT.x, y:KICK_SPOT.y};
  var futbolShotTarget = null;
  var futbolKeeperPos = {x:KEEPER_START.x, y:KEEPER_START.y};
  var futbolKeeperTarget = {x:KEEPER_START.x, y:KEEPER_START.y};
  var futbolKeeperRot = 0;
  var futbolOutcome = null; // 'goal' | 'save'
  var futbolAnimT = 0;
  var futbolAnimDur = 0.5;
  var futbolLastTs = null;
  var futbolResultTimer = null;
  var futbolAimPreview = null;

  function launchFutbol(){
    if (futbolResultTimer){ clearTimeout(futbolResultTimer); futbolResultTimer = null; }
    closeAllRooms();
    futbolOverlay.classList.remove('is-hidden');
    roomOpen = 'futbol';
    futbolRound = 0; futbolGoals = 0;
    futbolResultEl.classList.add('is-hidden');
    futbolResultEl.classList.remove('show','good','bad');
    futbolScoreEl.textContent = 'Penales: 0/'+FUTBOL_ROUNDS+' · Goles: 0';
    futbolHintEl.textContent = 'Tocá dentro del arco para patear';
    resetFutbolShot();
    futbolState = 'aiming';
    futbolLastTs = null;
    requestAnimationFrame(futbolLoop);
  }

  function resetFutbolShot(){
    futbolBall.x = KICK_SPOT.x; futbolBall.y = KICK_SPOT.y;
    futbolKeeperPos.x = KEEPER_START.x; futbolKeeperPos.y = KEEPER_START.y;
    futbolKeeperTarget.x = KEEPER_START.x; futbolKeeperTarget.y = KEEPER_START.y;
    futbolKeeperRot = 0;
    futbolShotTarget = null;
    futbolAnimT = 0;
  }

  function futbolClampAim(p){
    return {
      x: Math.max(GOAL.left+GOAL_MARGIN, Math.min(GOAL.right-GOAL_MARGIN, p.x)),
      y: Math.max(GOAL.top+GOAL_MARGIN, Math.min(GOAL.bottom-GOAL_MARGIN, p.y))
    };
  }

  futbolCanvas.addEventListener('pointermove', function(e){
    if (futbolState !== 'aiming') return;
    futbolAimPreview = futbolClampAim(miniCanvasPoint(futbolCanvas, e));
  });
  futbolCanvas.addEventListener('pointerleave', function(){ futbolAimPreview = null; });
  futbolCanvas.addEventListener('pointerdown', function(e){
    if (futbolState !== 'aiming') return;
    takeFutbolShot(futbolClampAim(miniCanvasPoint(futbolCanvas, e)));
  });

  function takeFutbolShot(target){
    futbolShotTarget = target;
    var cx = (GOAL.left+GOAL.right)/2, cy = (GOAL.top+GOAL.bottom)/2;
    var halfW = (GOAL.right-GOAL.left)/2 - GOAL_MARGIN, halfH = (GOAL.bottom-GOAL.top)/2 - GOAL_MARGIN;
    var nx = (target.x-cx)/halfW, ny = (target.y-cy)/halfH;
    var d = Math.sqrt(nx*nx + ny*ny);
    var saveChance = clamp01(0.72 - d*0.5 + futbolRound*0.02);
    var isSave = Math.random() < saveChance;
    futbolOutcome = isSave ? 'save' : 'goal';
    if (isSave){
      futbolKeeperTarget.x = target.x;
      futbolKeeperTarget.y = target.y;
    } else {
      var altAngle = Math.random()*Math.PI*2;
      var missDist = 70+Math.random()*40;
      var altX = cx + Math.cos(altAngle)*missDist;
      var altY = cy + Math.sin(altAngle)*missDist*0.6;
      if (Math.hypot(altX-target.x, altY-target.y) < 60){
        altX = cx - (target.x-cx);
        altY = cy - (target.y-cy);
      }
      futbolKeeperTarget.x = Math.max(GOAL.left-10, Math.min(GOAL.right+10, altX));
      futbolKeeperTarget.y = Math.max(GOAL.top-6, Math.min(GOAL.bottom+10, altY));
    }
    futbolState = 'anim';
    futbolAnimT = 0;
    futbolLastTs = null;
  }

  function resolveFutbolShot(){
    futbolState = 'result';
    futbolRound += 1;
    if (futbolOutcome === 'goal'){
      futbolGoals += 1;
      beep(880, 0.1, 'triangle');
      setTimeout(function(){ beep(1180, 0.14, 'triangle'); }, 90);
      futbolHintEl.textContent = '¡GOOOL! ⚽';
      futbolResultEl.textContent = '¡GOOL!';
      futbolResultEl.className = 'sport-result show good';
    } else {
      beep(180, 0.16, 'sawtooth');
      futbolHintEl.textContent = 'El gato la atajó';
      futbolResultEl.textContent = '¡ATAJADA!';
      futbolResultEl.className = 'sport-result show bad';
    }
    futbolScoreEl.textContent = 'Penales: '+futbolRound+'/'+FUTBOL_ROUNDS+' · Goles: '+futbolGoals;
    futbolResultTimer = setTimeout(function(){
      futbolResultEl.classList.add('is-hidden');
      futbolResultEl.classList.remove('show');
      if (futbolRound >= FUTBOL_ROUNDS){
        finishFutbol();
      } else {
        resetFutbolShot();
        futbolState = 'aiming';
        futbolHintEl.textContent = 'Tocá dentro del arco para patear';
      }
    }, 1100);
  }

  function finishFutbol(){
    futbolState = 'done';
    var gain = futbolGoals*8;
    felicidad = clamp100(felicidad + gain);
    energia = clamp100(energia - 8);
    updateStatBars();
    futbolHintEl.textContent = 'Convertiste '+futbolGoals+' de '+FUTBOL_ROUNDS+' penales. +'+gain+' felicidad';
    saveProgress();
  }

  futbolCloseBtn.addEventListener('click', function(){
    if (futbolResultTimer){ clearTimeout(futbolResultTimer); futbolResultTimer = null; }
    futbolState = 'idle';
    closeAllRooms();
    openRoom(jugarMenuOverlay, 'jugar');
  });

  function drawPentagon(c, cx, cy, r){
    c.beginPath();
    for (var i=0;i<5;i++){
      var ang = -Math.PI/2 + i*(2*Math.PI/5);
      var px = cx+Math.cos(ang)*r, py = cy+Math.sin(ang)*r;
      if (i===0) c.moveTo(px,py); else c.lineTo(px,py);
    }
    c.closePath();
    c.fill();
  }

  function drawFutbolBall(x,y){
    var c = futbolCtx;
    c.save();
    c.translate(x,y);
    c.fillStyle = '#f5f5f0';
    c.beginPath(); c.arc(0,0,9,0,Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(30,30,30,0.5)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = 'rgba(30,30,30,0.8)';
    drawPentagon(c,0,-2.5,2.6);
    drawPentagon(c,-4.5,3,2.2);
    drawPentagon(c,4.5,3,2.2);
    c.restore();
  }

  function drawFutbolNet(){
    var c = futbolCtx;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.3)';
    c.lineWidth = 1;
    c.beginPath();
    var step = 12;
    for (var x=GOAL.left; x<=GOAL.right; x+=step){ c.moveTo(x, GOAL.top); c.lineTo(x, GOAL.bottom); }
    for (var y=GOAL.top; y<=GOAL.bottom; y+=step){ c.moveTo(GOAL.left, y); c.lineTo(GOAL.right, y); }
    c.stroke();
    c.restore();
  }

  function drawFutbol(ts){
    var c = futbolCtx;
    c.clearRect(0,0,MINI_W,MINI_H);

    var skyGrad = c.createLinearGradient(0,0,0,GOAL.top+10);
    skyGrad.addColorStop(0, '#8fd3f4');
    skyGrad.addColorStop(1, '#d7efdd');
    c.fillStyle = skyGrad;
    c.fillRect(0,0,MINI_W,GOAL.top+10);

    c.fillStyle = 'rgba(50,40,80,0.28)';
    c.fillRect(0,3,MINI_W,15);
    for (var cx=3; cx<MINI_W; cx+=6){
      var hue = (cx*37) % 5;
      c.fillStyle = ['#ff9fc0','#ffd23f','#6fe0d9','#ffffff','#ff7fa8'][hue];
      c.globalAlpha = 0.6;
      c.fillRect(cx, 5+((cx%3)*2), 3, 3);
    }
    c.globalAlpha = 1;

    var grassGrad = c.createLinearGradient(0,GOAL.top,0,MINI_H);
    grassGrad.addColorStop(0, '#4fae4f');
    grassGrad.addColorStop(1, '#276b2c');
    c.fillStyle = grassGrad;
    c.fillRect(0,GOAL.top,MINI_W,MINI_H-GOAL.top);

    c.fillStyle = 'rgba(255,255,255,0.08)';
    for (var i=0;i<7;i+=2){ c.fillRect(0, GOAL.bottom + i*22, MINI_W, 22); }

    drawFutbolNet();
    c.fillStyle = '#f5f5f5';
    c.fillRect(GOAL.left-6, GOAL.top-6, 6, GOAL.bottom-GOAL.top+6);
    c.fillRect(GOAL.right, GOAL.top-6, 6, GOAL.bottom-GOAL.top+6);
    c.fillRect(GOAL.left-6, GOAL.top-6, GOAL.right-GOAL.left+12, 6);

    if (futbolState === 'aiming'){
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.setLineDash([4,4]);
      c.strokeRect(GOAL.left+GOAL_MARGIN, GOAL.top+GOAL_MARGIN, (GOAL.right-GOAL.left)-GOAL_MARGIN*2, (GOAL.bottom-GOAL.top)-GOAL_MARGIN*2);
      c.restore();
      if (futbolAimPreview){
        var p = futbolAimPreview;
        c.save();
        c.strokeStyle = 'rgba(255,255,255,0.85)';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(p.x,p.y,7,0,Math.PI*2); c.stroke();
        c.beginPath();
        c.moveTo(p.x-10,p.y); c.lineTo(p.x-4,p.y);
        c.moveTo(p.x+4,p.y); c.lineTo(p.x+10,p.y);
        c.moveTo(p.x,p.y-10); c.lineTo(p.x,p.y-4);
        c.moveTo(p.x,p.y+4); c.lineTo(p.x,p.y+10);
        c.stroke();
        c.restore();
      }
    }

    var mood = futbolState==='result' ? (futbolOutcome==='save' ? 'happy' : 'sad') : 'neutral';
    var variant = VARIANTS_BY_ID[adopted] || VARIANTS[0];
    var prevCtx = ctx;
    ctx = futbolCtx;
    drawCat(futbolKeeperPos.x, futbolKeeperPos.y, 0.5, variant, mood, 0, (ts||0)/1000, futbolKeeperRot);
    ctx = prevCtx;

    if (futbolState === 'anim' || futbolState === 'result' || futbolState === 'done'){
      drawFutbolBall(futbolBall.x, futbolBall.y);
    } else {
      drawFutbolBall(KICK_SPOT.x, KICK_SPOT.y);
    }
  }

  function futbolLoop(ts){
    if (roomOpen !== 'futbol'){ futbolLastTs = null; return; }
    if (futbolLastTs === null) futbolLastTs = ts;
    var dt = Math.min(0.05, (ts-futbolLastTs)/1000);
    futbolLastTs = ts;

    if (futbolState === 'anim'){
      futbolAnimT = Math.min(1, futbolAnimT + dt/futbolAnimDur);
      var ease = 1-Math.pow(1-futbolAnimT, 2);
      futbolBall.x = KICK_SPOT.x + (futbolShotTarget.x-KICK_SPOT.x)*ease;
      futbolBall.y = KICK_SPOT.y + (futbolShotTarget.y-KICK_SPOT.y)*ease;

      var diveE = Math.min(1, futbolAnimT/0.75);
      var diveEase = 1-Math.pow(1-diveE, 3);
      futbolKeeperPos.x = KEEPER_START.x + (futbolKeeperTarget.x-KEEPER_START.x)*diveEase;
      futbolKeeperPos.y = KEEPER_START.y + (futbolKeeperTarget.y-KEEPER_START.y)*diveEase;
      var dirSign = futbolKeeperTarget.x >= KEEPER_START.x ? 1 : -1;
      futbolKeeperRot = dirSign*diveEase*(Math.PI/2.1);

      if (futbolAnimT >= 1) resolveFutbolShot();
    }

    drawFutbol(ts);
    requestAnimationFrame(futbolLoop);
  }

  // ---------- Sala: Jugar / Básquet (tiros al aro) ----------
  var HOOP = {left:70, right:210, top:60, bottom:120};
  var HOOP_MARGIN = 12;
  var RIM = {x:140, y:96, rx:34, ry:8};
  var PLAYER_SPOT = {x:140, y:300};
  var CAT_SPOT = {x:40, y:296};
  var BASQUET_ROUNDS = 5;

  var basquetRound = 0, basquetMakes = 0;
  var basquetState = 'idle'; // 'aiming' | 'arc' | 'result' | 'done'
  var basquetBall = {x:PLAYER_SPOT.x, y:PLAYER_SPOT.y};
  var basquetShotTarget = null;
  var basquetOutcome = null; // 'make' | 'miss'
  var basquetBounceFrom = null, basquetBounceTo = null;
  var basquetAnimT = 0;
  var basquetAnimDur = 0.5;
  var basquetLastTs = null;
  var basquetResultTimer = null;
  var basquetAimPreview = null;
  var basquetCatBob = 0;

  function launchBasquet(){
    if (basquetResultTimer){ clearTimeout(basquetResultTimer); basquetResultTimer = null; }
    closeAllRooms();
    basquetOverlay.classList.remove('is-hidden');
    roomOpen = 'basquet';
    basquetRound = 0; basquetMakes = 0;
    basquetResultEl.classList.add('is-hidden');
    basquetResultEl.classList.remove('show','good','bad');
    basquetScoreEl.textContent = 'Tiros: 0/'+BASQUET_ROUNDS+' · Encestes: 0';
    basquetHintEl.textContent = 'Tocá cerca del aro para tirar';
    resetBasquetShot();
    basquetState = 'aiming';
    basquetLastTs = null;
    requestAnimationFrame(basquetLoop);
  }

  function resetBasquetShot(){
    basquetBall.x = PLAYER_SPOT.x; basquetBall.y = PLAYER_SPOT.y;
    basquetShotTarget = null;
    basquetBounceFrom = null; basquetBounceTo = null;
    basquetAnimT = 0;
  }

  function basquetClampAim(p){
    return {
      x: Math.max(HOOP.left+HOOP_MARGIN, Math.min(HOOP.right-HOOP_MARGIN, p.x)),
      y: Math.max(HOOP.top+HOOP_MARGIN, Math.min(HOOP.bottom-HOOP_MARGIN, p.y))
    };
  }

  basquetCanvas.addEventListener('pointermove', function(e){
    if (basquetState !== 'aiming') return;
    basquetAimPreview = basquetClampAim(miniCanvasPoint(basquetCanvas, e));
  });
  basquetCanvas.addEventListener('pointerleave', function(){ basquetAimPreview = null; });
  basquetCanvas.addEventListener('pointerdown', function(e){
    if (basquetState !== 'aiming') return;
    takeBasquetShot(basquetClampAim(miniCanvasPoint(basquetCanvas, e)));
  });

  function takeBasquetShot(target){
    basquetShotTarget = target;
    var nx = (target.x-RIM.x)/(HOOP.right-HOOP.left-HOOP_MARGIN*2)*2;
    var ny = (target.y-RIM.y)/(HOOP.bottom-HOOP.top-HOOP_MARGIN*2)*2;
    var d = Math.sqrt(nx*nx + ny*ny);
    var makeChance = clamp01(0.82 - d*0.65 + basquetRound*0.02);
    var isMake = Math.random() < makeChance;
    basquetOutcome = isMake ? 'make' : 'miss';
    if (!isMake){
      var deflectAngle = Math.random()*Math.PI*2;
      var deflectDist = 30+Math.random()*26;
      basquetBounceFrom = {x:target.x, y:target.y};
      basquetBounceTo = {
        x: target.x + Math.cos(deflectAngle)*deflectDist,
        y: target.y - 10 + Math.sin(deflectAngle)*deflectDist*0.5
      };
    }
    basquetState = 'arc';
    basquetAnimT = 0;
    basquetLastTs = null;
  }

  function resolveBasquetShot(){
    basquetRound += 1;
    if (basquetOutcome === 'make'){
      basquetMakes += 1;
      beep(940, 0.09, 'triangle');
      setTimeout(function(){ beep(1260, 0.16, 'triangle'); }, 80);
      basquetHintEl.textContent = '¡ENCESTE! 🏀';
      basquetResultEl.textContent = '¡SWISH!';
      basquetResultEl.className = 'sport-result show good';
      basquetState = 'result';
    } else {
      beep(220, 0.14, 'sawtooth');
      basquetHintEl.textContent = 'Pegó en el aro';
      basquetResultEl.textContent = '¡AFUERA!';
      basquetResultEl.className = 'sport-result show bad';
      basquetState = 'bounce';
      basquetAnimT = 0;
    }
    basquetScoreEl.textContent = 'Tiros: '+basquetRound+'/'+BASQUET_ROUNDS+' · Encestes: '+basquetMakes;
    if (basquetOutcome === 'make') scheduleBasquetNext();
  }

  function scheduleBasquetNext(){
    basquetResultTimer = setTimeout(function(){
      basquetResultEl.classList.add('is-hidden');
      basquetResultEl.classList.remove('show');
      if (basquetRound >= BASQUET_ROUNDS){
        finishBasquet();
      } else {
        resetBasquetShot();
        basquetState = 'aiming';
        basquetHintEl.textContent = 'Tocá cerca del aro para tirar';
      }
    }, 1100);
  }

  function finishBasquet(){
    basquetState = 'done';
    var gain = basquetMakes*8;
    felicidad = clamp100(felicidad + gain);
    energia = clamp100(energia - 8);
    updateStatBars();
    basquetHintEl.textContent = 'Encestaste '+basquetMakes+' de '+BASQUET_ROUNDS+' tiros. +'+gain+' felicidad';
    saveProgress();
  }

  basquetCloseBtn.addEventListener('click', function(){
    if (basquetResultTimer){ clearTimeout(basquetResultTimer); basquetResultTimer = null; }
    basquetState = 'idle';
    closeAllRooms();
    openRoom(jugarMenuOverlay, 'jugar');
  });

  function drawBasquetball(x,y){
    var c = basquetCtx;
    c.save();
    c.translate(x,y);
    c.fillStyle = '#e8874a';
    c.beginPath(); c.arc(0,0,9,0,Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(30,20,10,0.6)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(0,0,9,0,Math.PI*2); c.stroke();
    c.beginPath(); c.moveTo(-9,0); c.lineTo(9,0); c.stroke();
    c.beginPath(); c.moveTo(0,-9); c.lineTo(0,9); c.stroke();
    c.beginPath(); c.arc(0,0,9,Math.PI*0.15,Math.PI*0.85); c.stroke();
    c.beginPath(); c.arc(0,0,9,Math.PI*1.15,Math.PI*1.85); c.stroke();
    c.restore();
  }

  function drawBasquet(ts){
    var c = basquetCtx;
    c.clearRect(0,0,MINI_W,MINI_H);

    var wallGrad = c.createLinearGradient(0,0,0,MINI_H);
    wallGrad.addColorStop(0, '#3a4a63');
    wallGrad.addColorStop(0.42, '#5c6f8c');
    wallGrad.addColorStop(0.42, '#a9713f');
    wallGrad.addColorStop(1, '#7a4d28');
    c.fillStyle = wallGrad;
    c.fillRect(0,0,MINI_W,MINI_H);

    c.strokeStyle = 'rgba(255,255,255,0.08)';
    c.lineWidth = 1;
    for (var fx=20; fx<MINI_W; fx+=22){ c.beginPath(); c.moveTo(fx,MINI_H*0.42); c.lineTo(fx,MINI_H); c.stroke(); }

    // net
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 1;
    c.beginPath();
    for (var a=-1;a<=1.001;a+=0.25){
      c.moveTo(RIM.x+a*RIM.rx, RIM.y);
      c.lineTo(RIM.x+a*RIM.rx*0.35, RIM.y+26);
    }
    c.moveTo(RIM.x-RIM.rx, RIM.y+9); c.lineTo(RIM.x+RIM.rx, RIM.y+9);
    c.moveTo(RIM.x-RIM.rx*0.6, RIM.y+18); c.lineTo(RIM.x+RIM.rx*0.6, RIM.y+18);
    c.stroke();
    c.restore();

    // tablero (backboard)
    c.fillStyle = '#f5f5f5';
    c.fillRect(HOOP.left-2, HOOP.top-24, HOOP.right-HOOP.left+4, 26);
    c.strokeStyle = 'rgba(200,40,40,0.8)';
    c.lineWidth = 2;
    c.strokeRect(HOOP.left+30, HOOP.top-18, HOOP.right-HOOP.left-60, 14);

    // aro
    c.strokeStyle = '#e8542f';
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(RIM.x, RIM.y, RIM.rx, RIM.ry, 0, 0, Math.PI*2);
    c.stroke();

    if (basquetState === 'aiming'){
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.setLineDash([4,4]);
      c.strokeRect(HOOP.left+HOOP_MARGIN, HOOP.top+HOOP_MARGIN, (HOOP.right-HOOP.left)-HOOP_MARGIN*2, (HOOP.bottom-HOOP.top)-HOOP_MARGIN*2);
      c.restore();
      if (basquetAimPreview){
        var p = basquetAimPreview;
        c.save();
        c.strokeStyle = 'rgba(255,255,255,0.85)';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(p.x,p.y,7,0,Math.PI*2); c.stroke();
        c.beginPath();
        c.moveTo(p.x-10,p.y); c.lineTo(p.x-4,p.y);
        c.moveTo(p.x+4,p.y); c.lineTo(p.x+10,p.y);
        c.moveTo(p.x,p.y-10); c.lineTo(p.x,p.y-4);
        c.moveTo(p.x,p.y+4); c.lineTo(p.x,p.y+10);
        c.stroke();
        c.restore();
      }
    }

    var catMood = basquetState==='result' ? 'happy' : (basquetState==='bounce' ? 'sad' : 'neutral');
    var variant = VARIANTS_BY_ID[adopted] || VARIANTS[0];
    var prevCtx = ctx;
    ctx = basquetCtx;
    drawCat(CAT_SPOT.x, CAT_SPOT.y, 0.4, variant, catMood, basquetCatBob, (ts||0)/1000, 0);
    ctx = prevCtx;

    if (basquetState === 'arc' || basquetState === 'result' || basquetState === 'bounce'){
      drawBasquetball(basquetBall.x, basquetBall.y);
    } else {
      drawBasquetball(PLAYER_SPOT.x, PLAYER_SPOT.y);
    }
  }

  function basquetLoop(ts){
    if (roomOpen !== 'basquet'){ basquetLastTs = null; return; }
    if (basquetLastTs === null) basquetLastTs = ts;
    var dt = Math.min(0.05, (ts-basquetLastTs)/1000);
    basquetLastTs = ts;

    if (basquetState === 'arc'){
      basquetAnimT = Math.min(1, basquetAnimT + dt/basquetAnimDur);
      var t = basquetAnimT;
      var dist = Math.abs(basquetShotTarget.x-PLAYER_SPOT.x);
      var peak = Math.min(140, 70+dist*0.35);
      var midX = (PLAYER_SPOT.x+basquetShotTarget.x)/2;
      var midY = Math.min(PLAYER_SPOT.y, basquetShotTarget.y) - peak;
      var mt = 1-t;
      basquetBall.x = mt*mt*PLAYER_SPOT.x + 2*mt*t*midX + t*t*basquetShotTarget.x;
      basquetBall.y = mt*mt*PLAYER_SPOT.y + 2*mt*t*midY + t*t*basquetShotTarget.y;
      basquetCatBob = Math.sin(t*Math.PI)*-6;
      if (basquetAnimT >= 1) resolveBasquetShot();
    } else if (basquetState === 'bounce'){
      basquetAnimT = Math.min(1, basquetAnimT + dt/0.35);
      var be = basquetAnimT;
      basquetBall.x = basquetBounceFrom.x + (basquetBounceTo.x-basquetBounceFrom.x)*be;
      basquetBall.y = basquetBounceFrom.y + (basquetBounceTo.y-basquetBounceFrom.y)*be + Math.sin(be*Math.PI)*-14;
      if (basquetAnimT >= 1){
        basquetState = 'result';
        scheduleBasquetNext();
      }
    }

    drawBasquet(ts);
    requestAnimationFrame(basquetLoop);
  }

  // ---------- Sala: Jugar / Vóley (remate contra el bloqueo) ----------
  var COURT = {left:30, right:250, top:40, bottom:135};
  var COURT_MARGIN = 12;
  var NET_Y = 150;
  var SERVE_SPOT = {x:140, y:280};
  var BLOCKER_START = {x:140, y:82};
  var VOLEY_ROUNDS = 5;

  var voleyRound = 0, voleyPoints = 0;
  var voleyState = 'idle'; // 'aiming' | 'anim' | 'result' | 'done'
  var voleyBall = {x:SERVE_SPOT.x, y:SERVE_SPOT.y};
  var voleyShotTarget = null;
  var voleyBlockerPos = {x:BLOCKER_START.x, y:BLOCKER_START.y};
  var voleyBlockerTarget = {x:BLOCKER_START.x, y:BLOCKER_START.y};
  var voleyBlockerRot = 0;
  var voleyOutcome = null; // 'point' | 'blocked'
  var voleyAnimT = 0;
  var voleyAnimDur = 0.45;
  var voleyLastTs = null;
  var voleyResultTimer = null;
  var voleyAimPreview = null;

  function launchVoley(){
    if (voleyResultTimer){ clearTimeout(voleyResultTimer); voleyResultTimer = null; }
    closeAllRooms();
    voleyOverlay.classList.remove('is-hidden');
    roomOpen = 'voley';
    voleyRound = 0; voleyPoints = 0;
    voleyResultEl.classList.add('is-hidden');
    voleyResultEl.classList.remove('show','good','bad');
    voleyScoreEl.textContent = 'Remates: 0/'+VOLEY_ROUNDS+' · Puntos: 0';
    voleyHintEl.textContent = 'Tocá del otro lado de la red para rematar';
    resetVoleyShot();
    voleyState = 'aiming';
    voleyLastTs = null;
    requestAnimationFrame(voleyLoop);
  }

  function resetVoleyShot(){
    voleyBall.x = SERVE_SPOT.x; voleyBall.y = SERVE_SPOT.y;
    voleyBlockerPos.x = BLOCKER_START.x; voleyBlockerPos.y = BLOCKER_START.y;
    voleyBlockerTarget.x = BLOCKER_START.x; voleyBlockerTarget.y = BLOCKER_START.y;
    voleyBlockerRot = 0;
    voleyShotTarget = null;
    voleyAnimT = 0;
  }

  function voleyClampAim(p){
    return {
      x: Math.max(COURT.left+COURT_MARGIN, Math.min(COURT.right-COURT_MARGIN, p.x)),
      y: Math.max(COURT.top+COURT_MARGIN, Math.min(COURT.bottom-COURT_MARGIN, p.y))
    };
  }

  voleyCanvas.addEventListener('pointermove', function(e){
    if (voleyState !== 'aiming') return;
    voleyAimPreview = voleyClampAim(miniCanvasPoint(voleyCanvas, e));
  });
  voleyCanvas.addEventListener('pointerleave', function(){ voleyAimPreview = null; });
  voleyCanvas.addEventListener('pointerdown', function(e){
    if (voleyState !== 'aiming') return;
    takeVoleyShot(voleyClampAim(miniCanvasPoint(voleyCanvas, e)));
  });

  function takeVoleyShot(target){
    voleyShotTarget = target;
    var cx = (COURT.left+COURT.right)/2, cy = (COURT.top+COURT.bottom)/2;
    var halfW = (COURT.right-COURT.left)/2 - COURT_MARGIN, halfH = (COURT.bottom-COURT.top)/2 - COURT_MARGIN;
    var nx = (target.x-cx)/halfW, ny = (target.y-cy)/halfH;
    var d = Math.sqrt(nx*nx + ny*ny);
    var blockChance = clamp01(0.7 - d*0.5 + voleyRound*0.02);
    var isBlocked = Math.random() < blockChance;
    voleyOutcome = isBlocked ? 'blocked' : 'point';
    if (isBlocked){
      voleyBlockerTarget.x = target.x;
      voleyBlockerTarget.y = target.y;
    } else {
      var altAngle = Math.random()*Math.PI*2;
      var missDist = 60+Math.random()*35;
      var altX = cx + Math.cos(altAngle)*missDist;
      var altY = cy + Math.sin(altAngle)*missDist*0.6;
      if (Math.hypot(altX-target.x, altY-target.y) < 55){
        altX = cx - (target.x-cx);
        altY = cy - (target.y-cy);
      }
      voleyBlockerTarget.x = Math.max(COURT.left-10, Math.min(COURT.right+10, altX));
      voleyBlockerTarget.y = Math.max(COURT.top-6, Math.min(COURT.bottom+10, altY));
    }
    voleyState = 'anim';
    voleyAnimT = 0;
    voleyLastTs = null;
  }

  function resolveVoleyShot(){
    voleyState = 'result';
    voleyRound += 1;
    if (voleyOutcome === 'point'){
      voleyPoints += 1;
      beep(900, 0.1, 'triangle');
      setTimeout(function(){ beep(1200, 0.14, 'triangle'); }, 90);
      voleyHintEl.textContent = '¡PUNTO! 🏐';
      voleyResultEl.textContent = '¡PUNTO!';
      voleyResultEl.className = 'sport-result show good';
    } else {
      beep(190, 0.16, 'sawtooth');
      voleyHintEl.textContent = 'El gato bloqueó el remate';
      voleyResultEl.textContent = '¡BLOQUEADO!';
      voleyResultEl.className = 'sport-result show bad';
    }
    voleyScoreEl.textContent = 'Remates: '+voleyRound+'/'+VOLEY_ROUNDS+' · Puntos: '+voleyPoints;
    voleyResultTimer = setTimeout(function(){
      voleyResultEl.classList.add('is-hidden');
      voleyResultEl.classList.remove('show');
      if (voleyRound >= VOLEY_ROUNDS){
        finishVoley();
      } else {
        resetVoleyShot();
        voleyState = 'aiming';
        voleyHintEl.textContent = 'Tocá del otro lado de la red para rematar';
      }
    }, 1100);
  }

  function finishVoley(){
    voleyState = 'done';
    var gain = voleyPoints*8;
    felicidad = clamp100(felicidad + gain);
    energia = clamp100(energia - 8);
    updateStatBars();
    voleyHintEl.textContent = 'Ganaste '+voleyPoints+' de '+VOLEY_ROUNDS+' puntos. +'+gain+' felicidad';
    saveProgress();
  }

  voleyCloseBtn.addEventListener('click', function(){
    if (voleyResultTimer){ clearTimeout(voleyResultTimer); voleyResultTimer = null; }
    voleyState = 'idle';
    closeAllRooms();
    openRoom(jugarMenuOverlay, 'jugar');
  });

  function drawVoleyball(x,y){
    var c = voleyCtx;
    c.save();
    c.translate(x,y);
    c.fillStyle = '#f5f5f0';
    c.beginPath(); c.arc(0,0,8,0,Math.PI*2); c.fill();
    c.fillStyle = '#3fa9d9';
    c.beginPath(); c.arc(0,0,8,-0.5,0.9); c.lineTo(0,0); c.closePath(); c.fill();
    c.fillStyle = '#ffd23f';
    c.beginPath(); c.arc(0,0,8,2.1,3.3); c.lineTo(0,0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,30,30,0.5)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(0,0,8,0,Math.PI*2); c.stroke();
    c.restore();
  }

  function drawVoley(ts){
    var c = voleyCtx;
    c.clearRect(0,0,MINI_W,MINI_H);

    var skyGrad = c.createLinearGradient(0,0,0,NET_Y);
    skyGrad.addColorStop(0, '#ffcf7a');
    skyGrad.addColorStop(1, '#7fd6e8');
    c.fillStyle = skyGrad;
    c.fillRect(0,0,MINI_W,NET_Y);

    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.arc(48,26,14,0,Math.PI*2); c.fill();

    var sandGrad = c.createLinearGradient(0,NET_Y,0,MINI_H);
    sandGrad.addColorStop(0, '#e8c27a');
    sandGrad.addColorStop(1, '#c99a52');
    c.fillStyle = sandGrad;
    c.fillRect(0,NET_Y,MINI_W,MINI_H-NET_Y);

    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = 2;
    c.strokeRect(COURT.left, COURT.top, COURT.right-COURT.left, COURT.bottom-COURT.top);

    c.fillStyle = '#f5f5f5';
    c.fillRect(14, NET_Y-46, 4, 62);
    c.fillRect(MINI_W-18, NET_Y-46, 4, 62);
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = 1;
    c.beginPath();
    for (var nx=18; nx<=MINI_W-18; nx+=10){ c.moveTo(nx, NET_Y-16); c.lineTo(nx, NET_Y+16); }
    for (var ny=NET_Y-16; ny<=NET_Y+16; ny+=8){ c.moveTo(18, ny); c.lineTo(MINI_W-18, ny); }
    c.stroke();
    c.restore();
    c.fillStyle = '#ffffff';
    c.fillRect(14, NET_Y-18, MINI_W-28, 6);

    if (voleyState === 'aiming'){
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.4)';
      c.setLineDash([4,4]);
      c.strokeRect(COURT.left+COURT_MARGIN, COURT.top+COURT_MARGIN, (COURT.right-COURT.left)-COURT_MARGIN*2, (COURT.bottom-COURT.top)-COURT_MARGIN*2);
      c.restore();
      if (voleyAimPreview){
        var p = voleyAimPreview;
        c.save();
        c.strokeStyle = 'rgba(255,255,255,0.9)';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(p.x,p.y,7,0,Math.PI*2); c.stroke();
        c.beginPath();
        c.moveTo(p.x-10,p.y); c.lineTo(p.x-4,p.y);
        c.moveTo(p.x+4,p.y); c.lineTo(p.x+10,p.y);
        c.moveTo(p.x,p.y-10); c.lineTo(p.x,p.y-4);
        c.moveTo(p.x,p.y+4); c.lineTo(p.x,p.y+10);
        c.stroke();
        c.restore();
      }
    }

    var mood = voleyState==='result' ? (voleyOutcome==='blocked' ? 'happy' : 'sad') : 'neutral';
    var variant = VARIANTS_BY_ID[adopted] || VARIANTS[0];
    var prevCtx = ctx;
    ctx = voleyCtx;
    drawCat(voleyBlockerPos.x, voleyBlockerPos.y, 0.42, variant, mood, 0, (ts||0)/1000, voleyBlockerRot);
    ctx = prevCtx;

    if (voleyState === 'anim' || voleyState === 'result' || voleyState === 'done'){
      drawVoleyball(voleyBall.x, voleyBall.y);
    } else {
      drawVoleyball(SERVE_SPOT.x, SERVE_SPOT.y);
    }
  }

  function voleyLoop(ts){
    if (roomOpen !== 'voley'){ voleyLastTs = null; return; }
    if (voleyLastTs === null) voleyLastTs = ts;
    var dt = Math.min(0.05, (ts-voleyLastTs)/1000);
    voleyLastTs = ts;

    if (voleyState === 'anim'){
      voleyAnimT = Math.min(1, voleyAnimT + dt/voleyAnimDur);
      var ease = 1-Math.pow(1-voleyAnimT, 2);
      voleyBall.x = SERVE_SPOT.x + (voleyShotTarget.x-SERVE_SPOT.x)*ease;
      voleyBall.y = SERVE_SPOT.y + (voleyShotTarget.y-SERVE_SPOT.y)*ease;

      var diveE = Math.min(1, voleyAnimT/0.75);
      var diveEase = 1-Math.pow(1-diveE, 3);
      voleyBlockerPos.x = BLOCKER_START.x + (voleyBlockerTarget.x-BLOCKER_START.x)*diveEase;
      voleyBlockerPos.y = BLOCKER_START.y + (voleyBlockerTarget.y-BLOCKER_START.y)*diveEase;
      var dirSign = voleyBlockerTarget.x >= BLOCKER_START.x ? 1 : -1;
      voleyBlockerRot = dirSign*diveEase*(Math.PI/2.4);

      if (voleyAnimT >= 1) resolveVoleyShot();
    }

    drawVoley(ts);
    requestAnimationFrame(voleyLoop);
  }

  // ---------- Sala: Mimos ----------
  mimosArea.addEventListener('click', function(e){
    felicidad = clamp100(felicidad + 5);
    updateStatBars();
    beep(1000+Math.random()*200, 0.06, 'sine');
    var heart = document.createElement('div');
    heart.className = 'heart-pop';
    heart.textContent = '💗';
    heart.style.left = (50 + (Math.random()*40-20)) + '%';
    heart.style.top = '30%';
    mimosOverlay.appendChild(heart);
    setTimeout(function(){ if (heart.parentNode) heart.parentNode.removeChild(heart); }, 820);
    saveProgress();
  });

  // ---------- Navegacion del portal ----------
  playGatoBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    gatoView.classList.remove('is-hidden');
    applyOfflineDecay();
    saveProgress();
    if (adopted){
      updateStatBars();
      showHomeView();
    } else {
      showAdoptView();
    }
  });
  backFromGatoBtn.addEventListener('click', function(){
    gatoView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseHomeLoop();
    lastActive = Date.now();
    saveProgress();
  });

  loadProgress();
  buildAdoptGrid();
  if (adopted){
    adoptView.classList.add('is-hidden');
    homeView.classList.remove('is-hidden');
    updateStatBars();
  }
})();
