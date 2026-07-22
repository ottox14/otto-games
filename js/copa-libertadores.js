// Copa Libertadores: futbol de mesa por turnos, estilo "Miniball" (fichas
// circulares con fisica, se apunta arrastrando y se suelta para disparar).
// Elegis tu equipo y la dificultad, y jugas una fase de grupos (3 partidos)
// seguida de semifinal y final si clasificas.
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
  var MATCH_DURATION = 90; // segundos - sin límite de tiros, se juega a reloj

  var TEAMS = [
    {id:'lanus', strength:74, name:'Lanús', country:'Argentina', shirt:'#5c1730', band:'#111111', shorts:'#111111', pattern:'solid'},
    {id:'platense', strength:65, name:'Platense', country:'Argentina', shirt:'#e3cf9c', band:'#1a1a1a', shorts:'#1a1a1a', pattern:'stripes'},
    {id:'estudiantes', strength:76, name:'Estudiantes de La Plata', country:'Argentina', shirt:'#c8102e', band:'#ffffff', shorts:'#ffffff', pattern:'sash'},
    {id:'independiente_rivadavia', strength:62, name:'Independiente Rivadavia', country:'Argentina', shirt:'#c8102e', band:'#ffffff', shorts:'#c8102e', pattern:'stripes'},
    {id:'rosario_central', strength:75, name:'Rosario Central', country:'Argentina', shirt:'#1c3f94', band:'#ffd400', shorts:'#000000', pattern:'sash'},
    {id:'boca', strength:90, name:'Boca Juniors', country:'Argentina', shirt:'#0b3f8f', band:'#ffd400', shorts:'#0b3f8f', pattern:'band'},
    {id:'argentinos', strength:72, name:'Argentinos Juniors', country:'Argentina', shirt:'#ffffff', band:'#e2001a', shorts:'#e2001a', pattern:'halves'},
    {id:'river', strength:92, name:'River Plate', country:'Argentina', shirt:'#ffffff', band:'#d61f3c', shorts:'#0b1a3a', pattern:'sash'},

    {id:'always_ready', strength:63, name:'Always Ready', country:'Bolivia', shirt:'#f5f5f5', band:'#111111', shorts:'#111111', pattern:'band'},
    {id:'bolivar', strength:68, name:'Bolívar', country:'Bolivia', shirt:'#4fb8e6', band:'#ffffff', shorts:'#4fb8e6', pattern:'band'},
    {id:'the_strongest', strength:66, name:'The Strongest', country:'Bolivia', shirt:'#ffd400', band:'#111111', shorts:'#111111', pattern:'stripes'},
    {id:'nacional_potosi', strength:55, name:'Nacional Potosí', country:'Bolivia', shirt:'#1c7a3c', band:'#ffffff', shorts:'#1c7a3c', pattern:'band'},

    {id:'flamengo', strength:93, name:'Flamengo', country:'Brasil', shirt:'#e2001a', band:'#111111', shorts:'#111111', pattern:'stripes'},
    {id:'corinthians', strength:83, name:'Corinthians', country:'Brasil', shirt:'#ffffff', band:'#111111', shorts:'#111111', pattern:'solid'},
    {id:'palmeiras', strength:91, name:'Palmeiras', country:'Brasil', shirt:'#0a6c34', band:'#ffffff', shorts:'#ffffff', pattern:'solid'},
    {id:'cruzeiro', strength:78, name:'Cruzeiro', country:'Brasil', shirt:'#0033a0', band:'#ffffff', shorts:'#ffffff', pattern:'solid'},
    {id:'mirassol', strength:65, name:'Mirassol', country:'Brasil', shirt:'#ffd400', band:'#0a6c34', shorts:'#0a6c34', pattern:'band'},
    {id:'fluminense', strength:80, name:'Fluminense', country:'Brasil', shirt:'#5c1730', band:'#0a6c34', shorts:'#ffffff', pattern:'stripes'},
    {id:'botafogo', strength:79, name:'Botafogo', country:'Brasil', shirt:'#111111', band:'#ffffff', shorts:'#ffffff', pattern:'stripes'},
    {id:'bahia', strength:72, name:'Bahía', country:'Brasil', shirt:'#0033a0', band:'#e2001a', shorts:'#ffffff', pattern:'stripes'},

    {id:'coquimbo', strength:68, name:'Coquimbo Unido', country:'Chile', shirt:'#5b2a86', band:'#111111', shorts:'#111111', pattern:'halves'},
    {id:'ohiggins', strength:65, name:"O'Higgins", country:'Chile', shirt:'#0a6c34', band:'#ffffff', shorts:'#0a6c34', pattern:'band'},
    {id:'huachipato', strength:64, name:'Huachipato', country:'Chile', shirt:'#111111', band:'#ffffff', shorts:'#111111', pattern:'stripes'},

    {id:'tolima', strength:70, name:'Deportes Tolima', country:'Colombia', shirt:'#5c1730', band:'#ffd400', shorts:'#5c1730', pattern:'band'},
    {id:'santa_fe', strength:73, name:'Independiente Santa Fe', country:'Colombia', shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'solid'},
    {id:'junior', strength:74, name:'Junior de Barranquilla', country:'Colombia', shirt:'#e2001a', band:'#ffffff', shorts:'#e2001a', pattern:'stripes'},
    {id:'medellin', strength:75, name:'Independiente Medellín', country:'Colombia', shirt:'#c8102e', band:'#111111', shorts:'#111111', pattern:'solid'},

    {id:'liga_de_quito', strength:77, name:'Liga de Quito', country:'Ecuador', shirt:'#ffffff', band:'#0033a0', shorts:'#0033a0', pattern:'band'},
    {id:'independiente_del_valle', strength:76, name:'Independiente del Valle', country:'Ecuador', shirt:'#0a2a5e', band:'#e2001a', shorts:'#0a2a5e', pattern:'band'},
    {id:'barcelona_sc', strength:74, name:'Barcelona SC', country:'Ecuador', shirt:'#ffd400', band:'#111111', shorts:'#111111', pattern:'band'},

    {id:'cerro_porteno', strength:76, name:'Cerro Porteño', country:'Paraguay', shirt:'#e2001a', band:'#0033a0', shorts:'#0033a0', pattern:'stripes'},
    {id:'libertad', strength:74, name:'Club Libertad', country:'Paraguay', shirt:'#ffffff', band:'#111111', shorts:'#111111', pattern:'band'},
    {id:'sportivo_2_de_mayo', strength:60, name:'Sportivo 2 de Mayo', country:'Paraguay', shirt:'#0033a0', band:'#ffffff', shorts:'#0033a0', pattern:'band'},
    {id:'guarani', strength:68, name:'Club Guaraní', country:'Paraguay', shirt:'#111111', band:'#e2001a', shorts:'#111111', pattern:'band'},

    {id:'cusco_fc', strength:62, name:'Cusco FC', country:'Perú', shirt:'#5c1730', band:'#ffffff', shorts:'#5c1730', pattern:'band'},
    {id:'universitario', strength:72, name:'Universitario de Deportes', country:'Perú', shirt:'#f0e6c8', band:'#5c1730', shorts:'#5c1730', pattern:'band'},
    {id:'sporting_cristal', strength:70, name:'Sporting Cristal', country:'Perú', shirt:'#4fb8e6', band:'#ffffff', shorts:'#4fb8e6', pattern:'sash'},
    {id:'alianza_lima', strength:71, name:'Alianza Lima', country:'Perú', shirt:'#0033a0', band:'#ffffff', shorts:'#0033a0', pattern:'band'},

    {id:'nacional', strength:79, name:'Club Nacional', country:'Uruguay', shirt:'#ffffff', band:'#0033a0', shorts:'#ffffff', pattern:'sash'},
    {id:'penarol', strength:80, name:'Peñarol', country:'Uruguay', shirt:'#111111', band:'#ffd400', shorts:'#111111', pattern:'stripes'},
    {id:'liverpool_uy', strength:68, name:'Liverpool FC', country:'Uruguay', shirt:'#111111', band:'#ffffff', shorts:'#111111', pattern:'band'},
    {id:'juventud', strength:60, name:'Juventud de Las Piedras', country:'Uruguay', shirt:'#0033a0', band:'#ffd400', shorts:'#0033a0', pattern:'band'},

    {id:'la_guaira', strength:58, name:'Deportivo La Guaira', country:'Venezuela', shirt:'#ffd400', band:'#0033a0', shorts:'#0033a0', pattern:'band'},
    {id:'ucv', strength:56, name:'UCV', country:'Venezuela', shirt:'#0033a0', band:'#ffd400', shorts:'#0033a0', pattern:'band'},
    {id:'tachira', strength:65, name:'Deportivo Táchira', country:'Venezuela', shirt:'#5c1730', band:'#ffd400', shorts:'#5c1730', pattern:'band'},
    {id:'carabobo', strength:62, name:'Carabobo FC', country:'Venezuela', shirt:'#5c1730', band:'#111111', shorts:'#111111', pattern:'band'}
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
  var fixtureListEl = document.getElementById('liberFixtureList');
  var endView = document.getElementById('liberEndView');
  var endTitleEl = document.getElementById('liberEndTitle');
  var endTextEl = document.getElementById('liberEndText');
  var endRetryBtn = document.getElementById('liberEndRetryBtn');
  var matchView = document.getElementById('liberMatchView');

  var homeChipBadge = document.getElementById('liberHomeBadge');
  var awayChipBadge = document.getElementById('liberAwayBadge');
  var scoreHomeEl = document.getElementById('liberScoreHome');
  var scoreAwayEl = document.getElementById('liberScoreAway');
  var turnValEl = document.getElementById('liberTurnVal');
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
    rounds: [], roundIndex: 0, stage: null,
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
  // Poisson sample (Knuth) - used so scorelines look like real football, not uniform noise.
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
  function simFixtureTo(map, aId, bId){
    var res = simRealisticScore(aId, bId, false);
    applyResultTo(map, aId, bId, res[0], res[1]);
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
  function sortedStandings(){ return sortStandingsMap(campaign.standings, campaign.group); }

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
    var rawGroup = campaign.allGroups[yourGroupIndex];
    campaign.group = [yourId].concat(rawGroup.filter(function(id){ return id !== yourId; }));
    campaign.allGroups[yourGroupIndex] = campaign.group;

    campaign.standings = makeStandingsMap(campaign.group);
    campaign.rounds = buildRoundRobin(campaign.group);
    campaign.roundIndex = 0;
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
      if (campaign.roundIndex >= 3 && idx < 2) cls += 'is-qualified';
      tr.className = cls.trim();
      var gd = s.gf-s.ga;
      tr.innerHTML = '<td>'+TEAMS_BY_ID[s.teamId].name+'</td><td>'+s.pts+'</td><td>'+(gd>0?'+':'')+gd+'</td>';
      groupTableBody.appendChild(tr);
    });
  }

  function renderFixtureList(){
    if (!fixtureListEl) return;
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
      if (fixtureListEl) fixtureListEl.classList.remove('is-hidden');
      renderStandingsTable();
      renderFixtureList();
      stageTitleEl.textContent = 'Grupo '+campaign.groupLetter+' · Fecha '+(campaign.roundIndex+1)+' de 3';
      var opp = TEAMS_BY_ID[campaign.rounds[campaign.roundIndex].yourOpponent];
      stageTextEl.textContent = 'Próximo partido: vs '+opp.name;
      stageContinueBtn.textContent = '▶ Jugar partido';
    } else if (campaign.stage === 'knockout-semi'){
      groupTableEl.classList.add('is-hidden');
      if (fixtureListEl) fixtureListEl.classList.add('is-hidden');
      stageTitleEl.textContent = '¡Clasificaste a semifinales!';
      stageTextEl.textContent = 'Semifinal vs '+TEAMS_BY_ID[campaign.semiOpponent].name;
      stageContinueBtn.textContent = '▶ Jugar semifinal';
    } else if (campaign.stage === 'knockout-final'){
      groupTableEl.classList.add('is-hidden');
      if (fixtureListEl) fixtureListEl.classList.add('is-hidden');
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
      startMatchVs(campaign.rounds[campaign.roundIndex].yourOpponent);
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
      var round = campaign.rounds[campaign.roundIndex];
      round.yourResult = [scoreHome, scoreAway];
      applyResult(campaign.yourId, round.yourOpponent, scoreHome, scoreAway);
      var otherScore = simRealisticScore(round.otherA, round.otherB, false);
      round.otherResult = otherScore;
      applyResult(round.otherA, round.otherB, otherScore[0], otherScore[1]);
      round.played = true;
      campaign.roundIndex += 1;
      if (campaign.roundIndex >= 3) finishGroupStage();
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
    homeTeamData = TEAMS_BY_ID[campaign.yourId];
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
    pauseLiberLoop();
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
  function bestAdvancedTeammate(exclude, pieces, goalX){
    var best = null, bestD = Infinity;
    pieces.forEach(function(p){
      if (p === exclude) return;
      var d = Math.abs(p.x-goalX);
      if (d < bestD){ bestD = d; best = p; }
    });
    return best;
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
    var sorted = awayPieces.slice().sort(function(a,b){ return dist(a,ballBody)-dist(b,ballBody); });

    var chosen, targetX, targetY, powerLevel;

    if (diff.smart <= 0 || Math.random() < diff.mistakeChance){
      chosen = awayPieces[Math.floor(Math.random()*awayPieces.length)];
      var wildAtGoal = Math.random() < 0.5;
      targetX = (wildAtGoal ? goalX : ballBody.x) + (Math.random()*280-140);
      targetY = (wildAtGoal ? goalY : ballBody.y) + (Math.random()*280-140);
      powerLevel = 0.35+Math.random()*0.65;
    } else if (diff.smart === 1){
      chosen = sorted[0];
      var deepInOwnHalf = ballBody.x > PITCH_CX + (PITCH_R-PITCH_L)*0.12;
      if (deepInOwnHalf && Math.random() < 0.55){
        targetX = PITCH_L + (PITCH_R-PITCH_L)*0.32;
        targetY = ballBody.y + (Math.random()*180-90);
        powerLevel = 0.7+Math.random()*0.25;
      } else {
        var clr = pathClearance(chosen.x, chosen.y, goalX, goalY, homePieces);
        if (clr > PIECE_R*1.3){
          targetX = goalX; targetY = goalY+(Math.random()*70-35);
          powerLevel = 0.85+Math.random()*0.15;
        } else {
          var mate = bestAdvancedTeammate(chosen, awayPieces, goalX);
          targetX = mate ? mate.x : goalX; targetY = mate ? mate.y : goalY;
          powerLevel = 0.55+Math.random()*0.25;
        }
      }
    } else {
      var candidates = sorted.slice(0,3);
      var best = null, bestScore = -Infinity;
      candidates.forEach(function(p){
        var clr = pathClearance(p.x, p.y, goalX, goalY, homePieces);
        var distGoal = Math.hypot(p.x-goalX, p.y-goalY);
        var score = clr*2-distGoal*0.12;
        if (score > bestScore){ bestScore = score; best = p; }
      });
      chosen = best;
      var clrBest = pathClearance(chosen.x, chosen.y, goalX, goalY, homePieces);
      if (clrBest > PIECE_R*1.05){
        targetX = goalX; targetY = goalY;
        powerLevel = 0.92+Math.random()*0.08;
      } else {
        var mate2 = bestAdvancedTeammate(chosen, awayPieces, goalX);
        var mateClear = mate2 ? pathClearance(chosen.x, chosen.y, mate2.x, mate2.y, homePieces) : -Infinity;
        if (mate2 && mateClear > PIECE_R*0.9){
          targetX = mate2.x; targetY = mate2.y;
          powerLevel = 0.6+Math.random()*0.2;
        } else {
          targetX = PITCH_L+40;
          targetY = ballBody.y > goalY ? PITCH_T+50 : PITCH_B-50;
          powerLevel = 0.75+Math.random()*0.2;
        }
      }
    }

    var aim = aimDirectionForTarget(chosen, targetX, targetY);
    var ang = aim.ang + (Math.random()*2-1)*diff.aimNoise;
    var finalPower = clamp(powerLevel*(1+(Math.random()*2-1)*diff.powerNoise), 0.25, 1);
    var speed = finalPower*MAX_DRAG*POWER_SCALE;
    launchPiece(chosen, Math.cos(ang)*speed, Math.sin(ang)*speed);
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

  var LIGHT_SHIRTS = {'#ffffff':1,'#f5f5f5':1,'#e3cf9c':1,'#ffd400':1,'#f0e6c8':1};
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
  });
  startBtn.addEventListener('click', function(){
    ensureAudio();
    startOverlay.classList.add('is-hidden');
    turnPhase = 'aiming';
    updateMatchHud();
    startLiberLoop();
  });
})();
