/**
 * TEACHER_PRESETS_DATA - 教師教學情境預設與 6 大主要結束條件
 * 嚴格對照 GDD 企劃書規格
 */
window.LUNAR_TEACHER_PRESETS = [
  {
    mode: "full_cycle",
    title: "1. 進行一個完整月相流程",
    description: "跑完 1 個完整朔望月（29.5 天）或指定半週期（如初一至十五）。",
    subOptions: [
      { label: "指定半週期精華（15 天，農曆初一至十五）", targetDays: 15 },
      { label: "1 個完整朔望月（29.5 天，初一至廿九/三十）", targetDays: 29.5 },
      { label: "自訂天數流程（7 天快速觀測）", targetDays: 7 }
    ],
    defaultSubIndex: 0
  },
  {
    mode: "casualty",
    title: "2. 鎮民死傷／狼化超過指定人數",
    description: "下拉設定人數門檻（1人 / 3人 / 5人），超過則小鎮失守提前結算。",
    subOptions: [
      { label: "1 人（極限考驗，只要 1 人被狼化小鎮即失守）", threshold: 1 },
      { label: "3 人（標準挑戰，死傷/狼化達 3 人結算）", threshold: 3 },
      { label: "5 人（寬鬆教學模式，死傷/狼化達 5 人結算）", threshold: 5 }
    ],
    defaultSubIndex: 1
  },
  {
    mode: "defend_count",
    title: "3. 成功抵禦指定次數的危機",
    description: "設定防守成功次數（如：成功防守 1 次朔月 + 1 次滿月）。",
    subOptions: [
      { label: "成功抵禦 1 次危機（體驗版）", targetCount: 1 },
      { label: "成功防守 2 次危機（1 次朔月狼襲 + 1 次滿月異變）", targetCount: 2 },
      { label: "成功抵禦 3 次危機（資深守夜者模式）", targetCount: 3 }
    ],
    defaultSubIndex: 1
  },
  {
    mode: "codex",
    title: "4. 集齊全套月相觀察圖鑑",
    description: "收集齊 8 大關鍵月相卡牌並完成日曆比對。",
    subOptions: [
      { label: "集齊 8 大關鍵月相（朔、眉、上弦、盈凸、望、虧凸、下弦、殘）", targetCount: 8 }
    ],
    defaultSubIndex: 0
  },
  {
    mode: "zero_defense",
    title: "5. 小鎮繁榮防禦值降至歸零",
    description: "極限挑戰模式，防禦警戒值自 100 點扣盡歸零即宣告失守結束。",
    subOptions: [
      { label: "防禦警戒值扣至 0% 即結算（極限生存）", threshold: 0 }
    ],
    defaultSubIndex: 0
  },
  {
    mode: "timed",
    title: "6. 課堂限時模式",
    description: "設定操作倒數（15分鐘 / 30分鐘 / 40分鐘），時間截止自動鎖定並產出學習報告。",
    subOptions: [
      { label: "15 分鐘（微型評量／快速體驗）", minutes: 15 },
      { label: "30 分鐘（雙節課中段評量）", minutes: 30 },
      { label: "40 分鐘（標準一堂課教學）", minutes: 40 }
    ],
    defaultSubIndex: 2
  }
];
