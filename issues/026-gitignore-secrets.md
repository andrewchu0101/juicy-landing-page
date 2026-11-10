# 026: .gitignore 涵蓋憑證與私鑰檔，並以測試守住

**大小：** S

**What to build:** `.gitignore` 補上 `*.pem`、`*.key`、`*.pfx`、`*.p12`、`id_rsa*`，並新增測試固定必要的忽略規則，同時確認不會誤忽略鎖定檔、部署設定與 workflow（`CLAUDE.md` §2.3、`AGENTS.md`「秘密」）。

**Blocked by:** 無。

**Status:** implemented（2026-11-11）。

**範圍外：** 改寫既有 git 歷史（020 掃描沒有發現需要改寫的內容）、建立 `.env.example`（目前沒有環境變數需求）。

**預計檔案範圍：** `.gitignore`、`tests/gitignore.test.ts`。

**驗收指令：**
```bash
npm run typecheck && npm run lint && npm test
git ls-files | grep -E '\.(pem|key|pfx|p12)$|id_rsa'    # 應無輸出
```

## 驗收條件

- [x] RED：先寫測試，五項憑證類規則失敗（其餘 20 項本來就成立）；補規則後全綠
- [x] `.env.example` 的否定規則在 `.env.*` 之後
- [x] 不忽略 `package-lock.json`、`vercel.json`、`.github`、`LICENSE`、`docs`、`issues`、`src`、`tests`、`scripts`
- [x] 目前沒有任何被追蹤的憑證類檔案（`git ls-files` 無輸出）

## 限制

- 這個測試只讀 `.gitignore` 的文字，不模擬 git 的完整比對規則；`.gitignore` 也擋不住已被追蹤的檔案。
