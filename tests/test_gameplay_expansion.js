const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`✓ ${message}`);
};

console.log('--- 擴充系統測試開始 ---');

const requiredAssets = [
  'assets/audio/voice/page-turn.mp3',
  'assets/audio/voice/wolf-howl.mp3',
  'assets/audio/voice/dog-bark.mp3',
  'assets/audio/voice/church-bell.mp3',
  'assets/audio/voice/arrow-shot.mp3',
  'assets/audio/music/watchmans-toll.mp3',
  'assets/images/wolves/wolf-scout.png',
  'assets/images/wolves/wolf-raider.png',
  'assets/images/wolves/wolf-alpha.png',
  'assets/images/landmarks/forest-palisade.png',
  'assets/images/ui/chronicle-book.webp',
  'assets/images/ui/learning-parchment.webp',
  'assets/images/landing/landing-village-bottom.webp',
  'assets/images/backgrounds/world-panorama-no-church.png',
  'assets/images/characters/animals/standees/barnaby-werewolf.png',
  'assets/images/characters/standees/villager-werewolf.png'
];
requiredAssets.forEach(rel => assert(fs.existsSync(path.join(root, rel)), `資產存在：${rel}`));

const nonEnglishPaths = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  if (/[^\x00-\x7F]/.test(entry.name)) nonEnglishPaths.push(path.join(dir, entry.name));
  if (entry.isDirectory()) walk(path.join(dir, entry.name));
});
walk(root);
assert(nonEnglishPaths.length === 0, '所有檔案與資料夾名稱皆為英文／ASCII');

const crisis = read('js/systems/CrisisCycleSystem.js');
assert(crisis.includes("ringBell('silver')"), '滿月啟動鐘聲');
assert(!crisis.includes("ringBell('dark')") && !crisis.includes("ringBell('daily')"), '朔月與平日不會自動敲鐘');
assert(crisis.includes('wolfRaidSystem?.startRaid'), '無月危機會啟動狼群場景');

const wolfRaid = read('js/systems/WolfRaidSystem.js');
assert(wolfRaid.includes('dogPatrolReady') && wolfRaid.includes('playDogBark'), '守犬巡邏能吠叫並揭露狼群');
assert(wolfRaid.includes('breakFence()') && wolfRaid.includes('activeWolves.length >= 2'), '兩隻以上狼群會破壞木柵並咬傷守犬');
assert(wolfRaid.includes('fenceBuilt = false') && wolfRaid.includes("'PALISADE_BUILT'"), '柵欄開局不存在，完成建造任務後才出現');
assert(wolfRaid.includes('offscreenHuntChance = 0.05') && wolfRaid.includes('tryOffscreenWolfHunt'), '鎮外獵手執勤時僅以低機率先行獵狼');
assert(wolfRaid.includes('isTownDefenseTask') && wolfRaid.includes('if (detected && activeDefenders.length > 0'), '城鎮守備須啟動且先發現狼群才可斬殺');
assert(wolfRaid.includes('canSilvaUseTowerDefense') && wolfRaid.includes('playArrowShot'), '席爾瓦與鐘塔烽火可聯動射箭攔狼');
assert(wolfRaid.includes('task_tower_archer') && wolfRaid.includes('archerAccuracy = 0.5'), '席爾瓦可駐守鐘塔並以五成準度射擊');

const taskSystem = read('js/systems/TaskSystem.js');
assert(taskSystem.includes('workDays = 1') && taskSystem.includes('value * days'), '任務支援 1 至 4 天並等比例計算成本與產出');
assert(taskSystem.includes('CHURCH_SUPPLY_DELIVERED') && taskSystem.includes('task_fetch_water'), '取水與藥草成果會送入教堂');
assert(taskSystem.includes('RESOURCE_SHORTAGE') && taskSystem.includes('dispatchWorkshopTask'), '資源不足時會提示並支援工坊緊急調度');

const workshopUi = read('js/ui/WorkshopDispatchUI.js');
assert(workshopUi.includes("bakery") && workshopUi.includes("blacksmith") && workshopUi.includes("church") && workshopUi.includes("forest"), '四座工坊皆有對應的專才補給調度');
assert(workshopUi.includes('workshop_bake_rations') && workshopUi.includes('workshop_prepare_medicine'), '麵包與教堂補給任務已納入工坊調度');

const npc = read('js/entities/NPC.js');
assert(npc.includes('summonForWorkshop') && npc.includes('this.setPresent(true)'), '工坊只召回既有 NPC，不建立重複角色');
assert(npc.includes('getWerewolfPath') && npc.includes('getInfectedImagePath'), '受咬守犬與狼化居民會切換為專屬狀態立繪');

const resourceEconomy = read('js/systems/ResourceEconomy.js');
assert(resourceEconomy.includes('water: 2'), '資源系統包含教堂清水');

const storyJournal = read('js/systems/StoryJournal.js');
assert(storyJournal.includes('SKY_ANOMALY_REPORTED') && storyJournal.includes('CHURCH_SUPPLY_DELIVERED'), '故事讀本會記錄天空異象與教堂補給');
assert(storyJournal.includes('WOLF_HUNTED_OFFSCREEN'), '故事讀本會記錄鎮外守護者獵狼');
assert(storyJournal.includes('composeChapter') && storyJournal.includes('月痕小鎮第一次把命運'), '古書以連續敘事呈現決策、人力與後果，而非重複月相日誌');
assert(storyJournal.includes("event.type !== 'daybreak'") && storyJournal.includes('例行破曉不構成故事章節'), '古書會排除純例行破曉，避免重複湊篇幅');
assert(storyJournal.includes('narrativize') && storyJournal.includes('一段時日'), '古卷會把回合與數量資訊轉成故事語言');

const soundEngine = read('js/core/SoundEngine.js');
assert(soundEngine.includes('watchmans-toll.mp3') && soundEngine.includes('setBgmVolume') && soundEngine.includes('startBackgroundMusic'), '背景音樂預設啟用並支援音量控制與瀏覽器手勢續播');

const hud = read('js/ui/HUDController.js');
assert(hud.includes('this.skyRenderer.renderMoon(phase, lunarInfo.day)') && hud.includes('updateTurnCountdown'), '天空月相隨農曆日更新，HUD 顯示回合倒數');
assert(hud.includes('CASUALTY_STATUS_CHANGED') && hud.includes('updateCasualtyStatus'), 'HUD 動態顯示村民死傷與傷患狀態');

assert(crisis.includes('emitTurnTimer') && crisis.includes('remainingSeconds'), '回合時間依遊戲速度推進並廣播剩餘秒數');
assert(crisis.includes('villagerLosses') && crisis.includes('getCasualtyStatus'), '死傷統計會涵蓋受傷、狼化與永久離鎮的村民');

assert(crisis.includes('maybeTriggerSkyAnomaly') && crisis.includes('darkMoon ? 0.24 : 0.02'), '隨機天空異象在暗月狼群期間提高機率');
assert(crisis.includes('maybeTriggerWanderingWolfRaid') && crisis.includes('Math.random() >= 0.08'), '一般夜晚仍有低機率的野狼突襲');
assert(crisis.includes('isFullMoonCrisisPeriod(day)') && crisis.includes('lastFullMoonCycleKey'), '滿月期十四至十六都能觸發一次狼人化，避免跨日漏判');

const manager = read('js/entities/CharacterManager.js');
assert(manager.includes("id: 'barnaby_patrol_2'") && manager.includes("duplicateOf: 'barnaby'"), '只有犬隻可重複出現，且池中最多兩隻');

const infection = read('js/systems/InfectionTracker.js');
assert(infection.includes('healing_potion: 1, medicine: 1, bandage: 1'), '禱告治療消耗藥水、藥品與紗布');
assert(infection.includes('werewolfDaysRemaining = 3'), '狼人暴走期設定為三天');
assert(infection.includes('eliminateWerewolfByArcher') && infection.includes('removeFromTown'), '高塔箭手可永久移除狼化居民');
assert(infection.includes('biteRandomVillagers(1, [npc.id], npc)') && infection.includes("n.data?.category !== 'animal'"), '狼人暴走時會咬傷一名人類村民，犬隻維持狼群攻擊規則');

const incidentUi = read('js/ui/IncidentSnapshotUI.js');
assert(incidentUi.includes('VILLAGERS_BITTEN') && incidentUi.includes('incident-photo-frame') && incidentUi.includes('attacker?.isWerewolf'), '咬傷事件會以血痕快照呈現給玩家，並辨識狼人襲擊者');
assert(wolfRaid.includes("task_tower_archer") && wolfRaid.includes('archerAccuracy = 0.5') && wolfRaid.includes('updateGuardMarker'), '鐘塔箭手在抵達箭位後以五成準度守衛村落');

const landing = read('js/ui/LandingPageUI.js');
assert(landing.includes('landing-education-level') && landing.includes('landing-ending-mode'), '入口可選學習階段與遊戲結束方式');

const main = read('js/main.js');
assert(main.includes('btn-end-class-session') && main.includes('提前結束本局'), '課堂限時模式可由教師手動結束並產出報告');

const report = read('js/ui/SettlementReportUI.js');
assert(report.includes('chronicle-book-view') && report.includes('learning-radar'), '結尾包含古書紀錄與星芒學習圖');
assert(report.includes('getNarrativeEnding') && report.includes('getChronicleClosing'), '古卷結尾以村落與月光敘事，不直接顯示數字');
assert(report.includes('exportChronicleText') && report.includes('exportStorybook') && report.includes('drawing-box'), '結局頁可匯出鎮史文字與可列印的繪本創作版');

console.log('--- 擴充系統測試 PASS ---');
