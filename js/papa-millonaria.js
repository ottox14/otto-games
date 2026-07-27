// Papa Millonaria: clicker con progresion tipo "tycoon" (inspirado en la
// sensacion de avance de los tycoon, sin copiar ninguno). Zonas que se
// desbloquean, misiones, power-ups temporales, eventos aleatorios,
// prestigio, arbol de mejoras por categoria, coleccionables, tienda de
// cosmeticos y mascotas. Todo en una sola economia (el dinero y las
// mejoras compradas siguen sirviendo en cualquier zona).
(function(){
  var SAVE_KEY = 'papaMillonariaSave_v2';
  var OLD_SAVE_KEY = 'papaMillonariaSave';
  var UPGRADE_COST_GROWTH = 1.15;
  var BREAK_THRESHOLD = 20;

  function formatMoney(n){
    n = Math.floor(n);
    if (Math.abs(n) < 1000) return n.toLocaleString('es-AR');
    var units = [
      {v:1e12, s:'B'}, {v:1e9, s:'MM'}, {v:1e6, s:'M'}, {v:1e3, s:'K'}
    ];
    for (var i=0;i<units.length;i++){
      if (Math.abs(n) >= units[i].v){
        return (n/units[i].v).toFixed(2).replace(/\.00$/,'') + units[i].s;
      }
    }
    return n.toLocaleString('es-AR');
  }
  function formatExact(n){ return Math.floor(n).toLocaleString('es-AR'); }
  function upgradeCost(base, owned, growth){ return Math.ceil(base * Math.pow(growth||UPGRADE_COST_GROWTH, owned)); }
  function clamp01(n){ return Math.max(0, Math.min(1, n)); }

  // =====================================================================
  // Datos: zonas
  // =====================================================================
  var ZONES = [
    {
      id:'huerta', name:'Huerta Inicial', icon:'🥔', unlockAt:0, zoneGoal:5000,
      bg:['#2d1b0e','#4a2f1a'], accent:'#8bc34a', scene:['🐔','🚜','🧰'],
      clickUpgrades:[
        {id:'guantes', name:'Guantes de Recolector', icon:'🧤', value:1, cost:25},
        {id:'pala', name:'Pala de Acero', icon:'⛏️', value:4, cost:300}
      ],
      autoUpgrades:[
        {id:'gallina', name:'Gallina Picoteadora', icon:'🐔', value:1, cost:50},
        {id:'tractor', name:'Tractor', icon:'🚜', value:5, cost:600}
      ],
      missions:[
        {id:'h1', desc:'Conseguí $1.000 en total', type:'totalEarned', target:1000, reward:500},
        {id:'h2', desc:'Comprá 5 Gallinas Picoteadoras', type:'own', upgradeId:'gallina', target:5, reward:1200},
        {id:'h3', desc:'Llegá a $10/seg de producción', type:'perSec', target:10, reward:2500}
      ]
    },
    {
      id:'campo', name:'Campo de Papas', icon:'🚜', unlockAt:5000, zoneGoal:120000,
      bg:['#1b2e14','#2f4a1e'], accent:'#ffb300', scene:['🌾','🏚️','🚜'],
      clickUpgrades:[
        {id:'molinoManual', name:'Molino Manual', icon:'🌾', value:22, cost:6000},
        {id:'cosechadoraGrande', name:'Cosechadora Grande', icon:'🚛', value:95, cost:55000}
      ],
      autoUpgrades:[
        {id:'granero', name:'Granero', icon:'🏚️', value:38, cost:7000},
        {id:'molinoViento', name:'Molino de Viento', icon:'💨', value:170, cost:60000}
      ],
      missions:[
        {id:'c1', desc:'Conseguí $50.000 en total', type:'totalEarned', target:50000, reward:15000},
        {id:'c2', desc:'Comprá 10 Graneros', type:'own', upgradeId:'granero', target:10, reward:20000},
        {id:'c3', desc:'Llegá a $300/seg de producción', type:'perSec', target:300, reward:40000}
      ]
    },
    {
      id:'fabrica', name:'Fábrica de Papas', icon:'🏭', unlockAt:120000, zoneGoal:3000000,
      bg:['#111827','#1f2937'], accent:'#4fd1e8', scene:['🤖','📦','🏭'],
      clickUpgrades:[
        {id:'guanteRobotico', name:'Guante Robótico', icon:'🦾', value:520, cost:140000},
        {id:'prensaHidraulica', name:'Prensa Hidráulica', icon:'🔩', value:2300, cost:1100000}
      ],
      autoUpgrades:[
        {id:'robotEnsamblador', name:'Robot Ensamblador', icon:'🤖', value:950, cost:180000},
        {id:'cintaTransportadora', name:'Cinta Transportadora', icon:'📦', value:4200, cost:1400000}
      ],
      missions:[
        {id:'f1', desc:'Conseguí $1.000.000 en total', type:'totalEarned', target:1000000, reward:300000},
        {id:'f2', desc:'Comprá 15 Robots Ensambladores', type:'own', upgradeId:'robotEnsamblador', target:15, reward:500000},
        {id:'f3', desc:'Llegá a $8.000/seg de producción', type:'perSec', target:8000, reward:1000000}
      ]
    },
    {
      id:'puerto', name:'Puerto de Exportación', icon:'🚢', unlockAt:3000000, zoneGoal:80000000,
      bg:['#0b2340','#0f3a5f'], accent:'#4fc3f7', scene:['🚢','📦','⚓'],
      clickUpgrades:[
        {id:'gruaPortuaria', name:'Grúa Portuaria', icon:'🏗️', value:13000, cost:3800000},
        {id:'contenedorExpress', name:'Contenedor Express', icon:'📦', value:58000, cost:33000000}
      ],
      autoUpgrades:[
        {id:'barcoCarguero', name:'Barco Carguero', icon:'🚢', value:23000, cost:4800000},
        {id:'rutaComercial', name:'Ruta Comercial', icon:'🌐', value:105000, cost:38000000}
      ],
      missions:[
        {id:'p1', desc:'Conseguí $20.000.000 en total', type:'totalEarned', target:20000000, reward:6000000},
        {id:'p2', desc:'Comprá 10 Barcos Cargueros', type:'own', upgradeId:'barcoCarguero', target:10, reward:10000000},
        {id:'p3', desc:'Llegá a $150.000/seg de producción', type:'perSec', target:150000, reward:20000000}
      ]
    },
    {
      id:'mina', name:'Mina de Papas Doradas', icon:'🌋', unlockAt:80000000, zoneGoal:2000000000,
      bg:['#3a0f0f','#5c1f14'], accent:'#ffca28', scene:['⛏️','💎','🌋'],
      clickUpgrades:[
        {id:'picoDeOro', name:'Pico de Oro', icon:'⛏️', value:310000, cost:95000000},
        {id:'taladroDiamante', name:'Taladro de Diamante', icon:'💎', value:1450000, cost:850000000}
      ],
      autoUpgrades:[
        {id:'vetaDorada', name:'Veta Dorada', icon:'✨', value:560000, cost:125000000},
        {id:'refineria', name:'Refinería', icon:'🏔️', value:2600000, cost:950000000}
      ],
      missions:[
        {id:'m1', desc:'Conseguí $500.000.000 en total', type:'totalEarned', target:500000000, reward:150000000},
        {id:'m2', desc:'Comprá 8 Refinerías', type:'own', upgradeId:'refineria', target:8, reward:250000000},
        {id:'m3', desc:'Llegá a $3.000.000/seg de producción', type:'perSec', target:3000000, reward:500000000}
      ]
    },
    {
      id:'estacion', name:'Estación Espacial', icon:'🚀', unlockAt:2000000000, zoneGoal:null,
      bg:['#0a0a1f','#1a1240'], accent:'#b388ff', scene:['🛸','🌌','🤖'],
      clickUpgrades:[
        {id:'guanteCuantico', name:'Guante Cuántico', icon:'🌌', value:8200000, cost:2800000000},
        {id:'laserCosecha', name:'Láser de Cosecha', icon:'🔫', value:37000000, cost:24000000000}
      ],
      autoUpgrades:[
        {id:'droidCosechador', name:'Droide Cosechador', icon:'🤖', value:15500000, cost:3800000000},
        {id:'naveNodriza', name:'Nave Nodriza', icon:'🛸', value:72000000, cost:29000000000}
      ],
      missions:[
        {id:'e1', desc:'Conseguí $10.000.000.000 en total', type:'totalEarned', target:10000000000, reward:3000000000},
        {id:'e2', desc:'Comprá 10 Droides Cosechadores', type:'own', upgradeId:'droidCosechador', target:10, reward:5000000000},
        {id:'e3', desc:'Llegá a $60.000.000/seg de producción', type:'perSec', target:60000000, reward:10000000000}
      ]
    }
  ];
  var ZONES_BY_ID = {};
  ZONES.forEach(function(z){ ZONES_BY_ID[z.id] = z; });
  function allBuildingsFlat(){
    var out = [];
    ZONES.forEach(function(z){
      z.clickUpgrades.forEach(function(u){ out.push({u:u, kind:'click', zone:z}); });
      z.autoUpgrades.forEach(function(u){ out.push({u:u, kind:'auto', zone:z}); });
    });
    return out;
  }

  // =====================================================================
  // Datos: mejoras globales (Economia / Suerte)
  // =====================================================================
  var ECONOMY_UPGRADES = [
    {id:'interes', name:'Interés Bancario', icon:'🏦', desc:'+5% a todo lo que ganás', costBase:2000, growth:1.6, maxLevel:20, per:0.05},
    {id:'regateo', name:'Regateo', icon:'📉', desc:'-2% al costo de las mejoras (hasta -40%)', costBase:5000, growth:1.8, maxLevel:20, per:0.02},
    {id:'offline', name:'Ahorro Nocturno', icon:'🌙', desc:'+10% a las ganancias mientras no jugás', costBase:3000, growth:1.7, maxLevel:10, per:0.10}
  ];
  var LUCK_UPGRADES = [
    {id:'trebol', name:'Trébol de la Suerte', icon:'🍀', desc:'+8% de probabilidad de eventos especiales', costBase:4000, growth:1.7, maxLevel:10, per:0.08},
    {id:'critico', name:'Golpe Crítico', icon:'🎯', desc:'+3% de probabilidad de click crítico (x3)', costBase:6000, growth:1.75, maxLevel:15, per:0.03},
    {id:'fortuna', name:'Buena Fortuna', icon:'🎁', desc:'+5% de probabilidad de encontrar coleccionables', costBase:10000, growth:1.8, maxLevel:10, per:0.05}
  ];

  // =====================================================================
  // Datos: prestigio
  // =====================================================================
  var PRESTIGE_MIN_EARNED = 1000000;
  var PRESTIGE_UPGRADES = [
    {id:'impulso', name:'Impulso Inicial', icon:'🚀', desc:'Empezás cada partida con $500 extra por nivel', costBase:1, growth:1.5, maxLevel:20, per:500},
    {id:'multiplicador', name:'Multiplicador Eterno', icon:'💰', desc:'+10% a toda tu producción para siempre', costBase:2, growth:1.6, maxLevel:25, per:0.10},
    {id:'suertePermanente', name:'Suerte Permanente', icon:'🍀', desc:'+5% de probabilidad de eventos y críticos', costBase:2, growth:1.6, maxLevel:15, per:0.05},
    {id:'clickEterno', name:'Click Eterno', icon:'👆', desc:'+15% al valor de tus clicks para siempre', costBase:1, growth:1.55, maxLevel:20, per:0.15}
  ];
  function prestigeGainPreview(totalEarnedVal){
    return Math.floor(Math.sqrt(Math.max(0, totalEarnedVal)/1000000));
  }

  // =====================================================================
  // Datos: coleccionables
  // =====================================================================
  var COLLECTIBLES = [
    {id:'dorada', name:'Papa Dorada', icon:'🥔', desc:'+2% al valor de tus clicks', type:'click', value:0.02},
    {id:'diamante', name:'Papa de Diamante', icon:'💎', desc:'+2% a tu producción automática', type:'auto', value:0.02},
    {id:'legendaria', name:'Papa Legendaria', icon:'👑', desc:'+5% a todo lo que ganás', type:'all', value:0.05},
    {id:'cosmica', name:'Papa Cósmica', icon:'🌌', desc:'+10% a todo lo que ganás', type:'all', value:0.10}
  ];

  // =====================================================================
  // Datos: tienda y mascotas
  // =====================================================================
  var SHOP_SKINS = [
    {id:'clasica', name:'Papa Clásica', icon:'🥔', cost:0},
    {id:'batata', name:'Batata Dorada', icon:'🍠', cost:40000},
    {id:'brillante', name:'Papa Brillante', icon:'🥔✨', cost:400000},
    {id:'real', name:'Papa Real', icon:'👑🥔', cost:4000000},
    {id:'estelar', name:'Papa Estelar', icon:'🌠🥔', cost:40000000}
  ];
  var SHOP_BACKGROUNDS = [
    {id:'atardecer', name:'Atardecer', icon:'🌅', cost:0},
    {id:'aurora', name:'Aurora', icon:'🌌', cost:60000},
    {id:'neon', name:'Neón', icon:'💜', cost:600000},
    {id:'galaxia', name:'Galaxia', icon:'🌠', cost:6000000}
  ];
  var SHOP_EFFECTS = [
    {id:'chispas', name:'Chispas', icon:'✨', cost:0},
    {id:'monedas', name:'Monedas', icon:'🪙', cost:50000},
    {id:'estrellas', name:'Estrellas', icon:'⭐', cost:500000},
    {id:'fuegos', name:'Fuegos Artificiales', icon:'🎆', cost:5000000}
  ];
  var SHOP_MUSIC = [
    {id:'ambiental', name:'Melodía Ambiental', icon:'🎵', cost:100000}
  ];
  var PETS = [
    {id:'gallina', name:'Gallina', icon:'🐔', desc:'+5 a la producción automática por nivel', adoptCost:20000, levelCostBase:8000, levelGrowth:1.4, kind:'autoFlat', per:5},
    {id:'cerdo', name:'Cerdo', icon:'🐷', desc:'+3% al valor de tus clicks por nivel', adoptCost:150000, levelCostBase:60000, levelGrowth:1.45, kind:'click', per:0.03},
    {id:'vaca', name:'Vaca', icon:'🐮', desc:'+3% a tu producción automática por nivel', adoptCost:800000, levelCostBase:300000, levelGrowth:1.45, kind:'auto', per:0.03},
    {id:'robot', name:'Robot', icon:'🤖', desc:'+5% a las ganancias mientras no jugás por nivel', adoptCost:5000000, levelCostBase:2000000, levelGrowth:1.5, kind:'offline', per:0.05},
    {id:'dragon', name:'Dragón', icon:'🐉', desc:'+2% a todo lo que ganás por nivel', adoptCost:50000000, levelCostBase:20000000, levelGrowth:1.55, kind:'all', per:0.02}
  ];

  // =====================================================================
  // Datos: eventos aleatorios
  // =====================================================================
  var EVENT_TYPES = [
    {id:'goldenPotato', icon:'🥔✨', label:'¡Papa Dorada! Tocala', duration:5},
    {id:'truck', icon:'🚚', label:'¡Camión de reparto!', duration:6},
    {id:'chest', icon:'🎁', label:'¡Cofre sorpresa!', duration:8},
    {id:'rain', icon:'🌧️💰', label:'¡Lluvia de monedas!', duration:6}
  ];

  // =====================================================================
  // Estado
  // =====================================================================
  var state = {
    money:0, totalEarned:0,
    zoneIndex:0, unlockedZoneIndex:0,
    owned:{}, // id de mejora de zona -> cantidad
    economyLevels:{}, luckLevels:{},
    missionsClaimed:{},
    gems:0, prestigeLevels:{}, prestigeCount:0,
    collectibles:{},
    shopOwned:{skins:['clasica'], backgrounds:['atardecer'], effects:['chispas'], music:[]},
    equipped:{skin:'clasica', background:'atardecer', effect:'chispas'},
    musicOn:false,
    pets:{}, // id -> nivel (0 = no adoptada)
    lastActive: Date.now()
  };
  var activeBuffs = []; // {type, endsAt}
  var clickStreak = 0;
  var perClick = 1, perSec = 0;
  var pendingZoneUnlock = null;

  // ---------- DOM ----------
  var portalView = document.getElementById('portalView');
  var papaView = document.getElementById('papaView');
  var playPapaBtn = document.getElementById('playPapaBtn');
  var backFromPapaBtn = document.getElementById('backFromPapaBtn');
  var resetBtn = document.getElementById('papaResetBtn');
  var muteBtn = document.getElementById('papaMuteBtn');

  var zoneSubtitleEl = document.getElementById('papaZoneSubtitle');
  var moneyEl = document.getElementById('papaMoneyVal');
  var perClickEl = document.getElementById('papaPerClickVal');
  var perSecEl = document.getElementById('papaPerSecVal');
  var gemsChipEl = document.getElementById('papaGemsChip');
  var gemsValEl = document.getElementById('papaGemsVal');
  var goalLabelEl = document.getElementById('papaZoneGoalLabel');
  var goalFillEl = document.getElementById('papaGoalFill');
  var buffsBarEl = document.getElementById('papaBuffsBar');

  var frameEl = document.getElementById('papaFrame');
  var mainEl = document.getElementById('papaMain');
  var sceneEl = document.getElementById('papaZoneScene');
  var potatoBtn = document.getElementById('potatoBtn');
  var potatoCracks = document.getElementById('potatoCracks');
  var eventBadge = document.getElementById('papaEventBadge');

  var tabsEl = document.getElementById('papaTabs');
  var panels = {
    upgrades: document.getElementById('papaPanelUpgrades'),
    missions: document.getElementById('papaPanelMissions'),
    shop: document.getElementById('papaPanelShop'),
    pets: document.getElementById('papaPanelPets'),
    collection: document.getElementById('papaPanelCollection'),
    prestige: document.getElementById('papaPanelPrestige')
  };
  var categoryTabsEl = document.getElementById('papaCategoryTabs');
  var upgradeListEl = document.getElementById('papaUpgradeList');
  var missionListEl = document.getElementById('papaMissionList');
  var shopSkinsEl = document.getElementById('papaShopSkins');
  var shopBgEl = document.getElementById('papaShopBg');
  var shopEffectsEl = document.getElementById('papaShopEffects');
  var shopMusicEl = document.getElementById('papaShopMusic');
  var petGridEl = document.getElementById('papaPetGrid');
  var collectGridEl = document.getElementById('papaCollectGrid');
  var prestigeInfoEl = document.getElementById('papaPrestigeInfo');
  var prestigeBtn = document.getElementById('papaPrestigeBtn');
  var prestigeHintEl = document.getElementById('papaPrestigeHint');
  var prestigeUpgradeListEl = document.getElementById('papaPrestigeUpgradeList');

  var zoneUnlockOverlay = document.getElementById('papaZoneUnlockOverlay');
  var zoneUnlockTitleEl = document.getElementById('papaZoneUnlockTitle');
  var zoneUnlockDescEl = document.getElementById('papaZoneUnlockDesc');
  var travelBtn = document.getElementById('papaTravelBtn');
  var travelOverlay = document.getElementById('papaTravelOverlay');
  var prestigeConfirmOverlay = document.getElementById('papaPrestigeConfirmOverlay');
  var prestigeConfirmDescEl = document.getElementById('papaPrestigeConfirmDesc');
  var prestigeConfirmBtn = document.getElementById('papaPrestigeConfirmBtn');
  var prestigeCancelBtn = document.getElementById('papaPrestigeCancelBtn');
  var zoneStripEl = document.getElementById('papaZoneStrip');

  var currentTab = 'upgrades';
  var currentCategory = 'click';

  // ---------- Audio ----------
  var muted = false;
  var audioCtx = null;
  var musicNode = null;
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
  function updateMusic(){
    if (musicNode){ try { musicNode.osc1.stop(); musicNode.osc2.stop(); } catch(e){} musicNode = null; }
    if (!muted && state.musicOn && audioCtx){
      var g = audioCtx.createGain();
      g.gain.value = 0.025;
      var o1 = audioCtx.createOscillator(); o1.type='sine'; o1.frequency.value = 196;
      var o2 = audioCtx.createOscillator(); o2.type='sine'; o2.frequency.value = 246.94;
      o1.connect(g); o2.connect(g); g.connect(audioCtx.destination);
      o1.start(); o2.start();
      musicNode = {osc1:o1, osc2:o2, gain:g};
    }
  }
  muteBtn.addEventListener('click', function(){
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
    updateMusic();
  });

  function papaActive(){ return !papaView.classList.contains('is-hidden'); }

  // =====================================================================
  // Calculo de tasas (click / segundo) con todos los multiplicadores
  // =====================================================================
  function economyMult(){ return 1 + ECONOMY_UPGRADES[0].per*(state.economyLevels.interes||0); }
  function costDiscount(){ return clamp01(ECONOMY_UPGRADES[1].per*(state.economyLevels.regateo||0)); }
  function offlineRateMult(){
    var m = 1 + ECONOMY_UPGRADES[2].per*(state.economyLevels.offline||0);
    m *= 1 + PETS[3].per*(state.pets.robot||0);
    return m;
  }
  function critChance(){
    var c = LUCK_UPGRADES[1].per*(state.luckLevels.critico||0);
    c += PRESTIGE_UPGRADES[2].per*(state.prestigeLevels.suertePermanente||0);
    if (hasBuff('suerte')) c += 0.35;
    return clamp01(c);
  }
  function eventChanceMult(){
    var m = 1 + LUCK_UPGRADES[0].per*(state.luckLevels.trebol||0);
    m *= 1 + PRESTIGE_UPGRADES[2].per*(state.prestigeLevels.suertePermanente||0);
    return m;
  }
  function collectibleChanceMult(){ return 1 + LUCK_UPGRADES[2].per*(state.luckLevels.fortuna||0); }
  function prestigeGlobalMult(){ return 1 + PRESTIGE_UPGRADES[1].per*(state.prestigeLevels.multiplicador||0); }
  function prestigeClickMult(){ return 1 + PRESTIGE_UPGRADES[3].per*(state.prestigeLevels.clickEterno||0); }
  function petAllMult(){ return 1 + PETS[4].per*(state.pets.dragon||0); }
  function petClickMult(){ return 1 + PETS[1].per*(state.pets.cerdo||0); }
  function petAutoMult(){ return 1 + PETS[2].per*(state.pets.vaca||0); }
  function collectibleAllMult(){
    var m = 1;
    COLLECTIBLES.forEach(function(c){ if (state.collectibles[c.id] && c.type==='all') m *= 1+c.value; });
    return m;
  }
  function collectibleClickMult(){
    var m = 1;
    COLLECTIBLES.forEach(function(c){ if (state.collectibles[c.id] && c.type==='click') m *= 1+c.value; });
    return m;
  }
  function collectibleAutoMult(){
    var m = 1;
    COLLECTIBLES.forEach(function(c){ if (state.collectibles[c.id] && c.type==='auto') m *= 1+c.value; });
    return m;
  }
  function hasBuff(type){ return activeBuffs.some(function(b){ return b.type===type; }); }
  function buffClickMult(){
    var m = 1;
    if (hasBuff('frenesi')) m *= 5;
    if (hasBuff('gigante')) m *= 12;
    return m;
  }
  function buffAutoMult(){ return hasBuff('aceleracion') ? 2 : 1; }

  function recomputeRates(){
    var clickBase = 1, autoBase = 0;
    allBuildingsFlat().forEach(function(entry){
      var owned = state.owned[entry.u.id]||0;
      if (entry.kind==='click') clickBase += entry.u.value*owned;
      else autoBase += entry.u.value*owned;
    });
    autoBase += PETS[0].per*(state.pets.gallina||0);

    var globalMult = economyMult() * prestigeGlobalMult() * petAllMult() * collectibleAllMult();
    perClick = clickBase * globalMult * prestigeClickMult() * petClickMult() * collectibleClickMult() * buffClickMult();
    perSec = autoBase * globalMult * petAutoMult() * collectibleAutoMult() * buffAutoMult();
  }

  function addMoney(amount){
    if (amount <= 0) return;
    state.money += amount;
    state.totalEarned += amount;
    checkZoneUnlock();
  }

  // =====================================================================
  // Zonas: desbloqueo y viaje
  // =====================================================================
  function checkZoneUnlock(){
    if (state.unlockedZoneIndex >= ZONES.length-1) return;
    var next = ZONES[state.unlockedZoneIndex+1];
    if (state.totalEarned >= next.unlockAt){
      state.unlockedZoneIndex += 1;
      pendingZoneUnlock = next;
      showZoneUnlock(next);
    }
  }
  function showZoneUnlock(zone){
    zoneUnlockTitleEl.textContent = '🎉 ¡Nueva zona desbloqueada!';
    zoneUnlockDescEl.textContent = zone.icon+' '+zone.name;
    zoneUnlockOverlay.classList.remove('is-hidden');
    beep(1046, 0.16, 'triangle');
    setTimeout(function(){ beep(1318, 0.2, 'triangle'); }, 140);
  }
  travelBtn.addEventListener('click', function(){
    zoneUnlockOverlay.classList.add('is-hidden');
    var target = pendingZoneUnlock;
    pendingZoneUnlock = null;
    travelOverlay.classList.remove('is-hidden');
    beep(500, 0.3, 'sine');
    setTimeout(function(){
      travelOverlay.classList.add('is-hidden');
      if (target) travelToZone(ZONES.indexOf(target));
      saveProgress();
    }, 900);
  });
  function travelToZone(idx){
    if (idx < 0 || idx > state.unlockedZoneIndex) return;
    state.zoneIndex = idx;
    applyZoneTheme();
    renderZoneStrip();
    renderZoneScene();
    updateHUD();
    renderUpgradeList();
    renderMissions();
    saveProgress();
  }
  function applyZoneTheme(){
    var z = ZONES[state.zoneIndex];
    frameEl.style.setProperty('--papa-accent', z.accent);
    frameEl.style.setProperty('--papa-bg1', z.bg[0]);
    frameEl.style.setProperty('--papa-bg2', z.bg[1]);
    zoneSubtitleEl.textContent = z.icon+' '+z.name;
  }
  function renderZoneScene(){
    var z = ZONES[state.zoneIndex];
    sceneEl.innerHTML = z.scene.map(function(icon){ return '<span>'+icon+'</span>'; }).join('');
  }
  function renderZoneStrip(){
    zoneStripEl.innerHTML = '';
    ZONES.forEach(function(z, i){
      var locked = i > state.unlockedZoneIndex;
      var btn = document.createElement('button');
      btn.className = 'papa-zone-chip' + (i===state.zoneIndex?' is-current':'') + (locked?' is-locked':'');
      btn.innerHTML = '<span class="papa-zone-chip-icon">'+(locked?'🔒':z.icon)+'</span><span class="papa-zone-chip-name">'+z.name+'</span>';
      if (!locked){ btn.addEventListener('click', function(){ travelToZone(i); }); }
      else { btn.disabled = true; }
      zoneStripEl.appendChild(btn);
    });
  }

  // =====================================================================
  // HUD
  // =====================================================================
  function updateHUD(){
    moneyEl.textContent = formatMoney(state.money);
    perClickEl.textContent = formatMoney(perClick);
    perSecEl.textContent = formatMoney(perSec);
    var canPrestige = state.totalEarned >= PRESTIGE_MIN_EARNED;
    gemsChipEl.classList.toggle('is-hidden', !canPrestige && state.gems<=0);
    gemsValEl.textContent = formatMoney(state.gems);

    var z = ZONES[state.zoneIndex];
    if (z.zoneGoal){
      var nextZ = ZONES[state.unlockedZoneIndex+1];
      if (nextZ && state.zoneIndex === state.unlockedZoneIndex){
        goalLabelEl.textContent = 'Próxima zona: '+nextZ.name+' ($'+formatMoney(nextZ.unlockAt)+' en total)';
        var pct = clamp01(state.totalEarned/nextZ.unlockAt)*100;
        goalFillEl.style.width = pct+'%';
      } else if (!nextZ){
        goalLabelEl.textContent = '¡Ya desbloqueaste todas las zonas!';
        goalFillEl.style.width = '100%';
      } else {
        goalLabelEl.textContent = 'Zona ya desbloqueada';
        goalFillEl.style.width = '100%';
      }
    } else {
      goalLabelEl.textContent = '🚀 Zona final — seguí creciendo';
      goalFillEl.style.width = '100%';
    }
    renderBuffsBar();
  }

  function showPop(text, isBonus){
    var pop = document.createElement('div');
    pop.className = 'click-pop' + (isBonus ? ' bonus' : '');
    pop.textContent = text;
    pop.style.left = (50 + (Math.random()*30-15)) + '%';
    mainEl.appendChild(pop);
    setTimeout(function(){ if (pop.parentNode) pop.parentNode.removeChild(pop); }, 900);
  }
  var PARTICLE_ICONS = {chispas:'✨', monedas:'🪙', estrellas:'⭐', fuegos:'🎆'};
  function spawnParticles(n){
    var icon = PARTICLE_ICONS[state.equipped.effect] || '✨';
    var rect = potatoBtn.getBoundingClientRect();
    var mainRect = mainEl.getBoundingClientRect();
    for (var i=0;i<n;i++){
      var p = document.createElement('div');
      p.className = 'papa-particle';
      p.textContent = icon;
      var cx = rect.left-mainRect.left+rect.width/2;
      var cy = rect.top-mainRect.top+rect.height/2;
      p.style.left = cx+'px';
      p.style.top = cy+'px';
      var ang = Math.random()*Math.PI*2, dist = 30+Math.random()*40;
      p.style.setProperty('--papa-particle-end', 'translate('+(Math.cos(ang)*dist)+'px,'+(Math.sin(ang)*dist-30)+'px)');
      mainEl.appendChild(p);
      (function(el){ setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 720); })(p);
    }
  }

  function updateCrackStage(){
    var stage = Math.min(4, Math.floor((clickStreak/BREAK_THRESHOLD)*4));
    potatoCracks.className = 'potato-cracks' + (stage>0 ? ' stage-'+stage : '');
  }

  // =====================================================================
  // Click principal
  // =====================================================================
  potatoBtn.addEventListener('click', function(){
    ensureAudio();
    var isCrit = Math.random() < critChance();
    var gain = perClick * (isCrit ? 3 : 1);
    addMoney(gain);
    showPop((isCrit?'💥 CRÍTICO +':'+')+formatMoney(gain), isCrit);
    spawnParticles(isCrit ? 6 : 3);
    beep(isCrit?720:(500+Math.random()*200), isCrit?0.12:0.05, isCrit?'triangle':'sine');
    clickStreak += 1;
    maybeFindCollectible();

    if (clickStreak >= BREAK_THRESHOLD){
      var bonus = perClick*5;
      addMoney(bonus);
      showPop('¡Se rompió! +'+formatMoney(bonus), true);
      beep(200, 0.2, 'sawtooth');
      clickStreak = 0;
      potatoBtn.classList.add('breaking');
      setTimeout(function(){ potatoBtn.classList.remove('breaking'); }, 350);
    }
    updateCrackStage();
    updateHUD();
    refreshMissionProgressUI();
    refreshBuyButtonStates();
    saveProgress();
  });

  // =====================================================================
  // Pestañas
  // =====================================================================
  function showTab(tab){
    currentTab = tab;
    Object.keys(panels).forEach(function(k){ panels[k].classList.toggle('is-hidden', k!==tab); });
    var btns = tabsEl.querySelectorAll('.papa-tab-btn');
    for (var i=0;i<btns.length;i++){ btns[i].classList.toggle('is-active', btns[i].getAttribute('data-tab')===tab); }
    if (tab==='upgrades') renderUpgradeList();
    else if (tab==='missions') renderMissions();
    else if (tab==='shop') renderShop();
    else if (tab==='pets') renderPets();
    else if (tab==='collection') renderCollection();
    else if (tab==='prestige') renderPrestige();
  }
  tabsEl.addEventListener('click', function(e){
    var btn = e.target.closest('.papa-tab-btn');
    if (!btn) return;
    ensureAudio();
    showTab(btn.getAttribute('data-tab'));
  });
  categoryTabsEl.addEventListener('click', function(e){
    var btn = e.target.closest('.papa-cat-btn');
    if (!btn) return;
    ensureAudio();
    currentCategory = btn.getAttribute('data-cat');
    var btns = categoryTabsEl.querySelectorAll('.papa-cat-btn');
    for (var i=0;i<btns.length;i++){ btns[i].classList.toggle('is-active', btns[i]===btn); }
    renderUpgradeList();
  });

  // =====================================================================
  // Arbol de mejoras (categorias: click / production / economy / luck)
  // =====================================================================
  function renderUpgradeList(){
    upgradeListEl.innerHTML = '';
    if (currentCategory==='click' || currentCategory==='production'){
      var kind = currentCategory==='click' ? 'click' : 'auto';
      allBuildingsFlat().filter(function(e){ return e.kind===kind; }).forEach(function(entry){
        var u = entry.u, owned = state.owned[u.id]||0;
        var cost = Math.ceil(upgradeCost(u.cost, owned) * (1-costDiscount()));
        var locked = entry.zone.unlockAt > 0 && state.unlockedZoneIndex < ZONES.indexOf(entry.zone);
        var card = document.createElement('div');
        card.className = 'upgrade-card';
        var subLabel = kind==='click' ? ('+'+formatMoney(u.value)+' por click') : ('+'+formatMoney(u.value)+' pesos/seg');
        card.innerHTML = '<div class="upgrade-icon">'+u.icon+'</div>'
          +'<div class="upgrade-info"><h3>'+u.name+' <small style="opacity:.6">('+entry.zone.name+')</small></h3>'
          +'<p>'+subLabel+'</p>'
          +'<p class="upgrade-owned">Tenés: <b>'+owned+'</b></p></div>'
          +'<button class="upgrade-buy-btn" data-id="'+u.id+'" data-kind="'+kind+'"'+(state.money<cost?' disabled':'')+'>$'+formatMoney(cost)+'</button>';
        upgradeListEl.appendChild(card);
      });
    } else if (currentCategory==='economy'){
      ECONOMY_UPGRADES.forEach(function(u){ upgradeListEl.appendChild(renderLeveledCard(u, state.economyLevels, 'economy')); });
    } else if (currentCategory==='luck'){
      LUCK_UPGRADES.forEach(function(u){ upgradeListEl.appendChild(renderLeveledCard(u, state.luckLevels, 'luck')); });
    }
    var buyBtns = upgradeListEl.querySelectorAll('.upgrade-buy-btn[data-id]');
    for (var i=0;i<buyBtns.length;i++){
      buyBtns[i].addEventListener('click', function(e){
        buyBuilding(e.currentTarget.getAttribute('data-id'), e.currentTarget.getAttribute('data-kind'));
      });
    }
  }
  function renderLeveledCard(u, levelMap, group){
    var level = levelMap[u.id]||0;
    var maxed = level >= u.maxLevel;
    var cost = maxed ? 0 : upgradeCost(u.costBase, level, u.growth);
    var card = document.createElement('div');
    card.className = 'upgrade-card'+(maxed?' is-maxed':'');
    card.innerHTML = '<div class="upgrade-icon">'+u.icon+'</div>'
      +'<div class="upgrade-info"><h3>'+u.name+'</h3><p>'+u.desc+'</p>'
      +'<p class="upgrade-owned">Nivel: <b>'+level+'</b>/'+u.maxLevel+'</p></div>'
      +'<button class="upgrade-buy-btn"'+(maxed||state.money<cost?' disabled':'')+'>'+(maxed?'MÁX':'$'+formatMoney(cost))+'</button>';
    if (!maxed){
      card.querySelector('.upgrade-buy-btn').addEventListener('click', function(){ buyLeveled(u, levelMap, group); });
    }
    return card;
  }
  function buyBuilding(id, kind){
    var entry = allBuildingsFlat().filter(function(e){ return e.u.id===id; })[0];
    if (!entry) return;
    var owned = state.owned[id]||0;
    var cost = Math.ceil(upgradeCost(entry.u.cost, owned) * (1-costDiscount()));
    if (state.money < cost) return;
    state.money -= cost;
    state.owned[id] = owned+1;
    beep(880, 0.12, 'triangle');
    recomputeRates();
    updateHUD();
    renderUpgradeList();
    refreshMissionProgressUI();
    saveProgress();
  }
  function buyLeveled(u, levelMap, group){
    var level = levelMap[u.id]||0;
    if (level >= u.maxLevel) return;
    var cost = upgradeCost(u.costBase, level, u.growth);
    if (state.money < cost) return;
    state.money -= cost;
    levelMap[u.id] = level+1;
    beep(880, 0.12, 'triangle');
    recomputeRates();
    updateHUD();
    renderUpgradeList();
    saveProgress();
  }
  function refreshBuyButtonStates(){
    if (currentTab!=='upgrades') return;
    var buyBtns = upgradeListEl.querySelectorAll('.upgrade-buy-btn');
    // simplemente re-renderizamos: la lista no es tan larga como para
    // que importe el costo de reconstruir el DOM en cada click
    renderUpgradeList();
  }

  // =====================================================================
  // Misiones
  // =====================================================================
  function missionProgress(m){
    if (m.type==='totalEarned') return state.totalEarned;
    if (m.type==='perSec') return perSec;
    if (m.type==='own') return state.owned[m.upgradeId]||0;
    return 0;
  }
  function renderMissions(){
    missionListEl.innerHTML = '';
    ZONES.forEach(function(z, zi){
      if (zi > state.unlockedZoneIndex) return;
      z.missions.forEach(function(m){
        var progress = missionProgress(m);
        var done = progress >= m.target;
        var claimed = !!state.missionsClaimed[m.id];
        var card = document.createElement('div');
        card.className = 'papa-mission-card'+(done?' is-done':'')+(claimed?' is-claimed':'');
        var pct = clamp01(progress/m.target)*100;
        card.innerHTML = '<div class="papa-mission-icon">'+(claimed?'✅':(done?'🎁':'🎯'))+'</div>'
          +'<div class="papa-mission-info"><p>'+m.desc+' <small style="opacity:.6">('+z.name+')</small></p>'
          +'<div class="papa-mission-track"><div class="papa-mission-fill" style="width:'+pct+'%"></div></div></div>'
          +'<div class="papa-mission-reward">+$'+formatMoney(m.reward)+'</div>'
          +'<button class="papa-mission-claim-btn" '+(!done||claimed?'disabled':'')+'>'+(claimed?'Cobrado':'Cobrar')+'</button>';
        if (done && !claimed){
          card.querySelector('.papa-mission-claim-btn').addEventListener('click', function(){ claimMission(m); });
        }
        missionListEl.appendChild(card);
      });
    });
  }
  function claimMission(m){
    if (state.missionsClaimed[m.id]) return;
    state.missionsClaimed[m.id] = true;
    addMoney(m.reward);
    showPop('🎯 Misión cumplida +'+formatMoney(m.reward), true);
    beep(1046, 0.2, 'triangle');
    updateHUD();
    renderMissions();
    saveProgress();
  }
  function refreshMissionProgressUI(){
    if (currentTab==='missions') renderMissions();
  }

  // =====================================================================
  // Power-ups temporales y eventos aleatorios
  // =====================================================================
  function addBuff(type, duration, label){
    var existing = activeBuffs.filter(function(b){ return b.type===type; })[0];
    if (existing){ existing.endsAt = Date.now()+duration*1000; }
    else { activeBuffs.push({type:type, endsAt:Date.now()+duration*1000, label:label}); }
    recomputeRates();
    updateHUD();
  }
  var BUFF_LABELS = {
    frenesi:'⚡ Frenesí x5', gigante:'🥔 Papa Gigante', suerte:'🍀 Suerte',
    aceleracion:'⏱ Aceleración x2'
  };
  function renderBuffsBar(){
    var now = Date.now();
    activeBuffs = activeBuffs.filter(function(b){ return b.endsAt > now; });
    buffsBarEl.innerHTML = activeBuffs.map(function(b){
      var secs = Math.ceil((b.endsAt-now)/1000);
      return '<span class="papa-buff-pill">'+(BUFF_LABELS[b.type]||b.type)+' · '+secs+'s</span>';
    }).join('');
  }

  var eventTimer = null;
  var activeEvent = null;
  function scheduleNextEvent(){
    if (eventTimer) clearTimeout(eventTimer);
    var baseDelay = 26 + Math.random()*24; // 26-50s
    var delay = baseDelay / eventChanceMult();
    eventTimer = setTimeout(spawnEvent, Math.max(8, delay)*1000);
  }
  function spawnEvent(){
    if (!papaActive() || activeEvent){ scheduleNextEvent(); return; }
    var type = EVENT_TYPES[Math.floor(Math.random()*EVENT_TYPES.length)];
    activeEvent = type;
    eventBadge.textContent = type.icon;
    eventBadge.title = type.label;
    eventBadge.setAttribute('aria-label', type.label);
    eventBadge.classList.remove('is-hidden');
    var expireTimer = setTimeout(function(){
      if (activeEvent === type){ dismissEvent(); scheduleNextEvent(); }
    }, type.duration*1000);
    eventBadge.onclick = function(){
      clearTimeout(expireTimer);
      resolveEvent(type);
      dismissEvent();
      scheduleNextEvent();
    };
  }
  function dismissEvent(){
    activeEvent = null;
    eventBadge.classList.add('is-hidden');
    eventBadge.onclick = null;
  }
  function resolveEvent(type){
    ensureAudio();
    beep(880, 0.15, 'triangle');
    if (type.id === 'goldenPotato'){
      addBuff('gigante', 20);
      showPop('🥔✨ ¡Papa Gigante activada!', true);
    } else if (type.id === 'truck'){
      var reward = Math.max(50, perSec*30 + perClick*10);
      addMoney(reward);
      showPop('🚚 +'+formatMoney(reward), true);
    } else if (type.id === 'rain'){
      var rainReward = Math.max(80, perSec*45 + perClick*15);
      addMoney(rainReward);
      spawnParticles(14);
      showPop('🌧️💰 +'+formatMoney(rainReward), true);
    } else if (type.id === 'chest'){
      var roll = Math.random();
      if (roll < 0.12 && maybeFindCollectible(true)){
        showPop('🎁 ¡Encontraste un coleccionable!', true);
      } else if (roll < 0.55){
        var buffTypes = ['frenesi','suerte','aceleracion'];
        var pick = buffTypes[Math.floor(Math.random()*buffTypes.length)];
        var durations = {frenesi:15, suerte:30, aceleracion:20};
        addBuff(pick, durations[pick]);
        showPop((BUFF_LABELS[pick])+' activado', true);
      } else {
        var chestReward = Math.max(60, perSec*25 + perClick*8);
        addMoney(chestReward);
        showPop('🎁 +'+formatMoney(chestReward), true);
      }
    }
    updateHUD();
    refreshMissionProgressUI();
    saveProgress();
  }

  function maybeFindCollectible(force){
    var remaining = COLLECTIBLES.filter(function(c){ return !state.collectibles[c.id]; });
    if (!remaining.length) return false;
    var chance = force ? 1 : (0.0004 * collectibleChanceMult());
    if (Math.random() >= chance) return false;
    var found = remaining[Math.floor(Math.random()*remaining.length)];
    state.collectibles[found.id] = true;
    recomputeRates();
    if (currentTab==='collection') renderCollection();
    return true;
  }

  // =====================================================================
  // Tienda
  // =====================================================================
  function renderShop(){
    renderShopGrid(shopSkinsEl, SHOP_SKINS, 'skins', 'skin');
    renderShopGrid(shopBgEl, SHOP_BACKGROUNDS, 'backgrounds', 'background');
    renderShopGrid(shopEffectsEl, SHOP_EFFECTS, 'effects', 'effect');
    renderMusicShop();
  }
  function renderShopGrid(el, items, ownedKey, equipKey){
    el.innerHTML = '';
    items.forEach(function(item){
      var owned = state.shopOwned[ownedKey].indexOf(item.id) !== -1;
      var equipped = state.equipped[equipKey] === item.id;
      var btn = document.createElement('button');
      btn.className = 'papa-shop-item'+(owned?' is-owned':'')+(equipped?' is-equipped':'');
      btn.disabled = !owned && state.money < item.cost;
      btn.innerHTML = '<span class="papa-shop-icon">'+item.icon+'</span>'
        +'<span class="papa-shop-name">'+item.name+'</span>'
        +'<span class="papa-shop-price">'+(equipped?'Equipado':(owned?'Usar':'$'+formatMoney(item.cost)))+'</span>';
      btn.addEventListener('click', function(){ buyOrEquip(item, ownedKey, equipKey); });
      el.appendChild(btn);
    });
  }
  function renderMusicShop(){
    shopMusicEl.innerHTML = '';
    var item = SHOP_MUSIC[0];
    var owned = state.shopOwned.music.indexOf(item.id) !== -1;
    var btn = document.createElement('button');
    btn.className = 'papa-shop-item'+(owned?' is-owned':'')+(state.musicOn?' is-equipped':'');
    btn.disabled = !owned && state.money < item.cost;
    btn.innerHTML = '<span class="papa-shop-icon">'+item.icon+'</span>'
      +'<span class="papa-shop-name">'+item.name+'</span>'
      +'<span class="papa-shop-price">'+(owned?(state.musicOn?'Sonando':'Activar'):'$'+formatMoney(item.cost))+'</span>';
    btn.addEventListener('click', function(){
      if (!owned){
        if (state.money < item.cost) return;
        state.money -= item.cost;
        state.shopOwned.music.push(item.id);
        state.musicOn = true;
      } else {
        state.musicOn = !state.musicOn;
      }
      updateMusic();
      beep(660, 0.1, 'triangle');
      updateHUD();
      renderShop();
      saveProgress();
    });
    shopMusicEl.appendChild(btn);
  }
  function buyOrEquip(item, ownedKey, equipKey){
    ensureAudio();
    var owned = state.shopOwned[ownedKey].indexOf(item.id) !== -1;
    if (!owned){
      if (state.money < item.cost) return;
      state.money -= item.cost;
      state.shopOwned[ownedKey].push(item.id);
      beep(880, 0.14, 'triangle');
    } else {
      beep(660, 0.08, 'sine');
    }
    state.equipped[equipKey] = item.id;
    applySkin();
    updateHUD();
    renderShop();
    saveProgress();
  }
  function applySkin(){
    var skin = SHOP_SKINS.filter(function(s){ return s.id===state.equipped.skin; })[0];
    if (skin) potatoBtn.textContent = skin.icon;
    frameEl.setAttribute('data-papa-bg', state.equipped.background);
  }

  // =====================================================================
  // Mascotas
  // =====================================================================
  function renderPets(){
    petGridEl.innerHTML = '';
    PETS.forEach(function(pet){
      var level = state.pets[pet.id]||0;
      var owned = level > 0;
      var cost = owned ? upgradeCost(pet.levelCostBase, level-1, pet.levelGrowth) : pet.adoptCost;
      var card = document.createElement('div');
      card.className = 'papa-pet-card'+(owned?' is-owned':'');
      card.innerHTML = '<div class="papa-pet-icon">'+pet.icon+'</div>'
        +'<p class="papa-pet-name">'+pet.name+'</p>'
        +'<p class="papa-pet-desc">'+pet.desc+'</p>'
        +(owned?'<p class="papa-pet-level">Nivel '+level+'</p>':'')
        +'<button class="papa-pet-buy-btn"'+(state.money<cost?' disabled':'')+'>'+(owned?('Subir · $'+formatMoney(cost)):('Adoptar · $'+formatMoney(cost)))+'</button>';
      card.querySelector('.papa-pet-buy-btn').addEventListener('click', function(){ buyOrLevelPet(pet); });
      petGridEl.appendChild(card);
    });
  }
  function buyOrLevelPet(pet){
    ensureAudio();
    var level = state.pets[pet.id]||0;
    var cost = level>0 ? upgradeCost(pet.levelCostBase, level-1, pet.levelGrowth) : pet.adoptCost;
    if (state.money < cost) return;
    state.money -= cost;
    state.pets[pet.id] = level+1;
    beep(level>0?880:1046, 0.16, 'triangle');
    recomputeRates();
    updateHUD();
    renderPets();
    saveProgress();
  }

  // =====================================================================
  // Coleccion
  // =====================================================================
  function renderCollection(){
    collectGridEl.innerHTML = '';
    COLLECTIBLES.forEach(function(c){
      var found = !!state.collectibles[c.id];
      var card = document.createElement('div');
      card.className = 'papa-collect-card'+(found?' is-found':'');
      card.innerHTML = '<div class="papa-collect-icon">'+c.icon+'</div>'
        +'<p class="papa-collect-name">'+(found?c.name:'???')+'</p>'
        +'<p class="papa-collect-bonus">'+(found?c.desc:'Todavía no encontrada')+'</p>';
      collectGridEl.appendChild(card);
    });
  }

  // =====================================================================
  // Prestigio
  // =====================================================================
  function renderPrestige(){
    var gain = prestigeGainPreview(state.totalEarned);
    var eligible = state.totalEarned >= PRESTIGE_MIN_EARNED;
    prestigeInfoEl.innerHTML = '🌟 Papas de Prestigio: <b>'+formatMoney(state.gems)+'</b><br>'
      +'Si prestigiás ahora conseguís: <b>+'+formatMoney(gain)+'</b> 🌟<br>'
      +'Prestigiaste <b>'+state.prestigeCount+'</b> '+(state.prestigeCount===1?'vez':'veces')+'.';
    prestigeBtn.disabled = !eligible || gain<=0;
    prestigeHintEl.textContent = eligible
      ? 'Al prestigiar reiniciás tu dinero, tus zonas y las mejoras de zona, pero conservás las mejoras permanentes, tus mascotas, tu colección y tu tienda.'
      : 'Necesitás llegar a $'+formatMoney(PRESTIGE_MIN_EARNED)+' en total para poder prestigiar.';
    prestigeUpgradeListEl.innerHTML = '';
    PRESTIGE_UPGRADES.forEach(function(u){
      var level = state.prestigeLevels[u.id]||0;
      var maxed = level >= u.maxLevel;
      var cost = maxed ? 0 : upgradeCost(u.costBase, level, u.growth);
      var card = document.createElement('div');
      card.className = 'upgrade-card'+(maxed?' is-maxed':'');
      card.innerHTML = '<div class="upgrade-icon">'+u.icon+'</div>'
        +'<div class="upgrade-info"><h3>'+u.name+'</h3><p>'+u.desc+'</p>'
        +'<p class="upgrade-owned">Nivel: <b>'+level+'</b>/'+u.maxLevel+'</p></div>'
        +'<button class="upgrade-buy-btn"'+(maxed||state.gems<cost?' disabled':'')+'>'+(maxed?'MÁX':'🌟'+formatMoney(cost))+'</button>';
      if (!maxed){
        card.querySelector('.upgrade-buy-btn').addEventListener('click', function(){ buyPrestigeUpgrade(u); });
      }
      prestigeUpgradeListEl.appendChild(card);
    });
  }
  function buyPrestigeUpgrade(u){
    var level = state.prestigeLevels[u.id]||0;
    if (level >= u.maxLevel) return;
    var cost = upgradeCost(u.costBase, level, u.growth);
    if (state.gems < cost) return;
    state.gems -= cost;
    state.prestigeLevels[u.id] = level+1;
    beep(1046, 0.15, 'triangle');
    recomputeRates();
    renderPrestige();
    saveProgress();
  }
  prestigeBtn.addEventListener('click', function(){
    var gain = prestigeGainPreview(state.totalEarned);
    if (gain <= 0 || state.totalEarned < PRESTIGE_MIN_EARNED) return;
    prestigeConfirmDescEl.textContent = 'Vas a conseguir +'+formatMoney(gain)+' 🌟 Papas de Prestigio a cambio de reiniciar tu dinero, tus zonas y tus mejoras de zona.';
    prestigeConfirmOverlay.classList.remove('is-hidden');
  });
  prestigeCancelBtn.addEventListener('click', function(){ prestigeConfirmOverlay.classList.add('is-hidden'); });
  prestigeConfirmBtn.addEventListener('click', function(){
    var gain = prestigeGainPreview(state.totalEarned);
    state.gems += gain;
    state.prestigeCount += 1;
    state.money = PRESTIGE_UPGRADES[0].per*(state.prestigeLevels.impulso||0);
    state.totalEarned = 0;
    state.zoneIndex = 0;
    state.unlockedZoneIndex = 0;
    state.owned = {};
    state.economyLevels = {};
    state.luckLevels = {};
    state.missionsClaimed = {};
    clickStreak = 0;
    activeBuffs = [];
    prestigeConfirmOverlay.classList.add('is-hidden');
    applyZoneTheme();
    renderZoneScene();
    renderZoneStrip();
    recomputeRates();
    updateHUD();
    updateCrackStage();
    showTab('prestige');
    beep(1318, 0.3, 'triangle');
    showPop('🚀 ¡Prestigiaste! +'+formatMoney(gain)+' 🌟', true);
    saveProgress();
  });

  // =====================================================================
  // Guardado / carga
  // =====================================================================
  function saveProgress(){
    try {
      state.lastActive = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch(e){}
  }
  function loadProgress(){
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw){
        var data = JSON.parse(raw);
        Object.keys(state).forEach(function(k){ if (data[k] !== undefined) state[k] = data[k]; });
        if (!state.shopOwned) state.shopOwned = {skins:['clasica'], backgrounds:['atardecer'], effects:['chispas'], music:[]};
        if (!state.equipped) state.equipped = {skin:'clasica', background:'atardecer', effect:'chispas'};
        return;
      }
      migrateOldSave();
    } catch(e){}
  }
  function migrateOldSave(){
    try {
      var raw = localStorage.getItem(OLD_SAVE_KEY);
      if (!raw) return;
      var old = JSON.parse(raw);
      state.money = old.money || 0;
      state.totalEarned = old.totalEarned || state.money;
      var oldClick = old.clickOwned || [0,0,0,0];
      var oldAuto = old.autoOwned || [0,0,0,0];
      state.owned.guantes = oldClick[0]||0;
      state.owned.pala = oldClick[1]||0;
      state.owned.gallina = oldAuto[0]||0;
      state.owned.tractor = oldAuto[1]||0;
      state.economyLevels.interes = Math.min(ECONOMY_UPGRADES[0].maxLevel, old.celestialLevel||0);
      // Desbloquea retroactivamente todas las zonas que correspondan segun lo ya ganado
      for (var i=1;i<ZONES.length;i++){
        if (state.totalEarned >= ZONES[i].unlockAt) state.unlockedZoneIndex = i;
      }
    } catch(e){}
  }
  function grantOfflineEarnings(){
    var now = Date.now();
    var elapsedSec = Math.max(0, (now-state.lastActive)/1000);
    recomputeRates();
    if (elapsedSec > 10 && perSec > 0){
      var earned = perSec*elapsedSec*offlineRateMult();
      addMoney(earned);
      showPop('¡Mientras no estabas ganaste $'+formatMoney(earned)+'!', true);
    }
    state.lastActive = now;
    saveProgress();
  }

  // =====================================================================
  // Flujo principal
  // =====================================================================
  function renderAll(){
    applyZoneTheme();
    renderZoneScene();
    renderZoneStrip();
    applySkin();
    recomputeRates();
    updateHUD();
    showTab(currentTab);
    updateCrackStage();
  }

  playPapaBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    papaView.classList.remove('is-hidden');
    grantOfflineEarnings();
    renderAll();
    startPapaLoop();
    scheduleNextEvent();
  });
  backFromPapaBtn.addEventListener('click', function(){
    papaView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pausePapaLoop();
    if (eventTimer) clearTimeout(eventTimer);
    dismissEvent();
    state.lastActive = Date.now();
    saveProgress();
  });

  resetBtn.addEventListener('click', function(){
    var ok = window.confirm('¿Seguro que querés reiniciar TODO tu progreso (zonas, mejoras, prestigio, mascotas, tienda)? Esta acción no se puede deshacer.');
    if (!ok) return;
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_SAVE_KEY); } catch(e){}
    state = {
      money:0, totalEarned:0, zoneIndex:0, unlockedZoneIndex:0, owned:{},
      economyLevels:{}, luckLevels:{}, missionsClaimed:{}, gems:0, prestigeLevels:{}, prestigeCount:0,
      collectibles:{}, shopOwned:{skins:['clasica'], backgrounds:['atardecer'], effects:['chispas'], music:[]},
      equipped:{skin:'clasica', background:'atardecer', effect:'chispas'}, musicOn:false, pets:{}, lastActive:Date.now()
    };
    activeBuffs = [];
    clickStreak = 0;
    updateMusic();
    renderAll();
    saveProgress();
  });

  var lastTime = null;
  var papaLoopRunning = false;
  var hudRefreshAccum = 0;
  function startPapaLoop(){
    if (papaLoopRunning) return;
    papaLoopRunning = true;
    lastTime = null;
    requestAnimationFrame(loop);
  }
  function pausePapaLoop(){ papaLoopRunning = false; }
  function loop(ts){
    if (!papaLoopRunning) return;
    if (lastTime===null) lastTime = ts;
    var dt = Math.min(0.25, (ts-lastTime)/1000);
    lastTime = ts;
    if (perSec > 0) addMoney(perSec*dt);
    hudRefreshAccum += dt;
    if (hudRefreshAccum >= 0.2){
      hudRefreshAccum = 0;
      updateHUD();
      if (currentTab==='missions') refreshMissionProgressUI();
    }
    requestAnimationFrame(loop);
  }

  loadProgress();
  recomputeRates();
})();
