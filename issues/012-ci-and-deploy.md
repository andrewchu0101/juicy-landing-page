# 012: CI 與部署設定（原 W-12）

**大小：** M

**What to build:** 每次變更自動跑型別檢查、lint、單元測試、建置與一致性案例，並比對鎖定檔版本與 SRS 沿用登記表基準（INV-11；**已更改決定**：2026-11-11 試用不再依賴共用模組，沒有共用模組版本可比對，本項不再需要）；Vercel 連線與預覽部署、預覽保護、安全標頭。**此票不阻塞任何功能票**，功能票在本地即可測。

**Blocked by:** 001。
- 發布管道的憑證（D-11，**已更改決定**：2026-11-11 試用不再依賴共用模組，不需要讀取憑證；以下為舊敘述：**尚未核准**；原建議 P1 私有 npm 需 CI 與 Vercel 各一個讀取憑證，但 2026-11-11 Calendar 已公開，該前提已變，見 SAD「前提變更」）。**本票不得自行設定憑證。**
- eslint 等套件：專案擁有者 2026-11-10 已核准安裝（lint 部分已實作）。注意 typescript-eslint 8.72.2 不支援 TS 7，已改用官方建議的並存方式：`typescript` 別名指向 `@typescript/typescript6@6.0.2`（供 typescript-eslint），`@typescript/native` 別名指向 `typescript@7.0.2`（`tsc` 仍是 7.0.2）。
- Vercel 不會自動等待 CI，阻擋機制須設計。

**Status:** partial（2026-11-13 更新：只剩「Vercel 還原部署演練」一項，需要在 Vercel 後台操作，我無法代做；）（`ci.yml` 有 `check`（typecheck、lint、test、build）與 `e2e`（Chromium，2026-11-11 新增，GitHub 上的實跑結果見下方實作紀錄）兩個 job；PR #3 的 run 42661882621 是只有 typecheck／test／build 的紀錄。INV-11 比對已更改決定不需要；Vercel 預覽保護、回退演練、憑證仍未做）

**對應 TC：** 無直接 TC；支撐 INV-11、NFR-09

**預計檔案範圍（預估）：** `.github/workflows/`、Vercel 設定檔、安全標頭設定、lint 設定。

**要讀的規格：** `docs/04-sad.md`「運作、風險與未決」、「版本同步與回退」；`docs/03-srs.md` NFR-09；`docs/05-sds.md` INV-11。

**驗收指令（預定）：**
```bash
npm run typecheck && npm run lint && npm test && npm run build
```
人工：在預覽部署確認預覽是否公開（Brief R-11）、安全標頭是否生效；演練一次升級與回退。

## 驗收條件

- [x] CI 在 PR 上實際執行並回報（PR #3；僅 typecheck、test、build 的紀錄；加入 lint 後尚待 CI 實跑，一致性案例未含）
- [x] 鎖定檔版本與登記表基準不一致時 CI 失敗 —— **不適用**（已更改決定：沒有共用模組；套件鎖定改由 `tests/lockfileGuard.test.ts` 把關）
- [x] 預覽部署的保護設定已確認（2026-11-13：PR #11 的預覽網址 `curl -s -o /dev/null -w '%{http_code}'` 回 302，導向 `vercel.com/sso-api`，未登入看不到；正式網址回 200。只驗了這一個預覽網址，Vercel 後台的設定頁本身沒有看過）
- [ ] 回退演練（共用模組版本回退已更改決定，不再適用；Vercel 還原部署的可用性仍待驗證）：把鎖定版本改回上一版並重新建置；Vercel 還原部署的可用性標「未驗證」直到演練
- [x] 沒有把憑證寫進任何檔案；實際設定憑證前已得到你的核准（2026-11-13：`.github/` 沒有任何 `secrets.` 引用；新增 `tests/noCredentials.test.ts` 掃描 src、tests、e2e、scripts、docs、issues、`.github` 與根目錄設定檔，找 GitHub／AWS／npm／Slack 憑證格式與私鑰區塊，目前 0 筆；植入假 token 時測試會失敗，已還原。這是樣式比對，不是 gitleaks 的替代品，自訂格式的密碼抓不到）

## 實作紀錄：e2e 納入 CI（2026-11-11，TDD：先紅後綠）
- **紅：** 先在 `tests/workflowSecurity.test.ts` 加「ci.yml 跑 Playwright e2e」3 項：有獨立的 `e2e` job（且 `check` job 不含 e2e）、依序 `npm ci --ignore-scripts`、`npx playwright install --with-deps chromium`（整份只出現一次）、`npm run test:e2e`、有自己的 `timeout-minutes`。執行 3 項失敗（job 不存在）。
- **綠：** `ci.yml` 新增 `e2e` job（沿用已釘 SHA 的 checkout 與 setup-node，不新增第三方 Action；不用 secrets；權限仍是最上層的 `contents: read`）。`tests/workflowSecurity.test.ts` 其餘既有的 SHA 釘選、權限、secrets 檢查對新 job 也通過；全部 311 通過、1 todo。
- 限制：這些測試只檢查 workflow 檔文字。e2e 在 GitHub 的 ubuntu 上能不能過，要看 PR 的 run。

## 實作紀錄：2026-11-13 收尾
- **預覽保護：** 見上。預覽網址取自 PR #11 的 Vercel 留言。
- **憑證：** 先寫 `tests/noCredentials.test.ts`；第一版因 `@types/node` 不存在（不新增套件）而型別錯誤，且樣式裡的反斜線被吃掉導致 `.npmrc` 範例沒被抓到——這兩個都是測試自己的錯，修正後 3 項通過；以植入假 token 的突變檢查證明抓得到問題。
- **還沒做：** 回退演練（Vercel 還原部署的可用性仍是「未驗證」）。要在 Vercel 後台把正式網址還原到前一個部署再還原回來，會影響正式網站，需要你決定時間並操作；本票因此維持 `partial`。
