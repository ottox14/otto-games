// Copa Libertadores: preview estilo "cabezazo" (miniball) - River vs Boca.
// Un jugador humano (River) contra una CPU (Boca), fisica simple de
// gravedad + rebotes, patada con rango, gol al cruzar la linea dentro
// del alto del arco.
(function(){
  var CANVAS_W = 920, CANVAS_H = 480;
  var GROUND_Y = 400;
  var GOAL_H = 130;
  var GOAL_DEPTH = 26;
  var PLAYER_R = 30;
  var BALL_R = 14;
  var GRAVITY = 1500;
  var JUMP_VY = -580;
  var MOVE_SPEED = 250;
  var AI_MOVE_SPEED = 215;
  var KICK_RANGE = 70;
  var KICK_COOLDOWN = 0.35;
  var MATCH_SECONDS = 90;

  var TEAMS = {
    river: {name:'River', shirt:'#fbfbfb', band:'#d61f3c', shorts:'#151b3d', attackDir:1},
    boca:  {name:'Boca',  shirt:'#12295c', band:'#ffd23f', shorts:'#ffd23f', attackDir:-1}
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var portalView = document.getElementById('portalView');
  var liberView = document.getElementById('libertadoresView');
  var playLiberBtn = document.getElementById('playLiberBtn');
  var backFromLiberBtn = document.getElementById('backFromLiberBtn');
  var muteBtn = document.getElementById('liberMuteBtn');

  var scoreRiverEl = document.getElementById('liberScoreRiver');
  var scoreBocaEl = document.getElementById('liberScoreBoca');
  var timeValEl = document.getElementById('liberTimeVal');

  var startOverlay = document.getElementById('liberStartOverlay');
  var startBtn = document.getElementById('liberStartBtn');
  var overOverlay = document.getElementById('liberOverOverlay');
  var overTitleEl = document.getElementById('liberOverTitle');
  var overScoreEl = document.getElementById('liberOverScore');
  var retryBtn = document.getElementById('liberRetryBtn');

  var canvas = document.getElementById('liberCanvas');
  var ctx = canvas.getContext('2d');
  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W*dpr;
    canvas.height = CANVAS_H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  function liberActive(){ return !liberView.classList.contains('is-hidden'); }

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

  // ---------- Estado ----------
  function makePlayer(teamId, x, isAI){
    return {
      teamId: teamId, team: TEAMS[teamId],
      x: x, y: GROUND_Y-PLAYER_R, vx: 0, vy: 0,
      onGround: true, facing: TEAMS[teamId].attackDir, isAI: !!isAI,
      kickCooldown: 0, kicking: 0,
      aiDecisionT: 0, aiDir: 0, aiWantsJump: false
    };
  }
  var river = makePlayer('river', CANVAS_W*0.28, false);
  var boca = makePlayer('boca', CANVAS_W*0.72, true);
  var ball = {x:CANVAS_W/2, y:GROUND_Y-BALL_R, vx:0, vy:0};

  var scoreRiver = 0, scoreBoca = 0;
  var matchTimeLeft = MATCH_SECONDS;
  var matchState = 'idle'; // 'idle' | 'playing' | 'goal' | 'over'
  var goalTimer = 0;
  var lastGoalTeam = null;

  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

  function resetKickoff(){
    river.x = CANVAS_W*0.28; river.y = GROUND_Y-PLAYER_R; river.vx=0; river.vy=0; river.onGround=true;
    boca.x = CANVAS_W*0.72; boca.y = GROUND_Y-PLAYER_R; boca.vx=0; boca.vy=0; boca.onGround=true;
    river.kickCooldown=0; boca.kickCooldown=0;
    ball.x = CANVAS_W/2; ball.y = GROUND_Y-BALL_R; ball.vx=0; ball.vy=0;
  }

  function updateHud(){
    scoreRiverEl.textContent = scoreRiver;
    scoreBocaEl.textContent = scoreBoca;
    var m = Math.floor(Math.max(0,matchTimeLeft)/60);
    var s = Math.floor(Math.max(0,matchTimeLeft)%60);
    timeValEl.textContent = m+':'+(s<10?'0':'')+s;
  }

  function resetMatch(){
    scoreRiver = 0; scoreBoca = 0;
    matchTimeLeft = MATCH_SECONDS;
    matchState = 'idle';
    goalTimer = 0;
    resetKickoff();
    updateHud();
    draw(0);
  }

  // ---------- Entrada ----------
  var dirStack = [];
  function pressDir(dir){ if (dirStack.indexOf(dir)===-1) dirStack.push(dir); }
  function releaseDir(dir){ var i=dirStack.indexOf(dir); if (i!==-1) dirStack.splice(i,1); }
  function currentDir(){ return dirStack.length ? dirStack[dirStack.length-1] : null; }

  function doJump(){
    if (matchState !== 'playing') return;
    if (river.onGround){
      river.vy = JUMP_VY;
      river.onGround = false;
      beep(500, 0.08, 'sine');
    }
  }
  function doKick(){
    if (matchState !== 'playing') return;
    attemptKick(river);
  }

  var KEY_DIR = {ArrowLeft:'left', ArrowRight:'right'};
  window.addEventListener('keydown', function(e){
    if (!liberActive()) return;
    if (KEY_DIR[e.code]){
      e.preventDefault();
      pressDir(KEY_DIR[e.code]);
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW'){
      e.preventDefault();
      doJump();
    } else if (e.code === 'Space'){
      e.preventDefault();
      doKick();
    }
  });
  window.addEventListener('keyup', function(e){
    if (!liberActive()) return;
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
    function dirFromAngle(dx, dist){
      if (dist < maxDist*0.32) return null;
      return dx < 0 ? dirs[0] : dirs[1];
    }
    function move(e){
      var rect = joyEl.getBoundingClientRect();
      var dx = e.clientX - (rect.left + rect.width/2);
      var dy = e.clientY - (rect.top + rect.height/2);
      var dist = Math.min(Math.sqrt(dx*dx+dy*dy), maxDist);
      var ang = Math.atan2(dy, dx);
      thumb.style.transform = 'translate('+(Math.cos(ang)*dist)+'px,'+(Math.sin(ang)*dist)+'px)';
      setDir(dirFromAngle(dx, Math.sqrt(dx*dx+dy*dy)));
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
      ensureAudio();
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
  bindJoystick(document.getElementById('liberJoystick'), ['left','right']);
  document.getElementById('liberJumpBtn').addEventListener('pointerdown', function(e){
    e.preventDefault(); ensureAudio(); doJump();
  });
  document.getElementById('liberKickBtn').addEventListener('pointerdown', function(e){
    e.preventDefault(); ensureAudio(); doKick();
  });

  // ---------- Fisica ----------
  function updatePlayerPhysics(p, dt){
    p.x += p.vx*dt;
    p.x = clamp(p.x, PLAYER_R, CANVAS_W-PLAYER_R);
    p.vy += GRAVITY*dt;
    p.y += p.vy*dt;
    if (p.y >= GROUND_Y-PLAYER_R){
      p.y = GROUND_Y-PLAYER_R;
      p.vy = 0;
      p.onGround = true;
    }
    if (p.kickCooldown > 0) p.kickCooldown -= dt;
    if (p.kicking > 0) p.kicking -= dt;
  }

  function resolvePlayerCollision(){
    var dx = boca.x-river.x;
    var dy = boca.y-river.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    var minDist = PLAYER_R*1.7;
    if (dist > 0 && dist < minDist){
      var overlap = (minDist-dist)/2;
      var nx = dx/dist, ny = dy/dist;
      river.x -= nx*overlap; river.y -= ny*overlap;
      boca.x += nx*overlap; boca.y += ny*overlap;
      river.x = clamp(river.x, PLAYER_R, CANVAS_W-PLAYER_R);
      boca.x = clamp(boca.x, PLAYER_R, CANVAS_W-PLAYER_R);
    }
  }

  function attemptKick(p){
    if (p.kickCooldown > 0) return;
    var dx = ball.x-p.x, dy = ball.y-p.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > KICK_RANGE) return;
    p.kickCooldown = KICK_COOLDOWN;
    p.kicking = 0.18;
    var attackDir = p.team.attackDir;
    var power = 600, lift = -320;
    if (p.isAI){
      var quality = 0.6 + Math.random()*0.6;
      power *= quality;
      lift *= 0.55 + Math.random()*0.6;
    }
    ball.vx = attackDir*power + p.vx*0.35;
    ball.vy = lift + Math.min(0, dy)*0.4;
    beep(320, 0.07, 'square');
    setTimeout(function(){ beep(420, 0.06, 'square'); }, 40);
  }

  function collideBallPlayer(p){
    var dx = ball.x-p.x, dy = ball.y-p.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    var minDist = PLAYER_R+BALL_R;
    if (dist > 0.001 && dist < minDist){
      var nx = dx/dist, ny = dy/dist;
      var overlap = minDist-dist;
      ball.x += nx*overlap;
      ball.y += ny*overlap;
      var relSpeed = 250;
      ball.vx = nx*relSpeed + p.vx*0.5;
      ball.vy = ny*relSpeed + p.vy*0.3 - 40;
    }
  }

  function updateBall(dt){
    ball.vx *= 0.999;
    ball.vy += GRAVITY*dt;
    ball.x += ball.vx*dt;
    ball.y += ball.vy*dt;

    if (ball.y > GROUND_Y-BALL_R){
      ball.y = GROUND_Y-BALL_R;
      ball.vy *= -0.62;
      ball.vx *= 0.985;
      if (Math.abs(ball.vy) < 40) ball.vy = 0;
    }
    if (ball.y < BALL_R){ ball.y = BALL_R; ball.vy *= -0.5; }

    if (ball.x-BALL_R <= 0){
      if (ball.y+BALL_R > GROUND_Y-GOAL_H){
        scoreGoal('boca');
        return;
      }
      ball.x = BALL_R; ball.vx *= -0.7;
    }
    if (ball.x+BALL_R >= CANVAS_W){
      if (ball.y+BALL_R > GROUND_Y-GOAL_H){
        scoreGoal('river');
        return;
      }
      ball.x = CANVAS_W-BALL_R; ball.vx *= -0.7;
    }
  }

  function scoreGoal(teamId){
    if (matchState !== 'playing') return;
    if (teamId === 'river') scoreRiver += 1; else scoreBoca += 1;
    lastGoalTeam = teamId;
    matchState = 'goal';
    goalTimer = 1.6;
    updateHud();
    beep(700, 0.12, 'triangle');
    setTimeout(function(){ beep(950, 0.12, 'triangle'); }, 100);
    setTimeout(function(){ beep(1200, 0.18, 'triangle'); }, 220);
  }

  function updateAI(dt){
    boca.aiDecisionT -= dt;
    if (boca.aiDecisionT <= 0){
      boca.aiDecisionT = 0.18 + Math.random()*0.16;
      var dx = ball.x-boca.x, dy = ball.y-boca.y;
      boca.aiDir = Math.abs(dx) < 16 ? 0 : (dx>0 ? 1 : -1);
      boca.aiWantsJump = boca.onGround && ball.y < boca.y-30 && Math.abs(dx) < 90 && ball.vy > -80;
      if (Math.sqrt(dx*dx+dy*dy) < KICK_RANGE && Math.random() < 0.55){
        attemptKick(boca);
      }
    }
    boca.vx = boca.aiDir*AI_MOVE_SPEED;
    if (boca.aiDir !== 0) boca.facing = boca.aiDir;
    if (boca.aiWantsJump && boca.onGround){
      boca.vy = JUMP_VY;
      boca.onGround = false;
      boca.aiWantsJump = false;
    }
  }

  function endMatch(){
    matchState = 'over';
    var title, scoreText;
    scoreText = 'River '+scoreRiver+' - '+scoreBoca+' Boca';
    if (scoreRiver > scoreBoca) title = '¡Ganó River!';
    else if (scoreBoca > scoreRiver) title = '¡Ganó Boca!';
    else title = '¡Empate!';
    overTitleEl.textContent = title;
    overScoreEl.textContent = scoreText;
    overOverlay.classList.remove('is-hidden');
    pauseLiberLoop();
  }

  // ---------- Dibujo ----------
  function drawPitch(){
    var c = ctx;
    var skyGrad = c.createLinearGradient(0,0,0,GROUND_Y-GOAL_H-30);
    skyGrad.addColorStop(0, '#8fd3f4');
    skyGrad.addColorStop(1, '#cfeadf');
    c.fillStyle = skyGrad;
    c.fillRect(0,0,CANVAS_W,GROUND_Y-GOAL_H-30);

    c.fillStyle = 'rgba(50,40,80,0.22)';
    c.fillRect(0,10,CANVAS_W,26);
    for (var cx=6; cx<CANVAS_W; cx+=9){
      c.fillStyle = ['#ff9fc0','#ffd23f','#6fe0d9','#ffffff','#ff7fa8'][(cx*7)%5];
      c.globalAlpha = 0.55;
      c.fillRect(cx, 14+((cx%3)*3), 4, 4);
    }
    c.globalAlpha = 1;

    var grassTop = GROUND_Y-GOAL_H-30;
    var grassGrad = c.createLinearGradient(0,grassTop,0,CANVAS_H);
    grassGrad.addColorStop(0, '#4fae4f');
    grassGrad.addColorStop(1, '#1f6a29');
    c.fillStyle = grassGrad;
    c.fillRect(0,grassTop,CANVAS_W,CANVAS_H-grassTop);

    c.fillStyle = 'rgba(255,255,255,0.05)';
    var stripeW = 46;
    for (var sx=0, i=0; sx<CANVAS_W; sx+=stripeW, i++){
      if (i%2===0) c.fillRect(sx, grassTop, stripeW, CANVAS_H-grassTop);
    }

    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(CANVAS_W/2, grassTop+6); c.lineTo(CANVAS_W/2, CANVAS_H); c.stroke();
    c.beginPath(); c.arc(CANVAS_W/2, GROUND_Y, 46, 0, Math.PI*2); c.stroke();

    drawGoal(true);
    drawGoal(false);
  }

  function drawGoal(atLeft){
    var c = ctx;
    var gx = atLeft ? 0 : CANVAS_W;
    var dir = atLeft ? 1 : -1;
    var topY = GROUND_Y-GOAL_H;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1;
    c.beginPath();
    for (var nx=0; nx<=GOAL_DEPTH; nx+=8){ c.moveTo(gx+dir*nx, topY); c.lineTo(gx+dir*nx, GROUND_Y); }
    for (var ny=topY; ny<=GROUND_Y; ny+=10){ c.moveTo(gx, ny); c.lineTo(gx+dir*GOAL_DEPTH, ny); }
    c.stroke();
    c.restore();

    c.strokeStyle = '#f5f5f5';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(gx+dir*GOAL_DEPTH, GROUND_Y);
    c.lineTo(gx+dir*GOAL_DEPTH, topY);
    c.lineTo(gx, topY);
    c.stroke();
  }

  function drawShadow(x){
    var c = ctx;
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(x, GROUND_Y+4, 24, 7, 0, 0, Math.PI*2);
    c.fill();
    c.restore();
  }

  function drawPlayer(p, t){
    var c = ctx;
    drawShadow(p.x);
    c.save();
    c.translate(p.x, p.y);

    var legSwing = Math.abs(p.vx) > 5 && p.onGround && !reducedMotion ? Math.sin(t*10)*10 : 0;
    c.strokeStyle = p.team.shorts;
    c.lineWidth = 9;
    c.lineCap = 'round';
    if (p.kicking > 0){
      var kProg = 1-(p.kicking/0.18);
      var kickX = p.team.attackDir*(14+kProg*20);
      c.beginPath(); c.moveTo(-6,PLAYER_R-4); c.lineTo(-6+ -p.team.attackDir*4, PLAYER_R+16); c.stroke();
      c.beginPath(); c.moveTo(6,PLAYER_R-6); c.lineTo(kickX, PLAYER_R-2); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-7,PLAYER_R-4); c.lineTo(-7+legSwing*0.4,PLAYER_R+18); c.stroke();
      c.beginPath(); c.moveTo(7,PLAYER_R-4); c.lineTo(7-legSwing*0.4,PLAYER_R+18); c.stroke();
    }

    c.fillStyle = p.team.shirt;
    c.beginPath();
    c.arc(0,0,PLAYER_R,0,Math.PI*2);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.15)';
    c.lineWidth = 1.5;
    c.stroke();

    c.save();
    c.beginPath(); c.arc(0,0,PLAYER_R,0,Math.PI*2); c.clip();
    c.fillStyle = p.team.band;
    if (p.teamId === 'river'){
      c.beginPath();
      c.moveTo(-PLAYER_R,-8); c.lineTo(-PLAYER_R,8); c.lineTo(PLAYER_R,-8); c.lineTo(PLAYER_R,-24);
      c.closePath(); c.fill();
    } else {
      c.fillRect(-PLAYER_R,-10,PLAYER_R*2,14);
    }
    c.restore();

    c.fillStyle = '#241a3d';
    var eyeDir = p.facing >= 0 ? 1 : -1;
    c.beginPath();
    c.arc(eyeDir*8-2,-6,3,0,Math.PI*2);
    c.arc(eyeDir*8+8,-6,3,0,Math.PI*2);
    c.fill();

    c.restore();
  }

  function drawBallPentagon(c, cx, cy, r){
    c.beginPath();
    for (var i=0;i<5;i++){
      var ang = -Math.PI/2 + i*(2*Math.PI/5);
      var px = cx+Math.cos(ang)*r, py = cy+Math.sin(ang)*r;
      if (i===0) c.moveTo(px,py); else c.lineTo(px,py);
    }
    c.closePath();
    c.fill();
  }
  function drawBall(){
    var c = ctx;
    drawShadow(ball.x);
    c.save();
    c.translate(ball.x, ball.y);
    c.fillStyle = '#f5f5f0';
    c.beginPath(); c.arc(0,0,BALL_R,0,Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(30,30,30,0.5)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = 'rgba(30,30,30,0.8)';
    drawBallPentagon(c,0,-3.2,3.4);
    drawBallPentagon(c,-6,4,2.8);
    drawBallPentagon(c,6,4,2.8);
    c.restore();
  }

  function drawGoalText(){
    if (matchState !== 'goal') return;
    var c = ctx;
    var prog = clamp(1-(goalTimer/1.6), 0, 1);
    var scale = prog < 0.25 ? (prog/0.25) : 1;
    var alpha = prog > 0.8 ? (1-prog)/0.2 : 1;
    var team = TEAMS[lastGoalTeam];
    c.save();
    c.globalAlpha = clamp(alpha,0,1);
    c.translate(CANVAS_W/2, CANVAS_H*0.4);
    c.scale(scale, scale);
    c.font = '900 54px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillText('¡GOL DE '+team.name.toUpperCase()+'!', 3, 3);
    c.fillStyle = lastGoalTeam==='boca' ? '#ffd23f' : '#ff5c7a';
    c.fillText('¡GOL DE '+team.name.toUpperCase()+'!', 0, 0);
    c.restore();
  }

  function draw(ts){
    var t = (ts||0)/1000;
    drawPitch();
    drawPlayer(river, t);
    drawPlayer(boca, t);
    drawBall();
    drawGoalText();
  }

  // ---------- Loop ----------
  var liberLoopRunning = false;
  var lastTs = null;
  function startLiberLoop(){
    if (liberLoopRunning) return;
    liberLoopRunning = true;
    lastTs = null;
    requestAnimationFrame(liberLoop);
  }
  function pauseLiberLoop(){
    liberLoopRunning = false;
  }
  function liberLoop(ts){
    if (!liberLoopRunning) return;
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(0.033, (ts-lastTs)/1000);
    lastTs = ts;

    if (matchState === 'playing'){
      matchTimeLeft -= dt;
      if (matchTimeLeft <= 0){
        matchTimeLeft = 0;
        updateHud();
        endMatch();
        draw(ts);
        return;
      }
      updateHud();

      river.vx = currentDir()==='left' ? -MOVE_SPEED : (currentDir()==='right' ? MOVE_SPEED : 0);
      if (currentDir()) river.facing = currentDir()==='right' ? 1 : -1;

      updatePlayerPhysics(river, dt);
      updatePlayerPhysics(boca, dt);
      updateAI(dt);
      resolvePlayerCollision();
      updateBall(dt);
      collideBallPlayer(river);
      collideBallPlayer(boca);
    } else if (matchState === 'goal'){
      goalTimer -= dt;
      if (goalTimer <= 0){
        if (matchTimeLeft <= 0){
          endMatch();
        } else {
          resetKickoff();
          matchState = 'playing';
        }
      }
    }

    draw(ts);
    requestAnimationFrame(liberLoop);
  }

  // ---------- Navegacion ----------
  playLiberBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    liberView.classList.remove('is-hidden');
    startOverlay.classList.remove('is-hidden');
    overOverlay.classList.add('is-hidden');
    resetMatch();
  });
  backFromLiberBtn.addEventListener('click', function(){
    liberView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseLiberLoop();
    dirStack.length = 0;
  });
  startBtn.addEventListener('click', function(){
    ensureAudio();
    startOverlay.classList.add('is-hidden');
    matchState = 'playing';
    startLiberLoop();
  });
  retryBtn.addEventListener('click', function(){
    ensureAudio();
    overOverlay.classList.add('is-hidden');
    resetMatch();
    matchState = 'playing';
    startLiberLoop();
  });
})();
