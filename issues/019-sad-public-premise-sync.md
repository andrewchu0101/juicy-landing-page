# 019: SAD 與清單同步「Calendar 已公開」的前提變化

**大小：** S

**What to build:** Calendar 與本站 repository 於 2026-11-11 公開後，SAD 發布管道選項 P1～P3 的「需要讀取憑證」前提不再成立。把文件對齊事實，**不核准任何選項**。

**Blocked by:** 無。

**Status:** implemented（2026-11-11）

**預計檔案範圍：** `docs/04-sad.md`、`docs/01-brief.md`（D-11 列）、`docs/07-release-checklist.md`（第 19 列）、`issues/012`、`issues/018` 的過期敘述。

**要讀的規格：** `docs/04-sad.md`「發布管道與權限選項」；`docs/01-brief.md` D-11。

**驗收指令：**
```bash
gh repo view andrewchu0101/juicy-calendar --json visibility
gh repo view andrewchu0101/juicy-landing-page --json visibility
grep -rn "建議 P1\|私有 repository\|私有 Release" docs issues
```

## 驗收條件

- [x] P1～P3 的需要權限欄標明原假設與「前提已變」，並保留「未核准」
- [x] 新增「前提變更」段落：公開把風險從憑證外洩換成來源被替換；列出兩個 repository 沒有分支保護、Calendar 無 CI（2026-11-11 `gh api` 查證）；2FA 無法由 API 查證，標未驗證
- [x] 清單第 19 列、Brief D-11、issues 012／018 不再把「建議 P1 私有 npm」當作現行依據
- [x] 沒有新增或核准任何決策（D-11 仍待專案擁有者決定）

## 實作紀錄

- 2026-11-11：兩個 repository 的 visibility 皆為 PUBLIC。`grep` 殘留檢查見本輪回報。
- GitHub Packages 的 npm 套件在公開 repository 下是否仍需驗證，我沒有查證，SAD 內標【未】。
