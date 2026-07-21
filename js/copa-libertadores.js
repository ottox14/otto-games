// Copa Libertadores: minijuego estilo "cabezones" (miniball/head-soccer).
// Elegis tu equipo y la dificultad, y jugas una fase de grupos (3 partidos)
// seguida de semifinal y final si clasificas. Fisica simple de gravedad +
// rebotes, patada con rango.
(function(){
  var CANVAS_W = 920, CANVAS_H = 480;
  var GROUND_Y = 400;
  var GOAL_H = 130;
  var GOAL_DEPTH = 26;
  var PLAYER_R = 34;
  var LEG_LENGTH = 40;
  var FOOT_R = 15;
  var BALL_R = 14;
  var GRAVITY = 1500;
  var JUMP_VY = -580;
  var MOVE_SPEED = 250;
  var KICK_RANGE = 70;
  var KICK_COOLDOWN = 0.35;
  var MATCH_SECONDS = 90;

  var TEAMS = [
    {id:'lanus', name:'Lanús', country:'Argentina', shirt:'#7a1f3d', band:'#111111', shorts:'#111111', pattern:'solid'},
    {id:'platense', name:'Platense', country:'Argentina', shirt:'#e3cf9c', band:'#1a1a1a', shorts:'#1a1a1a', pattern:'stripes'},
    {id:'estudiantes', name:'Estudiantes de La Plata', country:'Argentina', shirt:'#c8102e', band:'#ffffff', shorts:'#ffffff', pattern:'sash'},
    {id:'independiente_rivadavia', name:'Independiente Rivadavia', country:'Argentina', shirt:'#c8102e', band:'#ffffff', shorts:'#c8102e', pattern:'stripes'},
    {id:'rosario_central', name:'Rosario Central', country:'Argentina', shirt:'#1c3f94', band:'#ffd400', shorts:'#000000', pattern:'sash'},
    {id:'boca', name:'Boca Juniors', country:'Argentina', shirt:'#0b3f8f', band:'#ffd400', shorts:'#0b3f8f', pattern:'band'},
    {id:'argentinos', name:'Argentinos Juniors', country:'Argentina', shirt:'#ffffff', band:'#e2001a', shorts:'#e2001a', pattern:'halves'},
    {id:'river', name:'River Plate', country:'Argentina', shirt:'#ffffff', band:'#d61f3c', shorts:'#0b1a3a', pattern:'sash'},

    {id:'always_ready', name:'Always Ready', country:'Bolivia', shirt:'#f5f5f5', band:'#111111', shorts:'#111111', pattern:'band'},
    {id:'bolivar', name:'Bolívar', country:'Bolivia', shirt:'#4fb8e6', band:'#ffffff', shorts:'#4fb8e6', pattern:'band'},
    {id:'the_strongest', name:'The Strongest', country:'Bolivia', shirt:'#ffd400', band:'#111111', shorts:'#111111', pattern:'stripes'},
    {id:'nacional_potosi', name:'Nacional Potosí', country:'Bolivia', shirt:'#1c7a3c', band:'#ffffff', shorts:'#1c7a3c', pattern:'band'},

    {id:'flamengo', name:'Flamengo', country:'Brasil', shirt:'#e2001a', band:'#111111', shorts:'#111111', pattern:'stripes'},
    {id:'corinthians', name:'Corinthians', country:'Brasil', shirt:'#ffffff', band:'#111111', shorts:'#111111', pattern:'solid'},
    {id:'palmeiras', name:'Palmeiras', country:'Brasil', shirt:'#0a6c34', band:'#ffffff', shorts:'#ffffff', pattern:'solid'},
    {id:'cruzeiro', name:'Cruzeiro', country:'Brasil', shirt:'#0033a0', band:'#ffffff', shorts:'#ffffff', pattern:'solid'},
    {id:'mirassol', name:'Mirassol', country:'Brasil', shirt:'#ffd400', band:'#0a6c34', shorts:'#0a6c34', pattern:'band'},
    {id:'fluminense', name:'Fluminense', country:'Brasil', shirt:'#7a1f3d', band:'#0a6c34', shorts:'#ffffff', pattern:'stripes'},
    {id:'botafogo', name:'Botafogo', country:'Brasil', shirt:'#111111', band:'#ffffff', shorts:'#ffffff', pattern:'stripes'},
    {id:'bahia', name:'Bahía', country:'Brasil', shirt:'#0033a0', band:'#e2001a', shorts:'#ffffff', pattern:'stripes'},

    {id:'coquimbo', name:'Coquimbo Unido', country:'Chile', shirt:'#5b2a86', band:'#111111', shorts:'#111111', pattern:'halves'},
    {id:'ohiggins', name:"O'Higgins", country:'Chile', shirt:'#0a6c34', band:'#ffffff', shorts:'#0a6c34', pattern:'band'},
    {id:'huachipato', name:'Huachipato', country:'Chile', shirt:'#111111', band:'#ffffff', shorts:'#111111', pattern:'stripes'},

    {id:'tolima', name:'Deportes Tolima', country:'Colombia', shirt:'#7a1f3d', band:'#ffd400', shorts:'#7a1f3d', pattern:'band'},
    {id:'santa_fe', name:'Independiente Santa Fe', country:'Colombia', shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'solid'},
    {id:'junior', name:'Junior de Barranquilla', country:'Colombia', shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'stripes'},
    {id:'medellin', name:'Independiente Medellín', country:'Colombia', shirt:'#c8102e', band:'#111111', shorts:'#111111', pattern:'solid'},

    {id:'liga_de_quito', name:'Liga de Quito', country:'Ecuador', shirt:'#ffffff', band:'#0033a0', shorts:'#0033a0', pattern:'band'},
    {id:'independiente_del_valle', name:'Independiente del Valle', country:'Ecuador', shirt:'#0a2a5e', band:'#e2001a', shorts:'#0a2a5e', pattern:'band'},
    {id:'barcelona_sc', name:'Barcelona SC', country:'Ecuador', shirt:'#ffd400', band:'#111111', shorts:'#111111', pattern:'band'},

    {id:'cerro_porteno', name:'Cerro Porteño', country:'Paraguay', shirt:'#e2001a', band:'#0033a0', shorts:'#0033a0', pattern:'stripes'},
    {id:'libertad', name:'Club Libertad', country:'Paraguay', shirt:'#ffffff', band:'#111111', shorts:'#111111', pattern:'band'},
    {id:'sportivo_2_de_mayo', name:'Sportivo 2 de Mayo', country:'Paraguay', shirt:'#0033a0', band:'#ffffff', shorts:'#0033a0', pattern:'band'},
    {id:'guarani', name:'Club Guaraní', country:'Paraguay', shirt:'#111111', band:'#e2001a', shorts:'#111111', pattern:'band'},

    {id:'cusco_fc', name:'Cusco FC', country:'Perú', shirt:'#7a1f3d', band:'#ffffff', shorts:'#7a1f3d', pattern:'band'},
    {id:'universitario', name:'Universitario de Deportes', country:'Perú', shirt:'#f0e6c8', band:'#7a1f3d', shorts:'#7a1f3d', pattern:'band'},
    {id:'sporting_cristal', name:'Sporting Cristal', country:'Perú', shirt:'#4fb8e6', band:'#ffffff', shorts:'#4fb8e6', pattern:'sash'},
    {id:'alianza_lima', name:'Alianza Lima', country:'Perú', shirt:'#0033a0', band:'#ffffff', shorts:'#0033a0', pattern:'band'},

    {id:'nacional', name:'Club Nacional', country:'Uruguay', shirt:'#ffffff', band:'#0033a0', shorts:'#ffffff', pattern:'sash'},
    {id:'penarol', name:'Peñarol', country:'Uruguay', shirt:'#111111', band:'#ffd400', shorts:'#111111', pattern:'stripes'},
    {id:'liverpool_uy', name:'Liverpool FC', country:'Uruguay', shirt:'#111111', band:'#ffffff', shorts:'#111111', pattern:'band'},
    {id:'juventud', name:'Juventud de Las Piedras', country:'Uruguay', shirt:'#0033a0', band:'#ffd400', shorts:'#0033a0', pattern:'band'},

    {id:'la_guaira', name:'Deportivo La Guaira', country:'Venezuela', shirt:'#ffd400', band:'#0033a0', shorts:'#0033a0', pattern:'band'},
    {id:'ucv', name:'UCV', country:'Venezuela', shirt:'#0033a0', band:'#ffd400', shorts:'#0033a0', pattern:'band'},
    {id:'tachira', name:'Deportivo Táchira', country:'Venezuela', shirt:'#7a1f3d', band:'#ffd400', shorts:'#7a1f3d', pattern:'band'},
    {id:'carabobo', name:'Carabobo FC', country:'Venezuela', shirt:'#7a1f3d', band:'#111111', shorts:'#111111', pattern:'band'}
  ];
  var TEAMS_BY_ID = {};
  TEAMS.forEach(function(t){ TEAMS_BY_ID[t.id] = t; });

  var DIFFICULTIES = {
    facil:      {label:'Fácil',      aiSpeed:170, reactMin:0.28, reactMax:0.50, kickChance:0.35, interceptRange:70,  qMin:0.40, qMax:0.75},
    normal:     {label:'Normal',     aiSpeed:215, reactMin:0.18, reactMax:0.34, kickChance:0.55, interceptRange:90,  qMin:0.60, qMax:1.10},
    dificil:    {label:'Difícil',    aiSpeed:250, reactMin:0.12, reactMax:0.22, kickChance:0.72, interceptRange:110, qMin:0.80, qMax:1.25},
    legendario: {label:'Legendario', aiSpeed:290, reactMin:0.06, reactMax:0.14, kickChance:0.90, interceptRange:140, qMin:1.00, qMax:1.35}
  };
  var currentDifficulty = DIFFICULTIES.normal;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var portalView = document.getElementById('portalView');
  var liberView = document.getElementById('libertadoresView');
  var playLiberBtn = document.getElementById('playLiberBtn');
  var backFromLiberBtn = document.getElementById('backFromLiberBtn');
  var muteBtn = document.getElementById('liberMuteBtn');

  var teamSelectView = document.getElementById('liberTeamSelectView');
  var teamGridEl = document.getElementById('liberTeamGrid');
  var difficultyView = document.getElementById('liberDifficultyView');
  var diffBackBtn = document.getElementById('liberDiffBackBtn');
  var stageView = document.getElementById('liberStageView');
  var stageTitleEl = document.getElementById('liberStageTitle');
  var groupTableEl = document.getElementById('liberGroupTable');
  var groupTableBody = document.getElementById('liberGroupTableBody');
  var stageTextEl = document.getElementById('liberStageText');
  var stageContinueBtn = document.getElementById('liberStageContinueBtn');
  var endView = document.getElementById('liberEndView');
  var endTitleEl = document.getElementById('liberEndTitle');
  var endTextEl = document.getElementById('liberEndText');
  var endRetryBtn = document.getElementById('liberEndRetryBtn');
  var matchView = document.getElementById('liberMatchView');

  var homeChipBadge = document.getElementById('liberHomeBadge');
  var awayChipBadge = document.getElementById('liberAwayBadge');
  var scoreHomeEl = document.getElementById('liberScoreHome');
  var scoreAwayEl = document.getElementById('liberScoreAway');
  var timeValEl = document.getElementById('liberTimeVal');

  var startOverlay = document.getElementById('liberStartOverlay');
  var startTitleEl = document.getElementById('liberStartTitle');
  var startBtn = document.getElementById('liberStartBtn');
  var overOverlay = document.getElementById('liberOverOverlay');
  var overTitleEl = document.getElementById('liberOverTitle');
  var overScoreEl = document.getElementById('liberOverScore');
  var overContinueBtn = document.getElementById('liberOverContinueBtn');

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

  // ---------- Campana (torneo) ----------
  var campaign = {
    yourId: null, difficulty: 'normal', group: [], standings: {},
    fixtureQueue: [], fixtureIndex: 0, stage: null,
    semiOpponent: null, finalOpponent: null, shootoutNote: false
  };

  function makeStandingsMap(teamIds){
    var map = {};
    teamIds.forEach(function(id){ map[id] = {teamId:id, pts:0, gf:0, ga:0, played:0}; });
    return map;
  }
  function applyResultTo(map, aId, bId, golA, golB){
    var sa = map[aId], sb = map[bId];
    sa.gf += golA; sa.ga += golB; sa.played += 1;
    sb.gf += golB; sb.ga += golA; sb.played += 1;
    if (golA > golB) sa.pts += 3;
    else if (golB > golA) sb.pts += 3;
    else { sa.pts += 1; sb.pts += 1; }
  }
  function simFixtureTo(map, aId, bId){
    applyResultTo(map, aId, bId, Math.floor(Math.random()*4), Math.floor(Math.random()*4));
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
  function allPairs(teamIds){
    var pairs = [];
    for (var i=0;i<teamIds.length;i++){
      for (var j=i+1;j<teamIds.length;j++){ pairs.push([teamIds[i], teamIds[j]]); }
    }
    return pairs;
  }
  function simulateFullGroup(teamIds){
    var map = makeStandingsMap(teamIds);
    allPairs(teamIds).forEach(function(pair){ simFixtureTo(map, pair[0], pair[1]); });
    return sortStandingsMap(map, teamIds);
  }

  function applyResult(aId, bId, golA, golB){ applyResultTo(campaign.standings, aId, bId, golA, golB); }
  function simFixture(aId, bId){ simFixtureTo(campaign.standings, aId, bId); }
  function sortedStandings(){ return sortStandingsMap(campaign.standings, campaign.group); }

  var GROUP_LETTERS = ['A','B','C','D','E','F','G','H'];
  function startCampaign(yourId, difficulty){
    campaign.yourId = yourId;
    campaign.difficulty = difficulty;
    currentDifficulty = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;

    var others31 = pickRandomTeams(31, [yourId]);
    var pool32 = shuffle([yourId].concat(others31));
    campaign.allGroups = [];
    for (var g=0; g<8; g++){ campaign.allGroups.push(pool32.slice(g*4,(g+1)*4)); }
    var yourGroupIndex = 0;
    for (var gi=0; gi<8; gi++){
      if (campaign.allGroups[gi].indexOf(yourId) !== -1){ yourGroupIndex = gi; break; }
    }
    campaign.groupLetter = GROUP_LETTERS[yourGroupIndex];
    campaign.group = campaign.allGroups[yourGroupIndex];
    var others = campaign.group.filter(function(id){ return id !== yourId; });

    campaign.standings = {};
    campaign.group.forEach(function(id){
      campaign.standings[id] = {teamId:id, pts:0, gf:0, ga:0, played:0};
    });
    simFixture(others[0], others[1]);
    simFixture(others[0], others[2]);
    simFixture(others[1], others[2]);
    campaign.fixtureQueue = shuffle(others.slice());
    campaign.fixtureIndex = 0;
    campaign.stage = 'group';
    campaign.shootoutNote = false;

    campaign.otherGroupWinners = [];
    for (var og=0; og<8; og++){
      if (og === yourGroupIndex) continue;
      var sorted = simulateFullGroup(campaign.allGroups[og]);
      campaign.otherGroupWinners.push(sorted[0].teamId);
    }

    showStageScreen();
  }

  function renderStandingsTable(){
    var sorted = sortedStandings();
    groupTableBody.innerHTML = '';
    sorted.forEach(function(s, idx){
      var tr = document.createElement('tr');
      var cls = '';
      if (s.teamId === campaign.yourId) cls += 'is-you ';
      if (campaign.fixtureIndex >= 3 && idx < 2) cls += 'is-qualified';
      tr.className = cls.trim();
      var gd = s.gf-s.ga;
      tr.innerHTML = '<td>'+TEAMS_BY_ID[s.teamId].name+'</td><td>'+s.pts+'</td><td>'+(gd>0?'+':'')+gd+'</td>';
      groupTableBody.appendChild(tr);
    });
  }

  function hideAllSubViews(){
    teamSelectView.classList.add('is-hidden');
    difficultyView.classList.add('is-hidden');
    stageView.classList.add('is-hidden');
    endView.classList.add('is-hidden');
    matchView.classList.add('is-hidden');
  }

  function showStageScreen(){
    hideAllSubViews();
    stageView.classList.remove('is-hidden');
    if (campaign.stage === 'group'){
      groupTableEl.classList.remove('is-hidden');
      renderStandingsTable();
      stageTitleEl.textContent = 'Grupo '+campaign.groupLetter+' · Fase de grupos ('+(campaign.fixtureIndex+1)+'/3)';
      var opp = TEAMS_BY_ID[campaign.fixtureQueue[campaign.fixtureIndex]];
      stageTextEl.textContent = 'Próximo partido: vs '+opp.name;
      stageContinueBtn.textContent = '▶ Jugar partido';
    } else if (campaign.stage === 'knockout-semi'){
      groupTableEl.classList.add('is-hidden');
      stageTitleEl.textContent = '¡Clasificaste a semifinales!';
      stageTextEl.textContent = 'Semifinal vs '+TEAMS_BY_ID[campaign.semiOpponent].name;
      stageContinueBtn.textContent = '▶ Jugar semifinal';
    } else if (campaign.stage === 'knockout-final'){
      groupTableEl.classList.add('is-hidden');
      stageTitleEl.textContent = '¡Estás en la final!';
      stageTextEl.textContent = 'Final vs '+TEAMS_BY_ID[campaign.finalOpponent].name;
      stageContinueBtn.textContent = '▶ Jugar la final';
    }
  }

  function endCampaign(resultType){
    hideAllSubViews();
    endView.classList.remove('is-hidden');
    var titleMap = {
      champion: '🏆 ¡Campeón de la Copa Libertadores!',
      'runner-up': '🥈 Subcampeón',
      'eliminated-semi': 'Eliminado en semifinales',
      'eliminated-group': 'Eliminado en fase de grupos'
    };
    endTitleEl.textContent = titleMap[resultType] || 'Fin del torneo';
    var extra = campaign.shootoutNote ? ' Se definió por penales.' : '';
    endTextEl.textContent = 'Jugaste con '+TEAMS_BY_ID[campaign.yourId].name+' en dificultad '+DIFFICULTIES[campaign.difficulty].label+'.'+extra;
  }

  stageContinueBtn.addEventListener('click', function(){
    ensureAudio();
    if (campaign.stage === 'group'){
      startMatchVs(campaign.fixtureQueue[campaign.fixtureIndex]);
    } else if (campaign.stage === 'knockout-semi'){
      startMatchVs(campaign.semiOpponent);
    } else if (campaign.stage === 'knockout-final'){
      startMatchVs(campaign.finalOpponent);
    }
  });

  function finishGroupStage(){
    var sorted = sortedStandings();
    var yourIndex = -1;
    for (var i=0;i<sorted.length;i++){ if (sorted[i].teamId === campaign.yourId){ yourIndex = i; break; } }
    if (yourIndex < 2){
      campaign.stage = 'knockout-semi';
      var winnersPool = shuffle(campaign.otherGroupWinners.slice());
      campaign.semiOpponent = winnersPool[0];
      campaign.remainingWinners = winnersPool.slice(1);
      showStageScreen();
    } else {
      endCampaign('eliminated-group');
    }
  }

  function resolveKnockout(){
    var outcome;
    if (scoreHome > scoreAway) outcome = 'win';
    else if (scoreAway > scoreHome) outcome = 'lose';
    else {
      campaign.shootoutNote = true;
      outcome = Math.random() < 0.5 ? 'win' : 'lose';
    }
    if (campaign.stage === 'knockout-semi'){
      if (outcome === 'win'){
        campaign.stage = 'knockout-final';
        campaign.finalOpponent = campaign.remainingWinners[0];
        showStageScreen();
      } else {
        endCampaign('eliminated-semi');
      }
    } else if (campaign.stage === 'knockout-final'){
      endCampaign(outcome === 'win' ? 'champion' : 'runner-up');
    }
  }

  function afterMatchContinue(){
    overOverlay.classList.add('is-hidden');
    if (campaign.stage === 'group'){
      var oppId = campaign.fixtureQueue[campaign.fixtureIndex];
      applyResult(campaign.yourId, oppId, scoreHome, scoreAway);
      campaign.fixtureIndex += 1;
      if (campaign.fixtureIndex >= 3) finishGroupStage();
      else showStageScreen();
    } else {
      resolveKnockout();
    }
  }
  overContinueBtn.addEventListener('click', afterMatchContinue);

  // ---------- Seleccion de equipo y dificultad ----------
  var pendingTeamId = null;
  function buildTeamGrid(){
    teamGridEl.innerHTML = '';
    TEAMS.forEach(function(team){
      var btn = document.createElement('button');
      btn.className = 'team-pick-btn';
      btn.innerHTML = '<span class="team-badge" style="background:'+team.shirt+';border-color:'+team.band+'"></span>'+
        '<span class="team-pick-name">'+team.name+'</span>'+
        '<span class="team-pick-country">'+team.country+'</span>';
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

  var diffButtons = document.querySelectorAll('.diff-btn');
  for (var di=0; di<diffButtons.length; di++){
    diffButtons[di].addEventListener('click', function(e){
      ensureAudio();
      startCampaign(pendingTeamId, e.currentTarget.getAttribute('data-diff'));
    });
  }

  function showTeamSelect(){
    hideAllSubViews();
    teamSelectView.classList.remove('is-hidden');
    pauseLiberLoop();
  }
  endRetryBtn.addEventListener('click', showTeamSelect);

  // ---------- Estado del partido ----------
  function makePlayer(team, x, isAI, attackDir){
    return {
      team: team, x: x, y: GROUND_Y-LEG_LENGTH, vx: 0, vy: 0,
      onGround: true, facing: attackDir, isAI: !!isAI, attackDir: attackDir,
      kickCooldown: 0, kicking: 0,
      aiDecisionT: 0, aiDir: 0, aiWantsJump: false
    };
  }
  function footPos(p){ return {x:p.x, y:p.y+LEG_LENGTH}; }
  var home = makePlayer(TEAMS_BY_ID.river, CANVAS_W*0.28, false, 1);
  var away = makePlayer(TEAMS_BY_ID.boca, CANVAS_W*0.72, true, -1);
  var ball = {x:CANVAS_W/2, y:GROUND_Y-BALL_R, vx:0, vy:0};

  var scoreHome = 0, scoreAway = 0;
  var matchTimeLeft = MATCH_SECONDS;
  var matchState = 'idle'; // 'idle' | 'playing' | 'goal' | 'over'
  var goalTimer = 0;
  var lastGoalSide = null;

  function resetKickoff(){
    home.x = CANVAS_W*0.28; home.y = GROUND_Y-LEG_LENGTH; home.vx=0; home.vy=0; home.onGround=true; home.kickCooldown=0;
    away.x = CANVAS_W*0.72; away.y = GROUND_Y-LEG_LENGTH; away.vx=0; away.vy=0; away.onGround=true; away.kickCooldown=0;
    ball.x = CANVAS_W/2; ball.y = GROUND_Y-BALL_R; ball.vx=0; ball.vy=0;
  }

  function updateMatchHud(){
    scoreHomeEl.textContent = scoreHome;
    scoreAwayEl.textContent = scoreAway;
    var m = Math.floor(Math.max(0,matchTimeLeft)/60);
    var s = Math.floor(Math.max(0,matchTimeLeft)%60);
    timeValEl.textContent = m+':'+(s<10?'0':'')+s;
  }

  function startMatchVs(opponentId){
    var yourTeam = TEAMS_BY_ID[campaign.yourId];
    var oppTeam = TEAMS_BY_ID[opponentId];
    home = makePlayer(yourTeam, CANVAS_W*0.28, false, 1);
    away = makePlayer(oppTeam, CANVAS_W*0.72, true, -1);
    scoreHome = 0; scoreAway = 0;
    matchTimeLeft = MATCH_SECONDS;
    matchState = 'idle';
    goalTimer = 0;
    resetKickoff();
    updateMatchHud();
    homeChipBadge.style.background = yourTeam.shirt;
    homeChipBadge.style.borderColor = yourTeam.band;
    awayChipBadge.style.background = oppTeam.shirt;
    awayChipBadge.style.borderColor = oppTeam.band;
    startTitleEl.textContent = '¿Listo para jugar vs '+oppTeam.name+'?';

    hideAllSubViews();
    matchView.classList.remove('is-hidden');
    startOverlay.classList.remove('is-hidden');
    overOverlay.classList.add('is-hidden');
    draw(0);
  }

  // ---------- Entrada ----------
  var dirStack = [];
  function pressDir(dir){ if (dirStack.indexOf(dir)===-1) dirStack.push(dir); }
  function releaseDir(dir){ var i=dirStack.indexOf(dir); if (i!==-1) dirStack.splice(i,1); }
  function currentDir(){ return dirStack.length ? dirStack[dirStack.length-1] : null; }

  function doJump(){
    if (matchState !== 'playing') return;
    if (home.onGround){
      home.vy = JUMP_VY;
      home.onGround = false;
      beep(500, 0.08, 'sine');
    }
  }
  function doKick(){
    if (matchState !== 'playing') return;
    attemptKick(home);
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
    if (p.y >= GROUND_Y-LEG_LENGTH){
      p.y = GROUND_Y-LEG_LENGTH;
      p.vy = 0;
      p.onGround = true;
    }
    if (p.kickCooldown > 0) p.kickCooldown -= dt;
    if (p.kicking > 0) p.kicking -= dt;
  }

  function resolvePlayerCollision(){
    var dx = away.x-home.x, dy = away.y-home.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    var minDist = PLAYER_R*1.7;
    if (dist > 0 && dist < minDist){
      var overlap = (minDist-dist)/2;
      var nx = dx/dist, ny = dy/dist;
      home.x -= nx*overlap; home.y -= ny*overlap;
      away.x += nx*overlap; away.y += ny*overlap;
      home.x = clamp(home.x, PLAYER_R, CANVAS_W-PLAYER_R);
      away.x = clamp(away.x, PLAYER_R, CANVAS_W-PLAYER_R);
    }
  }

  function attemptKick(p){
    if (p.kickCooldown > 0) return;
    var foot = footPos(p);
    var dx = ball.x-foot.x, dy = ball.y-foot.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    if (dist > KICK_RANGE) return;
    p.kickCooldown = KICK_COOLDOWN;
    p.kicking = 0.18;
    var power = 600, lift = -430;
    if (p.isAI){
      var quality = currentDifficulty.qMin + Math.random()*(currentDifficulty.qMax-currentDifficulty.qMin);
      power *= quality;
      lift *= 0.55 + Math.random()*0.6;
    }
    ball.vx = p.attackDir*power + p.vx*0.35;
    ball.vy = lift + Math.min(0, dy)*0.4;
    beep(320, 0.07, 'square');
    setTimeout(function(){ beep(420, 0.06, 'square'); }, 40);
  }

  function circleOverlap(cx, cy, cr, bx, by, br){
    var dx = bx-cx, dy = by-cy;
    var dist = Math.sqrt(dx*dx+dy*dy);
    var minDist = cr+br;
    if (dist > 0.001 && dist < minDist){
      return {nx: dx/dist, ny: dy/dist, overlap: minDist-dist};
    }
    return null;
  }

  function collideBallPlayer(p){
    var foot = footPos(p);
    var hit = circleOverlap(foot.x, foot.y, FOOT_R, ball.x, ball.y, BALL_R);
    if (!hit && ball.y < p.y+PLAYER_R*0.3){
      hit = circleOverlap(p.x, p.y, PLAYER_R, ball.x, ball.y, BALL_R);
    }
    if (hit){
      ball.x += hit.nx*hit.overlap;
      ball.y += hit.ny*hit.overlap;
      var relSpeed = 250;
      ball.vx = hit.nx*relSpeed + p.vx*0.5;
      ball.vy = hit.ny*relSpeed + p.vy*0.3 - 40;
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
        scoreGoal('away');
        return;
      }
      ball.x = BALL_R; ball.vx *= -0.7;
    }
    if (ball.x+BALL_R >= CANVAS_W){
      if (ball.y+BALL_R > GROUND_Y-GOAL_H){
        scoreGoal('home');
        return;
      }
      ball.x = CANVAS_W-BALL_R; ball.vx *= -0.7;
    }
  }

  function scoreGoal(side){
    if (matchState !== 'playing') return;
    if (side === 'home') scoreHome += 1; else scoreAway += 1;
    lastGoalSide = side;
    matchState = 'goal';
    goalTimer = 1.6;
    updateMatchHud();
    beep(700, 0.12, 'triangle');
    setTimeout(function(){ beep(950, 0.12, 'triangle'); }, 100);
    setTimeout(function(){ beep(1200, 0.18, 'triangle'); }, 220);
  }

  function updateAI(dt){
    away.aiDecisionT -= dt;
    if (away.aiDecisionT <= 0){
      away.aiDecisionT = currentDifficulty.reactMin + Math.random()*(currentDifficulty.reactMax-currentDifficulty.reactMin);
      var dx = ball.x-away.x, dy = ball.y-away.y;
      away.aiDir = Math.abs(dx) < 16 ? 0 : (dx>0 ? 1 : -1);
      away.aiWantsJump = away.onGround && ball.y < away.y-30 && Math.abs(dx) < currentDifficulty.interceptRange && ball.vy > -80;
      if (Math.sqrt(dx*dx+dy*dy) < KICK_RANGE && Math.random() < currentDifficulty.kickChance){
        attemptKick(away);
      }
    }
    away.vx = away.aiDir*currentDifficulty.aiSpeed;
    if (away.aiDir !== 0) away.facing = away.aiDir;
    if (away.aiWantsJump && away.onGround){
      away.vy = JUMP_VY;
      away.onGround = false;
      away.aiWantsJump = false;
    }
  }

  function endMatch(){
    matchState = 'over';
    var title;
    if (scoreHome > scoreAway) title = '¡Ganaste!';
    else if (scoreAway > scoreHome) title = 'Perdiste';
    else title = 'Empate';
    overTitleEl.textContent = title;
    overScoreEl.textContent = home.team.name+' '+scoreHome+' - '+scoreAway+' '+away.team.name;
    overOverlay.classList.remove('is-hidden');
    pauseLiberLoop();
  }

  // ---------- Dibujo ----------
  var SKY_H = 90;
  function drawPitch(){
    var c = ctx;
    var crowdH = 46;
    var skyGrad = c.createLinearGradient(0,0,0,SKY_H);
    skyGrad.addColorStop(0, '#8fd3f4');
    skyGrad.addColorStop(1, '#cfeadf');
    c.fillStyle = skyGrad;
    c.fillRect(0,0,CANVAS_W,SKY_H);

    c.fillStyle = 'rgba(30,22,50,0.4)';
    c.fillRect(0,0,CANVAS_W,crowdH);
    for (var cx=4; cx<CANVAS_W; cx+=8){
      c.fillStyle = ['#ff9fc0','#ffd23f','#6fe0d9','#ffffff','#ff7fa8','#8fd3f4'][(cx*11)%6];
      c.globalAlpha = 0.7;
      var rowY = 6 + ((Math.floor(cx/8)%4))*10;
      c.fillRect(cx, rowY, 5, 5);
    }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(0,crowdH-6,CANVAS_W,6);

    var grassTop = SKY_H;
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
    c.moveTo(gx, GROUND_Y);
    c.lineTo(gx, topY);
    c.lineTo(gx+dir*GOAL_DEPTH, topY);
    c.lineTo(gx+dir*GOAL_DEPTH, GROUND_Y);
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

  function drawKitPattern(c, team){
    c.fillStyle = team.band;
    switch (team.pattern){
      case 'sash':
        c.beginPath();
        c.moveTo(-PLAYER_R,-8); c.lineTo(-PLAYER_R,8); c.lineTo(PLAYER_R,-8); c.lineTo(PLAYER_R,-24);
        c.closePath(); c.fill();
        break;
      case 'band':
        c.fillRect(-PLAYER_R,-10,PLAYER_R*2,14);
        break;
      case 'stripes':
        var stripeW = 8;
        for (var sx=-PLAYER_R; sx<PLAYER_R; sx+=stripeW*2){
          c.fillRect(sx,-PLAYER_R,stripeW,PLAYER_R*2);
        }
        break;
      case 'halves':
        c.fillRect(0,-PLAYER_R,PLAYER_R,PLAYER_R*2);
        break;
      default:
        c.beginPath(); c.arc(0,-14,5,0,Math.PI*2); c.fill();
    }
  }

  function drawPlayer(p, t){
    var c = ctx;
    drawShadow(p.x);
    c.save();
    c.translate(p.x, p.y);

    var legSwing = Math.abs(p.vx) > 5 && p.onGround && !reducedMotion ? Math.sin(t*10)*7 : 0;
    var footX, footY;
    if (p.kicking > 0){
      var kProg = 1-(p.kicking/0.18);
      footX = p.attackDir*(10+kProg*26);
      footY = LEG_LENGTH - kProg*14;
    } else {
      footX = legSwing;
      footY = LEG_LENGTH;
    }
    c.strokeStyle = p.team.shorts;
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(0,PLAYER_R-4); c.lineTo(footX,footY); c.stroke();
    c.fillStyle = '#f5f5f5';
    c.beginPath(); c.ellipse(footX,footY,7,5,0,0,Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1;
    c.stroke();

    c.fillStyle = p.team.shirt;
    c.beginPath();
    c.arc(0,0,PLAYER_R,0,Math.PI*2);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.15)';
    c.lineWidth = 1.5;
    c.stroke();

    c.save();
    c.beginPath(); c.arc(0,0,PLAYER_R,0,Math.PI*2); c.clip();
    drawKitPattern(c, p.team);
    c.restore();

    c.fillStyle = '#241a3d';
    var eyeDir = p.facing >= 0 ? 1 : -1;
    c.beginPath();
    c.arc(eyeDir*9-2,-8,4.4,0,Math.PI*2);
    c.arc(eyeDir*9+10,-8,4.4,0,Math.PI*2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(eyeDir*9-1,-9,1.4,0,Math.PI*2);
    c.arc(eyeDir*9+11,-9,1.4,0,Math.PI*2);
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
    var team = lastGoalSide === 'home' ? home.team : away.team;
    c.save();
    c.globalAlpha = clamp(alpha,0,1);
    c.translate(CANVAS_W/2, CANVAS_H*0.4);
    c.scale(scale, scale);
    c.font = '900 50px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillText('¡GOL DE '+team.name.toUpperCase()+'!', 3, 3);
    c.fillStyle = team.band === '#ffffff' || team.band === '#f5f5f5' ? team.shirt : team.band;
    c.fillText('¡GOL DE '+team.name.toUpperCase()+'!', 0, 0);
    c.restore();
  }

  function draw(ts){
    var t = (ts||0)/1000;
    drawPitch();
    drawPlayer(home, t);
    drawPlayer(away, t);
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
        updateMatchHud();
        endMatch();
        draw(ts);
        return;
      }
      updateMatchHud();

      home.vx = currentDir()==='left' ? -MOVE_SPEED : (currentDir()==='right' ? MOVE_SPEED : 0);
      if (currentDir()) home.facing = currentDir()==='right' ? 1 : -1;

      updatePlayerPhysics(home, dt);
      updatePlayerPhysics(away, dt);
      updateAI(dt);
      resolvePlayerCollision();
      updateBall(dt);
      collideBallPlayer(home);
      collideBallPlayer(away);
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
    showTeamSelect();
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
})();
