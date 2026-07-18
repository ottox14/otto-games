(function(){
  var CANVAS_W = 440, CANVAS_H = 560;
  var ALIEN_ROWS = 5, ALIEN_COLS = 8;
  var ALIEN_W = 28, ALIEN_H = 18, GAP_X = 14, GAP_Y = 16;
  var GRID_W = ALIEN_COLS*ALIEN_W + (ALIEN_COLS-1)*GAP_X;
  var START_X = (CANVAS_W-GRID_W)/2, START_Y = 60;
  var STEP_DOWN = 14;

  var PLAYER_W = 34, PLAYER_H = 16, PLAYER_SPEED = 190;
  var PLAYER_Y = CANVAS_H-40;
  var PLAYER_BULLET_SPEED = 360, ALIEN_BULLET_SPEED = 210;
  var LIVES_START = 3, RESPAWN_DELAY = 1.2, INVULN_TIME = 1.5;

  var BUNKER_COUNT = 4, BUNKER_COLS = 8, BUNKER_ROWS = 6, BLOCK = 5;
  var BUNKER_W = BUNKER_COLS*BLOCK, BUNKER_H = BUNKER_ROWS*BLOCK;
  var BUNKER_Y = PLAYER_Y-90;

  var ROW_TYPES = ['top','mid','mid','low','low'];
  var ROW_POINTS = {top:30, mid:20, low:10};
  var ROW_COLORS = {top:'#ff3ea5', mid:'#4ad9ff', low:'#9d6bff'};
  var UFO_VALUES = [50,100,150,300];

  var canvas = document.getElementById('invadersCanvas');
  var ctx = canvas.getContext('2d');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W*dpr;
    canvas.height = CANVAS_H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  var portalView = document.getElementById('portalView');
  var invadersView = document.getElementById('invadersView');
  var playInvadersBtn = document.getElementById('playInvadersBtn');
  var backFromInvadersBtn = document.getElementById('backFromInvadersBtn');
  var muteBtn = document.getElementById('invadersMuteBtn');
  var livesEl = document.getElementById('invadersLivesVal');
  var scoreEl = document.getElementById('invadersScoreVal');
  var levelEl = document.getElementById('invadersLevelVal');
  var startOverlay = document.getElementById('invadersStartOverlay');
  var startTitleEl = document.getElementById('invadersStartTitle');
  var startBtn = document.getElementById('invadersStartBtn');
  var clearOverlay = document.getElementById('invadersClearOverlay');
  var clearTitleEl = document.getElementById('invadersClearTitle');
  var nextBtn = document.getElementById('invadersNextBtn');
  var overOverlay = document.getElementById('invadersOverOverlay');
  var overTitleEl = document.getElementById('invadersOverTitle');
  var overLevelEl = document.getElementById('invadersOverLevel');
  var overScoreEl = document.getElementById('invadersOverScore');
  var retryBtn = document.getElementById('invadersRetryBtn');
  var resetBtn = document.getElementById('invadersResetBtn');
  var iJoystick = document.getElementById('iJoystick');
  var iFire = document.getElementById('iFire');

  function invadersActive(){ return !invadersView.classList.contains('is-hidden'); }

  playInvadersBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    invadersView.classList.remove('is-hidden');
    if (gameState === 'play') startInvadersLoop();
  });
  backFromInvadersBtn.addEventListener('click', function(){
    invadersView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseInvadersLoop();
  });

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
    osc.type = type || 'square';
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

  function getLevelConfig(n){
    return {
      speed: 26 + n*5,
      fireInterval: Math.max(0.5, 1.7 - n*0.1)
    };
  }

  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  var aliens = [];
  var aliveCount = 0;
  var totalAliens = ALIEN_ROWS*ALIEN_COLS;
  var formation = {x:0, y:0, dir:1};
  var bunkers = [];
  var MAX_PLAYER_BULLETS = 3;
  var player = {x:(CANVAS_W-PLAYER_W)/2, y:PLAYER_Y, w:PLAYER_W, h:PLAYER_H, bullets:[], alive:true, respawning:false, invuln:0};
  var alienBullets = [];
  var particles = [];
  var ufo = null;
  var ufoTimer = 12;
  var currentLevel = 1;
  var lives = LIVES_START;
  var score = 0;
  var fireTimer = 0;
  var respawnTimer = 0;
  var currentCfg = null;
  var gameState = 'start';

  function buildAliens(){
    aliens = [];
    for (var r=0;r<ALIEN_ROWS;r++){
      var row = [];
      for (var c=0;c<ALIEN_COLS;c++){
        row.push({alive:true, type: ROW_TYPES[r]});
      }
      aliens.push(row);
    }
    aliveCount = ALIEN_ROWS*ALIEN_COLS;
    totalAliens = aliveCount;
    formation.x = 0; formation.y = 0; formation.dir = 1;
  }

  function buildBunkers(){
    bunkers = [];
    var spacing = CANVAS_W/BUNKER_COUNT;
    for (var i=0;i<BUNKER_COUNT;i++){
      var bx = Math.round(i*spacing + (spacing-BUNKER_W)/2);
      var blocks = [];
      for (var r=0;r<BUNKER_ROWS;r++){
        var row = [];
        for (var c=0;c<BUNKER_COLS;c++){
          var isNotch = r>=BUNKER_ROWS-2 && c>=3 && c<=4;
          row.push(!isNotch);
        }
        blocks.push(row);
      }
      bunkers.push({x:bx, y:BUNKER_Y, blocks:blocks});
    }
  }

  function alienScreenX(col){ return START_X + col*(ALIEN_W+GAP_X) + formation.x; }
  function alienScreenY(row){ return START_Y + row*(ALIEN_H+GAP_Y) + formation.y; }

  function getFormationEdges(){
    var minCol=-1, maxCol=-1, maxRow=-1;
    for (var r=0;r<ALIEN_ROWS;r++){
      for (var c=0;c<ALIEN_COLS;c++){
        if (aliens[r][c].alive){
          if (minCol===-1 || c<minCol) minCol=c;
          if (maxCol===-1 || c>maxCol) maxCol=c;
          if (r>maxRow) maxRow=r;
        }
      }
    }
    return {minCol:minCol, maxCol:maxCol, maxRow:maxRow};
  }

  function hitBunker(x,y,w,h){
    for (var i=0;i<bunkers.length;i++){
      var bk = bunkers[i];
      if (x+w < bk.x || x > bk.x+BUNKER_W || y+h < bk.y || y > bk.y+BUNKER_H) continue;
      var c0 = Math.max(0, Math.floor((x-bk.x)/BLOCK));
      var c1 = Math.min(BUNKER_COLS-1, Math.floor((x+w-1-bk.x)/BLOCK));
      var r0 = Math.max(0, Math.floor((y-bk.y)/BLOCK));
      var r1 = Math.min(BUNKER_ROWS-1, Math.floor((y+h-1-bk.y)/BLOCK));
      for (var r=r0;r<=r1;r++){
        for (var c=c0;c<=c1;c++){
          if (bk.blocks[r][c]){
            bk.blocks[r][c] = false;
            return true;
          }
        }
      }
    }
    return false;
  }

  function spawnExplosion(cx,cy,color){
    for (var i=0;i<8;i++){
      var ang = Math.random()*Math.PI*2, speed = 50+Math.random()*70;
      particles.push({
        x:cx, y:cy, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
        life:0.3+Math.random()*0.25, age:0, size:3+Math.random()*3, color:color
      });
    }
  }
  function updateParticles(dt){
    for (var i=particles.length-1;i>=0;i--){
      var p = particles[i];
      p.age += dt;
      if (p.age>=p.life){ particles.splice(i,1); continue; }
      p.x += p.vx*dt; p.y += p.vy*dt;
    }
  }

  var dirStack = [];
  function pressDir(dir){ if (dirStack.indexOf(dir)===-1) dirStack.push(dir); }
  function releaseDir(dir){ var i=dirStack.indexOf(dir); if (i!==-1) dirStack.splice(i,1); }
  function currentDir(){ return dirStack.length ? dirStack[dirStack.length-1] : null; }

  var KEY_DIR = {ArrowLeft:'left', ArrowRight:'right'};
  window.addEventListener('keydown', function(e){
    if (!invadersActive()) return;
    if (KEY_DIR[e.code]){
      e.preventDefault();
      pressDir(KEY_DIR[e.code]);
    } else if (e.code==='Space'){
      e.preventDefault();
      if (gameState==='play' && player.alive && !player.respawning) firePlayerBullet();
    }
  });
  window.addEventListener('keyup', function(e){
    if (!invadersActive()) return;
    if (KEY_DIR[e.code]) releaseDir(KEY_DIR[e.code]);
  });

  function bindJoystick(joyEl, dirs){
    var thumb = joyEl.querySelector('.joystick-thumb');
    var maxDist = 26;
    var pointerId = null;
    var activeDir = null;
    function setDir(dir){
      if (dir === activeDir) return;
      if (activeDir) releaseDir(activeDir);
      activeDir = dir;
      if (activeDir) pressDir(activeDir);
    }
    function dirFromAngle(dx, dy, dist){
      if (dist < maxDist*0.32) return null;
      if (dirs.length === 2) return dx < 0 ? dirs[0] : dirs[1];
      var deg = Math.atan2(dy, dx) * 180/Math.PI;
      if (deg > -45 && deg <= 45) return 'right';
      if (deg > 45 && deg <= 135) return 'down';
      if (deg > 135 || deg <= -135) return 'left';
      return 'up';
    }
    function move(e){
      var rect = joyEl.getBoundingClientRect();
      var dx = e.clientX - (rect.left + rect.width/2);
      var dy = e.clientY - (rect.top + rect.height/2);
      var dist = Math.min(Math.sqrt(dx*dx+dy*dy), maxDist);
      var ang = Math.atan2(dy, dx);
      thumb.style.transform = 'translate('+(Math.cos(ang)*dist)+'px,'+(Math.sin(ang)*dist)+'px)';
      setDir(dirFromAngle(dx, dy, Math.sqrt(dx*dx+dy*dy)));
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
  bindJoystick(iJoystick, ['left','right']);
  iFire.addEventListener('pointerdown', function(e){
    e.preventDefault();
    if (gameState==='play' && player.alive && !player.respawning) firePlayerBullet();
  });

  function firePlayerBullet(){
    if (player.bullets.length >= MAX_PLAYER_BULLETS) return;
    var b = {x:player.x+player.w/2-1.5, y:player.y-12, w:3, h:12, dead:false};
    player.bullets.push(b);
    beep(880, 0.06, 'square');
  }

  function updateHUD(){
    livesEl.textContent = Math.max(0, lives);
    scoreEl.textContent = score;
    levelEl.textContent = currentLevel;
  }

  function respawnPlayer(){
    player.x = (CANVAS_W-PLAYER_W)/2;
    player.alive = true; player.respawning = false;
    player.invuln = INVULN_TIME; player.bullets = [];
  }

  function killPlayer(){
    if (gameState!=='play') return;
    player.alive = false;
    spawnExplosion(player.x+player.w/2, player.y+player.h/2, '#4ad9ff');
    beep(140, 0.25, 'sawtooth');
    lives -= 1;
    updateHUD();
    if (lives<=0){
      triggerGameOver('¡Invasión completada!');
    } else {
      player.respawning = true;
      respawnTimer = RESPAWN_DELAY;
    }
  }

  function triggerGameOver(title){
    if (gameState!=='play') return;
    gameState = 'over';
    pauseInvadersLoop();
    overTitleEl.textContent = title;
    overLevelEl.textContent = currentLevel;
    overScoreEl.textContent = score;
    overOverlay.classList.remove('is-hidden');
    beep(100, 0.4, 'sawtooth');
  }

  function triggerLevelClear(){
    gameState = 'clear';
    pauseInvadersLoop();
    clearTitleEl.textContent = '¡Nivel '+currentLevel+' superado!';
    clearOverlay.classList.remove('is-hidden');
    beep(1046, 0.2, 'triangle');
  }

  function updateFormation(dt){
    var edges = getFormationEdges();
    if (edges.minCol===-1) return;
    var leftX = alienScreenX(edges.minCol);
    var rightX = alienScreenX(edges.maxCol)+ALIEN_W;
    var speedMult = Math.min(4, totalAliens/Math.max(1,aliveCount));
    var speed = currentCfg.speed * speedMult;
    var willHitEdge = (formation.dir>0 && rightX+speed*dt>=CANVAS_W-8) ||
                       (formation.dir<0 && leftX-speed*dt<=8);
    if (willHitEdge){
      formation.dir *= -1;
      formation.y += STEP_DOWN;
    } else {
      formation.x += formation.dir*speed*dt;
    }
    var lowestY = alienScreenY(edges.maxRow)+ALIEN_H;
    if (lowestY >= BUNKER_Y){
      triggerGameOver('¡Invasión completada!');
    }
  }

  function spawnAlienFire(dt){
    fireTimer -= dt;
    if (fireTimer<=0){
      var columns = [];
      for (var c=0;c<ALIEN_COLS;c++){
        var bottomRow = -1;
        for (var r=ALIEN_ROWS-1;r>=0;r--){
          if (aliens[r][c].alive){ bottomRow=r; break; }
        }
        if (bottomRow!==-1) columns.push({row:bottomRow, col:c});
      }
      if (columns.length){
        var pick = columns[Math.floor(Math.random()*columns.length)];
        var ax = alienScreenX(pick.col)+ALIEN_W/2-1.5;
        var ay = alienScreenY(pick.row)+ALIEN_H;
        alienBullets.push({x:ax, y:ay, w:3, h:12, dead:false});
        beep(220, 0.08, 'square');
      }
      fireTimer = currentCfg.fireInterval*(0.6+Math.random()*0.8);
    }
  }

  function updateUfo(dt){
    if (ufo){
      ufo.x += ufo.dir*ufo.speed*dt;
      if (ufo.x < -40 || ufo.x > CANVAS_W+40) ufo = null;
    } else {
      ufoTimer -= dt;
      if (ufoTimer<=0){
        var dir = Math.random()<0.5 ? 1 : -1;
        ufo = {
          x: dir>0 ? -40 : CANVAS_W+40, y:26, w:32, h:14,
          dir:dir, speed:90, value: UFO_VALUES[Math.floor(Math.random()*UFO_VALUES.length)]
        };
        ufoTimer = 12+Math.random()*10;
      }
    }
  }

  function killAlien(r,c){
    if (gameState!=='play') return;
    aliens[r][c].alive = false;
    aliveCount -= 1;
    score += ROW_POINTS[aliens[r][c].type];
    updateHUD();
    spawnExplosion(alienScreenX(c)+ALIEN_W/2, alienScreenY(r)+ALIEN_H/2, ROW_COLORS[aliens[r][c].type]);
    beep(500, 0.07, 'square');
    if (aliveCount<=0) triggerLevelClear();
  }

  function updateBullets(dt){
    for (var pi=player.bullets.length-1; pi>=0; pi--){
      var b = player.bullets[pi];
      b.y -= PLAYER_BULLET_SPEED*dt;
      if (b.y+b.h<0){ player.bullets.splice(pi,1); continue; }
      if (hitBunker(b.x,b.y,b.w,b.h)){ player.bullets.splice(pi,1); continue; }
      if (ufo && rectsOverlap(b, ufo)){
        score += ufo.value;
        updateHUD();
        spawnExplosion(ufo.x+ufo.w/2, ufo.y+ufo.h/2, '#ffd23f');
        beep(1200,0.15,'triangle');
        ufo = null;
        player.bullets.splice(pi,1);
        continue;
      }
      var hit = false;
      for (var r=0;r<ALIEN_ROWS && !hit;r++){
        for (var c=0;c<ALIEN_COLS && !hit;c++){
          var al = aliens[r][c];
          if (!al.alive) continue;
          var abox = {x:alienScreenX(c), y:alienScreenY(r), w:ALIEN_W, h:ALIEN_H};
          if (rectsOverlap(b, abox)){
            killAlien(r,c);
            player.bullets.splice(pi,1);
            hit = true;
          }
        }
      }
    }
    for (var i=alienBullets.length-1;i>=0;i--){
      var ab = alienBullets[i];
      ab.y += ALIEN_BULLET_SPEED*dt;
      if (ab.y>CANVAS_H){ alienBullets.splice(i,1); continue; }
      if (hitBunker(ab.x,ab.y,ab.w,ab.h)){ alienBullets.splice(i,1); continue; }
      if (player.alive && !player.respawning && player.invuln<=0 && rectsOverlap(ab, player)){
        alienBullets.splice(i,1);
        killPlayer();
        continue;
      }
    }
  }

  function tick(dt){
    if (gameState!=='play') return;
    if (player.respawning){
      respawnTimer -= dt;
      if (respawnTimer<=0) respawnPlayer();
    } else if (player.alive){
      var dir = currentDir();
      if (dir==='left') player.x = Math.max(6, player.x-PLAYER_SPEED*dt);
      else if (dir==='right') player.x = Math.min(CANVAS_W-PLAYER_W-6, player.x+PLAYER_SPEED*dt);
      if (player.invuln>0) player.invuln -= dt;
    }
    updateFormation(dt);
    spawnAlienFire(dt);
    updateBullets(dt);
    updateUfo(dt);
  }

  function drawBunkers(){
    ctx.fillStyle = '#5ecb8f';
    bunkers.forEach(function(bk){
      for (var r=0;r<BUNKER_ROWS;r++){
        for (var c=0;c<BUNKER_COLS;c++){
          if (bk.blocks[r][c]){
            ctx.fillRect(bk.x+c*BLOCK, bk.y+r*BLOCK, BLOCK, BLOCK);
          }
        }
      }
    });
  }

  function drawAlien(x,y,type){
    ctx.fillStyle = ROW_COLORS[type];
    ctx.fillRect(x+4, y, ALIEN_W-8, 4);
    ctx.fillRect(x, y+4, ALIEN_W, 8);
    ctx.fillRect(x+2, y+12, 6, 4);
    ctx.fillRect(x+ALIEN_W-8, y+12, 6, 4);
    ctx.fillStyle = '#0a0612';
    ctx.fillRect(x+7, y+6, 4, 4);
    ctx.fillRect(x+ALIEN_W-11, y+6, 4, 4);
  }

  function drawPlayer(){
    if (!player.alive || player.respawning) return;
    var blink = player.invuln>0 && !reducedMotion && Math.floor(performance.now()/100)%2===0;
    if (blink) return;
    ctx.fillStyle = '#4ad9ff';
    ctx.fillRect(player.x+player.w/2-2, player.y, 4, 6);
    ctx.fillRect(player.x, player.y+6, player.w, player.h-6);
  }

  function drawUfo(){
    if (!ufo) return;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.ellipse(ufo.x+ufo.w/2, ufo.y+ufo.h/2, ufo.w/2, ufo.h/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff7d6';
    ctx.fillRect(ufo.x+6, ufo.y+2, ufo.w-12, 4);
  }

  function drawBullets(){
    ctx.fillStyle = '#fff7d6';
    player.bullets.forEach(function(b){ ctx.fillRect(b.x, b.y, b.w, b.h); });
    ctx.fillStyle = '#ff8a4a';
    alienBullets.forEach(function(b){ ctx.fillRect(b.x,b.y,b.w,b.h); });
  }

  function drawParticles(){
    particles.forEach(function(p){
      var frac = 1-p.age/p.life;
      ctx.globalAlpha = Math.max(0,frac);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function render(){
    ctx.fillStyle = '#0a0612';
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    for (var r=0;r<ALIEN_ROWS;r++){
      for (var c=0;c<ALIEN_COLS;c++){
        if (aliens[r][c] && aliens[r][c].alive){
          drawAlien(alienScreenX(c), alienScreenY(r), aliens[r][c].type);
        }
      }
    }
    drawBunkers();
    drawUfo();
    drawBullets();
    drawPlayer();
    drawParticles();
  }

  var lastTime = null;
  var invadersLoopRunning = false;
  function startInvadersLoop(){
    if (invadersLoopRunning) return;
    invadersLoopRunning = true;
    lastTime = null;
    requestAnimationFrame(loop);
  }
  function pauseInvadersLoop(){
    invadersLoopRunning = false;
    dirStack.length = 0;
  }
  function loop(ts){
    if (!invadersLoopRunning) return;
    if (lastTime===null) lastTime = ts;
    var dt = Math.min(0.033, (ts-lastTime)/1000);
    lastTime = ts;
    tick(dt);
    updateParticles(dt);
    render();
    requestAnimationFrame(loop);
  }

  function startLevel(){
    gameState = 'play';
    currentCfg = getLevelConfig(currentLevel);
    buildAliens();
    buildBunkers();
    player.x = (CANVAS_W-PLAYER_W)/2;
    player.alive = true; player.respawning = false; player.invuln = INVULN_TIME; player.bullets = [];
    alienBullets = []; particles = [];
    ufo = null; ufoTimer = 10+Math.random()*8;
    lives = LIVES_START;
    fireTimer = currentCfg.fireInterval;
    dirStack.length = 0;

    updateHUD();
    startOverlay.classList.add('is-hidden');
    clearOverlay.classList.add('is-hidden');
    overOverlay.classList.add('is-hidden');
    ensureAudio();
    startInvadersLoop();
  }

  function showInvadersIntro(){
    startTitleEl.textContent = '¿Listo para el Nivel '+currentLevel+'?';
  }
  showInvadersIntro();

  startBtn.addEventListener('click', function(){
    score = 0;
    startLevel();
  });
  retryBtn.addEventListener('click', function(){
    score = 0;
    startLevel();
  });
  nextBtn.addEventListener('click', function(){
    currentLevel += 1;
    showInvadersIntro();
    startLevel();
  });
  resetBtn.addEventListener('click', function(){
    currentLevel = 1;
    score = 0;
    showInvadersIntro();
    startLevel();
  });

  buildAliens();
  buildBunkers();
  render();
})();
