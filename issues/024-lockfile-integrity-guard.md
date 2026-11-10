# 024: 依賴確切版本與鎖定檔完整性守衛

**大小：** S

**What to build:** 把 NFR-09／SDS EXT-03 的共通契約（確切版本、鎖定檔含完整性雜湊、不使用 `latest` 或範圍）變成會失敗的測試：`scripts/lockfileGuard.ts` 兩個純函式，加上套用到真實 `package.json`、`package-lock.json` 的測試。

**Blocked by:** 無。

**Status:** implemented（2026-11-11）。

**範圍外：** 新增或升級任何套件、CI 以外的雜湊重算（不重新下載 tarball 比對）。

**預計檔案範圍：** `scripts/lockfileGuard.ts`、`tests/lockfileGuard.test.ts`。

**驗收指令：**
```bash
npm run typecheck && npm run lint && npm test
```

## 驗收條件

- [x] RED：先寫測試，模組不存在而失敗；實作後轉綠
- [x] 壞資料案例（範圍、標籤、git、網址、檔案路徑、缺 integrity、非 registry 的 resolved、lockfileVersion 不是 3、空鎖定檔）都被擋下，預期輸出是字面常數
- [x] 真實 `package.json` 全為確切版本（含 `npm:` 別名）；真實 `package-lock.json` 221 項（含根項）每個非連結項目都有 integrity 與 `https://registry.npmjs.org/` 的 resolved

## 限制

- 只檢查鎖定檔「有雜湊、來源是 registry」，不重新計算雜湊；雜湊本身是否對應惡意內容，要靠 `npm audit signatures` 或人工審查升級 PR（未做）。
