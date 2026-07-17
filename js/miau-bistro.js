(function(){
  var INGREDIENTS = [
    {id:'huevo',   name:'Huevo',   icon:'🥚'},
    {id:'leche',   name:'Leche',   icon:'🥛'},
    {id:'pescado', name:'Pescado', icon:'🐟'},
    {id:'arroz',   name:'Arroz',   icon:'🍚'},
    {id:'pan',     name:'Pan',     icon:'🍞'},
    {id:'pollo',   name:'Pollo',   icon:'🍗'},
    {id:'verdura', name:'Verdura', icon:'🥬'},
    {id:'queso',   name:'Queso',   icon:'🧀'},
    {id:'fruta',   name:'Fruta',   icon:'🍓'}
  ];
  var INGREDIENTS_BY_ID = {};
  INGREDIENTS.forEach(function(ing){ INGREDIENTS_BY_ID[ing.id] = ing; });

  var RECIPES = [
    {id:'sushi',     name:'Sushi de Atún',       icon:'🍣', cook:2.4, base:120, need:{pescado:2, arroz:1}},
    {id:'pescado',   name:'Pescadito Frito',     icon:'🐟', cook:2.0, base:100, need:{pescado:2, huevo:1}},
    {id:'batido',    name:'Batido de Leche',     icon:'🥛', cook:1.6, base:80,  need:{leche:3}},
    {id:'pastel',    name:'Pastel de Pescado',   icon:'🍰', cook:2.8, base:140, need:{huevo:2, pescado:1, leche:1}},
    {id:'sandwich',  name:'Sándwich de Pollo',   icon:'🥪', cook:2.2, base:110, need:{pan:2, pollo:1}},
    {id:'ensalada',  name:'Ensalada de Atún',    icon:'🥗', cook:1.8, base:90,  need:{pescado:1, verdura:2}},
    {id:'croquetas', name:'Croquetas de Pollo',  icon:'🧆', cook:2.3, base:115, need:{pollo:2, huevo:1}},
    {id:'postre',    name:'Postre de Fruta',     icon:'🍓', cook:1.5, base:75,  need:{fruta:3}},
    {id:'pizza',     name:'Pizza de Queso',      icon:'🍕', cook:2.6, base:130, need:{queso:2, pan:1}}
  ];
  var RECIPES_BY_ID = {};
  RECIPES.forEach(function(r){ RECIPES_BY_ID[r.id] = r; });

  var UPGRADES = [
    {id:'cat',   name:'Gato Mágico',   icon:'🐱✨', desc:'Cocina más rápido en la sartén.', cost:500},
    {id:'snake', name:'Serpiente',     icon:'🐍',   desc:'Los gatos esperan con más paciencia.', cost:500},
    {id:'tray',  name:'Bandeja Extra', icon:'🧺',   desc:'Más lugar en la ventanilla.', cost:400}
  ];

  var COLLARS = ['#e8543e', '#ffc94a', '#8fb996', '#3fa7b0'];
  var QUALITY_MULT = {perfecto:1.5, bien:1.0, crudo:0.5, quemado:0.4};
  var QUALITY_STARS = {perfecto:3, bien:2, crudo:1, quemado:1};
  var COIN_BONUS = 1.25;
  var SAVE_KEY = 'miauBistroSave';

  function getLevelConfig(n){
    return {
      time: Math.min(80, 48 + n*5),
      goal: Math.round(140*n + 20*n*n),
      slots: n < 3 ? 3 : (n < 5 ? 4 : 5)
    };
  }
  function getCookMultiplier(){ return upgrades.cat ? 0.8 : 1; }
  function getPatienceMultiplier(){ return upgrades.snake ? 1.35 : 1; }
  function getTrayCapacity(){ return 3 + (upgrades.tray ? 1 : 0); }
  function getCookDuration(recipe){ return recipe.cook * getCookMultiplier(); }

  var portalView = document.getElementById('portalView');
  var bistroView = document.getElementById('bistroView');
  var playBistroBtn = document.getElementById('playBistroBtn');
  var backFromBistroBtn = document.getElementById('backFromBistroBtn');
  var muteBtn = document.getElementById('bistroMuteBtn');
  var timeEl = document.getElementById('bistroTime');
  var scoreEl = document.getElementById('bistroScoreVal');
  var goalEl = document.getElementById('bistroGoalVal');
  var coinsEl = document.getElementById('bistroCoinsVal');
  var levelEl = document.getElementById('bistroLevelVal');
  var powerupChip = document.getElementById('powerupChip');
  var recipeGrid = document.getElementById('recipeGrid');
  var kitchenHint = document.getElementById('kitchenHint');
  var stoveIdleMsg = document.getElementById('stoveIdleMsg');
  var stoveGathering = document.getElementById('stoveGathering');
  var stoveCooking = document.getElementById('stoveCooking');
  var cancelGatherBtn = document.getElementById('cancelGatherBtn');
  var gatherIconEl = document.getElementById('gatherIcon');
  var gatherNameEl = document.getElementById('gatherName');
  var needListEl = document.getElementById('needList');
  var ingredientBankEl = document.getElementById('ingredientBank');
  var cookNowBtn = document.getElementById('cookNowBtn');
  var cookingIconEl = document.getElementById('cookingIcon');
  var cookProgressEl = document.getElementById('cookProgress');
  var sacarBtn = document.getElementById('sacarBtn');
  var trayBox = document.getElementById('trayBox');
  var customerRow = document.getElementById('customerRow');
  var startOverlay = document.getElementById('bistroStartOverlay');
  var startTitleEl = document.getElementById('bistroStartTitle');
  var startDescEl = document.getElementById('bistroStartDesc');
  var overOverlay = document.getElementById('bistroOverOverlay');
  var overTitleEl = document.getElementById('bistroOverTitle');
  var startBtn = document.getElementById('bistroStartBtn');
  var retryBtn = document.getElementById('bistroRetryBtn');
  var finalScoreEl = document.getElementById('bistroFinalScore');
  var finalCoinsEl = document.getElementById('bistroFinalCoins');
  var shopOverlay = document.getElementById('bistroShopOverlay');
  var shopTitleEl = document.getElementById('shopTitle');
  var shopCoinsValEl = document.getElementById('shopCoinsVal');
  var shopGridEl = document.getElementById('shopGrid');
  var nextLevelBtn = document.getElementById('nextLevelBtn');
  var resetLevelBtn = document.getElementById('resetLevelBtn');
  var shopResetLevelBtn = document.getElementById('shopResetLevelBtn');

  var coins = 0;
  var currentLevel = 1;
  var upgrades = {cat:false, snake:false, tray:false};
  function loadProgress(){
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw){
        var data = JSON.parse(raw);
        currentLevel = data.level || 1;
      }
    } catch(e){}
  }
  function saveProgress(){
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({level:currentLevel})); } catch(e){}
  }
  loadProgress();

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
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
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

  var bistroState = 'start';
  var levelGoal = 0;
  var shiftTimeLeft = 0;
  var bistroScore = 0;
  var stove = { stage:'idle', recipe:null, have:{}, elapsed:0 };
  var tray = [];
  var selectedTrayIndex = -1;
  var customers = [];
  var respawnTimers = [];
  var customerFillEls = [];
  var traySlotEls = [];
  var customerCardEls = [];

  var recipeButtons = RECIPES.map(function(recipe){
    var btn = document.createElement('button');
    btn.className = 'recipe-btn';
    btn.innerHTML = '<span class="r-icon">'+recipe.icon+'</span><span>'+recipe.name+'</span>';
    btn.addEventListener('click', function(){ startGathering(recipe); });
    recipeGrid.appendChild(btn);
    return btn;
  });

  var ingredientButtons = INGREDIENTS.map(function(ing){
    var btn = document.createElement('button');
    btn.className = 'ingredient-btn';
    btn.innerHTML = '<span class="i-icon">'+ing.icon+'</span><span>'+ing.name+'</span>';
    btn.addEventListener('click', function(){ addIngredient(ing.id); });
    ingredientBankEl.appendChild(btn);
    return btn;
  });

  var powerupBadgeEls = {};
  UPGRADES.forEach(function(up){
    var badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'powerup-badge';
    badge.setAttribute('aria-label', up.name);
    badge.textContent = up.icon;
    badge.addEventListener('click', function(){ showPowerupInfo(up); });
    powerupChip.appendChild(badge);
    powerupBadgeEls[up.id] = badge;
  });
  function updatePowerupBadges(){
    UPGRADES.forEach(function(up){
      powerupBadgeEls[up.id].classList.toggle('active', !!upgrades[up.id]);
    });
  }
  function showPowerupInfo(up){
    var owned = !!upgrades[up.id];
    var existing = powerupChip.querySelector('.powerup-info');
    if (existing) existing.parentNode.removeChild(existing);
    var pop = document.createElement('div');
    pop.className = 'powerup-info';
    pop.textContent = up.name+': '+up.desc+(owned ? ' ¡Activo este nivel!' : ' Compralo en la tienda.');
    powerupChip.appendChild(pop);
    setTimeout(function(){ if (pop.parentNode) pop.parentNode.removeChild(pop); }, 2400);
  }

  function buildTraySlots(){
    trayBox.innerHTML = '';
    traySlotEls = [];
    var capacity = getTrayCapacity();
    for (var i=0; i<capacity; i++){
      (function(idx){
        var slot = document.createElement('div');
        slot.className = 'tray-slot';
        slot.textContent = 'vacío';
        slot.addEventListener('click', function(){ selectTraySlot(idx); });
        trayBox.appendChild(slot);
        traySlotEls.push(slot);
      })(i);
    }
  }

  function buildCustomerSlots(count){
    customerRow.innerHTML = '';
    customerCardEls = [];
    customers = [];
    respawnTimers = [];
    customerFillEls = [];
    for (var i=0; i<count; i++){
      (function(idx){
        var card = document.createElement('div');
        card.className = 'customer-card empty';
        card.addEventListener('click', function(){ tryServe(idx); });
        customerRow.appendChild(card);
        customerCardEls.push(card);
        customers.push(null);
        respawnTimers.push(0);
        customerFillEls.push(null);
      })(i);
    }
  }

  playBistroBtn.addEventListener('click', function(){
    portalView.classList.add('is-hidden');
    bistroView.classList.remove('is-hidden');
    if (bistroState === 'play') startBistroLoop();
  });
  backFromBistroBtn.addEventListener('click', function(){
    bistroView.classList.add('is-hidden');
    portalView.classList.remove('is-hidden');
    pauseBistroLoop();
  });

  function updateTimeDisplay(){
    var s = Math.ceil(shiftTimeLeft);
    var m = Math.floor(s/60);
    var sec = s%60;
    timeEl.textContent = m+':'+(sec<10?'0':'')+sec;
  }

  function updateHUD(){
    scoreEl.textContent = bistroScore;
    goalEl.textContent = levelGoal;
    coinsEl.textContent = coins;
    levelEl.textContent = currentLevel;
  }

  function updateRecipeButtonsDisabled(){
    var disabled = stove.stage !== 'idle' || tray.length >= getTrayCapacity();
    recipeButtons.forEach(function(btn){ btn.disabled = disabled; });
    if (stove.stage === 'gathering'){
      kitchenHint.textContent = 'Juntá los ingredientes de la receta';
    } else if (stove.stage === 'cooking'){
      kitchenHint.textContent = 'Cocinando... sacalo en el momento justo';
    } else if (tray.length >= getTrayCapacity()){
      kitchenHint.textContent = '¡Entregá un plato, la bandeja está llena!';
    } else {
      kitchenHint.textContent = '';
    }
  }

  function updateStoveUI(){
    stoveIdleMsg.classList.toggle('is-hidden', stove.stage !== 'idle');
    stoveGathering.classList.toggle('is-hidden', stove.stage !== 'gathering');
    stoveCooking.classList.toggle('is-hidden', stove.stage !== 'cooking');
    if (stove.stage === 'cooking'){
      cookingIconEl.textContent = stove.recipe.icon;
    } else if (stove.stage !== 'gathering'){
      cookProgressEl.style.width = '0%';
    }
  }

  function isRecipeComplete(){
    var need = stove.recipe.need;
    return Object.keys(need).every(function(ingId){
      return (stove.have[ingId]||0) >= need[ingId];
    });
  }

  function updateGatherUI(){
    var recipe = stove.recipe;
    gatherIconEl.textContent = recipe.icon;
    gatherNameEl.textContent = recipe.name;

    needListEl.innerHTML = '';
    Object.keys(recipe.need).forEach(function(ingId){
      var need = recipe.need[ingId];
      var have = stove.have[ingId]||0;
      var ing = INGREDIENTS_BY_ID[ingId];
      var chip = document.createElement('span');
      chip.className = 'need-chip' + (have>=need ? ' done' : '');
      chip.textContent = ing.icon+' '+have+'/'+need;
      needListEl.appendChild(chip);
    });

    ingredientButtons.forEach(function(btn, i){
      var ingId = INGREDIENTS[i].id;
      var need = recipe.need[ingId] || 0;
      var have = stove.have[ingId] || 0;
      btn.disabled = need === 0 || have >= need;
      btn.classList.toggle('needed', need > 0 && have < need);
    });

    cookNowBtn.disabled = !isRecipeComplete();
  }

  function startGathering(recipe){
    if (bistroState !== 'play') return;
    if (stove.stage !== 'idle' || tray.length >= getTrayCapacity()) return;
    stove.stage = 'gathering';
    stove.recipe = recipe;
    stove.have = {};
    updateStoveUI();
    updateGatherUI();
    updateRecipeButtonsDisabled();
  }

  function addIngredient(ingId){
    if (stove.stage !== 'gathering') return;
    var need = stove.recipe.need[ingId] || 0;
    if (need === 0) return;
    var have = stove.have[ingId] || 0;
    if (have >= need) return;
    stove.have[ingId] = have + 1;
    beep(700, 0.06, 'square');
    updateGatherUI();
  }

  cancelGatherBtn.addEventListener('click', function(){
    if (stove.stage !== 'gathering') return;
    stove.stage = 'idle';
    stove.recipe = null;
    stove.have = {};
    updateStoveUI();
    updateRecipeButtonsDisabled();
  });

  cookNowBtn.addEventListener('click', function(){
    if (stove.stage !== 'gathering' || !isRecipeComplete()) return;
    stove.stage = 'cooking';
    stove.elapsed = 0;
    updateStoveUI();
    updateRecipeButtonsDisabled();
  });

  function starsFor(quality){
    var n = QUALITY_STARS[quality];
    return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3-n);
  }

  function renderTray(){
    for (var k=0; k<traySlotEls.length; k++){
      var slotEl = traySlotEls[k];
      if (k < tray.length){
        var item = tray[k];
        slotEl.className = 'tray-slot filled' + (k === selectedTrayIndex ? ' selected' : '');
        slotEl.innerHTML = '<span class="t-icon">'+item.icon+'</span><span class="tray-stars">'+starsFor(item.quality)+'</span>';
      } else {
        slotEl.className = 'tray-slot';
        slotEl.textContent = 'vacío';
      }
    }
  }

  function selectTraySlot(i){
    if (bistroState !== 'play') return;
    if (i >= tray.length) return;
    selectedTrayIndex = (selectedTrayIndex === i) ? -1 : i;
    renderTray();
  }

  function finishCooking(quality){
    var recipe = stove.recipe;
    tray.push({recipeId:recipe.id, icon:recipe.icon, quality:quality});
    stove.stage = 'idle';
    stove.recipe = null;
    stove.have = {};
    stove.elapsed = 0;
    renderTray();
    updateStoveUI();
    updateRecipeButtonsDisabled();
  }

  sacarBtn.addEventListener('click', function(){
    if (stove.stage !== 'cooking') return;
    var frac = stove.elapsed / getCookDuration(stove.recipe);
    var quality;
    if (frac < 0.4){ quality = 'crudo'; beep(300, 0.2, 'sawtooth'); }
    else if (frac < 0.62){ quality = 'bien'; beep(600, 0.15, 'sine'); }
    else if (frac <= 0.85){ quality = 'perfecto'; beep(1046, 0.18, 'triangle'); }
    else { quality = 'bien'; beep(600, 0.15, 'sine'); }
    finishCooking(quality);
  });

  function renderCustomer(slot){
    var el = customerCardEls[slot];
    var cust = customers[slot];
    el.innerHTML = '';
    if (!cust){
      el.className = 'customer-card empty';
      customerFillEls[slot] = null;
      return;
    }
    el.className = 'customer-card';
    var recipe = RECIPES_BY_ID[cust.wantId];

    var avatar = document.createElement('div');
    avatar.className = 'cat-avatar';
    avatar.style.setProperty('--collar', cust.collar);
    avatar.textContent = '🐱';

    var bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = recipe.icon;

    var track = document.createElement('div');
    track.className = 'patience-track';
    var fill = document.createElement('div');
    fill.className = 'patience-fill';
    track.appendChild(fill);

    el.appendChild(avatar);
    el.appendChild(bubble);
    el.appendChild(track);
    customerFillEls[slot] = fill;
  }

  function updatePatienceBar(slot){
    var cust = customers[slot];
    var fillEl = customerFillEls[slot];
    if (!cust || !fillEl) return;
    var frac = cust.patience / cust.maxPatience;
    fillEl.style.width = (frac*100)+'%';
    fillEl.style.background = frac > 0.5 ? 'var(--sage)' : (frac > 0.22 ? 'var(--gold)' : 'var(--tomato)');
  }

  function showFloatingPop(slot, text, positive){
    var cardEl = customerCardEls[slot];
    var pop = document.createElement('div');
    pop.className = 'floating-pop';
    pop.style.color = positive ? 'var(--sage)' : 'var(--tomato)';
    pop.textContent = text;
    cardEl.appendChild(pop);
    setTimeout(function(){ if (pop.parentNode) pop.parentNode.removeChild(pop); }, 950);
  }

  function spawnCustomer(slot){
    var recipe = RECIPES[Math.floor(Math.random()*RECIPES.length)];
    var maxPatience = (32 + Math.random()*16) * getPatienceMultiplier();
    customers[slot] = {
      wantId: recipe.id,
      patience: maxPatience,
      maxPatience: maxPatience,
      collar: COLLARS[Math.floor(Math.random()*COLLARS.length)]
    };
    renderCustomer(slot);
    updatePatienceBar(slot);
  }

  function customerLeaves(slot, happy){
    if (!happy){
      bistroScore = Math.max(0, bistroScore - 5);
      updateHUD();
    }
    customers[slot] = null;
    respawnTimers[slot] = 0.9;
    renderCustomer(slot);
  }

  function tryServe(slot){
    if (bistroState !== 'play') return;
    if (selectedTrayIndex === -1) return;
    var cust = customers[slot];
    if (!cust) return;
    var dish = tray[selectedTrayIndex];
    var match = dish.recipeId === cust.wantId;
    tray.splice(selectedTrayIndex, 1);
    selectedTrayIndex = -1;
    renderTray();
    updateRecipeButtonsDisabled();

    if (match){
      var recipe = RECIPES_BY_ID[dish.recipeId];
      var qualityMult = QUALITY_MULT[dish.quality];
      var patienceFrac = cust.patience / cust.maxPatience;
      var points = Math.round(recipe.base * qualityMult * (0.6 + 0.6*patienceFrac));
      bistroScore += points;
      coins += Math.round(points * COIN_BONUS);
      updateHUD();
      beep(880, 0.12, 'sine');
      customers[slot] = null;
      respawnTimers[slot] = 1.0;
      renderCustomer(slot);
      showFloatingPop(slot, '+'+points, true);
      if (bistroScore >= levelGoal) levelClear();
    } else {
      cust.patience = Math.max(0.1, cust.patience - cust.maxPatience*0.25);
      updatePatienceBar(slot);
      showFloatingPop(slot, '¡No era esto!', false);
      beep(160, 0.25, 'sawtooth');
    }
  }

  function startLevel(){
    bistroState = 'play';
    coins = 0;
    var cfg = getLevelConfig(currentLevel);
    levelGoal = cfg.goal;
    shiftTimeLeft = cfg.time;
    bistroScore = 0;
    tray = [];
    selectedTrayIndex = -1;
    stove = { stage:'idle', recipe:null, have:{}, elapsed:0 };
    buildTraySlots();
    buildCustomerSlots(cfg.slots);
    updateHUD();
    updateTimeDisplay();
    updatePowerupBadges();
    renderTray();
    updateStoveUI();
    updateRecipeButtonsDisabled();
    for (var i=0; i<cfg.slots; i++) spawnCustomer(i);
    startOverlay.classList.add('is-hidden');
    overOverlay.classList.add('is-hidden');
    shopOverlay.classList.add('is-hidden');
    ensureAudio();
    startBistroLoop();
  }

  function renderShop(){
    shopCoinsValEl.textContent = coins;
    shopGridEl.innerHTML = '';
    UPGRADES.forEach(function(up){
      var owned = !!upgrades[up.id];
      var card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = '<div class="shop-icon">'+up.icon+'</div>'
        +'<h3>'+up.name+'</h3>'
        +'<p>'+up.desc+'</p>'
        +'<button class="shop-buy-btn"'+((owned || coins<up.cost) ? ' disabled' : '')+'>'
        +(owned ? '✓ Activo' : ('🪙 '+up.cost))+'</button>';
      if (!owned){
        card.querySelector('.shop-buy-btn').addEventListener('click', function(){ buyUpgrade(up.id); });
      }
      shopGridEl.appendChild(card);
    });
  }

  function buyUpgrade(id){
    var up = UPGRADES.filter(function(u){ return u.id === id; })[0];
    if (upgrades[id]) return;
    if (coins < up.cost) return;
    coins -= up.cost;
    upgrades[id] = true;
    beep(1046, 0.15, 'triangle');
    updatePowerupBadges();
    renderShop();
  }

  function levelClear(){
    bistroState = 'cleared';
    pauseBistroLoop();
    upgrades = {cat:false, snake:false, tray:false};
    updatePowerupBadges();
    var bonus = Math.max(0, Math.floor(shiftTimeLeft)*2);
    coins += bonus;
    shopTitleEl.textContent = '¡Nivel '+currentLevel+' superado!';
    renderShop();
    shopOverlay.classList.remove('is-hidden');
    beep(1046, 0.2, 'triangle');
  }

  function failLevel(){
    bistroState = 'failed';
    pauseBistroLoop();
    overTitleEl.textContent = '¡Se acabó el tiempo!';
    finalScoreEl.textContent = bistroScore+'/'+levelGoal;
    finalCoinsEl.textContent = coins;
    overOverlay.classList.remove('is-hidden');
    beep(200, 0.3, 'sawtooth');
  }

  function showLevelIntro(){
    var cfg = getLevelConfig(currentLevel);
    startTitleEl.textContent = '¿Listo para el Nivel '+currentLevel+'?';
    startDescEl.textContent = 'Meta: '+cfg.goal+' puntos en '+cfg.time+' segundos. Elegí un plato, juntá los ingredientes, cocinalo en su punto y entregalo antes de que el gato se impaciente.';
    levelGoal = cfg.goal;
    shiftTimeLeft = cfg.time;
    updateHUD();
    updateTimeDisplay();
    updatePowerupBadges();
    resetLevelBtn.style.display = currentLevel > 1 ? 'inline-block' : 'none';
  }
  showLevelIntro();

  startBtn.addEventListener('click', startLevel);
  retryBtn.addEventListener('click', startLevel);
  nextLevelBtn.addEventListener('click', function(){
    currentLevel += 1;
    saveProgress();
    showLevelIntro();
    startLevel();
  });

  function resetToLevel1(){
    currentLevel = 1;
    saveProgress();
    showLevelIntro();
    startLevel();
  }
  resetLevelBtn.addEventListener('click', resetToLevel1);
  shopResetLevelBtn.addEventListener('click', resetToLevel1);

  function tick(){
    if (bistroState !== 'play') return;

    shiftTimeLeft -= 0.1;
    if (shiftTimeLeft <= 0){
      shiftTimeLeft = 0;
      updateTimeDisplay();
      failLevel();
      return;
    }
    updateTimeDisplay();

    if (stove.stage === 'cooking'){
      stove.elapsed += 0.1;
      var cookDuration = getCookDuration(stove.recipe);
      var frac = Math.min(1, stove.elapsed/cookDuration);
      cookProgressEl.style.width = (frac*100)+'%';
      if (stove.elapsed >= cookDuration){
        beep(220, 0.2, 'sawtooth');
        finishCooking('quemado');
      }
    }

    for (var i=0; i<customers.length; i++){
      if (customers[i]){
        customers[i].patience -= 0.1;
        if (customers[i].patience <= 0){
          customers[i].patience = 0;
          customerLeaves(i, false);
          continue;
        }
        updatePatienceBar(i);
      } else if (respawnTimers[i] > 0){
        respawnTimers[i] -= 0.1;
        if (respawnTimers[i] <= 0){
          spawnCustomer(i);
        }
      }
    }
  }

  var bistroInterval = null;
  function startBistroLoop(){
    if (bistroInterval) return;
    bistroInterval = setInterval(tick, 100);
  }
  function pauseBistroLoop(){
    if (bistroInterval){
      clearInterval(bistroInterval);
      bistroInterval = null;
    }
  }

  updateStoveUI();
  updateRecipeButtonsDisabled();
  renderTray();
})();

