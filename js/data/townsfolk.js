/**
 * TOWNSFOLK_CHARACTERS - 小鎮路人居民與城鎮動物資料庫
 * 存放於獨立結構，支援純本地雙擊 index.html 離線免伺服器執行
 */
window.TOWNSFOLK_CHARACTERS = [
  {
    "id": "toby",
    "name": "小羊童 托比",
    "englishName": "Little Toby",
    "profession": "小鎮羊童",
    "category": "townsfolk",
    "avatar": "townsfolk/toby",
    "color": "#ffa726",
    "homeX": 860,
    "station": { "x": 860, "name": "噴泉廣場小徑" },
    "patrolRange": 140,
    "walkSpeed": 50,
    "options": [
      {
        "id": "toby_scout",
        "title": "替守望者放哨",
        "desc": "在鎮內屋頂高處巡視，偵測可疑狼影",
        "workX": 1150,
        "workName": "鐘樓旁矮屋頂",
        "cost": { "food": 1 },
        "reward": { "morale": 8 },
        "duration": 8
      },
      {
        "id": "toby_firewood",
        "title": "拾撿乾燥柴火",
        "desc": "為鐘塔烽火與鐵匠爐補充木柴",
        "workX": 540,
        "workName": "磨坊柴堆",
        "cost": {},
        "reward": { "wood": 2 },
        "duration": 10
      }
    ]
  },
  {
    "id": "martha",
    "name": "農婦 瑪莎",
    "englishName": "Martha the Seamstress",
    "profession": "鎮民裁縫",
    "category": "townsfolk",
    "avatar": "townsfolk/martha",
    "color": "#ab47bc",
    "homeX": 1380,
    "station": { "x": 1380, "name": "修道院前長階" },
    "patrolRange": 120,
    "walkSpeed": 45,
    "options": [
      {
        "id": "martha_bandages",
        "title": "裁製乾淨繃帶",
        "desc": "使用粗麻布料為克萊兒修女補給醫護繃帶",
        "workX": 1460,
        "workName": "修道院藥房門廊",
        "cost": {},
        "reward": { "morale": 10 },
        "duration": 10
      },
      {
        "id": "martha_rations",
        "title": "縫補禦寒斗篷",
        "desc": "為夜巡守衛加固禦寒裝備，增強體力",
        "workX": 450,
        "workName": "西側崗哨營帳",
        "cost": { "food": 1 },
        "reward": { "defense": 10 },
        "duration": 12
      }
    ]
  },
  {
    "id": "barnaby",
    "name": "守衛忠犬 巴納比",
    "englishName": "Barnaby the Guard Dog",
    "profession": "警覺守衛犬",
    "category": "animal",
    "avatar": "animals/barnaby",
    "color": "#8d6e63",
    "homeX": 460,
    "station": { "x": 460, "name": "鐵工坊前木棧道" },
    "patrolRange": 160,
    "walkSpeed": 65,
    "options": [
      {
        "id": "dog_patrol",
        "title": "警惕巡嗅暗巷",
        "desc": "憑藉靈敏嗅覺搜尋狼腥氣味，提高警戒",
        "workX": 350,
        "workName": "西側圍欄暗處",
        "cost": { "food": 1 },
        "reward": { "defense": 12 },
        "duration": 6
      },
      {
        "id": "dog_comfort",
        "title": "撫摸忠犬鼓勵",
        "desc": "忠犬開心地搖尾巴，稍微撫慰小鎮緊張情緒",
        "workX": 460,
        "workName": "街道原處",
        "cost": {},
        "reward": { "morale": 6 },
        "duration": 4
      }
    ]
  },
  {
    "id": "luna",
    "name": "修道院黑白貓 露娜",
    "englishName": "Luna the Monastery Cat",
    "profession": "捕鼠靈貓",
    "category": "animal",
    "avatar": "animals/luna",
    "color": "#455a64",
    "homeX": 1640,
    "station": { "x": 1640, "name": "修道院拱廊" },
    "patrolRange": 150,
    "walkSpeed": 55,
    "options": [
      {
        "id": "cat_catch_mice",
        "title": "捕滅糧倉老鼠",
        "desc": "保護磨坊與修道院的穀物藥材不被啃咬",
        "workX": 680,
        "workName": "風車磨坊底層",
        "cost": {},
        "reward": { "food": 1 },
        "duration": 8
      },
      {
        "id": "cat_purr",
        "title": "輕撫呼嚕聲",
        "desc": "靈巧溫順的貓咪呼嚕聲令人心情放鬆",
        "workX": 1640,
        "workName": "修道院長椅",
        "cost": {},
        "reward": { "morale": 6 },
        "duration": 4
      }
    ]
  }
];
