# 013: 搜尋與分享 metadata（原 W-13）

**大小：** S

**What to build:** 首頁的初始 HTML（不執行 JavaScript）就包含頁面標題、描述、`<html>` 語言屬性，以及 Open Graph 的標題、描述、網址與圖片。不因此增加框架。

**Blocked by:** 002。
- **OR-18 決策（建議 M1：單一頁面、`lang="zh-Hant"`、繁中標題與描述，語言切換後以腳本更新；**2026-11-10 專案擁有者已核准 M1**）。** 分享圖在互動版完成前不放占位或仿真圖。

**Status:** implemented（2026-11-11：`og:image` 補上，用實際運作的繁中試用截圖；`og:url`、`og:image` 暫用 Vercel 預設網域，自有網域 D-02 決定後替換。社群平台實際顯示的預覽未驗證）

**對應 TC：** TC-10e

**預計檔案範圍（預估）：** `index.html` 的 head、分享圖素材（待 010 之後）。

**要讀的規格：** `docs/03-srs.md` NFR-08、OR-18；`docs/04-sad.md`「搜尋與分享 metadata」。

**驗收指令（預定）：**
```bash
npm run build && grep -E "<title>|og:title|og:description|og:url|og:image|<html lang" dist/index.html
```

## 驗收條件

- [x] 建置產物的 `index.html`（不執行 JS）含標題、描述、`lang`、`og:title`、`og:description`、`og:url`、`og:image`（含 alt、type、width、height）與 `twitter:card`；`og:url`／`og:image` 暫用 Vercel 預設網域
- [x] 所採方案已由你核准後才實作（M1，2026-11-10）
- [x] 實際執行並貼出（見下方實作紀錄）

## 實作紀錄（2026-11-11，TDD：先紅後綠）
- **紅：** 先改 `tests/metadata.test.ts`：新增 og:image（絕對網址、alt、type、尺寸）、`twitter:card`、og:url 與 `SITE_ORIGIN` 同源、語言切換後 og:image 與 alt 換成該語言；把「不得有 og:image」改為「有實際截圖」（契約變更：互動版與截圖已完成）。執行 5 項失敗（og:image 缺、`SITE_ORIGIN` 不存在、`twitter:card` 缺、兩個語言切換案例）。
- **綠：** `index.html` 加 5 個 og:image 標籤與 `twitter:card`；`src/site/pageMetadata.ts` 匯出 `SITE_ORIGIN`，`applyPageMetadata` 切換語言時更新 og:image 與 alt。`tests/metadata.test.ts` 11 項通過；`typecheck`、`lint` 通過。
- 另有一項守衛測試直接讀 PNG 檔頭，確認宣告的 1280×802 與 `public/preview/trial-zh-TW.png` 實際尺寸一致（不用 `@types/node`，以 `?inline` 載入並解碼）。
- 限制：截圖是 1280×802（約 1.6:1），不是社群平台建議的 1.91:1，部分平台會裁切；Facebook／LINE／X 的實際預覽沒有驗證（需要正式網址與各平台的偵錯工具）。
