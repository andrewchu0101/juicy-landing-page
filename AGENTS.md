# Juicy Landing Page —— agent 工作規則

> 來源：`agent-templates/AGENTS.safe.md`。與 `CLAUDE.md`（初始化與協作流程）、`CODING_STANDARD.md`（程式碼規範）並用。
> 標示「待確認」的欄位，等技術棧決定後再填。

## 規格在哪

- 需求以 `docs/02-prd.md` 與 `docs/03-srs.md` 為準，設計以 `docs/04-sad.md` 與 `docs/05-sds.md` 為準，測試以 `docs/06-test-plan.md` 為準。
- 兩份文件衝突時，**停下來問我**，不要自己選一個。
- 規格沒寫的行為，不要自己決定。列出來問我。

## 怎麼跑

```bash
npm install --cache /d/DevCache/npm-juicy-landing-page   # 依 package-lock.json 安裝（快取以程序層級覆寫放 D 槽）
npm run typecheck   # tsc --noEmit
npm test            # vitest run（含 health smoke test：實際建置並啟動預覽，首頁回 200）
npm run build       # 型別檢查加 vite build
npm run preview     # http://127.0.0.1:4173/
```

說「完成」之前，必須跑過測試指令，並把結果貼出來。

## 範圍

- 一次只做一張票。發現需要改票以外的檔案，先問我。
- 不重構與這張票無關的程式碼。

## 套件

- **不准新增任何套件**，除非先說明理由並得到我同意。
- 允許的套件以 `專案的依賴設定檔（待確認）` 現有的為準。

## 秘密

- API key、密碼、token 一律從環境變數讀取，不准寫進任何檔案。
- 不准讀取或印出 `.env` 的內容。
- 範例設定檔用 `.env.example`，值一律填 `changeme`。

## 輸入與輸出

- 所有外部輸入（使用者輸入、API request、LLM 回傳）都要驗證格式，驗證失敗就拒絕，不要猜。
- 資料庫查詢一律用參數化，不准用字串拼接 SQL。
- 輸出到網頁的內容一律跳脫（escape），防 XSS。
- 錯誤訊息不准包含堆疊追蹤、資料庫內容或金鑰。

## 不准做的事

- 不准 `git push --force`、不准 `git add -A`、不准合併 PR。
- 不准刪除或修改測試來讓測試通過。

## 本專案

> 下列規則來自專案擁有者已確認的決定與 `docs/LESSONS.md`。與上面的原廠規則重複的不再列（例如不新增套件）。

- **沿用 Calendar：** 試用的日曆操作沿用 Juicy Calendar，不新增 App 沒有的日曆功能或控制項。沿用項目與來源以 `docs/03-srs.md` 沿用登記表為準。讀 Calendar 一律用固定 commit：`git -C <Calendar repository> show 102ae1917047aee691e88cef9c497b50df745c41:<路徑>`，不讀工作樹。repository 位置依機器而異，見 `docs/HANDOFF.md`；程式、測試與 CI 不寫死機器絕對路徑。
- **Calendar 與發布：** 未經專案擁有者另案授權，不修改 Calendar、不發布套件、不設定憑證。Calendar 外部依賴票（`issues/015`～`018`）只是依賴，不是授權。
- **已決定的設計（2026-11-11，專案擁有者）：** ADR-03 選 B（網站自己組裝）、ADR-04 選 B（滑鼠進試用區才啟用快捷鍵）、OR-20 新增／編輯球排除與圓形選單保留；**不修改 Calendar、不新增套件**，試用的行為與樣式由網站自己照 Calendar 固定 commit 實作（`src/trial/`），要與 Calendar 做得一模一樣。本輪只開放長按出球、拖球放置、拖移區塊；調整長度、命名、刪除、復原留到下載後體驗，不要自己加。
- **未核准的設計：** 共用模組發布管道、開發期取得方式（已不阻塞試用，因為試用不再 import Calendar）在專案擁有者核准前都只是建議。
- **測試預期值：** 預期值來自規格與人工算例，不呼叫實作程式去算答案。固定 Calendar 基準的執行結果只作交叉比對；不一致時記錄差異與來源，先查原因，不修改預期值迎合實作。
- **證據與狀態：** 沒有執行證據的一律標「未執行」。說「沒有測試」之前先唯讀查證；「預期值來源」與「測試補齊依賴」分開記錄。下載驗收要分開記錄 `href` 正確與實際下載可用，未人工確認前不得宣稱下載已驗收。
- **隱私：** 試用內容（區塊標題與時間）不上傳、不保存；`localStorage` 只可存語言偏好。
- **互動資格：** 只看主要輸入是否同時符合 `pointer: fine` 與 `hover: hover`，不看螢幕寬度、裝置、作業系統或瀏覽器名稱與版本。視窗尺寸不能代替輸入能力驗證。
- **UI 票：** 視覺設計與調整由專案擁有者手動呼叫 `impeccable`，不自動執行。
