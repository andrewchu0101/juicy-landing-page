# 015: [Calendar 外部依賴] 補測（原 X-1）（已更改決定）

> **（已更改決定，2026-11-11）：** 2026-11-11 專案擁有者決定不修改 Calendar、不新增套件，試用改由網站自己實作（ADR-03 選 B、ADR-04 選 B；見 `docs/04-sad.md`、`AGENTS.md`「已決定的設計」）。網站不再依賴 Calendar 的共用層，這張票不再是網站的前置條件，也不會由本專案動工。若專案擁有者日後想替 Calendar 自己補測，請在 Calendar 專案另案處理。

**所屬 repository：** `juicy-calendar`（不是本 repository）

**大小：** M

**授權：** **本輪拆票不授權修改 Calendar。** 另案授權後才可動工，**另案授權後可以先做**。本票只加測試、不改行為。

**What to build:** 在 Calendar 共用層補齊測試，讓沿用行為有可執行的證據：復原歷史上限 100 步、鍵盤層無選取時按 Delete／Backspace 不改資料、無效名稱的失焦提交、元件卸載時提交名稱、無效提交時 `futureLength` 不變、磁吸門檻 8／9 像素邊界。補測前先重新搜尋，已存在的不重複寫。

**Blocked by:** 另案授權。其餘無。

**Status:** 已更改決定（2026-11-11，不再需要）

**阻塞對象：** 007 的 TC-05d、009 的 CONF-06；不阻塞網站端 TC-03d。

**預計檔案範圍（預估，Calendar 端）：** store 測試、`EventBlock` 元件測試、鍵盤層測試、引擎磁吸測試。

**要讀的規格：** `docs/03-srs.md` OR-25、REUSE-01、REUSE-07、REUSE-08、REUSE-09；`docs/04-sad.md`「測試與一致性驗證」；`docs/06-test-plan.md`「Calendar 基準查證記錄」。

**驗收指令（Calendar 端）：**
```bash
npm test
npm run test:e2e
```

## 驗收條件

- [ ] 新增測試實際執行通過，且既有測試不改即通過
- [ ] 沒有修改任何產品行為
- [ ] 回報補了哪些、哪些已存在而未重複
