/**
 * config.js - 全域遊戲設定與天文常數
 */
window.LUNAR_CONFIG = {
  EDUCATION_LEVEL: 'elementary',
  // 世界寬度（像素，約 2.5~3 屏）
  WORLD_WIDTH: 2800,

  // 月相圖鑑的唯一正式來源。素材由 D:\\game\\moon\\assets\\moon_phases
  // 匯入專案後保留原始 WebP，避免天幕與其他介面各自使用不同版本的月亮。
  MOON_ASSET_DIR: 'assets/images/moon',
  MOON_ASSET_EXTENSION: 'webp',

  // 日期設定：預設綁定當前真實日期（不顯示年份）
  INITIAL_DATE: new Date(2026, 8, 29), // 2026-09-29

  // 時間流速：每 25 秒在遊戲內流逝 1 天（課堂放置最佳節奏）
  DAY_DURATION_SECONDS: 25,

  // 每日守望點數發放量（每過一天補給 3 點）
  DAILY_ACTION_POINTS: 3,

  // 點數累存上限（未用完可留到下一回合累積使用，上限 12 點）
  MAX_STORAGE_ACTION_POINTS: 12,

  // 教師預設密碼
  TEACHER_PASSWORDS: ['haven2026', 'lunar888', 'admin'],

  // 初始資源
  INITIAL_RESOURCES: {
    food: 15,
    wood: 10,
    iron: 8,
    silver: 4,
    defense: 65,
    morale: 85,
    aconite: 1,
    antidote: 0,
    holy_water: 0,
    healing_potion: 1,
    medicine: 1,
    bandage: 1,
    silver_swords: 0,
    resin: 1
  }
};
