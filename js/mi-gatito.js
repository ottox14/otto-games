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

  var SPORTS = {
    futbol:  {title:'⚽ Fútbol',  hint:'¡Tocá "¡Ya!" cuando la barra esté en la zona verde!', zoneWidth:0.32, speed:0.55},
    basquet: {title:'🏀 Básquet', hint:'¡La zona es más chica, apuntá bien!', zoneWidth:0.20, speed:0.65},
    voley:   {title:'🏐 Vóley',   hint:'¡Devolvé la pelota en el momento justo!', zoneWidth:0.24, speed:0.8}
  };

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

  var miniGameOverlay = document.getElementById('miniGameOverlay');
  var miniGameTitleEl = document.getElementById('miniGameTitle');
  var miniGameHintEl = document.getElementById('miniGameHint');
  var timingZoneEl = document.getElementById('timingZone');
  var timingMarkerEl = document.getElementById('timingMarker');
  var timingActionBtn = document.getElementById('timingActionBtn');
  var miniGameScoreEl = document.getElementById('miniGameScore');
  var miniGameCloseBtn = document.getElementById('miniGameCloseBtn');

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
  function drawCat(cx, cy, scale, variant, mood, bob, t){
    ctx.save();
    ctx.translate(cx, cy+(bob||0));
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
  var allRoomOverlays = [comerOverlay, banarOverlay, dormirOverlay, jugarMenuOverlay, miniGameOverlay, mimosOverlay];
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

  // ---------- Sala: Jugar (menu + mini-juego compartido) ----------
  var currentSport = null;
  var miniGameState = 'idle';
  var markerPos = 0;
  var attempts = 0, hits = 0;
  var miniGameTime = 0;

  function launchSport(id){
    currentSport = SPORTS[id];
    closeAllRooms();
    miniGameOverlay.classList.remove('is-hidden');
    roomOpen = 'minigame';
    miniGameTitleEl.textContent = currentSport.title;
    miniGameHintEl.textContent = currentSport.hint;
    timingZoneEl.style.left = ((0.5-currentSport.zoneWidth/2)*100)+'%';
    timingZoneEl.style.width = (currentSport.zoneWidth*100)+'%';
    attempts = 0; hits = 0; miniGameTime = 0;
    miniGameState = 'playing';
    timingActionBtn.textContent = '¡Ya!';
    miniGameScoreEl.textContent = 'Aciertos: 0/5';
    requestAnimationFrame(miniGameLoop);
  }
  selectFutbolBtn.addEventListener('click', function(){ launchSport('futbol'); });
  selectBasquetBtn.addEventListener('click', function(){ launchSport('basquet'); });
  selectVoleyBtn.addEventListener('click', function(){ launchSport('voley'); });

  var miniGameLastTs = null;
  function miniGameLoop(ts){
    if (roomOpen !== 'minigame' || miniGameState !== 'playing') return;
    if (miniGameLastTs===null) miniGameLastTs = ts;
    var dt = Math.min(0.05, (ts-miniGameLastTs)/1000);
    miniGameLastTs = ts;
    miniGameTime += dt;
    markerPos = Math.abs(((miniGameTime*currentSport.speed) % 2) - 1);
    timingMarkerEl.style.left = (markerPos*100)+'%';
    requestAnimationFrame(miniGameLoop);
  }

  timingActionBtn.addEventListener('click', function(){
    if (miniGameState !== 'playing') {
      closeAllRooms();
      openRoom(jugarMenuOverlay, 'jugar');
      return;
    }
    var half = currentSport.zoneWidth/2;
    var isHit = markerPos >= (0.5-half) && markerPos <= (0.5+half);
    attempts += 1;
    if (isHit){
      hits += 1;
      beep(900, 0.1, 'triangle');
    } else {
      beep(200, 0.12, 'sawtooth');
    }
    miniGameScoreEl.textContent = 'Aciertos: '+hits+'/5';
    if (attempts >= 5){
      finishMiniGame();
    }
  });

  function finishMiniGame(){
    miniGameState = 'done';
    var gain = hits*8;
    felicidad = clamp100(felicidad + gain);
    energia = clamp100(energia - 8);
    updateStatBars();
    miniGameHintEl.textContent = '¡Convertiste '+hits+' de 5! +'+gain+' felicidad';
    timingActionBtn.textContent = 'Volver';
    saveProgress();
    miniGameLastTs = null;
  }

  miniGameCloseBtn.addEventListener('click', function(){
    miniGameState = 'idle';
    closeAllRooms();
    openRoom(jugarMenuOverlay, 'jugar');
  });

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
