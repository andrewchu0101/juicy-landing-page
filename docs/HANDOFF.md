# HANDOFF —— Juicy Landing Page 交接紀錄

> 這份記「這一輪做到哪、下一步」。整個專案的狀態只在里程碑改變時才記到 `CURRENT_STATUS.md`（目前尚未建立）。
> 寫給沒看過這段對話的人：只寫查得到的事實，證據附指令或路徑。

## 摘要（每次覆寫這一段）

| 項目 | 內容 |
|---|---|
| 更新時間 | 2026-11-09 16:56 |
| 目前目標 | 需求文件（Brief／PRD／SRS）已改為「試用沿用 Juicy Calendar」，並產出 SAD／SDS 草稿；等專案擁有者審查，尚未開始實作 |
| 工作目錄 | `C:\Users\student\Project\juicy-landing-page` |
| 分支／HEAD | `docs/sad-sds-calendar-reuse` ／ `95d6333`（寫本文件時；本文件的 commit 在其後）。`main` 與 `origin/main` 停在 `0c0e63f` |
| 工作樹 | 除本文件外，有未追蹤且**刻意未提交**的檔案：`diagrams/*.html`（8 個，依舊版 SRS 繪製，已過期，只作參考）、`issues/001-guard-secrets-false-positives.md`、`.claude/hooks/test-guard-secrets.sh`（守衛修復票，待確認，不要修改或繞過守衛） |

### 已完成
- Brief、PRD v0.5、SRS v0.4 同步：撤回網站專屬規則（30 分鐘吸附、最小 30 分鐘、最晚起始 13:00、超界拒絕、狀態文字區、鍵盤移動、刪除控制項停用等），日曆操作沿用 Calendar —— 證據：`docs/01-brief.md`、`docs/02-prd.md`、`docs/03-srs.md` 的變更紀錄
- SRS 沿用登記表 REUSE-01～15（固定 Calendar 完整 commit `102ae1917047aee691e88cef9c497b50df745c41`，區分程式碼查證／測試存在／測試已執行）—— 證據：`docs/03-srs.md`「沿用登記表」
- AC-01.1 依 App 磁吸門檻精確化（≤ 8 像素吸附，否則整分鐘四捨五入）—— 證據：`docs/02-prd.md`；`docs/05-sds.md`「磁吸換算表」（用 Node 重算規則，11 列相符；不是執行 Calendar 程式碼）
- SAD／SDS 草稿 —— 證據：`docs/04-sad.md`、`docs/05-sds.md`；`git diff --check -- docs/` 通過；REUSE、SAD／SDS 內部編號交叉比對通過
- 已 commit 並 push 分支 `docs/sad-sds-calendar-reuse`（commit `95d6333`）

### 進行中
- 無。等專案擁有者審查 SAD／SDS 與需求同步結果。

### 阻塞
- 專案擁有者審查與下列決策（SAD「待確認決策」）：Calendar 端改動 S1～S7、ADR-03（`CalendarWorkbench`）、ADR-04／OR-26（快捷鍵 `scope`）、OR-20（新增／編輯球、radial 選單）、OR-21／D-11（共用模組發布管道與權限）、載入失敗文案、OR-18（metadata 與分享圖）、套件清單核准。皆不阻擋草稿，阻擋實作或發布。
- 公開上線前：D-10（LICENSE、商標、Calendar 來源授權）、D-02 網域、D-03 統計工具、D-04 Windows 版驗證。

### 下一步（最多三項）
1. 審閱 `docs/04-sad.md`「Gate」的待確認決策表，回答 ADR-03、ADR-04、OR-20、D-11；需要讀 `docs/04-sad.md`、`docs/05-sds.md`。
2. 決定 Calendar 端接縫改動（S1～S7）是否另案進行，並在 Calendar 共用層補 OR-25 的測試（100 步上限、鍵盤層無選取按刪除、失焦或卸載提交名稱、磁吸門檻邊界）；需要讀 `docs/04-sad.md`「測試與一致性驗證」。
3. 處理未提交的 `diagrams/`、`issues/`、守衛測試檔（先確認守衛修復票），並自行決定是否把分支開 PR 併回 `main`。

相關 issue／PR：issue 檔 `issues/001-guard-secrets-false-positives.md`（未提交）；分支已推送，**尚未開 PR**：https://github.com/andrewchu0101/juicy-landing-page/pull/new/docs/sad-sds-calendar-reuse

### 狀態核對（分開寫，不要混為一談）

| 面向 | 狀態 | 說明 |
|---|---|---|
| 已實作 | 否 | 只有文件，沒有程式碼、沒有技術棧安裝 |
| 自動測試 | Not Run | 沒有可跑的測試。**Calendar 的測試一個都沒執行過**，登記表中「測試存在」只表示檔案存在。文件檢查：`git diff --check -- docs/` 通過 ／ 環境：Windows 10，Git Bash |
| 人工驗收 | Manual Pending | 需求與設計尚未經專案擁有者審查；靜態預覽圖尚未製作 |
| 已 commit | 是（分支 `docs/sad-sds-calendar-reuse`） | 不含上列未追蹤檔案；本文件另行 commit |
| 已 push | 是；已核對遠端建立該分支 | `main` 未變動 |

### 接手者要先知道
- 讀 Calendar 時一律用固定 commit：`git -C ..\juicy-calendar show 102ae1917047aee691e88cef9c497b50df745c41:<路徑>`。Calendar 目前 HEAD 與基準不同，不要讀工作樹。這輪沒有修改 Calendar。
- 方向已定：試用沿用 Calendar 的操作與規則，不新增 App 沒有的日曆功能；與此衝突的網站專屬規則已撤回，不要再當成前提。共用方式採方案 B（兩個 repository、版本化共用模組）；發布管道與權限未核准，不要設定憑證或發布套件。
- 「找不到測試」不等於「沒有測試」；登記表的未找到都附了搜尋範圍。
- 未更新的小項：PRD AC-01.7 的磁吸描述仍是「靠近 12:30 刻度線」（上一輪限定只改 AC-01.1）；Brief 的舊變更紀錄沒有逐條標「已被取代」，只有新條目說明取代。
- 發現 OR-26：Calendar 的快捷鍵監聽在 `window` 上，放進 landing page 會攔截整頁的 Ctrl+C（讀程式碼的結論，未在瀏覽器驗證）。
- 這台是暫時工作電腦（沒有 D 槽）；本機工具沿用實際路徑，程式、測試與 CI 不寫死機器絕對路徑。`CLAUDE.md` 的 D 槽規則保留給有 D 槽的主要電腦。

---

## 歷史紀錄

（首次建立，無更早的摘要。）
