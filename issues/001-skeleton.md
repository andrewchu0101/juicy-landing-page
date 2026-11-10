# 001: 專案骨架（原 W-01）

**大小：** S

**What to build:** 訪客與開發者都能啟動一個空的網站專案：專案設定、最小入口、靜態服務健康檢查，以及一個可實際執行的 smoke test。**不寫業務邏輯，不含頁面結構，不含 metadata。**

**Blocked by:** 套件最小集核准（尚未核准）：`react`、`react-dom`、`vite`、`@vitejs/plugin-react`、`typescript`、`vitest`。其餘套件由各票自行申請。

**Status:** 實作完成並已合併（`d9e7dac`、`c27da76`）；套件最小集的核准紀錄未查到，故「只使用已核准的套件」維持未勾

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

## 套件核對（2026-11-10，唯讀；未安裝、未執行任何指令以外的修改）

方法：讀 `package.json` 與 `package-lock.json`（以腳本比對），對照本票「Blocked by」的最小集與 `docs/04-sad.md`「需要的套件」。**這是事實整理，不是核准；勾選框維持未勾，等專案擁有者決定。**

**確切版本與鎖定檔：已符合。** 14 個直接依賴的版本皆無 `^`、`~` 或範圍符號；`package-lock.json`（lockfileVersion 3）根節點的依賴與 `package.json` 完全一致；鎖定的 220 個套件都有 `resolved` 與 `integrity`。（註：這只驗證檔案內部一致，沒有連線驗證 registry 上的版本是否存在。）

**與核准範圍的對照：**

| 套件 | 本票最小集 | SAD 清單 | 狀態 |
|---|---|---|---|
| `react`、`react-dom`、`vite`、`@vitejs/plugin-react`、`vitest` | 是 | 是 | 在最小集內 |
| `typescript` | 是 | 是 | **形式不同**：寫成 `npm:@typescript/typescript6@6.0.2` 別名，不是 npm 上的 `typescript` 本身 |
| `eslint` | 否 | 是（待核准） | 012 引入；SAD 清單內但同樣未核准 |
| `@types/react`、`@types/react-dom` | 否 | 否 | react 的型別宣告，未列入任何清單 |
| `@typescript/native` | 否 | 否 | `npm:typescript@7.0.2` 別名（TypeScript 7 原生編譯器）；用途與為何需要兩套 TypeScript 未在票或 SAD 說明 |
| `@eslint/js`、`eslint-plugin-react-hooks`、`globals`、`typescript-eslint` | 否 | 否 | eslint 的設定與規則套件，012 引入，未列入任何清單 |

SAD 清單中的 `@playwright/test`、`zustand`、`@dnd-kit/core`、`date-fns`、`zod` 尚未加入，符合「其餘由各票自行申請」。

**結論：**
- 「確切版本並有鎖定檔」已成立。
- 「只使用已核准的套件」**無法勾**：最小集 6 個套件中 `typescript` 以別名形式存在，另有 8 個最小集以外的套件（上表標「否」者）沒有核准紀錄。
- 待專案擁有者決定：(a) 追認現有 14 個套件；(b) 要求移除 `@typescript/native` 這類不在清單內的套件；(c) `typescript` 別名是否接受。決定後再勾選並記錄日期。
