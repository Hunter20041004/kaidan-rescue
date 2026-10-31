# 怪談救援 — 交接說明

## 最新狀態（2026-10-29，v6 樣品屋）
- 這一輪的目標是讓「開場加第一夜」達到成品感（垂直切片）。決策 K17–K24 在 `docs/decisions.md`。
- **玩法**：躲藏是賭局（被看見會被搜、殭屍在門外聽呼吸、門縫視角）、鏡頭拉近、怪更常來找你、掙脫有進度格且前兩夜放寬。
- **聲音**：17 段 CC0 真實錄音（`audio/`，來源 `audio/CREDITS.md`，剪輯 `tools/make_audio.py`，建置時嵌入）；主音量／配樂／音效三軌。
- **介面**：方向 C（農會月曆、白紙黑框訃聞、籤詩、光明燈、新聞紙），規範在 `DESIGN.md`、`PRODUCT.md`。
- **外殼**：開始畫面、4 句開場（老村長、停電、送月曆的貨車）、40 位村民台詞、設定、製作名單、網頁圖示。
- **世界美術**（`src/render.js`）：三合院、鐵窗花、春聯、電線桿與電線、雜貨店、檳榔攤、廟（石獅、金爐、三川門）、稻田與稻草人、竹林；依夜晚狀況調色、兩層霧、雨夜濕地、底片顆粒；角色光影、呼吸與步伐。
- **測試**：`./tests/run_all.sh`，包含規則、七夜、躲藏、音效、外殼。
- **尚未 commit、尚未發布。** 沒有真人試玩、沒有手機實機、沒有真人聽過聲音。

### 下一步
1. 找 3–5 人試玩（標題「複製試玩紀錄」）。
2. 美術天花板：小尺寸怪物走路圖、招牌像素字、手電筒邊緣——需要真人像素美術。
3. 原創配樂（嗩吶／二胡／木魚目前是合成）。
4. 擺設目前可穿過（純視覺）；若試玩覺得違和，再把大型擺設加入碰撞。

---

（以下為 v4 交接）

# 怪談救援 — 交接說明（v4，三輪優化後）

## 最新狀態（2026-10-24）
- `index.html` = `rounds/round-3-index.html`（三個分身三輪優化後的最終版），由目前的 `src/` 建置。
- 每輪備份：`rounds/round-{0,1,2,3}-index.html`、`round-{0..3}-src/`；每輪 QA 報告 `rounds/round-{1,2,3}-qa.md`；團隊說明 `docs/team-brief.md`。
- 測試已收進專案：`./tests/run_all.sh [html] [輸出資料夾]`（規則 61 項、重新整理保留設定、教學、隨機遊玩、整夜、截圖、效能）。
- 設計分身的試玩量測工具：`rounds/designer-tools/pace.py <html 絕對路徑> <局數> [any|夜晚狀況] [bot|idle|hide]`。
- 尚未 commit、尚未發布。

### 三輪後仍未解決（依角色）
- 設計：抓準時機屏息可撐過 3 次敲門（建議每次多聞 2 秒以上）；村民與狗的聲音也會引來第一隻怪，需確認是否刻意。
- 美術：撞擊瞬間虎姑婆頭髮略灰糊；兩人泡泡靠太近時舊的會蓋新的；低階手機實測撲臉。
- QA：無真機（觸控、聲音、效能）；`perf.py` 沒有不合格門檻；隨機遊玩沒有「躲衣櫃屏息」策略。

---
（以下為三輪優化前的 v4 交接）


## 目標與驗收
Hunter 對 v3 的回饋與後續兩個新方向都已實作，細節見 `README.md`，決策見 `docs/decisions.md`（K1–K7）。

## 目前狀態（2026-10-23，本機）
- `index.html`：v4（像素風＋45 度俯視），由 `./build.sh` 把 `src/` 的 head、engine、content、game、render、apparitions、ui 串成單檔。
- `v3-index.html`：v3 備份；`v2-index.html`：v2。
- 本輪新檔：`src/apparitions.js`；`render.js` 整個重寫成像素渲染。
- **尚未 commit、尚未發布**：上層 repo（企劃與研究）有使用者自己已暫存、未提交的其他檔案，避免混在一起。

## 架構重點
- 遊戲邏輯（`game.js`）不碰畫圖；`render.js`／`apparitions.js` 只讀 `G`。換畫風只需改這兩個檔。
- 世界畫在小畫布（`buf`），整數倍放大；字與標記在 `drawScreen()` 用高解析度畫。
- 規矩怪：`APPARITIONS`（content）→ `startApparition`／`updApparition`（game）→ `drawApparition`／`drawRuleScreen`（apparitions）。
- 聲音：`SND.at(x,y,fn)` 讓聲音有方向；`SND.music(dt)` 控制分層音樂；`SND.mix()` 處理躲起來時的悶音。

## 測試方式
腳本在工作階段暫存資料夾（不在專案內），做法可重建：Python Playwright 開 `file://…/index.html`，`KT.manual=true` 後用 `KT.step(n)` 推進。
- 規則情境 43/43、教學 10 步、暫停與鍵盤、亂按 60 夜＋不死整夜 20 夜（0 錯誤）、桌機／手機截圖兩輪。

## 已知缺口
- 沒有真人試玩、沒有實機（iPhone／Android／Safari／Firefox）、沒有實機效能數據。
- 沒有生成的背景音樂：ACE-Step（`~/Developer/下載工具/ACE-Step-1.5`）執行需 Hunter 允許。
- impeccable 偵測 7 條，皆判定為誤判（隱藏面板量成內距不足 ×5、香頭火光被當成發光陰影、舞台本來就要裁切）。
- 水鬼側面素材較弱。

## 下一步
1. Hunter 決定是否發布線上連結、是否 commit。
2. 真人試玩調難度（README 第 5 節）。
