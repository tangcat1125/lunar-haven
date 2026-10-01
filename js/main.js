/**
 * main.js - 遊戲主進入點
 * 協調所有模組生命週期，驅動主要渲染與心跳循環
 * 保證純本地 double-click（file:///）無任何 CORS 阻塞
 */
window.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化底層音效與狀態機
  const eventBus = window.lunarEventBus;
  const sound = window.soundEngine;
  const stateMachine = window.gameStateMachine;

  // 背景音樂預設啟用；受瀏覽器策略限制時，音效引擎會等第一次玩家操作後自動接續。
  sound?.startBackgroundMusic();

  // 2. 初始化天幕動態渲染器（僅保留天空中的月亮）
  const skyRenderer = new window.SkyRenderer();

  // 3. 初始化世界捲軸
  const viewport = document.getElementById('world-viewport');
  const worldContainer = document.getElementById('world-track');
  const scroller = new window.WorldScroller(viewport, worldContainer, {
    worldWidth: window.LUNAR_CONFIG.WORLD_WIDTH,
    initialScroll: 650
  });

  // 4. 初始化鐘塔
  const clockTowerEl = document.getElementById('church-clock-tower');
  const clockTower = new window.TownClockTower(clockTowerEl);

  // 5. 初始化經濟與角色體系
  const economy = new window.ResourceEconomy();
  const characterManager = new window.CharacterManager(worldContainer);
  characterManager.init();

  // 6. 初始化機制系統
  const infectionTracker = new window.InfectionTracker(characterManager, economy);
  const wolfRaidSystem = new window.WolfRaidSystem(worldContainer, characterManager, infectionTracker, economy, clockTower);
  const taskSystem = new window.TaskSystem(economy);
  const crisisSystem = new window.CrisisCycleSystem(economy, infectionTracker, clockTower, wolfRaidSystem);
  crisisSystem.init();
  const storyJournal = new window.StoryJournal();

  // 7. 初始化 UI 視圖
  const hudController = new window.HUDController(skyRenderer);
  hudController.updateCasualtyStatus(crisisSystem.getCasualtyStatus());
  const dialogueUI = new window.DialogueBoxUI(taskSystem, infectionTracker);
  const workshopDispatchUI = new window.WorkshopDispatchUI(taskSystem, characterManager);
  const incidentSnapshotUI = new window.IncidentSnapshotUI();
  const settlementUI = new window.SettlementReportUI(storyJournal);

  // 8. 廣播初始資源狀態
  economy.emitChange();

  // 9. 入口導引頁面生命週期
  const landingContainer = document.getElementById('landing-page-container');
  const landingUI = new window.LandingPageUI(landingContainer, (setup = {}) => {
    window.LUNAR_CONFIG.EDUCATION_LEVEL = setup.educationLevel || 'elementary';
    crisisSystem.setActiveEndingRule(setup.endingRule || crisisSystem.activeEndingRule);
    const endClassButton = document.getElementById('btn-end-class-session');
    if (endClassButton) endClassButton.style.display = crisisSystem.activeEndingRule?.mode === 'timed' ? 'inline-flex' : 'none';
    stateMachine.transition('PLAYING');
  });

  const updateGoalDisplay = () => {
    const goalEl = document.getElementById('hud-goal-text');
    if (goalEl && crisisSystem) {
      goalEl.textContent = `🎯 ${crisisSystem.getGoalStatusText()}`;
    }
  };
  eventBus.on('ENDING_RULE_CHANGED', updateGoalDisplay);
  eventBus.on('TIME_TICK', updateGoalDisplay);
  updateGoalDisplay();

  const btnNextDay = document.getElementById('btn-next-day');
  if (btnNextDay) {
    btnNextDay.addEventListener('click', () => {
      crisisSystem.advanceOneDay();
      if (sound) sound.playClick();
    });
  }

  const btnToggleSpeed = document.getElementById('btn-toggle-speed');
  if (btnToggleSpeed) {
    let speeds = [1, 2, 5];
    let sIdx = 0;
    btnToggleSpeed.addEventListener('click', () => {
      sIdx = (sIdx + 1) % speeds.length;
      crisisSystem.simSpeed = speeds[sIdx];
      btnToggleSpeed.textContent = `⏩ ${speeds[sIdx]}x`;
      crisisSystem.emitTurnTimer(true);
      if (sound) sound.playClick();
    });
  }

  const btnEndClassSession = document.getElementById('btn-end-class-session');
  btnEndClassSession?.addEventListener('click', () => {
    if (crisisSystem.activeEndingRule?.mode !== 'timed') return;
    crisisSystem.triggerGameOver('教師選擇在課堂限時模式提前結束本局');
    sound?.playPageTurn();
  });

  const bgmToggle = document.getElementById('btn-bgm-toggle');
  const bgmVolume = document.getElementById('bgm-volume');
  const bgmVolumeLabel = document.getElementById('bgm-volume-label');
  const renderBgmState = (state = sound?.getBgmState?.()) => {
    if (!state) return;
    if (bgmToggle) {
      bgmToggle.textContent = state.enabled ? '♫' : '🔇';
      bgmToggle.classList.toggle('is-muted', !state.enabled);
      bgmToggle.title = state.enabled ? '關閉背景音樂' : '開啟背景音樂';
    }
    if (bgmVolume) bgmVolume.value = String(Math.round(state.volume * 100));
    if (bgmVolumeLabel) bgmVolumeLabel.textContent = `${Math.round(state.volume * 100)}%`;
  };
  bgmToggle?.addEventListener('click', () => {
    sound?.toggleBackgroundMusic();
    renderBgmState();
  });
  bgmVolume?.addEventListener('input', (event) => {
    sound?.setBgmVolume(Number(event.target.value) / 100);
    renderBgmState();
  });
  eventBus?.on('BGM_STATE_CHANGED', renderBgmState);
  renderBgmState();

  // 11. 主遊戲心跳循環 (Game Loop)
  let lastTimestamp = performance.now();
  function gameLoop(currentTimestamp) {
    const dt = (currentTimestamp - lastTimestamp) / 1000;
    lastTimestamp = currentTimestamp;

    try {
      const gameState = stateMachine.getState();
      const landingVisible = landingContainer && getComputedStyle(landingContainer).display !== 'none';

      // 只要已離開入口頁，角色就必須持續更新；角色移動不能被其他系統例外中斷。
      if (!landingVisible) {
        characterManager.tick(dt);
        wolfRaidSystem.tick(dt);
      }

      if (gameState === 'PLAYING') {
        // 月相曆法與危機推進
        crisisSystem.tick(dt);
      }
    } catch (error) {
      // 單一機制故障不能殺死 requestAnimationFrame，否則全鎮角色會永久停住。
      console.error('[GameLoop] frame update failed:', error);
    }

    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // 全域引用綁定，便於教學示範與偵錯
  window.lunarHaven = {
    crisisSystem,
    economy,
    characterManager,
    infectionTracker,
    wolfRaidSystem,
    storyJournal,
    clockTower,
    scroller,
    sound,
    workshopDispatchUI,
    incidentSnapshotUI
  };

  console.log('🌕 《月痕小鎮》（Lunar Haven）引擎初始化完畢，支援本機雙擊秒速開箱！');
});
