// Modo Liga: mismo futbol de mesa por turnos que Copa Libertadores (fichas
// circulares con fisica, se apunta arrastrando y se suelta para disparar),
// pero en formato liga de todos contra todos: 20 equipos, ida y vuelta (38
// fechas), una unica tabla de posiciones. Elegis un equipo y solo jugas sus
// partidos; la IA simula el resto de cada fecha y recien ahi arranca la
// siguiente.
(function(){
  var CANVAS_W = 900, CANVAS_H = 560;
  var MARGIN = 20;
  var PITCH_L = MARGIN, PITCH_R = CANVAS_W-MARGIN, PITCH_T = MARGIN, PITCH_B = CANVAS_H-MARGIN;
  var PITCH_CX = (PITCH_L+PITCH_R)/2, PITCH_CY = (PITCH_T+PITCH_B)/2;
  var GOAL_W = 116;
  var GOAL_DEPTH = 36;
  var BOX_W = 118, BOX_H = 260;
  var SIX_W = 44, SIX_H = 138;
  var PEN_DIST = 76;
  var CENTER_R = 62;

  var PIECE_R = 23;
  var BALL_R = 15;
  var PIECE_MASS = 1, BALL_MASS = 0.42;
  var FRICTION_BASE = 0.15; // fraction of speed left after 1s - higher = glides longer
  var REST_SPEED = 4;
  var MAX_DRAG = 130;
  var POWER_SCALE = 5.4;
  var WALL_REST = 0.7;
  var BODY_REST = 0.88;
  var MATCH_DURATION = 90; // segundos - sin limite de tiros, se juega a reloj

  var TEAMS = [
    {id:'man_city', strength:95, name:'Manchester City', nickname:'The Citizens', shirt:'#6cabdd', band:'#1c2c5b'},
    {id:'arsenal', strength:90, name:'Arsenal', nickname:'The Gunners', shirt:'#ef0107', band:'#ffffff'},
    {id:'liverpool', strength:89, name:'Liverpool', nickname:'The Reds', shirt:'#c8102e', band:'#00b2a9'},
    {id:'chelsea', strength:78, name:'Chelsea', nickname:'The Blues', shirt:'#034694', band:'#ffffff'},
    {id:'man_utd', strength:79, name:'Manchester United', nickname:'The Red Devils', shirt:'#da020e', band:'#ffe500'},
    {id:'tottenham', strength:78, name:'Tottenham Hotspur', nickname:'Spurs', shirt:'#ffffff', band:'#132257'},
    {id:'newcastle', strength:79, name:'Newcastle United', nickname:'The Magpies', shirt:'#f0f0f0', band:'#111111'},
    {id:'aston_villa', strength:80, name:'Aston Villa', nickname:'The Villans', shirt:'#670e36', band:'#95bfe5'},
    {id:'brighton', strength:74, name:'Brighton', nickname:'The Seagulls', shirt:'#0057b8', band:'#ffffff'},
    {id:'west_ham', strength:73, name:'West Ham United', nickname:'The Hammers', shirt:'#7a263a', band:'#1bb1e7'},
    {id:'crystal_palace', strength:71, name:'Crystal Palace', nickname:'The Eagles', shirt:'#1b458f', band:'#c4122e'},
    {id:'brentford', strength:70, name:'Brentford', nickname:'The Bees', shirt:'#e30613', band:'#ffffff'},
    {id:'fulham', strength:69, name:'Fulham', nickname:'The Cottagers', shirt:'#ffffff', band:'#111111'},
    {id:'wolves', strength:70, name:'Wolverhampton', nickname:'Wolves', shirt:'#fdb913', band:'#231f20'},
    {id:'bournemouth', strength:68, name:'Bournemouth', nickname:'The Cherries', shirt:'#da291c', band:'#111111'},
    {id:'everton', strength:69, name:'Everton', nickname:'The Toffees', shirt:'#003399', band:'#ffffff'},
    {id:'nottingham_forest', strength:67, name:'Nottingham Forest', nickname:'Forest', shirt:'#dd0000', band:'#ffffff'},
    {id:'burnley', strength:60, name:'Burnley', nickname:'The Clarets', shirt:'#6c1d45', band:'#99d6ea'},
    {id:'sheffield_united', strength:55, name:'Sheffield United', nickname:'The Blades', shirt:'#ee2737', band:'#ffffff'},
    {id:'luton_town', strength:52, name:'Luton Town', nickname:'The Hatters', shirt:'#f78f1e', band:'#002d62'}
  ];
  var TEAMS_BY_ID = {};
  TEAMS.forEach(function(t){ TEAMS_BY_ID[t.id] = t; });

  var DIFFICULTIES = {
    facil:      {label:'Fácil',      smart:0, aimNoise:0.85, powerNoise:0.5, mistakeChance:0.4},
    normal:     {label:'Normal',     smart:1, aimNoise:0.26, powerNoise:0.28, mistakeChance:0.12},
    dificil:    {label:'Difícil',    smart:2, aimNoise:0.11, powerNoise:0.16, mistakeChance:0.05},
    legendario: {label:'Legendario', smart:3, aimNoise:0.04, powerNoise:0.08, mistakeChance:0.02}
  };
  var currentDifficulty = DIFFICULTIES.normal;

  var portalView = document.getElementById('portalView');
  var ligaView = document.getElementById('ligaView');
  var playLigaBtn = document.getElementById('playLigaBtn');
  var backFromLigaBtn = document.getElementById('backFromLigaBtn');
  var muteBtn = document.getElementById('ligaMuteBtn');

  var teamSelectView = document.getElementById('ligaTeamSelectView');
  var teamGridEl = document.getElementById('ligaTeamGrid');
  var difficultyView = document.getElementById('ligaDifficultyView');
  var diffBackBtn = document.getElementById('ligaDiffBackBtn');
  var seasonView = document.getElementById('ligaSeasonView');
  var seasonTitleEl = document.getElementById('ligaSeasonTitle');
  var tableBodyEl = document.getElementById('ligaTableBody');
  var nextLabelEl = document.getElementById('ligaNextLabel');
  var nextMatchEl = document.getElementById('ligaNextMatch');
  var playBtn = document.getElementById('ligaPlayBtn');
  var resultsEl = document.getElementById('ligaResults');
  var endView = document.getElementById('ligaEndView');
  var endTitleEl = document.getElementById('ligaEndTitle');
  var endTextEl = document.getElementById('ligaEndText');
  var finalTableBodyEl = document.getElementById('ligaFinalTableBody');
  var endRetryBtn = document.getElementById('ligaEndRetryBtn');
  var matchView = document.getElementById('ligaMatchView');

  var homeChipBadge = document.getElementById('ligaHomeBadge');
  var awayChipBadge = document.getElementById('ligaAwayBadge');
  var scoreHomeEl = document.getElementById('ligaScoreHome');
  var scoreAwayEl = document.getElementById('ligaScoreAway');
  var turnValEl = document.getElementById('ligaTurnVal');
  var timeValEl = document.getElementById('ligaTimeVal');

  var startOverlay = document.getElementById('ligaStartOverlay');
  var startTitleEl = document.getElementById('ligaStartTitle');
  var startBtn = document.getElementById('ligaStartBtn');
  var overOverlay = document.getElementById('ligaOverOverlay');
  var overTitleEl = document.getElementById('ligaOverTitle');
  var overScoreEl = document.getElementById('ligaOverScore');
  var overContinueBtn = document.getElementById('ligaOverContinueBtn');

  var canvas = document.getElementById('ligaCanvas');
  var ctx = canvas.getContext('2d');
  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W*dpr;
    canvas.height = CANVAS_H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

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

  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
  function shuffle(arr){
    for (var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // ---------- Temporada (liga de todos contra todos) ----------
  var season = {
    yourId: null, difficulty: 'normal', teams: [], rounds: [], roundIndex: 0,
    standings: {}, pendingOpponent: null
  };

  function makeStandingsMap(teamIds){
    var map = {};
    teamIds.forEach(function(id){ map[id] = {teamId:id, pts:0, gf:0, ga:0, played:0, won:0, drawn:0, lost:0}; });
    return map;
  }
  function applyResultTo(map, aId, bId, golA, golB){
    var sa = map[aId], sb = map[bId];
    sa.gf += golA; sa.ga += golB; sa.played += 1;
    sb.gf += golB; sb.ga += golA; sb.played += 1;
    if (golA > golB){ sa.pts += 3; sa.won += 1; sb.lost += 1; }
    else if (golB > golA){ sb.pts += 3; sb.won += 1; sa.lost += 1; }
    else { sa.pts += 1; sb.pts += 1; sa.drawn += 1; sb.drawn += 1; }
  }
  function applyResult(aId, bId, golA, golB){ applyResultTo(season.standings, aId, bId, golA, golB); }

  // Poisson sample (Knuth) - para que los marcadores simulados parezcan reales.
  function samplePoisson(mean){
    var L = Math.exp(-mean), k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k-1;
  }
  function simRealisticScore(aId, bId, homeAdvantage){
    var ta = TEAMS_BY_ID[aId], tb = TEAMS_BY_ID[bId];
    var diff = (ta.strength - tb.strength) / 100;
    var baseA = 1.2 + diff*0.85;
    var baseB = 1.2 - diff*0.85;
    if (homeAdvantage){ baseA += 0.15; baseB -= 0.1; }
    baseA = Math.max(0.35, Math.min(2.6, baseA));
    baseB = Math.max(0.3, Math.min(2.4, baseB));
    var golA = Math.min(samplePoisson(baseA), 4);
    var golB = Math.min(samplePoisson(baseB), 4);
    if (golA - golB > 4) golA = golB + 4;
    if (golB - golA > 4) golB = golA + 4;
    return [golA, golB];
  }

  function sortStandingsMap(map, teamIds){
    return teamIds.map(function(id){ return map[id]; }).slice().sort(function(a,b){
      if (b.pts !== a.pts) return b.pts-a.pts;
      var gdA = a.gf-a.ga, gdB = b.gf-b.ga;
      if (gdB !== gdA) return gdB-gdA;
      if (b.gf !== a.gf) return b.gf-a.gf;
      return TEAMS_BY_ID[a.teamId].name.localeCompare(TEAMS_BY_ID[b.teamId].name);
    });
  }

  // Calendario ida y vuelta (metodo del circulo): 19 fechas de ida (cada
  // equipo juega una vez contra todos) + 19 de vuelta con local/visitante
  // invertido = 38 fechas, 10 partidos por fecha, sincronizadas para todos.
  function buildSingleRoundRobin(teamIds){
    var n = teamIds.length;
    var arr = teamIds.slice();
    var rounds = [];
    for (var r=0; r<n-1; r++){
      var pairs = [];
      for (var i=0; i<n/2; i++){
        var a = arr[i], b = arr[n-1-i];
        pairs.push(r%2===1 ? [b,a] : [a,b]);
      }
      rounds.push(pairs);
      arr = [arr[0], arr[n-1]].concat(arr.slice(1, n-1));
    }
    return rounds;
  }
  function buildDoubleRoundRobin(teamIds){
    var first = buildSingleRoundRobin(teamIds);
    var second = first.map(function(round){ return round.map(function(pair){ return [pair[1], pair[0]]; }); });
    return first.concat(second);
  }

  function findYourPairIndex(round){
    for (var i=0; i<round.pairs.length; i++){
      if (round.pairs[i][0] === season.yourId || round.pairs[i][1] === season.yourId) return i;
    }
    return -1;
  }

  function startSeason(yourId, difficulty){
    season.yourId = yourId;
    season.difficulty = difficulty;
    currentDifficulty = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;

    var others = TEAMS.filter(function(t){ return t.id !== yourId; }).map(function(t){ return t.id; });
    season.teams = shuffle([yourId].concat(others));
    var rawRounds = buildDoubleRoundRobin(season.teams);
    season.rounds = rawRounds.map(function(pairs){
      return {pairs: pairs, results: pairs.map(function(){ return null; }), played: false};
    });
    season.roundIndex = 0;
    season.standings = makeStandingsMap(season.teams);

    showSeasonScreen();
  }

  function hideAllSubViews(){
    teamSelectView.classList.add('is-hidden');
    difficultyView.classList.add('is-hidden');
    seasonView.classList.add('is-hidden');
    endView.classList.add('is-hidden');
    matchView.classList.add('is-hidden');
  }

  function renderStandingsRows(bodyEl, markChampion){
    var sorted = sortStandingsMap(season.standings, season.teams);
    bodyEl.innerHTML = '';
    sorted.forEach(function(s, idx){
      var tr = document.createElement('tr');
      var cls = '';
      if (s.teamId === season.yourId) cls += 'is-you ';
      if (markChampion && idx === 0) cls += 'is-champion ';
      tr.className = cls.trim();
      var gd = s.gf-s.ga;
      tr.innerHTML = '<td>'+(idx+1)+'</td><td>'+TEAMS_BY_ID[s.teamId].name+'</td><td>'+s.played+'</td><td>'+s.won+'</td>'+
        '<td>'+s.drawn+'</td><td>'+s.lost+'</td><td>'+s.gf+'</td><td>'+s.ga+'</td><td>'+(gd>0?'+':'')+gd+'</td><td>'+s.pts+'</td>';
      bodyEl.appendChild(tr);
    });
    return sorted;
  }

  function renderResultsPanel(){
    resultsEl.innerHTML = '';
    if (season.roundIndex === 0) return;
    var prevRound = season.rounds[season.roundIndex-1];
    var title = document.createElement('div');
    title.className = 'liga-results-title';
    title.textContent = 'Resultados — Fecha '+season.roundIndex;
    resultsEl.appendChild(title);
    prevRound.pairs.forEach(function(pair, i){
      var res = prevRound.results[i];
      var isYou = pair[0] === season.yourId || pair[1] === season.yourId;
      var line = document.createElement('div');
      line.className = 'liga-result-line'+(isYou ? ' is-you' : '');
      line.textContent = TEAMS_BY_ID[pair[0]].name+' '+res[0]+'-'+res[1]+' '+TEAMS_BY_ID[pair[1]].name;
      resultsEl.appendChild(line);
    });
  }

  function showSeasonScreen(){
    hideAllSubViews();
    seasonView.classList.remove('is-hidden');
    var round = season.rounds[season.roundIndex];
    var yourIdx = findYourPairIndex(round);
    var pair = round.pairs[yourIdx];
    season.pendingOpponent = pair[0] === season.yourId ? pair[1] : pair[0];

    seasonTitleEl.textContent = 'Fecha '+(season.roundIndex+1)+' de '+season.rounds.length;
    nextLabelEl.textContent = 'Fecha '+(season.roundIndex+1);
    nextMatchEl.textContent = TEAMS_BY_ID[pair[0]].name+' vs '+TEAMS_BY_ID[pair[1]].name;
    renderStandingsRows(tableBodyEl, false);
    renderResultsPanel();
  }

  function endSeason(){
    hideAllSubViews();
    endView.classList.remove('is-hidden');
    var sorted = renderStandingsRows(finalTableBodyEl, true);
    var champion = sorted[0];
    var yourPos = 1;
    for (var i=0;i<sorted.length;i++){ if (sorted[i].teamId === season.yourId){ yourPos = i+1; break; } }
    var bestAtt = sorted.slice().sort(function(a,b){ return b.gf-a.gf; })[0];
    var bestDef = sorted.slice().sort(function(a,b){ return a.ga-b.ga; })[0];

    endTitleEl.textContent = (season.yourId === champion.teamId) ? '🏆 ¡Sos el campeón de la liga!' : 'Temporada terminada';
    endTextEl.textContent = 'Jugaste con '+TEAMS_BY_ID[season.yourId].name+'. Terminaste en la posición '+yourPos+' de '+sorted.length+'. '+
      'Campeón: '+TEAMS_BY_ID[champion.teamId].name+' ('+champion.pts+' pts). '+
      'Mejor ataque: '+TEAMS_BY_ID[bestAtt.teamId].name+' ('+bestAtt.gf+' goles). '+
      'Mejor defensa: '+TEAMS_BY_ID[bestDef.teamId].name+' ('+bestDef.ga+' en contra).';
  }

  playBtn.addEventListener('click', function(){
    ensureAudio();
    startMatchVs(season.pendingOpponent);
  });

  function afterMatchContinue(){
    overOverlay.classList.add('is-hidden');
    var round = season.rounds[season.roundIndex];
    var yourIdx = findYourPairIndex(round);
    var pair = round.pairs[yourIdx];
    var yourIsScheduleHome = pair[0] === season.yourId;
    var res = yourIsScheduleHome ? [scoreHome, scoreAway] : [scoreAway, scoreHome];
    round.results[yourIdx] = res;
    applyResult(pair[0], pair[1], res[0], res[1]);

    round.pairs.forEach(function(p, i){
      if (i === yourIdx) return;
      var sim = simRealisticScore(p[0], p[1], true);
      round.results[i] = sim;
      applyResult(p[0], p[1], sim[0], sim[1]);
    });
    round.played = true;
    season.roundIndex += 1;
    if (season.roundIndex >= season.rounds.length) endSeason();
    else showSeasonScreen();
  }
  overContinueBtn.addEventListener('click', afterMatchContinue);

  // ---------- Seleccion de equipo y dificultad ----------
  var pendingTeamId = null;
  function buildTeamGrid(){
    teamGridEl.innerHTML = '';
    TEAMS.forEach(function(team){
      var btn = document.createElement('button');
      btn.className = 'liga-team-pick-btn';
      btn.innerHTML = '<span class="liga-team-badge" style="background:'+team.shirt+';border-color:'+team.band+'"></span>'+
        '<span class="liga-team-pick-name">'+team.name+'</span>'+
        '<span class="liga-team-pick-country">'+team.nickname+'</span>';
      btn.addEventListener('click', function(){
        ensureAudio();
        pendingTeamId = team.id;
        teamSelectView.classList.add('is-hidden');
        difficultyView.classList.remove('is-hidden');
      });
      teamGridEl.appendChild(btn);
    });
  }
  buildTeamGrid();

  diffBackBtn.addEventListener('click', function(){
    difficultyView.classList.add('is-hidden');
    teamSelectView.classList.remove('is-hidden');
  });

  var diffButtons = difficultyView.querySelectorAll('.diff-btn');
  for (var di=0; di<diffButtons.length; di++){
    diffButtons[di].addEventListener('click', function(e){
      ensureAudio();
      startSeason(pendingTeamId, e.currentTarget.getAttribute('data-diff'));
    });
  }

  function showTeamSelect(){
    hideAllSubViews();
    teamSelectView.classList.remove('is-hidden');
    pauseLigaLoop();
  }
  endRetryBtn.addEventListener('click', showTeamSelect);

  // ---------- Estado del partido ----------
  var homePieces = [], awayPieces = [];
  var ballBody = {x:PITCH_CX, y:PITCH_CY, vx:0, vy:0, r:BALL_R, mass:BALL_MASS};
  var homeTeamData = null, awayTeamData = null;
  var scoreHome = 0, scoreAway = 0;
  var turnTeam = 'home';
  var turnPhase = 'idle'; // 'idle' | 'aiming' | 'simulating' | 'goal' | 'over'
  var matchTimeLeft = MATCH_DURATION;
  var settleTimer = 0;
  var goalTimer = 0;
  var lastGoalSide = null;
  var pendingKickoffTeam = 'home';
  var aiThinkTimer = 0;
  var selectedPiece = null;
  var dragCurrent = null;

  function makePiece(team, num, x, y){
    return {type:'piece', team:team, number:num, x:x, y:y, vx:0, vy:0, r:PIECE_R, mass:PIECE_MASS};
  }
  function allBodies(){ return homePieces.concat(awayPieces, [ballBody]); }
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

  function formationPositions(onLeft){
    var xs = onLeft
      ? [PITCH_L+64, PITCH_L+156, PITCH_L+156, PITCH_L+290, PITCH_L+290]
      : [PITCH_R-64, PITCH_R-156, PITCH_R-156, PITCH_R-290, PITCH_R-290];
    var ys = [PITCH_CY, PITCH_CY-95, PITCH_CY+95, PITCH_CY-145, PITCH_CY+145];
    var pts = [];
    for (var i=0;i<5;i++) pts.push({x:xs[i], y:ys[i]});
    return pts;
  }

  function setupPieces(){
    homePieces = formationPositions(true).map(function(p,i){ return makePiece('home', i+1, p.x, p.y); });
    awayPieces = formationPositions(false).map(function(p,i){ return makePiece('away', i+1, p.x, p.y); });
    ballBody.x = PITCH_CX; ballBody.y = PITCH_CY; ballBody.vx = 0; ballBody.vy = 0;
  }

  function formatMatchTime(t){
    var secs = Math.max(0, Math.ceil(t));
    var m = Math.floor(secs/60), s = secs%60;
    return m+':'+(s<10?'0':'')+s;
  }
  function updateMatchHud(){
    scoreHomeEl.textContent = scoreHome;
    scoreAwayEl.textContent = scoreAway;
    if (turnPhase === 'over'){
      turnValEl.textContent = 'Terminado';
    } else if (turnTeam === 'home'){
      turnValEl.textContent = 'Tu turno';
    } else {
      turnValEl.textContent = 'Rival';
    }
    if (timeValEl) timeValEl.textContent = formatMatchTime(matchTimeLeft);
  }

  function startMatchVs(opponentId){
    homeTeamData = TEAMS_BY_ID[season.yourId];
    awayTeamData = TEAMS_BY_ID[opponentId];
    scoreHome = 0; scoreAway = 0;
    matchTimeLeft = MATCH_DURATION;
    turnTeam = 'home';
    turnPhase = 'idle';
    settleTimer = 0; goalTimer = 0;
    selectedPiece = null; dragCurrent = null;
    setupPieces();
    updateMatchHud();
    homeChipBadge.style.background = homeTeamData.shirt;
    homeChipBadge.style.borderColor = homeTeamData.band;
    awayChipBadge.style.background = awayTeamData.shirt;
    awayChipBadge.style.borderColor = awayTeamData.band;
    startTitleEl.textContent = '¿Listo para jugar vs '+awayTeamData.name+'?';

    hideAllSubViews();
    matchView.classList.remove('is-hidden');
    startOverlay.classList.remove('is-hidden');
    overOverlay.classList.add('is-hidden');
    draw();
  }

  // ---------- Entrada (arrastrar y soltar) ----------
  function canvasPoint(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = CANVAS_W/rect.width, scaleY = CANVAS_H/rect.height;
    return {x:(e.clientX-rect.left)*scaleX, y:(e.clientY-rect.top)*scaleY};
  }
  canvas.addEventListener('pointerdown', function(e){
    if (turnPhase !== 'aiming' || turnTeam !== 'home') return;
    var pt = canvasPoint(e);
    var hit = null;
    for (var i=0;i<homePieces.length;i++){
      if (dist(pt, homePieces[i]) < PIECE_R+10){ hit = homePieces[i]; break; }
    }
    if (!hit) return;
    ensureAudio();
    selectedPiece = hit;
    dragCurrent = pt;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function(e){
    if (!selectedPiece) return;
    dragCurrent = canvasPoint(e);
  });
  function releaseDrag(e){
    if (!selectedPiece) return;
    var pt = dragCurrent || canvasPoint(e);
    var dx = pt.x-selectedPiece.x, dy = pt.y-selectedPiece.y;
    var dragDist = Math.hypot(dx,dy);
    if (dragDist > 8){
      var clamped = Math.min(dragDist, MAX_DRAG);
      var speed = clamped*POWER_SCALE;
      var ux = -dx/dragDist, uy = -dy/dragDist;
      launchPiece(selectedPiece, ux*speed, uy*speed);
    }
    selectedPiece = null;
    dragCurrent = null;
  }
  canvas.addEventListener('pointerup', releaseDrag);
  canvas.addEventListener('pointercancel', function(){ selectedPiece = null; dragCurrent = null; });

  function launchPiece(piece, vx, vy){
    piece.vx = vx; piece.vy = vy;
    turnPhase = 'simulating';
    settleTimer = 0;
    beep(300, 0.06, 'square');
    updateMatchHud();
  }

  // ---------- Fisica ----------
  // ---------- Particulas (choques y festejo de gol) ----------
  var particles = [];
  function spawnParticles(x, y, color, count, speed){
    for (var i=0;i<count;i++){
      var ang = Math.random()*Math.PI*2;
      var spd = speed*(0.4+Math.random()*0.6);
      particles.push({
        x:x, y:y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        life:0.45+Math.random()*0.3, maxLife:0.75, color:color, size:2+Math.random()*2.2
      });
    }
  }
  function updateParticles(dt){
    for (var i=particles.length-1;i>=0;i--){
      var pt = particles[i];
      pt.x += pt.vx*dt; pt.y += pt.vy*dt;
      pt.vx *= 0.9; pt.vy *= 0.9;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i,1);
    }
  }
  function drawParticles(){
    var c = ctx;
    particles.forEach(function(pt){
      c.save();
      c.globalAlpha = clamp(pt.life/pt.maxLife, 0, 1);
      c.fillStyle = pt.color;
      c.beginPath(); c.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); c.fill();
      c.restore();
    });
  }

  function resolveCollision(a, b){
    var dx = b.x-a.x, dy = b.y-a.y;
    var distAB = Math.sqrt(dx*dx+dy*dy);
    var minDist = a.r+b.r;
    if (distAB > 0.001 && distAB < minDist){
      var nx = dx/distAB, ny = dy/distAB;
      var overlap = minDist-distAB;
      var totalMass = a.mass+b.mass;
      a.x -= nx*overlap*(b.mass/totalMass);
      a.y -= ny*overlap*(b.mass/totalMass);
      b.x += nx*overlap*(a.mass/totalMass);
      b.y += ny*overlap*(a.mass/totalMass);
      var rvx = b.vx-a.vx, rvy = b.vy-a.vy;
      var velAlongNormal = rvx*nx+rvy*ny;
      if (velAlongNormal > 0) return;
      var j = -(1+BODY_REST)*velAlongNormal/(1/a.mass+1/b.mass);
      var ix = j*nx, iy = j*ny;
      a.vx -= ix/a.mass; a.vy -= iy/a.mass;
      b.vx += ix/b.mass; b.vy += iy/b.mass;
      if ((a.type==='ball' || b.type==='ball') && Math.abs(j) > 25){
        spawnParticles((a.x+b.x)/2, (a.y+b.y)/2, '#ffffff', 5, 65);
      }
    }
  }

  function checkGoal(){
    if (turnPhase !== 'simulating') return;
    var goalTop = PITCH_CY-GOAL_W/2, goalBot = PITCH_CY+GOAL_W/2;
    if (ballBody.y > goalTop+BALL_R && ballBody.y < goalBot-BALL_R){
      if (ballBody.x+BALL_R < PITCH_L) scoreGoal('away');
      else if (ballBody.x-BALL_R > PITCH_R) scoreGoal('home');
    }
  }

  function stepPhysics(dt){
    var bodies = allBodies();
    var decay = Math.pow(FRICTION_BASE, dt);
    var goalTop = PITCH_CY-GOAL_W/2, goalBot = PITCH_CY+GOAL_W/2;
    bodies.forEach(function(b){
      b.x += b.vx*dt; b.y += b.vy*dt;
      b.vx *= decay; b.vy *= decay;
      if (Math.hypot(b.vx,b.vy) < REST_SPEED){ b.vx = 0; b.vy = 0; }

      if (b.y-b.r < PITCH_T){ b.y = PITCH_T+b.r; b.vy = -b.vy*WALL_REST; }
      if (b.y+b.r > PITCH_B){ b.y = PITCH_B-b.r; b.vy = -b.vy*WALL_REST; }
      var inGoalMouth = b.y > goalTop && b.y < goalBot;
      if (b.x-b.r < PITCH_L){
        if (inGoalMouth){
          if (b.x < PITCH_L-GOAL_DEPTH+b.r){ b.x = PITCH_L-GOAL_DEPTH+b.r; b.vx = -b.vx*WALL_REST; }
        } else { b.x = PITCH_L+b.r; b.vx = -b.vx*WALL_REST; }
      }
      if (b.x+b.r > PITCH_R){
        if (inGoalMouth){
          if (b.x > PITCH_R+GOAL_DEPTH-b.r){ b.x = PITCH_R+GOAL_DEPTH-b.r; b.vx = -b.vx*WALL_REST; }
        } else { b.x = PITCH_R-b.r; b.vx = -b.vx*WALL_REST; }
      }
    });
    for (var i=0;i<bodies.length;i++){
      for (var j=i+1;j<bodies.length;j++){ resolveCollision(bodies[i], bodies[j]); }
    }
    checkGoal();
  }

  function allStopped(){
    var bodies = allBodies();
    for (var i=0;i<bodies.length;i++){
      if (Math.hypot(bodies[i].vx, bodies[i].vy) > 0.5) return false;
    }
    return true;
  }

  function scoreGoal(side){
    if (side === 'home') scoreHome += 1; else scoreAway += 1;
    lastGoalSide = side;
    pendingKickoffTeam = side === 'home' ? 'away' : 'home';
    turnPhase = 'goal';
    goalTimer = 1.5;
    updateMatchHud();
    var scoringTeam = side === 'home' ? homeTeamData : awayTeamData;
    spawnParticles(ballBody.x, ballBody.y, scoringTeam.shirt, 26, 150);
    spawnParticles(ballBody.x, ballBody.y, scoringTeam.band, 18, 110);
    beep(700, 0.12, 'triangle');
    setTimeout(function(){ beep(950, 0.12, 'triangle'); }, 100);
    setTimeout(function(){ beep(1200, 0.18, 'triangle'); }, 220);
  }

  function concludeTurn(forceNextTeam){
    if (turnPhase === 'over') return;
    turnTeam = forceNextTeam || (turnTeam === 'home' ? 'away' : 'home');
    turnPhase = 'aiming';
    updateMatchHud();
    if (turnTeam === 'away') aiThinkTimer = 0.55+Math.random()*0.45;
  }

  function endMatch(){
    turnPhase = 'over';
    var title;
    if (scoreHome > scoreAway) title = '¡Ganaste!';
    else if (scoreAway > scoreHome) title = 'Perdiste';
    else title = 'Empate';
    overTitleEl.textContent = title;
    overScoreEl.textContent = homeTeamData.name+' '+scoreHome+' - '+scoreAway+' '+awayTeamData.name;
    overOverlay.classList.remove('is-hidden');
    updateMatchHud();
    pauseLigaLoop();
  }

  // ---------- IA ----------
  function pointSegDist(px,py, x1,y1, x2,y2){
    var vx = x2-x1, vy = y2-y1;
    var wx = px-x1, wy = py-y1;
    var len2 = vx*vx+vy*vy;
    var t = len2 > 0 ? clamp((wx*vx+wy*vy)/len2, 0, 1) : 0;
    var cx = x1+vx*t, cy = y1+vy*t;
    return Math.hypot(px-cx, py-cy);
  }
  function pathClearance(x1,y1,x2,y2, obstacles){
    var minClear = Infinity;
    obstacles.forEach(function(o){
      var d = pointSegDist(o.x,o.y,x1,y1,x2,y2) - o.r;
      if (d < minClear) minClear = d;
    });
    return minClear;
  }
  // Ficha que mejor puede llegar a tocar la pelota ahora (cerca y con via libre),
  // no solo la mas cercana - si no hay linea limpia, otra ficha puede servir mas.
  function chooseActingPiece(){
    var best = null, bestScore = -Infinity;
    awayPieces.forEach(function(p){
      var obstacles = homePieces.concat(awayPieces.filter(function(o){ return o !== p; }));
      var clr = pathClearance(p.x, p.y, ballBody.x, ballBody.y, obstacles);
      var d = dist(p, ballBody);
      var score = clr*1.5 - d*0.08;
      if (score > bestScore){ bestScore = score; best = p; }
    });
    return best;
  }
  // Prueba varios puntos a lo largo de la boca del arco rival y devuelve el de
  // mejor despeje - asi la IA busca angulos en vez de tirar siempre al medio.
  function bestGoalAngle(fromPoint, obstacles, samples){
    var goalTop = PITCH_CY-GOAL_W/2+10, goalBot = PITCH_CY+GOAL_W/2-10;
    var best = null, bestClr = -Infinity;
    for (var i=0; i<samples; i++){
      var f = samples>1 ? i/(samples-1) : 0.5;
      var ty = goalTop+(goalBot-goalTop)*f;
      var clr = pathClearance(fromPoint.x, fromPoint.y, PITCH_L, ty, obstacles);
      if (clr > bestClr){ bestClr = clr; best = {x:PITCH_L, y:ty}; }
    }
    return {point: best, clearance: bestClr};
  }
  function fireWithNoise(diff, piece, aim, power){
    var ang = aim.ang + (Math.random()*2-1)*diff.aimNoise;
    var finalPower = clamp(power*(1+(Math.random()*2-1)*diff.powerNoise), 0.25, 1);
    var speed = finalPower*MAX_DRAG*POWER_SCALE;
    launchPiece(piece, Math.cos(ang)*speed, Math.sin(ang)*speed);
  }
  function aimDirectionForTarget(fromPiece, targetX, targetY){
    var bx = ballBody.x, by = ballBody.y;
    var tdx = bx-targetX, tdy = by-targetY;
    var tdist = Math.hypot(tdx,tdy) || 1;
    var ghostX = bx + (tdx/tdist)*(PIECE_R+BALL_R);
    var ghostY = by + (tdy/tdist)*(PIECE_R+BALL_R);
    var dx = ghostX-fromPiece.x, dy = ghostY-fromPiece.y;
    var d = Math.hypot(dx,dy) || 1;
    return {ang: Math.atan2(dy,dx)};
  }

  function performAIMove(){
    var diff = currentDifficulty;
    var goalX = PITCH_L, goalY = PITCH_CY;
    var ownGoalX = PITCH_R, ownGoalY = PITCH_CY;

    // Facil (o el margen de error de cualquier dificultad): jugada torpe e
    // imprecisa, sin calculo de angulos ni rebotes - a proposito.
    if (diff.smart <= 0 || Math.random() < diff.mistakeChance){
      var wild = awayPieces[Math.floor(Math.random()*awayPieces.length)];
      var wildAtGoal = Math.random() < 0.5;
      var wtx = (wildAtGoal ? goalX : ballBody.x) + (Math.random()*280-140);
      var wty = (wildAtGoal ? goalY : ballBody.y) + (Math.random()*280-140);
      fireWithNoise(diff, wild, aimDirectionForTarget(wild, wtx, wty), 0.35+Math.random()*0.65);
      return;
    }

    var angleSamples = diff.smart >= 3 ? 7 : diff.smart >= 2 ? 5 : 3;
    var defenseChance = diff.smart >= 3 ? 0.75 : diff.smart >= 2 ? 0.55 : 0.3;

    // Defensa: si la pelota esta en mi mitad y hay peligro cerca de mi arco,
    // la ficha mas cercana a la pelota despeja - siempre lejos de mi propio arco.
    var ballInMyHalf = ballBody.x > PITCH_CX + (PITCH_R-PITCH_L)*0.04;
    var dangerNearMyGoal = homePieces.some(function(h){ return dist(h, {x:ownGoalX,y:ownGoalY}) < (PITCH_R-PITCH_L)*0.32; });
    if (ballInMyHalf && (dangerNearMyGoal || Math.random() < defenseChance)){
      var defender = awayPieces.slice().sort(function(a,b){ return dist(a,ballBody)-dist(b,ballBody); })[0];
      var clearY = ballBody.y > ownGoalY ? PITCH_T+40 : PITCH_B-40;
      var clearX = PITCH_CX + (Math.random()*60-30);
      fireWithNoise(diff, defender, aimDirectionForTarget(defender, clearX, clearY), 0.75+Math.random()*0.2);
      return;
    }

    // Ataque: elijo la ficha que mejor puede tocar la pelota, evaluo tiro
    // directo, luego pase a un companero mejor ubicado, y si no avanzo la
    // pelota hacia el mejor angulo disponible - nunca me quedo quieta ni retrocedo.
    var chosen = chooseActingPiece();
    var obstacles = homePieces.concat(awayPieces.filter(function(o){ return o !== chosen; }));
    var shotOpt = bestGoalAngle(chosen, obstacles, angleSamples);
    var shotThreshold = PIECE_R*(diff.smart >= 3 ? 0.7 : diff.smart >= 2 ? 0.85 : 1.15);
    var canShoot = shotOpt.clearance > shotThreshold;

    var passOpt = null;
    awayPieces.forEach(function(p){
      if (p === chosen) return;
      var pObstacles = homePieces.concat(awayPieces.filter(function(o){ return o !== p; }));
      var pShot = bestGoalAngle(p, pObstacles, angleSamples);
      var passLane = pathClearance(chosen.x, chosen.y, p.x, p.y, obstacles);
      if (passLane > PIECE_R*0.8 && pShot.clearance > shotOpt.clearance+PIECE_R*0.5){
        if (!passOpt || pShot.clearance > passOpt.clearance){ passOpt = {piece:p, clearance:pShot.clearance}; }
      }
    });

    var targetPoint, power;
    if (canShoot){
      targetPoint = shotOpt.point;
      power = diff.smart >= 2 ? 0.9+Math.random()*0.1 : 0.8+Math.random()*0.15;
    } else if (passOpt && diff.smart >= 1){
      targetPoint = {x:passOpt.piece.x, y:passOpt.piece.y};
      power = 0.55+Math.random()*0.2;
    } else {
      // Sin tiro limpio ni pase claro: igual empujo la pelota hacia el mejor
      // angulo que encontre, para seguir generando peligro en vez de retroceder.
      targetPoint = shotOpt.point;
      power = 0.65+Math.random()*0.2;
    }

    fireWithNoise(diff, chosen, aimDirectionForTarget(chosen, targetPoint.x, targetPoint.y), power);
  }

  // ---------- Dibujo ----------
  function drawPitch(){
    var c = ctx;
    c.fillStyle = '#0d2410';
    c.fillRect(0,0,CANVAS_W,CANVAS_H);

    var grassGrad = c.createLinearGradient(0,PITCH_T,0,PITCH_B);
    grassGrad.addColorStop(0, '#52b352');
    grassGrad.addColorStop(1, '#2c8a3e');
    c.fillStyle = grassGrad;
    c.fillRect(PITCH_L,PITCH_T,PITCH_R-PITCH_L,PITCH_B-PITCH_T);

    c.fillStyle = 'rgba(255,255,255,0.09)';
    var stripeW = 42;
    var stripeI = 0;
    for (var sx=PITCH_L; sx<PITCH_R; sx+=stripeW, stripeI++){
      if (stripeI%2===0) c.fillRect(sx, PITCH_T, Math.min(stripeW,PITCH_R-sx), PITCH_B-PITCH_T);
    }

    c.strokeStyle = 'rgba(255,255,255,0.92)';
    c.lineWidth = 3.5;
    c.strokeRect(PITCH_L, PITCH_T, PITCH_R-PITCH_L, PITCH_B-PITCH_T);
    c.beginPath(); c.moveTo(PITCH_CX, PITCH_T); c.lineTo(PITCH_CX, PITCH_B); c.stroke();
    c.beginPath(); c.arc(PITCH_CX, PITCH_CY, CENTER_R, 0, Math.PI*2); c.stroke();
    c.beginPath(); c.arc(PITCH_CX, PITCH_CY, 3.5, 0, Math.PI*2); c.fillStyle='#fff'; c.fill();

    drawGoalArea(true);
    drawGoalArea(false);
  }

  function drawGoalArea(atLeft){
    var c = ctx;
    var edgeX = atLeft ? PITCH_L : PITCH_R;
    var dir = atLeft ? 1 : -1;
    c.strokeStyle = 'rgba(255,255,255,0.92)';
    c.lineWidth = 3.5;
    c.strokeRect(atLeft ? edgeX : edgeX-BOX_W, PITCH_CY-BOX_H/2, BOX_W, BOX_H);
    c.strokeRect(atLeft ? edgeX : edgeX-SIX_W, PITCH_CY-SIX_H/2, SIX_W, SIX_H);
    c.beginPath();
    c.arc(edgeX+dir*PEN_DIST, PITCH_CY, 3, 0, Math.PI*2);
    c.fillStyle = '#fff'; c.fill();

    var goalTop = PITCH_CY-GOAL_W/2, goalBot = PITCH_CY+GOAL_W/2;
    var taper = 9;
    var backX = edgeX-dir*GOAL_DEPTH;
    var backTop = goalTop+taper, backBot = goalBot-taper;

    var netGrad = c.createLinearGradient(edgeX,0,backX,0);
    netGrad.addColorStop(0, 'rgba(20,30,20,0.12)');
    netGrad.addColorStop(1, 'rgba(8,14,8,0.55)');
    c.fillStyle = netGrad;
    c.beginPath();
    c.moveTo(edgeX, goalTop); c.lineTo(backX, backTop); c.lineTo(backX, backBot); c.lineTo(edgeX, goalBot);
    c.closePath(); c.fill();

    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1;
    c.beginPath();
    var vSteps = 6;
    for (var vi=0; vi<=vSteps; vi++){
      var vf = vi/vSteps;
      var tY = goalTop+(backTop-goalTop)*vf, bY = goalBot+(backBot-goalBot)*vf;
      var vx = edgeX-dir*GOAL_DEPTH*vf;
      c.moveTo(vx, tY); c.lineTo(vx, bY);
    }
    var hSteps = 5;
    for (var hi=0; hi<=hSteps; hi++){
      var hf = hi/hSteps;
      c.moveTo(edgeX, goalTop+(goalBot-goalTop)*hf);
      c.lineTo(backX, backTop+(backBot-backTop)*hf);
    }
    c.stroke();
    c.restore();

    c.save();
    c.shadowColor = 'rgba(0,0,0,0.4)';
    c.shadowBlur = 5;
    c.strokeStyle = '#f7f7f5';
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(edgeX, goalTop);
    c.lineTo(backX, backTop);
    c.lineTo(backX, backBot);
    c.lineTo(edgeX, goalBot);
    c.stroke();
    c.restore();
  }

  function updatePieceAnims(){
    homePieces.concat(awayPieces).forEach(function(p){
      var target = (p === selectedPiece) ? 1.16 : 1.0;
      var cur = p.animScale === undefined ? 1 : p.animScale;
      p.animScale = cur + (target-cur)*0.25;
    });
  }

  var LIGHT_SHIRTS = {'#ffffff':1,'#f0f0f0':1,'#fdb913':1};
  function drawPiece(p){
    var c = ctx;
    var team = p.team === 'home' ? homeTeamData : awayTeamData;
    if (!team) return;
    var r = p.r*(p.animScale||1);
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath(); c.ellipse(p.x, p.y+4, r*0.9, r*0.55, 0, 0, Math.PI*2); c.fill();

    c.beginPath(); c.arc(p.x, p.y, r+2.5, 0, Math.PI*2);
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fill();

    c.beginPath();
    c.arc(p.x, p.y, r, 0, Math.PI*2);
    c.fillStyle = team.shirt;
    c.fill();
    c.lineWidth = 3.5;
    c.strokeStyle = team.band;
    c.stroke();

    c.save();
    c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI*2); c.clip();
    var gloss = c.createRadialGradient(p.x-r*0.35, p.y-r*0.45, r*0.1, p.x-r*0.1, p.y-r*0.1, r*1.15);
    gloss.addColorStop(0, 'rgba(255,255,255,0.55)');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gloss;
    c.fillRect(p.x-r, p.y-r, r*2, r*2);
    c.restore();

    c.fillStyle = LIGHT_SHIRTS[team.shirt] ? '#1a1a1a' : '#ffffff';
    c.font = '800 '+Math.round(r*0.82)+'px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(p.number), p.x, p.y+1);

    if (selectedPiece === p){
      c.strokeStyle = 'rgba(255,210,63,0.9)';
      c.lineWidth = 2;
      c.beginPath(); c.arc(p.x, p.y, r+5, 0, Math.PI*2); c.stroke();
    } else if (turnPhase === 'aiming' && turnTeam === 'home' && p.team === 'home'){
      c.strokeStyle = 'rgba(255,255,255,0.4)';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(p.x, p.y, r+3, 0, Math.PI*2); c.stroke();
    }
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
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.ellipse(ballBody.x, ballBody.y+2, BALL_R*0.85, BALL_R*0.5, 0, 0, Math.PI*2); c.fill();
    c.translate(ballBody.x, ballBody.y);

    var grad = c.createRadialGradient(-BALL_R*0.35,-BALL_R*0.4,BALL_R*0.15, 0,0,BALL_R*1.15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#f0f0ee');
    grad.addColorStop(1, '#c7c7c4');
    c.beginPath(); c.arc(0,0,BALL_R,0,Math.PI*2);
    c.fillStyle = grad; c.fill();
    c.strokeStyle = 'rgba(20,20,20,0.4)';
    c.lineWidth = 0.8;
    c.stroke();

    c.save();
    c.beginPath(); c.arc(0,0,BALL_R,0,Math.PI*2); c.clip();
    c.fillStyle = '#1c1c1c';
    drawBallPentagon(c, 0, -BALL_R*0.15, BALL_R*0.42);
    var ringR = BALL_R*0.95;
    for (var pi=0; pi<5; pi++){
      var pang = -Math.PI/2 + pi*(2*Math.PI/5) + Math.PI/5;
      drawBallPentagon(c, Math.cos(pang)*ringR, Math.sin(pang)*ringR-BALL_R*0.15, BALL_R*0.4);
    }
    c.restore();
    c.restore();
  }

  function drawAimLine(){
    if (!selectedPiece || !dragCurrent) return;
    var c = ctx;
    var dx = dragCurrent.x-selectedPiece.x, dy = dragCurrent.y-selectedPiece.y;
    var dragDist = Math.min(Math.hypot(dx,dy), MAX_DRAG);
    var ang = Math.atan2(dy,dx);
    var launchDist = dragDist*1.6;
    var launchX = selectedPiece.x - Math.cos(ang)*launchDist;
    var launchY = selectedPiece.y - Math.sin(ang)*launchDist;
    var power = dragDist/MAX_DRAG;

    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.setLineDash([4,6]);
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(selectedPiece.x, selectedPiece.y, MAX_DRAG, 0, Math.PI*2); c.stroke();

    c.setLineDash([5,5]);
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(selectedPiece.x, selectedPiece.y);
    c.lineTo(selectedPiece.x+Math.cos(ang)*dragDist, selectedPiece.y+Math.sin(ang)*dragDist);
    c.stroke();

    c.setLineDash([]);
    var powerColor = power < 0.4 ? '#7ed957' : power < 0.75 ? '#ffd23f' : '#ff5c3f';
    c.strokeStyle = powerColor;
    c.lineWidth = 3+power*3;
    c.beginPath();
    c.moveTo(selectedPiece.x, selectedPiece.y);
    c.lineTo(launchX, launchY);
    c.stroke();

    var headAng = ang+Math.PI;
    var headLen = 11+power*7;
    var tipX = launchX+Math.cos(headAng)*headLen, tipY = launchY+Math.sin(headAng)*headLen;
    var leftX = launchX+Math.cos(headAng+2.6)*headLen*0.6, leftY = launchY+Math.sin(headAng+2.6)*headLen*0.6;
    var rightX = launchX+Math.cos(headAng-2.6)*headLen*0.6, rightY = launchY+Math.sin(headAng-2.6)*headLen*0.6;
    c.fillStyle = powerColor;
    c.beginPath();
    c.moveTo(tipX,tipY); c.lineTo(leftX,leftY); c.lineTo(rightX,rightY);
    c.closePath(); c.fill();
    c.restore();
  }

  function drawGoalText(){
    if (turnPhase !== 'goal') return;
    var c = ctx;
    var prog = clamp(1-(goalTimer/1.5), 0, 1);
    var scale = prog < 0.25 ? (prog/0.25) : 1;
    var alpha = prog > 0.8 ? (1-prog)/0.2 : 1;
    var team = lastGoalSide === 'home' ? homeTeamData : awayTeamData;
    c.save();
    c.globalAlpha = clamp(alpha,0,1);
    c.translate(PITCH_CX, PITCH_CY);
    c.scale(scale, scale);
    c.font = '900 46px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillText('¡GOL DE '+team.name.toUpperCase()+'!', 3, 3);
    c.fillStyle = lastGoalSide === 'home' ? '#ff5c7a' : '#5cc9ff';
    c.fillText('¡GOL DE '+team.name.toUpperCase()+'!', 0, 0);
    c.restore();
  }

  function draw(){
    updatePieceAnims();
    drawPitch();
    homePieces.forEach(drawPiece);
    awayPieces.forEach(drawPiece);
    drawBall();
    drawParticles();
    drawAimLine();
    drawGoalText();
  }

  // ---------- Loop ----------
  var ligaLoopRunning = false;
  var lastTs = null;
  function startLigaLoop(){
    if (ligaLoopRunning) return;
    ligaLoopRunning = true;
    lastTs = null;
    requestAnimationFrame(ligaLoop);
  }
  function pauseLigaLoop(){
    ligaLoopRunning = false;
  }
  function ligaLoop(ts){
    if (!ligaLoopRunning) return;
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(0.033, (ts-lastTs)/1000);
    lastTs = ts;
    updateParticles(dt);

    if (turnPhase !== 'over' && turnPhase !== 'idle'){
      matchTimeLeft = Math.max(0, matchTimeLeft-dt);
      if (timeValEl) timeValEl.textContent = formatMatchTime(matchTimeLeft);
      if (matchTimeLeft <= 0) endMatch();
    }

    if (turnPhase === 'simulating'){
      stepPhysics(dt);
      if (turnPhase === 'simulating'){
        if (allStopped()){
          settleTimer += dt;
          if (settleTimer > 0.3){ settleTimer = 0; concludeTurn(); }
        } else {
          settleTimer = 0;
        }
      }
    } else if (turnPhase === 'goal'){
      goalTimer -= dt;
      if (goalTimer <= 0){
        setupPieces();
        concludeTurn(pendingKickoffTeam);
      }
    } else if (turnPhase === 'aiming' && turnTeam === 'away'){
      aiThinkTimer -= dt;
      if (aiThinkTimer <= 0) performAIMove();
    }

    draw();
    requestAnimationFrame(ligaLoop);
  }

  // ---------- Navegacion ----------
  playLigaBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    ligaView.classList.remove('is-hidden');
    showTeamSelect();
  });
  backFromLigaBtn.addEventListener('click', function(){
    ligaView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseLigaLoop();
  });
  startBtn.addEventListener('click', function(){
    ensureAudio();
    startOverlay.classList.add('is-hidden');
    turnPhase = 'aiming';
    updateMatchHud();
    startLigaLoop();
  });
})();
