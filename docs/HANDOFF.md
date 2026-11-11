# HANDOFF —— Juicy Landing Page 交接紀錄

> 這份記「這一輪做到哪、下一步」。整個專案的狀態只在里程碑改變時才記到 `CURRENT_STATUS.md`（目前尚未建立）。
> 寫給沒看過這段對話的人：只寫查得到的事實，證據附指令或路徑。

## 摘要（每次覆寫這一段）

| 項目 | 內容 |
|---|---|
| 更新時間 | 2026-11-11（完成 019～023 後同步；工作樹有未提交修改） |
| 目前目標 | 網站骨架與不依賴共用模組的部分已實作並合併，網站已部署到 Vercel；試用（長按出球、拖球放置、拖移區塊）已由網站自己實作，PR #9 待審；Gate 決策已回答（2026-11-11），後續是 008～011 與人工驗收 |
| 工作目錄 | `D:\Project\Fun\juicy-landing-page`（2026-11-11 這一輪；先前記錄的 `C:\Users\student\...` 是另一台電腦） |
| 分支／HEAD | 分支 `feat/012-ci-workflow`；`0a28a72` 之後再加本次 HANDOFF 更新的 commit，以 `git log -1` 為準。PR #1（文件）、#2（005 partial＋014）、#3（012 partial）、#4（HANDOFF 同步與守衛修復）皆已合併；本分支的新 PR 見下方「相關 issue／PR」 |
| 工作樹 | （以下為先前一輪的記錄）本文件更新前乾淨。`issues/001-guard-secrets-false-positives.md` 與 `.claude/hooks/test-guard-secrets.sh` 已隨 PR #4 提交。`diagrams/0*.html`（8 個）不在任何遠端分支，只在另一台電腦的工作區，依 SRS v0.2 繪製已過期；專案擁有者 2026-11-10 決定守衛票中該項為「不適用」。注意 `issues/001-skeleton.md` 與守衛票同編號 001，是兩件事 |
| 部署 | Vercel：`https://juicy-landing-page-tau.vercel.app/`（專案擁有者 2026-11-10 陳述；同日 curl 首頁回 200、初始 HTML 含 M1 metadata）。`/LICENSE`、`/TRADEMARKS.md` 回 404（檔案本來就不存在）。專案擁有者表示網站功能尚未開放不構成問題，依其開發節奏逐步補上；預覽保護是否啟用未查證 |

### 2026-11-11 試用區功能（分支 `feat/005-trial-gestures`，**未 push**）
- 專案擁有者決定：ADR-03 B、ADR-04 B、OR-20 新增／編輯球排除與圓形選單保留；**不修改 Calendar、不新增套件**；試用由網站自己照 Calendar 固定 commit 實作，要「做得一模一樣」；本輪只做長按出球、拖球放置、拖移區塊。
- 已實作：`src/trial/`（engine、gestures、store、ui、trial.css）。本機 `npm run typecheck`、`lint`、`test`（30 檔 295 通過、1 todo）、`build` 通過；Playwright 實測見 `issues/005` 實作紀錄（不是人工驗收）。
- 未做：調整長度、命名、刪除、復原、右鍵選單、框選、剪貼簿（留到下載後體驗）；觸控、其他瀏覽器、日光節約與跨午夜未測；M-1～M-10 仍 Manual Pending；`issues/006` 的 TC-03 等對應案例「暫不開放」。
- 注意：試用是網站自己的一份實作，Calendar 日後改了規則不會自動跟上；以 `tests/trialEngine.test.ts` 與 `npm run check:calendar-release` 發現後人工比對。`docs/03-srs.md` 仍寫「共用模組」的段落是舊方向，尚未改寫，待你審閱。

### 已完成（依 issue 檔記載，本機尚未重跑）
- 文件：Brief、PRD v0.5.1、SRS v0.4、SAD v0.1、SDS v0.1、`06-test-plan.md` v0.2、`07-release-checklist.md`、`LESSONS.md`、`issues/001`～`018`
- 001 骨架（`d9e7dac`）、002 首頁與下載區（`6db7530`；`href` 與授權連結目標未驗證）、003 網站語言（`68a7624`；待 M-5）、004 互動閘門與預覽殼（`ca8741b`；單元測試通過，e2e 與 M-4 未執行）
- 005 部分：試用種子、`ensureReady`、隱私監看夾具（`fd83f51`）
- 012 部分：`.github/workflows/ci.yml`（typecheck、lint、test、build）；issue 檔記 PR #3 的 run 42661882621 全過（19 秒）
- 013 部分：metadata M1（`e4df3af`），`og:url`、`og:image` 未完成
- 下載連結固定版本的漂移檢查：`scripts/calendarRelease.ts`（純函式，8 個單元測試）、`scripts/checkCalendarRelease.ts`、`.github/workflows/calendar-release-check.yml`（每日排程，Actions 上尚未實跑）
- 004 e2e：`e2e/interactiveGate.e2e.ts` 的 TC-07b／07c／07d 在本機 Chromium 3 項通過（2026-11-11）；`ci.yml` 尚未納入 e2e（需在 CI 安裝瀏覽器）；M-4 實機未做
- D-10 部分：`LICENSE`（MIT，CHU YI AN，2026）與 `TRADEMARKS.md` 已新增（2026-11-11），待專案擁有者審閱；兩個 repository 已於 2026-11-11 公開（未登入 curl 確認 repo 頁與 releases 回 200）；本 PR 合併進 `main` 前，頁尾 `blob/main/LICENSE`、`blob/main/TRADEMARKS.md` 對訪客仍是 404
- 014 清單已建立，三個驗收條件 2026-11-11 前已核對並勾選（`docs/07-release-checklist.md` 20 列皆有歸屬；清單上的待決項目仍待決）
- 001 守衛票（`issues/001-guard-secrets-false-positives.md`）：修復隨 PR #4 合併；2026-11-10 實跑 `test-guard-secrets.sh` 32 項全過、`.maintain/check.sh` 6 項全 ✓（啟用 pre-commit 後）；「取捨」第 1 點專案擁有者確認維持現狀

- 019～026（2026-11-11；019～023 已 commit 於 `feat/019-supply-chain-hardening`，其餘見 git log，**皆未 push**）。024 依賴確切版本與鎖定檔完整性守衛；025 CI／Vercel 以 `--ignore-scripts` 安裝（乾淨環境實跑通過）並固定有安裝腳本的套件清單；026 `.gitignore` 補憑證類規則。另：專案擁有者授權後已啟用兩個 repo 的 `main` 分支保護（設定見 SAD「前提變更」）；`npm audit` 有 1 個中度弱點（minimatch，經開發期 lint 工具進來，修法需動 eslint 版本，待你同意）。以下是 019～023 的內容：019 SAD／清單同步「Calendar 已公開」；020 P2 與供應鏈唯讀稽核（Calendar 根目錄是 `private: true` 的 Tauri App，目前不能當 git 依賴；兩個 repo 的 `main` 都沒有分支保護；git 歷史樣式掃描無 secret）；021 下載 zip 的 SHA-256 釘選、排程比對 GitHub digest、頁面顯示驗證方式；022 `vercel.json` 安全標頭；023 GitHub Actions 釘 commit SHA 並加 workflow 權限測試。本機 `npm run typecheck`、`lint`、`test`（024～026 後 24 檔 197 通過、1 todo）、`build` 皆通過；GitHub 上的 CI 實跑與部署後標頭驗證未做

### 進行中
- 無。

### 阻塞
- **2026-11-11 決定變更後的票況：** 015～018 與 007（已更改決定，不再需要）；005 與 006 的「長按出球、拖球放置、拖移區塊」已完成（調整長度、命名不開放）；008、009、010、011 不再被 Calendar 端授權或決策阻塞（008 未開始；009 執行器改接 `src/trial/`；010 待最終種子內容與英文說明；011 待前面各票）。D-11（共用模組發布管道與憑證）、ADR-03／04、OR-20、套件清單核准已不再適用
- 公開上線前：D-10（LICENSE、TRADEMARKS.md、Calendar 來源授權；根目錄目前查無這兩個檔）、D-02 網域、D-03 統計工具、D-04 Windows 版驗證；完整清單見 `docs/07-release-checklist.md`
- `CALENDAR_REPO` 2026-11-11 起為 `andrewchu0101/juicy-calendar`（專案擁有者指定，EXT-01；先前一度誤給本站 repo，已更正）；該 repository 公開，只有預發行版（v0.2.0-beta.3，無安裝檔），主按鈕 2026-11-11 起直接下載 `v0.2.0-beta.3` 免安裝 zip（固定 tag，Calendar 發新版須更新 `CALENDAR_RELEASE`）；curl 下載雜湊一致，M-10 人工驗收未做
- 已部署的公開網址上，頁尾 `LICENSE`／`TRADEMARKS.md` 連結與下載按鈕目前都打不開（檔案不存在、`CALENDAR_REPO` 為占位）；專案擁有者已表示依其節奏補上，不視為阻塞

### 下一步
1. （已完成）Gate 決策表已於 2026-11-11 回答：ADR-03 B、ADR-04 B、OR-20；D-11 與套件清單不再適用。下一步由專案擁有者決定 008～011 的順序與是否推進（不自行新增票）。
2. （已更改決定）不修改 Calendar；015～018 不再需要，不必授權。
3. 專案擁有者決定 020 剩下的建議：確認帳號 2FA、評估 Calendar immutable releases、是否核准安裝 gitleaks、是否同意為 `npm audit` 的 minimatch 警告調整 eslint 版本。
4. 專案擁有者確認 2026-11-11 的三項暫定處理是否正確：`CALENDAR_REPO` 指向 `andrewchu0101/juicy-calendar`（只有預發行版）；`og:url` 暫用 Vercel 預設網域；009 的 `openQuestion`（CONF-07 夾住、CONF-10 貼上位置）。

相關 issue／PR：PR #1～#4 已合併（`gh pr list --state all` 確認）；本輪（001／014 收尾與本 HANDOFF）的 PR 見 `gh pr list --head feat/012-ci-workflow`。

### 狀態核對（分開寫，不要混為一談）

| 面向 | 狀態 | 說明 |
|---|---|---|
| 已實作 | 部分 | 網站骨架、首頁、語言、互動閘門、種子與夾具、metadata M1；試用互動本體未接入 |
| 自動測試 | 本機 Not Run | 本機尚未 `npm install`，沒有 `node_modules`，這台沒有跑過任何測試。上列通過紀錄來自 issue 檔與 CI，不是本輪驗證。Calendar 的測試一個都沒執行過 |
| 人工驗收 | Manual Pending | M-1～M-10 全部未執行 |
| 已 commit／push | 已合併：PR #1～#4 | `0a28a72` 已 push 到 `origin/feat/012-ci-workflow`，尚未合併；本文件的變更於同一分支另行提交 |

### 接手者要先知道
- **D 槽那台電腦的 Calendar 位置（2026-11-11）**：`D:\Project\Fun\juicy-calendar\juicy-calendar`，專案擁有者指定。同日唯讀確認：是 Git repository，origin 為 `https://github.com/andrewchu0101/juicy-calendar.git`，HEAD `a1c64e5`，基準 commit `102ae19…` 存在（`git cat-file -t` 回傳 `commit`）。讀規格一律用 `git -C <路徑> show 102ae1917047aee691e88cef9c497b50df745c41:<路徑>`，不讀工作樹。
- **另一台（暫時工作電腦）的 Calendar 位置**：`..\juicy-calendar`（`C:\Users\student\Project\juicy-calendar`）。2026-11-10 用 `git -C ..\juicy-calendar cat-file -t 102ae1917047aee691e88cef9c497b50df745c41` 確認基準 commit 存在（回傳 `commit`）；Calendar 目前 HEAD 為 `4701e12`，與基準不同。LESSONS 寫的 `D:\Project\Fun\...` 是另一台電腦，這台沒有 D 槽。讀 Calendar 一律用 `git -C <路徑> show 102ae1917047aee691e88cef9c497b50df745c41:<路徑>`，不讀工作樹。
- 方向已定：試用沿用 Calendar 的操作與規則，不新增 App 沒有的日曆功能；共用方式採方案 B，發布管道與權限未核准。
- 預期值來自規格與人工算例，不呼叫實作；「找不到測試」不等於「沒有測試」。
- OR-26：Calendar 的快捷鍵監聽在 `window` 上，放進 landing page 會攔截整頁 Ctrl+C（讀程式碼的結論，未在瀏覽器驗證）；TC-12 尚不可執行。
- 這台是暫時工作電腦（沒有 D 槽）；`CLAUDE.md` 的 D 槽規則保留給有 D 槽的主要電腦。程式、測試與 CI 不寫死機器絕對路徑。

---

## 歷史紀錄

（首次建立，無更早的摘要。）
