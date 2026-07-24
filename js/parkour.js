// Parkour 2D: plataformas de precision inspiradas en Celeste (sin copiarlo).
// Motor de fisicas por tiles (caminar, saltar, deslizarse por paredes,
// salto de pared) mas 4 niveles tutorial. Nada de dash, doble salto,
// enemigos ni coleccionables todavia: la idea de esta primera version es
// probar que el movimiento se sienta preciso.
(function(){
  var TILE = 32;
  var CANVAS_W = 800, CANVAS_H = 450;

  // ---------- Constantes de fisica (ajustadas para que se sienta preciso) ----------
  var GRAVITY = 2200;
  var MAX_FALL = 700;
  var MOVE_ACCEL_GROUND = 3000;
  var MOVE_ACCEL_AIR = 2000;
  var MOVE_MAX_SPEED = 220;
  var GROUND_FRICTION = 3200;
  var AIR_FRICTION = 900;
  var JUMP_VELOCITY = -640;
  var JUMP_CUT_MULT = 0.45;
  var COYOTE_TIME = 0.09;
  var JUMP_BUFFER = 0.12;
  var WALL_SLIDE_MAX_FALL = 90;
  var WALL_JUMP_VX = 260;
  var WALL_JUMP_VY = -600;
  var WALL_JUMP_LOCK = 0.13;
  var PLAYER_W = 20, PLAYER_H = 28;
  var LAVA_RISE_SPEED = 30; // px/s

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- DOM ----------
  var portalView = document.getElementById('portalView');
  var parkourView = document.getElementById('parkourView');
  var playParkourBtn = document.getElementById('playParkourBtn');
  var backFromParkourBtn = document.getElementById('backFromParkourBtn');
  var muteBtn = document.getElementById('parkourMuteBtn');
  var levelValEl = document.getElementById('pkLevelVal');
  var levelNameEl = document.getElementById('pkLevelName');

  var startOverlay = document.getElementById('pkStartOverlay');
  var startTitleEl = document.getElementById('pkStartTitle');
  var startDescEl = document.getElementById('pkStartDesc');
  var startBtn = document.getElementById('pkStartBtn');
  var clearOverlay = document.getElementById('pkClearOverlay');
  var nextBtn = document.getElementById('pkNextBtn');
  var deathOverlay = document.getElementById('pkDeathOverlay');
  var deathTitleEl = document.getElementById('pkDeathTitle');
  var retryBtn = document.getElementById('pkRetryBtn');
  var tutorialDoneOverlay = document.getElementById('pkTutorialDoneOverlay');
  var tutorialRetryBtn = document.getElementById('pkTutorialRetryBtn');

  var canvas = document.getElementById('pkCanvas');
  var ctx = canvas.getContext('2d');
  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W*dpr;
    canvas.height = CANVAS_H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled = false;
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  function parkourActive(){ return !parkourView.classList.contains('is-hidden'); }

  // ---------- Audio ----------
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
    gain.gain.exponentialRampToValueAtTime(0.13, t0 + 0.012);
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

  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

  // ---------- Construccion de niveles (grilla de tiles solidos) ----------
  function makeGrid(cols, rows){
    var g = [];
    for (var r=0;r<rows;r++){ g.push(new Array(cols).fill(false)); }
    return g;
  }
  function fillRect(grid, c0, c1, r0, r1){
    for (var r=r0;r<=r1;r++){
      if (!grid[r]) continue;
      for (var c=c0;c<=c1;c++){ grid[r][c] = true; }
    }
  }

  function buildLevel1(){
    var cols = 42, rows = 14;
    var grid = makeGrid(cols, rows);
    fillRect(grid, 0,8, 13,13);
    fillRect(grid, 11,19, 13,13);
    fillRect(grid, 21,27, 13,13);
    fillRect(grid, 29,29, 12,12); // plataforma flotante sobre el hueco
    fillRect(grid, 31,41, 13,13);
    return {
      grid: grid, cols: cols, rows: rows, vertical: false,
      spawn: {x: 1*TILE+6, y: 10*TILE},
      goal: {x: 39*TILE, y: 12*TILE, w: TILE, h: TILE},
      title: 'Nivel 1', name: 'Caminar y saltar',
      desc: 'Movete con A/D y saltá con Espacio. Cruzá los huecos y llegá a la bandera.'
    };
  }
  function buildLevel2(){
    var cols = 41, rows = 14;
    var grid = makeGrid(cols, rows);
    fillRect(grid, 0,12, 13,13);
    fillRect(grid, 13,13, 9,13); // pared 1
    fillRect(grid, 14,25, 9,9);
    fillRect(grid, 26,26, 5,9); // pared 2
    fillRect(grid, 27,40, 5,5);
    return {
      grid: grid, cols: cols, rows: rows, vertical: false,
      spawn: {x: 1*TILE+6, y: 10*TILE},
      goal: {x: 38*TILE, y: 4*TILE, w: TILE, h: TILE},
      title: 'Nivel 2', name: 'Deslizamiento en paredes',
      desc: 'Saltá contra la pared para pegarte y deslizarte. Volvé a saltar para subir por encima.'
    };
  }
  function buildLevel3(){
    var cols = 43, rows = 14;
    var grid = makeGrid(cols, rows);
    fillRect(grid, 0,8, 13,13);
    fillRect(grid, 11,19, 13,13);
    fillRect(grid, 20,23, 11,11); // plataforma flotante, cubre todo el hueco
    fillRect(grid, 24,30, 13,13);
    fillRect(grid, 31,31, 9,13); // pared final
    fillRect(grid, 32,42, 9,9);
    return {
      grid: grid, cols: cols, rows: rows, vertical: false,
      spawn: {x: 1*TILE+6, y: 10*TILE},
      goal: {x: 40*TILE, y: 8*TILE, w: TILE, h: TILE},
      title: 'Nivel 3', name: 'Repaso: saltos + paredes',
      desc: 'Combiná todo lo aprendido: huecos, una plataforma y una pared para deslizarte.'
    };
  }
  function buildLevel4(){
    // Escalera casi recta: plataformas anchas que se superponen entre si
    // (apenas se desplazan de lado), cada 2 tiles de altura (dentro del
    // alcance comodo de un salto normal), asi el desafio real es la
    // velocidad para escalar contra la lava y no la puntaria horizontal.
    // Las paredes del pozo sirven de red de seguridad para saltos de
    // pared si se falla un salto.
    var cols = 10, rows = 50;
    var grid = makeGrid(cols, rows);
    fillRect(grid, 0,0, 0,rows-1);       // pared izquierda
    fillRect(grid, cols-1,cols-1, 0,rows-1); // pared derecha
    fillRect(grid, 1,cols-2, rows-1,rows-1); // piso inicial
    // Plataformas anchas con un solo desplazamiento lateral corto entre
    // una y otra (dejan una zona despejada del lado de llegada, para que
    // saltar desde ahi nunca choque contra el techo de la siguiente).
    var side = 0;
    for (var row = rows-3; row >= 3; row -= 2){
      if (side === 0) fillRect(grid, 1,5, row,row);
      else fillRect(grid, 4,8, row,row);
      side = 1-side;
    }
    fillRect(grid, 3,6, 2,2); // plataforma final bajo la meta
    return {
      // Arranca sobre la primer plataforma (no debajo de una mas alta),
      // para que el primer salto no choque contra ningun techo.
      grid: grid, cols: cols, rows: rows, vertical: true,
      spawn: {x: 3*TILE+6, y: (rows-3)*TILE},
      goal: {x: 4*TILE, y: 1*TILE, w: TILE, h: TILE},
      title: 'Nivel 4', name: 'La lava sube',
      desc: 'La lava sube desde abajo sin parar. Escalá rápido con plataformas y paredes: si te toca, perdés al instante.',
      lava: true
    };
  }
  var LEVELS = [buildLevel1, buildLevel2, buildLevel3, buildLevel4];

  // ---------- Estado ----------
  var level = null;
  var levelIndex = 0;
  var player = {x:0,y:0,vx:0,vy:0,onGround:false,facing:1,squash:0,walkT:0};
  var coyoteTimer = 0, jumpBufferTimer = 0;
  var touchWallSign = 0, isWallSliding = false;
  var wallJumpLockTimer = 0, wallJumpBlockedSign = 0;
  var camera = {x:0, y:0, letterboxX:0};
  var lavaTopY = 0;
  var gameState = 'idle'; // idle|play|clear|dead|tutorialDone
  var lastTs = null;

  function isSolidTile(col, row){
    if (col < 0 || col >= level.cols) return true;
    if (row < 0 || row >= level.rows) return false;
    return level.grid[row][col];
  }

  function resetPlayerState(){
    player.x = level.spawn.x; player.y = level.spawn.y;
    player.vx = 0; player.vy = 0; player.onGround = false; player.facing = 1;
    player.squash = 0; player.walkT = 0;
    coyoteTimer = 0; jumpBufferTimer = 0; touchWallSign = 0; isWallSliding = false;
    wallJumpLockTimer = 0; wallJumpBlockedSign = 0;
    lavaTopY = level.rows*TILE + 40;
  }

  function loadLevel(idx){
    levelIndex = idx;
    level = LEVELS[idx]();
    resetPlayerState();
    updateCamera();
    levelValEl.textContent = String(idx+1);
    levelNameEl.textContent = level.name;
    startTitleEl.textContent = level.title;
    startDescEl.textContent = level.desc;
    gameState = 'idle';
    startOverlay.classList.remove('is-hidden');
    clearOverlay.classList.add('is-hidden');
    deathOverlay.classList.add('is-hidden');
    tutorialDoneOverlay.classList.add('is-hidden');
    draw();
  }

  // ---------- Entrada ----------
  var keys = {left:false, right:false};
  var jumpHeld = false;
  var jumpPressedEdge = false;
  var jumpReleasedEdge = false;
  var KEY_LEFT = {KeyA:1, ArrowLeft:1};
  var KEY_RIGHT = {KeyD:1, ArrowRight:1};
  var KEY_JUMP = {Space:1, ArrowUp:1, KeyW:1};

  window.addEventListener('keydown', function(e){
    if (!parkourActive()) return;
    if (KEY_LEFT[e.code]){ keys.left = true; e.preventDefault(); }
    else if (KEY_RIGHT[e.code]){ keys.right = true; e.preventDefault(); }
    else if (KEY_JUMP[e.code]){
      if (!jumpHeld) jumpPressedEdge = true;
      jumpHeld = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', function(e){
    if (KEY_LEFT[e.code]) keys.left = false;
    else if (KEY_RIGHT[e.code]) keys.right = false;
    else if (KEY_JUMP[e.code]){
      if (jumpHeld) jumpReleasedEdge = true;
      jumpHeld = false;
    }
  });

  function bindJoystick(joyEl){
    var thumb = joyEl.querySelector('.joystick-thumb');
    var maxDist = 26;
    var pointerId = null;
    var activeDir = null;
    function setDir(dir){
      if (dir === activeDir) return;
      if (activeDir === 'left') keys.left = false;
      if (activeDir === 'right') keys.right = false;
      activeDir = dir;
      if (activeDir === 'left') keys.left = true;
      if (activeDir === 'right') keys.right = true;
    }
    function move(e){
      var rect = joyEl.getBoundingClientRect();
      var dx = e.clientX - (rect.left + rect.width/2);
      var dist = Math.min(Math.abs(dx), maxDist);
      thumb.style.transform = 'translate('+(dx<0?-dist:dist)+'px,0px)';
      setDir(Math.abs(dx) < maxDist*0.32 ? null : (dx < 0 ? 'left' : 'right'));
    }
    function end(e){
      if (pointerId===null || e.pointerId!==pointerId) return;
      pointerId = null;
      joyEl.classList.remove('dragging');
      thumb.style.transform = '';
      setDir(null);
    }
    joyEl.addEventListener('pointerdown', function(e){
      e.preventDefault();
      pointerId = e.pointerId;
      joyEl.setPointerCapture(pointerId);
      joyEl.classList.add('dragging');
      move(e);
    });
    joyEl.addEventListener('pointermove', function(e){
      if (pointerId===null || e.pointerId!==pointerId) return;
      move(e);
    });
    joyEl.addEventListener('pointerup', end);
    joyEl.addEventListener('pointercancel', end);
  }
  bindJoystick(document.getElementById('pkJoystick'));
  var jumpBtn = document.getElementById('pkJumpBtn');
  jumpBtn.addEventListener('pointerdown', function(e){
    e.preventDefault();
    if (!jumpHeld) jumpPressedEdge = true;
    jumpHeld = true;
  });
  jumpBtn.addEventListener('pointerup', function(){
    if (jumpHeld) jumpReleasedEdge = true;
    jumpHeld = false;
  });
  jumpBtn.addEventListener('pointercancel', function(){ jumpHeld = false; });

  // ---------- Colisiones ----------
  function resolveHorizontal(){
    touchWallSign = 0;
    if (player.vx === 0) return;
    var top = player.y, bottom = player.y+PLAYER_H-0.01;
    var r0 = Math.floor(top/TILE), r1 = Math.floor(bottom/TILE);
    if (player.vx > 0){
      var col = Math.floor((player.x+PLAYER_W)/TILE);
      for (var r=r0;r<=r1;r++){
        if (isSolidTile(col,r)){
          player.x = col*TILE - PLAYER_W;
          player.vx = 0;
          touchWallSign = 1;
          break;
        }
      }
    } else {
      var col2 = Math.floor(player.x/TILE);
      for (var r2=r0;r2<=r1;r2++){
        if (isSolidTile(col2,r2)){
          player.x = (col2+1)*TILE;
          player.vx = 0;
          touchWallSign = -1;
          break;
        }
      }
    }
  }
  function resolveVertical(){
    var left = player.x, right = player.x+PLAYER_W-0.01;
    var c0 = Math.floor(left/TILE), c1 = Math.floor(right/TILE);
    if (player.vy > 0){
      var row = Math.floor((player.y+PLAYER_H)/TILE);
      for (var c=c0;c<=c1;c++){
        if (isSolidTile(c,row)){
          var landedY = row*TILE - PLAYER_H;
          if (!player.onGround && player.vy > 420) player.squash = 1;
          player.y = landedY;
          player.vy = 0;
          player.onGround = true;
          break;
        }
      }
    } else if (player.vy < 0){
      var row2 = Math.floor(player.y/TILE);
      for (var c2=c0;c2<=c1;c2++){
        if (isSolidTile(c2,row2)){
          player.y = (row2+1)*TILE;
          player.vy = 0;
          break;
        }
      }
    }
  }

  // ---------- Actualizacion de fisica ----------
  function updatePlayer(dt){
    var moveInput = 0;
    if (keys.left) moveInput -= 1;
    if (keys.right) moveInput += 1;
    if (wallJumpLockTimer > 0){
      wallJumpLockTimer -= dt;
      if (moveInput === wallJumpBlockedSign) moveInput = 0;
    }
    if (moveInput !== 0) player.facing = moveInput;

    var accel = player.onGround ? MOVE_ACCEL_GROUND : MOVE_ACCEL_AIR;
    var friction = player.onGround ? GROUND_FRICTION : AIR_FRICTION;
    if (moveInput !== 0){
      player.vx = clamp(player.vx + moveInput*accel*dt, -MOVE_MAX_SPEED, MOVE_MAX_SPEED);
    } else if (player.vx > 0){
      player.vx = Math.max(0, player.vx - friction*dt);
    } else if (player.vx < 0){
      player.vx = Math.min(0, player.vx + friction*dt);
    }

    if (!player.onGround){
      var fallCap = isWallSliding ? WALL_SLIDE_MAX_FALL : MAX_FALL;
      player.vy = Math.min(player.vy + GRAVITY*dt, fallCap);
    }

    coyoteTimer = player.onGround ? COYOTE_TIME : Math.max(0, coyoteTimer-dt);
    jumpBufferTimer = jumpPressedEdge ? JUMP_BUFFER : Math.max(0, jumpBufferTimer-dt);
    jumpPressedEdge = false;

    if (jumpBufferTimer > 0 && (coyoteTimer > 0 || isWallSliding)){
      jumpBufferTimer = 0; coyoteTimer = 0;
      if (isWallSliding && !player.onGround){
        player.vy = WALL_JUMP_VY;
        player.vx = -touchWallSign*WALL_JUMP_VX;
        wallJumpBlockedSign = -touchWallSign;
        wallJumpLockTimer = WALL_JUMP_LOCK;
        isWallSliding = false;
        beep(520, 0.09, 'square');
      } else {
        player.vy = JUMP_VELOCITY;
        beep(660, 0.08, 'square');
      }
    }
    if (jumpReleasedEdge){
      if (player.vy < 0) player.vy *= JUMP_CUT_MULT;
      jumpReleasedEdge = false;
    }

    player.x += player.vx*dt;
    resolveHorizontal();

    player.onGround = false;
    player.y += player.vy*dt;
    resolveVertical();

    isWallSliding = !player.onGround && touchWallSign !== 0 &&
      ((touchWallSign===1 && keys.right) || (touchWallSign===-1 && keys.left)) &&
      player.vy > 0;

    if (player.squash > 0) player.squash = Math.max(0, player.squash - dt*6);
    if (player.onGround && Math.abs(player.vx) > 10) player.walkT += dt*7;
  }

  function updateCamera(){
    if (level.vertical){
      camera.letterboxX = Math.max(0, (CANVAS_W - level.cols*TILE)/2);
      var maxCamY = Math.max(0, level.rows*TILE - CANVAS_H);
      camera.y = clamp(player.y - CANVAS_H/2, 0, maxCamY);
      camera.x = 0;
    } else {
      camera.letterboxX = 0;
      var maxCamX = Math.max(0, level.cols*TILE - CANVAS_W);
      camera.x = clamp(player.x - CANVAS_W/2, 0, maxCamX);
      camera.y = 0;
    }
  }

  function checkGoal(){
    var g = level.goal;
    if (player.x < g.x+g.w && player.x+PLAYER_W > g.x && player.y < g.y+g.h && player.y+PLAYER_H > g.y){
      triggerClear();
    }
  }
  function checkVoidDeath(){
    if (player.y > level.rows*TILE + 200){ triggerDeath('void'); }
  }
  function checkLava(dt){
    if (!level.lava) return;
    lavaTopY -= LAVA_RISE_SPEED*dt;
    if (player.y + PLAYER_H > lavaTopY){ triggerDeath('lava'); }
  }

  function triggerClear(){
    if (gameState !== 'play') return;
    gameState = 'clear';
    beep(880, 0.14, 'triangle'); beep(1180, 0.18, 'triangle');
    if (levelIndex >= LEVELS.length-1){
      tutorialDoneOverlay.classList.remove('is-hidden');
      gameState = 'tutorialDone';
    } else {
      clearOverlay.classList.remove('is-hidden');
    }
  }
  function triggerDeath(kind){
    if (gameState !== 'play') return;
    gameState = 'dead';
    beep(180, 0.28, 'sawtooth');
    deathTitleEl.textContent = kind === 'lava' ? '¡Te alcanzó la lava!' : 'Caíste al vacío';
    deathOverlay.classList.remove('is-hidden');
  }

  function loop(ts){
    if (!parkourActive()){ lastTs = null; requestAnimationFrame(loop); return; }
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(0.033, (ts-lastTs)/1000);
    lastTs = ts;
    if (gameState === 'play'){
      updatePlayer(dt);
      updateCamera();
      checkGoal();
      checkVoidDeath();
      checkLava(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Render ----------
  function drawBackground(){
    var c = ctx;
    var g = c.createLinearGradient(0,0,0,CANVAS_H);
    if (level.vertical){
      g.addColorStop(0,'#1b1340'); g.addColorStop(1,'#3a1f2e');
    } else {
      g.addColorStop(0,'#1b1340'); g.addColorStop(0.6,'#3a2166'); g.addColorStop(1,'#5c2f7d');
    }
    c.fillStyle = g; c.fillRect(0,0,CANVAS_W,CANVAS_H);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    for (var i=0;i<26;i++){
      var sx = (i*137 + (level.vertical?0:-camera.x*0.15)) % (CANVAS_W+40);
      var sy = (i*71) % (CANVAS_H*0.7);
      c.globalAlpha = 0.15 + (i%5)*0.06;
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(93,58,140,0.55)';
    for (var h=0;h<5;h++){
      var hx = (h*220 - (level.vertical?0:camera.x*0.3)) % (CANVAS_W+300) - 150;
      c.beginPath();
      c.moveTo(hx, CANVAS_H);
      c.lineTo(hx+130, CANVAS_H-90);
      c.lineTo(hx+260, CANVAS_H);
      c.closePath();
      c.fill();
    }
  }
  function tileColorAt(col,row){
    var hasAbove = row>0 && !isSolidTile(col,row-1);
    return hasAbove ? '#3fa15a' : '#5a4a7a';
  }
  function drawLevel(){
    var c = ctx;
    var c0 = Math.max(0, Math.floor(camera.x/TILE));
    var c1 = Math.min(level.cols-1, Math.ceil((camera.x+CANVAS_W)/TILE));
    var r0 = Math.max(0, Math.floor(camera.y/TILE));
    var r1 = Math.min(level.rows-1, Math.ceil((camera.y+CANVAS_H)/TILE));
    for (var r=r0;r<=r1;r++){
      for (var col=c0;col<=c1;col++){
        if (!level.grid[r] || !level.grid[r][col]) continue;
        var x = col*TILE, y = r*TILE;
        var hasAbove = r>0 && isSolidTile(col,r-1);
        c.fillStyle = '#4d3878';
        c.fillRect(x,y,TILE,TILE);
        c.fillStyle = 'rgba(0,0,0,0.22)';
        c.fillRect(x,y+TILE-6,TILE,6);
        if (!hasAbove){
          c.fillStyle = '#5fd97a';
          c.fillRect(x,y,TILE,6);
          c.fillStyle = 'rgba(255,255,255,0.18)';
          c.fillRect(x,y,TILE,2);
        }
      }
    }
    // meta (bandera)
    var g = level.goal;
    c.strokeStyle = '#e8e2ff'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(g.x+g.w/2, g.y+g.h); c.lineTo(g.x+g.w/2, g.y-18); c.stroke();
    var wave = reducedMotion ? 0 : Math.sin(performance.now()/220)*3;
    c.fillStyle = '#ffd23f';
    c.beginPath();
    c.moveTo(g.x+g.w/2, g.y-18);
    c.lineTo(g.x+g.w/2+20, g.y-13+wave);
    c.lineTo(g.x+g.w/2, g.y-8);
    c.closePath(); c.fill();
  }
  function drawLava(){
    if (!level.lava) return;
    var c = ctx;
    var y = lavaTopY;
    var grad = c.createLinearGradient(0,y,0,y+40);
    grad.addColorStop(0,'#ffdd66'); grad.addColorStop(0.3,'#ff8a1e'); grad.addColorStop(1,'#c22a12');
    c.fillStyle = grad;
    c.fillRect(0, y, level.cols*TILE, level.rows*TILE - y + 80);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    var t = reducedMotion ? 0 : performance.now()/260;
    for (var x=0; x<level.cols*TILE; x+=14){
      var by = y + Math.sin(t + x*0.12)*3;
      c.fillRect(x, by, 7, 3);
    }
  }
  function drawPlayer(){
    var c = ctx;
    var squashY = 1 - player.squash*0.35;
    var squashX = 1 + player.squash*0.25;
    var cx = player.x+PLAYER_W/2, cy = player.y+PLAYER_H;
    c.save();
    c.translate(cx, cy);
    c.scale(squashX, squashY);
    // cuerpo
    c.fillStyle = '#ff7a45';
    c.fillRect(-PLAYER_W/2, -PLAYER_H, PLAYER_W, PLAYER_H-8);
    // cabeza
    c.fillStyle = '#ffd8b0';
    c.fillRect(-8, -PLAYER_H-8, 16, 12);
    // ojos (miran hacia donde avanza)
    c.fillStyle = '#1b1340';
    c.fillRect(player.facing>0? 1:-6, -PLAYER_H-4, 4, 4);
    // piernas: animacion simple de caminata / pose de salto o deslizamiento
    c.fillStyle = '#2a1d47';
    if (isWallSliding){
      c.fillRect(-9,-9,7,9);
      c.fillRect(2,-9,7,9);
    } else if (!player.onGround){
      c.fillRect(-8,-9,6,9);
      c.fillRect(2,-9,6,9);
    } else if (Math.abs(player.vx) > 10){
      var swing = Math.sin(player.walkT)*5;
      c.fillRect(-8+swing*0.4,-9,6,9);
      c.fillRect(2-swing*0.4,-9,6,9);
    } else {
      c.fillRect(-8,-9,6,9);
      c.fillRect(2,-9,6,9);
    }
    c.restore();
  }
  function draw(){
    if (!level) return;
    drawBackground();
    ctx.save();
    ctx.translate(-camera.x+camera.letterboxX, -camera.y);
    drawLevel();
    drawLava();
    drawPlayer();
    ctx.restore();
  }

  // ---------- Flujo de pantallas ----------
  playParkourBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    parkourView.classList.remove('is-hidden');
    ensureAudio();
    loadLevel(0);
  });
  backFromParkourBtn.addEventListener('click', function(){
    parkourView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
  });
  startBtn.addEventListener('click', function(){
    ensureAudio();
    startOverlay.classList.add('is-hidden');
    gameState = 'play';
  });
  nextBtn.addEventListener('click', function(){
    loadLevel(levelIndex+1);
  });
  retryBtn.addEventListener('click', function(){
    loadLevel(levelIndex);
  });
  tutorialRetryBtn.addEventListener('click', function(){
    loadLevel(0);
  });

  loadLevel(0);
  requestAnimationFrame(loop);
})();
