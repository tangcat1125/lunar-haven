# 《月痕小鎮》（Lunar Haven）專案完整企劃、架構與開發進度手冊
> **專案資料夾**：`d:\game\lunar-haven\`  
> **測試執行**：`d:\game\lunar-haven\tests\`  
> **最後更新時間**：2026-09-29  

---

## 一、 專案核心定位與執行模式

1. **遊戲類型**：中世紀紙藝童話風、雙曆（公曆與農曆）朔望月相天文科普與狼人生存策略遊戲。
2. **運行環境（絕對鐵則）**：
   - **100% 離線本機雙擊 `index.html` 即可運行**。
   - **零 Node.js 伺服器依賴、零 `fetch()` 本機 CORS 錯誤**。
   - 所有資料（如 `characters.json`, `townsfolk.json`, `townsfolkDialogues.json`）均配有對應的 `.js` 檔（掛載於 `window.*` 全域常數），在 `index.html` 透過 `<script>` 標籤載入。

---

## 二、 核心問題與使用者驗收標準

### 1. 底圖與天幕重構（「背景這樣設計，我們的月相上不去」）
* **現存痛點**：
  - 原全景圖（`world_panorama.jpg`）填滿整屏高度，遮擋了天幕層（`#world-sky-layer`），導致夜空月相無法擺放。
  - 頂部中央山巒背景有 AI 殘留文字（黃色字母 "F"）。
  - 右側黑森林區域（`.town-district-forest`）存在生硬黑色的 `clip-path` 鋸齒多邊形裁切，造成畫面割裂。
  - 中景存在三個帶有虛線框與半透明背景的方塊（`.town-district-quarry`, `.town-district-craft`, `.town-district-monastery`），視覺突兀破壞紙藝沈浸感。
* **重構要求**：
  - **上方 40% 留空天幕**：天幕層為深邃藍夜空（帶星辰漸層），供天幕真實月球（`#sky-moon-disc`）清晰高掛。
  - **下方 60% 小鎮景深**：阿爾卑斯木屋群、中央教堂大鐘塔與石磚街道自然延伸至右側，無黑色破圖，移除多餘的半透明虛線方塊。
  - **天幕月球位置**：由原本隱藏在最右側改為直接懸掛在畫面主要可見天幕處（如 `left: 550px; top: 30px; width: 130px; height: 130px;`），並帶有發光月暈（`sky-moon-aura`）。
  - **右上角天象 HUD**：將右上角原本單純的 Canvas 改為真實發光圓形月相球（`<div class="hud-moon-orb"><img id="hud-moon-img"></div>`），配合文字顯示當前月相名稱與百分比。

---

### 2. 月相圖資來源與顯示（「月相的部份，在 D:\game\moon 裡面有，把他抓出來用！」）
* **圖資來源**：
  - 取自 `d:\game\moon\assets\moon_phases\1.webp` ~ `30.webp`。
  - 規格：200x200 RGBA、透明背景的真實朔望月相圖。
  - 目標存放位置：`d:\game\lunar-haven\assets\images\moon\1.png` ~ `30.png`。
* **渲染邏輯**：
  - 每次推演日期（`day` 改變）時，天幕的 `#sky-moon-img` 與 HUD 的 `#hud-moon-img` 同步更新為 `assets/images/moon/${day}.png`。

---

### 3. NPC 素材重製與分目錄規格（「不要用我另一個遊戲的角色來補你的圖資！」）
* **禁止事項**：
  - **嚴格禁止從《滿月之狼》（`d:\game\moon\`）搬用任何角色素材**（先前誤抓的 `sheepdog.webp` 必須徹底刪除，不可作為本遊戲小狗！）。
* **目錄結構分立**：
  - **主線核心角色（6+1）**：
    - 立繪：`d:\game\lunar-haven\assets\images\characters\standees/`
    - 頭像：`d:\game\lunar-haven\assets\images\characters\avatars/`
    - 包含：`father_lawrence`（勞倫斯神父）、`brother_august`（奧古斯特修士）、`sister_claire`（克萊兒修女）、`ellie`（艾莉）、`thomas`（托馬斯）、`hans`（漢斯）、`werewolf`（狼人變身態）。
  - **城鎮路人（Townsfolk，獨立存放）**：
    - 立繪：`d:\game\lunar-haven\assets\images\characters\townsfolk\standees/`
    - 頭像：`d:\game\lunar-haven\assets\images\characters\townsfolk\avatars/`
    - 包含：`martha`（農婦瑪莎）、`toby`（鎮民托比）。
  - **城鎮動物（Animals，獨立存放）**：
    - 立繪：`d:\game\lunar-haven\assets\images\characters\animals\standees/`
    - 頭像：`d:\game\lunar-haven\assets\images\characters\animals\avatars/`
    - 包含：`barnaby`（守衛犬巴納比）、`luna`（小黑貓露娜）。
* **去背與繪圖三大驗收準則**：
  1. **保留白色細節**：去背時絕不可誤殺角色身上的白色衣物（克萊兒修女的白頭巾、艾莉的白圍裙、神父的白領圈必須 100% 完整保留！）。
  2. **去除木頭底座**：「可以不要角色底座嗎」，純立繪剪影去背，站立於小鎮地面的投影陰影上，無厚木頭底托。
  3. **頭像臉部不變形、去背乾淨**：頭像必須是 1:1 正方形（256x256），`object-fit: contain` 居中呈現，臉部絕不可橫向拉伸或縱向擠壓，框內不可帶白色方塊死角。

---

### 4. 角色移動與點擊抖動交互（「角色會左右移動來移動去，直到我們點擊他，他才會抖動一下，然後開啟對談模式！」）
* **移動規則**：
  - 在待機狀態下（`state === 'IDLE'` 或 `'INFECTED'`），角色**必須持續在自身巡邏範圍（`homeX ± patrolRange`）左右來回踱步**。
  - 當走到一側時，稍作短暫停頓（約 0.4s ~ 0.7s），轉向（`scaleX(-1)` / `scaleX(1)`）後走向另一側。
  - 行走時帶有微幅紙藝晃動動畫（`.is-walking`）。
* **點擊抖動與對話觸發時序**：
  1. 玩家點擊角色。
  2. 角色**立即停止走動**（`isIdleWalking = false`, `isTalking = true`）。
  3. 角色立牌元素添加 `.is-clicked-shake` 樣式，播放 220ms 的紙牌實體抖動動畫（`@keyframes standee-shake`），同時播放紙張卡牌反饋音效。
  4. 待 220ms 抖動動畫結束後，才正式觸發 `CHARACTER_CLICKED` 事件，滑出左側大立繪並展開灰色羊皮紙對話區。
  5. 對談模式期間，角色定點面向玩家，不被走動打斷。
  6. 關閉對話後，角色恢復巡邏漫步。

---

### 5. 暗月之狼與咬傷邏輯（「暗月的狼，沒有出現，自然不會出來咬傷居民」）
* **核心機制**：
  - 狼人與野狼僅在「暗月（新月期 29, 30, 1 日）」及「滿月（15, 16 日）」有特定行動。
  - **暗月無狼規則**：若夜間防禦值達標（防禦度 >= 70 或點燃烽火），或當夜隨機判定「狼群未出現/和平之夜」，則**完全不觸發咬傷**（居民與動物咬傷數為 0）。
  - **動物亦受感染**：狗（巴納比）與貓（露娜）在防禦潰敗被狼群襲擊時，也有機率感染病毒，有對應的受傷外觀與對話。

---

## 三、 目前專案目錄與檔案對照

```
d:\game\lunar-haven\
├── index.html                   # 主進入點（100% 離線，雙擊開啟）
├── css/
│   ├── main.css                 # 全局基底樣式
│   ├── world.css                # 2800px 長卷大世界、天幕、建築物、街道
│   ├── paper-effects.css        # 紙牌晃動、立牌陰影、抖動（standee-shake）動畫
│   ├── hud.css                  # 頂部狀態列、日曆 HUD、天象月球
│   └── dialogue.css             # 灰色羊皮紙 TALKING 對話區與立繪卡片
├── js/
│   ├── main.js                  # 遊戲啟動入口與迴圈
│   ├── config.js                # 系統設定參數
│   ├── core/
│   │   ├── EventBus.js          # 事件總線
│   │   ├── SoundEngine.js       # Web Audio 合成音效（免外部 mp3 依賴）
│   │   └── EconomySystem.js     # 守望點數（AP）與資源經濟
│   ├── data/
│   │   ├── characters.json / .js          # 6 大主要角色資料
│   │   ├── townsfolk.json / .js            # 路人居民（瑪莎、托比）資料
│   │   ├── townsfolkDialogues.json / .js   # 4 大月相動態劇情對白
│   │   ├── moonPhases.js                  # 30 天朔望月相常數
│   │   └── teacherPresets.js              # 教學評量目標設定
│   ├── astronomy/
│   │   ├── MoonPhaseCalculator.js         # 天文月相算法（雙曆運算）
│   │   └── SkyRenderer.js                 # 天幕動態渲染器
│   ├── entities/
│   │   ├── NPC.js                         # 核心角色類別（漫步、抖動、對話、任務）
│   │   ├── TownsfolkEntity.js             # 路人與動物實體
│   │   └── TownScene.js                   # 場景管理器
│   ├── systems/
│   │   ├── CrisisCycleSystem.js           # 朔望月相危機演繹（滿月/暗月狼襲）
│   │   ├── TaskSystem.js                  # 委託任務分派與進度系統
│   │   └── InfectionTracker.js            # 狼人病毒感染進度追蹤
│   └── ui/
│       ├── HUDController.js               # 頂部與底部 HUD 視圖
│       ├── DialogueBoxUI.js               # 對話視窗、厚紙牌立繪
│       ├── SettlementModalUI.js           # 結算學習單彈窗
│       └── TeacherModalUI.js              # 教師後台管理彈窗
├── assets/
│   └── images/
│       ├── backgrounds/
│       │   ├── world_panorama.jpg         # 長卷小鎮底圖
│       │   └── landing_bg.jpg             # 首頁開局底圖
│       ├── moon/                          # 1.png ~ 30.png 朔望月相透明圖
│       └── characters/
│           ├── standees/                  # 主角色立繪（無底座透明 PNG）
│           ├── avatars/                   # 主角色頭像（1:1 正方形）
│           ├── townsfolk/
│           │   ├── standees/              # 瑪莎、托比立繪
│           │   └── avatars/               # 瑪莎、托比頭像
│           └── animals/
│               ├── standees/              # 巴納比、露娜立繪
│               └── avatars/               # 巴納比、露娜頭像
└── tests/
    └── test_lunar_phase.js                # 13 項單元測試腳本
```

---

## 四、 接手執行任務清單（按優先順序）

### 【P0】底圖與天幕調整（`css/world.css`, `index.html`）
1. 在 `css/world.css` 中：
   - 確保天幕層 `#world-sky-layer` 位於可視頂部，高度設定為 `40%~45%`，為夜空留白。
   - 將 `#sky-moon-disc` 移至開局即可看見的位置（如 `left: 550px; top: 30px;`），確保 `z-index: 10`。
   - 移除 `.town-district-forest` 的 `clip-path` 黑色鋸齒多邊形裁切。
   - 隱藏或重構 `.town-district-quarry`、`.town-district-craft`、`.town-district-monastery` 虛線半透明方塊，讓底圖原畫自然展現。
2. 在 `index.html` 與 `css/hud.css` 中：
   - 右上角 `#top-right-celestial` 導入發光月球 `<div class="hud-moon-orb"><img id="hud-moon-img" src="assets/images/moon/19.png"></div>`，並由 `HUDController.js` 實時更新 `src`。

### 【P1】角色移動與點擊抖動（`NPC.js`, `paper-effects.css`）
1. 在 `css/paper-effects.css` 加入：
   ```css
   @keyframes standee-shake {
     0% { transform: scale(1) translateY(0) rotate(0deg); }
     20% { transform: scale(1.12) translateY(-6px) rotate(-6deg); }
     40% { transform: scale(1.15) translateY(-8px) rotate(6deg); }
     60% { transform: scale(1.08) translateY(-4px) rotate(-4deg); }
     80% { transform: scale(1.04) translateY(-2px) rotate(2deg); }
     100% { transform: scale(1) translateY(0) rotate(0deg); }
   }
   .paper-standee-npc.is-clicked-shake .paper-card-body {
     animation: standee-shake 0.22s ease-in-out !important;
   }
   ```
2. 在 `js/entities/NPC.js` 修改 `onClick()`：
   - 點擊時先判斷 `if (this.isShaking || this.isTalking) return;`。
   - 暫停移動：`this.isIdleWalking = false;`。
   - 播放抖動動畫：`this.el.classList.add('is-clicked-shake');`。
   - 播放聲音：`window.soundEngine?.playCardSlide();`。
   - `setTimeout` 220ms 後移除 class，設置 `this.isTalking = true;`，面向玩家並觸發 `CHARACTER_CLICKED`。
   - 對話關閉事件監聽，對話結束時將 `this.isTalking = false;`，等待 0.6 秒後繼續漫步。

### 【P2】路人與動物素材完善與頭像防變形（`DialogueBoxUI.js`, `dialogue.css`）
1. 確保 `townsfolk/` 與 `animals/` 下的 `martha`, `toby`, `barnaby`, `luna` 為獨立生成素材，嚴格不使用 `moon` 遊戲資產。
2. 在 `dialogue.css` 中：
   - 修改 `.standee-portrait` 與 `.dialogue-avatar-img`，設定為 `object-fit: contain;`，寬高比 1:1，圓角框且避免白色死角。

### 【P3】回歸測試驗證
1. 執行 `node tests/test_lunar_phase.js` 確保 13 項測試全數 PASS。
2. 本機直接雙擊開啟 `d:\game\lunar-haven\index.html` 進行實機操作測試。
