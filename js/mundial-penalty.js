// Mundial Penalty Shooter: elegis una seleccion entre 32 paises y jugas un
// Mundial completo (sorteo, fase de grupos, eliminatorias) donde CADA
// partido se resuelve como una tanda de penales: 5 por equipo, muerte
// subita si hay empate. Direccion, altura y potencia influyen de verdad en
// el resultado de cada disparo; la IA usa las estadisticas del equipo (mas
// fuerte = mas preciso) y la dificultad elegida, nunca es 100% aleatoria
// ni 100% perfecta.
(function(){
  // ---------- Datos de selecciones ----------
  var TEAMS = [
    {id:'argentina', name:'Argentina', confed:'CONMEBOL', strength:95, shirt:'#6cbfe8', band:'#ffffff', pattern:'stripes'},
    {id:'francia', name:'Francia', confed:'UEFA', strength:93, shirt:'#0055a4', band:'#ef4135', pattern:'band'},
    {id:'brasil', name:'Brasil', confed:'CONMEBOL', strength:92, shirt:'#ffcc29', band:'#009739', pattern:'band'},
    {id:'espana', name:'España', confed:'UEFA', strength:90, shirt:'#c60b1e', band:'#ffc400', pattern:'band'},
    {id:'inglaterra', name:'Inglaterra', confed:'UEFA', strength:87, shirt:'#ffffff', band:'#c8102e', pattern:'solid'},
    {id:'portugal', name:'Portugal', confed:'UEFA', strength:86, shirt:'#d4213d', band:'#046a38', pattern:'sash'},
    {id:'alemania', name:'Alemania', confed:'UEFA', strength:85, shirt:'#1a1a1a', band:'#ffce00', pattern:'band'},
    {id:'belgica', name:'Bélgica', confed:'UEFA', strength:83, shirt:'#ed2939', band:'#111111', pattern:'band'},
    {id:'paises_bajos', name:'Países Bajos', confed:'UEFA', strength:82, shirt:'#ff6a13', band:'#21468b', pattern:'solid'},
    {id:'italia', name:'Italia', confed:'UEFA', strength:81, shirt:'#0066cc', band:'#ffffff', pattern:'solid'},
    {id:'croacia', name:'Croacia', confed:'UEFA', strength:79, shirt:'#ff0000', band:'#ffffff', pattern:'stripes'},
    {id:'uruguay', name:'Uruguay', confed:'CONMEBOL', strength:78, shirt:'#63a4dc', band:'#ffffff', pattern:'solid'},
    {id:'marruecos', name:'Marruecos', confed:'CAF', strength:76, shirt:'#c1272d', band:'#006233', pattern:'band'},
    {id:'colombia', name:'Colombia', confed:'CONMEBOL', strength:75, shirt:'#fcd116', band:'#1c3f94', pattern:'band'},
    {id:'mexico', name:'México', confed:'CONCACAF', strength:74, shirt:'#036339', band:'#ce1126', pattern:'band'},
    {id:'estados_unidos', name:'Estados Unidos', confed:'CONCACAF', strength:73, shirt:'#0a3161', band:'#b31942', pattern:'stripes'},
    {id:'senegal', name:'Senegal', confed:'CAF', strength:72, shirt:'#00853f', band:'#fdef42', pattern:'band'},
    {id:'suiza', name:'Suiza', confed:'UEFA', strength:71, shirt:'#d52b1e', band:'#ffffff', pattern:'solid'},
    {id:'japon', name:'Japón', confed:'AFC', strength:70, shirt:'#002b5c', band:'#ffffff', pattern:'solid'},
    {id:'corea_del_sur', name:'Corea del Sur', confed:'AFC', strength:69, shirt:'#cd2e3a', band:'#003478', pattern:'solid'},
    {id:'dinamarca', name:'Dinamarca', confed:'UEFA', strength:68, shirt:'#c8102e', band:'#ffffff', pattern:'solid'},
    {id:'serbia', name:'Serbia', confed:'UEFA', strength:67, shirt:'#c6363c', band:'#0c4076', pattern:'band'},
    {id:'ecuador', name:'Ecuador', confed:'CONMEBOL', strength:66, shirt:'#ffd100', band:'#034ea2', pattern:'band'},
    {id:'nigeria', name:'Nigeria', confed:'CAF', strength:65, shirt:'#008751', band:'#ffffff', pattern:'stripes'},
    {id:'peru', name:'Perú', confed:'CONMEBOL', strength:64, shirt:'#d91023', band:'#ffffff', pattern:'sash'},
    {id:'chile', name:'Chile', confed:'CONMEBOL', strength:63, shirt:'#d52b1e', band:'#0039a6', pattern:'band'},
    {id:'polonia', name:'Polonia', confed:'UEFA', strength:62, shirt:'#ffffff', band:'#dc143c', pattern:'halves'},
    {id:'ghana', name:'Ghana', confed:'CAF', strength:60, shirt:'#fcd116', band:'#006b3f', pattern:'band'},
    {id:'tunez', name:'Túnez', confed:'CAF', strength:59, shirt:'#e70013', band:'#ffffff', pattern:'solid'},
    {id:'australia', name:'Australia', confed:'AFC', strength:58, shirt:'#ffcd00', band:'#00843d', pattern:'band'},
    {id:'costa_rica', name:'Costa Rica', confed:'CONCACAF', strength:56, shirt:'#002b7f', band:'#ce1126', pattern:'band'},
    {id:'canada', name:'Canadá', confed:'CONCACAF', strength:55, shirt:'#ff0000', band:'#ffffff', pattern:'sash'}
  ];
  var TEAMS_BY_ID = {};
  TEAMS.forEach(function(t){ TEAMS_BY_ID[t.id] = t; });
  function teamAccuracy(team){ return clamp(0.45 + (team.strength-60)/130, 0.34, 0.90); }
  function teamGk(team){ return clamp(0.32 + (team.strength-60)/150, 0.18, 0.62); }

  // gkGuess: probabilidad de que el arquero IA lea bien tu remate (leyenda:
  // reflejos rapidos = adivina mas seguido). gkSkillBonus: se suma directo a
  // la chance de atajar una vez que ya adivino cerca (reflejos al estirarse).
  // shooterBonus: precision extra del rematador IA (nunca 100%). cornerBias:
  // que tan seguido busca los angulos dificiles en vez del medio.
  // hardShotChance: que tan seguido pega fuerte en vez de variar la potencia.
  var DIFFICULTIES = {
    facil:      {label:'Fácil',      gkGuess:0.14, gkSkillBonus:0.00, shooterBonus:-0.04, diveDur:0.62, cornerBias:0.10, hardShotChance:0.15},
    normal:     {label:'Normal',     gkGuess:0.26, gkSkillBonus:0.04, shooterBonus:0.00,  diveDur:0.5,  cornerBias:0.22, hardShotChance:0.25},
    dificil:    {label:'Difícil',    gkGuess:0.40, gkSkillBonus:0.08, shooterBonus:0.05,  diveDur:0.42, cornerBias:0.32, hardShotChance:0.35},
    legendario: {label:'Legendario', gkGuess:0.54, gkSkillBonus:0.13, shooterBonus:0.10,  diveDur:0.34, cornerBias:0.42, hardShotChance:0.45}
  };
  var currentDifficulty = DIFFICULTIES.normal;
  var currentDiffKey = 'normal';

  // Zonas de disparo/atajada: 7 columnas x 3 alturas = 21 zonas.
  var DIR_ZONES = ['farLeft','left','centerLeft','center','centerRight','right','farRight'];
  var HEIGHT_ZONES = ['low','mid','high'];
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function clampIdx(n, max){ return Math.max(0, Math.min(max, n)); }
  function driftIndex(idx, max, steps){
    var d = (Math.random()<0.5?-1:1)*steps;
    return clampIdx(idx+d, max);
  }

  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
  function shuffle(arr){
    for (var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function repeatStr(ch,n){ var s=''; for (var i=0;i<n;i++) s+=ch; return s; }

  // ---------- DOM ----------
  var portalView = document.getElementById('portalView');
  var mundialView = document.getElementById('mundialView');
  var playMundialBtn = document.getElementById('playMundialBtn');
  var backFromMundialBtn = document.getElementById('backFromMundialBtn');
  var muteBtn = document.getElementById('wcMuteBtn');

  var menuView = document.getElementById('wcMenuView');
  var teamSelectView = document.getElementById('wcTeamSelectView');
  var teamGridEl = document.getElementById('wcTeamGrid');
  var teamDetailEl = document.getElementById('wcTeamDetail');
  var detailCrestEl = document.getElementById('wcDetailCrest');
  var detailNameEl = document.getElementById('wcDetailName');
  var detailConfedEl = document.getElementById('wcDetailConfed');
  var detailColorsEl = document.getElementById('wcDetailColors');
  var detailDescEl = document.getElementById('wcDetailDesc');
  var detailContinueBtn = document.getElementById('wcDetailContinueBtn');

  var difficultyView = document.getElementById('wcDifficultyView');
  var diffBackBtn = document.getElementById('wcDiffBackBtn');

  var drawView = document.getElementById('wcDrawView');
  var drawStatusEl = document.getElementById('wcDrawStatus');
  var drawGridEl = document.getElementById('wcDrawGrid');
  var drawSkipBtn = document.getElementById('wcDrawSkipBtn');
  var drawContinueBtn = document.getElementById('wcDrawContinueBtn');

  var hubView = document.getElementById('wcHubView');
  var hubTitleEl = document.getElementById('wcHubTitle');
  var groupTableBody = document.getElementById('wcGroupTableBody');
  var hubFechaLabelEl = document.getElementById('wcHubFechaLabel');
  var hubTextEl = document.getElementById('wcHubText');
  var playMatchBtn = document.getElementById('wcPlayMatchBtn');
  var bracketTreeEl = document.getElementById('wcBracketTree');
  var fixtureCurrentEl = document.getElementById('wcFixtureCurrent');
  var fixtureListEl = document.getElementById('wcFixtureList');

  var endView = document.getElementById('wcEndView');
  var endTitleEl = document.getElementById('wcEndTitle');
  var endTextEl = document.getElementById('wcEndText');
  var endRetryBtn = document.getElementById('wcEndRetryBtn');

  var trainingSelectView = document.getElementById('wcTrainingSelectView');
  var trainingBackBtn = document.getElementById('wcTrainingBackBtn');
  var trainKickBtn = document.getElementById('wcTrainKickBtn');
  var trainSaveBtn = document.getElementById('wcTrainSaveBtn');

  var configView = document.getElementById('wcConfigView');
  var configBackBtn = document.getElementById('wcConfigBackBtn');
  var configDifficultyEl = document.getElementById('wcConfigDifficulty');
  var configMuteBtn = document.getElementById('wcConfigMuteBtn');
  var configResetBtn = document.getElementById('wcConfigResetBtn');

  var statsView = document.getElementById('wcStatsView');
  var statsBackBtn = document.getElementById('wcStatsBackBtn');
  var statsGridEl = document.getElementById('wcStatsGrid');

  var matchView = document.getElementById('wcMatchView');
  var homeBadgeEl = document.getElementById('wcHomeBadge');
  var awayBadgeEl = document.getElementById('wcAwayBadge');
  var scoreHomeEl = document.getElementById('wcScoreHome');
  var scoreAwayEl = document.getElementById('wcScoreAway');
  var roundValEl = document.getElementById('wcRoundVal');
  var shootoutTrackEl = document.getElementById('wcShootoutTrack');
  var turnBannerEl = document.getElementById('wcTurnBanner');
  var startOverlay = document.getElementById('wcStartOverlay');
  var startTitleEl = document.getElementById('wcStartTitle');
  var startDescEl = document.getElementById('wcStartDesc');
  var startBtn = document.getElementById('wcStartBtn');
  var overOverlay = document.getElementById('wcOverOverlay');
  var overTitleEl = document.getElementById('wcOverTitle');
  var overScoreEl = document.getElementById('wcOverScore');
  var overContinueBtn = document.getElementById('wcOverContinueBtn');
  var controlsEl = document.getElementById('wcControls');
  var stepDirEl = document.getElementById('wcStepDir');
  var stepDirLabelEl = document.getElementById('wcStepDirLabel');
  var stepHeightEl = document.getElementById('wcStepHeight');
  var stepHeightLabelEl = document.getElementById('wcStepHeightLabel');
  var stepPowerEl = document.getElementById('wcStepPower');
  var powerBarEl = document.getElementById('wcPowerBar');
  var powerNeedleEl = document.getElementById('wcPowerNeedle');
  var trainingHintEl = document.getElementById('wcTrainingHint');
  var trainingExitBtn = document.getElementById('wcTrainingExitBtn');

  var canvas = document.getElementById('wcCanvas');
  var ctx = canvas.getContext('2d');
  var CANVAS_W = 900, CANVAS_H = 480;
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
  function beep(freq, dur, type, vol){
    if (muted || !audioCtx) return;
    var t0 = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol||0.15, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  function crowdRoar(good){
    if (muted || !audioCtx) return;
    var notes = good ? [220,330,440,550] : [180,150];
    notes.forEach(function(f,i){ setTimeout(function(){ beep(f, 0.35, 'sawtooth', 0.05); }, i*40); });
  }
  function setMuted(v){
    muted = v;
    var icon = muted ? '🔇' : '🔊';
    muteBtn.textContent = icon;
    muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
    configMuteBtn.textContent = muted ? '🔇 Silenciado' : '🔊 Activado';
    saveConfig();
  }
  muteBtn.addEventListener('click', function(){ setMuted(!muted); });
  configMuteBtn.addEventListener('click', function(){ setMuted(!muted); });

  // ---------- Config / stats (localStorage) ----------
  var CONFIG_KEY = 'mundialPenaltyConfig_v1';
  var STATS_KEY = 'mundialPenaltyStats_v1';
  function loadConfig(){
    try {
      var raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return;
      var cfg = JSON.parse(raw);
      if (cfg.difficulty && DIFFICULTIES[cfg.difficulty]){ currentDiffKey = cfg.difficulty; currentDifficulty = DIFFICULTIES[cfg.difficulty]; }
      if (typeof cfg.muted === 'boolean') muted = cfg.muted;
    } catch(e){}
  }
  function saveConfig(){
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify({difficulty:currentDiffKey, muted:muted})); } catch(e){}
  }
  function defaultStats(){
    return {played:0, won:0, kicksTaken:0, kicksScored:0, savesAttempted:0, savesGood:0, bestResult:''};
  }
  var stats = defaultStats();
  function loadStats(){
    try {
      var raw = localStorage.getItem(STATS_KEY);
      if (raw) stats = JSON.parse(raw);
    } catch(e){ stats = defaultStats(); }
  }
  function saveStats(){
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e){}
  }
  var BEST_RESULT_RANK = {'':0, 'Fase de grupos':1, 'Octavos de Final':2, 'Cuartos de Final':3, 'Semifinal':4, 'Subcampeón':5, 'Campeón':6};
  function maybeUpdateBestResult(label){
    if ((BEST_RESULT_RANK[label]||0) > (BEST_RESULT_RANK[stats.bestResult]||0)) stats.bestResult = label;
  }
  function renderStats(){
    statsGridEl.innerHTML = '';
    var accuracy = stats.kicksTaken ? Math.round(100*stats.kicksScored/stats.kicksTaken) : 0;
    var saveRate = stats.savesAttempted ? Math.round(100*stats.savesGood/stats.savesAttempted) : 0;
    var tiles = [
      [stats.played, 'Mundiales jugados'],
      [stats.won, 'Mundiales ganados'],
      [accuracy+'%', 'Puntería al patear'],
      [saveRate+'%', 'Atajadas efectivas'],
      [stats.bestResult || 'Sin datos', 'Mejor resultado']
    ];
    tiles.forEach(function(t){
      var d = document.createElement('div');
      d.className = 'wc-stat-tile';
      d.innerHTML = '<span class="wc-stat-value">'+t[0]+'</span><span class="wc-stat-label">'+t[1]+'</span>';
      statsGridEl.appendChild(d);
    });
  }

  // ---------- Crest (escudo propio, sin licencia oficial) ----------
  function teamInitials(name){
    var words = name.replace(/[()]/g,'').trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0,3).toUpperCase();
    return (words[0][0]+words[1][0]).toUpperCase();
  }
  function isLightColor(hex){
    var num = parseInt(hex.replace('#',''),16);
    var r=(num>>16)&255, g=(num>>8)&255, b=num&255;
    return (0.299*r+0.587*g+0.114*b) > 170;
  }
  function starsFor(team){
    var n = Math.max(1, Math.min(5, Math.round(team.strength/20)));
    return '<span class="stars-on">'+repeatStr('★',n)+'</span><span class="stars-off">'+repeatStr('☆',5-n)+'</span>';
  }
  function crestSVG(team){
    var clipId = 'wcShieldClip-'+team.id;
    var shirt = team.shirt, band = team.band;
    var fill;
    if (team.pattern === 'stripes'){
      var n=5, w=100/n, s='';
      for (var i=0;i<n;i++){ s += '<rect x="'+(i*w)+'" y="0" width="'+(w+0.6)+'" height="116" fill="'+(i%2===0?shirt:band)+'"/>'; }
      fill = s;
    } else if (team.pattern === 'sash'){
      fill = '<rect width="100" height="116" fill="'+shirt+'"/><rect x="-25" y="44" width="150" height="26" fill="'+band+'" transform="rotate(-30 50 57)"/>';
    } else if (team.pattern === 'band'){
      fill = '<rect width="100" height="116" fill="'+shirt+'"/><rect x="0" y="40" width="100" height="32" fill="'+band+'"/>';
    } else if (team.pattern === 'halves'){
      fill = '<rect width="50" height="116" fill="'+shirt+'"/><rect x="50" width="50" height="116" fill="'+band+'"/>';
    } else {
      fill = '<rect width="100" height="116" fill="'+shirt+'"/>';
    }
    var textColor = isLightColor(shirt) ? '#1a1a1a' : '#ffffff';
    var shieldPath = 'M50 3 L93 15 L93 55 C93 84 74 105 50 113 C26 105 7 84 7 55 L7 15 Z';
    return '<svg viewBox="0 0 100 116" class="team-crest-svg" aria-hidden="true">'+
      '<defs><clipPath id="'+clipId+'"><path d="'+shieldPath+'"/></clipPath></defs>'+
      '<g clip-path="url(#'+clipId+')">'+fill+'<rect width="100" height="40" fill="rgba(255,255,255,0.12)"/></g>'+
      '<path d="'+shieldPath+'" fill="none" stroke="'+band+'" stroke-width="4"/>'+
      '<path d="'+shieldPath+'" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.3"/>'+
      '<text x="50" y="68" text-anchor="middle" font-size="32" font-weight="900" fill="'+textColor+'" font-family="Arial Black, Arial, sans-serif">'+teamInitials(team.name)+'</text>'+
      '</svg>';
  }

  // ---------- Seleccion de equipo ----------
  var pendingTeamId = null;
  function buildTeamGrid(){
    teamGridEl.innerHTML = '';
    TEAMS.forEach(function(team){
      var btn = document.createElement('button');
      btn.className = 'team-pick-btn';
      btn.innerHTML = '<span class="team-pick-check">✓</span>'+
        '<span class="team-crest">'+crestSVG(team)+'</span>'+
        '<span class="team-pick-name">'+team.name+'</span>'+
        '<span class="team-pick-country">'+team.confed+'</span>'+
        '<span class="team-pick-stars">'+starsFor(team)+'</span>';
      btn.addEventListener('click', function(){
        ensureAudio();
        selectTeam(team.id, btn);
      });
      teamGridEl.appendChild(btn);
    });
  }
  function selectTeam(id, btnEl){
    pendingTeamId = id;
    beep(880, 0.05, 'sine');
    var cards = teamGridEl.querySelectorAll('.team-pick-btn');
    for (var i=0;i<cards.length;i++){ cards[i].classList.remove('is-selected'); }
    if (btnEl) btnEl.classList.add('is-selected');
    showTeamDetail(TEAMS_BY_ID[id]);
  }
  function showTeamDetail(team){
    detailCrestEl.innerHTML = crestSVG(team);
    detailNameEl.textContent = team.name;
    detailConfedEl.textContent = team.confed;
    detailColorsEl.innerHTML =
      '<span class="color-dot" style="background:'+team.shirt+'"></span>'+
      '<span class="color-dot" style="background:'+team.band+'"></span>';
    var stars = Math.max(1, Math.min(5, Math.round(team.strength/20)));
    detailDescEl.textContent = 'Representa a la confederación '+team.confed+' en el Mundial. Nivel del plantel: '+stars+'/5.';
    teamDetailEl.classList.remove('is-hidden');
  }
  buildTeamGrid();

  detailContinueBtn.addEventListener('click', function(){
    if (!pendingTeamId) return;
    ensureAudio();
    teamSelectView.classList.add('is-hidden');
    configDifficultyEl.value = currentDiffKey;
    difficultyView.classList.remove('is-hidden');
  });
  diffBackBtn.addEventListener('click', function(){
    difficultyView.classList.add('is-hidden');
    teamSelectView.classList.remove('is-hidden');
  });
  var diffButtons = difficultyView.querySelectorAll('.diff-btn');
  for (var dbi=0; dbi<diffButtons.length; dbi++){
    diffButtons[dbi].addEventListener('click', function(e){
      ensureAudio();
      var key = e.currentTarget.getAttribute('data-diff');
      currentDiffKey = key;
      currentDifficulty = DIFFICULTIES[key] || DIFFICULTIES.normal;
      saveConfig();
      startCampaign(pendingTeamId);
    });
  }

  // ---------- Campaña (Mundial) ----------
  var GROUP_LETTERS = ['A','B','C','D','E','F','G','H'];
  var campaign = {
    yourId:null, group:[], standings:{}, rounds:[], roundIndex:0,
    stage:null, yourGroupIndex:0, groupQualifiers:[], bracket:null,
    allGroups:null, drawOrder:null, groupLetter:'A'
  };

  function makeStandingsMap(teamIds){
    var map = {};
    teamIds.forEach(function(id){ map[id] = {teamId:id, pts:0, gf:0, ga:0, played:0}; });
    return map;
  }
  function applyShootoutResult(map, aId, bId, scoreA, scoreB){
    var sa = map[aId], sb = map[bId];
    sa.gf += scoreA; sa.ga += scoreB; sa.played += 1;
    sb.gf += scoreB; sb.ga += scoreA; sb.played += 1;
    if (scoreA > scoreB) sa.pts += 3; else sb.pts += 3;
  }
  function sortStandingsMap(map, teamIds){
    return teamIds.map(function(id){ return map[id]; }).slice().sort(function(a,b){
      if (b.pts !== a.pts) return b.pts-a.pts;
      var gdA = a.gf-a.ga, gdB = b.gf-b.ga;
      if (gdB !== gdA) return gdB-gdA;
      if (b.gf !== a.gf) return b.gf-a.gf;
      return Math.random()-0.5;
    });
  }
  // Simula una tanda de penales completa (estadistica, no interactiva) para
  // los partidos que el jugador no juega: 5 penales por equipo y, si
  // empatan, muerte subita alternada hasta que se rompa la igualdad.
  function simShootout(aId, bId){
    var ta = TEAMS_BY_ID[aId], tb = TEAMS_BY_ID[bId];
    var accA = teamAccuracy(ta), accB = teamAccuracy(tb);
    var a=0, b=0;
    for (var i=0;i<5;i++){
      if (Math.random() < accA) a++;
      if (Math.random() < accB) b++;
    }
    var guard = 0;
    while (a === b && guard < 40){
      if (Math.random() < accA) a++;
      if (Math.random() < accB) b++;
      guard++;
    }
    return [a,b];
  }
  function applyResult(aId, bId, scoreA, scoreB){ applyShootoutResult(campaign.standings, aId, bId, scoreA, scoreB); }
  function sortedStandings(){ return sortStandingsMap(campaign.standings, campaign.group); }
  function simulateFullGroup(teamIds){
    var map = makeStandingsMap(teamIds);
    for (var i=0;i<teamIds.length;i++){
      for (var j=i+1;j<teamIds.length;j++){
        var res = simShootout(teamIds[i], teamIds[j]);
        applyShootoutResult(map, teamIds[i], teamIds[j], res[0], res[1]);
      }
    }
    return sortStandingsMap(map, teamIds);
  }

  // Fixture de 3 fechas para un grupo de 4, con group[0] siempre tu equipo:
  // fecha1: vos-1, 2-3 | fecha2: vos-2, 1-3 | fecha3: vos-3, 1-2
  function buildRoundRobin(group){
    var rounds = [];
    for (var i=1; i<=3; i++){
      var restIdx = [1,2,3].filter(function(idx){ return idx !== i; });
      rounds.push({
        yourOpponent: group[i], otherA: group[restIdx[0]], otherB: group[restIdx[1]],
        yourResult: null, otherResult: null, played: false
      });
    }
    return rounds;
  }

  // Bombos por fuerza: se sortea una seleccion de cada bombo para cada
  // grupo antes de pasar al siguiente bombo, como un sorteo real de Mundial.
  function buildGroupsWithPots(teamIds){
    var sorted = teamIds.slice().sort(function(a,b){ return TEAMS_BY_ID[b].strength - TEAMS_BY_ID[a].strength; });
    var pots = [sorted.slice(0,8), sorted.slice(8,16), sorted.slice(16,24), sorted.slice(24,32)];
    var groups = [];
    for (var g=0; g<8; g++) groups.push([]);
    var drawOrder = [];
    pots.forEach(function(pot, potIdx){
      var potShuffled = shuffle(pot.slice());
      var groupIndices = shuffle([0,1,2,3,4,5,6,7]);
      for (var i=0;i<8;i++){
        var gi = groupIndices[i];
        var teamId = potShuffled[i];
        groups[gi].push(teamId);
        drawOrder.push({teamId:teamId, groupIndex:gi, potIndex:potIdx});
      }
    });
    return {groups:groups, drawOrder:drawOrder};
  }

  function startCampaign(yourId){
    campaign.yourId = yourId;
    var pool32 = TEAMS.map(function(t){ return t.id; });
    var built = buildGroupsWithPots(pool32);
    campaign.allGroups = built.groups;
    campaign.drawOrder = built.drawOrder;

    var yourGroupIndex = 0;
    for (var gi=0; gi<8; gi++){
      if (campaign.allGroups[gi].indexOf(yourId) !== -1){ yourGroupIndex = gi; break; }
    }
    campaign.groupLetter = GROUP_LETTERS[yourGroupIndex];
    campaign.yourGroupIndex = yourGroupIndex;
    var rawGroup = campaign.allGroups[yourGroupIndex];
    campaign.group = [yourId].concat(rawGroup.filter(function(id){ return id !== yourId; }));
    campaign.allGroups[yourGroupIndex] = campaign.group;

    campaign.standings = makeStandingsMap(campaign.group);
    campaign.rounds = buildRoundRobin(campaign.group);
    campaign.roundIndex = 0;
    campaign.stage = 'group';

    campaign.groupQualifiers = [];
    for (var og=0; og<8; og++){
      if (og === yourGroupIndex){ campaign.groupQualifiers.push(null); continue; }
      var sortedOg = simulateFullGroup(campaign.allGroups[og]);
      campaign.groupQualifiers.push([sortedOg[0].teamId, sortedOg[1].teamId]);
    }

    startDrawAnimation();
  }

  // ---------- Animacion del sorteo ----------
  var drawTimer = null;
  var drawStep = 0;
  function renderEmptyGroupBoxes(){
    drawGridEl.innerHTML = '';
    for (var g=0; g<8; g++){
      var box = document.createElement('div');
      box.className = 'draw-group-box';
      var title = document.createElement('div');
      title.className = 'draw-group-title';
      title.textContent = 'Grupo '+GROUP_LETTERS[g];
      box.appendChild(title);
      var slots = document.createElement('div');
      slots.className = 'draw-group-slots';
      slots.id = 'wcDrawSlots'+g;
      for (var s=0; s<4; s++){
        var slot = document.createElement('div');
        slot.className = 'draw-slot';
        slots.appendChild(slot);
      }
      box.appendChild(slots);
      drawGridEl.appendChild(box);
    }
  }
  function revealDrawStep(i){
    var entry = campaign.drawOrder[i];
    var team = TEAMS_BY_ID[entry.teamId];
    var slotsEl = document.getElementById('wcDrawSlots'+entry.groupIndex);
    var slot = slotsEl.children[entry.potIndex];
    slot.className = 'draw-slot is-filled'+(entry.teamId === campaign.yourId ? ' is-you' : '');
    slot.innerHTML = '<span class="team-badge draw-badge" style="background:'+team.shirt+';border-color:'+team.band+'"></span>'+
      '<span class="draw-slot-name">'+team.name+'</span>';
    drawStatusEl.textContent = 'Bombo '+(entry.potIndex+1)+' de 4 — '+team.name+' → Grupo '+GROUP_LETTERS[entry.groupIndex];
  }
  function finishDrawAnimation(){
    if (drawTimer){ clearInterval(drawTimer); drawTimer = null; }
    drawContinueBtn.classList.remove('is-hidden');
    drawStatusEl.textContent = '¡Sorteo terminado! Grupo '+campaign.groupLetter+' es el tuyo.';
  }
  function startDrawAnimation(){
    hideAllSubViews();
    drawView.classList.remove('is-hidden');
    renderEmptyGroupBoxes();
    drawContinueBtn.classList.add('is-hidden');
    drawStatusEl.textContent = 'Sorteando selecciones...';
    drawStep = 0;
    if (drawTimer) clearInterval(drawTimer);
    drawTimer = setInterval(function(){
      if (drawStep >= campaign.drawOrder.length){
        finishDrawAnimation();
        return;
      }
      revealDrawStep(drawStep);
      drawStep += 1;
    }, 200);
  }
  drawSkipBtn.addEventListener('click', function(){
    for (; drawStep < campaign.drawOrder.length; drawStep++){ revealDrawStep(drawStep); }
    finishDrawAnimation();
  });
  drawContinueBtn.addEventListener('click', function(){
    ensureAudio();
    showHubScreen();
  });

  // ---------- Pantalla del Mundial (hub) ----------
  function renderStandingsTable(){
    var sorted = sortedStandings();
    groupTableBody.innerHTML = '';
    sorted.forEach(function(s, idx){
      var tr = document.createElement('tr');
      var cls = '';
      if (s.teamId === campaign.yourId) cls += 'is-you ';
      if (campaign.roundIndex >= 3 && idx < 2) cls += 'is-qualified';
      tr.className = cls.trim();
      var gd = s.gf-s.ga;
      tr.innerHTML = '<td>'+TEAMS_BY_ID[s.teamId].name+'</td><td>'+s.pts+'</td><td>'+(gd>0?'+':'')+gd+'</td>';
      groupTableBody.appendChild(tr);
    });
  }
  function renderCurrentFixtureCard(){
    if (campaign.stage !== 'group' || campaign.roundIndex >= campaign.rounds.length){
      fixtureCurrentEl.classList.add('is-hidden');
      fixtureCurrentEl.innerHTML = '';
      return;
    }
    fixtureCurrentEl.classList.remove('is-hidden');
    var round = campaign.rounds[campaign.roundIndex];
    var html = '<div class="fixture-current-title">Fecha '+(campaign.roundIndex+1)+' de '+campaign.rounds.length+'</div><ul class="fixture-current-list">';
    html += '<li>'+TEAMS_BY_ID[campaign.yourId].name+' vs '+TEAMS_BY_ID[round.yourOpponent].name+'</li>';
    html += '<li>'+TEAMS_BY_ID[round.otherA].name+' vs '+TEAMS_BY_ID[round.otherB].name+'</li>';
    html += '</ul>';
    fixtureCurrentEl.innerHTML = html;
  }
  function renderFixtureList(){
    fixtureListEl.innerHTML = '';
    campaign.rounds.forEach(function(round, idx){
      var block = document.createElement('div');
      block.className = 'fixture-round';
      var title = document.createElement('div');
      title.className = 'fixture-round-title';
      title.textContent = 'Fecha '+(idx+1);
      block.appendChild(title);

      var yourNameA = TEAMS_BY_ID[campaign.yourId].name;
      var yourNameB = TEAMS_BY_ID[round.yourOpponent].name;
      var otherNameA = TEAMS_BY_ID[round.otherA].name;
      var otherNameB = TEAMS_BY_ID[round.otherB].name;
      var yourLine = document.createElement('div');
      var otherLine = document.createElement('div');

      if (round.played){
        yourLine.className = 'fixture-line is-done';
        yourLine.textContent = '✅ '+yourNameA+' '+round.yourResult[0]+'-'+round.yourResult[1]+' '+yourNameB;
        otherLine.className = 'fixture-line is-done';
        otherLine.textContent = '✅ '+otherNameA+' '+round.otherResult[0]+'-'+round.otherResult[1]+' '+otherNameB;
      } else if (idx === campaign.roundIndex){
        yourLine.className = 'fixture-line is-next';
        yourLine.textContent = '▶ '+yourNameA+' vs '+yourNameB+' (Próximo partido)';
        otherLine.className = 'fixture-line is-pending';
        otherLine.textContent = otherNameA+' vs '+otherNameB+' (Pendiente)';
      } else {
        yourLine.className = 'fixture-line is-pending';
        yourLine.textContent = yourNameA+' vs '+yourNameB+' (Pendiente)';
        otherLine.className = 'fixture-line is-pending';
        otherLine.textContent = otherNameA+' vs '+otherNameB+' (Pendiente)';
      }
      block.appendChild(yourLine);
      block.appendChild(otherLine);
      fixtureListEl.appendChild(block);
    });
  }
  function findYourMatchIndex(matches){
    for (var i=0;i<matches.length;i++){
      if (matches[i].a === campaign.yourId || matches[i].b === campaign.yourId) return i;
    }
    return -1;
  }
  function yourBracketOpponent(){
    var m = campaign.bracket.matches[findYourMatchIndex(campaign.bracket.matches)];
    return m.a === campaign.yourId ? m.b : m.a;
  }
  function renderBracketTree(){
    bracketTreeEl.innerHTML = '';
    if (campaign.stage !== 'knockout' || !campaign.bracket){
      var hint = document.createElement('p');
      hint.className = 'wc-bracket-hint';
      hint.textContent = 'Se arma cuando termine la fase de grupos.';
      bracketTreeEl.appendChild(hint);
      return;
    }
    var box = document.createElement('div');
    box.className = 'wc-bracket-round';
    var t = document.createElement('div');
    t.className = 'wc-bracket-round-title';
    t.textContent = campaign.bracket.roundLabel;
    box.appendChild(t);
    campaign.bracket.matches.forEach(function(m){
      var line = document.createElement('div');
      var isYou = m.a === campaign.yourId || m.b === campaign.yourId;
      line.className = 'wc-bracket-match'+(isYou ? ' is-you' : '');
      line.textContent = TEAMS_BY_ID[m.a].name+' vs '+TEAMS_BY_ID[m.b].name;
      box.appendChild(line);
    });
    bracketTreeEl.appendChild(box);
  }
  function hideAllSubViews(){
    menuView.classList.add('is-hidden');
    teamSelectView.classList.add('is-hidden');
    difficultyView.classList.add('is-hidden');
    drawView.classList.add('is-hidden');
    hubView.classList.add('is-hidden');
    matchView.classList.add('is-hidden');
    endView.classList.add('is-hidden');
    trainingSelectView.classList.add('is-hidden');
    configView.classList.add('is-hidden');
    statsView.classList.add('is-hidden');
  }
  function showHubScreen(){
    hideAllSubViews();
    hubView.classList.remove('is-hidden');
    renderStandingsTable();
    renderBracketTree();
    if (campaign.stage === 'group'){
      renderCurrentFixtureCard();
      renderFixtureList();
      fixtureListEl.classList.remove('is-hidden');
      hubTitleEl.textContent = 'Grupo '+campaign.groupLetter+' · Fecha '+(campaign.roundIndex+1)+' de 3';
      hubFechaLabelEl.textContent = 'Fecha '+(campaign.roundIndex+1);
      var opp = TEAMS_BY_ID[campaign.rounds[campaign.roundIndex].yourOpponent];
      hubTextEl.textContent = 'Próximo partido: vs '+opp.name;
    } else {
      fixtureCurrentEl.classList.add('is-hidden');
      fixtureListEl.classList.add('is-hidden');
      var label = campaign.bracket.roundLabel;
      hubTitleEl.textContent = label;
      hubFechaLabelEl.textContent = label;
      hubTextEl.textContent = 'vs '+TEAMS_BY_ID[yourBracketOpponent()].name;
    }
  }
  playMatchBtn.addEventListener('click', function(){
    ensureAudio();
    if (campaign.stage === 'group'){
      startMatchVs(campaign.rounds[campaign.roundIndex].yourOpponent, false);
    } else {
      startMatchVs(yourBracketOpponent(), false);
    }
  });

  function pairAdjacent(ids){
    var pairs = [];
    for (var i=0;i<ids.length;i+=2){ pairs.push({a: ids[i], b: ids[i+1]}); }
    return pairs;
  }
  function simulateKnockoutMatch(aId, bId){
    var score = simShootout(aId, bId);
    return score[0] > score[1] ? aId : bId;
  }
  function buildOctavosMatches(){
    var winners = [], runnersUp = [];
    for (var g=0; g<8; g++){
      winners.push(campaign.groupQualifiers[g][0]);
      runnersUp.push(campaign.groupQualifiers[g][1]);
    }
    var offset = 1 + Math.floor(Math.random()*7);
    var matches = [];
    for (var g2=0; g2<8; g2++){
      matches.push({a: winners[g2], b: runnersUp[(g2+offset)%8]});
    }
    return matches;
  }
  function finishGroupStage(){
    var sorted = sortedStandings();
    var yourIndex = -1;
    for (var i=0;i<sorted.length;i++){ if (sorted[i].teamId === campaign.yourId){ yourIndex = i; break; } }
    stats.played += 1;
    if (yourIndex < 2){
      campaign.groupQualifiers[campaign.yourGroupIndex] = [sorted[0].teamId, sorted[1].teamId];
      campaign.stage = 'knockout';
      campaign.bracket = {roundName:'octavos', roundLabel:'Octavos de Final', matches: buildOctavosMatches()};
      saveStats();
      showHubScreen();
    } else {
      maybeUpdateBestResult('Fase de grupos');
      saveStats();
      endCampaign('eliminated-group');
    }
  }
  var NEXT_KNOCKOUT_ROUND = {octavos:'cuartos', cuartos:'semifinal', semifinal:'final'};
  var KNOCKOUT_ROUND_LABELS = {cuartos:'Cuartos de Final', semifinal:'Semifinal', final:'Final'};
  var ROUND_RESULT_LABELS = {octavos:'Octavos de Final', cuartos:'Cuartos de Final', semifinal:'Semifinal'};
  function resolveKnockout(yourWon, finalScore){
    var yourIdx = findYourMatchIndex(campaign.bracket.matches);
    var winners = campaign.bracket.matches.map(function(m, i){
      if (i === yourIdx) return yourWon ? campaign.yourId : (m.a === campaign.yourId ? m.b : m.a);
      return simulateKnockoutMatch(m.a, m.b);
    });
    if (!yourWon){
      maybeUpdateBestResult(campaign.bracket.roundName === 'final' ? 'Subcampeón' : ROUND_RESULT_LABELS[campaign.bracket.roundName]);
      saveStats();
      endCampaign(campaign.bracket.roundName === 'final' ? 'runner-up' : 'eliminated-'+campaign.bracket.roundName, finalScore);
      return;
    }
    if (campaign.bracket.roundName === 'final'){
      stats.won += 1;
      maybeUpdateBestResult('Campeón');
      saveStats();
      endCampaign('champion', finalScore);
      return;
    }
    var nextRoundName = NEXT_KNOCKOUT_ROUND[campaign.bracket.roundName];
    campaign.bracket = {roundName: nextRoundName, roundLabel: KNOCKOUT_ROUND_LABELS[nextRoundName], matches: pairAdjacent(winners)};
    showHubScreen();
  }
  function endCampaign(resultType, finalScore){
    hideAllSubViews();
    endView.classList.remove('is-hidden');
    var titleMap = {
      champion: '🏆 ¡Campeón del Mundial!',
      'runner-up': '🥈 Subcampeón',
      'eliminated-octavos': 'Eliminado en octavos de final',
      'eliminated-cuartos': 'Eliminado en cuartos de final',
      'eliminated-semifinal': 'Eliminado en semifinales',
      'eliminated-group': 'Eliminado en fase de grupos'
    };
    endTitleEl.textContent = titleMap[resultType] || 'Fin del Mundial';
    var extra = finalScore ? ' Resultado final: '+finalScore[0]+'-'+finalScore[1]+'.' : '';
    endTextEl.textContent = 'Jugaste con '+TEAMS_BY_ID[campaign.yourId].name+' en dificultad '+currentDifficulty.label+'.'+extra;
  }
  endRetryBtn.addEventListener('click', showMenu);

  function afterGroupMatchContinue(yourScore, oppScore){
    var round = campaign.rounds[campaign.roundIndex];
    round.yourResult = [yourScore, oppScore];
    applyResult(campaign.yourId, round.yourOpponent, yourScore, oppScore);
    var otherScore = simShootout(round.otherA, round.otherB);
    round.otherResult = otherScore;
    applyResult(round.otherA, round.otherB, otherScore[0], otherScore[1]);
    round.played = true;
    campaign.roundIndex += 1;
    if (campaign.roundIndex >= 3) finishGroupStage();
    else showHubScreen();
  }

  // ---------- Partido de penales (motor principal) ----------
  // Nunca controlas los dos lados de un mismo penal: si pateas vos, la IA
  // decide unicamente el arquero rival; si patea la IA, vos controlas
  // unicamente tu arquero. playerKicks marca de que lado estas cada vez.
  var matchMode = 'campaign'; // 'campaign' | 'training-kick' | 'training-save'
  var homeTeamData = null, awayTeamData = null; // home = vos siempre, away = rival
  var shootout = null;
  var kickState = null;
  var trainStats = {attempts:0, made:0};

  function opponentGkChance(oppTeam){
    var base = currentDifficulty.gkGuess;
    var bonus = (teamGk(oppTeam)-0.4)*0.35;
    return clamp(base+bonus, 0.05, 0.75);
  }
  function keeperSkillBonusFor(oppTeam){
    return currentDifficulty.gkSkillBonus + (teamGk(oppTeam)-0.4)*0.22;
  }

  function newShootout(){
    var firstIsHome = Math.random() < 0.5;
    return {
      order: firstIsHome ? ['home','away'] : ['away','home'],
      round: 1, phaseIndex: 0,
      scoreHome: 0, scoreAway: 0, takenHome: 0, takenAway: 0,
      history: [], finished: false, winner: null, suddenDeath: false
    };
  }
  function shootoutTotalRounds(){ return Math.max(5, shootout.round); }
  function currentKicker(){ return shootout.order[shootout.phaseIndex]; }
  function isRegular(){ return shootout.round <= 5; }

  function recordKick(side, made){
    shootout.history.push({side:side, round:shootout.round, made:made});
    if (side === 'home'){ if (made) shootout.scoreHome++; if (isRegular()) shootout.takenHome++; }
    else { if (made) shootout.scoreAway++; if (isRegular()) shootout.takenAway++; }

    if (isRegular()){
      var remHome = 5-shootout.takenHome, remAway = 5-shootout.takenAway;
      if (shootout.scoreHome > shootout.scoreAway+remAway){ shootout.finished = true; shootout.winner = 'home'; }
      else if (shootout.scoreAway > shootout.scoreHome+remHome){ shootout.finished = true; shootout.winner = 'away'; }
    }

    shootout.phaseIndex += 1;
    if (shootout.phaseIndex >= 2){
      shootout.phaseIndex = 0;
      if (!shootout.finished){
        if (isRegular() && shootout.takenHome >= 5 && shootout.takenAway >= 5){
          if (shootout.scoreHome !== shootout.scoreAway){ shootout.finished = true; shootout.winner = shootout.scoreHome>shootout.scoreAway ? 'home':'away'; }
          else { shootout.suddenDeath = true; shootout.round += 1; }
        } else if (!isRegular()){
          if (shootout.scoreHome !== shootout.scoreAway){ shootout.finished = true; shootout.winner = shootout.scoreHome>shootout.scoreAway ? 'home':'away'; }
          else { shootout.round += 1; }
        } else {
          shootout.round += 1;
        }
      }
    }
  }

  function updateShootoutHud(){
    scoreHomeEl.textContent = shootout.scoreHome;
    scoreAwayEl.textContent = shootout.scoreAway;
    roundValEl.textContent = shootout.suddenDeath ? ('MS '+(shootout.round-5)) : shootout.round;
    renderShootoutTrack();
  }
  function renderShootoutTrack(){
    shootoutTrackEl.innerHTML = '';
    ['home','away'].forEach(function(side){
      var row = document.createElement('div');
      row.className = 'wc-shootout-row';
      var tag = document.createElement('span');
      tag.className = 'wc-row-tag';
      tag.textContent = side === 'home' ? 'Vos' : 'Rival';
      row.appendChild(tag);
      var kicksForSide = shootout.history.filter(function(h){ return h.side === side && h.round<=5; });
      for (var i=0;i<5;i++){
        var dot = document.createElement('span');
        var k = kicksForSide[i];
        var cls = 'wc-shootout-dot';
        if (k) cls += k.made ? ' is-hit' : ' is-miss';
        else if (!shootout.finished && shootout.round === i+1 && currentKicker() === side && isRegular()) cls += ' is-current';
        dot.className = cls;
        row.appendChild(dot);
      }
      shootoutTrackEl.appendChild(row);
    });
  }

  function startMatchVs(opponentId, isTraining){
    matchMode = isTraining ? matchMode : 'campaign';
    homeTeamData = TEAMS_BY_ID[campaign.yourId || 'argentina'];
    awayTeamData = TEAMS_BY_ID[opponentId];
    shootout = newShootout();
    homeBadgeEl.style.background = homeTeamData.shirt;
    homeBadgeEl.style.borderColor = homeTeamData.band;
    awayBadgeEl.style.background = awayTeamData.shirt;
    awayBadgeEl.style.borderColor = awayTeamData.band;
    updateShootoutHud();

    hideAllSubViews();
    matchView.classList.remove('is-hidden');
    startOverlay.classList.remove('is-hidden');
    overOverlay.classList.add('is-hidden');
    turnBannerEl.classList.add('is-hidden');
    controlsEl.style.visibility = 'hidden';
    trainingHintEl.classList.add('is-hidden');
    var firstName = shootout.order[0] === 'home' ? homeTeamData.name : awayTeamData.name;
    startTitleEl.textContent = '¿Listo para la tanda vs '+awayTeamData.name+'?';
    startDescEl.textContent = 'Vos pateás y la IA ataja; cuando patea la IA, atajás vos. 5 penales por equipo, muerte súbita si empatan. Patea primero '+firstName+'.';
    resetScene();
    draw();
  }
  function startTraining(kind){
    matchMode = kind;
    homeTeamData = TEAMS_BY_ID[pendingTeamId || campaign.yourId || 'argentina'];
    awayTeamData = TEAMS_BY_ID['brasil'];
    trainStats = {attempts:0, made:0};
    homeBadgeEl.style.background = homeTeamData.shirt;
    homeBadgeEl.style.borderColor = homeTeamData.band;
    awayBadgeEl.style.background = awayTeamData.shirt;
    awayBadgeEl.style.borderColor = awayTeamData.band;
    scoreHomeEl.textContent = '0';
    scoreAwayEl.textContent = '0';
    roundValEl.textContent = '∞';
    shootoutTrackEl.innerHTML = '';

    hideAllSubViews();
    matchView.classList.remove('is-hidden');
    startOverlay.classList.remove('is-hidden');
    overOverlay.classList.add('is-hidden');
    turnBannerEl.classList.add('is-hidden');
    controlsEl.style.visibility = 'hidden';
    trainingHintEl.classList.remove('is-hidden');
    startTitleEl.textContent = kind === 'training-kick' ? '¿Listo para patear?' : '¿Listo para atajar?';
    startDescEl.textContent = kind === 'training-kick' ? 'Practicá remates sin límite de intentos.' : 'Practicá atajadas sin límite de intentos.';
    resetScene();
    draw();
  }

  startBtn.addEventListener('click', function(){
    ensureAudio();
    startOverlay.classList.add('is-hidden');
    controlsEl.style.visibility = 'visible';
    startLoop();
    nextKick();
  });
  trainingExitBtn.addEventListener('click', function(){
    stopLoop();
    showMenu();
  });
  overContinueBtn.addEventListener('click', function(){
    overOverlay.classList.add('is-hidden');
    stopLoop();
    if (matchMode === 'campaign'){
      if (campaign.stage === 'group'){
        afterGroupMatchContinue(shootout.scoreHome, shootout.scoreAway);
      } else {
        resolveKnockout(shootout.winner === 'home', [shootout.scoreHome, shootout.scoreAway]);
      }
    } else {
      showMenu();
    }
  });

  // ---------- Decision de cada penal ----------
  function nextKick(){
    if (matchMode === 'campaign' && shootout.finished){
      finishInteractiveShootout();
      return;
    }
    var isTrainingKick = matchMode === 'training-kick';
    var isTrainingSave = matchMode === 'training-save';
    var kickerSide;
    if (isTrainingKick) kickerSide = 'home';
    else if (isTrainingSave) kickerSide = 'away';
    else kickerSide = currentKicker();

    var kickerTeam = kickerSide === 'home' ? homeTeamData : awayTeamData;
    var defenderTeam = kickerSide === 'home' ? awayTeamData : homeTeamData;
    var playerKicks = kickerSide === 'home';

    kickState = {
      side: kickerSide, playerKicks: playerKicks, kickerTeam: kickerTeam, defenderTeam: defenderTeam,
      dir: null, height: null, power: null, gkDir: null, gkHeight: null,
      finalDir: null, finalHeight: null, finalDirIdx: null, finalHeightIdx: null,
      wide: false, post: false, keeperTimeBonus: 0, outcome: null, phase: 'decide-dir'
    };
    turnBannerEl.classList.remove('is-hidden');
    turnBannerEl.textContent = playerKicks ? '⚽ Pateás vos' : '🧤 Atajás vos';
    stepPowerEl.classList.add('is-hidden');
    stepDirLabelEl.textContent = playerKicks ? 'Elegí la dirección' : '¿Dónde te tirás?';
    stepHeightLabelEl.textContent = playerKicks ? 'Elegí la altura' : '¿A qué altura?';
    stepDirEl.classList.remove('is-hidden');
    stepHeightEl.classList.add('is-hidden');
    resetScene();
  }

  function onChooseDir(dir){
    if (!kickState || kickState.phase !== 'decide-dir') return;
    beep(500, 0.05, 'square');
    if (kickState.playerKicks) kickState.dir = dir; else kickState.gkDir = dir;
    stepDirEl.classList.add('is-hidden');
    stepHeightEl.classList.remove('is-hidden');
    kickState.phase = 'decide-height';
  }
  function onChooseHeight(height){
    if (!kickState || kickState.phase !== 'decide-height') return;
    beep(520, 0.05, 'square');
    if (kickState.playerKicks) kickState.height = height; else kickState.gkHeight = height;
    stepHeightEl.classList.add('is-hidden');
    if (kickState.playerKicks){
      kickState.phase = 'decide-power';
      stepPowerEl.classList.remove('is-hidden');
      startPowerBar();
    } else {
      resolveKick();
    }
  }
  stepDirEl.querySelectorAll('.wc-choice-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      stepDirEl.querySelectorAll('.wc-choice-btn').forEach(function(b){ b.classList.remove('is-picked'); });
      btn.classList.add('is-picked');
      onChooseDir(btn.getAttribute('data-dir'));
    });
  });
  stepHeightEl.querySelectorAll('.wc-choice-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      stepHeightEl.querySelectorAll('.wc-choice-btn').forEach(function(b){ b.classList.remove('is-picked'); });
      btn.classList.add('is-picked');
      onChooseHeight(btn.getAttribute('data-height'));
    });
  });

  var POWER_PERIOD = 1.3;
  var powerT = 0;
  var powerRunning = false;
  function startPowerBar(){ powerT = 0; powerRunning = true; }
  function currentPowerValue(){
    // Va y viene entre 0 y 100 (triangular), simple de leer.
    var phase = (powerT % POWER_PERIOD) / POWER_PERIOD;
    return phase < 0.5 ? phase*2*100 : (1-phase)*2*100;
  }
  powerBarEl.addEventListener('click', function(){
    if (!powerRunning) return;
    powerRunning = false;
    kickState.power = currentPowerValue();
    stepPowerEl.classList.add('is-hidden');
    resolveKick();
  });

  // ---------- IA ----------
  // Que tan bien pega segun la potencia: en el "punto dulce" el remate sale
  // casi siempre donde apuntaste; pegarle muy suave o muy fuerte hace que se
  // desvie mas (y aumenta la chance de mandarla afuera), pero a cambio un
  // tiro suave le regala tiempo de reaccion al arquero y uno muy fuerte se
  // lo saca - la potencia influye de verdad en el resultado.
  function resolvePowerTier(power){
    if (power >= 60 && power <= 88) return {acc:0.95, wideChance:0.02, postChance:0.025, drift:1, keeperTimeBonus:0};
    if ((power >= 35 && power < 60) || (power > 88 && power <= 95)){
      var slow = power < 60;
      return {acc:0.80, wideChance:0.03, postChance:0.03, drift:1, keeperTimeBonus: slow?0.12:-0.03};
    }
    var tooWeak = power < 35;
    return {acc:0.55, wideChance: tooWeak?0.05:0.17, postChance:0.05, drift:2, keeperTimeBonus: tooWeak?0.22:-0.10};
  }
  // Resuelve un remate (de vos o de la IA): a que zona final termina yendo
  // la pelota (puede desviarse 1 o 2 pasos si la potencia no fue buena), si
  // sale afuera, si pega en el palo, y el bono/penalidad de tiempo de
  // reaccion para el arquero segun que tan fuerte fue.
  function resolveShot(dir, height, power, teamAcc, diffBonus){
    var tier = resolvePowerTier(power);
    var placementAcc = clamp(tier.acc + (teamAcc-0.6)*0.32 + (diffBonus||0), 0.15, 0.97);
    var maxDir = DIR_ZONES.length-1, maxHeight = HEIGHT_ZONES.length-1;
    var dirIdx = DIR_ZONES.indexOf(dir), heightIdx = HEIGHT_ZONES.indexOf(height);
    if (Math.random() >= placementAcc){
      dirIdx = driftIndex(dirIdx, maxDir, tier.drift);
      if (Math.random() < 0.45) heightIdx = driftIndex(heightIdx, maxHeight, 1);
    }
    var wide = Math.random() < tier.wideChance;
    var isEdge = dirIdx===0 || dirIdx===maxDir || heightIdx===maxHeight;
    var post = !wide && isEdge && Math.random() < tier.postChance;
    return {dirIdx:dirIdx, heightIdx:heightIdx, wide:wide, post:post, keeperTimeBonus:tier.keeperTimeBonus};
  }
  // El arquero rival "lee" tu remate segun la dificultad y su propio nivel:
  // cuanto mejor, mas cerca de tu zona real adivina - nunca al azar puro,
  // nunca infalible.
  function aiGoalkeeperGuess(intendedDir, intendedHeight, defenderTeam){
    var guessChance = opponentGkChance(defenderTeam);
    var dirIdx = DIR_ZONES.indexOf(intendedDir), heightIdx = HEIGHT_ZONES.indexOf(intendedHeight);
    if (Math.random() < guessChance){
      if (Math.random() < 0.7) return {dirIdx:dirIdx, heightIdx:heightIdx};
      return {dirIdx: driftIndex(dirIdx, DIR_ZONES.length-1, 1), heightIdx:heightIdx};
    }
    return {dirIdx: Math.floor(Math.random()*DIR_ZONES.length), heightIdx: Math.floor(Math.random()*HEIGHT_ZONES.length)};
  }
  // La IA varia sus remates: a veces busca el angulo mas dificil, a veces
  // sorprende al medio, a veces la baja pegada al piso, a veces la levanta -
  // nunca un patron fijo. La potencia tambien varia: a veces la pega fuerte,
  // a veces la coloca suave.
  function aiPickShotZone(){
    var diff = currentDifficulty;
    var dirIdx;
    if (Math.random() < diff.cornerBias) dirIdx = pick([0,1,5,6]);
    else if (Math.random() < 0.22) dirIdx = 3;
    else dirIdx = pick([1,2,3,4,5]);
    var heightIdx;
    var r = Math.random();
    if (r < 0.3) heightIdx = 2;
    else if (r < 0.55) heightIdx = 0;
    else heightIdx = 1;
    return {dir:DIR_ZONES[dirIdx], height:HEIGHT_ZONES[heightIdx]};
  }
  function aiPickPower(){
    var diff = currentDifficulty;
    var r = Math.random();
    if (r < diff.hardShotChance) return 70+Math.random()*26;
    if (r < diff.hardShotChance+0.2) return 18+Math.random()*24;
    return 42+Math.random()*32;
  }
  // Chance de atajar una vez que ya se sabe a que zona se tiro el arquero:
  // si acierta justo tiene muy buena chance, si se tira a una zona vecina
  // todavia puede estirarse y llegar, si se tira lejos ya no llega. El bono
  // del arquero rival (dificultad + plantel) y el de tiempo de reaccion
  // (potencia del remate) se suman aca arriba - cuando atajas VOS, nunca se
  // te regala nada, solo cuenta tu propia lectura de la jugada.
  function saveChanceForDistance(dist){
    if (dist <= 0.01) return 0.90;
    if (dist <= 1.5) return 0.40;
    if (dist <= 2.6) return 0.14;
    return 0.02;
  }
  function resolveSave(shot, gkDirIdx, gkHeightIdx, keeperSkillBonus){
    if (shot.wide || shot.post) return false;
    var dirDist = Math.abs(shot.dirIdx - gkDirIdx);
    var heightDist = Math.abs(shot.heightIdx - gkHeightIdx);
    var dist = dirDist + heightDist*1.4;
    var chance = clamp(saveChanceForDistance(dist) + (keeperSkillBonus||0) + shot.keeperTimeBonus, 0.01, 0.95);
    return Math.random() < chance;
  }

  function resolveKick(){
    kickState.phase = 'resolving';
    var shot, gkDirIdx, gkHeightIdx, keeperSkillBonus;
    if (kickState.playerKicks){
      shot = resolveShot(kickState.dir, kickState.height, kickState.power, teamAccuracy(kickState.kickerTeam), 0);
      var gkGuess = aiGoalkeeperGuess(kickState.dir, kickState.height, kickState.defenderTeam);
      gkDirIdx = gkGuess.dirIdx; gkHeightIdx = gkGuess.heightIdx;
      kickState.gkDir = DIR_ZONES[gkDirIdx]; kickState.gkHeight = HEIGHT_ZONES[gkHeightIdx];
      keeperSkillBonus = keeperSkillBonusFor(kickState.defenderTeam);
    } else {
      var target = aiPickShotZone();
      var power = aiPickPower();
      kickState.power = power;
      shot = resolveShot(target.dir, target.height, power, teamAccuracy(kickState.kickerTeam), currentDifficulty.shooterBonus);
      gkDirIdx = DIR_ZONES.indexOf(kickState.gkDir); gkHeightIdx = HEIGHT_ZONES.indexOf(kickState.gkHeight);
      keeperSkillBonus = 0;
    }
    kickState.finalDir = DIR_ZONES[shot.dirIdx]; kickState.finalHeight = HEIGHT_ZONES[shot.heightIdx];
    kickState.finalDirIdx = shot.dirIdx; kickState.finalHeightIdx = shot.heightIdx;
    kickState.keeperTimeBonus = shot.keeperTimeBonus;
    kickState.wide = shot.wide; kickState.post = shot.post;

    if (shot.wide) kickState.outcome = 'wide';
    else if (shot.post) kickState.outcome = 'post';
    else kickState.outcome = resolveSave(shot, gkDirIdx, gkHeightIdx, keeperSkillBonus) ? 'save' : 'goal';

    if (matchMode === 'campaign'){
      var made = kickState.outcome === 'goal';
      if (kickState.playerKicks){ stats.kicksTaken += 1; if (made) stats.kicksScored += 1; }
      else { stats.savesAttempted += 1; if (kickState.outcome === 'save') stats.savesGood += 1; }
      recordKick(kickState.side, made);
      updateShootoutHud();
    } else if (matchMode === 'training-kick'){
      trainStats.attempts += 1; if (kickState.outcome === 'goal') trainStats.made += 1;
    } else if (matchMode === 'training-save'){
      trainStats.attempts += 1; if (kickState.outcome === 'save') trainStats.made += 1;
    }

    beginAnimation();
  }

  function finishInteractiveShootout(){
    saveStats();
    var youWon = shootout.winner === 'home';
    overTitleEl.textContent = youWon ? '¡Ganaste la tanda!' : '¡Perdiste la tanda!';
    overScoreEl.textContent = homeTeamData.name+' '+shootout.scoreHome+' - '+shootout.scoreAway+' '+awayTeamData.name;
    turnBannerEl.classList.add('is-hidden');
    controlsEl.style.visibility = 'hidden';
    overOverlay.classList.remove('is-hidden');
  }

  // ---------- Animacion (canvas) ----------
  // Camara ~25% mas cerca que antes: el arco ocupa mas espacio en pantalla,
  // el arquero se ve mas grande y el punto penal esta mas cerca del arco.
  var ZONE_X = [0.07,0.20,0.34,0.5,0.66,0.80,0.93];
  var ZONE_Y = [0.86,0.52,0.14];
  var STAND_H = 96;
  var GOAL_L = 300, GOAL_R = 600, GOAL_T = 112, GOAL_B = 236;
  var SPOT = {x:450, y:378};
  var GK_IDLE_X = 450, GK_IDLE_Y = 200;
  function zonePoint(dir, height){
    var dirIdx = DIR_ZONES.indexOf(dir), heightIdx = HEIGHT_ZONES.indexOf(height);
    return {x: GOAL_L+(GOAL_R-GOAL_L)*ZONE_X[dirIdx], y: GOAL_T+(GOAL_B-GOAL_T)*ZONE_Y[heightIdx]};
  }
  var scene = {
    phase:'idle', t:0, idleClock:0, kickerX:0, kickerY:0, ballX:SPOT.x, ballY:SPOT.y,
    gkX:GK_IDLE_X, gkY:GK_IDLE_Y, gkTargetX:GK_IDLE_X, gkTargetY:GK_IDLE_Y,
    gkStretch:0, crowdPulse:0, confetti:[]
  };
  function resetScene(){
    scene.phase = 'idle'; scene.t = 0;
    scene.ballX = SPOT.x; scene.ballY = SPOT.y;
    scene.kickerX = SPOT.x; scene.kickerY = SPOT.y+95;
    scene.gkX = GK_IDLE_X; scene.gkY = GK_IDLE_Y; scene.gkTargetX = GK_IDLE_X; scene.gkTargetY = GK_IDLE_Y;
    scene.gkStretch = 0;
    scene.crowdPulse = 0;
    scene.resultText = '';
  }
  var RUN_DUR = 0.5, REVEAL_DUR = 1.1;
  function shotDurationFor(power){
    // Mas potencia = la pelota vuela mas rapido (mas sensacion de velocidad).
    return clamp(0.58 - (power/100)*0.30, 0.26, 0.6);
  }
  function beginAnimation(){
    scene.phase = 'run';
    scene.t = 0;
    scene.runStartX = SPOT.x - 100; scene.runStartY = SPOT.y+105;
    scene.ballX = SPOT.x; scene.ballY = SPOT.y;
    scene.gkX = GK_IDLE_X; scene.gkY = GK_IDLE_Y; scene.gkStretch = 0;
    var target = zonePoint(kickState.finalDir, kickState.finalHeight);
    if (kickState.wide){
      var edgeOut = kickState.finalDirIdx <= 1 ? -80 : kickState.finalDirIdx >= 5 ? 80 : (Math.random()<0.5?-80:80);
      scene.shotTargetX = target.x + edgeOut;
      scene.shotTargetY = kickState.finalHeightIdx === HEIGHT_ZONES.length-1 ? GOAL_T-60 : target.y;
    } else if (kickState.post){
      scene.shotTargetX = kickState.finalDirIdx===0 ? GOAL_L : kickState.finalDirIdx===DIR_ZONES.length-1 ? GOAL_R : target.x;
      scene.shotTargetY = kickState.finalHeightIdx===HEIGHT_ZONES.length-1 ? GOAL_T : target.y;
    } else {
      scene.shotTargetX = target.x; scene.shotTargetY = target.y;
    }
    var gkTarget = zonePoint(kickState.gkDir, kickState.gkHeight);
    scene.gkTargetX = gkTarget.x; scene.gkTargetY = clamp(gkTarget.y, GOAL_T+55, GOAL_B-25);
    scene.shotDur = shotDurationFor(kickState.power||55);
    beep(260, 0.05, 'square');
  }
  function advanceScene(dt){
    scene.idleClock += dt;
    if (scene.phase === 'idle'){
      // El arquero no se queda quieto: se acomoda y se balancea antes del disparo.
      scene.gkX = GK_IDLE_X + Math.sin(scene.idleClock*2.1)*10;
      scene.gkY = GK_IDLE_Y + Math.sin(scene.idleClock*1.3)*3;
      return;
    }
    scene.t += dt;
    if (scene.phase === 'run'){
      var f = clamp(scene.t/RUN_DUR, 0, 1);
      scene.kickerX = scene.runStartX + (SPOT.x-scene.runStartX)*f;
      scene.kickerY = scene.runStartY + (SPOT.y+35-scene.runStartY)*f;
      if (f >= 1){ scene.phase = 'shot'; scene.t = 0; beep(180, 0.1, 'triangle'); }
    } else if (scene.phase === 'shot'){
      var diveDur = currentDifficulty.diveDur;
      var f2 = clamp(scene.t/scene.shotDur, 0, 1);
      var ease = f2*f2; // acelera hacia el final - mas sensacion de velocidad
      scene.ballX = SPOT.x + (scene.shotTargetX-SPOT.x)*ease;
      scene.ballY = SPOT.y + (scene.shotTargetY-SPOT.y)*ease;
      var fg = clamp(scene.t/diveDur, 0, 1);
      scene.gkX = GK_IDLE_X + (scene.gkTargetX-GK_IDLE_X)*fg;
      scene.gkY = GK_IDLE_Y + (scene.gkTargetY-GK_IDLE_Y)*fg;
      if (f2 >= 1){
        scene.phase = 'reveal'; scene.t = 0;
        onKickResolved();
      }
    } else if (scene.phase === 'reveal'){
      scene.crowdPulse = Math.min(1, scene.t/0.25);
      if (kickState.outcome === 'save') scene.gkStretch = Math.min(1, scene.t/0.22);
      updateConfetti(dt);
      if (scene.t >= REVEAL_DUR){
        scene.phase = 'idle';
        if (matchMode === 'campaign' && shootout.finished){ finishInteractiveShootout(); }
        else { nextKick(); }
      }
    }
  }
  function onKickResolved(){
    if (kickState.outcome === 'goal'){
      scene.resultText = '¡GOOOL!';
      crowdRoar(true);
      beep(700, 0.12, 'triangle');
      setTimeout(function(){ beep(950, 0.12, 'triangle'); }, 90);
      if (matchMode === 'campaign' && shootout.finished && shootout.winner === kickState.side){
        spawnConfetti();
      }
    } else if (kickState.outcome === 'save'){
      scene.resultText = '¡ATAJADÓN!';
      crowdRoar(false);
      beep(200, 0.15, 'sawtooth');
    } else if (kickState.outcome === 'post'){
      scene.resultText = '¡AL PALO!';
      crowdRoar(false);
      beep(900, 0.08, 'square');
      setTimeout(function(){ beep(500, 0.1, 'square'); }, 60);
    } else {
      scene.resultText = '¡AFUERA!';
      crowdRoar(false);
      beep(140, 0.2, 'sawtooth');
    }
  }
  function spawnConfetti(){
    var colors = ['#ffd23f','#ff5c7a','#5cc9ff','#7ed957','#ffffff'];
    for (var i=0;i<70;i++){
      scene.confetti.push({
        x: 450+(Math.random()*300-150), y: -20-Math.random()*80,
        vx:(Math.random()*2-1)*40, vy:60+Math.random()*90,
        color: pick(colors), size:3+Math.random()*3, life:2.4+Math.random()
      });
    }
  }
  function updateConfetti(dt){
    for (var i=scene.confetti.length-1;i>=0;i--){
      var p = scene.confetti[i];
      p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 40*dt; p.life -= dt;
      if (p.life <= 0) scene.confetti.splice(i,1);
    }
  }

  // ---------- Dibujo ----------
  var CROWD_PALETTE = ['#ff5c7a','#ffd23f','#5cc9ff','#7ed957','#ffffff','#b892ff','#ff9f4d'];
  var CROWD_COLS = 60, CROWD_ROWS = 3;
  var CROWD_CELLS = (function(){
    var cells = [];
    for (var r=0;r<CROWD_ROWS;r++){
      for (var i=0;i<CROWD_COLS;i++){
        cells.push({color: pick(CROWD_PALETTE), phase: Math.random()*Math.PI*2, on: Math.random()<0.82});
      }
    }
    return cells;
  })();
  var FLAG_DEFS = [
    {x:70, color:'#5cc9ff'}, {x:230, color:'#ffd23f'}, {x:450, color:'#ff5c7a'},
    {x:670, color:'#7ed957'}, {x:830, color:'#b892ff'}
  ];
  var animClock = 0;

  function drawStadium(){
    var c = ctx;
    animClock += 1/60;

    c.fillStyle = '#070c1c';
    c.fillRect(0,0,CANVAS_W,STAND_H);

    var standGrad = c.createLinearGradient(0,0,0,STAND_H-14);
    standGrad.addColorStop(0, '#1b2340');
    standGrad.addColorStop(1, '#0e1428');
    c.fillStyle = standGrad;
    c.fillRect(0,0,CANVAS_W,STAND_H-14);

    // publico, estilo pixel art
    var cellW = CANVAS_W/CROWD_COLS;
    var idx = 0;
    for (var r=0;r<CROWD_ROWS;r++){
      var rowY = 10+r*14;
      for (var i=0;i<CROWD_COLS;i++){
        var cell = CROWD_CELLS[idx++];
        if (!cell.on) continue;
        var bob = Math.sin(animClock*3+cell.phase)*1.6;
        var pulse = scene.crowdPulse > 0 ? (0.55+0.45*Math.sin(animClock*14+cell.phase)) : 0.62;
        c.globalAlpha = 0.5+pulse*0.5;
        c.fillStyle = cell.color;
        c.fillRect(i*cellW+1, rowY+bob, cellW-2, 7);
      }
    }
    c.globalAlpha = 1;

    // banderas animadas
    FLAG_DEFS.forEach(function(f, fi){
      var wave = Math.sin(animClock*2.4+fi)*0.35;
      c.save();
      c.translate(f.x, 6);
      c.rotate(wave*0.25);
      c.fillStyle = f.color;
      c.beginPath();
      c.moveTo(0,0); c.lineTo(20,3+wave*4); c.lineTo(0,10);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(0,-2); c.lineTo(0,12); c.stroke();
      c.restore();
    });

    // cartel LED
    var ledY = STAND_H-12;
    c.fillStyle = '#050810';
    c.fillRect(0, ledY, CANVAS_W, 12);
    var ledText = '  OTTO-GAMES  ·  MUNDIAL PENALTY SHOOTER  ·  ';
    c.save();
    c.beginPath(); c.rect(0,ledY,CANVAS_W,12); c.clip();
    c.font = '900 10px monospace';
    c.fillStyle = '#5cff8a';
    c.textBaseline = 'middle';
    var scrollX = CANVAS_W - ((animClock*40) % (ledText.length*8+CANVAS_W));
    c.fillText(ledText, scrollX, ledY+6);
    c.fillText(ledText, scrollX+ledText.length*8, ledY+6);
    c.restore();

    // reflectores iluminando la cancha
    [[40,4], [CANVAS_W-40,4]].forEach(function(p){
      var glow = c.createRadialGradient(p[0],p[1],2, p[0],p[1],260);
      glow.addColorStop(0, 'rgba(255,255,255,0.35)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = glow;
      c.beginPath(); c.arc(p[0],p[1],260,0,Math.PI*2); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(p[0],p[1],4,0,Math.PI*2); c.fill();
    });

    // cancha (trapecio en perspectiva, mas profundidad que antes)
    var pitchGrad = c.createLinearGradient(0,STAND_H,0,CANVAS_H);
    pitchGrad.addColorStop(0, '#155e2c');
    pitchGrad.addColorStop(0.5, '#1f8a3e');
    pitchGrad.addColorStop(1, '#34b85a');
    c.fillStyle = pitchGrad;
    c.beginPath();
    c.moveTo(240,STAND_H); c.lineTo(660,STAND_H); c.lineTo(900,CANVAS_H); c.lineTo(0,CANVAS_H);
    c.closePath(); c.fill();

    // franjas de cesped
    c.save();
    c.beginPath();
    c.moveTo(240,STAND_H); c.lineTo(660,STAND_H); c.lineTo(900,CANVAS_H); c.lineTo(0,CANVAS_H);
    c.closePath(); c.clip();
    var bands = 9;
    for (var b=0;b<bands;b++){
      if (b%2!==0) continue;
      var tTop = STAND_H+(b/bands)*(CANVAS_H-STAND_H);
      var tBot = STAND_H+((b+1)/bands)*(CANVAS_H-STAND_H);
      c.fillStyle = 'rgba(255,255,255,0.05)';
      c.fillRect(0, tTop, CANVAS_W, tBot-tTop);
    }
    c.restore();

    // vineta para dar mas profundidad
    var vign = c.createRadialGradient(450,CANVAS_H*0.55,80, 450,CANVAS_H*0.55,520);
    vign.addColorStop(0,'rgba(0,0,0,0)');
    vign.addColorStop(1,'rgba(0,0,0,0.28)');
    c.fillStyle = vign;
    c.fillRect(0,STAND_H,CANVAS_W,CANVAS_H-STAND_H);

    // area y punto penal
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 2.4;
    c.strokeRect(GOAL_L-70, GOAL_B, (GOAL_R-GOAL_L)+140, SPOT.y+40-GOAL_B);
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath(); c.arc(SPOT.x, SPOT.y, 3.5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(SPOT.x, SPOT.y+4, 72, Math.PI*1.12, Math.PI*1.88); c.stroke();

    drawGoal();
  }
  function drawGoal(){
    var c = ctx;
    // sombra del arco sobre el cesped
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath();
    c.ellipse((GOAL_L+GOAL_R)/2, GOAL_B+6, (GOAL_R-GOAL_L)/2+10, 10, 0, 0, Math.PI*2);
    c.fill();

    // red, con un leve pandeo para que no se vea plana
    c.save();
    c.beginPath(); c.rect(GOAL_L,GOAL_T,GOAL_R-GOAL_L,GOAL_B-GOAL_T); c.clip();
    c.fillStyle = 'rgba(10,14,10,0.28)';
    c.fillRect(GOAL_L,GOAL_T,GOAL_R-GOAL_L,GOAL_B-GOAL_T);
    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = 1;
    var netWiggle = (scene.phase==='reveal' && kickState && kickState.outcome==='goal') ? Math.sin(scene.t*24)*Math.max(0,1-scene.t/0.5)*8 : 0;
    var sag = 6;
    for (var gx=GOAL_L; gx<=GOAL_R; gx+=11){
      var fx = (gx-GOAL_L)/(GOAL_R-GOAL_L);
      var bow = Math.sin(fx*Math.PI)*sag;
      c.beginPath();
      c.moveTo(gx+netWiggle*0.3, GOAL_T);
      c.quadraticCurveTo(gx+bow*0.4, (GOAL_T+GOAL_B)/2, gx-netWiggle*0.3, GOAL_B);
      c.stroke();
    }
    for (var gy=GOAL_T; gy<=GOAL_B; gy+=10){
      var fy = (gy-GOAL_T)/(GOAL_B-GOAL_T);
      var bow2 = Math.sin(fy*Math.PI)*sag*0.6;
      c.beginPath();
      c.moveTo(GOAL_L, gy+netWiggle+bow2);
      c.lineTo(GOAL_R, gy-netWiggle+bow2);
      c.stroke();
    }
    c.restore();

    // palos, mas gruesos y con sombra
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.4)';
    c.shadowBlur = 4;
    c.strokeStyle = '#f5f5f2';
    c.lineWidth = 7;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(GOAL_L,GOAL_B); c.lineTo(GOAL_L,GOAL_T); c.lineTo(GOAL_R,GOAL_T); c.lineTo(GOAL_R,GOAL_B);
    c.stroke();
    c.restore();
  }
  function drawFigure(x,y,shirt,band,pose){
    var c = ctx;
    c.save();
    c.translate(x,y);
    c.fillStyle = 'rgba(0,0,0,0.32)';
    c.beginPath(); c.ellipse(0, 37, 20, 7, 0, 0, Math.PI*2); c.fill();
    var rot = pose && pose.rot ? pose.rot : 0;
    var stretch = pose && pose.stretch ? pose.stretch : 0;
    c.rotate(rot);
    c.scale(1+stretch*0.5, 1-stretch*0.3);
    c.fillStyle = shirt;
    c.beginPath();
    if (c.roundRect) c.roundRect(-14,-7,28,42,10); else c.rect(-14,-7,28,42);
    c.fill();
    c.strokeStyle = band; c.lineWidth = 3.5;
    c.stroke();
    c.fillStyle = '#f0c39b';
    c.beginPath(); c.arc(0,-20,12.5,0,Math.PI*2); c.fill();
    c.restore();
  }
  function drawKicker(){
    if (scene.phase === 'idle') return;
    drawFigure(scene.kickerX, scene.kickerY, kickState.kickerTeam.shirt, kickState.kickerTeam.band, null);
  }
  function drawGoalkeeper(){
    var dt = kickState ? kickState.defenderTeam : awayTeamData;
    var rot = 0;
    if (scene.phase === 'shot' || scene.phase === 'reveal'){
      var fg = clamp((scene.gkX-GK_IDLE_X)/140, -1, 1);
      rot = fg*0.95;
    }
    var stretch = (scene.phase==='reveal' && kickState && kickState.outcome==='save') ? scene.gkStretch : 0;
    drawFigure(scene.gkX, scene.gkY, dt.shirt, '#0a0a0a', {rot:rot, stretch:stretch});
  }
  function drawBall(){
    var c = ctx;
    c.save();
    if (scene.phase === 'shot'){
      var dx = scene.ballX-SPOT.x, dy = scene.ballY-SPOT.y;
      var d = Math.hypot(dx,dy);
      if (d > 26 && scene.shotDur < 0.42){
        var ux = dx/(d||1), uy = dy/(d||1);
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(scene.ballX-ux*22, scene.ballY-uy*22);
        c.lineTo(scene.ballX, scene.ballY);
        c.stroke();
      }
    }
    c.translate(scene.ballX, scene.ballY);
    var grad = c.createRadialGradient(-4,-4,1,0,0,11);
    grad.addColorStop(0,'#ffffff'); grad.addColorStop(1,'#c9c9c6');
    c.beginPath(); c.arc(0,0,10,0,Math.PI*2); c.fillStyle = grad; c.fill();
    c.strokeStyle = 'rgba(20,20,20,0.5)'; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = '#1c1c1c';
    c.beginPath(); c.arc(0,0,3.2,0,Math.PI*2); c.fill();
    c.restore();
  }
  var RESULT_COLORS = {goal:'#ffd23f', save:'#5cc9ff', wide:'#ff5c7a', post:'#ff9f4d'};
  function drawResultText(){
    if (scene.phase !== 'reveal' || !scene.resultText) return;
    var c = ctx;
    var prog = clamp(scene.t/0.22, 0, 1);
    var alpha = scene.t > REVEAL_DUR-0.25 ? clamp((REVEAL_DUR-scene.t)/0.25,0,1) : 1;
    c.save();
    c.globalAlpha = alpha;
    c.translate(450, 270);
    c.scale(prog, prog);
    c.font = '900 46px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillText(scene.resultText, 3, 3);
    c.fillStyle = (kickState && RESULT_COLORS[kickState.outcome]) || '#fff';
    c.fillText(scene.resultText, 0, 0);
    c.restore();
  }
  function drawConfetti(){
    var c = ctx;
    scene.confetti.forEach(function(p){
      c.save();
      c.globalAlpha = clamp(p.life/1.2,0,1);
      c.fillStyle = p.color;
      c.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size*1.6);
      c.restore();
    });
  }
  function draw(){
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    drawStadium();
    drawGoalkeeper();
    drawBall();
    drawKicker();
    drawResultText();
    drawConfetti();
  }

  // ---------- Loop ----------
  var loopRunning = false;
  var lastTs = null;
  function startLoop(){
    if (loopRunning) return;
    loopRunning = true; lastTs = null;
    requestAnimationFrame(loop);
  }
  function stopLoop(){ loopRunning = false; }
  function loop(ts){
    if (!loopRunning) return;
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(0.033, (ts-lastTs)/1000);
    lastTs = ts;
    if (powerRunning){
      powerT += dt;
      var val = currentPowerValue();
      powerNeedleEl.style.left = val+'%';
    }
    advanceScene(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Menu principal ----------
  function showMenu(){
    stopLoop();
    hideAllSubViews();
    menuView.classList.remove('is-hidden');
  }
  document.getElementById('wcMenuPlayBtn').addEventListener('click', function(){
    ensureAudio();
    hideAllSubViews();
    teamSelectView.classList.remove('is-hidden');
  });
  document.getElementById('wcMenuTrainBtn').addEventListener('click', function(){
    ensureAudio();
    hideAllSubViews();
    trainingSelectView.classList.remove('is-hidden');
  });
  document.getElementById('wcMenuConfigBtn').addEventListener('click', function(){
    hideAllSubViews();
    configDifficultyEl.value = currentDiffKey;
    configView.classList.remove('is-hidden');
  });
  document.getElementById('wcMenuStatsBtn').addEventListener('click', function(){
    hideAllSubViews();
    renderStats();
    statsView.classList.remove('is-hidden');
  });
  trainingBackBtn.addEventListener('click', showMenu);
  configBackBtn.addEventListener('click', showMenu);
  statsBackBtn.addEventListener('click', showMenu);

  trainKickBtn.addEventListener('click', function(){
    ensureAudio();
    if (!pendingTeamId) pendingTeamId = 'argentina';
    startTraining('training-kick');
  });
  trainSaveBtn.addEventListener('click', function(){
    ensureAudio();
    if (!pendingTeamId) pendingTeamId = 'argentina';
    startTraining('training-save');
  });

  configDifficultyEl.addEventListener('change', function(){
    currentDiffKey = configDifficultyEl.value;
    currentDifficulty = DIFFICULTIES[currentDiffKey] || DIFFICULTIES.normal;
    saveConfig();
  });
  configResetBtn.addEventListener('click', function(){
    stats = defaultStats();
    saveStats();
    renderStats();
  });

  // ---------- Navegacion general ----------
  playMundialBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    mundialView.classList.remove('is-hidden');
    showMenu();
  });
  backFromMundialBtn.addEventListener('click', function(){
    stopLoop();
    mundialView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
  });

  loadConfig();
  loadStats();
  setMuted(muted);
})();
