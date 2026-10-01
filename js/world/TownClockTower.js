/**
 * TownClockTower - 中央哥德式教堂鐘塔控制器
 * 管理鐘擺鳴響動畫、塔頂烽火光效與聖鐘警報觸發
 */
class TownClockTower {
  constructor(towerEl) {
    this.el = towerEl;
    this.isBeaconLit = false;
    this.isBellsRinging = false;
    this.ringTimeout = null;
  }

  // 點燃鐘塔大烽火（朔月防禦）
  lightBeacon() {
    this.isBeaconLit = true;
    if (this.el) {
      this.el.classList.add('beacon-active');
    }
  }

  extinguishBeacon() {
    this.isBeaconLit = false;
    if (this.el) {
      this.el.classList.remove('beacon-active');
    }
  }

  // 敲響大鐘動畫
  ringBell(type = 'daily') {
    if (this.el) {
      this.el.classList.add('bell-swinging');
      if (this.ringTimeout) clearTimeout(this.ringTimeout);
      this.ringTimeout = setTimeout(() => {
        if (this.el) this.el.classList.remove('bell-swinging');
      }, 3500);
    }

    if (window.soundEngine) {
      if (type === 'dark') {
        window.soundEngine.playDarkMoonAlarm();
      } else if (type === 'silver') {
        window.soundEngine.playFullMoonSilverBell();
      } else {
        window.soundEngine.playDailyBell();
      }
    }
  }
}

window.TownClockTower = TownClockTower;
