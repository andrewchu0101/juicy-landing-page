# 025: CI 與 Vercel 以 --ignore-scripts 安裝，並固定有安裝腳本的套件清單

**大小：** S

**What to build:** 依賴的 `preinstall`／`install`／`postinstall` 會在建置機上執行任意程式碼。本站不需要它們，所以 `ci.yml` 與 `vercel.json` 的 `installCommand` 都用 `npm ci --ignore-scripts`；測試固定「鎖定檔中有安裝腳本的套件」清單，新增一個就必須人工審查。

**Blocked by:** 無。

**Status:** implemented（2026-11-11，本機）。**Vercel 與 GitHub Actions 上的實際安裝尚未驗證。**

**範圍外：** 新增或升級套件（`npm audit` 的 minimatch 警告見下）、本機 `npm install` 的指令（AGENTS.md 的本機指令不變）。

**預計檔案範圍：** `.github/workflows/ci.yml`、`vercel.json`、`tests/installPolicy.test.ts`。

**驗收指令：**
```bash
npm run typecheck && npm run lint && npm test
# 乾淨環境驗證：複製專案（不含 node_modules），npm ci --ignore-scripts，再跑 typecheck／lint／test／build
```

## 驗收條件

- [x] RED：先寫測試，三項失敗（Vercel、CI、workflow 規則），「只有 fsevents 有安裝腳本」本來就成立；改設定後全綠
- [x] 乾淨環境驗證：把專案複製到暫存目錄（不含 `node_modules`、`.git`），`npm ci --ignore-scripts --cache D:\DevCache\npm-juicy-landing-page` 後，`typecheck`、`lint` 通過，`npm test` 23 檔 172 項通過（1 todo），`npm run build` 成功。也就是這個專案不需要任何安裝腳本
- [x] 推送後 CI 實跑、合併後 Vercel 部署成功（2026-11-13：main `a4cb715` 的 CI 成功；該 commit 的 Vercel 狀態 `success`「Deployment has completed」；`vercel.json` 的 `installCommand` 為 `npm ci --ignore-scripts`。沒有看 Vercel 建置日誌，所以「Vercel 實際以 `--ignore-scripts` 安裝」是依設定推斷，不是日誌證據）

## 實作紀錄與發現

- 鎖定檔中唯一有安裝腳本的是 `node_modules/fsevents`（macOS 專用的 optional 套件，Windows 與 Linux 不會安裝）。
- `npm audit`（2026-11-11）回報 1 個中度弱點：`minimatch` 7.0.0–11.0.0 的 DoS（GHSA-g3hv-75wg-m249），經由 `eslint`、`typescript-eslint` 等 **開發期 lint 工具**進來，不會進入網站的建置產物。npm 建議的修法是把 `eslint` 降到 9.39.5，屬於破壞性變更，且要動套件，依 AGENTS.md 需你同意，本票不處理。
