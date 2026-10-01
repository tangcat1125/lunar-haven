/**
 * CrisisCycleSystem - 月相因果閉環與危機判定系統
 * 核心機制：
 * 1. 朔月至暗期（廿八～初二）：野狼大舉進攻 ➜ 防守失敗鎮民被咬傷
 * 2. 狼毒潛伏期（初三～十三）：附子草採集與解藥賽跑
 * 3. 滿月銀月期（十四～十六）：未癒傷者翻面狼化暴走 ➜ 衛兵消耗銀器壓制
 * 4. 隨時比對教師自訂結束條件
 */
class CrisisCycleSystem {
  constructor(economy, infectionTracker, clockTower, wolfRaidSystem = null) {
    this.economy = economy;
    this.infectionTracker = infectionTracker;
    this.clockTower = clockTower;
    this.wolfRaidSystem = wolfRaidSystem;

    // 當前模擬日期（預設同步當前真實日期）
    this.currentDate = new Date(window.LUNAR_CONFIG?.INITIAL_DATE || new Date(2026, 8, 29));
    this.lunarInfo = null;
    this.currentPhase = null;

    this.simSpeed = 1; // 模擬倍速
    this.timeAccumulator = 0;
    this.dayDuration = 25; // 每 25 秒推進 1 天（課堂放置適配）
    this.lastTimerSecond = null;
    this.isPaused = false;

    // 統計指標
    this.stats = {
      daysPassed: 0,
      darkDefendsSuccess: 0,
      fullDefendsSuccess: 0,
      collectedPhases: new Set(),
      totalCasualties: 0,
      villagerLosses: 0
    };

    // 預設教師結束條件（6大模式）
    this.activeEndingRule = {
      mode: 'full_cycle',
      title: '1. 進行一個完整月相流程',
      subIndex: 0,
      subOption: { label: '指定半週期精華（15 天，農曆初一至十五）', targetDays: 15 }
    };
    this.elapsedSeconds = 0;
    this.lastSkyAnomalyDay = -99;
    // 十四到十六都視為滿月期，但同一個農曆月只能觸發一次狼化。
    this.lastFullMoonCycleKey = null;

    window.lunarEventBus?.on('CRISIS_DEFENDED', data => {
      if (data?.type === 'DARK_MOON') this.stats.darkDefendsSuccess++;
    });
    window.lunarEventBus?.on('VILLAGERS_BITTEN', () => this.emitCasualtyStatus());
    window.lunarEventBus?.on('PATIENT_CURED', () => this.emitCasualtyStatus());
    window.lunarEventBus?.on('WEREWOLVES_SPAWNED', () => this.emitCasualtyStatus());
    window.lunarEventBus?.on('NPC_REMOVED_FROM_TOWN', ({ npc }) => this.recordVillagerLoss(npc));
  }

  init() {
    this.updateLunarAndPhase();
    this.emitTurnTimer(true);
    this.emitCasualtyStatus();
  }

  isVillager(npc) {
    return Boolean(npc && npc.data?.category !== 'animal');
  }

  recordVillagerLoss(npc) {
    if (!this.isVillager(npc) || npc.casualtyRecorded) return;
    npc.casualtyRecorded = true;
    this.stats.villagerLosses += 1;
    this.emitCasualtyStatus();
  }

  getCasualtyStatus() {
    const residents = this.infectionTracker?.characterManager?.getAllNPCs?.() || [];
    const injured = residents.filter(npc => this.isVillager(npc) && npc.isInfected && !npc.isWerewolf).length;
    const transformed = residents.filter(npc => this.isVillager(npc) && npc.isWerewolf && !npc.isEliminated).length;
    const losses = this.stats.villagerLosses;
    return { total: injured + transformed + losses, injured, transformed, losses };
  }

  emitCasualtyStatus() {
    window.lunarEventBus?.emit('CASUALTY_STATUS_CHANGED', this.getCasualtyStatus());
  }

  setActiveEndingRule(rule) {
    this.activeEndingRule = rule;
    console.log('[CrisisCycleSystem] 教師結束條件更新:', rule);
    if (window.lunarEventBus) {
      window.lunarEventBus.emit('ENDING_RULE_CHANGED', {
        rule: this.activeEndingRule,
        goalText: this.getGoalStatusText()
      });
    }
  }

  getGoalStatusText() {
    const r = this.activeEndingRule;
    if (!r) return '課堂守望中';
    switch (r.mode) {
      case 'full_cycle': {
        const target = r.subOption?.targetDays || 15;
        return `月相流程: ${this.stats.daysPassed} / ${target} 天`;
      }
      case 'casualty': {
        const threshold = r.subOption?.threshold || 3;
        return `傷亡限制: ${this.stats.totalCasualties} / ${threshold} 人`;
      }
      case 'defend_count': {
        const total = this.stats.darkDefendsSuccess + this.stats.fullDefendsSuccess;
        const target = r.subOption?.targetCount || 2;
        return `抵禦次數: ${total} / ${target} 次`;
      }
      case 'codex': {
        return `月相圖鑑: ${this.stats.collectedPhases.size} / 8 種`;
      }
      case 'zero_defense': {
        return `極限存活: 防禦 ${this.economy.resources.defense}%`;
      }
      case 'timed': {
        const mins = r.subOption?.minutes || 15;
        const remSec = Math.max(0, mins * 60 - Math.floor(this.elapsedSeconds));
        const m = Math.floor(remSec / 60);
        const s = remSec % 60;
        return `課堂限時: ${m}:${s < 10 ? '0' : ''}${s}`;
      }
      default:
        return r.title;
    }
  }

  updateLunarAndPhase() {
    this.lunarInfo = window.lunarCalendar.solarToLunar(this.currentDate);
    this.currentPhase = window.moonPhaseCalculator.calculatePhaseByLunar(this.lunarInfo);

    // 紀錄圖鑑收集
    this.stats.collectedPhases.add(this.currentPhase.id);

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('TIME_TICK', {
        solarDate: this.currentDate,
        lunarInfo: this.lunarInfo,
        phase: this.currentPhase,
        daysPassed: this.stats.daysPassed
      });
    }
  }

  tick(dt) {
    if (this.isPaused) return;

    this.elapsedSeconds += dt;
    this.timeAccumulator += dt * this.simSpeed;

    this.emitTurnTimer();

    if (this.timeAccumulator >= this.dayDuration) {
      this.timeAccumulator -= this.dayDuration;
      this.advanceOneDay();
    }

    // 檢查教師限時條件
    // 教師設定尚未載入時也不能中斷主迴圈；否則角色移動與所有動畫會在第一幀後停止。
    const timeLimitMinutes = this.teacherPreset?.timeLimitMinutes || this.activeEndingRule?.subOption?.minutes;
    if (timeLimitMinutes && this.elapsedSeconds >= timeLimitMinutes * 60) {
      this.triggerGameOver('課堂限時結束');
    }
  }

  getTurnTiming() {
    const remainingGameSeconds = Math.max(0, this.dayDuration - this.timeAccumulator);
    const remainingSeconds = Math.ceil(remainingGameSeconds / Math.max(1, this.simSpeed));
    return {
      remainingSeconds,
      progress: (this.timeAccumulator / this.dayDuration) * 100,
      speed: this.simSpeed
    };
  }

  emitTurnTimer(force = false) {
    const timing = this.getTurnTiming();
    if (!force && timing.remainingSeconds === this.lastTimerSecond) return;
    this.lastTimerSecond = timing.remainingSeconds;
    window.lunarEventBus?.emit('TURN_TIMER_TICK', timing);
  }

  advanceOneDay() {
    if (typeof window.soundEngine?.playPageTurn === 'function') window.soundEngine.playPageTurn();
    this.stats.daysPassed++;
    // 公曆推進一天
    this.currentDate.setDate(this.currentDate.getDate() + 1);
    this.updateLunarAndPhase();
    this.emitTurnTimer(true);

    // 每日破曉：未用完點數自動存至下一回合，並補給每日點數！
    const currentAP = this.economy.addDailyTurnPoints();

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('DAY_ADVANCED', {
        daysPassed: this.stats.daysPassed,
        lunarInfo: this.lunarInfo,
        actionPoints: currentAP,
        msg: `破曉來臨！點數已存入新回合，當前守望點數：${currentAP} 點（含每日補給 +${this.economy.dailyActionGain}）`
      });
    }

    const day = this.lunarInfo.day;

    // 天象異常不是固定月例事件；暗月狼群活動會顯著提高通報機率。
    this.maybeTriggerSkyAnomaly(day);

    // 1. 朔月至暗期判定（廿八～初二）
    if (day === 1 || day === 30 || day === 29) {
      this.onDarkMoonCrisis();
    } else if (window.moonPhaseCalculator.isFullMoonCrisisPeriod(day)) {
      // 2. 滿月銀月期判定（十四～十六）；不能只押在十五，避免玩家跨日跳過異變。
      const cycleKey = `${this.lunarInfo.year}-${this.lunarInfo.month}-${this.lunarInfo.isLeap ? 'leap' : 'regular'}`;
      if (this.lastFullMoonCycleKey !== cycleKey) {
        this.lastFullMoonCycleKey = cycleKey;
        this.onFullMoonCrisis();
      }
    } else {
      // 即使不是特殊月夜，飢餓野狼仍可能偷越林線；機率低但不能被忽略。
      this.maybeTriggerWanderingWolfRaid();
    }

    // 3. 檢查教師結束條件
    this.checkEndingConditions();
  }

  maybeTriggerSkyAnomaly(lunarDay) {
    if (this.stats.daysPassed - this.lastSkyAnomalyDay < 10) return false;
    const darkMoon = lunarDay === 1 || lunarDay === 29 || lunarDay === 30;
    const chance = darkMoon ? 0.24 : 0.02;
    if (Math.random() >= chance) return false;

    const manager = this.infectionTracker.characterManager;
    const available = manager.getAllNPCs().filter(npc => !npc.currentTask && npc.state !== 'OFFSCREEN_WORKING');
    const hidden = available.filter(npc => !npc.isPresent);
    const candidates = hidden.length ? hidden : available;
    if (!candidates.length) return false;
    const reporter = candidates[Math.floor(Math.random() * candidates.length)];
    if (!reporter.isPresent) reporter.enterScene(reporter.isForestRotator() ? 'right' : null);
    this.lastSkyAnomalyDay = this.stats.daysPassed;
    window.lunarEventBus?.emit('SKY_ANOMALY_REPORTED', {
      reporter,
      darkMoon,
      msg: `${reporter.name}匆匆入城：天空有異狀，星月運行得比往常更快！${darkMoon ? '黑森林的狼嚎也隨著異象逼近。' : ''}`
    });
    return true;
  }

  // 朔月野狼入侵判定（狼沒有出現，自然不會出來咬傷居民）
  onDarkMoonCrisis() {
    // 檢查暗月群狼今夜是否現身
    const wolfAppearance = this.checkDarkMoonWolfAppearance();

    if (!wolfAppearance.appeared) {
      // 狼未出現：全鎮平安，自然不會咬傷任何居民
      if (window.lunarEventBus) {
        window.lunarEventBus.emit('CRISIS_DEFENDED', {
          type: 'DARK_MOON_PEACE',
          msg: `🌿 暗月靜謐之夜：${wolfAppearance.reason} 小鎮安然無恙，無居民被咬傷！`
        });
      }
      return;
    }

    // 無月夜只啟動狼嚎；是否能看見狼與反擊，交由烽火、守犬與防禦單位判定。
    const roll = Math.random();
    const wolfCount = roll < 0.55 ? 1 : (roll < 0.88 ? 2 : 3);
    this.wolfRaidSystem?.startRaid(wolfCount, 'DARK_MOON');
  }

  maybeTriggerWanderingWolfRaid() {
    if (!this.wolfRaidSystem?.raidResolved || Math.random() >= 0.08) return false;
    this.wolfRaidSystem.startRaid(1, 'WANDERING_WOLF');
    window.lunarEventBus?.emit('WANDERING_WOLF_SPOTTED', {
      msg: '平常的夜色裡也傳來急促狼嚎：一隻野狼正由黑森林衝向村口。'
    });
    return true;
  }

  // 判定暗月夜野狼是否現身
  checkDarkMoonWolfAppearance() {
    return { appeared: true, reason: '無月夜的黑森林傳來狼嚎，狼隻正由最右側林道逼近。' };
  }

  // 滿月狼人異變
  onFullMoonCrisis() {
    const towerArcherReady = this.wolfRaidSystem?.canSilvaUseTowerDefense();
    this.clockTower.ringBell('silver');
    this.clockTower.extinguishBeacon();

    // 檢查未癒傷患狼化
    const infected = this.infectionTracker.characterManager.getInfectedNPCs();
    if (infected.length > 0) {
      this.infectionTracker.triggerFullMoonTransform();
      if (towerArcherReady && this.wolfRaidSystem?.attemptTowerArcherShot('werewolf')) {
        this.infectionTracker.eliminateWerewolfByArcher('silva', 1, false);
      }
      const activeWerewolves = this.infectionTracker.characterManager.getWerewolfNPCs();
      this.stats.totalCasualties += infected.length;

      // 檢查衛兵是否有銀器壓制
      if (activeWerewolves.length === 0) {
        if (window.lunarEventBus) {
          window.lunarEventBus.emit('CRISIS_DEFENDED', {
            type: 'FULL_MOON',
            msg: '鐘塔烽火照亮滿月廣場，席爾瓦的箭矢阻止了最後一名狼化者，危機沒有蔓延。'
          });
        }
      } else if (this.economy.resources.silver_swords > 0) {
        this.economy.consume({ silver_swords: 1 });
        activeWerewolves.forEach(npc => npc.suppressWerewolf());
        if (window.lunarEventBus) {
          window.lunarEventBus.emit('CRISIS_DEFENDED', {
            type: 'FULL_MOON',
            msg: '衛隊長雷蒙拔出銀質短劍，及時壓制了狂暴的狼人，並成功實施拘束！'
          });
        }
      } else {
        this.infectionTracker.processWerewolfRampageDay();
        this.economy.modifyDefense(-35);
        if (window.lunarEventBus) {
          window.lunarEventBus.emit('CRISIS_BREACHED', {
            type: 'FULL_MOON',
            msg: '缺乏銀器兵刃！異變狼人撕裂防線，小鎮陷入巨大混亂！'
          });
        }
      }
    } else {
      this.stats.fullDefendsSuccess++;
      if (window.lunarEventBus) {
        window.lunarEventBus.emit('CRISIS_DEFENDED', {
          type: 'FULL_MOON',
          msg: '所有傷患已在滿月前獲解藥救治，銀月平靜照徹石階，今夜無人異變！'
        });
      }
    }

    // 滿月的亮光也會把森林邊緣的狼引到鎮外；狼人與野狼可同時威脅村落。
    if (this.wolfRaidSystem?.raidResolved) this.wolfRaidSystem.startRaid(1, 'FULL_MOON_WOLF');
  }

  checkEndingConditions() {
    const r = this.activeEndingRule;
    if (!r) return;

    // 1. 進行一個完整月相流程
    if (r.mode === 'full_cycle') {
      const targetDays = r.subOption?.targetDays || 15;
      if (this.stats.daysPassed >= targetDays) {
        this.triggerGameOver(`達成月相流程目標（已完成 ${this.stats.daysPassed} 天觀測）`);
        return;
      }
    }

    // 2. 鎮民死傷／狼化超過指定人數
    if (r.mode === 'casualty') {
      const threshold = r.subOption?.threshold || 3;
      if (this.stats.totalCasualties >= threshold) {
        this.triggerGameOver(`小鎮狼化傷亡達門檻（${this.stats.totalCasualties} / ${threshold} 人）宣告失守`);
        return;
      }
    }

    // 3. 成功抵禦指定次數的危機
    if (r.mode === 'defend_count') {
      const totalDefends = this.stats.darkDefendsSuccess + this.stats.fullDefendsSuccess;
      const targetCount = r.subOption?.targetCount || 2;
      if (totalDefends >= targetCount) {
        this.triggerGameOver(`成功抵禦預定危機次數（${totalDefends} / ${targetCount} 次）小鎮得救！`);
        return;
      }
    }

    // 4. 集齊全套月相觀察圖鑑
    if (r.mode === 'codex') {
      if (this.stats.collectedPhases.size >= 8) {
        this.triggerGameOver('成功集齊全部 8 大關鍵月相觀察圖鑑與曆法對照！');
        return;
      }
    }

    // 5. 小鎮繁榮防禦值降至歸零
    if (r.mode === 'zero_defense') {
      if (this.economy.resources.defense <= 0) {
        this.triggerGameOver('小鎮防禦警戒值歸零，設施全毀，小鎮失守');
        return;
      }
    }

    // 6. 課堂限時模式
    if (r.mode === 'timed') {
      const targetSec = (r.subOption?.minutes || 15) * 60;
      if (this.elapsedSeconds >= targetSec) {
        this.triggerGameOver(`課堂倒數限時結束（已達 ${r.subOption?.minutes} 分鐘）`);
        return;
      }
    }
  }

  triggerGameOver(reason) {
    this.isPaused = true;
    if (window.lunarEventBus) {
      window.lunarEventBus.emit('GAME_OVER_CONDITION_MET', {
        reason: reason,
        stats: this.getEvaluationSummary()
      });
    }
  }

  getEvaluationSummary() {
    return {
      daysPassed: this.stats.daysPassed,
      lunarDate: window.lunarCalendar.formatLunarDay(this.lunarInfo),
      gregorianDate: window.lunarCalendar.formatGregorian(this.currentDate),
      collectedCount: this.stats.collectedPhases.size,
      totalBitten: this.infectionTracker.stats.totalBitten,
      totalCured: this.infectionTracker.stats.totalCured,
      totalTransformed: this.infectionTracker.stats.totalTransformed,
      defenseSuccessCount: this.stats.darkDefendsSuccess + this.stats.fullDefendsSuccess,
      finalDefense: this.economy.resources.defense,
      finalMorale: this.economy.resources.morale
    };
  }
}

window.CrisisCycleSystem = CrisisCycleSystem;
