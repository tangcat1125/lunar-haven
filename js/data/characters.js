/**
 * CHARACTERS_DATA - 10位核心執行 NPC 靜態資料庫
 * 設定閒暇常駐位置 homeX 與 各任務特定工作站 workX (前往鐵工坊、鎮外林道、黑森林隘口、礦洞等)
 */
window.LUNAR_CHARACTERS = [
  {
    "id": "father_lawrence",
    "name": "勞倫斯神父",
    "englishName": "Father Lawrence",
    "profession": "教堂神父",
    "avatar": "lawrence",
    "color": "#795548",
    "speech": "好的，我知道了。願神聖的光芒庇護這座小鎮，驅散黑暗。",
    "homeX": 1180,
    "station": { "x": 1180, "name": "中央大教堂正門" },
    "options": [
      {
        "id": "task_prayer",
        "title": "主持月光祈禱",
        "desc": "在鐘塔下帶領禱告降低全鎮恐慌值 15 點",
        "workX": 1130,
        "workName": "大教堂聖壇鐘閣",
        "cost": { "food": 1 },
        "reward": { "medicine": 2, "morale": 8 },
        "duration": 12
      },
      {
        "id": "task_silver_bell",
        "title": "敲響驅邪聖鐘",
        "desc": "在滿月之夜震撼狼群，降低狼人狂暴度",
        "workX": 1210,
        "workName": "鐘塔頂部聖鐘台",
        "cost": { "silver": 1 },
        "reward": { "defense": 20 },
        "duration": 8
      }
    ]
  },
  {
    "id": "brother_august",
    "name": "奧古斯修士",
    "englishName": "Brother August",
    "profession": "修道院修士",
    "avatar": "august",
    "color": "#455a64",
    "speech": "好的，我知道了。我這就回典籍室開爐調配草藥。",
    "homeX": 1040,
    "station": { "x": 1040, "name": "修道院外步道" },
    "options": [
      {
        "id": "task_make_antidote",
        "title": "熬製狼毒解藥",
        "desc": "消耗 2 株附子草調配 1 瓶狼毒淨化解藥",
        "workX": 1530,
        "workName": "修道院典籍藥房內室爐火",
        "cost": { "aconite": 2 },
        "reward": { "healing_potion": 2, "antidote": 1 },
        "duration": 15
      },
      {
        "id": "task_holy_water",
        "title": "配製修道院聖水",
        "desc": "以古法浸潤銀粉淨化水源",
        "workX": 1580,
        "workName": "修道院聖泉洗禮池",
        "cost": { "silver": 1, "water": 2 },
        "reward": { "holy_water": 2, "defense": 15 },
        "duration": 18
      }
    ]
  },
  {
    "id": "sister_claire",
    "name": "克萊兒修女",
    "englishName": "Sister Claire",
    "profession": "修道院修女",
    "avatar": "claire",
    "color": "#0288d1",
    "speech": "好的，我知道了。我這就準備乾淨的繃帶去照顧傷患。",
    "homeX": 920,
    "station": { "x": 920, "name": "小鎮長椅廣場" },
    "options": [
      {
        "id": "task_bandage_patient",
        "title": "傷患包紮照料",
        "desc": "照料被野狼咬傷的居民，防止狼毒提早惡化",
        "workX": 980,
        "workName": "小鎮療養救護所病榻",
        "cost": { "food": 1 },
        "reward": { "bandage": 2 },
        "duration": 10
      },
      {
        "id": "task_distribute_food",
        "title": "分發日常口糧",
        "desc": "安定受驚傷患情緒，提升防禦警戒力",
        "workX": 880,
        "workName": "廣場救濟發放處",
        "cost": { "food": 2 },
        "reward": { "morale": 10 },
        "duration": 8
      }
    ]
  },
  {
    "id": "ellie",
    "name": "艾莉",
    "englishName": "Ellie",
    "profession": "草藥女",
    "avatar": "ellie",
    "color": "#388e3c",
    "speech": "好的，我知道了！我會趕在天黑前把新鮮草藥帶回來！",
    "homeX": 1380,
    "station": { "x": 1380, "name": "東道山腳入口" },
    "options": [
      {
        "id": "task_gather_aconite",
        "title": "採集野生附子草",
        "desc": "深入後山危險懸崖採集 2~3 株珍貴附子草",
        "workX": 2480,
        "workName": "鎮外後山深處草藥林道",
        "cost": { "food": 1 },
        "reward": { "aconite": 3 },
        "duration": 14
      },
      {
        "id": "task_gather_resin",
        "title": "收集松脂與艾草",
        "desc": "收集鐘塔烽火必需的松脂與驅狼艾草",
        "workX": 2380,
        "workName": "後山黑松林隘口",
        "cost": {},
        "reward": { "resin": 2 },
        "duration": 12
      },
      {
        "id": "task_fetch_water",
        "title": "汲取山泉清水",
        "desc": "前往林緣山泉取水，封桶後直接送進中央教堂庫房",
        "workX": 2620,
        "workName": "黑森林林緣山泉",
        "cost": { "food": 1 },
        "reward": { "water": 4 },
        "duration": 12
      }
    ]
  },
  {
    "id": "thomas",
    "name": "托馬斯",
    "englishName": "Thomas",
    "profession": "鐵匠",
    "avatar": "thomas",
    "color": "#d84315",
    "speech": "好的，我知道了！爐火正旺，我這就去敲鐵！",
    "homeX": 780,
    "station": { "x": 780, "name": "小鎮主街石階" },
    "options": [
      {
        "id": "task_craft_fence",
        "title": "打造鐵圍籬",
        "desc": "打造鐵圍籬加固木柵阻擊野狼入侵",
        "workX": 620,
        "workName": "石磚鐵匠鋪熔爐砧台",
        "cost": { "iron": 2, "wood": 2 },
        "reward": { "defense": 25 },
        "duration": 16
      },
      {
        "id": "task_craft_silver_sword",
        "title": "鍛造銀質短劍",
        "desc": "鍛造銀質短劍供衛兵防身壓制狼人",
        "workX": 650,
        "workName": "鐵匠鋪深處淬火槽",
        "cost": { "silver": 2, "iron": 1 },
        "reward": { "silver_swords": 1 },
        "duration": 18
      }
    ]
  },
  {
    "id": "hans",
    "name": "漢斯",
    "englishName": "Hans",
    "profession": "鐘塔守夜人",
    "avatar": "hans",
    "color": "#fbc02d",
    "speech": "好的，我知道了！我這就爬上鐘塔拉緊風箱備柴！",
    "homeX": 1260,
    "station": { "x": 1260, "name": "鐘塔旋轉梯下" },
    "options": [
      {
        "id": "task_light_beacon",
        "title": "點燃鐘塔大烽火",
        "desc": "初一朔夜點燃烽火照亮全鎮阻擊狼群",
        "workX": 1220,
        "workName": "鐘塔烽火瞭望梯高台",
        "cost": { "resin": 1, "wood": 2 },
        "reward": { "defense": 30 },
        "duration": 10
      },
      {
        "id": "task_observe_moon",
        "title": "天幕月相觀測",
        "desc": "觀測天象並鳴鐘預警，記錄月相圖鑑",
        "workX": 1200,
        "workName": "鐘塔天象觀測儀台",
        "cost": {},
        "reward": { "codex_progress": 1 },
        "duration": 8
      }
    ]
  },
  {
    "id": "raymond",
    "name": "雷蒙",
    "englishName": "Raymond",
    "profession": "衛兵隊長",
    "avatar": "raymond",
    "color": "#5c6bc0",
    "speech": "好的，我知道了！衛隊全員進入戒備狀態！",
    "homeX": 1480,
    "station": { "x": 1480, "name": "主幹道治安巡守區" },
    "options": [
      {
        "id": "task_patrol_guard",
        "title": "前哨武裝布防",
        "desc": "率隊於鎮口木柵抵禦野狼群進攻",
        "workX": 1985,
        "workName": "森林柵欄前方哨站",
        "holdPosition": true,
        "cost": { "food": 2 },
        "reward": { "defense": 20 },
        "duration": 15
      },
      {
        "id": "task_curfew_control",
        "title": "維持滿月宵禁",
        "desc": "滿月之夜維持治安巡守，壓制異變狼人",
        "workX": 1980,
        "workName": "鎮口警戒巡查線",
        "cost": { "food": 1 },
        "reward": { "morale": 10 },
        "duration": 12
      }
    ]
  },
  {
    "id": "bruno",
    "name": "布魯諾",
    "englishName": "Bruno",
    "profession": "資源採集工",
    "avatar": "bruno",
    "color": "#5d4037",
    "speech": "好的，我知道了！看我天黑前把木頭與礦石全拉回來！",
    "homeX": 820,
    "station": { "x": 820, "name": "西側伐木營地外" },
    "options": [
      {
        "id": "task_chop_wood",
        "title": "深林伐木",
        "desc": "深林砍伐大橡木以造柵欄與柴火儲備",
        "workX": 240,
        "workName": "最西側深山大橡木林場",
        "cost": { "food": 1 },
        "reward": { "wood": 5 },
        "duration": 14
      },
      {
        "id": "task_mine_ore",
        "title": "礦坑採礦",
        "desc": "入坑開採鐵礦石與珍貴銀礦石",
        "workX": 180,
        "workName": "阿爾卑斯山腳深黑礦洞",
        "cost": { "food": 1 },
        "reward": { "iron": 3, "silver": 1 },
        "duration": 16
      }
    ]
  },
  {
    "id": "silva",
    "name": "席爾瓦",
    "englishName": "Silva",
    "profession": "獵手",
    "avatar": "silva",
    "color": "#689f38",
    "speech": "好的，我知道了。今晚讓那些畜生見識一下冷箭的厲害。",
    "homeX": 1720,
    "station": { "x": 1720, "name": "獵戶小屋前" },
    "options": [
      {
        "id": "task_tower_archer",
        "title": "鐘塔弓箭守望",
        "desc": "駐守教堂鐘塔；朔月與滿月時，以箭矢守住靠近村落的狼影",
        "workX": 1320,
        "workName": "教堂鐘塔弓箭台",
        "holdPosition": true,
        "cost": { "food": 1 },
        "reward": { "defense": 20 },
        "duration": 12
      },
      {
        "id": "task_set_traps",
        "title": "布設暗夜捕獸夾",
        "desc": "在狼徑布設捕獸夾直接削弱暗夜狼群規模",
        "workX": 2650,
        "workName": "黑森林狼徑隘口最前線",
        "cost": { "iron": 1 },
        "reward": { "defense": 25 },
        "duration": 12
      },
      {
        "id": "task_scout_forest",
        "title": "森林斥候偵察",
        "desc": "追蹤受傷狼群動向，提前警示進攻方位",
        "workX": 2550,
        "workName": "黑森林幽暗樹冠斥候點",
        "cost": { "food": 1 },
        "reward": { "morale": 10 },
        "duration": 10
      }
    ]
  },
  {
    "id": "peter",
    "name": "彼得",
    "englishName": "Peter",
    "profession": "麵包師",
    "avatar": "peter",
    "color": "#e65100",
    "speech": "好的，我知道了！烤爐已經熱好，香噴噴的麵包馬上出爐！",
    "homeX": 660,
    "station": { "x": 660, "name": "磨坊門前街道" },
    "options": [
      {
        "id": "task_bake_bread",
        "title": "烘焙黑麥口糧",
        "desc": "烘烤黑麥大麵包，維持全鎮體力與守軍士氣",
        "workX": 510,
        "workName": "中央麵包磨坊石磚大烤爐",
        "cost": {},
        "reward": { "food": 5 },
        "duration": 10
      },
      {
        "id": "task_festive_pastry",
        "title": "特製士氣甜派",
        "desc": "熱呼呼的甜派大幅縮短全鎮各崗位工作耗時",
        "workX": 470,
        "workName": "磨坊發酵揉麵台",
        "cost": { "food": 2 },
        "reward": { "morale": 15 },
        "duration": 15
      }
    ]
  }
];
