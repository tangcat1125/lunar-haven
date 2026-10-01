/**
 * MOON_PHASES_DATA - 八大月相標準常數庫
 * 純 JS 變數掛載，保證本機 file:/// 雙擊直接執行零 CORS 限制
 */
window.LUNAR_MOON_PHASES = [
  {
    "id": "new_moon",
    "phaseIndex": 0,
    "name": "朔月",
    "alias": "新月",
    "english": "New Moon",
    "lunarDays": [29, 30, 1],
    "illumination": 0.0,
    "direction": "none",
    "description": "月球運行至太陽與地球之間，背光面朝向地球，夜空完全無光。",
    "lore": "當朔夜無光（農曆初一），伸手不見五指的至暗降臨，飢餓的群狼將自黑森林襲來；",
    "dangerLevel": "CRITICAL",
    "crisisType": "DARK_WOLF_ATTACK"
  },
  {
    "id": "waxing_crescent",
    "phaseIndex": 1,
    "name": "眉月",
    "alias": "蛾眉月",
    "english": "Waxing Crescent",
    "lunarDays": [2, 3, 4, 5, 6],
    "illumination": 0.25,
    "direction": "right",
    "description": "日落後出現在西方天空，呈右側亮細彎鉤，弓背朝西。",
    "lore": "銀鉤破曉微光顯，被咬傷者的傷口開始泛紫，必須盡速採集附子草熬製解藥！",
    "dangerLevel": "LOW",
    "crisisType": "INFECTION_SPREAD"
  },
  {
    "id": "first_quarter",
    "phaseIndex": 2,
    "name": "上弦月",
    "alias": "上弦",
    "english": "First Quarter",
    "lunarDays": [7, 8],
    "illumination": 0.5,
    "direction": "right",
    "description": "上半夜出現在南天，右半側亮，半圓切線垂直於地平線。",
    "lore": "月輪已半，鍛造銀質兵器與熬製解藥已刻不容緩。",
    "dangerLevel": "MEDIUM",
    "crisisType": null
  },
  {
    "id": "waxing_gibbous",
    "phaseIndex": 3,
    "name": "盈凸月",
    "alias": "張月",
    "english": "Waxing Gibbous",
    "lunarDays": [9, 10, 11, 12, 13],
    "illumination": 0.75,
    "direction": "right",
    "description": "大部朝右明亮，凸面朝西，夜色愈加明朗。",
    "lore": "月光漸盈，狼毒已逼近心臟，解藥必須於此時餵服傷患完成淨化！",
    "dangerLevel": "MEDIUM",
    "crisisType": "RACE_DEADLINE"
  },
  {
    "id": "full_moon",
    "phaseIndex": 4,
    "name": "望月",
    "alias": "滿月",
    "english": "Full Moon",
    "lunarDays": [14, 15, 16],
    "illumination": 1.0,
    "direction": "full",
    "description": "地球位於太陽與月球之間，月球正對地球的一面完全被照亮。",
    "lore": "當銀月當空（農曆十五），月華照徹石階，被狼牙撕咬過的傷者，終將難逃狂暴的詛咒。",
    "dangerLevel": "CRITICAL",
    "crisisType": "WEREWOLF_OUTBREAK"
  },
  {
    "id": "waning_gibbous",
    "phaseIndex": 5,
    "name": "虧凸月",
    "alias": "退月",
    "english": "Waning Gibbous",
    "lunarDays": [17, 18, 19, 20, 21],
    "illumination": 0.75,
    "direction": "left",
    "description": "滿月之後，大部朝左明亮，凸面朝東，月光逐漸消減。",
    "lore": "銀月始虧，狂暴狼人氣力衰退，衛隊全員出動壓制並重整小鎮防線。",
    "dangerLevel": "MEDIUM",
    "crisisType": null
  },
  {
    "id": "third_quarter",
    "phaseIndex": 6,
    "name": "下弦月",
    "alias": "下弦",
    "english": "Third Quarter",
    "lunarDays": [22, 23],
    "illumination": 0.5,
    "direction": "left",
    "description": "下半夜升起，左半側亮，直切線在右側。",
    "lore": "下弦如弓照清霜，抓緊時間修復拒馬柵欄，準備迎戰即將到來的下一個朔月至暗期。",
    "dangerLevel": "LOW",
    "crisisType": null
  },
  {
    "id": "waning_crescent",
    "phaseIndex": 7,
    "name": "殘月",
    "alias": "曉月",
    "english": "Waning Crescent",
    "lunarDays": [24, 25, 26, 27, 28],
    "illumination": 0.25,
    "direction": "left",
    "description": "清晨日出前出現在東方低空，呈左側亮細弧，凹面朝東。",
    "lore": "殘月即逝，黑暗的長夜再度籠罩大地，警鐘鳴響，備戰最後的至暗連續期！",
    "dangerLevel": "HIGH",
    "crisisType": "PRE_DARK_WARNING"
  }
];
