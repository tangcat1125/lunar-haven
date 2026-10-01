/**
 * TeacherPanelUI - 教師課堂設定與結束條件面板
 * 免密碼直接開啟！支援 6 大結束條件與子項目即時拉選
 */
class TeacherPanelUI {
  constructor(crisisSystem) {
    this.crisisSystem = crisisSystem;
    this.modalEl = document.getElementById('teacher-modal');
    this.currentMode = 'full_cycle';
    this.selectedSubIndex = 0;

    this.initListeners();
  }

  initListeners() {
    if (!window.lunarEventBus) return;

    window.lunarEventBus.on('OPEN_TEACHER_PANEL', () => {
      this.open();
    });

    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl || e.target.classList.contains('close-modal-btn')) {
          this.close();
        }
      });
    }
  }

  open() {
    if (!this.modalEl) return;
    this.renderSettingsPanel();
    this.modalEl.style.display = 'flex';
  }

  renderSettingsPanel() {
    const bodyEl = this.modalEl.querySelector('.modal-content-body');
    if (!bodyEl) return;

    const presets = window.LUNAR_TEACHER_PRESETS || [];
    const activePreset = this.crisisSystem.activeEndingRule || presets[0];

    // 主下拉選單選項
    const mainOptionsHtml = presets.map((p) => `
      <option value="${p.mode}" ${p.mode === activePreset.mode ? 'selected' : ''}>${p.title}</option>
    `).join('');

    bodyEl.innerHTML = `
      <div class="teacher-panel-inner">
        <div class="panel-header-row">
          <h3>⚙️ 課堂教學目標與遊戲結束條件設定</h3>
          <button class="close-x-btn close-modal-btn">✕</button>
        </div>
        <p class="panel-desc">直接在此下拉選擇本堂課的結束與評量條件（免密碼，隨選即套用）：</p>

        <!-- 1. 主要結束條件下拉選單 -->
        <div class="form-group">
          <label>▼ 主要結束條件下拉選單：</label>
          <select id="select-ending-preset" class="teacher-select">
            ${mainOptionsHtml}
          </select>
          <div id="preset-detail-tip" class="preset-detail-tip"></div>
        </div>

        <!-- 2. 子設定動態下拉選單 -->
        <div class="form-group" id="sub-option-group">
          <label id="sub-option-label">▼ 詳細門檻 / 規格下拉選單：</label>
          <select id="select-sub-option" class="teacher-select"></select>
        </div>

        <!-- 3. 目前小鎮狀態即時對照 -->
        <div class="current-town-status-card">
          <div class="status-col">
            <span class="sc-label">目前守望進度</span>
            <span class="sc-val" id="status-days-display">第 ${this.crisisSystem.stats.daysPassed} 天 (${window.lunarCalendar.formatLunarDay(this.crisisSystem.lunarInfo)})</span>
          </div>
          <div class="status-col">
            <span class="sc-label">狼化傷亡人數</span>
            <span class="sc-val" id="status-casualties-display">${this.crisisSystem.stats.totalCasualties} 人</span>
          </div>
          <div class="status-col">
            <span class="sc-label">成功抵禦次數</span>
            <span class="sc-val" id="status-defends-display">${this.crisisSystem.stats.darkDefendsSuccess + this.crisisSystem.stats.fullDefendsSuccess} 次</span>
          </div>
          <div class="status-col">
            <span class="sc-label">月相圖鑑收集</span>
            <span class="sc-val" id="status-codex-display">${this.crisisSystem.stats.collectedPhases.size} / 8</span>
          </div>
        </div>

        <!-- 按鈕操作列 -->
        <div class="form-action-row">
          <button id="btn-test-instant-settle" class="paper-btn test-btn" title="免等待，直接觸發學習單結算視窗">⚡ 立即測試結算單</button>
          <button id="btn-save-teacher-settings" class="paper-btn save-btn">確認套用結束條件</button>
          <button class="paper-btn close-modal-btn">返回遊戲</button>
        </div>
      </div>
    `;

    const mainSelect = document.getElementById('select-ending-preset');
    const subSelect = document.getElementById('select-sub-option');
    const tipEl = document.getElementById('preset-detail-tip');

    // 依據主選單動態更新子選單
    const updateSubOptions = (mode, selectIndex = 0) => {
      const p = presets.find(item => item.mode === mode) || presets[0];
      tipEl.textContent = p.description;

      if (!p.subOptions || p.subOptions.length === 0) {
        document.getElementById('sub-option-group').style.display = 'none';
        return;
      }

      document.getElementById('sub-option-group').style.display = 'block';
      subSelect.innerHTML = p.subOptions.map((sub, idx) => `
        <option value="${idx}" ${idx === selectIndex ? 'selected' : ''}>${sub.label}</option>
      `).join('');
    };

    // 初始化
    const initMode = activePreset.mode || presets[0].mode;
    const initSubIdx = activePreset.subIndex !== undefined ? activePreset.subIndex : (presets.find(p => p.mode === initMode)?.defaultSubIndex || 0);
    updateSubOptions(initMode, initSubIdx);

    mainSelect.addEventListener('change', () => {
      const newMode = mainSelect.value;
      const targetP = presets.find(p => p.mode === newMode);
      updateSubOptions(newMode, targetP?.defaultSubIndex || 0);
    });

    // 儲存套用
    const btnSave = document.getElementById('btn-save-teacher-settings');
    btnSave.addEventListener('click', () => {
      const mode = mainSelect.value;
      const subIdx = parseInt(subSelect.value || '0', 10);
      const targetPreset = presets.find(p => p.mode === mode);
      const chosenSub = targetPreset.subOptions ? targetPreset.subOptions[subIdx] : null;

      const newRule = {
        mode: mode,
        title: targetPreset.title,
        description: targetPreset.description,
        subIndex: subIdx,
        subOption: chosenSub
      };

      this.crisisSystem.setActiveEndingRule(newRule);
      this.close();
    });

    // 立即測試結算
    const btnTest = document.getElementById('btn-test-instant-settle');
    btnTest.addEventListener('click', () => {
      this.close();
      this.crisisSystem.triggerGameOver('教師手動觸發課堂即時結算測試');
    });
  }

  close() {
    if (this.modalEl) this.modalEl.style.display = 'none';
  }
}

window.TeacherPanelUI = TeacherPanelUI;
