# 013: 搜尋與分享 metadata（原 W-13）

**大小：** S

**What to build:** 首頁的初始 HTML（不執行 JavaScript）就包含頁面標題、描述、`<html>` 語言屬性，以及 Open Graph 的標題、描述、網址與圖片。不因此增加框架。

**Blocked by:** 002。
- **OR-18 決策（建議 M1：單一頁面、`lang="zh-Hant"`、繁中標題與描述，語言切換後以腳本更新；**2026-11-10 專案擁有者已核准 M1**）。** 分享圖在互動版完成前不放占位或仿真圖。

**Status:** done（2026-11-13：D-02 已決，網域就是 Vercel 的網域，不再是「暫用」；新增專用 1200×630 分享圖（中英各一）、canonical、`og:site_name`；社群平台實際預覽仍未驗證）；以下為先前記錄：implemented（2026-11-11：`og:image` 補上，用實際運作的繁中試用截圖；`og:url`、`og:image` 暫用 Vercel 預設網域，自有網域 D-02 決定後替換。社群平台實際顯示的預覽未驗證）

**對應 TC：** TC-10e

**預計檔案範圍（預估）：** `index.html` 的 head、分享圖素材（待 010 之後）。

**要讀的規格：** `docs/03-srs.md` NFR-08、OR-18；`docs/04-sad.md`「搜尋與分享 metadata」。

**驗收指令（預定）：**
```bash
npm run build && grep -E "<title>|og:title|og:description|og:url|og:image|<html lang" dist/index.html
```

## 驗收條件

- [x] 建置產物的 `index.html`（不執行 JS）含標題、描述、`lang`、`og:title`、`og:description`、`og:url`、`og:image`（含 alt、type、width、height）與 `twitter:card`；`og:url`／`og:image` 用 Vercel 的網域（D-02 已決，2026-11-13）
- [x] 所採方案已由你核准後才實作（M1，2026-11-10）
- [x] 實際執行並貼出（見下方實作紀錄）

## 實作紀錄（2026-11-11，TDD：先紅後綠）
- **紅：** 先改 `tests/metadata.test.ts`：新增 og:image（絕對網址、alt、type、尺寸）、`twitter:card`、og:url 與 `SITE_ORIGIN` 同源、語言切換後 og:image 與 alt 換成該語言；把「不得有 og:image」改為「有實際截圖」（契約變更：互動版與截圖已完成）。執行 5 項失敗（og:image 缺、`SITE_ORIGIN` 不存在、`twitter:card` 缺、兩個語言切換案例）。
- **綠：** `index.html` 加 5 個 og:image 標籤與 `twitter:card`；`src/site/pageMetadata.ts` 匯出 `SITE_ORIGIN`，`applyPageMetadata` 切換語言時更新 og:image 與 alt。`tests/metadata.test.ts` 11 項通過；`typecheck`、`lint` 通過。
- 另有一項守衛測試直接讀 PNG 檔頭，確認宣告的 1280×802 與 `public/preview/trial-zh-TW.png` 實際尺寸一致（不用 `@types/node`，以 `?inline` 載入並解碼）。
- 限制：截圖是 1280×802（約 1.6:1），不是社群平台建議的 1.91:1，部分平台會裁切；Facebook／LINE／X 的實際預覽沒有驗證（需要正式網址與各平台的偵錯工具）。

## 收尾（2026-11-13，TDD：先紅後綠）
- **專案擁有者的決定：** 網域（D-02）就是 Vercel 的網域，不另購。所以 `og:url`、`og:image` 不再是「暫用」，並新增 `<link rel="canonical">` 與 `og:site_name`（Juicy Calendar）。
- **分享圖改成專用的 1200×630（1.91:1，社群平台建議比例）：** 先前直接用 1280×802（約 1.6:1）的預覽圖，部分平台會裁切。現在 `scripts/capturePreviewImages.ts` 另外輸出 `public/preview/og-zh-TW.png`、`og-en.png`（從同一個實際運作的試用畫面，視窗寬 800、scale 1.5，取 800×420 CSS 像素，試用區上下各留 10px），不是另外畫的圖。語言切換後 `applyPageMetadata` 換成英文版與其替代文字。
- **紅：** 先改 `tests/metadata.test.ts`：og:image 路徑與 1200／630、canonical、og:site_name、兩種語言的分享圖檔頭尺寸（讀 PNG 第 16、20 位元組，不呼叫實作）、語言切換的 og:image。圖片檔不存在時整檔載入失敗；補上圖片後，有 2 項因尺寸不是 1200×630 而紅。
- **過程中的錯：** 截圖腳本試了三種做法才對：小數 `deviceScaleFactor`（0.9375）會裁歪；`fullPage` 加 `clip` 被頁面內容欄截成 920 寬（試用區是 640×400 CSS 像素、超出內容欄）；最後改成視窗 800 寬、scale 1.5、以視窗座標裁切，輸出剛好 1200×630。檔頭尺寸測試抓到了前兩次的錯誤尺寸。
- **綠：** `tests/metadata.test.ts` 12 項通過。
- **驗證的邊界：** 正式網址上的 `/preview/og-zh-TW.png` 要等這個分支 merge 並部署後才存在（目前線上的 `og:image` 還是舊的 1280×802 圖）；Facebook、LINE、X 的實際預覽沒有驗證，需要部署後用各平台的偵錯工具（Facebook Sharing Debugger、X Card Validator 等）。

## 2026-11-13 補記
專案擁有者決定**不做社群平台的實際預覽驗證**（Facebook、X、LINE 的偵錯工具）。上面「驗證的邊界」那一項因此結案為「不做」，不是「已驗證」；分享圖的尺寸與內容仍由測試與截圖目視確認。
