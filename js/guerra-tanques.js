(function(){
  var TILE = 32, COLS = 13, ROWS = 13;
  var EMPTY=0, BRICK=1, STEEL=2, BASE=3;

  var PLAYER_SIZE = 26, ENEMY_SIZE = 26, BULLET_SIZE = 5;
  var PLAYER_SPEED = 130, PLAYER_BULLET_SPEED = 300, ENEMY_BULLET_SPEED = 220;
  var LIVES_START = 3, RESPAWN_DELAY = 1.2, INVULN_TIME = 1.5;
  var MAX_CONCURRENT_ENEMIES = 4;
  var SPAWN_COLS = [1, 6, 11];

  var BOMB_SPEED = 150, BOMB_RADIUS = 50;
  var LASER_SPEED = 480;
  var PLAYER_BOMB_COOLDOWN = 4;

  var ENEMY_TYPES = {
    normal: { color:'#9c8a6e', speedMult:1,    fireMin:1.2, fireMax:2.5, maxBullets:1, bulletType:'normal' },
    rapid:  { color:'#4caf50', speedMult:1.1,  fireMin:0.5, fireMax:0.6, maxBullets:2, bulletType:'normal' },
    bomber: { color:'#7a5cff', speedMult:0.85, fireMin:2.6, fireMax:4.0, maxBullets:1, bulletType:'bomb'   }
  };

  function isBossLevel(n){ return n % 5 === 0; }

  var canvas = document.getElementById('tanksCanvas');
  var ctx = canvas.getContext('2d');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = COLS*TILE*dpr;
    canvas.height = ROWS*TILE*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  var portalView = document.getElementById('portalView');
  var tanksView = document.getElementById('tanksView');
  var playTanksBtn = document.getElementById('playTanksBtn');
  var backFromTanksBtn = document.getElementById('backFromTanksBtn');
  var muteBtn = document.getElementById('tanksMuteBtn');
  var livesEl = document.getElementById('tanksLivesVal');
  var enemiesEl = document.getElementById('tanksEnemiesVal');
  var levelEl = document.getElementById('tanksLevelVal');
  var startOverlay = document.getElementById('tanksStartOverlay');
  var startTitleEl = document.getElementById('tanksStartTitle');
  var startDescEl = document.getElementById('tanksStartDesc');
  var startBtn = document.getElementById('tanksStartBtn');
  var clearOverlay = document.getElementById('tanksClearOverlay');
  var clearTitleEl = document.getElementById('tanksClearTitle');
  var nextBtn = document.getElementById('tanksNextBtn');
  var overOverlay = document.getElementById('tanksOverOverlay');
  var overTitleEl = document.getElementById('tanksOverTitle');
  var overLevelEl = document.getElementById('tanksOverLevel');
  var retryBtn = document.getElementById('tanksRetryBtn');
  var resetBtn = document.getElementById('tanksResetBtn');
  var tJoystick = document.getElementById('tJoystick');
  var tFire = document.getElementById('tFire');
  var tBomb = document.getElementById('tBomb');

  function tanksActive(){ return !tanksView.classList.contains('is-hidden'); }

  playTanksBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    tanksView.classList.remove('is-hidden');
    if (gameState === 'play') startTanksLoop();
  });
  backFromTanksBtn.addEventListener('click', function(){
    tanksView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseTanksLoop();
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
    var mix = ['normal'];
    if (n>=2) mix.push('normal','rapid');
    if (n>=3) mix.push('rapid','bomber');
    return {
      totalEnemies: Math.min(24, 6 + n*2),
      enemySpeed: Math.min(150, 90 + n*6),
      spawnInterval: Math.max(1.2, 2.4 - n*0.12),
      bricks: 10 + n*2,
      steels: 4 + Math.floor(n/2),
      enemyMix: mix,
      playerMaxBullets: n>=3 ? 2 : 1,
      bombUnlocked: n>=4,
      isBoss: isBossLevel(n),
      bossHp: 5 + Math.floor(n/5)*2
    };
  }

  function generateMap(cfg){
    var grid = [];
    for (var r=0; r<ROWS; r++) grid.push(new Array(COLS).fill(EMPTY));
    var baseRow = ROWS-2, baseCol = Math.floor(COLS/2);
    grid[baseRow][baseCol] = BASE;
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1]].forEach(function(o){
      var rr = baseRow+o[0], cc = baseCol+o[1];
      if (rr>=0 && rr<ROWS && cc>=0 && cc<COLS) grid[rr][cc] = BRICK;
    });
    for (var i=0;i<cfg.bricks;i++){
      var r1 = 2+Math.floor(Math.random()*(ROWS-6));
      var c1 = 1+Math.floor(Math.random()*(COLS-2));
      if (grid[r1][c1]===EMPTY) grid[r1][c1]=BRICK;
      if (Math.random()<0.5){
        var c2 = c1+1;
        if (c2<COLS-1 && grid[r1][c2]===EMPTY) grid[r1][c2]=BRICK;
      }
    }
    for (var j=0;j<cfg.steels;j++){
      var r2 = 3+Math.floor(Math.random()*(ROWS-7));
      var c3 = 1+Math.floor(Math.random()*(COLS-2));
      if (grid[r2][c3]===EMPTY) grid[r2][c3]=STEEL;
    }
    return {grid:grid, baseRow:baseRow, baseCol:baseCol};
  }

  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  var grid, baseRow, baseCol, currentCfg;
  var player = null;
  var enemies = [];
  var bullets = [];
  var particles = [];
  var currentLevel = 1;
  var lives = LIVES_START;
  var totalEnemies = 0, spawnedEnemies = 0, killedCount = 0;
  var spawnTimer = 0;
  var respawnTimer = 0;
  var gameState = 'start';

  function cellBlocked(cell){ return cell===BRICK || cell===STEEL || cell===BASE; }

  function isBlockedForTank(x,y,w,h,exclude){
    if (x<0 || y<0 || x+w>COLS*TILE || y+h>ROWS*TILE) return true;
    var c0=Math.floor(x/TILE), c1=Math.floor((x+w-1)/TILE);
    var r0=Math.floor(y/TILE), r1=Math.floor((y+h-1)/TILE);
    for (var r=r0;r<=r1;r++){
      for (var c=c0;c<=c1;c++){
        if (cellBlocked(grid[r][c])) return true;
      }
    }
    var testBox = {x:x,y:y,w:w,h:h};
    if (player && player.alive && !player.respawning && player!==exclude && rectsOverlap(testBox, player)) return true;
    for (var i=0;i<enemies.length;i++){
      var e = enemies[i];
      if (e.alive && e!==exclude && rectsOverlap(testBox, e)) return true;
    }
    return false;
  }

  function makeTank(x,y,isPlayer,type){
    var t = type || 'normal';
    var stats = ENEMY_TYPES[t] || ENEMY_TYPES.normal;
    return {
      x:x, y:y, w:isPlayer?PLAYER_SIZE:ENEMY_SIZE, h:isPlayer?PLAYER_SIZE:ENEMY_SIZE,
      dir:'up', speed: isPlayer?PLAYER_SPEED:90,
      isPlayer:isPlayer, type:t, alive:true, respawning:false,
      bulletCount:0, maxBullets: isPlayer?1:stats.maxBullets,
      invuln:0, bombCooldown:0,
      moveTimer:0, fireTimer: isPlayer?0:(stats.fireMin+Math.random()*(stats.fireMax-stats.fireMin))
    };
  }

  function makeBoss(x,y,hp){
    return {
      x:x, y:y, w:ENEMY_SIZE*1.8, h:ENEMY_SIZE*1.8,
      dir:'left', speed:40,
      isPlayer:false, type:'boss', alive:true, respawning:false,
      bulletCount:0, maxBullets:1, invuln:0,
      hp:hp, maxHp:hp,
      moveTimer:1, fireTimer:0,
      summonTimer: 4+Math.random()*2,
      laserTimer: 3+Math.random()*2
    };
  }

  function moveTank(tank, dir, dt){
    if (!dir) return;
    tank.dir = dir;
    var dx=0, dy=0;
    if (dir==='up') dy=-tank.speed*dt;
    else if (dir==='down') dy=tank.speed*dt;
    else if (dir==='left') dx=-tank.speed*dt;
    else if (dir==='right') dx=tank.speed*dt;
    var nx=tank.x+dx, ny=tank.y+dy;
    if (!isBlockedForTank(nx, ny, tank.w, tank.h, tank)){
      tank.x = nx; tank.y = ny;
    }
  }

  function randomDir(){
    var dirs = ['up','down','left','right'];
    return dirs[Math.floor(Math.random()*dirs.length)];
  }

  function fireBullet(tank, bulletType){
    if (tank.bulletCount >= tank.maxBullets) return;
    var type = bulletType || 'normal';
    var speed = tank.isPlayer ? PLAYER_BULLET_SPEED : (type==='bomb' ? BOMB_SPEED : (type==='laser' ? LASER_SPEED : ENEMY_BULLET_SPEED));
    var w = type==='bomb' ? 10 : (type==='laser' ? 7 : BULLET_SIZE);
    var h = type==='bomb' ? 10 : (type==='laser' ? 14 : BULLET_SIZE);
    var cx = tank.x+tank.w/2, cy = tank.y+tank.h/2;
    var b = {x:cx-w/2, y:cy-h/2, w:w, h:h, dir:tank.dir, speed:speed, owner:tank, dead:false, type:type};
    tank.bulletCount += 1;
    bullets.push(b);
    beep(tank.isPlayer?720:(type==='bomb'?300:(type==='laser'?900:420)), 0.05, 'square');
  }

  function killBullet(b){
    if (b.dead) return;
    b.dead = true;
    b.owner.bulletCount = Math.max(0, b.owner.bulletCount-1);
  }

  function spawnExplosion(cx,cy){
    for (var i=0;i<10;i++){
      var ang = Math.random()*Math.PI*2, speed = 60+Math.random()*80;
      particles.push({
        x:cx, y:cy, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
        life:0.35+Math.random()*0.25, age:0, size:3+Math.random()*3
      });
    }
  }

  function updateParticles(dt){
    for (var i=particles.length-1;i>=0;i--){
      var p = particles[i];
      p.age += dt;
      if (p.age >= p.life){ particles.splice(i,1); continue; }
      p.x += p.vx*dt; p.y += p.vy*dt;
    }
  }

  function killTank(tank){
    tank.alive = false;
    spawnExplosion(tank.x+tank.w/2, tank.y+tank.h/2);
    beep(150, 0.22, 'sawtooth');
    if (tank.isPlayer){
      lives -= 1;
      updateHUD();
      if (lives <= 0){
        triggerGameOver('¡Sin vidas!');
      } else {
        player.respawning = true;
        respawnTimer = RESPAWN_DELAY;
      }
    } else {
      var idx = enemies.indexOf(tank);
      if (idx !== -1) enemies.splice(idx,1);
      killedCount += 1;
      updateHUD();
      checkLevelClear();
    }
  }

  function respawnPlayer(){
    var spawnX = (baseCol-3)*TILE + (TILE-PLAYER_SIZE)/2;
    var spawnY = (ROWS-1)*TILE + (TILE-PLAYER_SIZE)/2;
    player.x = spawnX; player.y = spawnY;
    player.alive = true; player.respawning = false;
    player.dir = 'up'; player.bulletCount = 0;
    player.invuln = INVULN_TIME;
  }

  function damageTank(tank){
    if (tank.type === 'boss'){
      tank.hp -= 1;
      spawnExplosion(tank.x+tank.w/2, tank.y+tank.h/2);
      beep(300, 0.1, 'square');
      if (tank.hp <= 0) killBoss(tank);
    } else {
      killTank(tank);
    }
  }

  function killBoss(boss){
    boss.alive = false;
    spawnExplosion(boss.x+boss.w/2, boss.y+boss.h/2);
    beep(120, 0.4, 'sawtooth');
    var idx = enemies.indexOf(boss);
    if (idx !== -1) enemies.splice(idx,1);
    enemies.forEach(function(e){ spawnExplosion(e.x+e.w/2, e.y+e.h/2); });
    enemies = [];
    killedCount = totalEnemies;
    updateHUD();
    triggerLevelClear();
  }

  function explodeBomb(cx, cy, fromPlayer, excludeTank){
    beep(150, 0.3, 'sawtooth');
    spawnExplosion(cx, cy);
    spawnExplosion(cx, cy);
    var col0 = Math.floor(cx/TILE), row0 = Math.floor(cy/TILE);
    for (var r=row0-1; r<=row0+1; r++){
      for (var c=col0-1; c<=col0+1; c++){
        if (r<0 || r>=ROWS || c<0 || c>=COLS) continue;
        if (grid[r][c]===BRICK) grid[r][c]=EMPTY;
      }
    }
    function inRadius(t){
      var dx = (t.x+t.w/2)-cx, dy = (t.y+t.h/2)-cy;
      return Math.sqrt(dx*dx+dy*dy) <= BOMB_RADIUS;
    }
    if (fromPlayer){
      for (var i=enemies.length-1;i>=0;i--){
        var e = enemies[i];
        if (e && e!==excludeTank && e.alive && inRadius(e)) damageTank(e);
      }
    } else if (player!==excludeTank && player && player.alive && !player.respawning && player.invuln<=0 && inRadius(player)){
      killTank(player);
    }
  }

  function checkLevelClear(){
    if (gameState==='play' && spawnedEnemies>=totalEnemies && enemies.length===0){
      triggerLevelClear();
    }
  }

  function triggerBaseDestroyed(){
    if (gameState !== 'play') return;
    spawnExplosion(baseCol*TILE+TILE/2, baseRow*TILE+TILE/2);
    beep(90, 0.4, 'sawtooth');
    triggerGameOver('¡Base destruida!');
  }

  function triggerGameOver(title){
    if (gameState !== 'play') return;
    gameState = 'over';
    pauseTanksLoop();
    overTitleEl.textContent = title;
    overLevelEl.textContent = currentLevel;
    overOverlay.classList.remove('is-hidden');
  }

  function triggerLevelClear(){
    gameState = 'clear';
    pauseTanksLoop();
    clearTitleEl.textContent = '¡Nivel '+currentLevel+' superado!';
    clearOverlay.classList.remove('is-hidden');
    beep(1046, 0.2, 'triangle');
  }

  function updateEnemy(e, dt){
    e.moveTimer -= dt;
    if (e.moveTimer <= 0){
      e.dir = randomDir();
      e.moveTimer = 0.8+Math.random()*1.5;
    }
    var beforeX=e.x, beforeY=e.y;
    moveTank(e, e.dir, dt);
    if (e.x===beforeX && e.y===beforeY){
      e.moveTimer = 0;
    }
    e.fireTimer -= dt;
    if (e.fireTimer <= 0){
      var stats = ENEMY_TYPES[e.type] || ENEMY_TYPES.normal;
      fireBullet(e, stats.bulletType);
      e.fireTimer = stats.fireMin + Math.random()*(stats.fireMax-stats.fireMin);
    }
  }

  function updateBoss(boss, dt){
    if (!boss.alive) return;
    boss.moveTimer -= dt;
    if (boss.moveTimer <= 0){
      boss.dir = Math.random()<0.5 ? 'left' : 'right';
      boss.moveTimer = 1.5+Math.random()*1.5;
    }
    var beforeX = boss.x;
    moveTank(boss, boss.dir, dt);
    if (boss.x === beforeX) boss.moveTimer = 0;

    boss.summonTimer -= dt;
    if (boss.summonTimer <= 0){
      if (enemies.length < MAX_CONCURRENT_ENEMIES){
        var col = SPAWN_COLS[Math.floor(Math.random()*SPAWN_COLS.length)];
        var sx = col*TILE + (TILE-ENEMY_SIZE)/2;
        var sy = (TILE-ENEMY_SIZE)/2;
        if (!isBlockedForTank(sx, sy, ENEMY_SIZE, ENEMY_SIZE, null)){
          var reinforcement = makeTank(sx, sy, false, 'rapid');
          reinforcement.speed = currentCfg.enemySpeed * ENEMY_TYPES.rapid.speedMult;
          reinforcement.dir = 'down';
          enemies.push(reinforcement);
        }
      }
      boss.summonTimer = 5+Math.random()*2;
    }

    boss.laserTimer -= dt;
    if (boss.laserTimer <= 0){
      fireLaserAtPlayer(boss);
      boss.laserTimer = 3.5+Math.random()*2;
    }
  }

  function fireLaserAtPlayer(boss){
    if (boss.bulletCount >= boss.maxBullets) return;
    if (!player || !player.alive || player.respawning) return;
    var cx = boss.x+boss.w/2, cy = boss.y+boss.h/2;
    var px = player.x+player.w/2, py = player.y+player.h/2;
    var dx = px-cx, dy = py-cy;
    var dist = Math.sqrt(dx*dx+dy*dy) || 1;
    var vx = dx/dist, vy = dy/dist;
    var size = 8;
    var b = {x:cx-size/2, y:cy-size/2, w:size, h:size, vx:vx, vy:vy, speed:LASER_SPEED, owner:boss, dead:false, type:'laser'};
    boss.bulletCount += 1;
    bullets.push(b);
    beep(900, 0.05, 'square');
  }

  function updateBullets(dt){
    for (var i=bullets.length-1;i>=0;i--){
      var b = bullets[i];
      if (b.dead) continue;
      var dx=0, dy=0;
      if (b.vx!==undefined){
        dx = b.vx*b.speed*dt;
        dy = b.vy*b.speed*dt;
      } else if (b.dir==='up') dy=-b.speed*dt;
      else if (b.dir==='down') dy=b.speed*dt;
      else if (b.dir==='left') dx=-b.speed*dt;
      else dx=b.speed*dt;
      b.x += dx; b.y += dy;
      if (b.x<0 || b.y<0 || b.x>COLS*TILE || b.y>ROWS*TILE){
        if (b.type==='bomb') explodeBomb(b.x+b.w/2, b.y+b.h/2, b.owner.isPlayer);
        killBullet(b); continue;
      }

      var col = Math.floor((b.x+b.w/2)/TILE), row = Math.floor((b.y+b.h/2)/TILE);
      var cell = grid[row] && grid[row][col];
      if (cell===BRICK || cell===STEEL || cell===BASE){
        if (b.type==='bomb') explodeBomb(col*TILE+TILE/2, row*TILE+TILE/2, b.owner.isPlayer);
        if (cell===BRICK){
          grid[row][col]=EMPTY;
          spawnExplosion(col*TILE+TILE/2, row*TILE+TILE/2);
          beep(300, 0.08, 'square');
        } else if (cell===STEEL){
          beep(500, 0.06, 'square');
        } else if (cell===BASE){
          triggerBaseDestroyed();
        }
        killBullet(b);
        continue;
      }

      var bbox = {x:b.x, y:b.y, w:b.w, h:b.h};
      var hit = false;
      if (b.owner.isPlayer){
        for (var j=0;j<enemies.length;j++){
          var e = enemies[j];
          if (e.alive && rectsOverlap(bbox, e)){
            damageTank(e);
            if (b.type==='bomb') explodeBomb(e.x+e.w/2, e.y+e.h/2, true, e);
            hit = true;
            break;
          }
        }
      } else if (player && player.alive && !player.respawning && player.invuln<=0 && rectsOverlap(bbox, player)){
        killTank(player);
        if (b.type==='bomb') explodeBomb(player.x+player.w/2, player.y+player.h/2, false, player);
        hit = true;
      }
      if (hit){ killBullet(b); continue; }

      for (var k=0;k<bullets.length;k++){
        var ob = bullets[k];
        if (ob===b || ob.dead) continue;
        if (ob.owner.isPlayer !== b.owner.isPlayer && rectsOverlap(bbox, {x:ob.x,y:ob.y,w:ob.w,h:ob.h})){
          killBullet(b); killBullet(ob); break;
        }
      }
    }
    bullets = bullets.filter(function(b){ return !b.dead; });
  }

  var dirStack = [];
  function pressDir(dir){ if (dirStack.indexOf(dir)===-1) dirStack.push(dir); }
  function releaseDir(dir){ var i=dirStack.indexOf(dir); if (i!==-1) dirStack.splice(i,1); }
  function currentDir(){ return dirStack.length ? dirStack[dirStack.length-1] : null; }

  function throwPlayerBomb(){
    if (!player || !player.alive || player.respawning) return;
    if (!currentCfg.bombUnlocked) return;
    if (player.bombCooldown > 0) return;
    var w=10, h=10;
    var cx = player.x+player.w/2, cy = player.y+player.h/2;
    bullets.push({x:cx-w/2, y:cy-h/2, w:w, h:h, dir:player.dir, speed:BOMB_SPEED, owner:player, dead:false, type:'bomb'});
    player.bombCooldown = PLAYER_BOMB_COOLDOWN;
    beep(200, 0.15, 'sawtooth');
  }

  var KEY_DIR = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right'};
  window.addEventListener('keydown', function(e){
    if (!tanksActive()) return;
    if (KEY_DIR[e.code]){
      e.preventDefault();
      pressDir(KEY_DIR[e.code]);
    } else if (e.code==='Space'){
      e.preventDefault();
      if (gameState==='play' && player && player.alive && !player.respawning) fireBullet(player);
    } else if (e.code==='KeyB'){
      e.preventDefault();
      if (gameState==='play') throwPlayerBomb();
    }
  });
  window.addEventListener('keyup', function(e){
    if (!tanksActive()) return;
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
  bindJoystick(tJoystick, ['up','down','left','right']);
  tFire.addEventListener('pointerdown', function(e){
    e.preventDefault();
    if (gameState==='play' && player && player.alive && !player.respawning) fireBullet(player);
  });
  tBomb.addEventListener('pointerdown', function(e){
    e.preventDefault();
    if (gameState==='play') throwPlayerBomb();
  });

  function updateHUD(){
    livesEl.textContent = Math.max(0, lives);
    enemiesEl.textContent = Math.max(0, totalEnemies-killedCount);
    levelEl.textContent = currentLevel;
  }

  function spawnEnemies(dt){
    if (currentCfg.isBoss) return;
    spawnTimer -= dt;
    if (spawnTimer<=0 && spawnedEnemies<totalEnemies && enemies.length<MAX_CONCURRENT_ENEMIES){
      var col = SPAWN_COLS[Math.floor(Math.random()*SPAWN_COLS.length)];
      var sx = col*TILE + (TILE-ENEMY_SIZE)/2;
      var sy = (TILE-ENEMY_SIZE)/2;
      if (!isBlockedForTank(sx, sy, ENEMY_SIZE, ENEMY_SIZE, null)){
        var type = currentCfg.enemyMix[Math.floor(Math.random()*currentCfg.enemyMix.length)];
        var e = makeTank(sx, sy, false, type);
        e.speed = currentCfg.enemySpeed * (ENEMY_TYPES[type].speedMult || 1);
        e.dir = 'down';
        enemies.push(e);
        spawnedEnemies += 1;
      }
      spawnTimer = currentCfg.spawnInterval;
    }
  }

  function tick(dt){
    if (gameState !== 'play') return;
    if (player.respawning){
      respawnTimer -= dt;
      if (respawnTimer<=0) respawnPlayer();
    } else if (player.alive){
      moveTank(player, currentDir(), dt);
      if (player.invuln>0) player.invuln -= dt;
      if (player.bombCooldown>0) player.bombCooldown -= dt;
    }
    enemies.forEach(function(e){
      if (e.type==='boss') updateBoss(e, dt);
      else updateEnemy(e, dt);
    });
    updateBullets(dt);
    spawnEnemies(dt);
  }

  function drawBrick(x,y){
    ctx.fillStyle = '#b6531c';
    ctx.fillRect(x,y,TILE,TILE);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x,y+TILE/2); ctx.lineTo(x+TILE,y+TILE/2);
    ctx.moveTo(x+TILE/2,y); ctx.lineTo(x+TILE/2,y+TILE/2);
    ctx.moveTo(x+TILE/4,y+TILE/2); ctx.lineTo(x+TILE/4,y+TILE);
    ctx.moveTo(x+TILE*0.75,y+TILE/2); ctx.lineTo(x+TILE*0.75,y+TILE);
    ctx.stroke();
  }
  function drawSteel(x,y){
    ctx.fillStyle = '#8a97a3';
    ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x+2,y+2,TILE-4,4);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x+2,y+TILE-6,TILE-4,4);
  }
  function drawBase(x,y){
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(x+TILE/2,y+4);
    ctx.lineTo(x+TILE-5,y+TILE-6);
    ctx.lineTo(x+TILE/2,y+TILE-14);
    ctx.lineTo(x+5,y+TILE-6);
    ctx.closePath();
    ctx.fill();
  }
  function drawTank(tank, color){
    ctx.save();
    ctx.translate(tank.x+tank.w/2, tank.y+tank.h/2);
    var rot = {up:0, right:Math.PI/2, down:Math.PI, left:-Math.PI/2}[tank.dir];
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.fillRect(-tank.w/2,-tank.h/2,tank.w,tank.h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-tank.w/2,-tank.h/2,4,tank.h);
    ctx.fillRect(tank.w/2-4,-tank.h/2,4,tank.h);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-3,-tank.h/2-6,6,tank.h/2+6);
    ctx.restore();
  }
  function drawBullet(b){
    if (b.type==='bomb'){
      ctx.fillStyle = '#ff8a4a';
      ctx.beginPath();
      ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2, 0, Math.PI*2);
      ctx.fill();
    } else if (b.type==='laser'){
      ctx.save();
      ctx.translate(b.x+b.w/2, b.y+b.h/2);
      var angle = Math.atan2(b.vy||1, b.vx||0);
      ctx.rotate(angle - Math.PI/2);
      ctx.fillStyle = '#ff3ea5';
      ctx.fillRect(-3, -9, 6, 18);
      ctx.restore();
    } else {
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }
  function drawBossHpBar(boss){
    var w = boss.w;
    var x = boss.x, y = boss.y-10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#ff3e3e';
    ctx.fillRect(x, y, w*Math.max(0,boss.hp/boss.maxHp), 5);
  }
  function drawParticles(){
    particles.forEach(function(p){
      var frac = 1-p.age/p.life;
      ctx.globalAlpha = Math.max(0,frac);
      ctx.fillStyle = frac>0.5 ? '#ffd23f' : '#ff5a3c';
      ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function render(t){
    ctx.fillStyle = '#0d0f0a';
    ctx.fillRect(0,0,COLS*TILE,ROWS*TILE);
    if (grid){
      for (var r=0;r<ROWS;r++){
        for (var c=0;c<COLS;c++){
          var cell = grid[r][c];
          var x=c*TILE, y=r*TILE;
          if (cell===BRICK) drawBrick(x,y);
          else if (cell===STEEL) drawSteel(x,y);
          else if (cell===BASE) drawBase(x,y);
        }
      }
    }
    bullets.forEach(drawBullet);
    if (player && player.alive && !player.respawning){
      var blink = player.invuln>0 && !reducedMotion && Math.floor(t*10)%2===0;
      if (!blink) drawTank(player, '#f4d03f');
    }
    enemies.forEach(function(e){
      if (!e.alive) return;
      if (e.type==='boss'){
        drawTank(e, '#ff3e3e');
        drawBossHpBar(e);
      } else {
        drawTank(e, (ENEMY_TYPES[e.type]||ENEMY_TYPES.normal).color);
      }
    });
    drawParticles();
  }

  var lastTime = null;
  var tanksLoopRunning = false;
  function startTanksLoop(){
    if (tanksLoopRunning) return;
    tanksLoopRunning = true;
    lastTime = null;
    requestAnimationFrame(loop);
  }
  function pauseTanksLoop(){
    tanksLoopRunning = false;
    dirStack.length = 0;
  }
  function loop(ts){
    if (!tanksLoopRunning) return;
    if (lastTime===null) lastTime = ts;
    var dt = Math.min(0.033, (ts-lastTime)/1000);
    lastTime = ts;
    var t = ts/1000;
    tick(dt);
    updateParticles(dt);
    render(t);
    requestAnimationFrame(loop);
  }

  function startLevel(){
    gameState = 'play';
    currentCfg = getLevelConfig(currentLevel);
    var mapData = generateMap(currentCfg);
    grid = mapData.grid; baseRow = mapData.baseRow; baseCol = mapData.baseCol;
    enemies = []; bullets = []; particles = [];
    lives = LIVES_START;
    dirStack.length = 0;

    var spawnX = (baseCol-3)*TILE + (TILE-PLAYER_SIZE)/2;
    var spawnY = (ROWS-1)*TILE + (TILE-PLAYER_SIZE)/2;
    player = makeTank(spawnX, spawnY, true);
    player.maxBullets = currentCfg.playerMaxBullets;
    player.invuln = INVULN_TIME;
    player.bombCooldown = 0;

    if (currentCfg.isBoss){
      totalEnemies = 1;
      spawnedEnemies = 1;
      var bossW = ENEMY_SIZE*1.8;
      var boss = makeBoss((COLS*TILE-bossW)/2, TILE*1.5, currentCfg.bossHp);
      enemies.push(boss);
    } else {
      totalEnemies = currentCfg.totalEnemies;
      spawnedEnemies = 0;
      spawnTimer = 0.6;
    }
    killedCount = 0;

    updateHUD();
    startOverlay.classList.add('is-hidden');
    clearOverlay.classList.add('is-hidden');
    overOverlay.classList.add('is-hidden');
    tBomb.style.display = currentCfg.bombUnlocked ? '' : 'none';
    ensureAudio();
    startTanksLoop();
  }

  function showTanksIntro(){
    var cfg = getLevelConfig(currentLevel);
    var hint = 'Usá las flechas para mover tu tanque y Espacio para disparar. Destruí a todos los enemigos sin perder tu base ni tus vidas.';
    if (cfg.isBoss){
      startTitleEl.textContent = '¿Listo para el Jefe del Nivel '+currentLevel+'?';
      hint = '¡Apareció un tanque JEFE! Aguanta varios disparos, invoca refuerzos rápidos y dispara láseres. Usá tus bombas (tecla B o el botón 💣) para hacerle más daño.';
    } else {
      startTitleEl.textContent = '¿Listo para el Nivel '+currentLevel+'?';
      if (currentLevel===2) hint += ' ¡Cuidado, aparecen tanques verdes que disparan el doble de rápido!';
      else if (currentLevel===3) hint += ' Ahora tu tanque también dispara más rápido, ¡pero cuidado con los tanques morados que tiran bombas!';
      else if (currentLevel===4) hint += ' ¡Ya podés tirar una bomba con la tecla B (o el botón 💣) para destruir varios enemigos a la vez!';
    }
    startDescEl.textContent = hint;
  }
  showTanksIntro();

  startBtn.addEventListener('click', startLevel);
  retryBtn.addEventListener('click', startLevel);
  nextBtn.addEventListener('click', function(){
    currentLevel += 1;
    showTanksIntro();
    startLevel();
  });
  resetBtn.addEventListener('click', function(){
    currentLevel = 1;
    showTanksIntro();
    startLevel();
  });

  var initialCfg = getLevelConfig(1);
  var initialMap = generateMap(initialCfg);
  grid = initialMap.grid; baseRow = initialMap.baseRow; baseCol = initialMap.baseCol;
  tBomb.style.display = initialCfg.bombUnlocked ? '' : 'none';
  render(0);
})();

