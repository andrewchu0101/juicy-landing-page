# 002: 首頁可開啟，下載入口有效（原 W-02）

**大小：** M

**What to build:** 訪客開啟首頁，看到頁首、試用區的容器（尚無試用內容）、下載區與頁尾。下載區有「下載 Windows 版」主按鈕指向 Calendar 的 GitHub Releases「最新版本」頁，另有免安裝 .zip 與原始碼連結、系統需求與限制說明；頁尾有 `LICENSE` 與 `TRADEMARKS.md` 連結。在 W1 1280×800 與 W2 390×844（皆為滑鼠環境）沒有水平捲動，下載區可抵達。

**UI 票：視覺設計與調整由 Owner 手動呼叫 `$impeccable`，不自動執行。** 本票先做結構與內容，不做視覺定稿。

**Blocked by:** 001。
- 其他阻塞（只阻塞對應驗收，不阻塞版面與結構）：Releases 的 owner／repo 未定 → 只阻塞 TC-10a 的 `href` 值驗收；D-10 授權落地未定 → 只阻塞 AC-02.3 完整驗收。連結目標放在單一設定常數，**不得把占位值當成已驗證的連結**。

**Status:** implemented（結構與內容；`href` 與授權連結目標仍未驗證，見下方實作紀錄）。已合併（`6db7530`）

**對應 TC：** TC-10a、TC-10c、TC-10d；M-3（W1／W2）。TC-10b 與 M-10（實際下載）在 011。

**預計檔案範圍（預估）：** `src/` 下的頁面元件（頁首、試用區容器、下載區、頁尾）、連結設定常數、樣式、對應測試。

**要讀的規格：** `docs/05-sds.md` UI-01、UI-04、UI-05、EXT-01；`docs/03-srs.md` FR-09、FR-15、NFR-03、NFR-04；`docs/02-prd.md` AC-02.1～AC-02.3。

**驗收指令（預定）：**
```bash
npm test          # 連結設定、下載區敘述、頁尾連結、水平捲動檢查
npm run build
```
人工（M-3）：以 W1、W2 視窗開啟預覽，確認無水平捲動、下載區可捲動抵達並可點擊；記錄瀏覽器與版本、截圖路徑。

## 驗收條件

- [x] 主按鈕的 `href` 等於設定常數；設定值是否為真正的 Releases 最新版本頁，標明「未驗證」直到 011（2026-11-11 專案擁有者指定 `andrewchu0101/juicy-landing-page`，取代占位值；查證該 repository 為 private、尚無 release、未登入開 `/releases` 回 404，故 `verification: 'unverified'` 維持；另注意「原始碼」連結現在指向本網站 repo，不是 Calendar 原始碼）
- [x] 下載區列出：僅支援 Windows 10 1803 以上 64 位元、需要 WebView2、安裝檔未簽章與 SmartScreen 處理、網頁試用為瀏覽器版、桌面 App 離線無帳號；每項附 Calendar 文件來源（人工對照，NFR-03）（來源已寫在 `src/content.ts` 的 `source` 欄；**人工對照 NFR-03 尚未做**）
- [x] 從開啟首頁到抵達 Releases 頁，點擊不超過 2 次（主按鈕為首頁上的直接連結，1 次）
- [x] 頁尾有 `LICENSE`、`TRADEMARKS.md` 連結，文字目前以中文呈現（語言切換在 003）（目標檔案尚不存在，D-10）
- [x] W1、W2 下無水平捲動，下載區可抵達（Playwright Chromium 實測，見下）
- [x] 網站自己的控制項可用鍵盤操作並有可辨識名稱（原生 `<a href>`；自動檢查名稱與 tabindex，未做逐鍵實測）
- [x] 測試結果實際執行並貼出；TC 其餘狀態維持「未執行」

## 實作紀錄（2026-11-09）

**新增套件（Owner 核准）：** devDependencies `@types/react@19.3.0`、`@types/react-dom@19.3.0`（React 19 不附型別，strict typecheck 需要）。

**變更：** `src/config/links.ts`（`CALENDAR_REPO`、`DOWNLOAD_LINKS`、`LEGAL_LINKS`）、`src/content.ts`、`src/App.tsx`、`src/components/{Header,TrialSection,DownloadSection,Footer}.tsx`、`src/main.ts` → `src/main.tsx`、`src/styles.css`、`src/vite-env.d.ts`、`index.html`（入口、`lang="zh-TW"`）、`tsconfig.json`（`jsx: react-jsx`）、`tests/links.test.ts`、`tests/home.test.tsx`。

**追溯：**

| 項目 | 測試／證據 | 結果 |
|---|---|---|
| TC-10a（FR-09、AC-02.1） | `tests/links.test.ts`、`tests/home.test.tsx` | Passed（只驗 `href` 由單一常數產生且形式為 `…/releases/latest`；常數是占位值，**未驗證**） |
| TC-10c（AC-02.2、NFR-03） | `tests/home.test.tsx`（敘述存在） | Passed（只驗文字存在；逐條對來源為人工，**Manual Pending**） |
| TC-10d（AC-02.3、FR-15） | `tests/home.test.tsx` | Passed（連結存在；目標檔案未落地，**完整驗收仍受 D-10 阻塞**） |
| UI-01 鍵盤／名稱 | `tests/home.test.tsx` | Passed（建立時即為綠燈，屬特徵化測試，沒有紅燈階段） |
| M-3（W1／W2） | Playwright Chromium（MCP）對 `npm run preview`；`scrollWidth == clientWidth`（1280、390 皆是）、下載區可捲到；截圖 `.playwright-mcp/w2-390x844.png` | 本機 Chromium 通過；**沒有 Windows 真實瀏覽器版本記錄、沒有真實滑鼠環境判定**，M-3 的「試用可互動」部分在 004 之後 |
| TC-10b、M-10 | — | Not Run（011） |

**偏差與假設：**
- 免安裝 .zip 連結暫指同一個 `releases/latest` 頁（實際檔名未知）。
- 頁尾連結指向本網站 repo 的 `blob/main/LICENSE`、`blob/main/TRADEMARKS.md`；兩個檔案目前不存在，連結現在是 404。
- 「網頁試用為瀏覽器版」那一項的來源是本專案文件（Brief R-08），不是 Calendar 文件。
- Calendar README 目前仍寫安裝檔「planned／未在乾淨電腦試過、1803 未驗證」（D-04）；下載區現未呈現這點，是否要加由 Owner 決定。
- 預覽時 console 有 `/favicon.ico` 404（013 metadata 範圍）。
