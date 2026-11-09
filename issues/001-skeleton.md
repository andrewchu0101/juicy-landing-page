# 001: 專案骨架（原 W-01）

**大小：** S

**What to build:** 訪客與開發者都能啟動一個空的網站專案：專案設定、最小入口、靜態服務健康檢查，以及一個可實際執行的 smoke test。**不寫業務邏輯，不含頁面結構，不含 metadata。**

**Blocked by:** 套件最小集核准（尚未核准）：`react`、`react-dom`、`vite`、`@vitejs/plugin-react`、`typescript`、`vitest`。其餘套件由各票自行申請。

**Status:** blocked（等套件核准）

**對應 TC：** 無（smoke test 不在 TC-01～TC-12 內）

**預計檔案範圍（預估）：** 專案根目錄的設定檔（依賴設定與鎖定檔、型別設定、建置設定）、`index.html`、`src/` 下的最小入口、一個 smoke test。

**要讀的規格：** `docs/04-sad.md`「需要的套件」；`docs/03-srs.md` NFR-09（確切版本、鎖定檔）；`CODING_STANDARD.md`；`AGENTS.md`。

**驗收指令（預定，本票建立後才存在）：**

```bash
npm run typecheck && npm test && npm run build
npm run preview &   # 啟動預覽伺服器
curl -sf http://127.0.0.1:4173/   # 回 200
```

## 驗收條件

- [x] 專案可安裝、型別檢查、建置，並產生可服務的靜態輸出
- [x] 預覽伺服器的首頁請求回 200（健康檢查）
- [x] 有一個實際執行過的 smoke test，結果貼在 PR／回報中
- [ ] 只使用已核准的套件，版本為確切版本並有鎖定檔
- [x] 沒有業務邏輯、沒有頁面結構、沒有 metadata
- [x] 補 `AGENTS.md`「怎麼跑」段的實際指令

**範圍外：** 頁面結構（002）、CI（012）、metadata（013）。
