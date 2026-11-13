# 020: P2 可行性與兩個 repository 的供應鏈唯讀稽核

**大小：** M

**What to build:** 唯讀檢查 Calendar 能否被網站以 git 依賴取得（SAD P2），並掃描兩個 repository 的 git 歷史有無 secret、私人資料。只產生報告，不修改 Calendar、不裝工具。

**Blocked by:** 無。

**Status:** implemented（2026-11-11；報告即本檔「稽核結果」）

**範圍外：** 修改 Calendar、啟用分支保護、啟用 2FA、發布任何東西。以上都需專案擁有者另案決定。

**驗收指令（唯讀）：**
```bash
git -C <Calendar repository> show HEAD:package.json
gh api repos/andrewchu0101/juicy-calendar --jq '{license:.license.spdx_id}'
gh api repos/<owner>/<repo>/branches/main/protection
gh api repos/<owner>/<repo>/rulesets --jq length
git rev-list --all | while read c; do git grep -I -n -E -i "<pattern>" $c; done
```

## 驗收條件

- [x] 報告列出每一項的結果，並區分已查證、未查證、推測
- [x] 沒有安裝任何工具、沒有修改任何 repository

## 稽核結果（2026-11-11，Calendar HEAD `a1c64e5` 附近；D 槽電腦）

**P2 可行性（Calendar `package.json`，已查證）**
- `"private": true`，沒有 `main`、`exports`、`types`、`files`；根目錄是 Tauri 桌面 App（`tauri`、`desktop:build` 等腳本）。**結論：目前不能直接當 git 依賴**，需先完成 016 套件邊界（Calendar 端改動，未授權）。
- 沒有 `prepare`、`preinstall`、`postinstall` 腳本，所以 git 依賴安裝時不會因 Calendar 自己的腳本執行程式碼；依賴的依賴是否有腳本未查。
- Calendar 無 LICENSE（`license` 欄位為空）；Calendar 無 `.github/`，沒有 CI。
- `package.json` 依賴使用 `^` 範圍；網站端靠 `package-lock.json` 與 `npm ci` 鎖定。

**git 歷史掃描（正規表達式，不是專用工具）**
- 範圍：本站 35 個 commit、Calendar 59 個 commit，所有 ref。
- 模式：AWS key、GitHub token、`sk-` 金鑰、Slack token、私鑰標頭、`api_key／secret／password／token = 16 字元以上` 的賦值。
- 結果：**沒有真正的 secret**。命中只有兩類誤報：`.claude/hooks/test-guard-secrets.sh` 的測試夾具（假值 `sk-abcdefghijklmnop`），以及 Calendar `diagrams/*.html` 內名為 `token` 的程式變數。
- 曾被追蹤的敏感檔名（`.env*`、`*.pem`、`*.key`、`*.pfx`、`id_rsa`、`*credentials*`）：無。
- 絕對使用者路徑（`C:\Users\`、`/Users/`）：只檢查本站與 Calendar 各前 50 個 commit，**無命中**；超過 50 個的部分未查。
- 作者 email：全部是 GitHub noreply 位址，沒有個人信箱。
- **限制：** 這是 `git grep` 的樣式比對，不如 gitleaks／trufflehog；二進位檔（`-I` 略過）、壓縮檔與編碼過的內容沒掃。需要更強的掃描要安裝工具，依 `CLAUDE.md` §3 先經你同意並放 `D:\DevTools`。

**GitHub 設定（`gh api`，已查證）**
- 兩個 repository 的 `main` 皆**沒有分支保護**（404）、**沒有 ruleset**（0）。
- Calendar Release `v0.2.0-beta.3`：`immutable: false`；附件由 `andrewchu0101` 上傳（Calendar 沒有 CI，推測為手動上傳，未驗證）。
- 2FA：API 查不到，**未驗證**。

**建議（皆需專案擁有者決定，本票不執行）**
1. 兩個 repository 的 `main` 啟用保護或 ruleset（要求 PR、禁止 force push）。**〔已於 2026-11-11 經專案擁有者授權啟用，設定見 `docs/04-sad.md`「前提變更」〕**
2. 確認 GitHub 帳號 2FA。
3. Calendar 的 Release 評估啟用 immutable releases（是否可用未查證）。
4. 若要更強的歷史掃描，核准在 `D:\DevTools` 安裝 gitleaks。

## 2026-11-13 更新（專案擁有者）
- GitHub 帳號 2FA：**已啟用**（專案擁有者陳述，API 查不到，我沒有獨立驗證）。
- Calendar 的 Release 設為不可竄改（immutable）：專案擁有者表示要設定，**尚未確認完成**。注意：這項設定只對設定之後發布的 release 生效，已發布的 `v0.2.0-beta.3`（目前 `immutable: false`）不會因此變成不可竄改；網站仍以 SHA-256 釘選把關。
