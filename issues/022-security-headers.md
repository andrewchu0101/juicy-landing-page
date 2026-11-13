# 022: Vercel 安全標頭（CSP 等）

**大小：** S

**What to build:** 新增根目錄 `vercel.json`，為所有路徑加上安全標頭：`Content-Security-Policy`（只允許同源 script／style／connect，無 inline 與 eval）、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`。對應 `docs/07-release-checklist.md` 第 16 列與 NFR-06（試用內容不上傳：`connect-src 'self'`）。

**Blocked by:** 無。

**Status:** implemented（2026-11-11，設定檔與本機驗證）。**部署後標頭是否生效尚未驗證**，要在合併後的 Vercel 部署用 `curl -I` 確認。

**範圍外：** 流量統計（D-03）所需的來源、005 真實接入後共用模組可能需要的 CSP 放寬、HSTS（Vercel 對其網域已處理，自有網域 D-02 決定後再評估）。

**預計檔案範圍：** `vercel.json`、`tests/securityHeaders.test.ts`、`tests/health.test.ts`。

**驗收指令：**
```bash
npm run typecheck && npm run lint && npm test && npm run build
curl -sI https://<部署網址>/    # 人工，合併後
```

## 驗收條件

- [x] RED：先寫 `tests/securityHeaders.test.ts`，在 `vercel.json` 不存在時失敗；再建檔轉綠
- [x] 預期標頭值為字面規則，不呼叫實作計算
- [x] 建置產物沒有 inline script／style／事件屬性（`tests/health.test.ts`），所以嚴格 CSP 不會擋掉自己的頁面
- [x] 本機驗證：用小型 Node 伺服器套用 `vercel.json` 的標頭，Playwright 開啟建置產物，頁面正常渲染（含 SHA-256 區塊），console 無 CSP 違規（唯一錯誤是 `favicon.ico` 404，網站本來就沒有 favicon，與 CSP 無關）。這是本機模擬，不是 Vercel 實際回應
- [x] 合併並部署後，`curl -I` 確認五個標頭都在（2026-11-13：`curl -sI https://juicy-landing-page-tau.vercel.app/` 回 200，`Content-Security-Policy`、`Permissions-Policy`、`Referrer-Policy`、`X-Content-Type-Options`、`X-Frame-Options` 五個都在，另有 `Strict-Transport-Security`；只驗了首頁，其他路徑與預覽網址沒有逐一驗）

## 風險與後續

- 005 接入 Calendar 共用模組後，若它在執行期注入 `<style>` 或使用 `eval`，嚴格 CSP 會擋住；屆時要在 005 驗證並明確放寬，不要預先放寬。
- 加入統計工具（D-03）時，要同時改 `script-src`／`connect-src` 並更新測試。
