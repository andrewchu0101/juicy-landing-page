# 017: [Calendar 外部依賴] UI 接縫（原 X-3）（已更改決定）

> **（已更改決定，2026-11-11）：** 2026-11-11 專案擁有者決定不修改 Calendar、不新增套件，試用改由網站自己實作（ADR-03 選 B、ADR-04 選 B；見 `docs/04-sad.md`、`AGENTS.md`「已決定的設計」）。ADR-03、ADR-04、OR-20 已有答案（B、B、新增／編輯球排除與圓形選單保留），S3～S6 都不需要改 Calendar。這張票不再需要，也不會動工。

**所屬 repository：** `juicy-calendar`（不是本 repository）

**大小：** L（過大，**實作前再細分**）

**授權：** **本輪拆票不授權修改 Calendar。** 需另案授權。

**What to build:** 讓網站能組裝日曆而不帶入桌面專屬 UI，且桌面行為不變：
- **S3：** `TemplateBall` 的 `onEdit` 可省略，省略時名稱為純文字。
- **S4：** 匯出 `CalendarWorkbench`（具名插槽），桌面與網站共用組裝。
- **S5：** `./styles` 只含元件樣式與 token，以容器類別為作用域，全域重置留在桌面進入點。
- **S6：** `useKeyboardShortcuts` 加選用 `scope`，預設 `window`。
- **不含 S7**（S7 歸屬 016）。

建議授權時拆成兩組：不依賴決策的 S5，與依賴決策的 S3（OR-20）、S4（ADR-03）、S6（ADR-04）。

**Blocked by:** 016；以及下列**尚未核准**的決策（建議方案僅供參考，不視為核准）：
- ADR-03（建議共用 `CalendarWorkbench`；後備為網站自組並加 UI 冒煙案例）
- ADR-04（建議 `scope`；其他選項為接受限制或滑鼠進入才掛載）
- OR-20（建議新增／編輯球排除、radial 保留）

**Status:** 已更改決定（2026-11-11，不再需要）

**阻塞對象：** 005（S3、S4、S5）、007（S6）。

**預計檔案範圍（預估，Calendar 端）：** `TemplatePalette`／`TemplateBall`、`AppShell` 與新組裝元件、樣式檔、快捷鍵 hook。

**要讀的規格：** `docs/04-sad.md` S3～S6、ADR-03、ADR-04、「UI 相依性」；`docs/05-sds.md` SHARED-03、SHARED-05、MOD-05；`docs/03-srs.md` OR-20、OR-26。

**驗收指令（Calendar 端，預定）：**
```bash
npm test && npm run test:e2e && npm run build
```
**TC-12 的 Calendar 端驗證在本票完成：** 元件測試，範圍外按 Ctrl+C 不被 `preventDefault`，範圍內照常，預設行為不變。

## 驗收條件

- [ ] 桌面 e2e 不改即通過（含 `layout.spec`）
- [ ] 省略 `onEdit` 時名稱為純文字（元件測試）
- [ ] `scope` 範圍外 Ctrl+C 不被攔截；預設 `window` 行為不變
- [ ] 放進測試頁時，`body` 與按鈕等全域樣式不被改變
- [ ] 實作前已細分並由你核准；尚未核准的決策不因本票視為核准
