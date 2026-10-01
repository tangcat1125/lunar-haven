/**
 * WolfRaidSystem - 朔月狼群的場景角色、可見性、柵欄、守犬與防禦單位判定。
 */
class WolfRaidSystem {
  constructor(worldContainer, characterManager, infectionTracker, economy, clockTower) {
    this.container = worldContainer;
    this.characterManager = characterManager;
    this.infectionTracker = infectionTracker;
    this.economy = economy;
    this.clockTower = clockTower;
    this.activeWolves = [];
    this.raidResolved = true;
    this.dogPatrolReady = false;
    this.defenseUnitsReady = new Set();
    this.offscreenHuntChance = 0.05;
    this.archerAccuracy = 0.5;
    this.raidType = 'DARK_MOON';
    this.fenceBroken = false;
    this.fenceBuilt = false;
    this.bindEvents();
    this.updateFenceVisibility();
  }

  bindEvents() {
    if (!window.lunarEventBus) return;
    window.lunarEventBus.on('TASK_ASSIGNED', ({ npc, task }) => {
      if (npc.id.startsWith('barnaby') && task.id === 'dog_patrol') this.dogPatrolReady = true;
      if (this.isTownDefenseTask(npc, task)) this.defenseUnitsReady.add(npc.id);
      this.updateGuardMarker();
    });
    window.lunarEventBus.on('TASK_COMPLETED', () => this.updateGuardMarker());
    window.lunarEventBus.on('GUARD_POST_REACHED', () => this.updateGuardMarker());
    window.lunarEventBus.on('PALISADE_BUILT', () => this.buildFence());
  }

  startRaid(count = 1, raidType = 'DARK_MOON') {
    this.clearWolves();
    this.raidResolved = false;
    this.raidType = raidType;
    const huntResult = this.tryOffscreenWolfHunt(count);
    count = Math.max(0, count - huntResult.killed);
    const detected = Boolean(this.clockTower?.isBeaconLit || this.dogPatrolReady || this.canSilvaUseTowerDefense());
    if (huntResult.killed) {
      window.lunarEventBus?.emit('WOLF_HUNTED_OFFSCREEN', {
        hunter: huntResult.hunter,
        killed: huntResult.killed,
        msg: `${huntResult.hunter.name}正在鎮外守護，意外獵殺了 ${huntResult.killed} 隻逼近的野狼。`
      });
    }
    if (count === 0) {
      this.raidResolved = true;
      window.lunarEventBus?.emit('CRISIS_DEFENDED', {
        type: 'DARK_MOON',
        msg: '黑森林傳來短促狼嚎後便歸於沉寂；鎮外守護者已先一步清除了威脅。',
        wolfCount: 0
      });
      return { count: 0, detected, intercepted: true };
    }
    const variants = ['wolf-scout', 'wolf-raider', 'wolf-alpha'];
    for (let i = 0; i < count; i += 1) {
      const id = variants[Math.min(i, variants.length - 1)];
      const el = document.createElement('div');
      el.className = `raid-wolf ${detected ? 'is-detected' : 'is-concealed'} ${id}`;
      el.style.left = `${2860 + i * 135}px`;
      el.style.top = `${555 + (i % 3) * 18}px`;
      el.innerHTML = `<img src="assets/images/wolves/${id}.png" alt="入侵野狼" />`;
      this.container.appendChild(el);
      this.activeWolves.push({ el, x: 2860 + i * 135, speed: 330 + i * 35 });
    }

    if (window.soundEngine) window.soundEngine.playWolfHowl();
    if (count >= 2 && this.fenceBuilt) this.breakFence();
    if (window.lunarEventBus) {
      window.lunarEventBus.emit('WOLF_RAID_STARTED', { count, detected, raidType });
    }
    return { count, detected };
  }

  tick(dt) {
    if (!this.activeWolves.length) return;
    const stepDt = Math.min(0.1, Math.max(Number(dt) || 0, 1 / 60));
    this.activeWolves.forEach((wolf, index) => {
      wolf.x -= wolf.speed * stepDt;
      wolf.el.style.left = `${wolf.x}px`;
      wolf.el.style.transform = `translateY(${Math.sin(wolf.x / 28 + index) * 3}px)`;
    });
    if (!this.raidResolved && this.activeWolves.some(wolf => wolf.x <= 2050)) this.resolveRaid();
    if (this.raidResolved && this.activeWolves.every(wolf => wolf.x < -260)) this.clearWolves();
  }

  resolveRaid() {
    this.raidResolved = true;
    let remaining = this.activeWolves.length;
    let detected = Boolean(this.clockTower?.isBeaconLit || this.canSilvaUseTowerDefense());
    const barnaby = this.characterManager.getAllNPCs().find(npc => npc.id.startsWith('barnaby') && !npc.isInfected);

    if (this.fenceBuilt && !this.fenceBroken) {
      remaining = Math.max(0, remaining - 1);
    }

    if (this.dogPatrolReady) {
      detected = true;
      remaining = Math.max(0, remaining - 1);
      if (window.soundEngine) window.soundEngine.playDogBark();
      this.revealWolves();
    } else if (remaining === 1 && barnaby && !barnaby.isInfected) {
      remaining = 0;
    }

    if (this.activeWolves.length >= 2 && barnaby && !barnaby.isInfected) {
      barnaby.setInfected(true);
      this.infectionTracker.registerBite(barnaby);
    }

    const activeDefenders = [...this.defenseUnitsReady].filter(id => {
      const npc = this.characterManager.getNPC(id);
      return npc?.currentTask && this.isTownDefenseTask(npc, npc.currentTask);
    });
    if (detected && remaining > 0 && this.attemptTowerArcherShot('wolf')) {
      remaining -= 1;
    }
    if (detected && activeDefenders.length > 0 && remaining > 0) {
      const stopped = Math.min(remaining, activeDefenders.length);
      remaining -= stopped;
      for (let i = 0; i < stopped; i += 1) {
        if (window.soundEngine) window.setTimeout(() => window.soundEngine.playArrowShot(), i * 220);
      }
    }

    const victims = remaining > 0 ? this.infectionTracker.biteRandomVillagers(Math.min(2, remaining), ['barnaby']) : [];
    const defended = remaining === 0;
    if (defended) this.economy.modifyDefense(-5);
    else this.economy.modifyDefense(-12 * remaining);

    const msg = defended
      ? `狼群遭到${this.dogPatrolReady ? '巡邏犬與' : ''}${activeDefenders.length ? '已啟動的城鎮守備' : '防線'}攔截，沒有居民受傷。`
      : `黑暗中的狼群突破街道，${victims.map(v => v.name).join('、') || '守備線'}遭到攻擊。`;
    window.lunarEventBus?.emit(defended ? 'CRISIS_DEFENDED' : 'CRISIS_BREACHED', {
      type: this.raidType, msg, wolfCount: this.activeWolves.length
    });

    this.activeWolves.forEach(wolf => {
      wolf.speed = 620;
      wolf.el.classList.add('is-retreating');
    });
    this.dogPatrolReady = false;
    this.defenseUnitsReady.clear();
    this.updateGuardMarker();
    this.clockTower?.extinguishBeacon();
  }

  revealWolves() {
    this.activeWolves.forEach(({ el }) => {
      el.classList.remove('is-concealed');
      el.classList.add('is-detected');
    });
  }

  isTownDefenseTask(npc, task) {
    return npc?.id === 'raymond' && ['task_patrol_guard', 'task_curfew_control'].includes(task?.baseTaskId || task?.id);
  }

  isTowerArcherTask(npc, task) {
    return npc?.id === 'silva' && (task?.baseTaskId || task?.id) === 'task_tower_archer';
  }

  // 席爾瓦真的走到教堂鐘塔箭位後，才算村內有效守衛。
  canSilvaUseTowerDefense() {
    const silva = this.characterManager.getNPC('silva');
    return Boolean(silva?.currentTask
      && this.isTowerArcherTask(silva, silva.currentTask)
      && silva.state === 'GUARDING');
  }

  attemptTowerArcherShot(target) {
    if (!this.canSilvaUseTowerDefense()) return false;
    const hunter = this.characterManager.getNPC('silva');
    if (window.soundEngine) window.soundEngine.playArrowShot();
    const hit = Math.random() < this.archerAccuracy;
    const targetName = target === 'werewolf' ? '狼化者' : '野狼';
    window.lunarEventBus?.emit(hit ? 'TOWER_ARCHER_SHOT' : 'TOWER_ARCHER_MISSED', {
      target, hunter,
      msg: hit
        ? `席爾瓦在教堂鐘塔放箭，命中了闖入村落的${targetName}。`
        : `席爾瓦在鐘塔拉弓，箭矢擦過了${targetName}的身側。`
    });
    return hit;
  }

  updateGuardMarker() {
    const marker = document.getElementById('tower-guard-badge');
    if (!marker) return;
    const raymond = this.characterManager.getNPC('raymond');
    const raymondIsGuarding = Boolean(raymond?.currentTask
      && this.isTownDefenseTask(raymond, raymond.currentTask)
      && raymond.state === 'GUARDING');
    const hasVillageGuard = this.canSilvaUseTowerDefense() || raymondIsGuarding;
    marker.style.display = hasVillageGuard ? 'block' : 'none';
    marker.textContent = this.canSilvaUseTowerDefense() ? '🏹 鐘塔守衛' : '🛡 村口守衛';
  }

  // 只有正在鎮外執行守護任務的獵手有極低機率先行獵殺一隻狼；不能取代城內守備。
  tryOffscreenWolfHunt(count) {
    const hunters = this.characterManager.getAllNPCs().filter(npc => {
      const taskId = npc.currentTask?.baseTaskId || npc.currentTask?.id;
      return npc.state === 'OFFSCREEN_WORKING'
        && npc.id === 'silva'
        && ['task_set_traps', 'task_scout_forest'].includes(taskId);
    });
    const hunter = hunters.find(() => Math.random() < this.offscreenHuntChance);
    return hunter && count > 0 ? { hunter, killed: 1 } : { hunter: null, killed: 0 };
  }

  breakFence() {
    if (!this.fenceBuilt || this.fenceBroken) return;
    this.fenceBroken = true;
    document.getElementById('forest-palisade')?.classList.add('is-broken');
    window.lunarEventBus?.emit('PALISADE_BROKEN', {
      msg: '兩隻以上的野狼同時撞上木柵，森林防線遭到破壞！'
    });
  }

  buildFence() {
    this.fenceBuilt = true;
    this.fenceBroken = false;
    const fence = document.getElementById('forest-palisade');
    fence?.classList.remove('is-broken');
    this.updateFenceVisibility();
  }

  updateFenceVisibility() {
    const fence = document.getElementById('forest-palisade');
    if (fence) fence.classList.toggle('is-built', this.fenceBuilt);
  }

  clearWolves() {
    this.activeWolves.forEach(({ el }) => el.remove());
    this.activeWolves = [];
  }
}

window.WolfRaidSystem = WolfRaidSystem;
