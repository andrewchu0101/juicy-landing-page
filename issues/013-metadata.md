# 013: 搜尋與分享 metadata（原 W-13）

**大小：** S

**What to build:** 首頁的初始 HTML（不執行 JavaScript）就包含頁面標題、描述、`<html>` 語言屬性，以及 Open Graph 的標題、描述、網址與圖片。不因此增加框架。

**Blocked by:** 002。
- **OR-18 決策（建議 M1：單一頁面、`lang="zh-Hant"`、繁中標題與描述，語言切換後以腳本更新；**2026-11-10 專案擁有者已核准 M1**）。** 分享圖在互動版完成前不放占位或仿真圖。

**Status:** partial（M1 已核准並實作；`og:url`、`og:image` 未完成：網域 D-02 未定、分享圖須等互動版，不放占位）

**對應 TC：** TC-10e

**預計檔案範圍（預估）：** `index.html` 的 head、分享圖素材（待 010 之後）。

**要讀的規格：** `docs/03-srs.md` NFR-08、OR-18；`docs/04-sad.md`「搜尋與分享 metadata」。

**驗收指令（預定）：**
```bash
npm run build && grep -E "<title>|og:title|og:description|og:url|og:image|<html lang" dist/index.html
```

## 驗收條件

- [ ] 建置產物的 `index.html`（不執行 JS）含標題、描述、`lang`、`og:title`、`og:description`（已完成）、`og:url`、`og:image`（未完成，待 D-02 與分享圖）
- [x] 所採方案已由你核准後才實作（M1，2026-11-10）
- [ ] 實際執行並貼出；未完成者維持「未執行」
