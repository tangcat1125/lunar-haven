/**
 * ResourceEconomy - 資源經濟與防禦警戒值中樞
 * 追蹤存糧、木材、鐵礦、銀粉、附子草、解藥與防禦警戒度
 */
class ResourceEconomy {
  constructor() {
    this.resources = {
      food: 12,
      wood: 8,
      iron: 6,
      silver: 4,
      defense: 65,      // 防禦警戒值 (0~100)
      morale: 80,       // 小鎮士氣繁榮度 (0~100)
      aconite: 1,       // 附子草
      water: 2,         // 教堂蓄水（取水任務補充）
      antidote: 0,      // 解藥
      holy_water: 0,    // 聖水
      healing_potion: 1,// 禱告治療藥水
      medicine: 1,      // 修道院藥品
      bandage: 1,       // 包紮紗布
      silver_swords: 0, // 銀質短劍
      resin: 1,         // 松脂
      actionPoints: 3,  // 當前累積守望點數
      dailyActionGain: 3, // 每日補給點數
      maxStorageActionPoints: 12 // 點數儲存上限
    };
    this.dailyActionGain = window.LUNAR_CONFIG?.DAILY_ACTION_POINTS || 3;
    this.maxStorageActionPoints = window.LUNAR_CONFIG?.MAX_STORAGE_ACTION_POINTS || 12;
    this.resources.actionPoints = this.dailyActionGain;
    this.resources.dailyActionGain = this.dailyActionGain;
    this.resources.maxStorageActionPoints = this.maxStorageActionPoints;
  }

  hasActionPoints() {
    return this.resources.actionPoints > 0;
  }

  consumeActionPoint() {
    if (this.resources.actionPoints > 0) {
      this.resources.actionPoints--;
      this.emitChange();
      return this.resources.actionPoints;
    }
    return 0;
  }

  // 每一回合（每一天）結算：未用完的點數存起來，並補給每日點數！
  addDailyTurnPoints() {
    this.resources.actionPoints = Math.min(
      this.maxStorageActionPoints,
      this.resources.actionPoints + this.dailyActionGain
    );
    this.emitChange();
    return this.resources.actionPoints;
  }

  canAfford(cost) {
    if (!cost) return true;
    for (const [res, amount] of Object.entries(cost)) {
      if ((this.resources[res] || 0) < amount) {
        return false;
      }
    }
    return true;
  }

  consume(cost) {
    if (!this.canAfford(cost)) return false;
    for (const [res, amount] of Object.entries(cost)) {
      this.resources[res] -= amount;
    }
    this.emitChange();
    return true;
  }

  add(reward) {
    if (!reward) return;
    for (const [res, amount] of Object.entries(reward)) {
      if (this.resources[res] !== undefined) {
        this.resources[res] += amount;
      } else {
        this.resources[res] = amount;
      }
    }
    // 邊界限制
    if (this.resources.defense > 100) this.resources.defense = 100;
    if (this.resources.morale > 100) this.resources.morale = 100;
    this.emitChange();
  }

  setDefense(val) {
    this.resources.defense = Math.max(0, Math.min(100, val));
    this.emitChange();
  }

  modifyDefense(delta) {
    this.setDefense(this.resources.defense + delta);
  }

  emitChange() {
    if (window.lunarEventBus) {
      window.lunarEventBus.emit('RESOURCE_CHANGED', { ...this.resources });
    }
  }

  getSnapshot() {
    return { ...this.resources };
  }
}

window.ResourceEconomy = ResourceEconomy;
