# 023: GitHub Actions 釘到完整 commit SHA，並以測試守住 workflow 權限

**大小：** S

**What to build:** `actions/checkout@v4`、`actions/setup-node@v4` 的版本標籤可被移動，改釘到完整 commit SHA 並附版本註解；新增測試固定「最小權限、無 secrets、不用 `pull_request_target`」。

**Blocked by:** 無。

**Status:** implemented（2026-11-11，檔案與本機測試）。**Actions 在 GitHub 上的實際執行尚未驗證**，推送後看 run 結果。

**範圍外：** 設定 secrets 或憑證、新增 workflow、Dependabot（需另案）、分支保護（見 020 建議）。

**預計檔案範圍：** `.github/workflows/ci.yml`、`.github/workflows/calendar-release-check.yml`、`tests/workflowSecurity.test.ts`。

**驗收指令：**
```bash
npm run typecheck && npm run lint && npm test
gh api repos/actions/checkout/git/ref/tags/v4 --jq .object.sha
gh api repos/actions/setup-node/git/ref/tags/v4 --jq .object.sha
```

## 驗收條件

- [x] RED：先寫測試，兩支 workflow 的「釘 SHA」案例失敗（權限、secrets 案例本來就通過）；釘選後全綠
- [x] 兩個 SHA 由 `gh api` 向 `actions/*` 官方 repository 取得，不是從記憶或第三方來源填入
- [x] 每個 `uses:` 都是 40 位 SHA 且附 `# v4` 註解
- [x] 頂層 `permissions` 只有 `contents: read`
- [ ] 推送後 CI 與 `calendar-release-check` 在 GitHub 上實際跑過（未執行）

## 實作紀錄

- 2026-11-11 解析：`actions/checkout` v4 → `11d5960a…7262`；`actions/setup-node` v4 → `49933ea5…0820`。v4 是會前進的標籤，之後要升級請人工查新 SHA 再改，並更新註解。
- 這能擋「標籤被移到惡意 commit」，不能擋「官方 Action 本身在該 SHA 就有問題」。
