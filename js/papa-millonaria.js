(function(){
  var SAVE_KEY = 'papaMillonariaSave';
  var GOAL = 1000000;
  var BREAK_THRESHOLD = 20;

  var CLICK_UPGRADES = [
    {id:'guantes',      name:'Guantes de Recolector', icon:'🧤', value:1,  cost:25},
    {id:'pala',         name:'Pala de Acero',         icon:'⛏️', value:4,  cost:300},
    {id:'cosechadora',  name:'Cosechadora Manual',    icon:'🌾', value:15, cost:3500},
    {id:'guanteDorado', name:'Guante Dorado',         icon:'✨', value:60, cost:40000}
  ];
  var AUTO_UPGRADES = [
    {id:'gallina',      name:'Gallina Picoteadora',     icon:'🐔', value:1,   cost:50},
    {id:'tractor',      name:'Tractor',                 icon:'🚜', value:5,   cost:600},
    {id:'fabrica',      name:'Fábrica de Puré',         icon:'🏭', value:25,  cost:6000},
    {id:'exportadora',  name:'Exportadora Internacional', icon:'🚀', value:120, cost:60000}
  ];
  var CELESTIAL_BASE_COST = 500;
  var CELESTIAL_COST_GROWTH = 1.2;
  var UPGRADE_COST_GROWTH = 1.15;

  function formatMoney(n){
    return Math.floor(n).toLocaleString('es-AR');
  }

  function upgradeCost(base, owned, growth){
    return Math.ceil(base * Math.pow(growth, owned));
  }

  var portalView = document.getElementById('portalView');
  var papaView = document.getElementById('papaView');
  var playPapaBtn = document.getElementById('playPapaBtn');
  var backFromPapaBtn = document.getElementById('backFromPapaBtn');
  var muteBtn = document.getElementById('papaMuteBtn');
  var moneyEl = document.getElementById('papaMoneyVal');
  var perClickEl = document.getElementById('papaPerClickVal');
  var perSecEl = document.getElementById('papaPerSecVal');
  var multiplierEl = document.getElementById('papaMultiplierVal');
  var goalFillEl = document.getElementById('papaGoalFill');
  var potatoBtn = document.getElementById('potatoBtn');
  var potatoCracks = document.getElementById('potatoCracks');
  var chickenIcon = document.getElementById('chickenIcon');
  var papaMain = document.querySelector('#papaView .papa-main');
  var clickUpgradeListEl = document.getElementById('clickUpgradeList');
  var autoUpgradeListEl = document.getElementById('autoUpgradeList');
  var celestialLevelEl = document.getElementById('celestialLevel');
  var celestialBuyBtn = document.getElementById('celestialBuyBtn');

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

  var money = 0;
  var totalEarned = 0;
  var clickOwned = CLICK_UPGRADES.map(function(){ return 0; });
  var autoOwned = AUTO_UPGRADES.map(function(){ return 0; });
  var celestialLevel = 0;
  var goalReached = false;
  var lastActive = Date.now();
  var clickStreak = 0;

  var perClick = 1;
  var perSec = 0;
  var multiplier = 1;

  function recomputeRates(){
    var base = 1;
    CLICK_UPGRADES.forEach(function(up, i){ base += up.value * clickOwned[i]; });
    multiplier = 1 + celestialLevel*0.1;
    perClick = base * multiplier;

    var autoBase = 0;
    AUTO_UPGRADES.forEach(function(up, i){ autoBase += up.value * autoOwned[i]; });
    perSec = autoBase * multiplier;
  }

  function addMoney(amount){
    money += amount;
    totalEarned += amount;
    if (!goalReached && totalEarned >= GOAL){
      goalReached = true;
      showPop('¡Sos millonario! 🎉', true);
      beep(1046, 0.15, 'triangle');
      setTimeout(function(){ beep(1318, 0.2, 'triangle'); }, 140);
    }
  }

  function updateHUD(){
    moneyEl.textContent = formatMoney(money);
    perClickEl.textContent = formatMoney(perClick);
    perSecEl.textContent = formatMoney(perSec);
    multiplierEl.textContent = multiplier.toFixed(1);
    var pct = Math.min(100, (totalEarned/GOAL)*100);
    goalFillEl.style.width = pct+'%';
  }

  function showPop(text, isBonus){
    var pop = document.createElement('div');
    pop.className = 'click-pop' + (isBonus ? ' bonus' : '');
    pop.textContent = text;
    pop.style.left = (50 + (Math.random()*30-15)) + '%';
    papaMain.appendChild(pop);
    setTimeout(function(){ if (pop.parentNode) pop.parentNode.removeChild(pop); }, 900);
  }

  function updateCrackStage(){
    var stage = Math.min(4, Math.floor((clickStreak/BREAK_THRESHOLD)*4));
    potatoCracks.className = 'potato-cracks' + (stage>0 ? ' stage-'+stage : '');
  }

  potatoBtn.addEventListener('click', function(){
    ensureAudio();
    addMoney(perClick);
    showPop('+'+formatMoney(perClick), false);
    beep(500+Math.random()*200, 0.05, 'sine');
    clickStreak += 1;

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
    refreshBuyButtonStates();
    saveProgress();
  });

  function renderClickUpgrades(){
    clickUpgradeListEl.innerHTML = '';
    CLICK_UPGRADES.forEach(function(up, i){
      var owned = clickOwned[i];
      var cost = upgradeCost(up.cost, owned, UPGRADE_COST_GROWTH);
      var card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = '<div class="upgrade-icon">'+up.icon+'</div>'
        +'<div class="upgrade-info"><h3>'+up.name+'</h3>'
        +'<p>+'+formatMoney(up.value)+' por click</p>'
        +'<p class="upgrade-owned">Tenés: <b>'+owned+'</b></p></div>'
        +'<button class="upgrade-buy-btn"'+(money<cost?' disabled':'')+'>$'+formatMoney(cost)+'</button>';
      card.querySelector('.upgrade-buy-btn').addEventListener('click', function(){ buyClickUpgrade(i); });
      clickUpgradeListEl.appendChild(card);
    });
  }

  function renderAutoUpgrades(){
    autoUpgradeListEl.innerHTML = '';
    AUTO_UPGRADES.forEach(function(up, i){
      var owned = autoOwned[i];
      var cost = upgradeCost(up.cost, owned, UPGRADE_COST_GROWTH);
      var card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = '<div class="upgrade-icon">'+up.icon+'</div>'
        +'<div class="upgrade-info"><h3>'+up.name+'</h3>'
        +'<p>+'+formatMoney(up.value)+' pesos/seg</p>'
        +'<p class="upgrade-owned">Tenés: <b>'+owned+'</b></p></div>'
        +'<button class="upgrade-buy-btn"'+(money<cost?' disabled':'')+'>$'+formatMoney(cost)+'</button>';
      card.querySelector('.upgrade-buy-btn').addEventListener('click', function(){ buyAutoUpgrade(i); });
      autoUpgradeListEl.appendChild(card);
    });
  }

  function renderCelestial(){
    var cost = upgradeCost(CELESTIAL_BASE_COST, celestialLevel, CELESTIAL_COST_GROWTH);
    celestialLevelEl.textContent = celestialLevel;
    celestialBuyBtn.textContent = '$'+formatMoney(cost);
    celestialBuyBtn.disabled = money < cost;
  }

  function renderAll(){
    renderClickUpgrades();
    renderAutoUpgrades();
    renderCelestial();
    updateChicken();
  }

  function updateChicken(){
    chickenIcon.classList.toggle('active', autoOwned[0] > 0);
  }

  function refreshBuyButtonStates(){
    CLICK_UPGRADES.forEach(function(up, i){
      var cost = upgradeCost(up.cost, clickOwned[i], UPGRADE_COST_GROWTH);
      var card = clickUpgradeListEl.children[i];
      var btn = card && card.querySelector('.upgrade-buy-btn');
      if (btn) btn.disabled = money < cost;
    });
    AUTO_UPGRADES.forEach(function(up, i){
      var cost = upgradeCost(up.cost, autoOwned[i], UPGRADE_COST_GROWTH);
      var card = autoUpgradeListEl.children[i];
      var btn = card && card.querySelector('.upgrade-buy-btn');
      if (btn) btn.disabled = money < cost;
    });
    var ccost = upgradeCost(CELESTIAL_BASE_COST, celestialLevel, CELESTIAL_COST_GROWTH);
    celestialBuyBtn.disabled = money < ccost;
  }

  function buyClickUpgrade(i){
    var up = CLICK_UPGRADES[i];
    var cost = upgradeCost(up.cost, clickOwned[i], UPGRADE_COST_GROWTH);
    if (money < cost) return;
    money -= cost;
    clickOwned[i] += 1;
    beep(880, 0.12, 'triangle');
    recomputeRates();
    updateHUD();
    renderAll();
    saveProgress();
  }

  function buyAutoUpgrade(i){
    var up = AUTO_UPGRADES[i];
    var cost = upgradeCost(up.cost, autoOwned[i], UPGRADE_COST_GROWTH);
    if (money < cost) return;
    money -= cost;
    autoOwned[i] += 1;
    beep(880, 0.12, 'triangle');
    recomputeRates();
    updateHUD();
    renderAll();
    saveProgress();
  }

  celestialBuyBtn.addEventListener('click', function(){
    var cost = upgradeCost(CELESTIAL_BASE_COST, celestialLevel, CELESTIAL_COST_GROWTH);
    if (money < cost) return;
    money -= cost;
    celestialLevel += 1;
    beep(1046, 0.18, 'triangle');
    recomputeRates();
    updateHUD();
    renderAll();
    saveProgress();
  });

  function saveProgress(){
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        money: money,
        totalEarned: totalEarned,
        clickOwned: clickOwned,
        autoOwned: autoOwned,
        celestialLevel: celestialLevel,
        goalReached: goalReached,
        lastActive: Date.now()
      }));
    } catch(e){}
  }

  function loadProgress(){
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw){
        var data = JSON.parse(raw);
        money = data.money || 0;
        totalEarned = data.totalEarned || money;
        clickOwned = data.clickOwned || CLICK_UPGRADES.map(function(){ return 0; });
        autoOwned = data.autoOwned || AUTO_UPGRADES.map(function(){ return 0; });
        celestialLevel = data.celestialLevel || 0;
        goalReached = !!data.goalReached;
        lastActive = data.lastActive || Date.now();
      }
    } catch(e){}
  }

  function grantOfflineEarnings(){
    var now = Date.now();
    var elapsedSec = Math.max(0, (now-lastActive)/1000);
    recomputeRates();
    if (elapsedSec > 10 && perSec > 0){
      var earned = perSec*elapsedSec;
      addMoney(earned);
      showPop('¡Mientras no estabas ganaste $'+formatMoney(earned)+'!', true);
    }
    lastActive = now;
    saveProgress();
  }

  playPapaBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    papaView.classList.remove('is-hidden');
    grantOfflineEarnings();
    updateHUD();
    renderAll();
    startPapaLoop();
  });
  backFromPapaBtn.addEventListener('click', function(){
    papaView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pausePapaLoop();
    lastActive = Date.now();
    saveProgress();
  });

  var lastTime = null;
  var papaLoopRunning = false;
  function startPapaLoop(){
    if (papaLoopRunning) return;
    papaLoopRunning = true;
    lastTime = null;
    requestAnimationFrame(loop);
  }
  function pausePapaLoop(){
    papaLoopRunning = false;
  }
  function loop(ts){
    if (!papaLoopRunning) return;
    if (lastTime===null) lastTime = ts;
    var dt = Math.min(0.25, (ts-lastTime)/1000);
    lastTime = ts;
    if (perSec > 0){
      addMoney(perSec*dt);
      updateHUD();
      refreshBuyButtonStates();
    }
    requestAnimationFrame(loop);
  }

  loadProgress();
  recomputeRates();
  updateHUD();
  renderAll();
  updateCrackStage();
})();
