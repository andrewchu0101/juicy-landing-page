# 021: 下載檔 SHA-256 釘選、排程比對與頁面顯示

**大小：** M

**What to build:** Calendar 的 Release 附件事後可被替換（`immutable: false`），只固定 tag 與檔名擋不住。把免安裝 zip 的 SHA-256 釘在 `src/config/links.ts`；排程檢查比對 GitHub 回報的資產 digest；下載區顯示雜湊與 `Get-FileHash` 驗證方式（中英文）。

**Blocked by:** 無。

**Status:** implemented（2026-11-11）。**不等於下載已驗收**：`href` 正確（TC-10a）、雜湊與 Calendar 的 `SHA256SUMS.txt` 一致（自動化證據）、實際下載後可解壓啟動（M-10）是三件事，M-10 仍 Manual Pending，`verification: 'unverified'` 維持。

**對應 TC：** TC-10a（`sha256` 常數）、TC-10e（頁面顯示）、`calendarRelease` 單元測試。

**範圍外：** 修改 Calendar、讓 Calendar 的 Release 不可變、程式碼簽章、出處證明（需 Calendar 端 CI，未授權）。

**預計檔案範圍：** `src/config/links.ts`、`src/content.ts`、`src/site/dictionaries.ts`、`src/components/DownloadSection.tsx`、`scripts/calendarRelease.ts`、`tests/links.test.ts`、`tests/calendarRelease.test.ts`、`tests/home.test.tsx`、`tests/languageSwitch.test.tsx`。

**驗收指令：**
```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run check:calendar-release
```

## 驗收條件

- [x] 預期雜湊是字面常數，來自 Calendar 的 `SHA256SUMS.txt`（人工對照），不呼叫實作計算
- [x] 資產 digest 不符 → 檢查失敗並提示「檔案可能被替換」；digest 缺漏 → 失敗（不把查不到當通過）
- [x] `parsePinned` 對缺少或格式錯誤的 `sha256` 丟錯，不猜
- [x] 下載區顯示雜湊（`<code>`）與 `Get-FileHash` 說明，中英文鍵集合相同（TC-09）；沒有新增連結（連結數維持 5）
- [x] RED：先寫測試，4 項失敗（含套件層級解析失敗）後才實作；GREEN：全部通過
- [ ] M-10 人工下載驗收（011）

## 實作紀錄

- 2026-11-11 `gh api repos/andrewchu0101/juicy-calendar/releases/tags/v0.2.0-beta.3`：zip 的 `digest` 為 `sha256:c32de372…dc32`，`SHA256SUMS.txt` 同值；網站釘選值與兩者一致。
- Calendar 發新版時，`tag`、`portableZip`、`sha256` 與 `tests/links.test.ts`、`tests/calendarRelease.test.ts` 的字面常數要一起更新（清單第 21 列）。
- 限制：GitHub 的 `digest` 欄位是 GitHub 計算的，不是獨立來源。它能偵測「附件在釘選後被換掉」，不能證明原始檔案本身可信。
