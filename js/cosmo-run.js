(function(){
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var portalView = document.getElementById('portalView');
  var cosmoView = document.getElementById('cosmoView');
  var playCosmoRunBtn = document.getElementById('playCosmoRunBtn');
  var backFromCosmoBtn = document.getElementById('backFromCosmoBtn');

  function cosmoActive(){ return !cosmoView.classList.contains('is-hidden'); }

  playCosmoRunBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    cosmoView.classList.remove('is-hidden');
    startCosmoLoop();
  });
  backFromCosmoBtn.addEventListener('click', function(){
    cosmoView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseCosmoLoop();
  });

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var LOGICAL_W = 920, LOGICAL_H = 440;

  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  var GROUND_Y = LOGICAL_H - 90;

  var scoreEl = document.getElementById('scoreVal');
  var bestEl = document.getElementById('bestVal');
  var finalScoreEl = document.getElementById('finalScore');
  var finalBestEl = document.getElementById('finalBest');
  var overTitleEl = document.getElementById('overTitle');
  var livesBox = document.getElementById('livesBox');
  var startOverlay = document.getElementById('startOverlay');
  var overOverlay = document.getElementById('overOverlay');
  var startBtn = document.getElementById('startBtn');
  var retryBtn = document.getElementById('retryBtn');
  var btnJump = document.getElementById('btnJump');
  var btnDuck = document.getElementById('btnDuck');
  var muteBtn = document.getElementById('muteBtn');
  var catBtn = document.getElementById('catBtn');

  var BEST_KEY = 'cosmoRunBest';
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch(e){ best = 0; }
  bestEl.textContent = best;

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
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
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

  function meow(){
    if (muted || !audioCtx) return;
    var t0 = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t0);
    osc.frequency.linearRampToValueAtTime(880, t0+0.09);
    osc.frequency.linearRampToValueAtTime(660, t0+0.2);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0+0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0+0.24);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0+0.26);
  }

  var CAT_MESSAGES = [
    '¡Si ganás me dan atún!!',
    '¡Vamos Cosmo, vos podés!',
    '¡Un salto más y sos el mejor!',
    '¡Miau! ¡Seguí así!',
    '¡Cuidado con los cristales!',
    '¡Casi llegamos a la Luna!',
    '¡Los gatos del espacio te bancan!',
    '¡Ese salto fue perfecto!',
    '¡No te choques, campeón!',
    '¡Agachate rápido, ahí viene un dron!'
  ];

  var flyingCats = [];
  function spawnCat(){
    ensureAudio();
    meow();
    var goingRight = Math.random() < 0.5;
    flyingCats.push({
      x: goingRight ? -70 : LOGICAL_W + 70,
      y: 40 + Math.random()*70,
      dir: goingRight ? 1 : -1,
      speed: 220 + Math.random()*90,
      bobPhase: Math.random()*Math.PI*2,
      msg: CAT_MESSAGES[Math.floor(Math.random()*CAT_MESSAGES.length)]
    });
    catAutoTimer = 12 + Math.random()*14;
  }
  catBtn.addEventListener('click', spawnCat);

  var catAutoTimer = 7 + Math.random()*6;
  function updateCatAutoSpawn(dt){
    catAutoTimer -= dt;
    if (catAutoTimer <= 0) spawnCat();
  }

  function updateCats(dt, t){
    for (var i=flyingCats.length-1;i>=0;i--){
      var c = flyingCats[i];
      c.x += c.speed*dt*c.dir;
      if (c.x < -90 || c.x > LOGICAL_W+90){
        flyingCats.splice(i,1);
      }
    }
  }

  function drawCat(c, t){
    var bob = reducedMotion ? 0 : Math.sin(t*3 + c.bobPhase)*10;
    var flap = reducedMotion ? 0.15 : Math.abs(Math.sin(t*11 + c.bobPhase));
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    if (c.dir < 0) ctx.scale(-1,1);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.quadraticCurveTo(-30, -14 - flap*22, -46, -2 - flap*6);
    ctx.quadraticCurveTo(-24, 6, -4, 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.quadraticCurveTo(30, -14 - flap*22, 46, -2 - flap*6);
    ctx.quadraticCurveTo(24, 6, 4, 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.quadraticCurveTo(-20, 16 + Math.sin(t*6+c.bobPhase)*4, -14, 24);
    ctx.stroke();

    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.ellipse(0, 8, 13, 10, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -8, 13, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-11, -16); ctx.lineTo(-15, -27); ctx.lineTo(-3, -18); ctx.closePath();
    ctx.moveTo(11, -16); ctx.lineTo(15, -27); ctx.lineTo(3, -18); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff8fc0';
    ctx.beginPath();
    ctx.moveTo(-10, -17); ctx.lineTo(-12.5, -23); ctx.lineTo(-6, -18.5); ctx.closePath();
    ctx.moveTo(10, -17); ctx.lineTo(12.5, -23); ctx.lineTo(6, -18.5); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#241a3d';
    ctx.beginPath();
    ctx.arc(-4.5, -8, 1.6, 0, Math.PI*2);
    ctx.arc(4.5, -8, 1.6, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ff8fc0';
    ctx.beginPath();
    ctx.arc(0, -5, 1.6, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,20,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-13,-9); ctx.lineTo(-22,-11);
    ctx.moveTo(-13,-6); ctx.lineTo(-22,-4);
    ctx.moveTo(13,-9); ctx.lineTo(22,-11);
    ctx.moveTo(13,-6); ctx.lineTo(22,-4);
    ctx.stroke();

    ctx.restore();

    if (c.msg) drawSpeechBubble(c.x, c.y+bob, c.msg);
  }

  function drawSpeechBubble(x, y, text){
    ctx.font = '13px ui-rounded, "Segoe UI", sans-serif';
    var paddingX = 9;
    var textW = ctx.measureText(text).width;
    var boxW = textW + paddingX*2;
    var boxH = 22;
    var bx = Math.max(4, Math.min(LOGICAL_W-boxW-4, x-boxW/2));
    var by = y-boxH-35;

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(bx, by, boxW, boxH, 9);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x-6, by+boxH);
    ctx.lineTo(x+6, by+boxH);
    ctx.lineTo(x, by+boxH+7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#241a3d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx+paddingX, by+boxH/2+1);
  }

  var stars = [];
  for (var i=0;i<70;i++){
    stars.push({
      x: Math.random()*LOGICAL_W,
      y: Math.random()*(GROUND_Y-40),
      r: Math.random()*1.6+0.4,
      phase: Math.random()*Math.PI*2,
      speed: 0.15 + Math.random()*0.3
    });
  }

  var mountainsFar = [];
  var mx = -40;
  while (mx < LOGICAL_W + 120){
    var w = 120 + Math.random()*100;
    mountainsFar.push({x:mx, w:w, h: 60+Math.random()*50});
    mx += w*0.7;
  }
  var mountainsNear = [];
  mx = -60;
  while (mx < LOGICAL_W + 160){
    var w2 = 140 + Math.random()*120;
    mountainsNear.push({x:mx, w:w2, h: 40+Math.random()*70});
    mx += w2*0.65;
  }

  var STATE_START = 'start', STATE_PLAY = 'play', STATE_OVER = 'over';
  var state = STATE_START;

  var GRAVITY = 2300;
  var JUMP_V = -760;
  var STAND_H = 62, STAND_W = 40;
  var DUCK_H = 38, DUCK_W = 46;
  var PLAYER_X = 130;

  var player, obstacles, distance, speed, spawnTimer, nextSpawnIn, invuln, shake;

  function resetGame(){
    player = {
      y: GROUND_Y - STAND_H,
      vy: 0,
      onGround: true,
      ducking: false,
      w: STAND_W,
      h: STAND_H,
      legPhase: 0
    };
    obstacles = [];
    distance = 0;
    speed = 300;
    spawnTimer = 0;
    nextSpawnIn = 1.4;
    invuln = 0;
    shake = 0;
    lives = 3;
    renderLives();
    scoreEl.textContent = '0';
  }

  var lives = 3;
  function renderLives(){
    livesBox.innerHTML = '';
    for (var i=0;i<3;i++){
      var span = document.createElement('span');
      span.className = 'life-icon';
      span.textContent = i < lives ? '🚀' : '💨';
      span.style.opacity = i < lives ? '1' : '0.35';
      span.style.fontSize = '18px';
      livesBox.appendChild(span);
    }
  }

  function startGame(){
    ensureAudio();
    resetGame();
    state = STATE_PLAY;
    startOverlay.classList.add('is-hidden');
    overOverlay.classList.add('is-hidden');
  }

  function endGame(){
    state = STATE_OVER;
    var meters = Math.floor(distance/10);
    var isNewBest = meters > best && meters > 0;
    if (isNewBest){
      best = meters;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch(e){}
    }
    bestEl.textContent = best;
    finalScoreEl.textContent = meters + ' m';
    finalBestEl.textContent = best + ' m';
    overTitleEl.textContent = isNewBest ? '¡Nueva mejor marca!' : '¡Choque!';
    overOverlay.classList.remove('is-hidden');
    beep(120, 0.4, 'sawtooth');
  }

  function doJump(){
    if (state !== STATE_PLAY) return;
    if (player.onGround && !player.ducking){
      player.vy = JUMP_V;
      player.onGround = false;
      beep(520, 0.12, 'square');
    }
  }
  function setDuck(on){
    if (state !== STATE_PLAY) return;
    if (player.onGround) player.ducking = on;
  }

  window.addEventListener('keydown', function(e){
    if (!cosmoActive()) return;
    if (e.code === 'ArrowUp' || e.code === 'Space'){
      e.preventDefault();
      if (state === STATE_START) startGame();
      else if (state === STATE_OVER) startGame();
      else doJump();
    } else if (e.code === 'ArrowDown'){
      e.preventDefault();
      setDuck(true);
    }
  });
  window.addEventListener('keyup', function(e){
    if (!cosmoActive()) return;
    if (e.code === 'ArrowDown'){
      setDuck(false);
    }
  });

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);

  function pressJump(e){ e.preventDefault(); if (state !== STATE_PLAY) startGame(); else doJump(); }
  btnJump.addEventListener('pointerdown', pressJump);
  btnDuck.addEventListener('pointerdown', function(e){ e.preventDefault(); setDuck(true); });
  btnDuck.addEventListener('pointerup', function(e){ setDuck(false); });
  btnDuck.addEventListener('pointerleave', function(e){ setDuck(false); });
  canvas.addEventListener('pointerdown', function(e){
    if (state !== STATE_PLAY){ startGame(); return; }
    doJump();
  });

  function spawnObstacle(){
    var kind = Math.random() < 0.6 ? 'rock' : 'drone';
    if (kind === 'rock'){
      var size = 34 + Math.random()*22;
      obstacles.push({
        kind:'rock',
        x: LOGICAL_W + size,
        w: size,
        h: size*0.9,
        y: GROUND_Y - size*0.9
      });
    } else {
      var h = 30;
      obstacles.push({
        kind:'drone',
        x: LOGICAL_W + 50,
        w: 50,
        h: h,
        y: GROUND_Y - STAND_H - 6,
        bob: Math.random()*Math.PI*2
      });
    }
  }

  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function update(dt){
    if (state !== STATE_PLAY){
      return;
    }

    speed = 300 + Math.min(280, distance*0.045);
    distance += speed*dt;
    scoreEl.textContent = Math.floor(distance/10);

    player.legPhase += dt*(player.onGround ? speed*0.02 : 0);

    if (!player.onGround){
      player.vy += GRAVITY*dt;
      player.y += player.vy*dt;
      if (player.y >= GROUND_Y - STAND_H){
        player.y = GROUND_Y - STAND_H;
        player.vy = 0;
        player.onGround = true;
      }
    }
    player.h = player.ducking && player.onGround ? DUCK_H : STAND_H;
    player.w = player.ducking && player.onGround ? DUCK_W : STAND_W;
    if (player.onGround) player.y = GROUND_Y - player.h;

    if (invuln > 0) invuln -= dt;
    if (shake > 0) shake -= dt;

    spawnTimer += dt;
    if (spawnTimer >= nextSpawnIn){
      spawnTimer = 0;
      var minGap = Math.max(0.68, 1.4 - distance*0.0006);
      var maxGap = Math.max(minGap+0.3, 2.2 - distance*0.0007);
      nextSpawnIn = minGap + Math.random()*(maxGap-minGap);
      spawnObstacle();
    }

    for (var i=obstacles.length-1;i>=0;i--){
      var o = obstacles[i];
      o.x -= speed*dt;
      if (o.kind === 'drone') o.bob += dt*4;
      if (o.x + o.w < -20){
        obstacles.splice(i,1);
        continue;
      }
      if (invuln <= 0){
        var pBox = {x: PLAYER_X+6, y: player.y+4, w: player.w-12, h: player.h-8};
        var oBox = {x:o.x, y:o.y, w:o.w, h:o.h};
        if (rectsOverlap(pBox, oBox)){
          obstacles.splice(i,1);
          lives -= 1;
          renderLives();
          invuln = 1.4;
          shake = 0.3;
          beep(180, 0.18, 'sawtooth');
          if (lives <= 0){
            endGame();
          }
        }
      }
    }
  }

  function drawBackground(t){
    var grad = ctx.createLinearGradient(0,0,0,GROUND_Y);
    grad.addColorStop(0, '#1b1340');
    grad.addColorStop(0.55, '#3a2166');
    grad.addColorStop(1, '#7a3f8f');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,LOGICAL_W,GROUND_Y);

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,111,174,0.35)';
    ctx.ellipse(LOGICAL_W*0.5, GROUND_Y, LOGICAL_W*0.6, 40, 0, Math.PI, 0, true);
    ctx.fill();

    ctx.fillStyle = '#efe6ff';
    stars.forEach(function(s){
      var tw = reducedMotion ? 0.8 : (0.55 + 0.45*Math.sin(t*s.speed*3 + s.phase));
      ctx.globalAlpha = tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.fillStyle = '#f4e9ff';
    ctx.arc(LOGICAL_W-90, 70, 26, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,70,150,0.5)';
    ctx.beginPath(); ctx.arc(LOGICAL_W-100, 62, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(LOGICAL_W-82, 78, 3.5, 0, Math.PI*2); ctx.fill();

    var scrollFar = (state===STATE_PLAY ? distance*0.02 : t*6) % 400;
    ctx.fillStyle = '#2a1d47';
    mountainsFar.forEach(function(m){
      drawMountain(m.x - scrollFar, m.w, m.h);
      drawMountain(m.x - scrollFar + 900, m.w, m.h);
    });

    var scrollNear = (state===STATE_PLAY ? distance*0.06 : t*14) % 500;
    ctx.fillStyle = '#241a3d';
    mountainsNear.forEach(function(m){
      drawMountain(m.x - scrollNear, m.w, m.h);
      drawMountain(m.x - scrollNear + 1000, m.w, m.h);
    });
  }

  function drawMountain(x,w,h){
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x+w*0.5, GROUND_Y-h);
    ctx.lineTo(x+w, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  function drawGround(t){
    ctx.fillStyle = '#2a1d47';
    ctx.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H-GROUND_Y);
    ctx.fillStyle = '#3a2a5e';
    ctx.fillRect(0, GROUND_Y, LOGICAL_W, 10);

    var scroll = (state===STATE_PLAY ? distance : t*300) % 60;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for (var x = -scroll; x < LOGICAL_W; x += 60){
      ctx.beginPath();
      ctx.arc(x, GROUND_Y+30, 10, 0, Math.PI);
      ctx.stroke();
    }
  }

  function drawPlayer(t){
    var blink = invuln > 0 && Math.floor(t*16)%2===0;
    if (blink) return;
    var x = PLAYER_X, y = player.y, w = player.w, h = player.h;
    var duck = player.ducking && player.onGround;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(w/2, GROUND_Y - y + 4, w*0.55, 6, 0, 0, Math.PI*2);
    ctx.fill();

    if (!duck){
      var legSwing = player.onGround ? Math.sin(player.legPhase)*10 : 0;
      ctx.strokeStyle = '#d85a2c';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w*0.35, h*0.68); ctx.lineTo(w*0.35+legSwing*0.4, h+2);
      ctx.moveTo(w*0.65, h*0.68); ctx.lineTo(w*0.65-legSwing*0.4, h+2);
      ctx.stroke();

      ctx.fillStyle = '#ff7a45';
      roundRect(w*0.14, h*0.28, w*0.72, h*0.5, 12);
      ctx.fill();

      ctx.strokeStyle = '#ff9a6a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      var armSwing = player.onGround ? Math.sin(player.legPhase+Math.PI)*8 : -4;
      ctx.moveTo(w*0.16, h*0.42); ctx.lineTo(w*0.16-6, h*0.42+armSwing);
      ctx.moveTo(w*0.84, h*0.42); ctx.lineTo(w*0.84+6, h*0.42-armSwing);
      ctx.stroke();

      ctx.fillStyle = '#fbf7ff';
      ctx.beginPath();
      ctx.arc(w*0.5, h*0.2, w*0.34, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#3fddc4';
      ctx.beginPath();
      ctx.ellipse(w*0.58, h*0.19, w*0.16, w*0.13, 0, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ff7a45';
      roundRect(0, h*0.3, w, h*0.7, 14);
      ctx.fill();
      ctx.fillStyle = '#fbf7ff';
      ctx.beginPath();
      ctx.arc(w*0.28, h*0.34, h*0.32, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#3fddc4';
      ctx.beginPath();
      ctx.ellipse(w*0.4, h*0.34, h*0.15, h*0.12, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function drawObstacles(t){
    obstacles.forEach(function(o){
      if (o.kind === 'rock'){
        ctx.fillStyle = '#3fddc4';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y+o.h);
        ctx.lineTo(o.x+o.w*0.25, o.y+o.h*0.2);
        ctx.lineTo(o.x+o.w*0.55, o.y);
        ctx.lineTo(o.x+o.w*0.85, o.y+o.h*0.3);
        ctx.lineTo(o.x+o.w, o.y+o.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(o.x+o.w*0.55, o.y);
        ctx.lineTo(o.x+o.w*0.65, o.y+o.h*0.35);
        ctx.lineTo(o.x+o.w*0.45, o.y+o.h*0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        var bobY = o.y + Math.sin(o.bob)*5;
        ctx.fillStyle = '#ff4fa3';
        ctx.beginPath();
        ctx.ellipse(o.x+o.w/2, bobY+o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffe1f0';
        ctx.beginPath();
        ctx.ellipse(o.x+o.w/2, bobY+o.h*0.35, o.w*0.28, o.h*0.3, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,79,163,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(o.x+2, bobY+o.h*0.15); ctx.lineTo(o.x-6, bobY-4);
        ctx.moveTo(o.x+o.w-2, bobY+o.h*0.15); ctx.lineTo(o.x+o.w+6, bobY-4);
        ctx.stroke();
      }
    });
  }

  var lastTime = null;
  var cosmoLoopRunning = false;

  function startCosmoLoop(){
    if (cosmoLoopRunning) return;
    cosmoLoopRunning = true;
    lastTime = null;
    requestAnimationFrame(loop);
  }
  function pauseCosmoLoop(){
    cosmoLoopRunning = false;
  }

  function loop(ts){
    if (!cosmoLoopRunning) return;
    if (lastTime === null) lastTime = ts;
    var dt = Math.min(0.033, (ts-lastTime)/1000);
    lastTime = ts;
    var t = ts/1000;

    update(dt);
    updateCats(dt, t);
    updateCatAutoSpawn(dt);

    ctx.save();
    if (shake > 0 && !reducedMotion){
      ctx.translate((Math.random()-0.5)*6*shake*3, (Math.random()-0.5)*6*shake*3);
    }
    drawBackground(t);
    drawGround(t);
    drawObstacles(t);
    drawPlayer(t);
    ctx.restore();

    flyingCats.forEach(function(c){ drawCat(c, t); });

    requestAnimationFrame(loop);
  }

  resetGame();
})();

