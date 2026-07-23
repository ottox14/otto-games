// Mundial Penalty Shooter: elegis una seleccion entre 32 paises y jugas
// un Mundial completo (sorteo -> fase de grupos a 3 fechas, sincronizadas
// para todos los grupos -> octavos/cuartos/semifinal/final -> ceremonia),
// donde CADA partido del torneo se resuelve como una tanda de penales.
// Tus partidos se juegan a mano (elegis direccion/altura/potencia para
// patear, direccion/altura para atajar); el resto se simula al instante.
(function(){
  var CANVAS_W = 900, CANVAS_H = 480;

  // ---------- Selecciones ----------
  var TEAMS = [
    {id:'argentina', name:'Argentina', strength:92, shirt:'#75c2f2', band:'#ffffff', shorts:'#75c2f2', pattern:'stripes'},
    {id:'brasil', name:'Brasil', strength:90, shirt:'#ffd400', band:'#0a6c34', shorts:'#0a6c34', pattern:'band'},
    {id:'francia', name:'Francia', strength:89, shirt:'#0033a0', band:'#ffffff', shorts:'#e2001a', pattern:'sash'},
    {id:'alemania', name:'Alemania', strength:88, shirt:'#111111', band:'#ffd400', shorts:'#e2001a', pattern:'band'},
    {id:'espana', name:'España', strength:87, shirt:'#e2001a', band:'#ffd400', shorts:'#e2001a', pattern:'sash'},
    {id:'inglaterra', name:'Inglaterra', strength:85, shirt:'#ffffff', band:'#c8102e', shorts:'#0033a0', pattern:'halves'},
    {id:'portugal', name:'Portugal', strength:84, shirt:'#c8102e', band:'#0a6c34', shorts:'#111111', pattern:'halves'},
    {id:'holanda', name:'Países Bajos', strength:83, shirt:'#ff8c00', band:'#111111', shorts:'#ff8c00', pattern:'solid'},
    {id:'belgica', name:'Bélgica', strength:82, shirt:'#e2001a', band:'#111111', shorts:'#ffd400', pattern:'sash'},
    {id:'italia', name:'Italia', strength:81, shirt:'#0033a0', band:'#ffffff', shorts:'#0033a0', pattern:'solid'},
    {id:'croacia', name:'Croacia', strength:80, shirt:'#e2001a', band:'#ffffff', shorts:'#0033a0', pattern:'stripes'},
    {id:'uruguay', name:'Uruguay', strength:78, shirt:'#75c2f2', band:'#ffffff', shorts:'#111111', pattern:'solid'},
    {id:'suiza', name:'Suiza', strength:77, shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'solid'},
    {id:'marruecos', name:'Marruecos', strength:76, shirt:'#c8102e', band:'#0a6c34', shorts:'#c8102e', pattern:'band'},
    {id:'colombia', name:'Colombia', strength:75, shirt:'#ffd400', band:'#0033a0', shorts:'#e2001a', pattern:'band'},
    {id:'mexico', name:'México', strength:74, shirt:'#0a6c34', band:'#ffffff', shorts:'#0a6c34', pattern:'band'},
    {id:'senegal', name:'Senegal', strength:73, shirt:'#0a6c34', band:'#ffd400', shorts:'#e2001a', pattern:'band'},
    {id:'eeuu', name:'Estados Unidos', strength:73, shirt:'#0a2a5e', band:'#ffffff', shorts:'#e2001a', pattern:'band'},
    {id:'japon', name:'Japón', strength:72, shirt:'#0033a0', band:'#ffffff', shorts:'#0033a0', pattern:'solid'},
    {id:'chile', name:'Chile', strength:70, shirt:'#e2001a', band:'#ffffff', shorts:'#0033a0', pattern:'halves'},
    {id:'corea', name:'Corea del Sur', strength:71, shirt:'#c8102e', band:'#111111', shorts:'#c8102e', pattern:'solid'},
    {id:'ecuador', name:'Ecuador', strength:69, shirt:'#ffd400', band:'#0033a0', shorts:'#ffd400', pattern:'solid'},
    {id:'nigeria', name:'Nigeria', strength:68, shirt:'#0a6c34', band:'#ffffff', shorts:'#0a6c34', pattern:'stripes'},
    {id:'polonia', name:'Polonia', strength:68, shirt:'#ffffff', band:'#e2001a', shorts:'#ffffff', pattern:'halves'},
    {id:'australia', name:'Australia', strength:67, shirt:'#ffd400', band:'#0a6c34', shorts:'#0a6c34', pattern:'band'},
    {id:'peru', name:'Perú', strength:66, shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'sash'},
    {id:'canada', name:'Canadá', strength:65, shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'solid'},
    {id:'costa_rica', name:'Costa Rica', strength:64, shirt:'#e2001a', band:'#0033a0', shorts:'#ffffff', pattern:'band'},
    {id:'iran', name:'Irán', strength:63, shirt:'#ffffff', band:'#0a6c34', shorts:'#ffffff', pattern:'band'},
    {id:'arabia', name:'Arabia Saudita', strength:62, shirt:'#0a6c34', band:'#ffffff', shorts:'#0a6c34', pattern:'solid'},
    {id:'dinamarca', name:'Dinamarca', strength:71, shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'band'},
    {id:'ghana', name:'Ghana', strength:60, shirt:'#e2001a', band:'#ffd400', shorts:'#0a6c34', pattern:'band'}
  ];
  var TEAMS_BY_ID = {};
  TEAMS.forEach(function(t){ TEAMS_BY_ID[t.id] = t; });

  var DIFF_SETTINGS = {
    facil:   {label:'Fácil',   keeperReadBase:0.10, keeperReadScale:0.20, aiStrongBias:-0.05},
    normal:  {label:'Normal',  keeperReadBase:0.16, keeperReadScale:0.32, aiStrongBias:0.05},
    dificil: {label:'Difícil', keeperReadBase:0.22, keeperReadScale:0.44, aiStrongBias:0.16}
  };

  var GROUP_LETTERS = ['A','B','C','D','E','F','G','H'];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- DOM ----------
  var portalView = document.getElementById('portalView');
  var mundialView = document.getElementById('mundialView');
  var playMundialBtn = document.getElementById('playMundialBtn');
  var backFromMundialBtn = document.getElementById('backFromMundialBtn');
  var muteBtn = document.getElementById('mundialMuteBtn');

  var menuView = document.getElementById('munMenuView');
  var munPlayBtn = document.getElementById('munPlayBtn');
  var munTrainBtn = document.getElementById('munTrainBtn');
  var munConfigBtn = document.getElementById('munConfigBtn');
  var munStatsBtn = document.getElementById('munStatsBtn');

  var teamSelectView = document.getElementById('munTeamSelectView');
  var teamSelectBackBtn = document.getElementById('munTeamSelectBackBtn');
  var teamGridEl = document.getElementById('munTeamGrid');
  var confirmBar = document.getElementById('munConfirmBar');
  var confirmCrestEl = document.getElementById('munConfirmCrest');
  var confirmNameEl = document.getElementById('munConfirmName');
  var confirmCountryEl = document.getElementById('munConfirmCountry');
  var confirmBtn = document.getElementById('munConfirmBtn');

  var drawView = document.getElementById('munDrawView');
  var drawStatusEl = document.getElementById('munDrawStatus');
  var drawGridEl = document.getElementById('munDrawGrid');
  var drawSkipBtn = document.getElementById('munDrawSkipBtn');
  var drawContinueBtn = document.getElementById('munDrawContinueBtn');

  var hubView = document.getElementById('munHubView');
  var hubGroupLetterEl = document.getElementById('munHubGroupLetter');
  var hubMatchdayEl = document.getElementById('munHubMatchday');
  var hubTableBody = document.getElementById('munHubTableBody');
  var hubNextTextEl = document.getElementById('munHubNextText');
  var hubPlayBtn = document.getElementById('munHubPlayBtn');
  var hubFixtureListEl = document.getElementById('munHubFixtureList');

  var bracketView = document.getElementById('munBracketView');
  var bracketTitleEl = document.getElementById('munBracketTitle');
  var bracketTreeEl = document.getElementById('munBracketTree');
  var bracketNextTextEl = document.getElementById('munBracketNextText');
  var bracketPlayBtn = document.getElementById('munBracketPlayBtn');

  var matchView = document.getElementById('munMatchView');
  var matchBackBtn = document.getElementById('munMatchBackBtn');
  var scoreboardEl = document.getElementById('munMatchScoreboard');
  var matchHomeCrestEl = document.getElementById('munMatchHomeCrest');
  var matchHomeNameEl = document.getElementById('munMatchHomeName');
  var pensHomeEl = document.getElementById('munPensHome');
  var matchScoreEl = document.getElementById('munMatchScore');
  var pensAwayEl = document.getElementById('munPensAway');
  var matchAwayNameEl = document.getElementById('munMatchAwayName');
  var matchAwayCrestEl = document.getElementById('munMatchAwayCrest');
  var turnBannerEl = document.getElementById('munTurnBanner');

  var startOverlay = document.getElementById('munStartOverlay');
  var startTitleEl = document.getElementById('munStartTitle');
  var startBtn = document.getElementById('munStartBtn');
  var shootoutOverOverlay = document.getElementById('munShootoutOverOverlay');
  var shootoutOverTitleEl = document.getElementById('munShootoutOverTitle');
  var shootoutOverScoreEl = document.getElementById('munShootoutOverScore');
  var shootoutContinueBtn = document.getElementById('munShootoutContinueBtn');

  var controlsPanel = document.getElementById('munControlsPanel');
  var dirRow = document.getElementById('munDirRow');
  var heightRow = document.getElementById('munHeightRow');
  var powerGroup = document.getElementById('munPowerGroup');
  var powerFillEl = document.getElementById('munPowerFill');
  var actionBtn = document.getElementById('munActionBtn');

  var trainingView = document.getElementById('munTrainingView');
  var trainingBackBtn = document.getElementById('munTrainingBackBtn');
  var trainKickBtn = document.getElementById('munTrainKickBtn');
  var trainSaveBtn = document.getElementById('munTrainSaveBtn');

  var configView = document.getElementById('munConfigView');
  var configBackBtn = document.getElementById('munConfigBackBtn');
  var configSoundBtn = document.getElementById('munConfigSoundBtn');
  var configDiffRow = document.getElementById('munConfigDiffRow');
  var configResetBtn = document.getElementById('munConfigResetBtn');

  var statsView = document.getElementById('munStatsView');
  var statsBackBtn = document.getElementById('munStatsBackBtn');
  var statsGridEl = document.getElementById('munStatsGrid');

  var ceremonyView = document.getElementById('munCeremonyView');
  var confettiEl = document.getElementById('munConfetti');
  var trophyIconEl = document.getElementById('munTrophyIcon');
  var championTitleEl = document.getElementById('munChampionTitle');
  var championTeamEl = document.getElementById('munChampionTeam');
  var ceremonyContinueBtn = document.getElementById('munCeremonyContinueBtn');

  var ALL_SUBVIEWS = [menuView, teamSelectView, drawView, hubView, bracketView, matchView, trainingView, configView, statsView, ceremonyView];
  function hideAllSubViews(){ ALL_SUBVIEWS.forEach(function(v){ v.classList.add('is-hidden'); }); }
  function showSubView(v){ hideAllSubViews(); v.classList.remove('is-hidden'); }

  var canvas = document.getElementById('munCanvas');
  var ctx = canvas.getContext('2d');
  function fitCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W*dpr;
    canvas.height = CANVAS_H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  function mundialActive(){ return !mundialView.classList.contains('is-hidden'); }

  // ---------- Audio ----------
  var audioCtx = null;
  function ensureAudio(){
    if (!audioCtx){
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ audioCtx = null; }
    }
  }
  function beep(freq, dur, type){
    if (!settings.sound || !audioCtx) return;
    var t0 = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  function crowdNoise(){
    if (!settings.sound || !audioCtx) return;
    var t0 = audioCtx.currentTime;
    var bufferSize = audioCtx.sampleRate*0.4;
    var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i=0;i<bufferSize;i++){ data[i] = (Math.random()*2-1)*0.3; }
    var src = audioCtx.createBufferSource();
    src.buffer = buffer;
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.18, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0+0.4);
    src.connect(gain).connect(audioCtx.destination);
    src.start(t0);
  }

  // ---------- Utilidades ----------
  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
  function shuffle(arr){
    for (var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function pickRandomTeams(n, excludeIds){
    var pool = TEAMS.filter(function(t){ return excludeIds.indexOf(t.id) === -1; });
    shuffle(pool);
    return pool.slice(0,n).map(function(t){ return t.id; });
  }
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
  function repeatStr(ch,n){ var s=''; for (var i=0;i<n;i++) s+=ch; return s; }
  function starsFor(team){
    var n = Math.max(1, Math.min(5, Math.round(team.strength/20)));
    return '<span class="stars-on">'+repeatStr('★',n)+'</span><span class="stars-off">'+repeatStr('☆',5-n)+'</span>';
  }
  // Escudo propio inspirado en los colores de cada seleccion (sin usar
  // banderas oficiales), reutilizando la misma forma de blason que Copa
  // Libertadores para mantener la identidad visual del sitio.
  function crestSVG(team){
    var clipId = 'munShieldClip-'+team.id;
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

  // ---------- Persistencia (config + estadisticas) ----------
  var SETTINGS_KEY = 'mundialPenaltySettings_v1';
  var STATS_KEY = 'mundialPenaltyStats_v1';
  function loadJSON(key, fallback){
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch(e){ return fallback; }
  }
  function saveJSON(key, obj){
    try { window.localStorage.setItem(key, JSON.stringify(obj)); } catch(e){ /* almacenamiento no disponible */ }
  }
  var settings = loadJSON(SETTINGS_KEY, {sound:true, difficulty:'normal'});
  if (!DIFF_SETTINGS[settings.difficulty]) settings.difficulty = 'normal';
  var stats = loadJSON(STATS_KEY, {
    mundialesJugados:0, mundialesGanados:0, partidosJugados:0,
    penalesPateados:0, penalesAnotados:0, penalesRecibidos:0, penalesAtajados:0,
    mejorResultadoRank:-1
  });
  function saveStats(){ saveJSON(STATS_KEY, stats); }
  function saveSettings(){ saveJSON(SETTINGS_KEY, settings); }

  var BEST_RESULT_LABELS = [
    'Fase de grupos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Subcampeón', 'Campeón del Mundo'
  ];
  var BEST_RESULT_RANK = {
    'eliminated-group':0, 'eliminated-octavos':1, 'eliminated-cuartos':2, 'eliminated-semifinal':3,
    'runner-up':4, 'champion':5
  };

  // ---------- Vista: menu ----------
  playMundialBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    mundialView.classList.remove('is-hidden');
    showSubView(menuView);
    ensureAudio();
  });
  backFromMundialBtn.addEventListener('click', function(){
    stopShootoutLoop();
    mundialView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
  });
  muteBtn.addEventListener('click', function(){
    settings.sound = !settings.sound;
    muteBtn.textContent = settings.sound ? '🔊' : '🔇';
    muteBtn.setAttribute('aria-label', settings.sound ? 'Silenciar sonido' : 'Activar sonido');
    saveSettings();
    syncConfigView();
  });

  munPlayBtn.addEventListener('click', function(){
    ensureAudio();
    pendingTeamId = null;
    confirmBar.classList.add('is-hidden');
    buildTeamGrid();
    showSubView(teamSelectView);
  });
  munTrainBtn.addEventListener('click', function(){
    ensureAudio();
    showSubView(trainingView);
  });
  munConfigBtn.addEventListener('click', function(){
    syncConfigView();
    showSubView(configView);
  });
  munStatsBtn.addEventListener('click', function(){
    renderStats();
    showSubView(statsView);
  });
  teamSelectBackBtn.addEventListener('click', function(){ showSubView(menuView); });
  trainingBackBtn.addEventListener('click', function(){ showSubView(menuView); });
  configBackBtn.addEventListener('click', function(){ showSubView(menuView); });
  statsBackBtn.addEventListener('click', function(){ showSubView(menuView); });

  // ---------- Vista: configuracion ----------
  function syncConfigView(){
    configSoundBtn.textContent = settings.sound ? '🔊 Activado' : '🔇 Desactivado';
    var chips = configDiffRow.querySelectorAll('.mun-diff-chip');
    for (var i=0;i<chips.length;i++){
      chips[i].classList.toggle('is-active', chips[i].getAttribute('data-diff') === settings.difficulty);
    }
  }
  configSoundBtn.addEventListener('click', function(){
    settings.sound = !settings.sound;
    muteBtn.textContent = settings.sound ? '🔊' : '🔇';
    saveSettings();
    syncConfigView();
  });
  var configDiffChips = configDiffRow.querySelectorAll('.mun-diff-chip');
  for (var cdi=0; cdi<configDiffChips.length; cdi++){
    configDiffChips[cdi].addEventListener('click', function(e){
      settings.difficulty = e.currentTarget.getAttribute('data-diff');
      saveSettings();
      syncConfigView();
    });
  }
  configResetBtn.addEventListener('click', function(){
    stats = {mundialesJugados:0, mundialesGanados:0, partidosJugados:0, penalesPateados:0, penalesAnotados:0, penalesRecibidos:0, penalesAtajados:0, mejorResultadoRank:-1};
    saveStats();
    campaign = null;
    renderStats();
    showSubView(menuView);
  });

  // ---------- Vista: estadisticas ----------
  function pct(made, total){ return total>0 ? Math.round(made/total*100)+'%' : '—'; }
  function renderStats(){
    var bestLabel = stats.mejorResultadoRank>=0 ? BEST_RESULT_LABELS[stats.mejorResultadoRank] : 'Todavía ninguno';
    var tiles = [
      {v: stats.mundialesJugados, l:'Mundiales jugados'},
      {v: stats.mundialesGanados, l:'Mundiales ganados'},
      {v: stats.partidosJugados, l:'Partidos jugados'},
      {v: pct(stats.penalesAnotados, stats.penalesPateados), l:'Puntería al patear ('+stats.penalesAnotados+'/'+stats.penalesPateados+')'},
      {v: pct(stats.penalesAtajados, stats.penalesRecibidos), l:'Atajadas ('+stats.penalesAtajados+'/'+stats.penalesRecibidos+')'},
      {v: bestLabel, l:'Mejor resultado'}
    ];
    statsGridEl.innerHTML = tiles.map(function(t){
      return '<div class="mun-stat-tile"><b>'+t.v+'</b><span>'+t.l+'</span></div>';
    }).join('');
  }

  // ---------- Seleccion de pais ----------
  var pendingTeamId = null;
  function buildTeamGrid(){
    teamGridEl.innerHTML = '';
    TEAMS.forEach(function(team){
      var btn = document.createElement('button');
      btn.className = 'team-pick-btn'+(team.id === pendingTeamId ? ' is-selected' : '');
      btn.innerHTML = '<span class="team-pick-check">✓</span>'+
        '<span class="team-crest">'+crestSVG(team)+'</span>'+
        '<span class="team-pick-name">'+team.name+'</span>'+
        '<span class="team-pick-stars">'+starsFor(team)+'</span>';
      btn.addEventListener('click', function(){
        ensureAudio();
        beep(880, 0.05, 'sine');
        pendingTeamId = team.id;
        var cards = teamGridEl.querySelectorAll('.team-pick-btn');
        for (var i=0;i<cards.length;i++){ cards[i].classList.remove('is-selected'); }
        btn.classList.add('is-selected');
        confirmCrestEl.innerHTML = crestSVG(team);
        confirmNameEl.textContent = team.name;
        confirmCountryEl.textContent = 'Nivel del plantel: '+Math.max(1, Math.min(5, Math.round(team.strength/20)))+'/5';
        confirmBar.classList.remove('is-hidden');
      });
      teamGridEl.appendChild(btn);
    });
  }
  confirmBtn.addEventListener('click', function(){
    if (!pendingTeamId) return;
    ensureAudio();
    startCampaign(pendingTeamId);
  });

  // ---------- Campaña (torneo) ----------
  var campaign = null;

  function makeStandingsMap(teamIds){
    var map = {};
    teamIds.forEach(function(id){ map[id] = {teamId:id, pts:0, gf:0, ga:0, played:0, won:0, lost:0}; });
    return map;
  }
  function applyResultTo(map, aId, bId, scoreA, scoreB){
    var sa = map[aId], sb = map[bId];
    sa.gf += scoreA; sa.ga += scoreB; sa.played += 1;
    sb.gf += scoreB; sb.ga += scoreA; sb.played += 1;
    if (scoreA > scoreB){ sa.pts += 3; sa.won += 1; sb.lost += 1; }
    else { sb.pts += 3; sb.won += 1; sa.lost += 1; }
  }
  function sortStandingsMap(map, teamIds){
    return teamIds.map(function(id){ return map[id]; }).slice().sort(function(a,b){
      if (b.pts !== a.pts) return b.pts-a.pts;
      var gdA = a.gf-a.ga, gdB = b.gf-b.ga;
      if (gdB !== gdA) return gdB-gdA;
      if (b.gf !== a.gf) return b.gf-a.gf;
      return TEAMS_BY_ID[b.teamId].strength - TEAMS_BY_ID[a.teamId].strength;
    });
  }

  // Probabilidad de convertir un penal segun la fuerza de la seleccion,
  // usada solo para simular al instante los partidos donde no jugas vos.
  function shotChance(strength){ return clamp(0.56 + (strength-70)/220, 0.35, 0.9); }
  function simulateShootoutScore(aId, bId){
    var pa = shotChance(TEAMS_BY_ID[aId].strength);
    var pb = shotChance(TEAMS_BY_ID[bId].strength);
    var a = 0, b = 0;
    for (var i=0;i<5;i++){
      if (Math.random() < pa) a++;
      if (Math.random() < pb) b++;
    }
    var guard = 0;
    while (a === b && guard < 30){
      var ga = Math.random() < pa ? 1 : 0;
      var gb = Math.random() < pb ? 1 : 0;
      a += ga; b += gb;
      guard++;
      if (ga !== gb) break;
    }
    return [a,b];
  }

  // Bombos por fuerza: un equipo de cada bombo para cada grupo, como en
  // un sorteo real de Mundial.
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

  // Fixture de 3 fechas para un grupo de 4 (round robin completo):
  // fecha1: 0v1,2v3 | fecha2: 0v2,1v3 | fecha3: 0v3,1v2
  function buildGroupRounds(group){
    return [
      [{a:group[0], b:group[1]}, {a:group[2], b:group[3]}],
      [{a:group[0], b:group[2]}, {a:group[1], b:group[3]}],
      [{a:group[0], b:group[3]}, {a:group[1], b:group[2]}]
    ];
  }

  function startCampaign(yourId){
    var others31 = pickRandomTeams(31, [yourId]);
    var pool32 = [yourId].concat(others31);
    var built = buildGroupsWithPots(pool32);

    var yourGroupIndex = 0;
    for (var gi=0; gi<8; gi++){
      if (built.groups[gi].indexOf(yourId) !== -1){ yourGroupIndex = gi; break; }
    }
    var rawGroup = built.groups[yourGroupIndex];
    var group = [yourId].concat(rawGroup.filter(function(id){ return id !== yourId; }));
    built.groups[yourGroupIndex] = group;

    var groupRounds = built.groups.map(function(g){ return buildGroupRounds(g); });
    var groupStandings = built.groups.map(function(g){ return makeStandingsMap(g); });

    campaign = {
      yourId: yourId, allGroups: built.groups, drawOrder: built.drawOrder,
      yourGroupIndex: yourGroupIndex, groupLetter: GROUP_LETTERS[yourGroupIndex],
      groupRounds: groupRounds, groupStandings: groupStandings, matchday: 0,
      stage: 'group', bracket: null, bracketRounds: [], playedMatches: 0
    };
    stats.mundialesJugados += 1;
    saveStats();
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
      slots.id = 'munDrawSlots'+g;
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
    var slotsEl = document.getElementById('munDrawSlots'+entry.groupIndex);
    var slot = slotsEl.children[entry.potIndex];
    slot.className = 'draw-slot is-filled'+(entry.teamId === campaign.yourId ? ' is-you' : '');
    slot.innerHTML = '<span class="team-badge draw-badge" style="background:'+team.shirt+';border-color:'+team.band+'"></span>'+
      '<span class="draw-slot-name">'+team.name+'</span>';
    drawStatusEl.textContent = 'Bombo '+(entry.potIndex+1)+' de 4 — '+team.name+' → Grupo '+GROUP_LETTERS[entry.groupIndex];
    if (entry.teamId === campaign.yourId) beep(700, 0.1, 'triangle'); else beep(420, 0.04, 'square');
  }
  function finishDrawAnimation(){
    if (drawTimer){ clearInterval(drawTimer); drawTimer = null; }
    drawContinueBtn.classList.remove('is-hidden');
    drawStatusEl.textContent = '¡Sorteo terminado! Quedaste en el Grupo '+campaign.groupLetter+'.';
    beep(900, 0.25, 'sine');
  }
  function startDrawAnimation(){
    showSubView(drawView);
    renderEmptyGroupBoxes();
    drawContinueBtn.classList.add('is-hidden');
    drawStatusEl.textContent = 'Sorteando selecciones...';
    drawStep = 0;
    if (drawTimer) clearInterval(drawTimer);
    drawTimer = setInterval(function(){
      if (drawStep >= campaign.drawOrder.length){ finishDrawAnimation(); return; }
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
    showHub();
  });

  // ---------- Fase de grupos ----------
  function yourGroup(){ return campaign.allGroups[campaign.yourGroupIndex]; }
  function yourStandingsSorted(){ return sortStandingsMap(campaign.groupStandings[campaign.yourGroupIndex], yourGroup()); }
  function findYourFixtureThisMatchday(){
    var round = campaign.groupRounds[campaign.yourGroupIndex][campaign.matchday];
    for (var i=0;i<round.length;i++){
      if (round[i].a === campaign.yourId) return {opponentId: round[i].b, match: round[i], youAreA:true};
      if (round[i].b === campaign.yourId) return {opponentId: round[i].a, match: round[i], youAreA:false};
    }
    return null;
  }
  function showHub(){
    campaign.stage = 'group';
    showSubView(hubView);
    hubGroupLetterEl.textContent = campaign.groupLetter;
    hubMatchdayEl.textContent = String(campaign.matchday+1);
    var sorted = yourStandingsSorted();
    hubTableBody.innerHTML = '';
    sorted.forEach(function(s, idx){
      var tr = document.createElement('tr');
      var cls = '';
      if (s.teamId === campaign.yourId) cls += 'is-you ';
      if (campaign.matchday >= 3 && idx < 2) cls += 'is-qualified';
      tr.className = cls.trim();
      var gd = s.gf-s.ga;
      tr.innerHTML = '<td>'+TEAMS_BY_ID[s.teamId].name+'</td><td>'+s.pts+'</td><td>'+(gd>0?'+':'')+gd+'</td>';
      hubTableBody.appendChild(tr);
    });
    var fixture = findYourFixtureThisMatchday();
    hubNextTextEl.textContent = 'Fecha '+(campaign.matchday+1)+' de 3 — Próximo rival: '+TEAMS_BY_ID[fixture.opponentId].name;
    renderHubFixtureList();
  }
  function renderHubFixtureList(){
    hubFixtureListEl.innerHTML = '';
    var rounds = campaign.groupRounds[campaign.yourGroupIndex];
    rounds.forEach(function(round, idx){
      var block = document.createElement('div');
      block.className = 'fixture-round';
      var title = document.createElement('div');
      title.className = 'fixture-round-title';
      title.textContent = 'Fecha '+(idx+1);
      block.appendChild(title);
      round.forEach(function(m){
        var line = document.createElement('div');
        var nameA = TEAMS_BY_ID[m.a].name, nameB = TEAMS_BY_ID[m.b].name;
        var involvesYou = m.a === campaign.yourId || m.b === campaign.yourId;
        if (idx < campaign.matchday){
          line.className = 'fixture-line is-done';
          var sc = m.score || [0,0];
          line.textContent = '✅ '+nameA+' '+sc[0]+'-'+sc[1]+' '+nameB;
        } else if (idx === campaign.matchday && involvesYou){
          line.className = 'fixture-line is-next';
          line.textContent = '▶ '+nameA+' vs '+nameB+' (Próximo partido)';
        } else {
          line.className = 'fixture-line is-pending';
          line.textContent = nameA+' vs '+nameB+' (Pendiente)';
        }
        block.appendChild(line);
      });
      hubFixtureListEl.appendChild(block);
    });
  }

  hubPlayBtn.addEventListener('click', function(){
    ensureAudio();
    var fixture = findYourFixtureThisMatchday();
    startShootout('tournament', {opponentId: fixture.opponentId});
  });

  // Simula todos los demas partidos de la fecha actual (en TODOS los
  // grupos), para que ningun equipo juegue una fecha antes que otro.
  function playAllOtherMatchesForMatchday(md){
    for (var g=0; g<8; g++){
      var round = campaign.groupRounds[g][md];
      round.forEach(function(m){
        if (m.a === campaign.yourId || m.b === campaign.yourId) return; // ya lo jugaste vos
        var score = simulateShootoutScore(m.a, m.b);
        applyResultTo(campaign.groupStandings[g], m.a, m.b, score[0], score[1]);
        m.score = score;
      });
    }
  }

  function finishGroupStageIfDone(){
    campaign.matchday += 1;
    if (campaign.matchday < 3){ showHub(); return; }
    // Fecha 3 terminada: calcular clasificados de los 8 grupos.
    campaign.groupQualifiers = [];
    for (var g=0; g<8; g++){
      var sorted = sortStandingsMap(campaign.groupStandings[g], campaign.allGroups[g]);
      campaign.groupQualifiers.push([sorted[0].teamId, sorted[1].teamId]);
    }
    var yourSorted = yourStandingsSorted();
    var yourIndex = -1;
    for (var i=0;i<yourSorted.length;i++){ if (yourSorted[i].teamId === campaign.yourId){ yourIndex = i; break; } }
    if (yourIndex < 2){
      campaign.stage = 'knockout';
      campaign.bracket = {roundName:'octavos', roundLabel:'Octavos de Final', matches: buildOctavosMatches()};
      showBracket();
    } else {
      endCampaign('eliminated-group');
    }
  }

  // Cruza el 1ro de cada grupo con el 2do de OTRO grupo (nunca el propio).
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
  function pairAdjacent(ids){
    var pairs = [];
    for (var i=0;i<ids.length;i+=2){ pairs.push({a: ids[i], b: ids[i+1]}); }
    return pairs;
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

  var NEXT_KNOCKOUT_ROUND = {octavos:'cuartos', cuartos:'semifinal', semifinal:'final'};
  var KNOCKOUT_ROUND_LABELS = {octavos:'Octavos de Final', cuartos:'Cuartos de Final', semifinal:'Semifinal', final:'Final'};

  function showBracket(){
    showSubView(bracketView);
    bracketTitleEl.textContent = campaign.bracket.roundLabel;
    bracketNextTextEl.textContent = 'Tu partido: vs '+TEAMS_BY_ID[yourBracketOpponent()].name;
    bracketPlayBtn.textContent = '▶ Jugar '+campaign.bracket.roundLabel.toLowerCase();
    renderBracketTree();
  }
  function renderBracketTree(){
    var rounds = ['octavos','cuartos','semifinal','final'];
    bracketTreeEl.innerHTML = '';
    rounds.forEach(function(roundName){
      var col = document.createElement('div');
      col.className = 'mun-bracket-round';
      var title = document.createElement('div');
      title.className = 'mun-bracket-round-title';
      title.textContent = KNOCKOUT_ROUND_LABELS[roundName];
      col.appendChild(title);

      var completed = campaign.bracketRounds.filter(function(r){ return r.roundName === roundName; })[0];
      var matches;
      if (completed){ matches = completed.matches; }
      else if (campaign.bracket.roundName === roundName){ matches = campaign.bracket.matches.map(function(m){ return {a:m.a, b:m.b, winner:null, score:null}; }); }
      else { matches = null; }

      if (!matches){
        var slotCount = roundName==='octavos'?8:roundName==='cuartos'?4:roundName==='semifinal'?2:1;
        for (var p=0;p<slotCount;p++){
          var box = document.createElement('div');
          box.className = 'mun-bracket-match';
          box.innerHTML = '<div class="mun-bracket-slot is-pending">?</div><div class="mun-bracket-slot is-pending">?</div>';
          col.appendChild(box);
        }
      } else {
        matches.forEach(function(m){
          var box = document.createElement('div');
          var isCurrent = !completed && campaign.stage==='knockout';
          box.className = 'mun-bracket-match'+(isCurrent && (m.a===campaign.yourId||m.b===campaign.yourId) ? ' is-current' : '');
          var slotA = slotHtml(m.a, m.winner, m.score, 0);
          var slotB = slotHtml(m.b, m.winner, m.score, 1);
          box.innerHTML = slotA+slotB;
          col.appendChild(box);
        });
      }
      bracketTreeEl.appendChild(col);
    });
  }
  function slotHtml(teamId, winnerId, score, sideIdx){
    var team = TEAMS_BY_ID[teamId];
    var cls = 'mun-bracket-slot';
    if (teamId === campaign.yourId) cls += ' is-you';
    if (winnerId && winnerId === teamId) cls += ' is-winner';
    var scoreTxt = (winnerId && score) ? '<span>'+score[sideIdx]+'</span>' : '';
    return '<div class="'+cls+'"><span>'+team.name+'</span>'+scoreTxt+'</div>';
  }

  bracketPlayBtn.addEventListener('click', function(){
    ensureAudio();
    startShootout('tournament', {opponentId: yourBracketOpponent()});
  });

  function resolveBracketRound(yourWon){
    var yourIdx = findYourMatchIndex(campaign.bracket.matches);
    var resolvedMatches = campaign.bracket.matches.map(function(m, i){
      if (i === yourIdx){
        var winner = yourWon ? campaign.yourId : (m.a===campaign.yourId?m.b:m.a);
        return {a:m.a, b:m.b, winner:winner, score:lastShootoutScoreFor(m.a,m.b)};
      }
      var score = simulateShootoutScore(m.a, m.b);
      var winner = score[0] > score[1] ? m.a : m.b;
      return {a:m.a, b:m.b, winner:winner, score:score};
    });
    campaign.bracketRounds.push({roundName: campaign.bracket.roundName, matches: resolvedMatches});

    if (!yourWon){
      endCampaign(campaign.bracket.roundName === 'final' ? 'runner-up' : 'eliminated-'+campaign.bracket.roundName);
      return;
    }
    if (campaign.bracket.roundName === 'final'){ endCampaign('champion'); return; }
    var nextRoundName = NEXT_KNOCKOUT_ROUND[campaign.bracket.roundName];
    var winners = resolvedMatches.map(function(m){ return m.winner; });
    campaign.bracket = {roundName: nextRoundName, roundLabel: KNOCKOUT_ROUND_LABELS[nextRoundName], matches: pairAdjacent(winners)};
    showBracket();
  }
  function lastShootoutScoreFor(aId, bId){
    var homeId = shootout.homeId, awayId = shootout.awayId;
    if (aId === homeId && bId === awayId) return [shootout.homeScore, shootout.awayScore];
    return [shootout.awayScore, shootout.homeScore];
  }

  // ---------- Fin de campaña ----------
  function endCampaign(resultType){
    var rank = BEST_RESULT_RANK[resultType];
    if (rank !== undefined && rank > stats.mejorResultadoRank) stats.mejorResultadoRank = rank;
    if (resultType === 'champion') stats.mundialesGanados += 1;
    saveStats();

    var isChampion = resultType === 'champion';
    trophyIconEl.textContent = isChampion ? '🏆' : '🏁';
    championTitleEl.textContent = isChampion ? '¡CAMPEÓN DEL MUNDO!' : 'Fin de tu Mundial';
    var descMap = {
      champion: 'levantó la copa con',
      'runner-up': 'quedó subcampeón con',
      'eliminated-semifinal': 'quedó eliminado en semifinales con',
      'eliminated-cuartos': 'quedó eliminado en cuartos de final con',
      'eliminated-octavos': 'quedó eliminado en octavos de final con',
      'eliminated-group': 'quedó eliminado en la fase de grupos con'
    };
    championTeamEl.textContent = (descMap[resultType]||'jugó el Mundial con')+' '+TEAMS_BY_ID[campaign.yourId].name;
    confettiEl.innerHTML = '';
    if (isChampion && !reducedMotion) spawnConfetti();
    showSubView(ceremonyView);
    beep(isChampion?880:220, isChampion?0.5:0.3, isChampion?'triangle':'sine');
  }
  function spawnConfetti(){
    var colors = ['#ffd23f','#ff7a45','#3fddc4','#ff4fa3','#ffffff'];
    for (var i=0;i<60;i++){
      var piece = document.createElement('span');
      piece.className = 'mun-confetti-piece';
      piece.style.left = (Math.random()*100)+'%';
      piece.style.background = colors[i%colors.length];
      piece.style.animationDuration = (1.6+Math.random()*1.6)+'s';
      piece.style.animationDelay = (Math.random()*1.2)+'s';
      confettiEl.appendChild(piece);
    }
  }
  ceremonyContinueBtn.addEventListener('click', function(){
    campaign = null;
    showSubView(menuView);
  });

  // =====================================================================
  // Motor de la tanda de penales (interactivo)
  // =====================================================================
  var ZONES_DIR = ['left','center','right'];
  var ZONES_HEIGHT = ['high','low'];
  function randomZone(){
    return {dir: ZONES_DIR[Math.floor(Math.random()*3)], height: ZONES_HEIGHT[Math.floor(Math.random()*2)]};
  }
  function keeperSkillOf(teamId){ return clamp((TEAMS_BY_ID[teamId].strength-55)/40, 0, 1); }
  function saveChance(power, zoneMatch, keeperSkill){
    if (!zoneMatch) return 0.05 + keeperSkill*0.05;
    var base = 0.85 - power*0.65;
    return clamp(base + (keeperSkill-0.5)*0.18, 0.05, 0.95);
  }
  function aiChooseShot(shooterTeamId){
    var dirRoll = Math.random();
    var dir = dirRoll < 0.42 ? 'left' : dirRoll < 0.84 ? 'right' : 'center';
    var height = Math.random() < 0.62 ? 'high' : 'low';
    var strength = TEAMS_BY_ID[shooterTeamId].strength;
    var powerBias = clamp(0.35 + (strength-70)/220, 0.15, 0.75);
    var power = clamp(powerBias + (Math.random()-0.5)*0.5, 0.05, 1);
    return {dir:dir, height:height, power:power};
  }
  function aiChooseDive(shooterZone, keeperTeamId){
    var d = DIFF_SETTINGS[settings.difficulty];
    var skill = keeperSkillOf(keeperTeamId);
    var readChance = clamp(d.keeperReadBase + skill*d.keeperReadScale, 0, 0.85);
    if (Math.random() < readChance) return {dir:shooterZone.dir, height:shooterZone.height};
    return randomZone();
  }

  var shootout = {
    mode: 'tournament', // 'tournament' | 'trainKick' | 'trainSave'
    homeId: null, awayId: null,
    homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0,
    nextKicker: 'home', suddenDeath: false,
    phase: 'idle', // idle|selecting|charging|anim|roundEnd|over
    selDir: null, selHeight: null,
    pendingAiShot: null,
    trainAttempts: 0, trainSuccess: 0,
    finished: false
  };
  var TRAIN_RIVAL = {id:'rival', name:'Selección Rival', strength:70, shirt:'#8a8a8a', band:'#3a3a3a', shorts:'#3a3a3a', pattern:'solid'};

  function resetShootout(){
    shootout.homeScore = 0; shootout.awayScore = 0; shootout.homeKicks = 0; shootout.awayKicks = 0;
    shootout.suddenDeath = false; shootout.phase = 'idle';
    shootout.selDir = null; shootout.selHeight = null; shootout.pendingAiShot = null;
    shootout.trainAttempts = 0; shootout.trainSuccess = 0; shootout.finished = false;
    pensHomeEl.innerHTML = ''; pensAwayEl.innerHTML = '';
    updateMatchScoreDisplay();
  }

  function startShootout(mode, opts){
    shootout.mode = mode;
    resetShootout();
    matchBackBtn.classList.toggle('is-hidden', mode === 'tournament');
    if (mode === 'tournament'){
      shootout.homeId = campaign.yourId;
      shootout.awayId = opts.opponentId;
    } else if (mode === 'trainKick'){
      shootout.homeId = (campaign && campaign.yourId) || TEAMS[0].id;
      shootout.awayId = TRAIN_RIVAL.id;
      TEAMS_BY_ID.rival = TRAIN_RIVAL;
    } else {
      shootout.homeId = (campaign && campaign.yourId) || TEAMS[0].id;
      shootout.awayId = TRAIN_RIVAL.id;
      TEAMS_BY_ID.rival = TRAIN_RIVAL;
    }
    var home = TEAMS_BY_ID[shootout.homeId], away = TEAMS_BY_ID[shootout.awayId];
    matchHomeCrestEl.innerHTML = crestSVG(home);
    matchAwayCrestEl.innerHTML = crestSVG(away);
    matchHomeNameEl.textContent = home.name;
    matchAwayNameEl.textContent = away.name;
    scoreboardEl.classList.toggle('is-hidden', mode !== 'tournament');
    if (mode === 'tournament'){
      startTitleEl.textContent = '¿Listo para la tanda vs '+away.name+'?';
    } else if (mode === 'trainKick'){
      startTitleEl.textContent = 'Entrenamiento: practicá tus remates';
    } else {
      startTitleEl.textContent = 'Entrenamiento: practicá tus atajadas';
    }
    showSubView(matchView);
    startOverlay.classList.remove('is-hidden');
    shootoutOverOverlay.classList.add('is-hidden');
    resetControlsUI();
    resetKeeperAndBall();
    drawStadium();
  }
  matchBackBtn.addEventListener('click', function(){
    stopShootoutLoop();
    showSubView(trainingView);
  });

  startBtn.addEventListener('click', function(){
    ensureAudio();
    crowdNoise();
    startOverlay.classList.add('is-hidden');
    if (shootout.mode === 'tournament'){
      shootout.nextKicker = Math.random() < 0.5 ? 'home' : 'away';
    } else if (shootout.mode === 'trainKick'){
      shootout.nextKicker = 'home';
    } else {
      shootout.nextKicker = 'away';
    }
    nextTurn();
  });

  function isSolo(){ return shootout.mode !== 'tournament'; }
  function userIsKickingNow(){
    if (shootout.mode === 'trainKick') return true;
    if (shootout.mode === 'trainSave') return false;
    return shootout.nextKicker === 'home';
  }

  function updateMatchScoreDisplay(){
    if (isSolo()){
      matchScoreEl.textContent = shootout.mode==='trainKick'
        ? ('Aciertos: '+shootout.trainSuccess+'/'+shootout.trainAttempts)
        : ('Atajadas: '+shootout.trainSuccess+'/'+shootout.trainAttempts);
      return;
    }
    matchScoreEl.textContent = shootout.homeScore+' - '+shootout.awayScore;
  }
  function renderPenDots(){
    if (isSolo()) return;
    function dotsFor(count, made){
      var html = '';
      for (var i=0;i<5;i++){
        if (i < made.length) html += '<span class="mun-pen-dot '+(made[i]?'is-made':'is-missed')+'"></span>';
        else html += '<span class="mun-pen-dot"></span>';
      }
      return html;
    }
    pensHomeEl.innerHTML = dotsFor(5, homeMadeLog);
    pensAwayEl.innerHTML = dotsFor(5, awayMadeLog);
  }
  var homeMadeLog = [], awayMadeLog = [];

  function nextTurn(){
    if (!mundialActive()) return;
    resetControlsUI();
    shootout.selDir = null; shootout.selHeight = null;
    var kicking = userIsKickingNow();
    if (isSolo()){
      turnBannerEl.textContent = shootout.mode==='trainKick' ? 'Elegí tu remate' : 'Atajá el remate de la IA';
    } else {
      turnBannerEl.textContent = kicking ? 'Pateás vos' : 'Atajá el remate rival';
    }
    if (kicking){
      powerGroup.classList.remove('is-hidden');
      actionBtn.textContent = '⚽ Patear';
      shootout.pendingAiShot = null;
    } else {
      powerGroup.classList.add('is-hidden');
      actionBtn.textContent = '🧤 Atajar';
      var shooterId = shootout.nextKicker === 'home' ? shootout.homeId : shootout.awayId;
      if (isSolo()) shooterId = shootout.awayId;
      shootout.pendingAiShot = aiChooseShot(shooterId);
    }
    shootout.phase = 'selecting';
    updateActionEnabled();
    resetKeeperAndBall();
    drawStadium();
  }

  function resetControlsUI(){
    var dirBtns = dirRow.querySelectorAll('.mun-pick-btn');
    for (var i=0;i<dirBtns.length;i++) dirBtns[i].classList.remove('is-selected');
    var hBtns = heightRow.querySelectorAll('.mun-pick-btn');
    for (var j=0;j<hBtns.length;j++) hBtns[j].classList.remove('is-selected');
    stopPowerCharge();
    powerValue = 0;
    powerFillEl.style.width = '0%';
    actionBtn.disabled = true;
  }
  function updateActionEnabled(){
    actionBtn.disabled = !(shootout.selDir && shootout.selHeight);
  }
  var dirBtnEls = dirRow.querySelectorAll('.mun-pick-btn');
  for (var dbi=0; dbi<dirBtnEls.length; dbi++){
    dirBtnEls[dbi].addEventListener('click', function(e){
      if (shootout.phase !== 'selecting') return;
      shootout.selDir = e.currentTarget.getAttribute('data-dir');
      var els = dirRow.querySelectorAll('.mun-pick-btn');
      for (var i=0;i<els.length;i++) els[i].classList.remove('is-selected');
      e.currentTarget.classList.add('is-selected');
      beep(500,0.04,'square');
      updateActionEnabled();
    });
  }
  var heightBtnEls = heightRow.querySelectorAll('.mun-pick-btn');
  for (var hbi=0; hbi<heightBtnEls.length; hbi++){
    heightBtnEls[hbi].addEventListener('click', function(e){
      if (shootout.phase !== 'selecting') return;
      shootout.selHeight = e.currentTarget.getAttribute('data-height');
      var els = heightRow.querySelectorAll('.mun-pick-btn');
      for (var i=0;i<els.length;i++) els[i].classList.remove('is-selected');
      e.currentTarget.classList.add('is-selected');
      beep(500,0.04,'square');
      updateActionEnabled();
    });
  }

  // ---------- Barra de potencia (carga y suelta) ----------
  var powerRafId = null;
  var powerStartTs = null;
  var powerValue = 0;
  var powerCharging = false;
  function powerLoop(ts){
    if (!powerCharging) return;
    if (powerStartTs === null) powerStartTs = ts;
    var t = (ts-powerStartTs)/1000;
    var wave = (Math.sin(t*3.4)+1)/2; // 0..1 oscilante
    powerValue = wave;
    powerFillEl.style.width = (wave*100).toFixed(0)+'%';
    powerRafId = requestAnimationFrame(powerLoop);
  }
  function startPowerCharge(){
    if (reducedMotion){ powerValue = 0.6; powerFillEl.style.width = '60%'; return; }
    powerCharging = true;
    powerStartTs = null;
    powerRafId = requestAnimationFrame(powerLoop);
  }
  function stopPowerCharge(){
    powerCharging = false;
    if (powerRafId) cancelAnimationFrame(powerRafId);
    powerRafId = null;
  }

  actionBtn.addEventListener('click', function(){
    if (shootout.phase !== 'selecting' || actionBtn.disabled) return;
    ensureAudio();
    var kicking = userIsKickingNow();
    if (kicking){
      if (!powerCharging && powerValue === 0 && !reducedMotion){
        // primer click: arranca la carga de potencia en vez de patear
        startPowerCharge();
        actionBtn.textContent = '⚽ ¡Ahora! (toca de nuevo)';
        return;
      }
      stopPowerCharge();
      resolveUserKick(shootout.selDir, shootout.selHeight, powerValue || 0.6);
    } else {
      resolveUserSave(shootout.selDir, shootout.selHeight);
    }
  });

  function resolveUserKick(dir, height, power){
    shootout.phase = 'anim';
    var shooterId = shootout.nextKicker === 'home' ? shootout.homeId : shootout.awayId;
    if (isSolo()) shooterId = shootout.homeId;
    var keeperId = isSolo() ? shootout.awayId : (shootout.nextKicker==='home'?shootout.awayId:shootout.homeId);
    var dive = aiChooseDive({dir:dir, height:height}, keeperId);
    var zoneMatch = dive.dir === dir && dive.height === height;
    var skill = keeperSkillOf(keeperId);
    var sChance = saveChance(power, zoneMatch, skill);
    var saved = Math.random() < sChance;
    if (shootout.mode === 'tournament'){
      stats.penalesPateados += 1;
      if (!saved) stats.penalesAnotados += 1;
      saveJSON(STATS_KEY, stats);
    }
    animateKick(dir, height, power, dive, !saved, function(){
      onShotResolved(!saved);
    });
  }
  function resolveUserSave(dir, height){
    shootout.phase = 'anim';
    var shot = shootout.pendingAiShot;
    var keeperId = isSolo() ? shootout.homeId : (shootout.nextKicker==='home'?shootout.awayId:shootout.homeId);
    var zoneMatch = dir === shot.dir && height === shot.height;
    var skill = keeperSkillOf(keeperId);
    var sChance = saveChance(shot.power, zoneMatch, skill);
    var saved = Math.random() < sChance;
    if (shootout.mode !== 'trainKick'){
      stats.penalesRecibidos += (shootout.mode==='tournament'?1:0);
      if (shootout.mode==='tournament' && saved) stats.penalesAtajados += 1;
      saveJSON(STATS_KEY, stats);
    }
    animateKick(shot.dir, shot.height, shot.power, {dir:dir, height:height}, !saved, function(){
      onShotResolved(!saved);
    });
  }

  function onShotResolved(goal){
    beep(goal?880:180, goal?0.3:0.22, goal?'triangle':'sawtooth');
    if (isSolo()){
      shootout.trainAttempts += 1;
      if ((shootout.mode==='trainKick' && goal) || (shootout.mode==='trainSave' && !goal)) shootout.trainSuccess += 1;
      updateMatchScoreDisplay();
      shootout.phase = 'roundEnd';
      setTimeout(function(){
        if (!mundialActive()) return;
        nextTurn();
      }, 900);
      return;
    }
    var kicker = shootout.nextKicker;
    if (kicker === 'home'){
      shootout.homeKicks += 1;
      if (goal) shootout.homeScore += 1;
      homeMadeLog.push(goal);
    } else {
      shootout.awayKicks += 1;
      if (goal) shootout.awayScore += 1;
      awayMadeLog.push(goal);
    }
    updateMatchScoreDisplay();
    renderPenDots();

    var decided = checkShootoutDecided();
    shootout.phase = 'roundEnd';
    setTimeout(function(){
      if (!mundialActive()) return;
      if (decided){ finishShootout(decided); return; }
      shootout.nextKicker = kicker === 'home' ? 'away' : 'home';
      nextTurn();
    }, 900);
  }

  function checkShootoutDecided(){
    if (!shootout.suddenDeath){
      var remHome = 5 - shootout.homeKicks, remAway = 5 - shootout.awayKicks;
      if (shootout.homeScore > shootout.awayScore + remAway) return 'home';
      if (shootout.awayScore > shootout.homeScore + remHome) return 'away';
      if (shootout.homeKicks >= 5 && shootout.awayKicks >= 5){
        if (shootout.homeScore !== shootout.awayScore) return shootout.homeScore > shootout.awayScore ? 'home' : 'away';
        shootout.suddenDeath = true;
      }
      return null;
    }
    // Muerte subita: ambos deben haber pateado la misma cantidad de tiros
    // extra para poder comparar (si no, todavia puede empatar de nuevo).
    var extraHome = shootout.homeKicks - 5, extraAway = shootout.awayKicks - 5;
    if (extraHome === extraAway && extraHome > 0){
      if (shootout.homeScore !== shootout.awayScore) return shootout.homeScore > shootout.awayScore ? 'home' : 'away';
    }
    return null;
  }

  function finishShootout(winnerSide){
    shootout.finished = true;
    shootout.phase = 'over';
    if (shootout.mode === 'tournament') stats.partidosJugados += 1;
    saveJSON(STATS_KEY, stats);
    var youWon = winnerSide === 'home';
    shootoutOverTitleEl.textContent = youWon ? '¡Ganaste la tanda!' : 'Perdiste la tanda';
    shootoutOverScoreEl.textContent = shootout.homeScore+' - '+shootout.awayScore;
    shootoutOverOverlay.classList.remove('is-hidden');
    var self = shootoutContinueBtn;
    self.onclick = function(){
      shootoutOverOverlay.classList.add('is-hidden');
      handlePostTournamentMatch(youWon);
    };
  }
  function handlePostTournamentMatch(youWon){
    if (campaign.stage === 'group'){
      var fixture = findYourFixtureThisMatchday();
      var homeScore = shootout.homeScore, awayScore = shootout.awayScore;
      applyResultTo(campaign.groupStandings[campaign.yourGroupIndex], campaign.yourId, fixture.opponentId, homeScore, awayScore);
      fixture.match.score = fixture.youAreA ? [homeScore, awayScore] : [awayScore, homeScore];
      playAllOtherMatchesForMatchday(campaign.matchday);
      finishGroupStageIfDone();
    } else {
      resolveBracketRound(youWon);
    }
  }

  // ---------- Modo entrenamiento ----------
  trainKickBtn.addEventListener('click', function(){ ensureAudio(); startShootout('trainKick', {}); });
  trainSaveBtn.addEventListener('click', function(){ ensureAudio(); startShootout('trainSave', {}); });

  function stopShootoutLoop(){
    stopPowerCharge();
    powerValue = 0;
  }

  // =====================================================================
  // Render: estadio, arquero y pelota
  // =====================================================================
  var GOAL_CX = CANVAS_W/2, GOAL_TOP = 150, GOAL_BOTTOM = 300, GOAL_HALF_W = 190;
  var SPOT = {x:GOAL_CX, y:410};
  var ZONE_POINTS = {
    left:  {high:{x:GOAL_CX-130, y:GOAL_TOP+20}, low:{x:GOAL_CX-130, y:GOAL_BOTTOM-18}},
    center:{high:{x:GOAL_CX,     y:GOAL_TOP+16}, low:{x:GOAL_CX,     y:GOAL_BOTTOM-14}},
    right: {high:{x:GOAL_CX+130, y:GOAL_TOP+20}, low:{x:GOAL_CX+130, y:GOAL_BOTTOM-18}}
  };
  var keeperPos = {x:GOAL_CX, y:GOAL_TOP+80};
  var keeperTarget = {x:GOAL_CX, y:GOAL_TOP+80};
  var keeperRot = 0;
  var ballPos = {x:SPOT.x, y:SPOT.y};
  var animT = 0, animDur = 0.55, animLastTs = null, animActive = false;
  var animShotTarget = null, animKeeperDive = null, animGoal = true, animCallback = null;

  function resetKeeperAndBall(){
    keeperPos.x = GOAL_CX; keeperPos.y = GOAL_TOP+80; keeperTarget.x = GOAL_CX; keeperTarget.y = GOAL_TOP+80; keeperRot = 0;
    ballPos.x = SPOT.x; ballPos.y = SPOT.y;
    animActive = false;
  }
  function animateKick(dir, height, power, diveZone, goal, cb){
    animShotTarget = ZONE_POINTS[dir][height];
    animKeeperDive = ZONE_POINTS[diveZone.dir][diveZone.height];
    animGoal = goal;
    animCallback = cb;
    animT = 0; animLastTs = null; animActive = true;
    animDur = 0.85 - power*0.25;
    if (reducedMotion){
      ballPos.x = goal ? animShotTarget.x : (animKeeperDive.x*0.6+animShotTarget.x*0.4);
      ballPos.y = goal ? animShotTarget.y : (animKeeperDive.y*0.6+animShotTarget.y*0.4);
      keeperPos.x = animKeeperDive.x; keeperPos.y = animKeeperDive.y;
      animActive = false;
      cb();
      return;
    }
    requestAnimationFrame(animLoop);
  }
  function animLoop(ts){
    if (!animActive) return;
    if (!mundialActive()){ animActive = false; return; }
    if (animLastTs === null) animLastTs = ts;
    var dt = Math.min(0.05, (ts-animLastTs)/1000);
    animLastTs = ts;
    animT = Math.min(1, animT + dt/animDur);
    var ease = 1-Math.pow(1-animT,2);
    var endX = animGoal ? animShotTarget.x : (animKeeperDive.x*0.7+animShotTarget.x*0.3);
    var endY = animGoal ? animShotTarget.y : (animKeeperDive.y*0.7+animShotTarget.y*0.3);
    ballPos.x = SPOT.x + (endX-SPOT.x)*ease;
    ballPos.y = SPOT.y + (endY-SPOT.y)*ease - Math.sin(ease*Math.PI)*26;
    var diveE = Math.min(1, animT/0.7);
    var diveEase = 1-Math.pow(1-diveE,2);
    keeperPos.x = GOAL_CX + (animKeeperDive.x-GOAL_CX)*diveEase;
    keeperPos.y = (GOAL_TOP+80) + (animKeeperDive.y-(GOAL_TOP+80))*diveEase;
    var dirSign = animKeeperDive.x >= GOAL_CX ? 1 : -1;
    keeperRot = dirSign*diveEase*(Math.PI/2.4);
    drawStadium();
    if (animT >= 1){
      animActive = false;
      var cb = animCallback;
      animCallback = null;
      if (cb) cb();
      return;
    }
    requestAnimationFrame(animLoop);
  }

  function drawCrowdBand(y0, y1){
    var c = ctx;
    var colors = ['#ff7a45','#3fddc4','#ff4fa3','#ffd23f','#c9b8e8','#ffffff'];
    for (var x=6; x<CANVAS_W-6; x+=9){
      var seed = (x*17)%colors.length;
      c.fillStyle = colors[seed];
      var bob = reducedMotion ? 0 : Math.sin((x*0.13)+(performance.now()/260))*1.6;
      c.fillRect(x, y0+bob, 6, y1-y0);
    }
  }
  function drawStadium(){
    var c = ctx;
    c.clearRect(0,0,CANVAS_W,CANVAS_H);
    // cielo + reflectores
    var sky = c.createLinearGradient(0,0,0,120);
    sky.addColorStop(0,'#1b1340'); sky.addColorStop(1,'#123322');
    c.fillStyle = sky; c.fillRect(0,0,CANVAS_W,120);
    [110, CANVAS_W-110].forEach(function(lx){
      var glow = c.createRadialGradient(lx,18,4,lx,18,90);
      glow.addColorStop(0,'rgba(255,255,240,0.85)');
      glow.addColorStop(1,'rgba(255,255,240,0)');
      c.fillStyle = glow; c.beginPath(); c.arc(lx,18,90,0,Math.PI*2); c.fill();
    });
    // tribuna
    drawCrowdBand(22, 56);
    c.fillStyle = '#241a3a'; c.fillRect(0,56,CANVAS_W,14);
    // cancha
    var pitch = c.createLinearGradient(0,70,0,CANVAS_H);
    pitch.addColorStop(0,'#0d6b34'); pitch.addColorStop(1,'#0a4d26');
    c.fillStyle = pitch; c.fillRect(0,70,CANVAS_W,CANVAS_H-70);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    c.strokeRect(60,90,CANVAS_W-120,CANVAS_H-140);
    c.beginPath(); c.moveTo(GOAL_CX-260,90); c.lineTo(GOAL_CX-260,CANVAS_H-50);
    c.moveTo(GOAL_CX+260,90); c.lineTo(GOAL_CX+260,CANVAS_H-50); c.stroke();
    c.beginPath(); c.arc(SPOT.x, SPOT.y+6, 74, Math.PI*1.12, Math.PI*1.88); c.stroke();
    // arco
    var postL = GOAL_CX-GOAL_HALF_W, postR = GOAL_CX+GOAL_HALF_W;
    c.strokeStyle = '#f4f4f4'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(postL, GOAL_BOTTOM+30); c.lineTo(postL, GOAL_TOP);
    c.lineTo(postR, GOAL_TOP); c.lineTo(postR, GOAL_BOTTOM+30);
    c.stroke();
    // red
    c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 1;
    for (var gx=postL; gx<=postR; gx+=18){ c.beginPath(); c.moveTo(gx,GOAL_TOP); c.lineTo(gx,GOAL_BOTTOM+26); c.stroke(); }
    for (var gy=GOAL_TOP; gy<=GOAL_BOTTOM+26; gy+=16){ c.beginPath(); c.moveTo(postL,gy); c.lineTo(postR,gy); c.stroke(); }
    // punto penal
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(SPOT.x, SPOT.y, 3.5, 0, Math.PI*2); c.fill();

    drawKeeper();
    drawBall();

    // reticula de zona seleccionada (ayuda visual mientras apuntas)
    if (shootout.phase === 'selecting' && userIsKickingNow() && shootout.selDir && shootout.selHeight){
      var z = ZONE_POINTS[shootout.selDir][shootout.selHeight];
      c.strokeStyle = 'rgba(255,210,63,0.9)'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(z.x, z.y, 20, 0, Math.PI*2); c.stroke();
    }
  }
  function drawKeeper(){
    var c = ctx;
    var keeperId = isSolo() ? (shootout.mode==='trainKick'?shootout.awayId:shootout.homeId)
      : (shootout.nextKicker==='home' ? shootout.awayId : shootout.homeId);
    var team = TEAMS_BY_ID[keeperId] || TRAIN_RIVAL;
    c.save();
    c.translate(keeperPos.x, keeperPos.y);
    c.rotate(keeperRot);
    c.fillStyle = team.shirt;
    c.fillRect(-11,-8,22,26);
    c.fillStyle = team.band;
    c.fillRect(-11,-8,22,6);
    c.fillStyle = '#f0c090';
    c.beginPath(); c.arc(0,-16,8,0,Math.PI*2); c.fill();
    c.fillStyle = team.shirt;
    c.fillRect(-19,-6,8,20);
    c.fillRect(11,-6,8,20);
    c.fillStyle = '#111';
    c.fillRect(-9,18,7,10);
    c.fillRect(2,18,7,10);
    c.restore();
  }
  function drawBall(){
    var c = ctx;
    c.save();
    c.translate(ballPos.x, ballPos.y);
    var r = 9;
    c.fillStyle = '#0006'; c.beginPath(); c.ellipse(0, r+2, r*0.8, r*0.28, 0,0,Math.PI*2); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-r,0); c.lineTo(r,0); c.stroke();
    c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.stroke();
    c.beginPath(); c.arc(0,0,3.2,0,Math.PI*2); c.fillStyle='#222'; c.fill();
    c.restore();
  }

  // Loop de dibujo constante mientras la vista este activa, para que el
  // cesped/tribuna respiren aunque no haya animacion de tiro en curso.
  var idleRafId = null;
  function idleDrawLoop(){
    if (mundialActive() && !matchView.classList.contains('is-hidden') && !animActive){
      drawStadium();
    }
    idleRafId = requestAnimationFrame(idleDrawLoop);
  }
  if (!reducedMotion) idleRafId = requestAnimationFrame(idleDrawLoop);
  else drawStadium();

})();
