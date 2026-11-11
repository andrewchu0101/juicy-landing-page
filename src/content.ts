// 網站文字（繁體中文）。英文字典在 site/dictionaries.ts；兩份鍵集合必須相同（TC-09）。
export const COPY = {
  siteName: 'Juicy Calendar',
  // NFR-08：搜尋與分享用。index.html 的初始 head 必須與這裡的繁中值一致（tests/metadata.test.ts）。
  meta: {
    title: 'Juicy Calendar｜離線、無帳號的時間區塊日曆',
    description: '把球拖進日曆就能建立時間區塊。桌面 App 離線使用、無帳號，資料只存在你的電腦；可先在網頁線上試用。',
  },
  trial: {
    heading: '線上試用',
    note: '試用內容不會上傳，重新整理頁面就會消失',
    preview: {
      label: '產品預覽',
      caption: '將球拖進日曆，即可建立時間區塊。請使用電腦及滑鼠體驗互動試用。',
      // 截自實際運作的互動版（scripts/capturePreviewImages.ts）；種子球名稱若改了要重截。
      image: {
        src: '/preview/trial-zh-TW.png',
        alt: '試用畫面截圖：左側有藍、綠、橘三顆球，右側日曆有連續三天，每天 10:00 到 15:00，第一天上午 10:00 到下午 12:00 有一個藍色的「專注 Focus」時間區塊。',
      },
    },
    // 試用區內的 App 介面文字（沿用 Calendar 的字典用語：palette.dragAria、radial.aria、grid.hiddenOne／Many）。
    app: {
      ballAria: '將 {name} 拖到日曆上',
      radialAria: '按住球並拖到日曆上',
      hiddenOne: '有 1 個事件在可見時段之外',
      hiddenMany: '有 {count} 個事件在可見時段之外',
    },
  },
  download: {
    heading: '下載',
    primary: '下載 Windows 版',
    portableZip: '免安裝 .zip',
    source: '原始碼',
    checksum: {
      heading: '驗證下載',
      label: 'SHA-256',
      howTo: '下載後在 PowerShell 執行 Get-FileHash <檔案路徑>，結果應與上面的雜湊完全相同；不同就不要執行。',
    },
    factsHeading: '下載前請先知道',
    facts: [
      { id: 'platform', text: '僅支援 Windows 10 1803 以上的 64 位元；更舊的系統與 32 位元不支援。' },
      { id: 'webview2', text: '需要已安裝的 Microsoft Edge WebView2 執行階段；免安裝版不會幫你安裝，缺少時請先安裝微軟官方版本。' },
      { id: 'portable', text: '下載的是免安裝 .zip：解壓縮後執行 juicy-calendar.exe，並保留 portable.flag；資料會放在旁邊的 data 資料夾。' },
      { id: 'unsigned', text: '免安裝版未簽章，Windows SmartScreen 可能顯示「Windows 已保護您的電腦」。確認檔案來自本專案的 Releases 後，選「更多資訊」，再選「仍要執行」。' },
      { id: 'web-trial', text: '網頁試用為瀏覽器版，與桌面版有差異；桌面版的功能以下載後為準。' },
      { id: 'offline', text: '桌面 App 離線使用、無帳號，資料只存在你的電腦。' },
    ],
  },
  footer: {
    license: 'LICENSE',
    trademarks: 'TRADEMARKS.md',
  },
} as const;

// NFR-03 人工對照用的來源（不顯示在頁面、不隨語言變動，所以不放進字典）。
// Calendar 固定 commit 102ae19…，路徑相對 Calendar repository。
export const FACT_SOURCES = {
  platform: 'README.md「Windows」；docs/01-brief.md NG-10；docs/02-prd.md 最低支援',
  webview2: 'README.md「Windows」步驟 1；docs/02-prd.md WebView2 說明',
  portable: 'Calendar GitHub Release v0.2.0-beta.3 說明「附件」',
  unsigned: 'README.md「Windows」步驟 2；docs/01-brief.md R-02',
  'web-trial': '本專案 docs/01-brief.md R-08、docs/02-prd.md（非 Calendar 文件）',
  offline: 'README.md 開頭；docs/01-brief.md 離線、無帳號、無遙測；NG-01',
} as const;
