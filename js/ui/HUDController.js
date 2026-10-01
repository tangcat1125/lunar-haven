/**
 * HUDController - 遊戲主畫面 HUD 介面控制器
 * 包含：
 * 1. 頂部數據條（存糧、木材、鐵礦、銀粉、防禦警戒值）
 * 2. 右上角大月相（天幕核心，精準月相光暗與朝向）
 * 3. 底部中央 HUD（【公曆】9月29日（二） ｜ 【農曆】八月十九  虧凸月）
 */
class HUDController {
  constructor(skyRenderer) {
    this.skyRenderer = skyRenderer;
    this.topHudEl = document.getElementById('top-hud-bar');
    this.bottomHudEl = document.getElementById('bottom-calendar-hud');
    this.moonCanvas = document.getElementById('hud-moon-canvas');
    this.moonPhaseLabel = document.getElementById('hud-moon-label');
    this.calendarModalEl = document.getElementById('calendar-modal');
    this.calendarGridEl = document.getElementById('calendar-grid');
    this.calendarTitleEl = document.getElementById('calendar-modal-title');
    this.calendarSubtitleEl = document.getElementById('calendar-modal-subtitle');
    this.turnCountdownEl = document.getElementById('turn-countdown-value');
    this.turnProgressEl = document.getElementById('turn-countdown-fill');
    this.currentCalendarDate = null;

    this.initCalendarModal();
    this.initListeners();
  }

  initCalendarModal() {
    if (this.bottomHudEl) {
      this.bottomHudEl.addEventListener('click', () => this.openCalendar());
      this.bottomHudEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.openCalendar();
        }
      });
    }

    const closeButton = document.getElementById('calendar-close');
    if (closeButton) closeButton.addEventListener('click', () => this.closeCalendar());
    if (this.calendarModalEl) {
      this.calendarModalEl.addEventListener('click', (event) => {
        if (event.target === this.calendarModalEl) this.closeCalendar();
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.calendarModalEl?.classList.contains('is-open')) {
        this.closeCalendar();
      }
    });
  }

  initListeners() {
    if (!window.lunarEventBus) return;

    // 資源更新
    window.lunarEventBus.on('RESOURCE_CHANGED', (resources) => {
      this.updateResources(resources);
    });

    // 曆法與月相推進
    window.lunarEventBus.on('TIME_TICK', (data) => {
      this.updateCalendar(data);
    });

    window.lunarEventBus.on('TURN_TIMER_TICK', (data) => {
      this.updateTurnCountdown(data);
    });

    // 村民傷勢、狼化與永久離鎮都要即時顯示在頂部動態數據列。
    window.lunarEventBus.on('CASUALTY_STATUS_CHANGED', (status) => {
      this.updateCasualtyStatus(status);
    });
  }

  updateResources(res) {
    if (!this.topHudEl) return;
    const foodEl = document.getElementById('res-food');
    const woodEl = document.getElementById('res-wood');
    const ironEl = document.getElementById('res-iron');
    const silverEl = document.getElementById('res-silver');
    const potionEl = document.getElementById('res-healing-potion');
    const medicineEl = document.getElementById('res-medicine');
    const bandageEl = document.getElementById('res-bandage');
    const aconiteEl = document.getElementById('res-aconite');
    const waterEl = document.getElementById('res-water');
    const defenseValEl = document.getElementById('res-defense-val');
    const defenseFillEl = document.getElementById('defense-bar-fill');

    if (foodEl) foodEl.textContent = res.food;
    if (woodEl) woodEl.textContent = res.wood;
    if (ironEl) ironEl.textContent = res.iron;
    if (silverEl) silverEl.textContent = res.silver;
    if (potionEl) potionEl.textContent = res.healing_potion || 0;
    if (medicineEl) medicineEl.textContent = res.medicine || 0;
    if (bandageEl) bandageEl.textContent = res.bandage || 0;
    if (aconiteEl) aconiteEl.textContent = res.aconite || 0;
    if (waterEl) waterEl.textContent = res.water || 0;

    // 玩家守望點數（顯示當前累積與儲存上限）
    const apValEl = document.getElementById('res-action-points');
    if (apValEl) {
      apValEl.innerHTML = `<strong>${res.actionPoints}</strong> <span class="ap-sub">點 (每日+${res.dailyActionGain || 3})</span>`;
      if (res.actionPoints === 0) {
        apValEl.classList.add('ap-depleted');
      } else {
        apValEl.classList.remove('ap-depleted');
      }
    }

    if (defenseValEl) defenseValEl.textContent = `${res.defense}%`;
    if (defenseFillEl) {
      defenseFillEl.style.width = `${res.defense}%`;
      if (res.defense < 30) {
        defenseFillEl.style.backgroundColor = '#d32f2f'; // 危險紅
      } else if (res.defense < 60) {
        defenseFillEl.style.backgroundColor = '#fbc02d'; // 警告黃
      } else {
        defenseFillEl.style.backgroundColor = '#4caf50'; // 安全綠
      }
    }
  }

  updateCalendar(data) {
    const { solarDate, lunarInfo, phase } = data;
    this.currentCalendarDate = new Date(solarDate);

    // 底部中央雙曆 HUD 格式：【公曆】9月29日（二） ｜ 【農曆】八月十九  虧凸月
    const gregStr = window.lunarCalendar.formatGregorian(solarDate);
    const lunarStr = window.lunarCalendar.formatLunarDay(lunarInfo);

    if (this.bottomHudEl) {
      this.bottomHudEl.innerHTML = `
        <span class="cal-gregorian">【公曆】${gregStr}</span>
        <span class="cal-divider">｜</span>
        <span class="cal-lunar">【農曆】${lunarStr}</span>
        <span class="cal-phase-tag phase-${phase.id}">${phase.name}</span>
      `;
    }

    // 右上角大月相天幕核心重繪
    // 天空月亮是獨立 <img>，不能再受已移除的舊 Canvas 節點限制。
    if (this.skyRenderer) {
      this.skyRenderer.renderMoon(phase, lunarInfo.day);
    }
    if (this.moonPhaseLabel) {
      this.moonPhaseLabel.textContent = `${phase.name} (${Math.round(phase.illumination * 100)}% 照亮)`;
    }

    // 更新天幕背景光暗
    const worldSky = document.getElementById('world-sky-layer');
    if (worldSky && this.skyRenderer) {
      worldSky.style.background = this.skyRenderer.getNightSkyStyle(phase.illumination);
    }

    if (this.calendarModalEl?.classList.contains('is-open')) this.renderMonthCalendar(this.currentCalendarDate);
  }

  updateTurnCountdown(data) {
    const seconds = Math.max(0, Number(data?.remainingSeconds) || 0);
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    if (this.turnCountdownEl) {
      this.turnCountdownEl.textContent = `${minutes}:${sec.toString().padStart(2, '0')}`;
    }
    if (this.turnProgressEl) {
      const progress = Math.max(0, Math.min(100, Number(data?.progress) || 0));
      this.turnProgressEl.style.width = `${progress}%`;
    }
  }

  updateCasualtyStatus(status = {}) {
    const total = Math.max(0, Number(status.total) || 0);
    const injured = Math.max(0, Number(status.injured) || 0);
    const losses = Math.max(0, Number(status.losses) || 0);
    const totalEl = document.getElementById('res-casualties');
    const detailEl = document.getElementById('res-casualty-detail');
    const itemEl = totalEl?.closest('.casualty-res');

    if (totalEl) totalEl.textContent = total;
    if (detailEl) detailEl.textContent = losses > 0 ? `傷患 ${injured}｜失去 ${losses}` : `傷患 ${injured}`;
    if (itemEl) itemEl.title = losses > 0
      ? `村民死傷 ${total}：傷患 ${injured}，永久失去 ${losses}`
      : `村民死傷 ${total}：目前傷患 ${injured}`;
    itemEl?.classList.toggle('has-casualties', total > 0);
  }

  openCalendar() {
    if (!this.calendarModalEl) return;
    const date = this.currentCalendarDate || new Date();
    this.currentCalendarDate = new Date(date);
    this.renderMonthCalendar(this.currentCalendarDate);
    this.calendarModalEl.classList.add('is-open');
    document.body.classList.add('calendar-open');
    document.getElementById('calendar-close')?.focus();
  }

  closeCalendar() {
    if (!this.calendarModalEl) return;
    this.calendarModalEl.classList.remove('is-open');
    this.calendarModalEl.style.display = 'none';
    document.body.classList.remove('calendar-open');
    this.bottomHudEl?.focus();
  }

  renderMonthCalendar(referenceDate) {
    if (!this.calendarGridEl || !window.lunarCalendar || !window.moonPhaseCalculator) return;

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const todayKey = `${year}-${month}-${referenceDate.getDate()}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lunarToday = window.lunarCalendar.solarToLunar(referenceDate);
    const phaseToday = window.moonPhaseCalculator.calculatePhaseByLunar(lunarToday);

    if (this.calendarTitleEl) this.calendarTitleEl.textContent = `${year}年${month + 1}月`;
    if (this.calendarSubtitleEl) {
      this.calendarSubtitleEl.textContent = `目前：${window.lunarCalendar.formatGregorian(referenceDate)}｜${window.lunarCalendar.formatLunarDay(lunarToday)}｜${phaseToday.name}`;
    }

    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push('<div class="calendar-cell calendar-cell-empty" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const lunar = window.lunarCalendar.solarToLunar(date);
      const phase = window.moonPhaseCalculator.calculatePhaseByLunar(lunar);
      const dateKey = `${year}-${month}-${day}`;
      const isToday = dateKey === todayKey;
      const isCrisis = window.moonPhaseCalculator.isDarkMoonCrisisPeriod(lunar.day) || window.moonPhaseCalculator.isFullMoonCrisisPeriod(lunar.day);
      const moonDay = Math.max(1, Math.min(30, lunar.day));
      const label = `${day}日，${window.lunarCalendar.formatLunarDay(lunar)}，${phase.name}`;
      cells.push(`
        <div class="calendar-cell${isToday ? ' is-today' : ''}${isCrisis ? ' is-crisis' : ''} phase-${phase.id}" aria-label="${label}">
          <div class="calendar-gregorian-day">${day}</div>
          <div class="calendar-lunar-day">${window.lunarCalendar.formatLunarDay(lunar)}</div>
          <img class="calendar-moon-icon" src="assets/images/moon/${moonDay}.webp" alt="${phase.name}" />
          <div class="calendar-phase-name">${phase.name}</div>
        </div>`);
    }

    this.calendarGridEl.innerHTML = cells.join('');
  }
}

window.HUDController = HUDController;
