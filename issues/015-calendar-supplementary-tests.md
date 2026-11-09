# 015: [Calendar 外部依賴] 補測（原 X-1）

**所屬 repository：** `juicy-calendar`（不是本 repository）

**大小：** M

**授權：** **本輪拆票不授權修改 Calendar。** 另案授權後才可動工，**另案授權後可以先做**。本票只加測試、不改行為。

**What to build:** 在 Calendar 共用層補齊測試，讓沿用行為有可執行的證據：復原歷史上限 100 步、鍵盤層無選取時按 Delete／Backspace 不改資料、無效名稱的失焦提交、元件卸載時提交名稱、無效提交時 `futureLength` 不變、磁吸門檻 8／9 像素邊界。補測前先重新搜尋，已存在的不重複寫。

**Blocked by:** 另案授權。其餘無。

**Status:** blocked（待授權）

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
