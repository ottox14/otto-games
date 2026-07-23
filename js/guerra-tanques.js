// Guerra de Tanques: campana de 20 niveles al estilo Battle City. Tu tanque
// conserva las mejoras que vas desbloqueando nivel a nivel (velocidad, cadencia,
// vida, escudo, patron de disparo, etc). Cada nivel trae un enemigo distinto y
// un mapa con su propia mecanica de terreno. Los niveles 5/10/15/20 son jefes;
// al vencer al Nivel 20 desbloqueas el Tanque Legendario.
(function(){
  var TILE = 32, COLS = 13, ROWS = 13;
  var EMPTY=0, BRICK=1, STEEL=2, BASE=3, CRATE=4, ROCK=5, WATER=6, SAND=7,
      ICE=8, ELECTRIC=9, PORTAL_A=10, PORTAL_B=11, TOGGLE=12, CONVEYOR=13, BARREL=14;

  var PLAYER_SIZE = 26, ENEMY_SIZE = 26, BULLET_SIZE = 5;
  var PLAYER_SPEED = 130, PLAYER_BULLET_SPEED = 300, ENEMY_BULLET_SPEED = 200;
  var RESPAWN_DELAY = 1.2, INVULN_TIME = 1.5;
  var MAX_CONCURRENT_ENEMIES = 4;
  var SPAWN_COLS = [1, 6, 11];
  var BOMB_SPEED = 150, BOMB_RADIUS = 50;
  var LASER_SPEED = 420;
  var PLAYER_BOMB_COOLDOWN = 4;
  var BASE_HP = 3;

  // ---------- Definicion de los 20 niveles ----------
  var LEVELS = [
    {n:1,  enemy:'recluta',       map:'open',   upgrade:{key:'speed', mult:1.10,  label:'+10% velocidad'}},
    {n:2,  enemy:'doble',         map:'cover',  upgrade:{key:'fireRate', mult:0.85, label:'+15% velocidad de disparo'}},
    {n:3,  enemy:'bombardero',    map:'boxes',  upgrade:{key:'maxHp', mult:1.20,  label:'+20% vida máxima'}},
    {n:4,  enemy:'francotirador', map:'rocks',  upgrade:{key:'speed', mult:1.10,  label:'+10% velocidad de movimiento'}},
    {n:5,  enemy:null, boss:'laser',  map:'boss1', upgrade:{key:'shotPattern', value:'double', label:'Doble disparo permanente'}},
    {n:6,  enemy:'escudo',        map:'bridges',upgrade:{key:'damage', mult:1.20, label:'+20% daño'}},
    {n:7,  enemy:'rebote',        map:'maze',   upgrade:{key:'bulletSpeed', mult:1.25, label:'Balas más rápidas'}},
    {n:8,  enemy:'lanzaminas',    map:'mines',  upgrade:{key:'fireRate', mult:0.85, label:'Mayor velocidad de recarga'}},
    {n:9,  enemy:'congelador',    map:'barrels',upgrade:{key:'shield', value:1, label:'Escudo que bloquea un disparo'}},
    {n:10, enemy:null, boss:'spider', map:'boss2', upgrade:{key:'shotPattern', value:'triple', label:'Triple disparo'}},
    {n:11, enemy:'kamikaze',      map:'river',  upgrade:{key:'maxHp', mult:1.25, label:'+25% vida'}},
    {n:12, enemy:'triple',        map:'sand',   upgrade:{key:'maxBullets', value:1, label:'Mayor alcance de disparo'}},
    {n:13, enemy:'electrico',     map:'electric',upgrade:{key:'pierce', value:true, label:'Balas perforantes'}},
    {n:14, enemy:'fantasma',      map:'fog',    upgrade:{key:'dodge', value:0.15, label:'Probabilidad de esquivar un disparo'}},
    {n:15, enemy:null, boss:'giant',  map:'boss3', upgrade:{key:'laserCannon', value:true, label:'Cañón láser'}},
    {n:16, enemy:'lanzallamas',   map:'ice',    upgrade:{key:'speed', mult:1.15, label:'+15% velocidad'}},
    {n:17, enemy:'magnetico',     map:'portals',upgrade:{key:'homing', value:true, label:'Misiles guiados'}},
    {n:18, enemy:'misilero',      map:'meteors',upgrade:{key:'shieldRegen', value:true, label:'Escudo regenerativo'}},
    {n:19, enemy:'experimental',  map:'shifting',upgrade:{key:'shotPattern', value:'quad', label:'Disparo cuádruple'}},
    {n:20, enemy:null, boss:'supreme', map:'boss4', upgrade:{key:'legendary', value:true, label:'Tanque Legendario desbloqueado'}}
  ];

  var ENEMY_DEFS = {
    recluta:       {color:'#c2a878', speedMult:1,    fireMin:1.3, fireMax:2.4},
    doble:         {color:'#3b6fd1', speedMult:1,    fireMin:1.6, fireMax:2.4, pattern:'double'},
    bombardero:    {color:'#e07b2e', speedMult:0.85, fireMin:2.6, fireMax:4.0, bulletType:'bomb'},
    francotirador: {color:'#8a4fd1', speedMult:0.8,  fireMin:2.2, fireMax:3.2, sniper:true},
    escudo:        {color:'#3a3f45', accent:'#4fa8ff', speedMult:0.9, fireMin:1.6, fireMax:2.6, shielded:true},
    rebote:        {color:'#3ecfcf', speedMult:1,    fireMin:1.4, fireMax:2.2, bounces:1},
    lanzaminas:    {color:'#8a6d3b', speedMult:0.9,  fireMin:99,  fireMax:99,  minelayer:true},
    congelador:    {color:'#7fd6ff', speedMult:0.85, fireMin:1.8, fireMax:2.8, freeze:true},
    kamikaze:      {color:'#ff3e3e', speedMult:1.7,  fireMin:99,  fireMax:99,  rush:true},
    triple:        {color:'#e08a2b', speedMult:1,    fireMin:1.8, fireMax:2.6, pattern:'spread3'},
    electrico:     {color:'#ffe94a', speedMult:1,    fireMin:1.3, fireMax:2.0, bulletSpeedMult:2.4},
    fantasma:      {color:'#cbb8ff', speedMult:1,    fireMin:1.6, fireMax:2.4, phasing:true},
    lanzallamas:   {color:'#ff6a3c', speedMult:0.9,  fireMin:99,  fireMax:99,  flamer:true},
    magnetico:     {color:'#38e0c0', speedMult:1,    fireMin:1.6, fireMax:2.4, homingBullet:true},
    misilero:      {color:'#b23bd6', speedMult:0.85, fireMin:2.4, fireMax:3.4, missile:true},
    experimental:  {color:'#ff3ea5', speedMult:1,    fireMin:1.4, fireMax:2.2, experimental:true}
  };
  var BOSS_DEFS = {
    laser:   {color:'#1a1a1a', accent:'#ff3e3e', hp:14, speed:40, label:'Jefe Láser'},
    spider:  {color:'#1a1a1a', accent:'#ff5c8a', hp:22, speed:65, label:'Jefe Araña'},
    giant:   {color:'#1a1a1a', accent:'#ff7a3e', hp:34, speed:26, label:'Jefe Gigante'},
    supreme: {color:'#1a1a1a', accent:'#ffd23f', hp:48, speed:44, label:'Tanque Supremo'}
  };
  var OPPOSITE_DIR = {up:'down', down:'up', left:'right', right:'left'};

  function levelDef(n){ return LEVELS[Math.min(n,LEVELS.length)-1]; }
  function isBossLevel(n){ return !!levelDef(n).boss; }

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
  var hpEl = document.getElementById('tanksHpVal');
  var startOverlay = document.getElementById('tanksStartOverlay');
  var startTitleEl = document.getElementById('tanksStartTitle');
  var startDescEl = document.getElementById('tanksStartDesc');
  var startBtn = document.getElementById('tanksStartBtn');
  var clearOverlay = document.getElementById('tanksClearOverlay');
  var clearTitleEl = document.getElementById('tanksClearTitle');
  var clearDescEl = document.getElementById('tanksClearDesc');
  var nextBtn = document.getElementById('tanksNextBtn');
  var overOverlay = document.getElementById('tanksOverOverlay');
  var overTitleEl = document.getElementById('tanksOverTitle');
  var overLevelEl = document.getElementById('tanksOverLevel');
  var retryBtn = document.getElementById('tanksRetryBtn');
  var resetBtn = document.getElementById('tanksResetBtn');
  var tJoystick = document.getElementById('tJoystick');
  var tFire = document.getElementById('tFire');
  var tBomb = document.getElementById('tBomb');

  var timeEl = document.getElementById('tanksTimeVal');
  var pauseBtn = document.getElementById('tanksPauseBtn');
  var pauseOverlay = document.getElementById('tanksPauseOverlay');
  var resumeBtn = document.getElementById('tanksResumeBtn');
  var panelEnemyEl = document.getElementById('tanksPanelEnemy');
  var panelMapEl = document.getElementById('tanksPanelMap');
  var panelRemainingEl = document.getElementById('tanksPanelRemaining');
  var panelLevelEl = document.getElementById('tanksPanelLevel');
  var panelUpgradeEl = document.getElementById('tanksPanelUpgrade');
  var progressBlockEl = document.getElementById('tanksProgressBlock');
  var statDamageEl = document.getElementById('tanksStatDamage');
  var statSpeedEl = document.getElementById('tanksStatSpeed');
  var statHpEl = document.getElementById('tanksStatHp');
  var statFireRateEl = document.getElementById('tanksStatFireRate');
  var statArmorEl = document.getElementById('tanksStatArmor');
  var tankPreviewEl = document.getElementById('tanksTankPreview');
  var abilitySlotEl = document.getElementById('tanksAbilitySlot');
  var cooldownFillEl = document.getElementById('tanksCooldownFill');
  var weaponValEl = document.getElementById('tanksWeaponVal');
  var ammoValEl = document.getElementById('tanksAmmoVal');

  function tanksActive(){ return !tanksView.classList.contains('is-hidden'); }

  playTanksBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    tanksView.classList.remove('is-hidden');
    if (gameState === 'play' && !isPaused) startTanksLoop();
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

  // ---------- Mejoras permanentes del jugador (persisten entre niveles) ----------
  function freshUpgrades(){
    return {
      speedMult:1, fireRateMult:1, maxHpMult:1, damageMult:1, bulletSpeedMult:1,
      maxBulletsBonus:0, shotPattern:'single', shieldMax:0, shieldRegen:false,
      pierce:false, dodge:0, homing:false, laserCannon:false, legendary:false
    };
  }
  var upgrades = freshUpgrades();
  function applyLevelUpgrade(def){
    var u = def.upgrade;
    if (!u) return;
    if (u.key==='speed') upgrades.speedMult *= u.mult;
    else if (u.key==='fireRate') upgrades.fireRateMult *= u.mult;
    else if (u.key==='maxHp') upgrades.maxHpMult *= u.mult;
    else if (u.key==='damage') upgrades.damageMult *= u.mult;
    else if (u.key==='bulletSpeed') upgrades.bulletSpeedMult *= u.mult;
    else if (u.key==='maxBullets') upgrades.maxBulletsBonus += u.value;
    else if (u.key==='shotPattern') upgrades.shotPattern = u.value;
    else if (u.key==='shield') upgrades.shieldMax += u.value;
    else if (u.key==='pierce') upgrades.pierce = true;
    else if (u.key==='dodge') upgrades.dodge = Math.min(0.6, upgrades.dodge+u.value);
    else if (u.key==='homing') upgrades.homing = true;
    else if (u.key==='laserCannon') upgrades.laserCannon = true;
    else if (u.key==='shieldRegen') upgrades.shieldRegen = true;
    else if (u.key==='legendary') upgrades.legendary = true;
  }

  // ---------- Generacion de mapa ----------
  function emptyGrid(){
    var grid = [];
    for (var r=0; r<ROWS; r++) grid.push(new Array(COLS).fill(EMPTY));
    return grid;
  }
  function placeBase(grid){
    var baseRow = ROWS-2, baseCol = Math.floor(COLS/2);
    grid[baseRow][baseCol] = BASE;
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1]].forEach(function(o){
      var rr = baseRow+o[0], cc = baseCol+o[1];
      if (rr>=0 && rr<ROWS && cc>=0 && cc<COLS) grid[rr][cc] = BRICK;
    });
    return {baseRow:baseRow, baseCol:baseCol};
  }
  function inSafeZone(r,c,baseRow,baseCol){
    if (r<=1) return true; // fila de spawn de enemigos
    if (r>=ROWS-3 && Math.abs(c-baseCol)<=2) return true; // zona de base/spawn jugador
    return false;
  }
  function scatterTiles(grid, baseRow, baseCol, tileType, count, opts){
    opts = opts || {};
    var placed = 0, tries = 0;
    while (placed < count && tries < count*12){
      tries++;
      var r = 2+Math.floor(Math.random()*(ROWS-5));
      var c = 1+Math.floor(Math.random()*(COLS-2));
      if (inSafeZone(r,c,baseRow,baseCol)) continue;
      if (grid[r][c] !== EMPTY) continue;
      grid[r][c] = tileType;
      placed++;
      if (opts.pairWith && Math.random()<0.5){
        var c2 = c+(Math.random()<0.5?1:-1);
        if (c2>=1 && c2<COLS-1 && grid[r][c2]===EMPTY && !inSafeZone(r,c2,baseRow,baseCol)){
          grid[r][c2] = tileType;
        }
      }
    }
  }
  function buildBridgeMap(grid, baseRow, baseCol, lanes){
    for (var r=2;r<ROWS-3;r++){
      for (var c=1;c<COLS-1;c++){
        if (lanes.indexOf(c)===-1) grid[r][c] = WATER;
      }
    }
  }
  function buildMaze(grid, baseRow, baseCol){
    for (var r=2;r<ROWS-3;r++){
      for (var c=1;c<COLS-1;c++){
        if (inSafeZone(r,c,baseRow,baseCol)) continue;
        var edge = (r%2===0) ? (Math.random()<0.65) : (c%3===0 && Math.random()<0.8);
        if (edge) grid[r][c] = BRICK;
      }
    }
  }

  var hazards; // {mines:[], barrels handled as tiles, turrets:[]}
  var portalPairs, toggleWalls, conveyorTiles, meteorState, fogLevel;

  function buildMap(theme, n){
    var grid = emptyGrid();
    var base = placeBase(grid);
    hazards = {mines:[], turrets:[]};
    portalPairs = []; toggleWalls = []; conveyorTiles = []; fogLevel = false;
    meteorState = {timer: 3+Math.random()*2, warnings:[]};

    var brickCount = 8 + n, steelCount = 3 + Math.floor(n/3);
    switch(theme){
      case 'open':
        break;
      case 'cover':
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, brickCount, {pairWith:true});
        scatterTiles(grid, base.baseRow, base.baseCol, STEEL, steelCount);
        break;
      case 'boxes':
        scatterTiles(grid, base.baseRow, base.baseCol, CRATE, brickCount+6, {pairWith:true});
        break;
      case 'rocks':
        scatterTiles(grid, base.baseRow, base.baseCol, ROCK, 8);
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, 6);
        break;
      case 'boss1':
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, 10, {pairWith:true});
        break;
      case 'bridges':
        buildBridgeMap(grid, base.baseRow, base.baseCol, [1,6,11]);
        break;
      case 'maze':
        buildMaze(grid, base.baseRow, base.baseCol);
        break;
      case 'mines':
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, 6);
        for (var m=0;m<7;m++){
          var mr = 2+Math.floor(Math.random()*(ROWS-5)), mc = 1+Math.floor(Math.random()*(COLS-2));
          if (!inSafeZone(mr,mc,base.baseRow,base.baseCol)) hazards.mines.push({x:mc*TILE+TILE/2, y:mr*TILE+TILE/2, r:14, armed:true});
        }
        break;
      case 'barrels':
        scatterTiles(grid, base.baseRow, base.baseCol, BARREL, 6);
        break;
      case 'boss2':
        for (var br=3; br<ROWS-4; br+=2){
          for (var bc=2; bc<COLS-2; bc+=3){
            if (!inSafeZone(br,bc,base.baseRow,base.baseCol)) grid[br][bc] = STEEL;
          }
        }
        break;
      case 'river':
        buildBridgeMap(grid, base.baseRow, base.baseCol, [2,3,9,10]);
        break;
      case 'sand':
        scatterTiles(grid, base.baseRow, base.baseCol, SAND, 20);
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, 5);
        break;
      case 'electric':
        scatterTiles(grid, base.baseRow, base.baseCol, ELECTRIC, 14);
        break;
      case 'fog':
        fogLevel = true;
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, brickCount, {pairWith:true});
        break;
      case 'boss3':
        for (var cr=3; cr<ROWS-4; cr++){
          var dir = cr%2===0 ? 'right' : 'left';
          for (var cc=2; cc<COLS-2; cc++){
            if (inSafeZone(cr,cc,base.baseRow,base.baseCol)) continue;
            if ((cr+cc)%3===0){ grid[cr][cc]=CONVEYOR; conveyorTiles.push({r:cr,c:cc,dir:dir}); }
          }
        }
        break;
      case 'ice':
        for (var ir=2; ir<ROWS-3; ir++){
          for (var ic=1; ic<COLS-1; ic++){
            if (inSafeZone(ir,ic,base.baseRow,base.baseCol)) continue;
            if (Math.random()<0.55) grid[ir][ic] = ICE;
          }
        }
        scatterTiles(grid, base.baseRow, base.baseCol, ROCK, 5);
        break;
      case 'portals':
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, 6);
        for (var pp=0; pp<2; pp++){
          var pa = findEmptyCell(grid, base), pb = findEmptyCell(grid, base);
          if (pa && pb){
            grid[pa.r][pa.c] = PORTAL_A; grid[pb.r][pb.c] = PORTAL_B;
            portalPairs.push({a:pa, b:pb});
          }
        }
        break;
      case 'meteors':
        scatterTiles(grid, base.baseRow, base.baseCol, BRICK, 5);
        break;
      case 'shifting':
        for (var tr=2; tr<ROWS-3; tr++){
          for (var tc=1; tc<COLS-1; tc++){
            if (inSafeZone(tr,tc,base.baseRow,base.baseCol)) continue;
            if ((tr*3+tc)%5===0){ toggleWalls.push({r:tr,c:tc,phase:Math.random()*3}); }
          }
        }
        break;
      case 'boss4':
        for (var fr=2; fr<ROWS-3; fr++){
          for (var fc=1; fc<COLS-1; fc++){
            if (inSafeZone(fr,fc,base.baseRow,base.baseCol)) continue;
            var pick = Math.random();
            if (pick<0.12) grid[fr][fc] = ICE;
            else if (pick<0.22) grid[fr][fc] = ELECTRIC;
            else if (pick<0.28) grid[fr][fc] = ROCK;
            else if (pick<0.34) grid[fr][fc] = BARREL;
          }
        }
        var qa = findEmptyCell(grid, base), qb = findEmptyCell(grid, base);
        if (qa && qb){ grid[qa.r][qa.c]=PORTAL_A; grid[qb.r][qb.c]=PORTAL_B; portalPairs.push({a:qa,b:qb}); }
        hazards.turrets.push({x:2*TILE+TILE/2, y:5*TILE+TILE/2, dir:'right', timer:2});
        hazards.turrets.push({x:(COLS-3)*TILE+TILE/2, y:5*TILE+TILE/2, dir:'left', timer:2.6});
        break;
    }
    toggleWalls.forEach(function(tw){ grid[tw.r][tw.c] = TOGGLE; });
    return {grid:grid, baseRow:base.baseRow, baseCol:base.baseCol};
  }
  function findEmptyCell(grid, base){
    for (var tries=0; tries<40; tries++){
      var r = 2+Math.floor(Math.random()*(ROWS-5)), c = 1+Math.floor(Math.random()*(COLS-2));
      if (!inSafeZone(r,c,base.baseRow,base.baseCol) && grid[r][c]===EMPTY) return {r:r,c:c};
    }
    return null;
  }

  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  var grid, baseRow, baseCol, currentLevelDef, currentEnemyDef;
  var player = null;
  var enemies = [];
  var bullets = [];
  var particles = [];
  var flames = [];
  var currentLevel = 1;
  var lives = 3;
  var totalEnemies = 0, spawnedEnemies = 0, killedCount = 0;
  var spawnTimer = 0;
  var respawnTimer = 0;
  var gameState = 'start';
  var shiftTimer = 0;
  var levelElapsed = 0;
  var isPaused = false;

  function cellBlockedFor(cell, phase){
    if (cell===BRICK || cell===STEEL || cell===BASE || cell===ROCK || cell===CRATE || cell===BARREL || cell===WATER) return true;
    if (cell===TOGGLE) return phase!=='open';
    return false;
  }
  function togglePhaseAt(r,c){
    var tw = null;
    for (var i=0;i<toggleWalls.length;i++){ if (toggleWalls[i].r===r && toggleWalls[i].c===c){ tw=toggleWalls[i]; break; } }
    if (!tw) return 'open';
    var t = (shiftTimer+tw.phase) % 3;
    return t < 1.8 ? 'closed' : 'open';
  }
  function isBlockedForTank(x,y,w,h,exclude,canPhase){
    if (x<0 || y<0 || x+w>COLS*TILE || y+h>ROWS*TILE) return true;
    var c0=Math.floor(x/TILE), c1=Math.floor((x+w-1)/TILE);
    var r0=Math.floor(y/TILE), r1=Math.floor((y+h-1)/TILE);
    for (var r=r0;r<=r1;r++){
      for (var c=c0;c<=c1;c++){
        var cell = grid[r][c];
        if (canPhase && cell===BRICK) continue;
        if (cell===TOGGLE){ if (cellBlockedFor(cell, togglePhaseAt(r,c))) return true; continue; }
        if (cellBlockedFor(cell)) return true;
      }
    }
    var testBox = {x:x,y:y,w:w,h:h};
    if (player && player.alive && !player.respawning && player!==exclude && rectsOverlap(testBox, player)) return true;
    for (var i=0;i<enemies.length;i++){
      var e = enemies[i];
      if (e.alive && e!==exclude && !e.phased && rectsOverlap(testBox, e)) return true;
    }
    return false;
  }

  var nextTankId = 1;
  function makeTank(x,y,isPlayer,type){
    var def = isPlayer ? null : (ENEMY_DEFS[type] || ENEMY_DEFS.recluta);
    return {
      id: nextTankId++,
      x:x, y:y, w:isPlayer?PLAYER_SIZE:ENEMY_SIZE, h:isPlayer?PLAYER_SIZE:ENEMY_SIZE,
      dir:'up', speed: isPlayer?(PLAYER_SPEED*upgrades.speedMult):90,
      isPlayer:isPlayer, type:type||'normal', alive:true, respawning:false,
      bulletCount:0, maxBullets: isPlayer?(1+upgrades.maxBulletsBonus):1,
      invuln:0, bombCooldown:0, hp: isPlayer?Math.max(1,Math.round(BASE_HP*upgrades.maxHpMult)):1,
      shield: isPlayer?upgrades.shieldMax:0, shieldMax: isPlayer?upgrades.shieldMax:0,
      shieldRegenTimer:0, frozenTimer:0, glideDir:null, glideTime:0,
      moveTimer:0, fireTimer: isPlayer?0:(def?def.fireMin+Math.random()*(def.fireMax-def.fireMin):1.5),
      snipeState:'idle', snipeTimer:0, snipeAngle:0,
      mineTimer: def&&def.minelayer ? (1.5+Math.random()*1.5) : 0,
      flameTimer: def&&def.flamer ? (1.2+Math.random()*1.2) : 0,
      phaseTimer: def&&def.phasing ? 2 : 0, phased:false,
      weaponTimer: def&&def.experimental ? 3.5 : 0, weaponIndex:0,
      portalCooldown:0
    };
  }

  function makeBoss(bossKey, x, y){
    var def = BOSS_DEFS[bossKey];
    var hp = Math.round(def.hp + currentLevel*0.4);
    return {
      id: nextTankId++,
      x:x, y:y, w:ENEMY_SIZE*1.9, h:ENEMY_SIZE*1.9,
      dir:'left', speed:def.speed, bossKey:bossKey,
      isPlayer:false, type:'boss', alive:true, respawning:false, phased:false,
      bulletCount:0, maxBullets:3, invuln:0,
      hp:hp, maxHp:hp, moveTimer:1,
      phaseTimer: 2.5+Math.random(), shieldTimer:0, telegraph:0
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
    if (!isBlockedForTank(nx, ny, tank.w, tank.h, tank, tank.phased)){
      tank.x = nx; tank.y = ny;
    }
  }

  // Efectos de terreno: hielo (desliza), arena (frena), cinta (empuja), portal.
  function terrainAt(tank){
    var cx = tank.x+tank.w/2, cy = tank.y+tank.h/2;
    var c = Math.floor(cx/TILE), r = Math.floor(cy/TILE);
    if (r<0||r>=ROWS||c<0||c>=COLS) return {cell:EMPTY,r:r,c:c};
    return {cell:grid[r][c], r:r, c:c};
  }
  function applyTerrain(tank, dt){
    var t = terrainAt(tank);
    if (t.cell===ICE){
      if (tank.dir) { tank.glideDir = tank.dir; tank.glideTime = 0.35; }
    } else if (tank.glideTime>0 && !isMoving(tank)){
      tank.glideTime -= dt;
      moveTank(tank, tank.glideDir, dt*0.8);
    }
    if (t.cell===SAND) tank.sandSlow = true; else tank.sandSlow = false;
    if (t.cell===CONVEYOR){
      var cv = null;
      for (var i=0;i<conveyorTiles.length;i++){ if (conveyorTiles[i].r===t.r && conveyorTiles[i].c===t.c){ cv=conveyorTiles[i]; break; } }
      if (cv) moveTank(tank, cv.dir, dt*0.6);
    }
    if (t.cell===ELECTRIC && Math.floor(performance.now()/500)%2===0){
      damageEntity(tank, 1, 'electric');
    }
    if ((t.cell===PORTAL_A || t.cell===PORTAL_B) && tank.portalCooldown<=0){
      var pair = portalPairs.filter(function(p){ return (p.a.r===t.r&&p.a.c===t.c) || (p.b.r===t.r&&p.b.c===t.c); })[0];
      if (pair){
        var dest = (pair.a.r===t.r && pair.a.c===t.c) ? pair.b : pair.a;
        tank.x = dest.c*TILE + (TILE-tank.w)/2;
        tank.y = dest.r*TILE + (TILE-tank.h)/2;
        tank.portalCooldown = 0.8;
        beep(600,0.08,'sine');
      }
    }
    if (tank.portalCooldown>0) tank.portalCooldown -= dt;
  }
  function isMoving(tank){ return false; } // el deslizamiento se controla via glideTime

  function randomDir(){
    var dirs = ['up','down','left','right'];
    return dirs[Math.floor(Math.random()*dirs.length)];
  }

  function bulletAngleFromDir(dir){
    return {up:-Math.PI/2, down:Math.PI/2, left:Math.PI, right:0}[dir];
  }
  function fireBullet(tank, opts){
    opts = opts || {};
    var pattern = opts.pattern || 'single';
    var count = pattern==='double'?2 : (pattern==='spread3'||pattern==='triple')?3 : pattern==='quad'?4 : 1;
    if (tank.bulletCount + count > tank.maxBullets && tank.isPlayer){
      count = Math.max(0, tank.maxBullets - tank.bulletCount);
      if (count<=0) return;
    } else if (!tank.isPlayer && tank.bulletCount >= tank.maxBullets){
      return;
    }
    var baseAngle = opts.angle !== undefined ? opts.angle : bulletAngleFromDir(tank.dir);
    var type = opts.type || 'normal';
    var speedBase = tank.isPlayer
      ? PLAYER_BULLET_SPEED*upgrades.bulletSpeedMult*(type==='bomb'?BOMB_SPEED/PLAYER_BULLET_SPEED:1)
      : (type==='bomb'?BOMB_SPEED:(type==='laser'?LASER_SPEED:ENEMY_BULLET_SPEED*(opts.speedMult||1)));
    var w = type==='bomb'?10:(type==='laser'?7:BULLET_SIZE);
    var h = type==='bomb'?10:(type==='laser'?14:BULLET_SIZE);
    var cx = tank.x+tank.w/2, cy = tank.y+tank.h/2;
    var spreadStep = (pattern==='spread3'||pattern==='triple') ? 0.26 : pattern==='quad' ? 0.42/3 : 0;
    for (var i=0;i<count;i++){
      var ang = baseAngle;
      if (pattern==='double'){
        var perp = baseAngle+Math.PI/2;
        var off = (i===0?-6:6);
        var bx = cx+Math.cos(perp)*off, by = cy+Math.sin(perp)*off;
      } else if (pattern==='spread3'||pattern==='triple'){
        ang = baseAngle + (i-1)*spreadStep;
        var bx = cx, by = cy;
      } else if (pattern==='quad'){
        ang = baseAngle + (i-1.5)*spreadStep;
        var bx = cx, by = cy;
      } else {
        var bx = cx, by = cy;
      }
      var b = {
        x:bx-w/2, y:by-h/2, w:w, h:h, vx:Math.cos(ang), vy:Math.sin(ang), speed:speedBase,
        owner:tank, dead:false, type:type, bounces: opts.bounces||0,
        pierce: !!opts.pierce, hitOnce:{}, homing: !!opts.homing, missile: !!opts.missile
      };
      tank.bulletCount += 1;
      bullets.push(b);
    }
    tank.recoil = 1; tank.muzzle = 1; // puramente visual: retroceso del cañon + destello
    beep(tank.isPlayer?720:(type==='bomb'?300:(type==='laser'?900:420)), 0.05, 'square');
  }

  function killBullet(b){
    if (b.dead) return;
    b.dead = true;
    b.owner.bulletCount = Math.max(0, b.owner.bulletCount-1);
  }

  // ---------- Particulas (todo puramente visual, no afecta la jugabilidad) ----------
  function spawnExplosion(cx,cy){
    for (var i=0;i<8;i++){
      var ang = Math.random()*Math.PI*2, speed = 60+Math.random()*80;
      particles.push({
        kind:'spark', x:cx, y:cy, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
        life:0.3+Math.random()*0.2, age:0, size:3+Math.random()*3
      });
    }
    for (var j=0;j<5;j++){
      var ang2 = Math.random()*Math.PI*2, speed2 = 15+Math.random()*25;
      particles.push({
        kind:'debris', x:cx, y:cy, vx:Math.cos(ang2)*speed2, vy:Math.sin(ang2)*speed2-40,
        life:0.5+Math.random()*0.3, age:0, size:2+Math.random()*3, color:'#4a4038', rot:Math.random()*6
      });
    }
    for (var k=0;k<4;k++){
      var ang3 = Math.random()*Math.PI*2, speed3 = 10+Math.random()*20;
      particles.push({
        kind:'smoke', x:cx, y:cy, vx:Math.cos(ang3)*speed3, vy:Math.sin(ang3)*speed3-10,
        life:0.6+Math.random()*0.4, age:0, size:5+Math.random()*4
      });
    }
  }
  function spawnSparks(cx,cy){
    for (var i=0;i<5;i++){
      var ang = Math.random()*Math.PI*2, speed = 40+Math.random()*50;
      particles.push({
        kind:'spark', x:cx, y:cy, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
        life:0.16+Math.random()*0.12, age:0, size:2+Math.random()*2
      });
    }
  }
  function spawnDust(cx,cy){
    particles.push({
      kind:'dust', x:cx+(Math.random()*6-3), y:cy+(Math.random()*6-3),
      vx:(Math.random()*10-5), vy:(Math.random()*10-5)-4,
      life:0.4+Math.random()*0.3, age:0, size:3+Math.random()*2
    });
  }
  function spawnBulletSmoke(x,y){
    particles.push({kind:'smoke', x:x, y:y, vx:0, vy:0, life:0.14, age:0, size:2});
  }
  function spawnBrickDebris(cx,cy){
    for (var i=0;i<7;i++){
      var ang = Math.random()*Math.PI*2, speed = 30+Math.random()*60;
      particles.push({
        kind:'debris', x:cx, y:cy, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed-30,
        life:0.4+Math.random()*0.3, age:0, size:2+Math.random()*3, color:'#b6531c', rot:Math.random()*6
      });
    }
    for (var j=0;j<4;j++){
      var ang2 = Math.random()*Math.PI*2, speed2 = 8+Math.random()*14;
      particles.push({
        kind:'dust', x:cx, y:cy, vx:Math.cos(ang2)*speed2, vy:Math.sin(ang2)*speed2-6,
        life:0.35+Math.random()*0.2, age:0, size:2.5+Math.random()*2
      });
    }
  }
  function spawnBaseDestruction(cx,cy){
    spawnExplosion(cx,cy);
    spawnExplosion(cx,cy);
    for (var i=0;i<10;i++){
      var ang = Math.random()*Math.PI*2, speed = 30+Math.random()*70;
      particles.push({
        kind:'debris', x:cx, y:cy, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed-60,
        life:0.6+Math.random()*0.4, age:0, size:3+Math.random()*4, color:'#3a2a1a', rot:Math.random()*6
      });
    }
    for (var j=0;j<6;j++){
      var ang2 = Math.random()*Math.PI*2, speed2 = 10+Math.random()*15;
      particles.push({
        kind:'smoke', x:cx, y:cy, vx:Math.cos(ang2)*speed2, vy:Math.sin(ang2)*speed2-30,
        life:1+Math.random()*0.6, age:0, size:6+Math.random()*5
      });
    }
  }
  function updateParticles(dt){
    for (var i=particles.length-1;i>=0;i--){
      var p = particles[i];
      p.age += dt;
      if (p.age >= p.life){ particles.splice(i,1); continue; }
      p.x += p.vx*dt; p.y += p.vy*dt;
      if (p.kind==='debris'){ p.vy += 90*dt; p.rot = (p.rot||0)+dt*6; }
      else if (p.kind==='smoke'){ p.vx *= 0.95; p.vy *= 0.95; }
    }
  }

  // ---------- Dano ----------
  function damageEntity(tank, amount, source){
    if (tank.isPlayer){
      if (tank.invuln>0 || !tank.alive || tank.respawning) return;
      if (upgrades.dodge>0 && Math.random()<upgrades.dodge){
        beep(1200,0.05,'triangle');
        return;
      }
      if (tank.shield>0){
        tank.shield -= 1;
        spawnExplosion(tank.x+tank.w/2, tank.y+tank.h/2);
        beep(500,0.08,'sine');
        return;
      }
      tank.hp -= amount;
      tank.invuln = 0.5;
      if (tank.hp<=0) killTank(tank);
      else { spawnSparks(tank.x+tank.w/2, tank.y+tank.h/2); beep(220,0.08,'square'); updateHUD(); }
    } else if (tank.type==='boss'){
      if (tank.shieldTimer>0) return;
      tank.hp -= Math.max(1, Math.round(amount*upgrades.damageMult));
      spawnExplosion(tank.x+tank.w/2, tank.y+tank.h/2);
      beep(300,0.1,'square');
      if (tank.hp<=0) killBoss(tank);
    } else {
      killTank(tank);
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
    player.hp = Math.max(1, Math.round(BASE_HP*upgrades.maxHpMult));
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

  function explodeAt(cx, cy, radius, fromPlayer, excludeTank){
    beep(150, 0.3, 'sawtooth');
    spawnExplosion(cx, cy);
    var col0 = Math.floor(cx/TILE), row0 = Math.floor(cy/TILE);
    for (var r=row0-1; r<=row0+1; r++){
      for (var c=col0-1; c<=col0+1; c++){
        if (r<0 || r>=ROWS || c<0 || c>=COLS) continue;
        if (grid[r][c]===BRICK || grid[r][c]===CRATE || grid[r][c]===BARREL) grid[r][c]=EMPTY;
      }
    }
    function inRadius(t){
      var dx = (t.x+t.w/2)-cx, dy = (t.y+t.h/2)-cy;
      return Math.sqrt(dx*dx+dy*dy) <= radius;
    }
    if (fromPlayer){
      for (var i=enemies.length-1;i>=0;i--){
        var e = enemies[i];
        if (e && e!==excludeTank && e.alive && inRadius(e)) damageEntity(e, 3);
      }
    } else if (player!==excludeTank && player && player.alive && !player.respawning && inRadius(player)){
      damageEntity(player, 2, 'bomb');
    }
  }

  function checkLevelClear(){
    if (gameState==='play' && spawnedEnemies>=totalEnemies && enemies.length===0){
      triggerLevelClear();
    }
  }
  function triggerBaseDestroyed(){
    if (gameState !== 'play') return;
    spawnBaseDestruction(baseCol*TILE+TILE/2, baseRow*TILE+TILE/2);
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
    applyLevelUpgrade(currentLevelDef);
    updateProgressPanel(true);
    var isFinal = currentLevel >= LEVELS.length;
    clearTitleEl.textContent = isFinal ? '🏆 ¡Campaña completa!' : '¡Nivel '+currentLevel+' superado!';
    clearDescEl.textContent = isFinal
      ? '¡Desbloqueaste el Tanque Legendario! Combina todas las mejoras que conseguiste en los 20 niveles.'
      : 'Mejora conseguida: '+currentLevelDef.upgrade.label;
    nextBtn.textContent = isFinal ? '↻ Volver al Nivel 1' : '▶ Nivel siguiente';
    clearOverlay.classList.remove('is-hidden');
    beep(1046, 0.2, 'triangle');
  }

  // ---------- IA de enemigos ----------
  function pointSegDist(px,py, x1,y1, x2,y2){
    var vx = x2-x1, vy = y2-y1;
    var wx = px-x1, wy = py-y1;
    var len2 = vx*vx+vy*vy;
    var t = len2 > 0 ? Math.max(0,Math.min(1,(wx*vx+wy*vy)/len2)) : 0;
    var cx = x1+vx*t, cy = y1+vy*t;
    return Math.hypot(px-cx, py-cy);
  }

  function updateEnemy(e, dt){
    var def = ENEMY_DEFS[e.type] || ENEMY_DEFS.recluta;

    if (def.phasing){
      e.phaseTimer -= dt;
      if (e.phaseTimer<=0){ e.phased = !e.phased; e.phaseTimer = e.phased?1.4:2.2; }
    }
    if (def.experimental){
      e.weaponTimer -= dt;
      if (e.weaponTimer<=0){ e.weaponIndex = (e.weaponIndex+1)%4; e.weaponTimer = 3.5; }
    }

    if (def.rush){
      if (player && player.alive && !player.respawning){
        var dx = (player.x+player.w/2)-(e.x+e.w/2), dy = (player.y+player.h/2)-(e.y+e.h/2);
        e.dir = Math.abs(dx)>Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
        var before={x:e.x,y:e.y};
        moveTank(e, e.dir, dt);
        var box = {x:e.x,y:e.y,w:e.w,h:e.h};
        if (rectsOverlap(box, player)){
          explodeAt(e.x+e.w/2, e.y+e.h/2, 46, false, null);
          killTank(e);
        } else if (e.x===before.x && e.y===before.y){
          e.dir = randomDir();
        }
      }
      return;
    }

    e.moveTimer -= dt;
    if (e.moveTimer <= 0){
      e.dir = randomDir();
      e.moveTimer = 0.8+Math.random()*1.5;
    }
    var beforeX=e.x, beforeY=e.y;
    moveTank(e, e.dir, dt);
    if (e.x===beforeX && e.y===beforeY) e.moveTimer = 0;
    applyTerrain(e, dt);

    if (def.minelayer){
      e.mineTimer -= dt;
      if (e.mineTimer<=0 && hazards.mines.length<10){
        hazards.mines.push({x:e.x+e.w/2, y:e.y+e.h/2, r:14, armed:true});
        e.mineTimer = 2.5+Math.random()*1.5;
        beep(200,0.1,'sine');
      }
      return;
    }
    if (def.flamer){
      e.flameTimer -= dt;
      if (e.flameTimer<=0){
        var fang = bulletAngleFromDir(e.dir);
        flames.push({x:e.x+e.w/2, y:e.y+e.h/2, ang:fang, life:0.6, age:0, owner:e});
        e.flameTimer = 2+Math.random();
      }
      return;
    }
    if (def.sniper){
      if (e.snipeState==='idle'){
        e.fireTimer -= dt;
        if (e.fireTimer<=0){ e.snipeState='aiming'; e.snipeTimer=0.65; }
      } else if (e.snipeState==='aiming'){
        if (player && player.alive){
          e.snipeAngle = Math.atan2((player.y+player.h/2)-(e.y+e.h/2), (player.x+player.w/2)-(e.x+e.w/2));
        }
        e.snipeTimer -= dt;
        if (e.snipeTimer<=0){
          fireBullet(e, {angle:e.snipeAngle, speedMult:2.4});
          e.snipeState='idle'; e.fireTimer = def.fireMin+Math.random()*(def.fireMax-def.fireMin);
        }
      }
      return;
    }

    e.fireTimer -= dt;
    if (e.fireTimer <= 0){
      var opts = {pattern: def.pattern||'single', type: def.bulletType||'normal', speedMult: def.bulletSpeedMult||1};
      if (def.freeze) opts.freeze = true;
      if (def.homingBullet) opts.homing = true;
      if (def.missile) opts.missile = true;
      if (def.experimental){
        var kinds = [{pattern:'single',type:'normal'},{pattern:'single',type:'bomb'},{pattern:'spread3',type:'normal'},{pattern:'single',type:'laser'}];
        var k = kinds[e.weaponIndex];
        opts.pattern = k.pattern; opts.type = k.type;
      }
      fireBullet(e, opts);
      e.fireTimer = def.fireMin + Math.random()*(def.fireMax-def.fireMin);
    }
  }

  // ---------- Jefes ----------
  function updateBoss(boss, dt){
    if (!boss.alive) return;
    if (boss.shieldTimer>0) boss.shieldTimer -= dt;
    boss.moveTimer -= dt;
    var eratic = boss.bossKey==='spider';
    if (boss.moveTimer <= 0){
      boss.dir = randomDir();
      boss.moveTimer = eratic ? (0.4+Math.random()*0.5) : (1.4+Math.random()*1.3);
    }
    var beforeX=boss.x, beforeY=boss.y;
    moveTank(boss, boss.dir, dt);
    if (boss.x===beforeX && boss.y===beforeY) boss.moveTimer = 0;
    applyTerrain(boss, dt);

    boss.phaseTimer -= dt;
    if (boss.phaseTimer > 0) return;

    if (boss.bossKey==='laser'){
      fireBullet(boss, {angle: aimAngleAtPlayer(boss), type:'laser'});
      if (Math.random()<0.5) summonReinforcement('doble');
      boss.phaseTimer = 2.6+Math.random()*1.4;
    } else if (boss.bossKey==='spider'){
      fireBullet(boss, {angle: aimAngleAtPlayer(boss), pattern:'quad'});
      if (Math.random()<0.6) summonReinforcement('kamikaze');
      boss.phaseTimer = 2.2+Math.random();
    } else if (boss.bossKey==='giant'){
      if (Math.random()<0.5){
        fireBullet(boss, {angle: aimAngleAtPlayer(boss)-0.3});
        fireBullet(boss, {angle: aimAngleAtPlayer(boss)});
        fireBullet(boss, {angle: aimAngleAtPlayer(boss)+0.3});
      } else if (player && player.alive){
        var dx=(player.x+player.w/2)-(boss.x+boss.w/2), dy=(player.y+player.h/2)-(boss.y+boss.h/2);
        if (Math.hypot(dx,dy) < 100) damageEntity(player, 2, 'shockwave');
        spawnExplosion(boss.x+boss.w/2, boss.y+boss.h/2);
        beep(90,0.3,'sawtooth');
      }
      boss.phaseTimer = 3+Math.random()*1.5;
    } else if (boss.bossKey==='supreme'){
      var phase = Math.floor(Math.random()*4);
      if (phase===0) fireBullet(boss, {angle:aimAngleAtPlayer(boss), type:'laser'});
      else if (phase===1) fireBullet(boss, {angle:aimAngleAtPlayer(boss), pattern:'quad'});
      else if (phase===2 && hazards.mines.length<10) hazards.mines.push({x:boss.x+boss.w/2, y:boss.y+boss.h/2, r:16, armed:true});
      else { boss.shieldTimer = 1.4; summonReinforcement(Math.random()<0.5?'recluta':'doble'); }
      boss.phaseTimer = 2+Math.random();
    }
  }
  function aimAngleAtPlayer(boss){
    if (!player || !player.alive) return 0;
    return Math.atan2((player.y+player.h/2)-(boss.y+boss.h/2), (player.x+player.w/2)-(boss.x+boss.w/2));
  }
  function summonReinforcement(type){
    if (enemies.length >= MAX_CONCURRENT_ENEMIES+1) return;
    var col = SPAWN_COLS[Math.floor(Math.random()*SPAWN_COLS.length)];
    var sx = col*TILE + (TILE-ENEMY_SIZE)/2, sy = (TILE-ENEMY_SIZE)/2;
    if (isBlockedForTank(sx, sy, ENEMY_SIZE, ENEMY_SIZE, null)) return;
    var r = makeTank(sx, sy, false, type);
    r.speed = 90*(ENEMY_DEFS[type].speedMult||1);
    r.dir = 'down';
    enemies.push(r);
  }

  // ---------- Balas, minas, barriles, torretas, meteoros ----------
  function updateBullets(dt){
    for (var i=bullets.length-1;i>=0;i--){
      var b = bullets[i];
      if (b.dead) continue;
      if (b.homing || b.missile){
        var targets = b.owner.isPlayer ? enemies : (player&&player.alive?[player]:[]);
        if (targets.length){
          var target = targets[0], bestD=Infinity;
          targets.forEach(function(tt){ var d=Math.hypot((tt.x-b.x),(tt.y-b.y)); if(d<bestD){bestD=d;target=tt;} });
          var desiredAng = Math.atan2((target.y+target.h/2)-b.y, (target.x+target.w/2)-b.x);
          var curAng = Math.atan2(b.vy,b.vx);
          var turn = b.missile?0.09:0.045;
          var diff = ((desiredAng-curAng+Math.PI*3)%(Math.PI*2))-Math.PI;
          curAng += Math.max(-turn,Math.min(turn,diff));
          b.vx = Math.cos(curAng); b.vy = Math.sin(curAng);
        }
      }
      var dx = b.vx*b.speed*dt, dy = b.vy*b.speed*dt;
      b.x += dx; b.y += dy;
      if ((b.type==='bomb'||b.missile) && Math.random()<0.5) spawnBulletSmoke(b.x+b.w/2, b.y+b.h/2);
      if (b.x<0 || b.y<0 || b.x>COLS*TILE || b.y>ROWS*TILE){
        if (b.type==='bomb'||b.missile) explodeAt(b.x+b.w/2, b.y+b.h/2, b.missile?60:BOMB_RADIUS, b.owner.isPlayer);
        killBullet(b); continue;
      }
      var col = Math.floor((b.x+b.w/2)/TILE), row = Math.floor((b.y+b.h/2)/TILE);
      var cell = grid[row] && grid[row][col];
      var solidCell = cell===BRICK||cell===STEEL||cell===BASE||cell===CRATE||cell===BARREL||cell===ROCK||(cell===TOGGLE&&togglePhaseAt(row,col)==='closed');
      if (solidCell){
        if (b.type==='bomb'||b.missile) explodeAt(col*TILE+TILE/2, row*TILE+TILE/2, b.missile?60:BOMB_RADIUS, b.owner.isPlayer);
        if (cell===BRICK){ grid[row][col]=EMPTY; spawnBrickDebris(col*TILE+TILE/2,row*TILE+TILE/2); beep(300,0.08,'square'); }
        else if (cell===CRATE || cell===BARREL){ grid[row][col]=EMPTY; explodeAt(col*TILE+TILE/2,row*TILE+TILE/2, 44, b.owner.isPlayer); }
        else if (cell===STEEL || cell===ROCK || cell===TOGGLE){ beep(500,0.06,'square'); }
        else if (cell===BASE){ triggerBaseDestroyed(); }
        if (b.bounces>0 && cell!==BASE && cell!==CRATE && cell!==BARREL){
          b.bounces -= 1;
          if (Math.abs(dx)>Math.abs(dy)) b.vx=-b.vx; else b.vy=-b.vy;
          continue;
        }
        killBullet(b);
        continue;
      }
      var bbox = {x:b.x, y:b.y, w:b.w, h:b.h};
      var hit = false;
      if (b.owner.isPlayer){
        for (var j=0;j<enemies.length;j++){
          var e = enemies[j];
          if (e.alive && !e.phased && rectsOverlap(bbox, e) && !(b.pierce && b.hitOnce[e.id])){
            var shieldedDef = ENEMY_DEFS[e.type];
            var incomingDir = Math.abs(b.vx)>Math.abs(b.vy) ? (b.vx>0?'right':'left') : (b.vy>0?'down':'up');
            if (shieldedDef && shieldedDef.shielded && incomingDir===OPPOSITE_DIR[e.dir]){
              spawnExplosion(b.x, b.y); beep(500,0.05,'sine');
            } else {
              damageEntity(e, 1);
              if (b.type==='bomb'||b.missile) explodeAt(e.x+e.w/2, e.y+e.h/2, b.missile?60:BOMB_RADIUS, true, e);
              b.hitOnce[e.id]=true;
            }
            hit = !b.pierce;
            if (hit) break;
          }
        }
      } else if (player && player.alive && !player.respawning && rectsOverlap(bbox, player)){
        var ownerDef = ENEMY_DEFS[b.owner.type];
        if (ownerDef && ownerDef.freeze){ player.frozenTimer = 1.3; }
        damageEntity(player, 1);
        if (b.type==='bomb'||b.missile) explodeAt(player.x+player.w/2, player.y+player.h/2, b.missile?60:BOMB_RADIUS, false, player);
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

  function updateHazards(dt){
    hazards.mines.forEach(function(m){
      if (!m.armed) return;
      if (player && player.alive && !player.respawning){
        var d = Math.hypot((player.x+player.w/2)-m.x, (player.y+player.h/2)-m.y);
        if (d < m.r+PLAYER_SIZE/2){ m.armed=false; explodeAt(m.x,m.y,50,false,null); }
      }
    });
    hazards.mines = hazards.mines.filter(function(m){ return m.armed; });

    hazards.turrets.forEach(function(t){
      t.timer -= dt;
      if (t.timer<=0){
        fireBullet({x:t.x-BULLET_SIZE/2,y:t.y-BULLET_SIZE/2,w:0,h:0,isPlayer:false,bulletCount:0,maxBullets:99}, {angle:bulletAngleFromDir(t.dir)});
        t.timer = 2.4+Math.random();
      }
    });

    if (LEVELS[currentLevel-1] && LEVELS[currentLevel-1].map==='meteors'){
      meteorState.timer -= dt;
      if (meteorState.timer<=0){
        var mr=2+Math.floor(Math.random()*(ROWS-5)), mc=1+Math.floor(Math.random()*(COLS-2));
        meteorState.warnings.push({r:mr,c:mc,t:1.0});
        meteorState.timer = 3.5+Math.random()*2;
      }
      for (var i=meteorState.warnings.length-1;i>=0;i--){
        var w = meteorState.warnings[i];
        w.t -= dt;
        if (w.t<=0){
          var cx=w.c*TILE+TILE/2, cy=w.r*TILE+TILE/2;
          explodeAt(cx,cy,44,false,null);
          if (player) { var d=Math.hypot((player.x+player.w/2)-cx,(player.y+player.h/2)-cy); if (d<44) damageEntity(player,1,'meteor'); }
          meteorState.warnings.splice(i,1);
        }
      }
    }
  }

  function updateFlames(dt){
    for (var i=flames.length-1;i>=0;i--){
      var f = flames[i];
      f.age += dt;
      if (f.age>=f.life){ flames.splice(i,1); continue; }
      var fx = f.x+Math.cos(f.ang)*24, fy = f.y+Math.sin(f.ang)*24;
      if (player && player.alive && !player.respawning){
        var d = Math.hypot(fx-(player.x+player.w/2), fy-(player.y+player.h/2));
        if (d<26 && Math.floor(f.age*6)%2===0) damageEntity(player, 1, 'flame');
      }
    }
  }

  var dirStack = [];
  function pressDir(dir){ if (dirStack.indexOf(dir)===-1) dirStack.push(dir); }
  function releaseDir(dir){ var i=dirStack.indexOf(dir); if (i!==-1) dirStack.splice(i,1); }
  function currentDir(){ return dirStack.length ? dirStack[dirStack.length-1] : null; }

  function throwPlayerBomb(){
    if (!player || !player.alive || player.respawning) return;
    if (currentLevel<4) return;
    if (player.bombCooldown > 0) return;
    var cx = player.x+player.w/2, cy = player.y+player.h/2;
    bullets.push({x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(bulletAngleFromDir(player.dir)),vy:Math.sin(bulletAngleFromDir(player.dir)),
      speed:BOMB_SPEED, owner:player, dead:false, type:'bomb', bounces:0, pierce:false, hitOnce:{}});
    player.bombCooldown = PLAYER_BOMB_COOLDOWN;
    beep(200, 0.15, 'sawtooth');
  }

  function playerFire(){
    if (!player || !player.alive || player.respawning) return;
    var type = upgrades.laserCannon ? 'laser' : 'normal';
    fireBullet(player, {pattern:upgrades.shotPattern, type:type, pierce:upgrades.pierce, homing:upgrades.homing});
  }

  var KEY_DIR = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right'};
  window.addEventListener('keydown', function(e){
    if (!tanksActive()) return;
    if (e.code==='Escape'){
      e.preventDefault();
      togglePause();
      return;
    }
    if (KEY_DIR[e.code]){
      e.preventDefault();
      pressDir(KEY_DIR[e.code]);
    } else if (e.code==='Space'){
      e.preventDefault();
      if (gameState==='play' && !isPaused) playerFire();
    } else if (e.code==='KeyB'){
      e.preventDefault();
      if (gameState==='play' && !isPaused) throwPlayerBomb();
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
    if (gameState==='play' && !isPaused) playerFire();
  });
  tBomb.addEventListener('pointerdown', function(e){
    e.preventDefault();
    if (gameState==='play' && !isPaused) throwPlayerBomb();
  });

  function pulseChip(el, newText, mode){
    if (!el) return;
    if (el.textContent !== newText){
      var prevNum = parseFloat(el.textContent);
      var newNum = parseFloat(newText);
      var isDrop = !isNaN(prevNum) && !isNaN(newNum) && newNum < prevNum;
      el.textContent = newText;
      var chip = el.closest ? el.closest('.hud-chip') : null;
      if (chip){
        var cls = (mode==='shake' && isDrop) ? 'is-shaking' : 'is-pulsing';
        chip.classList.remove('is-pulsing');
        chip.classList.remove('is-shaking');
        void chip.offsetWidth; // reinicia la animacion CSS aunque se repita el mismo valor
        chip.classList.add(cls);
      }
    }
  }
  function updateHUD(){
    pulseChip(livesEl, String(Math.max(0, lives)), 'shake');
    pulseChip(enemiesEl, String(Math.max(0, totalEnemies-killedCount)));
    pulseChip(levelEl, String(currentLevel));
    if (hpEl && player) pulseChip(hpEl, Math.max(0,player.hp)+'/'+Math.round(BASE_HP*upgrades.maxHpMult)+(player.shieldMax?(' 🛡'+player.shield):''), 'shake');
    updateSidePanelInfo();
  }

  function mapLabel(key){
    var labels = {
      open:'Campo abierto', cover:'Zona con cobertura', boxes:'Cajas de madera', rocks:'Rocas',
      boss1:'Arena del jefe', bridges:'Puentes', maze:'Laberinto', mines:'Campo minado',
      barrels:'Barriles explosivos', boss2:'Base militar', river:'Río con puentes', sand:'Arenal',
      electric:'Zona electrificada', fog:'Niebla', boss3:'Fábrica', ice:'Hielo', portals:'Portales',
      meteors:'Lluvia de meteoritos', shifting:'Paredes móviles', boss4:'Arena final'
    };
    return labels[key] || key;
  }
  function updateSidePanelInfo(){
    if (!panelEnemyEl || !currentLevelDef) return;
    panelEnemyEl.textContent = currentLevelDef.boss ? BOSS_DEFS[currentLevelDef.boss].label : enemyLabel(currentLevelDef.enemy);
    panelMapEl.textContent = mapLabel(currentLevelDef.map);
    panelRemainingEl.textContent = Math.max(0, totalEnemies-killedCount);
  }

  function setStatBar(el, value, min, max){
    if (!el) return;
    var pct = Math.max(4, Math.min(100, ((value-min)/(max-min))*100));
    el.style.width = pct+'%';
  }
  function updateStatBars(){
    setStatBar(statDamageEl, upgrades.damageMult, 1, 2.2);
    setStatBar(statSpeedEl, upgrades.speedMult, 1, 2);
    setStatBar(statHpEl, upgrades.maxHpMult, 1, 2.2);
    setStatBar(statFireRateEl, 1/upgrades.fireRateMult, 1, 2.2);
    setStatBar(statArmorEl, upgrades.shieldMax, 0, 3);
  }
  function renderTankPreview(){
    if (!tankPreviewEl) return;
    var color = upgrades.legendary ? '#5fae3f' : '#4a7c3f';
    var accent = upgrades.legendary ? '#ffd23f' : '#3a6030';
    tankPreviewEl.innerHTML =
      '<svg viewBox="0 0 60 60" class="tanks-preview-svg" aria-hidden="true">'+
        '<rect x="8" y="10" width="6" height="40" rx="2" fill="#1c1e22"/>'+
        '<rect x="46" y="10" width="6" height="40" rx="2" fill="#1c1e22"/>'+
        '<rect x="14" y="14" width="32" height="32" rx="6" fill="'+color+'"/>'+
        '<circle cx="30" cy="30" r="11" fill="'+accent+'"/>'+
        '<rect x="27" y="4" width="6" height="20" rx="2" fill="#20232a"/>'+
      '</svg>';
  }
  function updateProgressPanel(justUnlocked){
    if (!panelLevelEl) return;
    panelLevelEl.textContent = currentLevel;
    panelUpgradeEl.textContent = justUnlocked
      ? currentLevelDef.upgrade.label
      : (currentLevel > 1 ? levelDef(currentLevel-1).upgrade.label : 'Ninguna todavía');
    updateStatBars();
    renderTankPreview();
    if (justUnlocked && progressBlockEl){
      progressBlockEl.classList.remove('is-glowing');
      void progressBlockEl.offsetWidth;
      progressBlockEl.classList.add('is-glowing');
    }
  }

  var SHOT_PATTERN_LABELS = {single:'Disparo simple', double:'Disparo doble', triple:'Disparo triple', quad:'Disparo cuádruple'};
  function updateBottomBar(){
    if (!cooldownFillEl) return;
    var unlocked = currentLevel >= 4;
    var cd = player ? Math.max(0, player.bombCooldown||0) : PLAYER_BOMB_COOLDOWN;
    var pct = unlocked ? Math.max(0, Math.min(100, ((PLAYER_BOMB_COOLDOWN-cd)/PLAYER_BOMB_COOLDOWN)*100)) : 0;
    cooldownFillEl.style.width = pct+'%';
    if (abilitySlotEl){
      abilitySlotEl.classList.toggle('is-unlocked', unlocked);
      abilitySlotEl.classList.toggle('is-ready', unlocked && cd<=0);
    }
    if (weaponValEl) weaponValEl.textContent = SHOT_PATTERN_LABELS[upgrades.shotPattern] || 'Disparo simple';
    if (ammoValEl && player) ammoValEl.textContent = player.bulletCount+'/'+player.maxBullets;
  }
  function formatTime(s){
    var m = Math.floor(s/60), sec = Math.floor(s%60);
    return (m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
  }

  function spawnEnemies(dt){
    if (currentLevelDef.boss) return;
    spawnTimer -= dt;
    if (spawnTimer<=0 && spawnedEnemies<totalEnemies && enemies.length<MAX_CONCURRENT_ENEMIES){
      var col = SPAWN_COLS[Math.floor(Math.random()*SPAWN_COLS.length)];
      var sx = col*TILE + (TILE-ENEMY_SIZE)/2;
      var sy = (TILE-ENEMY_SIZE)/2;
      if (!isBlockedForTank(sx, sy, ENEMY_SIZE, ENEMY_SIZE, null)){
        var e = makeTank(sx, sy, false, currentLevelDef.enemy);
        e.speed = (90+currentLevel*2) * (currentEnemyDef.speedMult||1);
        e.dir = 'down';
        enemies.push(e);
        spawnedEnemies += 1;
      }
      spawnTimer = Math.max(1.1, 2.3-currentLevel*0.05);
    }
  }

  function tick(dt){
    if (gameState !== 'play') return;
    shiftTimer += dt;
    if (player.respawning){
      respawnTimer -= dt;
      if (respawnTimer<=0) respawnPlayer();
    } else if (player.alive){
      if (player.frozenTimer>0){ player.frozenTimer -= dt; }
      var spd = PLAYER_SPEED*upgrades.speedMult*(player.frozenTimer>0?0.12:1)*(player.sandSlow?0.5:1);
      player.speed = spd;
      moveTank(player, currentDir(), dt);
      applyTerrain(player, dt);
      if (player.invuln>0) player.invuln -= dt;
      if (player.bombCooldown>0) player.bombCooldown -= dt;
      if (upgrades.shieldRegen && player.shield<player.shieldMax){
        player.shieldRegenTimer -= dt;
        if (player.shieldRegenTimer<=0){ player.shield += 1; player.shieldRegenTimer = 8; updateHUD(); }
      }
    }
    enemies.forEach(function(e){
      if (e.type==='boss') updateBoss(e, dt);
      else updateEnemy(e, dt);
    });
    updateBullets(dt);
    updateHazards(dt);
    updateFlames(dt);
    spawnEnemies(dt);
  }

  // Estado puramente cosmetico (orugas, retroceso del cañon, destello, polvo al
  // moverse) - no lee ni modifica nada de la logica del juego, solo animaciones.
  function updateVisuals(dt){
    function tickTankVisuals(tk){
      if (tk.lastX===undefined){ tk.lastX = tk.x; tk.lastY = tk.y; }
      var moved = Math.hypot(tk.x-tk.lastX, tk.y-tk.lastY);
      if (moved>0.3){
        tk.treadPhase = (tk.treadPhase||0)+moved;
        if (Math.random()<0.15) spawnDust(tk.x+tk.w/2, tk.y+tk.h*0.85);
      }
      tk.lastX = tk.x; tk.lastY = tk.y;
      if (tk.recoil>0) tk.recoil = Math.max(0, tk.recoil-dt*6);
      if (tk.muzzle>0) tk.muzzle = Math.max(0, tk.muzzle-dt*7);
    }
    if (player) tickTankVisuals(player);
    enemies.forEach(tickTankVisuals);
  }

  // ---------- Dibujo ----------
  function shadeColor(hex, amt){
    var num = parseInt(hex.replace('#',''),16);
    var r = Math.max(0,Math.min(255,(num>>16)+amt));
    var g = Math.max(0,Math.min(255,((num>>8)&0xff)+amt));
    var b = Math.max(0,Math.min(255,(num&0xff)+amt));
    return 'rgb('+r+','+g+','+b+')';
  }
  function roundRectPath(c,x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y);
    c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r);
    c.arcTo(x,y+h,x,y,r);
    c.arcTo(x,y,x+w,y,r);
    c.closePath();
  }

  // Textura de piso pre-renderizada una vez por nivel (grietas, marcas de
  // explosion, huellas de neumaticos, aceite, pasto y piedras) para que el
  // campo de batalla no sea negro liso, sin recalcularla cada frame.
  var groundCanvas = document.createElement('canvas');
  groundCanvas.width = COLS*TILE; groundCanvas.height = ROWS*TILE;
  var groundCtx = groundCanvas.getContext('2d');
  function buildGroundTexture(){
    var g = groundCtx, W = COLS*TILE, H = ROWS*TILE;
    var grad = g.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, '#1a1e14');
    grad.addColorStop(1, '#11140b');
    g.fillStyle = grad;
    g.fillRect(0,0,W,H);
    for (var i=0;i<12;i++){
      var x=Math.random()*W, y=Math.random()*H, r=8+Math.random()*14;
      var og = g.createRadialGradient(x,y,0,x,y,r);
      og.addColorStop(0,'rgba(0,0,0,0.35)'); og.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=og; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
    }
    g.strokeStyle='rgba(0,0,0,0.4)'; g.lineWidth=1;
    for (var i2=0;i2<9;i2++){
      var sx=Math.random()*W, sy=Math.random()*H;
      g.beginPath(); g.moveTo(sx,sy);
      var cx=sx, cy=sy;
      for (var k=0;k<4;k++){ cx+=(Math.random()*20-10); cy+=(Math.random()*20-10); g.lineTo(cx,cy); }
      g.stroke();
    }
    for (var i3=0;i3<6;i3++){
      var tx=Math.random()*W, ty=Math.random()*H, ang=Math.random()*Math.PI;
      g.save(); g.translate(tx,ty); g.rotate(ang);
      g.fillStyle='rgba(0,0,0,0.22)';
      g.fillRect(-2,-18,3,36); g.fillRect(5,-18,3,36);
      g.restore();
    }
    for (var i4=0;i4<3;i4++){
      var ox=Math.random()*W, oy=Math.random()*H;
      var ograd = g.createRadialGradient(ox,oy,0,ox,oy,10);
      ograd.addColorStop(0,'rgba(30,25,10,0.4)'); ograd.addColorStop(1,'rgba(30,25,10,0)');
      g.fillStyle=ograd; g.beginPath(); g.arc(ox,oy,10,0,Math.PI*2); g.fill();
    }
    for (var i5=0;i5<28;i5++){
      var gx=Math.random()*W, gy=Math.random()*H;
      if (Math.random()<0.5){ g.fillStyle='rgba(90,140,60,0.3)'; g.fillRect(gx,gy,2,4); }
      else { g.fillStyle='rgba(130,128,116,0.35)'; g.beginPath(); g.arc(gx,gy,1.3,0,Math.PI*2); g.fill(); }
    }
  }

  var brickGrad = null;
  function drawBrick(x,y){
    var seed = Math.abs((x*7+y*13))%5;
    var shades = ['#b6531c','#a8481a','#c15f22','#9e4416','#b04f1e'];
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = shades[seed];
    ctx.fillRect(0,0,TILE,TILE);
    if (!brickGrad){
      brickGrad = ctx.createLinearGradient(0,0,0,TILE);
      brickGrad.addColorStop(0,'rgba(255,255,255,0.12)');
      brickGrad.addColorStop(0.5,'rgba(255,255,255,0)');
      brickGrad.addColorStop(1,'rgba(0,0,0,0.25)');
    }
    ctx.fillStyle = brickGrad;
    ctx.fillRect(0,0,TILE,TILE);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0,TILE/2); ctx.lineTo(TILE,TILE/2);
    ctx.moveTo(TILE/2,0); ctx.lineTo(TILE/2,TILE/2);
    ctx.moveTo(TILE/4,TILE/2); ctx.lineTo(TILE/4,TILE);
    ctx.moveTo(TILE*0.75,TILE/2); ctx.lineTo(TILE*0.75,TILE);
    ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,0.55)';
    ctx.strokeRect(0.5,0.5,TILE-1,TILE-1);
    if (seed%3===0){
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(6,4); ctx.lineTo(11,13); ctx.stroke();
    }
    ctx.restore();
  }
  var steelGrad = null;
  function drawSteel(x,y){
    ctx.save();
    ctx.translate(x,y);
    if (!steelGrad){
      steelGrad = ctx.createLinearGradient(0,0,0,TILE);
      steelGrad.addColorStop(0,'#aab4bd'); steelGrad.addColorStop(0.5,'#7c8791'); steelGrad.addColorStop(1,'#565f68');
    }
    ctx.fillStyle = steelGrad;
    ctx.fillRect(0,0,TILE,TILE);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fillRect(2,2,TILE-4,3);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(2,TILE-5,TILE-4,3);
    ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.strokeRect(0.5,0.5,TILE-1,TILE-1);
    ctx.fillStyle='#3a3f45';
    [[5,5],[TILE-5,5],[5,TILE-5],[TILE-5,TILE-5]].forEach(function(p){
      ctx.beginPath(); ctx.arc(p[0],p[1],1.6,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();
  }
  function drawBase(x,y,t,destroyed){
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x+TILE/2,y+TILE-3,TILE*0.42,5,0,0,Math.PI*2); ctx.fill();
    var wallGrad = ctx.createLinearGradient(x,y,x,y+TILE);
    wallGrad.addColorStop(0,'#565048'); wallGrad.addColorStop(1,'#2a251d');
    ctx.fillStyle = wallGrad;
    roundRectPath(ctx, x+2, y+4, TILE-4, TILE-7, 3);
    ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1; ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x+4,y+6); ctx.lineTo(x+TILE-4,y+6); ctx.stroke();
    // antena con luz parpadeante
    var blink = Math.floor(t*2)%2===0;
    ctx.strokeStyle='#8a8f86'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(x+TILE-9,y+4); ctx.lineTo(x+TILE-9,y-3); ctx.stroke();
    ctx.fillStyle = blink?'#ffcf4a':'#a87c1a';
    ctx.beginPath(); ctx.arc(x+TILE-9,y-3,1.6,0,Math.PI*2); ctx.fill();
    // luces amarillas laterales
    ctx.fillStyle='#ffd23f'; ctx.globalAlpha = blink?1:0.45;
    ctx.fillRect(x+4,y+8,3,3); ctx.fillRect(x+TILE-7,y+8,3,3);
    ctx.globalAlpha=1;
    // puerta blindada
    ctx.fillStyle='#221c14';
    ctx.fillRect(x+TILE/2-6,y+TILE-13,12,9);
    ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.strokeRect(x+TILE/2-6,y+TILE-13,12,9);
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath();
    ctx.moveTo(x+TILE/2,y+TILE-13); ctx.lineTo(x+TILE/2,y+TILE-4); ctx.stroke();
    // banderita
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(x+TILE/2,y+6);
    ctx.lineTo(x+TILE-8,y+TILE/2-4);
    ctx.lineTo(x+TILE/2,y+TILE/2-10);
    ctx.lineTo(x+8,y+TILE/2-4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawCrate(x,y){
    ctx.save();
    ctx.translate(x,y);
    var grad = ctx.createLinearGradient(0,0,0,TILE);
    grad.addColorStop(0,'#d89a4f'); grad.addColorStop(1,'#a06326');
    ctx.fillStyle=grad; ctx.fillRect(2,2,TILE-4,TILE-4);
    ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.strokeRect(2,2,TILE-4,TILE-4);
    ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=1;
    for (var i=0;i<3;i++){ var gy=7+i*7; ctx.beginPath(); ctx.moveTo(3,gy); ctx.lineTo(TILE-3,gy); ctx.stroke(); }
    ctx.strokeStyle='#5c3a18'; ctx.lineWidth=2;
    ctx.strokeRect(3,3,TILE-6,TILE-6);
    ctx.fillStyle='#8a97a3';
    [[4,4],[TILE-4,4],[4,TILE-4],[TILE-4,TILE-4]].forEach(function(p){ ctx.fillRect(p[0]-1.5,p[1]-1.5,3,3); });
    ctx.restore();
  }
  function drawBarrel(x,y,t){
    ctx.save();
    ctx.translate(x,y);
    var cx=TILE/2, cy=TILE/2;
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx,TILE-4,10,3,0,0,Math.PI*2); ctx.fill();
    var grad = ctx.createLinearGradient(6,0,TILE-6,0);
    grad.addColorStop(0,'#7a1811'); grad.addColorStop(0.5,'#c0392b'); grad.addColorStop(1,'#7a1811');
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(6,4); ctx.lineTo(TILE-6,4);
    ctx.quadraticCurveTo(TILE-3,cy,TILE-6,TILE-4);
    ctx.lineTo(6,TILE-4);
    ctx.quadraticCurveTo(3,cy,6,4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(6,9); ctx.lineTo(TILE-6,9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,TILE-9); ctx.lineTo(TILE-6,TILE-9); ctx.stroke();
    var pulse = 0.6+0.4*Math.sin(t*4+x);
    ctx.fillStyle='rgba(255,150,40,'+(0.5+0.4*pulse)+')';
    ctx.beginPath();
    ctx.moveTo(cx,cy-6); ctx.quadraticCurveTo(cx+5,cy,cx,cy+7); ctx.quadraticCurveTo(cx-5,cy,cx,cy-6);
    ctx.fill();
    ctx.restore();
  }
  function drawRock(x,y){
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#4a443c';
    ctx.beginPath();
    ctx.moveTo(4,TILE-2); ctx.lineTo(2,10); ctx.lineTo(14,2);
    ctx.lineTo(TILE-4,6); ctx.lineTo(TILE-2,TILE-4); ctx.lineTo(18,TILE-2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.moveTo(14,2); ctx.lineTo(TILE-4,6); ctx.lineTo(18,14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.stroke();
    ctx.restore();
  }
  function drawWater(x,y,t){
    ctx.save();
    ctx.translate(x,y);
    var grad = ctx.createLinearGradient(0,0,0,TILE);
    grad.addColorStop(0,'#2a72a8'); grad.addColorStop(1,'#0f3a5c');
    ctx.fillStyle = grad; ctx.fillRect(0,0,TILE,TILE);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    var off = Math.sin(t*2+x*0.1)*3;
    ctx.beginPath(); ctx.moveTo(0,TILE/2+off); ctx.lineTo(TILE,TILE/2-off); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,TILE*0.25-off); ctx.lineTo(TILE,TILE*0.25+off); ctx.stroke();
    ctx.restore();
  }
  function drawSand(x,y){
    ctx.save();
    ctx.translate(x,y);
    var grad = ctx.createLinearGradient(0,0,0,TILE);
    grad.addColorStop(0,'#e0cb87'); grad.addColorStop(1,'#c2a95e');
    ctx.fillStyle = grad; ctx.fillRect(0,0,TILE,TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (var i=0;i<5;i++){ ctx.beginPath(); ctx.arc(3+(i*6)%TILE,5+((i*11)%TILE),1,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
  function drawIce(x,y){
    ctx.save();
    ctx.translate(x,y);
    var grad = ctx.createLinearGradient(0,0,TILE,TILE);
    grad.addColorStop(0,'#d8f3ff'); grad.addColorStop(1,'#a9dcf5');
    ctx.fillStyle = grad; ctx.fillRect(0,0,TILE,TILE);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.strokeRect(3,3,TILE-6,TILE-6);
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(6,TILE-6); ctx.lineTo(TILE-10,8); ctx.stroke();
    ctx.restore();
  }
  function drawElectric(x,y,t){
    var on = Math.floor(t*2)%2===0;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = on ? '#fff06a' : '#8a7a2a';
    ctx.fillRect(0,0,TILE,TILE);
    if (on){
      ctx.shadowColor = '#fff06a'; ctx.shadowBlur = 6;
      ctx.strokeStyle = '#fff'; ctx.lineWidth=1.4;
      ctx.beginPath();
      ctx.moveTo(4,4); ctx.lineTo(16,16); ctx.lineTo(10,18); ctx.lineTo(TILE-4,TILE-4);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawPortal(x,y,color,t){
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0,0,TILE,TILE);
    var pulse = 8+Math.sin(t*4)*2;
    ctx.strokeStyle = color; ctx.lineWidth=3;
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(TILE/2,TILE/2,pulse,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(TILE/2,TILE/2,pulse+4,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  function drawToggle(x,y,phase){
    if (phase==='closed'){ drawBrick(x,y); }
    else {
      ctx.save();
      ctx.strokeStyle='rgba(255,80,80,0.5)'; ctx.lineWidth=1.5;
      ctx.strokeRect(x+3,y+3,TILE-6,TILE-6);
      ctx.setLineDash([3,3]);
      ctx.strokeStyle='rgba(255,150,80,0.35)';
      ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);
      ctx.restore();
    }
  }
  function drawConveyor(x,y,dir,t){
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#33363a';
    ctx.fillRect(0,0,TILE,TILE);
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.strokeRect(0.5,0.5,TILE-1,TILE-1);
    var off = (t*40)%8;
    ctx.strokeStyle='rgba(255,210,63,0.5)'; ctx.lineWidth=2;
    var rot = {up:-Math.PI/2, down:Math.PI/2, left:Math.PI, right:0}[dir];
    ctx.translate(TILE/2,TILE/2); ctx.rotate(rot);
    for (var i=-1;i<=1;i++){
      var lx = -TILE/2+((off+i*8+TILE)%TILE);
      ctx.beginPath(); ctx.moveTo(lx,-6); ctx.lineTo(lx+5,0); ctx.lineTo(lx,6); ctx.stroke();
    }
    ctx.restore();
  }
  function drawTank(tank, color, alpha, accent){
    var r = tank.recoil||0;
    ctx.save();
    ctx.globalAlpha = alpha!==undefined?alpha:1;
    ctx.fillStyle='rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(tank.x+tank.w/2, tank.y+tank.h/2+tank.h*0.38, tank.w*0.5, tank.h*0.22, 0,0,Math.PI*2);
    ctx.fill();

    ctx.translate(tank.x+tank.w/2, tank.y+tank.h/2);
    var rot = {up:0, right:Math.PI/2, down:Math.PI, left:-Math.PI/2}[tank.dir];
    ctx.rotate(rot);
    var w=tank.w, h=tank.h;

    // orugas con guiones animados
    ctx.fillStyle = '#1c1e22';
    ctx.fillRect(-w/2-1,-h/2,5,h);
    ctx.fillRect(w/2-4,-h/2,5,h);
    ctx.fillStyle = '#454850';
    var dash=5, phase=(tank.treadPhase||0)%dash;
    for (var yy=-h/2-phase; yy<h/2; yy+=dash){
      ctx.fillRect(-w/2-1,yy,5,2);
      ctx.fillRect(w/2-4,yy,5,2);
    }

    // casco
    var bodyGrad = ctx.createLinearGradient(-w/2,-h/2,-w/2,h/2);
    bodyGrad.addColorStop(0, shadeColor(color,26));
    bodyGrad.addColorStop(0.5, color);
    bodyGrad.addColorStop(1, shadeColor(color,-26));
    ctx.fillStyle = bodyGrad;
    roundRectPath(ctx, -w/2+3, -h/2+3, w-6, h-6, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillRect(-w/2+5,-h/2+5,w-10,2.5);
    ctx.fillStyle='rgba(0,0,0,0.3)';
    [[-w/2+6,-h/2+8],[w/2-6,-h/2+8],[-w/2+6,h/2-8],[w/2-6,h/2-8]].forEach(function(p){
      ctx.beginPath(); ctx.arc(p[0],p[1],1.3,0,Math.PI*2); ctx.fill();
    });

    // torreta (pieza separada del casco)
    ctx.fillStyle = accent ? accent : shadeColor(color,-14);
    ctx.beginPath(); ctx.arc(0,0,w*0.3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.arc(-w*0.08,-w*0.08,w*0.12,0,Math.PI*2); ctx.fill();

    // cañon con retroceso al disparar
    var barrelLen = h/2+7-r*4;
    ctx.fillStyle = '#20232a';
    ctx.fillRect(-2.4,-barrelLen,4.8,barrelLen-h*0.12);
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.fillRect(-2.4,-barrelLen,1,barrelLen-h*0.12);

    // destello de disparo
    if (tank.muzzle>0){
      var mAlpha = ctx.globalAlpha*tank.muzzle;
      ctx.save();
      ctx.globalAlpha = mAlpha;
      ctx.fillStyle='#fff2b0';
      ctx.beginPath(); ctx.arc(0,-barrelLen-2,4+tank.muzzle*4,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function drawBullet(b){
    ctx.save();
    if (b.type==='bomb'){
      ctx.shadowColor='#ff8a4a'; ctx.shadowBlur=6;
      ctx.fillStyle = '#ff8a4a';
      ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2, 0, Math.PI*2); ctx.fill();
    } else if (b.type==='laser'){
      ctx.translate(b.x+b.w/2, b.y+b.h/2);
      ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);
      ctx.shadowColor='#ff3ea5'; ctx.shadowBlur=8;
      ctx.fillStyle = '#ff3ea5';
      ctx.fillRect(-3, -9, 6, 18);
    } else {
      ctx.shadowColor = b.missile ? '#b23bd6' : '#ffdf80';
      ctx.shadowBlur = 5;
      ctx.fillStyle = b.missile ? '#b23bd6' : '#fff7d6';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.restore();
  }
  function drawBossHpBar(boss){
    var w = boss.w, x = boss.x, y = boss.y-14;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(x-2,y-2,w+4,9);
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(x-2,y-2,w+4,9);
    var pct = Math.max(0,boss.hp/boss.maxHp);
    var grad = ctx.createLinearGradient(x,y,x+w,y);
    if (boss.shieldTimer>0){ grad.addColorStop(0,'#3fa8ff'); grad.addColorStop(1,'#5cc9ff'); }
    else { grad.addColorStop(0,'#ff5a3c'); grad.addColorStop(1,'#ff3e3e'); }
    ctx.fillStyle = grad;
    ctx.fillRect(x,y,w*pct,5);
  }
  function drawParticles(){
    particles.forEach(function(p){
      var frac = 1-p.age/p.life;
      ctx.globalAlpha = Math.max(0,frac);
      if (p.kind==='smoke'){
        var g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*(1.4-frac*0.4));
        g.addColorStop(0,'rgba(130,130,130,'+(0.5*frac)+')');
        g.addColorStop(1,'rgba(130,130,130,0)');
        ctx.fillStyle=g;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*(1.4-frac*0.4),0,Math.PI*2); ctx.fill();
      } else if (p.kind==='debris'){
        ctx.save();
        ctx.translate(p.x,p.y); ctx.rotate(p.rot||0);
        ctx.fillStyle = p.color || '#4a4038';
        ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
        ctx.restore();
      } else if (p.kind==='dust'){
        ctx.fillStyle='rgba(200,190,160,'+(0.35*frac)+')';
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle = frac>0.5 ? '#fff2b0' : '#ff5a3c';
        ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1;
  }
  function drawFlames(){
    flames.forEach(function(f){
      var fx = f.x+Math.cos(f.ang)*24, fy = f.y+Math.sin(f.ang)*24;
      ctx.globalAlpha = Math.max(0, 1-f.age/f.life);
      ctx.shadowColor='#ff6a2a'; ctx.shadowBlur=10;
      ctx.fillStyle = '#ff6a2a';
      ctx.beginPath(); ctx.arc(fx,fy,16,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(fx,fy,8,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function drawMinesAndTurrets(t){
    hazards.mines.forEach(function(m){
      var pulse = 0.5+0.5*Math.sin(t*5);
      ctx.fillStyle = '#7a1811';
      ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = pulse>0.5 ? '#ff5a3c' : '#661a12';
      ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, Math.PI*2); ctx.fill();
    });
    hazards.turrets.forEach(function(t2){
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(t2.x,t2.y+8,9,3,0,0,Math.PI*2); ctx.fill();
      var grad = ctx.createLinearGradient(t2.x-10,t2.y-10,t2.x+10,t2.y+10);
      grad.addColorStop(0,'#5a5f56'); grad.addColorStop(1,'#33362e');
      ctx.fillStyle = grad;
      ctx.fillRect(t2.x-10, t2.y-10, 20, 20);
      ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.strokeRect(t2.x-10,t2.y-10,20,20);
      var rot = {up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0}[t2.dir]||0;
      ctx.save(); ctx.translate(t2.x,t2.y); ctx.rotate(rot);
      ctx.fillStyle = '#222';
      ctx.fillRect(0,-2,12,4);
      ctx.restore();
      ctx.fillStyle='#ffd23f';
      ctx.beginPath(); ctx.arc(t2.x,t2.y,2.2,0,Math.PI*2); ctx.fill();
    });
    if (meteorState) meteorState.warnings.forEach(function(w){
      ctx.strokeStyle = 'rgba(255,60,60,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(w.c*TILE+TILE/2, w.r*TILE+TILE/2, 22*(1-w.t), 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([4,4]);
      ctx.strokeStyle = 'rgba(255,150,80,0.5)';
      ctx.beginPath(); ctx.arc(w.c*TILE+TILE/2, w.r*TILE+TILE/2, 20, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    });
  }
  function drawSnipeTelegraph(){
    enemies.forEach(function(e){
      if (e.snipeState==='aiming'){
        ctx.save();
        ctx.strokeStyle = 'rgba(255,40,40,0.65)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor='rgba(255,40,40,0.8)'; ctx.shadowBlur=4;
        ctx.beginPath();
        ctx.moveTo(e.x+e.w/2, e.y+e.h/2);
        ctx.lineTo(e.x+e.w/2+Math.cos(e.snipeAngle)*300, e.y+e.h/2+Math.sin(e.snipeAngle)*300);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  function render(t){
    ctx.drawImage(groundCanvas, 0, 0);
    if (grid){
      for (var r=0;r<ROWS;r++){
        for (var c=0;c<COLS;c++){
          var cell = grid[r][c];
          var x=c*TILE, y=r*TILE;
          if (cell===BRICK) drawBrick(x,y);
          else if (cell===STEEL) drawSteel(x,y);
          else if (cell===BASE) drawBase(x,y,t);
          else if (cell===CRATE) drawCrate(x,y);
          else if (cell===BARREL) drawBarrel(x,y,t);
          else if (cell===ROCK) drawRock(x,y);
          else if (cell===WATER) drawWater(x,y,t);
          else if (cell===SAND) drawSand(x,y);
          else if (cell===ICE) drawIce(x,y);
          else if (cell===ELECTRIC) drawElectric(x,y,t);
          else if (cell===PORTAL_A) drawPortal(x,y,'#5cc9ff',t);
          else if (cell===PORTAL_B) drawPortal(x,y,'#ff5c9d',t);
          else if (cell===TOGGLE) drawToggle(x,y,togglePhaseAt(r,c));
          else if (cell===CONVEYOR){
            var cv = conveyorTiles.filter(function(o){return o.r===r&&o.c===c;})[0];
            drawConveyor(x,y,cv?cv.dir:'right',t);
          }
        }
      }
    }
    drawSnipeTelegraph();
    drawMinesAndTurrets(t);
    drawFlames();
    bullets.forEach(drawBullet);
    if (player && player.alive && !player.respawning){
      var blink = player.invuln>0 && !reducedMotion && Math.floor(t*10)%2===0;
      var color = upgrades.legendary ? '#5fae3f' : '#4a7c3f';
      var accent = upgrades.legendary ? '#ffd23f' : undefined;
      if (!blink) drawTank(player, color, 1, accent);
    }
    enemies.forEach(function(e){
      if (!e.alive) return;
      if (e.type==='boss'){
        var bdef = BOSS_DEFS[e.bossKey];
        drawTank(e, bdef.color, e.shieldTimer>0?0.6:1, bdef.accent);
        drawBossHpBar(e);
      } else {
        var def = ENEMY_DEFS[e.type]||ENEMY_DEFS.recluta;
        drawTank(e, def.color, e.phased?0.35:1, def.accent);
      }
    });
    drawParticles();
    if (fogLevel && player){
      ctx.save();
      var grad = ctx.createRadialGradient(player.x+player.w/2,player.y+player.h/2, 40, player.x+player.w/2,player.y+player.h/2, 150);
      grad.addColorStop(0,'rgba(0,0,0,0)');
      grad.addColorStop(1,'rgba(0,0,0,0.82)');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,COLS*TILE,ROWS*TILE);
      ctx.restore();
    }
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
  function togglePause(){
    if (gameState !== 'play') return;
    if (!isPaused){
      isPaused = true;
      pauseTanksLoop();
      pauseOverlay.classList.remove('is-hidden');
    } else {
      isPaused = false;
      pauseOverlay.classList.add('is-hidden');
      startTanksLoop();
    }
  }
  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', togglePause);
  function loop(ts){
    if (!tanksLoopRunning) return;
    if (lastTime===null) lastTime = ts;
    var dt = Math.min(0.033, (ts-lastTime)/1000);
    lastTime = ts;
    var t = ts/1000;
    tick(dt);
    updateVisuals(dt);
    updateParticles(dt);
    render(t);
    if (gameState === 'play'){
      levelElapsed += dt;
      if (timeEl) timeEl.textContent = formatTime(levelElapsed);
      updateBottomBar();
    }
    requestAnimationFrame(loop);
  }

  function startLevel(){
    gameState = 'play';
    currentLevelDef = levelDef(currentLevel);
    currentEnemyDef = currentLevelDef.enemy ? ENEMY_DEFS[currentLevelDef.enemy] : null;
    var mapData = buildMap(currentLevelDef.map, currentLevel);
    grid = mapData.grid; baseRow = mapData.baseRow; baseCol = mapData.baseCol;
    buildGroundTexture();
    enemies = []; bullets = []; particles = []; flames = [];
    shiftTimer = 0;
    dirStack.length = 0;

    var spawnX = (baseCol-3)*TILE + (TILE-PLAYER_SIZE)/2;
    var spawnY = (ROWS-1)*TILE + (TILE-PLAYER_SIZE)/2;
    player = makeTank(spawnX, spawnY, true);
    player.invuln = INVULN_TIME;
    player.bombCooldown = 0;

    if (currentLevelDef.boss){
      totalEnemies = 1; spawnedEnemies = 1;
      var bossW = ENEMY_SIZE*1.9;
      var boss = makeBoss(currentLevelDef.boss, (COLS*TILE-bossW)/2, TILE*1.5);
      enemies.push(boss);
    } else {
      totalEnemies = Math.min(20, 6+currentLevel);
      spawnedEnemies = 0;
      spawnTimer = 0.6;
    }
    killedCount = 0;
    levelElapsed = 0;
    isPaused = false;

    updateHUD();
    updateProgressPanel();
    startOverlay.classList.add('is-hidden');
    clearOverlay.classList.add('is-hidden');
    overOverlay.classList.add('is-hidden');
    pauseOverlay.classList.add('is-hidden');
    tBomb.style.display = currentLevel>=4 ? '' : 'none';
    ensureAudio();
    startTanksLoop();
  }

  function enemyLabel(key){
    var labels = {
      recluta:'Tanque Recluta', doble:'Tanque Doble', bombardero:'Tanque Bombardero',
      francotirador:'Tanque Francotirador', escudo:'Tanque Escudo', rebote:'Tanque Rebote',
      lanzaminas:'Tanque Lanzaminas', congelador:'Tanque Congelador', kamikaze:'Tanque Kamikaze',
      triple:'Tanque Triple', electrico:'Tanque Eléctrico', fantasma:'Tanque Fantasma',
      lanzallamas:'Tanque Lanzallamas', magnetico:'Tanque Magnético', misilero:'Tanque Misilero',
      experimental:'Tanque Experimental'
    };
    return labels[key] || key;
  }

  function showTanksIntro(){
    var def = levelDef(currentLevel);
    var hint = 'Usá las flechas para mover tu tanque y Espacio para disparar.';
    if (def.boss){
      startTitleEl.textContent = '¿Listo para el '+BOSS_DEFS[def.boss].label+'?';
      hint = '¡Apareció un JEFE! Usá tus bombas (tecla B o 💣) y esquivá sus ataques. Al vencerlo desbloqueás: '+def.upgrade.label+'.';
    } else {
      startTitleEl.textContent = '¿Listo para el Nivel '+currentLevel+'?';
      hint += ' Enemigo de este nivel: '+enemyLabel(def.enemy)+'. Al superarlo desbloqueás: '+def.upgrade.label+'.';
    }
    startDescEl.textContent = hint;
  }
  showTanksIntro();

  startBtn.addEventListener('click', startLevel);
  retryBtn.addEventListener('click', startLevel);
  nextBtn.addEventListener('click', function(){
    if (currentLevel >= LEVELS.length){
      currentLevel = 1;
      upgrades = freshUpgrades();
      lives = 3;
    } else {
      currentLevel += 1;
    }
    showTanksIntro();
    startLevel();
  });
  resetBtn.addEventListener('click', function(){
    currentLevel = 1;
    upgrades = freshUpgrades();
    lives = 3;
    showTanksIntro();
    startLevel();
  });

  var initialMap = buildMap(levelDef(1).map, 1);
  grid = initialMap.grid; baseRow = initialMap.baseRow; baseCol = initialMap.baseCol;
  buildGroundTexture();
  tBomb.style.display = 'none';
  render(0);
})();
