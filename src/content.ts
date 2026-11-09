// 網站文字（繁體中文）。英文字典在 site/dictionaries.ts；兩份鍵集合必須相同（TC-09）。
export const COPY = {
  siteName: 'Juicy Calendar',
  trial: {
    heading: '線上試用',
    note: '試用內容不會上傳，重新整理頁面就會消失',
  },
  download: {
    heading: '下載',
    primary: '下載 Windows 版',
    portableZip: '免安裝 .zip',
    source: '原始碼',
    factsHeading: '安裝前請先知道',
    facts: [
      { id: 'platform', text: '僅支援 Windows 10 1803 以上的 64 位元；更舊的系統與 32 位元不支援。' },
      { id: 'webview2', text: '需要 WebView2 執行階段；安裝版缺少時，安裝程式會連網下載微軟官方版本（只有安裝當下需要網路）。' },
      { id: 'unsigned', text: '安裝檔未簽章，Windows SmartScreen 可能顯示「Windows 已保護您的電腦」。確認檔案來自本專案的 Releases 後，選「更多資訊」，再選「仍要執行」。' },
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
  unsigned: 'README.md「Windows」步驟 2；docs/01-brief.md R-02',
  'web-trial': '本專案 docs/01-brief.md R-08、docs/02-prd.md（非 Calendar 文件）',
  offline: 'README.md 開頭；docs/01-brief.md 離線、無帳號、無遙測；NG-01',
} as const;
