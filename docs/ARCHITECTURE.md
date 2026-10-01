# 《月痕小鎮》（Lunar Haven）系統架構與資料夾規劃說明書

---

## 一、 專案架構設計理念

《月痕小鎮》是一款專為自然科學跨學科教學設計的橫向捲軸放置生存網頁遊戲。整體系統採用 **「模組化高內聚、事件驅動解耦（Event-Driven Decoupled Architecture）」**，並圍繞核心教育機制——**「天文月相連續性與公曆/農曆雙曆因果鏈」** 展開。

### 核心設計原則：
1. **純前端輕量化（Zero-Dependency Local First）**：
   無需繁複後端依賴，可在本機瀏覽器（file:/// 或靜態 HTTP 伺服器）秒速啟動，完美適配學校電腦教室與平板觸控裝置。
2. **事件總線驅動（Pub/Sub EventBus）**：
   天文天幕、角色狀態、資源經濟、警報音效與 UI 對話互不強耦合，全部透過全局 `EventBus` 廣播同步。
3. **厚紙卡剪裁視覺風格（Paper-Cut Standee Pipeline）**：
   CSS 3D Transform + SVG 濾鏡 + 投影與紙卡白邊層疊，兼顧高幀率與獨特繪本美感。
4. **教具化與課堂可控性（Classroom Readability & Presets）**：
   內建「真實日期連動模式」與「課堂模擬加速模式」，教師可於 Landing Page 後台設定目標條件並一鍵匯出學習成果報告。

---

## 二、 完整目錄層級與職責劃分

```text
d:\game\lunar-haven\
├── index.html                   # 遊戲主入口（含 Landing Page 與 主遊戲視圖切換）
├── README.md                    # 專案總覽、教學目標、架構設計說明
├── docs/                        # 企劃與設計規格文件
│   ├── GDD.md                   # 完整遊戲企劃書
│   ├── ARCHITECTURE.md          # 系統架構與資料夾結構詳細說明
│   ├── ASTRONOMY_SYSTEM.md      # 天文月相與雙曆算法規格
│   ├── CHARACTERS_DATA.md       # 10位核心角色與任務數值規格
│   └── TEACHER_MANUAL.md        # 教師操作與教學評量手冊
├── assets/                      # 靜態美術與影音資源庫
│   ├── images/                  # 圖像資源（厚紙卡剪紙風格）
│   │   ├── landing/             # 導引首頁背景、立體天球、哥德鐘塔、黑森林
│   │   ├── backgrounds/         # 橫向長卷視差背景（遠景雪山、中景城鎮、近景石階）
│   │   ├── characters/          # 10位NPC與狼人立繪、紙偶行走圖、表情與受傷差分
│   │   │   ├── standees/        # 厚紙牌滑入大立繪（含爪痕撕裂/紫斑受傷態、翻面狼人態）
│   │   │   ├── sprites/         # 地圖漫步小紙偶（左右微擺步行序列幀/SVG）
│   │   │   └── avatars/         # 對話框與名冊頭像
│   │   ├── moon/                # 8大真實月相圖鑑、動態天幕月相貼圖/遮罩
│   │   ├── ui/                  # 厚紙卡與羊皮紙 UI 元件（羊皮對話框、頂部資源條、木板按鈕）
│   │   └── items/               # 道具圖標（黑麥麵包、木材、鐵礦、銀粉、附子草、解藥等）
│   ├── audio/                   # 音效與背景音樂
│   │   ├── bgm/                 # 中古山村清晨/白晝/朔夜至暗/滿月狂想等背景曲
│   │   ├── sfx/                 # 交互點擊、伐木採礦、紙牌翻動、紙偶步伐
│   │   └── bells/               # 教堂鐘聲（晨暮清鐘、朔月急促亂鐘、滿月悠長銀鐘）
│   └── fonts/                   # 仿古木刻或手寫風格字體
├── css/                         # 視覺樣式表
│   ├── main.css                 # 全局基礎樣式、佈局、重置
│   ├── landing.css              # 入口導引頁（厚紙卡立體、月相天球、滾動字幕、教師後台）
│   ├── world.css                # 橫向捲軸長卷大世界、視差背景、紙偶動畫
│   ├── hud.css                  # 頂部數據條、天幕大月相、底部雙曆 HUD
│   ├── dialogue.css             # 羊皮紙 TALKING 對話區、厚紙牌立繪滑入與撕裂翻面特效
│   ├── teacher.css              # 教師後台管理面板、下拉設定、密碼鎖定
│   ├── codex.css                # 月相圖鑑觀察手冊與結算學習單
│   └── paper-effects.css        # 厚紙卡剪影、木版印刷質感、白卡邊緣濾鏡特效
├── js/                          # 核心遊戲邏輯模組
│   ├── main.js                  # 遊戲主控制器（初始化、狀態機、頁面生命週期）
│   ├── config.js                # 全域遊戲常數、教學預設值、日曆設定
│   ├── core/                    # 核心底層引擎
│   │   ├── StateMachine.js      # 遊戲狀態機（Landing, Playing, Crisis, Result）
│   │   ├── EventBus.js          # 發布/訂閱事件總線（解耦天文、角色、UI）
│   │   ├── SoundEngine.js       # 音效引擎（Web Audio 合成 + 教堂鐘聲排程）
│   │   └── Storage.js           # 存檔與教師設定本地持久化 (localStorage)
│   ├── astronomy/               # 天文與曆法系統
│   │   ├── LunarCalendar.js     # 公曆/農曆換算精準算法
│   │   ├── MoonPhaseCalculator.js # 8大月相與明暗角度/朝向計算器
│   │   └── SkyRenderer.js       # 天幕月相動態渲染器（Canvas/SVG 月相光暗）
│   ├── world/                   # 大世界與視差系統
│   │   ├── WorldScroller.js     # 2.5~3屏橫向平滑拖曳巡視控制器
│   │   ├── ParallaxLayer.js     # 遠/中/近景視差分層渲染與月光照明連動
│   │   └── TownClockTower.js    # 中央教堂鐘塔（鳴鐘、烽火、神聖庇護）
│   ├── entities/                # 實體與角色系統
│   │   ├── CharacterManager.js  # 角色管理中心（漫步、任務進度、感染追蹤）
│   │   ├── NPC.js               # 10位核心角色類別（數值、立繪、回饋台詞）
│   │   ├── Pedestrian.js        # 背景閒晃小紙偶
│   │   └── Werewolf.js          # 狼人異變與攻擊行為邏輯
│   ├── systems/                 # 遊戲機制系統
│   │   ├── TaskSystem.js        # 任務指派與資源結算機制（頭頂微光、完成勾勾）
│   │   ├── ResourceEconomy.js   # 資源庫存（糧食、木、鐵、銀、解藥、警戒值）
│   │   ├── CrisisCycleSystem.js # 朔月狼群入侵 vs 滿月狼人異變 閉環決策判定
│   │   └── InfectionTracker.js  # 狼毒潛伏、包紮照料、解藥調配與賽跑淨化
│   ├── ui/                      # 介面控制器
│   │   ├── LandingPageUI.js     # 入口頁動態天球、字幕流動、啟動小鎮
│   │   ├── HUDController.js     # 頂部數據條 + 底部雙曆月相對照
│   │   ├── DialogueBoxUI.js     # 羊皮紙對話區 + 厚紙牌立繪滑入與受傷翻面動畫
│   │   ├── TeacherPanelUI.js    # 教師後台密碼面板與下拉式選單條件
│   │   └── SettlementReportUI.js# 《小鎮守夜者天文手冊》結算學習單彈窗與報表
│   └── data/                    # 靜態資料庫
│       ├── characters.json      # 10位核心角色完整資料、職業、台詞、工作站
│       ├── tasks.json           # 委任任務清單、消耗/產出物資、耗時
│       ├── moonPhases.json      # 8大月相天文特徵、農曆對應、觀察筆記
│       └── teacherPresets.json  # 教學課堂預設情境模式（15分/完整月相/極限等）
└── tests/                       # 算法驗證與測試腳本
    ├── test_lunar_phase.js      # 農曆與月相換算單元測試
    └── test_crisis_loop.js      # 朔月防守與滿月異變閉環模擬測試
```

---

## 三、 系統模組詳細職責與資料流架構

### 1. 遊戲狀態機（Finite State Machine）
遊戲由 `StateMachine.js` 管理全域流程：
```
[ LANDING_PAGE ] ──(點擊踏入小鎮)──> [ TOWN_EXPLORATION ] (日常巡視、指派)
                                            │
               ┌────────────────────────────┴───────────────────────────┐
               ▼                                                        ▼
      [ DARK_MOON_CRISIS ]                                     [ FULL_MOON_CRISIS ]
    (廿八～初二・朔月狼襲)                                   (十四～十六・銀月狼人異變)
               │                                                        │
               ▼                                                        ▼
    [ INFECTION_RACE ]                                       [ TOWN_SETTLEMENT ]
 (初三～十三・救治解藥賽跑)                               (觸發教師設定結束條件)
               │                                                        │
               └───────────────────────┬────────────────────────────────┘
                                       ▼
                             [ LEARNING_REPORT ]
                           (天文學習單結算與匯出)
```

### 2. 事件總線（EventBus）主題規範
* `TIME_TICK`：日曆推進（公曆、農曆、月相階段、時段變更）。
* `MOON_PHASE_CHANGED`：觸發天幕重新著色、鐘塔警報模式切換。
* `CHARACTER_CLICKED`：觸發厚紙立繪滑入、開啟羊皮紙對話。
* `TASK_ASSIGNED` / `TASK_COMPLETED`：角色行動狀態更新、資源經濟累加、頭頂打勾顯示。
* `CRISIS_TRIGGERED`：朔月狼襲判定或滿月狼人異變翻面。
* `INFECTION_UPDATED`：角色感染進度變化、立繪爪痕更新。
* `GAME_OVER_CONDITION_MET`：教師設定結束條件達成，彈出結算報告。

---

## 四、 核心教育機制實踐架構

1. **農曆與月相對照**：
   底層透過 `LunarCalendar.js` 解析公曆與農曆月日，並藉由 `MoonPhaseCalculator.js` 計算精確的月球照相角（Phase Angle）與 8 大標準月相。
2. **閉環防禦因果鏈**：
   * 朔月（廿八～初二）：考驗學生是否指派布魯諾（木）、托馬斯（鐵）、席爾瓦（夾）形成防線；失敗則產生傷患。
   * 潛伏期（初三～十三）：考驗學生是否即時指派艾莉採集附子草、奧古斯熬解藥、克萊兒包紮。
   * 滿月（十四～十六）：檢驗解藥是否完成。未治癒者 100% 狼化翻面，雷蒙消耗銀劍/牢籠。
3. **學習評量報告（Assessment Sheet）**：
   完整記錄「觀察到的月相列表」、「防守成敗分析」、「傷患淨化率」與「農曆與月相關聯測驗答對率」，直接提供課堂教學回饋。
