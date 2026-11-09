# 016: [Calendar 外部依賴] 套件邊界（原 X-2）

**所屬 repository：** `juicy-calendar`（不是本 repository）

**大小：** L（過大，**實作前再細分**）

**授權：** **本輪拆票不授權修改 Calendar。** 需另案授權。

**What to build:** Calendar 能被網站依賴，且桌面 App 行為完全不變：
- **S1：** 單一套件，以子路徑匯出 `./engine`、`./store`、`./ui`、`./i18n`、`./styles`。
- **S2：** 網站不會打包 Tauri 呼叫與桌面 backend（`i18n` 不在模組載入時引入預設 backend）。
- **S7：** `./engine` 匯出不依賴 store 與 backend 的純 `detectLanguage`。**S7 的責任歸屬在本票（016），不在 017。**
- 一致性案例的載入接口（SHARED-06）。

**Blocked by:** 另案授權。其餘無。

**Status:** blocked（待授權）

**阻塞對象：** 003（語言偵測實作）、005、009；以及 017、018。

**預計檔案範圍（預估，Calendar 端）：** 套件設定與進入點、`i18n` 模組、`engine` 匯出、一致性案例載入接口。

**要讀的規格：** `docs/04-sad.md`「共用接縫」S1、S2、S7、ADR-01；`docs/05-sds.md` SHARED-01～06；`docs/03-srs.md` OR-23、REUSE-14。

**驗收指令（Calendar 端，預定）：**
```bash
npm test && npm run test:e2e && npm run build
# 模擬網站建置後搜尋產物，確認不含 @tauri-apps/api 與 invoke
```

## 驗收條件

- [ ] 桌面既有單元與 e2e **不改即通過**
- [ ] 模擬網站建置產物搜尋不到 `@tauri-apps/api`、`invoke`
- [ ] 只引入 `detectLanguage` 時，打包內容不含 store 與 dnd-kit
- [ ] 實作前已細分為可獨立驗證的子票，並由你核准
- [ ] 尚未核准的取得方式（私有 npm、workspace 連結）不因本票視為核准
