# HANDOFF —— Juicy Landing Page 交接紀錄

> 這份記「這一輪做到哪、下一步」。整個專案的狀態只在里程碑改變時才記到 `CURRENT_STATUS.md`（目前尚未建立）。
> 寫給沒看過這段對話的人：只寫查得到的事實，證據附指令或路徑。

## 摘要（每次覆寫這一段）

| 項目 | 內容 |
|---|---|
| 更新時間 | 2026-11-13（見下方「2026-11-13 本輪」，先看那一段；以下是 2026-11-11 的摘要）2026-11-11（`main` 已合併 PR #9；本輪在這台電腦（`C:/Users/student/Project/juicy-landing-page`，沒有 D 槽）完成 008～010 與 minimatch 弱點，**未 commit、未 push**） |
| 目前目標 | 網站骨架與不依賴共用模組的部分已實作並合併，網站已部署到 Vercel；試用（長按出球、拖球放置、拖移區塊）已由網站自己實作，PR #9 待審；Gate 決策已回答（2026-11-11），後續是 008～011 與人工驗收 |
| 工作目錄 | `D:\Project\Fun\juicy-landing-page`（2026-11-11 這一輪；先前記錄的 `C:\Users\student\...` 是另一台電腦） |
| 分支／HEAD | 分支 `feat/012-ci-workflow`；`0a28a72` 之後再加本次 HANDOFF 更新的 commit，以 `git log -1` 為準。PR #1（文件）、#2（005 partial＋014）、#3（012 partial）、#4（HANDOFF 同步與守衛修復）皆已合併；本分支的新 PR 見下方「相關 issue／PR」 |
| 工作樹 | （以下為先前一輪的記錄）本文件更新前乾淨。`issues/001-guard-secrets-false-positives.md` 與 `.claude/hooks/test-guard-secrets.sh` 已隨 PR #4 提交。`diagrams/0*.html`（8 個）不在任何遠端分支，只在另一台電腦的工作區，依 SRS v0.2 繪製已過期；專案擁有者 2026-11-10 決定守衛票中該項為「不適用」。注意 `issues/001-skeleton.md` 與守衛票同編號 001，是兩件事 |
| 部署 | Vercel：`https://juicy-landing-page-tau.vercel.app/`（專案擁有者 2026-11-10 陳述；同日 curl 首頁回 200、初始 HTML 含 M1 metadata）。`/LICENSE`、`/TRADEMARKS.md` 回 404（檔案本來就不存在）。專案擁有者表示網站功能尚未開放不構成問題，依其開發節奏逐步補上；預覽保護是否啟用未查證 |

### 2026-11-13 本輪（分支 `feat/011-009-012-trial-two-parts`，疊在 PR #12 的分支上，**已 commit、未 push**）
- **試用改成兩個體驗（專案擁有者）：** (1) 長按空白處叫出**六顆展示球**（Calendar 預設六顆球的名稱與色碼：`#E98B87`、`#83B9D0`、`#A9C98D`、`#9C91CE`、`#E9B96E`、`#E5A5BD`），hover 該球果凍晃動，離開只停止晃動，放開或 Escape 關閉，**不建立區塊**；(2) 側邊三顆種子球改用 Calendar 柔和色票 Sky `#83B9D0`、Sage `#A9C98D`、Peach `#E9B96E`，拖放建立區塊如常。圓形選單不再開始拖曳（契約變更，`tests/trialGestures.test.ts` 的 radial 測試依此改寫）。「六顆球選了能不能建立區塊」是我的解讀（只展示）；若你要選了也能建立，要另外決定六顆球要不要進側邊或有自己的模板。
- **文件與預覽圖：** SRS FR-01／FR-02、測試計畫的色碼已同步；兩張預覽圖與替代文字已重截；`index.html` 的 `og:image:alt` 同步。
- **009：** 基準端實際執行 CONF-01～10，10／10 與人工算例一致（`issues/009`、`docs/evidence/009-baseline-conformance.runner.ts.txt`）。
- **011：** 驗收報告 `docs/08-delivery-acceptance.md`；人工項目全是 Manual Pending，**不宣稱整體已驗收**；下載機器端檢查通過，M-10 人工未做。
- **012：** 預覽保護已確認（302 導向 Vercel SSO）、憑證掃描測試；**只剩 Vercel 還原部署演練**。
- **驗證（2026-11-13，這台）：** `typecheck`、`lint`、`vitest`（33 檔 335 通過）、`build`、`test:e2e`（Chromium 33 項）、`npm audit` 0 全數通過。
- **視覺收尾（同日稍晚，impeccable）：** 見 `issues/010` 末段。球名稱對比、晃動起手、名字讓位；兩張預覽圖再重截。`tests/trialVisual.test.ts`、`vite.config.ts`（`test.css.include`）。
- **重要：#12 沒有進到 `main`。** #11 先 merge 進 `main`（`a4cb715`），之後 #12 才 merge，但它的目標分支是已刪除前的 `feat/013-012-008-followups`，所以 #12 的 3 個 commit（TC-02 磁吸表、`e2e/trialDemo.e2e.ts` 等）不在 `main`。本分支包含它們，開 PR 到 `main` 即可補上。
- **專案擁有者的決定（2026-11-13，同日稍晚）：** (1) 追認 `package.json` 現有的 15 個直接依賴（`issues/001-skeleton.md` 有清單，`AGENTS.md` 已改）；(2) OR-12：網站上現有的名稱、色碼與英文說明都是正式內容，不是占位；(3) D-02：網域就是 Vercel 的網域；(4) 013 做好；(5) 推送並開 PR 到 `main`。
- **013 收尾：** 專用的 1200×630 分享圖（`public/preview/og-zh-TW.png`、`og-en.png`，由 `scripts/capturePreviewImages.ts` 從實際互動版截出）、`canonical`、`og:site_name`；`og:url`、`og:image` 不再是「暫用」。**社群平台上的實際預覽沒有驗證**，要部署後用各平台的偵錯工具；線上的 `/preview/og-zh-TW.png` 要等這個分支 merge 並部署後才存在。
- **文件同步：** Brief D-02、PRD、SAD、SRS（OR-12）、SDS、測試計畫、`07-release-checklist.md` 的待決與占位敘述已改為已決；`issues/001-skeleton`、`010`、`013` 已更新。
- **驗證（2026-11-13，這台）：** `typecheck`、`lint`、`vitest`（34 檔 341 通過）、`build`、`test:e2e`（Chromium 34 項）、`npm audit` 0 全數通過。
- **專案擁有者的決定（2026-11-13，再稍晚）：** D-03 **不做流量統計**（OR-10、TC-06e 隨之結案／不適用）；D-04 Windows 乾淨電腦驗證排在 **2026-11-14**；六顆球目前**只展示、不能拖出區塊**（再次確認）；社群平台預覽**不做**；GitHub 帳號 2FA 已啟用；Calendar release 要設為不可竄改（待完成）；D-10 Calendar 授權：**選 MIT**；依賴授權已查（`docs/evidence/010-calendar-dependency-licenses-2026-11-13.md`），沒有衝突，但發布的 zip 沒有隨附第三方授權聲明；Calendar 圖示是專案擁有者自己的作品（陳述）。專案擁有者隨後授權修改 Calendar：`LICENSE`（MIT）、README 授權章節、`THIRD-PARTY-LICENSES.md`（`npm run licenses` 產生，241 個套件）、zip 組裝腳本與 NSIS `bundle.resources` 都已在 Calendar 工作樹做好，**未 commit、未 push、未發布**；已發布的 `v0.2.0-beta.3` 仍沒有授權檔，要等下次發新版（請先把 release 設成不可竄改）。
- **AC-03.2（2026-11-14 已做）：** 頁尾加「本網站不使用流量統計。」；英文版 `This website does not use analytics.` 是我翻的，專案擁有者只給了中文句。`tests/home.test.tsx`、`tests/languageSwitch.test.tsx`、新增 `tests/noAnalytics.test.ts`（樣式比對，擋常見統計工具與網域）。AC-03.2 原文另外要求的「桌面 App 無遙測」與「語言偏好存在訪客瀏覽器」的說明，頁面目前沒有，待確認。
- **待你：** 合併本分支的 PR；M-10 等人工驗收；種子球名稱（OR-12）；Vercel 還原演練。

### 2026-11-11 本輪（分支 `feat/008-010-dynamic-eligibility-conformance`，切自 `main` 的 `687bd34`，**未 commit、未 push**）
- **環境（這台，沒有 D 槽）：** Node v26.13.0、npm 11.20.0；`npm ci --ignore-scripts`；npm 快取與 Playwright 的 Chromium 都在暫存目錄（只對該次程序有效，不是 `D:/DevCache`，會被清掉）。
- **專案擁有者的回答：** 008～010 都做；安全依賴建議都接受；CONF-07 的一週上限網站不開放，只開放三天的範圍；CONF-10 貼上位置跟 Calendar 一樣；授權唯讀 `C:/Users/student/Project/juicy-calendar`。
- **008（partial）：** 沒改產品程式碼，新增 `e2e/dynamicEligibility.e2e.ts`（以注入的 `matchMedia` 模擬輸入能力變化）：8a／8b／8c／8d、OR-24 的 N-7、N-8、N-13、N-14。N-9、N-11 與 M-8 實機未執行。
- **009（partial）：** 規格空白結案（見 `issues/009`）；新增 `tests/conformanceTrial.test.ts`，只執行網站開放的操作：CONF-08 完整、CONF-02 步驟 0–1 部分，其餘標「暫不開放」。基準只做了原始碼對照，沒有執行 Calendar。`cases.test.ts` 的 openQuestion 斷言因專案擁有者的回答而改（契約變更，不是為了讓測試通過）。
- **010（partial）：** `public/preview/trial-zh-TW.png`、`trial-en.png` 由 `scripts/capturePreviewImages.ts` 對真實試用截出；`TrialSection` 引用，字典新增 `preview.image`；新增 `e2e/previewImage.e2e.ts`。英文圖下說明是暫定；視覺交給 `impeccable`；M-5 未執行。
- **三天與英文球名（專案擁有者後續回答，已實作，commit 見 git log）：** 試用日曆改為連續三天、每天 10:00–15:00（共 15 小時，不開放到一週；「三天」不是區塊長度上限）；種子球名稱英文版純英文、中文版中英並列，初始化時依網站語言決定、之後切換語言不改名。PRD／SRS／SDS／測試計畫的「單日」已同步；`settings.view` 改為 `visibleDays: 3`；兩張預覽圖已重截；新增 `e2e/trialLayout.e2e.ts`。三天以本地日期逐日加一產生（不是 +24 小時），日光節約與跨午夜未測。
- **三張收尾票（分支 `feat/013-012-008-followups`，疊在 PR #10 上，TDD）：** 013 `og:image`（先 5 項紅，再補 `index.html` 與 `applyPageMetadata`，社群平台實際預覽未驗證）；012 `ci.yml` 新增 `e2e` job（先 3 項紅，GitHub 上的實跑結果見該 PR 的 checks）；008 的 OR-24 N-9、N-11 e2e（產品程式碼沒改，不是自然紅燈；以拿掉 `radial.destroy()` 的突變檢查證明測試抓得到漏掉的計時器）。008 只剩 M-8 實機。
- **005／006／009／010 收尾（分支 `feat/005-006-009-acceptance`，疊在 #11 上，TDD）：** TC-02 磁吸表 12 列對網站 `pointerToTime` 逐列通過（換掉 `it.todo`）；新增 `e2e/trialDemo.e2e.ts`（TC-01a／01e／01f、TC-04 移動、取消、TC-06a～6d）；基準 `engine.test.ts` 五組磁吸值只讀交叉比對一致。這些測試第一次就綠（程式本來就對，不是自然紅燈），以突變檢查證明抓得到問題（磁吸門檻 8→9、偷塞 `localStorage`），已還原。調整長度、命名、TC-03 暫不開放；010 本輪沒有可完成項（等專案擁有者）。
- **gitleaks：** v8.30.1 裝在 `C:/DevTools/gitleaks/gitleaks.exe`（這台沒有 D 槽，專案擁有者同意裝 C 槽；其他有 D 槽的電腦裝 `D:/DevTools`）；下載檔在 `C:/DevCache/gitleaks`，zip 的 SHA-256 與官方 checksums 一致；未改 PATH。`gitleaks git . --redact`：48 個 commit，no leaks found（掃的是 git 歷史，沒掃工作樹）。
- **安全依賴：** `package.json` 新增 `overrides: { "minimatch": "11.0.7" }`，`npm audit` 由 1 個中度弱點降為 0；鎖定檔多一個開發期套件 `@isaacs/nonrecursive-glob-match`（minimatch 11 的相依）。比起 `npm audit fix --force`（會把 eslint 降到 9）改動小。2FA 與 Calendar immutable releases 要專案擁有者自己在帳號設定處理。
- **本機驗證（這台，2026-11-11）：** `npm run typecheck`、`lint`、`test`（31 檔 303 通過、1 todo）、`build` 通過；`npm run test:e2e`（Chromium，10 項，三天與英文球名改完後）通過；`npm audit` 0 個弱點。GitHub 上的 CI 實跑未做（e2e 也尚未納入 `ci.yml`）。

### 2026-11-11 試用區功能（PR #9 已合併；以下是當時的記錄）
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
