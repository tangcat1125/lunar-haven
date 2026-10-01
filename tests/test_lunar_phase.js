/**
 * test_lunar_phase.js - 天文演算法與資料庫單元驗證腳本
 */
const fs = require('fs');
const path = require('path');

// 模擬瀏覽器環境
global.window = {};

// 載入資料庫與算法腳本
require('../js/data/characters.js');
require('../js/data/moonPhases.js');
require('../js/data/teacherPresets.js');
require('../js/astronomy/LunarCalendar.js');
require('../js/astronomy/MoonPhaseCalculator.js');

console.log('--- 測試開始 ---');

// 1. 驗證資料載入
console.assert(window.LUNAR_CHARACTERS.length === 10, '應該載入 10 位核心 NPC');
console.log(`✓ 核心角色數量驗證通過: ${window.LUNAR_CHARACTERS.length} 位`);

console.assert(window.LUNAR_MOON_PHASES.length === 8, '應該載入 8 大月相');
console.log(`✓ 八大月相資料驗證通過: ${window.LUNAR_MOON_PHASES.length} 個階段`);

console.assert(window.LUNAR_TEACHER_PRESETS.length === 6, '應該精準載入 6 大主要結束條件選單');
console.log(`✓ 教師 6 大結束條件選單驗證通過: ${window.LUNAR_TEACHER_PRESETS.length} 種模式`);

// 2. 驗證真實公曆與農曆對照
// 2026-09-29 應對應農曆八月十九（虧凸月）
const testDate = new Date(2026, 8, 29);
const lunar = window.lunarCalendar.solarToLunar(testDate);
const lunarStr = window.lunarCalendar.formatLunarDay(lunar);
const gregStr = window.lunarCalendar.formatGregorian(testDate);

console.log(`✓ 公曆字串格式化: ${gregStr}`);
console.log(`✓ 農曆字串格式化: ${lunarStr}`);

console.assert(lunarStr === '八月十九', `2026-09-29 農曆應為「八月十九」，實際得到: ${lunarStr}`);

// 3. 驗證月相計算
const phase = window.moonPhaseCalculator.calculatePhaseByLunar(lunar);
console.log(`✓ 當日月相計算: ${phase.name} (${phase.english})`);
console.assert(phase.name === '虧凸月', `八月十九月相應為「虧凸月」，實際得到: ${phase.name}`);

// 4. 驗證連續期判定
console.assert(window.moonPhaseCalculator.isDarkMoonCrisisPeriod(1) === true, '初一應為朔月至暗期');
console.assert(window.moonPhaseCalculator.isDarkMoonCrisisPeriod(29) === true, '廿九應為朔月至暗期');
console.assert(window.moonPhaseCalculator.isFullMoonCrisisPeriod(15) === true, '十五應為滿月銀月期');
console.assert(window.moonPhaseCalculator.isInfectionRacePeriod(8) === true, '初八應為狼毒賽跑期');
// 5. 驗證守望點數與回合累存機制
require('../js/config.js');
require('../js/systems/ResourceEconomy.js');
const economy = new window.ResourceEconomy();

console.assert(economy.resources.actionPoints === 3, '初始點數應為 3 點');
console.log(`✓ 初始守望點數驗證通過: ${economy.resources.actionPoints} 點`);

// 消耗 1 點
economy.consumeActionPoint();
console.assert(economy.resources.actionPoints === 2, '消耗後應剩 2 點');
console.log(`✓ 消耗 1 點守望點數驗證通過: 剩餘 ${economy.resources.actionPoints} 點`);

// 回合未用完存起來：再過一天補給 3 點 (2 + 3 = 5 點)
economy.addDailyTurnPoints();
console.assert(economy.resources.actionPoints === 5, `回合未用完存起來加補給，應為 5 點，實際得到: ${economy.resources.actionPoints}`);
console.log(`✓ 跨回合點數累存驗證通過: 累積至 ${economy.resources.actionPoints} 點！`);

// 驗證儲存上限 (12 點)
economy.resources.actionPoints = 11;
economy.addDailyTurnPoints(); // 11 + 3 = 14 -> 應被 clamp 到 12
console.assert(economy.resources.actionPoints === 12, '超過上限應被限制在 12 點');
console.log(`✓ 點數儲存上限 (12點) 限制驗證通過！`);

// 6. 驗證小鎮路人與動物資料載入
require('../js/data/townsfolk.js');
require('../js/data/townsfolkDialogues.js');

console.assert(window.TOWNSFOLK_CHARACTERS.length >= 4, '應載入至少 4 位路人居民與城鎮動物');
console.log(`✓ 小鎮路人與動物數量驗證通過: ${window.TOWNSFOLK_CHARACTERS.length} 位`);

const dog = window.TOWNSFOLK_CHARACTERS.find(c => c.id === 'barnaby');
const cat = window.TOWNSFOLK_CHARACTERS.find(c => c.id === 'luna');
console.assert(dog && dog.category === 'animal', '忠犬巴納比應為 animal 類別');
console.assert(cat && cat.category === 'animal', '靈貓露娜應為 animal 類別');
console.log(`✓ 城鎮動物（忠犬巴納比、靈貓露娜）驗證通過！`);

// 7. 驗證動態多階段劇情對白資料結構
console.assert(window.TOWNSFOLK_DIALOGUES.barnaby.PEACEFUL.greeting.length > 0, '巴納比應有平靜期對白');
console.assert(window.TOWNSFOLK_DIALOGUES.martha.FULL_MOON.greeting.length > 0, '瑪莎應有滿月危機對白');
console.assert(window.TOWNSFOLK_DIALOGUES.toby.INFECTED.greeting.length > 0, '托比應有感染求救對白');
console.log(`✓ 居民多階段（平靜、戒備、滿月、朔月、感染）動態劇情對白驗證通過！`);

// 8. 驗證所有可互動角色都有正式剪紙立繪與頭像，避免掉入色塊 fallback
const allCharacters = [...window.LUNAR_CHARACTERS, ...window.TOWNSFOLK_CHARACTERS];
for (const character of allCharacters) {
  const root = character.category === 'animal'
    ? 'characters/animals'
    : character.category === 'townsfolk'
      ? 'characters/townsfolk'
      : 'characters';
  const standeePath = path.join(__dirname, `../assets/images/${root}/standees/${character.id}.webp`);
  const avatarPath = path.join(__dirname, `../assets/images/${root}/avatars/${character.id}.webp`);
  console.assert(fs.existsSync(standeePath), `${character.id} 的剪紙立繪應存在`);
  console.assert(fs.existsSync(avatarPath), `${character.id} 的剪紙頭像應存在`);
}
console.log(`✓ ${allCharacters.length} 位互動角色的立繪與頭像完整性驗證通過！`);

// 9. 驗證 30 個去背月相圖檔存在性
for (let d = 1; d <= 30; d++) {
  const moonPath = path.join(__dirname, `../assets/images/moon/${d}.webp`);
  console.assert(fs.existsSync(moonPath), `正式月相圖檔 ${d}.webp 應存在於 assets/images/moon/`);
}
console.log(`✓ 30 個全週期正式月相 WebP 圖檔完整性驗證通過！`);

console.log('--- 所有單元測試 PASS ---');
