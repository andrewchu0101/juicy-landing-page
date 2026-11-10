# 001 修復票：guard-secrets 守衛兩個誤判

| 項目 | 內容 |
|---|---|
| 狀態 | **待確認**（只有方案，尚未修改任何守衛檔案） |
| 日期 | 2026-11-09 |
| 負責人／審查者 | 專案擁有者 |
| 影響檔案 | `.claude/hooks/guard-secrets.sh`、`.claude/hooks/test-guard-secrets.sh` |
| 阻擋什麼 | 8 張 `diagrams/0*.html` 與 `.claude/hooks/test-guard-secrets.sh` 無法 commit，目前留在工作區未提交 |

## 問題

`git commit` 被 `guard-secrets.sh` 攔下，輸出「a credential literal is in the staged diff」。逐一檢查後，**兩次攔截都是誤判，暫存區沒有任何真的憑證**。

| # | 被擋的內容 | 原因 |
|---|---|---|
| 誤判 A | `.claude/hooks/test-guard-secrets.sh` | 這是守衛自己的測試檔，內容本來就要寫出它要攔的形狀（假的密碼、token）。守衛用路徑排除自己的檔案，但排除清單只有 `hooks/guard-secrets.sh`、`hooks/test-guard-secrets.sh`、`.claude/hooks/guard-secrets.sh` 三個，**漏了 `.claude/hooks/test-guard-secrets.sh`**。 |
| 誤判 B | 8 張 `diagrams/0*.html`（archify 產生的檢視器標記） | HTML 與 CSS 含有 `data-passport` 屬性（值為 kind、brand、context，是檢視器的內部屬性）。守衛的名稱規則寫成「PASS 加上可選的 WORD 或 WD，後面再接任意英數字元」，所以 `passport` 被當成密碼欄位。 |

## 證據（2026-11-09，在暫存區外的副本上重現，沒有動專案裡的守衛）

- 守衛與測試檔的內容與 `juicy-calendar` 專案那份**完全相同**，因此這是範本本身的缺陷，不是本專案特有。
- 既有測試（16 項）目前全部通過；既有測試**沒有涵蓋**誤判 A、B 的情境，所以漏列的路徑與 `passport` 類名稱都沒被發現。
- 對 117 個工作區文字檔，用舊規則掃描：共 40 行命中，**全部**是 8 張 HTML 各 5 行的 `data-passport`；沒有任何真的憑證。
- 原版守衛加上本票新增的測試案例：5 項「不該擋」的案例失敗（誤判重現）；其餘「該擋」的案例原本就通過。
- 實際把 8 張 HTML 與測試檔 stage 到暫存的 repo：原版守衛擋下（exit 2）。

## 最小修正方案

只動 `.claude/hooks/guard-secrets.sh` 三處，並在 `.claude/hooks/test-guard-secrets.sh` 增加測試案例。

1. **排除清單補一條路徑**：在既有三條排除後面加上 `.claude/hooks/test-guard-secrets.sh`。延續守衛現有的設計原則：依路徑排除，不依行內標記（模型能輸入的標記，等於模型能打開的閘）。
2. **收緊 PASS 的比對，不再誤判 `passport`**：把「名稱」寫成兩類：(a) PASSWORD、PASSWD、PASSCODE、PASSPHRASE、SECRET、TOKEN、API_KEY、CREDENTIAL、以 `_PW` 結尾的名稱，這些後面仍可接任意英數字元；(b) 單獨的 `PASS`，只允許單獨出現，或後面接底線再加英數字元（例如 `DB_PASS`、`PASS_1`）。同時把兩個比對式中名稱**後面**那段「任意英數字元」移進 (a)，因為舊寫法讓 `PASS` 後面接 `port` 也成立。
3. **其餘邏輯不變**：兩種形狀（賦值、JSON）、引號內至少 4 個字元、允許清單（環境變數、佔位字串、已遮罩等）都不動。

### 差異（在副本上套用的內容，專案裡的檔案尚未修改）

為避免這張票本身被守衛誤判，差異中兩行含範例密碼的註解已省略，以 `（省略）` 標示。

```diff
--- a/.claude/hooks/guard-secrets.sh
+++ b/.claude/hooks/guard-secrets.sh
@@ -28,16 +28,17 @@
 added=$(git diff --cached -U0 -- . \
           ':(exclude)hooks/guard-secrets.sh' \
           ':(exclude)hooks/test-guard-secrets.sh' \
-          ':(exclude).claude/hooks/guard-secrets.sh' 2>/dev/null \
+          ':(exclude).claude/hooks/guard-secrets.sh' \
+          ':(exclude).claude/hooks/test-guard-secrets.sh' 2>/dev/null \
         | grep -E '^\+' | grep -vE '^\+\+\+')
 [ -z "$added" ] && exit 0
 
 # Two shapes, both requiring a quoted value with real content:
 （省略：兩行既有註解，內容不變）
-NAME='(PASS(WORD|WD)?|SECRET|TOKEN|API_?KEY|CREDENTIAL|[A-Za-z0-9]_PW)'
+NAME='((PASSWORD|PASSWD|PASSCODE|PASSPHRASE|SECRET|TOKEN|API_?KEY|CREDENTIAL|[A-Za-z0-9]_PW)[A-Za-z0-9_]*|PASS(_[A-Za-z0-9_]*)?)'
 hits=$(printf '%s\n' "$added" \
-  | grep -iE "[A-Za-z0-9_]*${NAME}[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[\"'][^\"']{4,}[\"']|\"[A-Za-z0-9_]*${NAME}[A-Za-z0-9_]*\"[[:space:]]*:[[:space:]]*\"[^\"]{4,}\"" \
+  | grep -iE "[A-Za-z0-9_]*${NAME}[[:space:]]*=[[:space:]]*[\"'][^\"']{4,}[\"']|\"[A-Za-z0-9_]*${NAME}\"[[:space:]]*:[[:space:]]*\"[^\"]{4,}\"" \
   | grep -vE '\$\{|\{\{|<[A-Za-z_-]+>|os\.environ|getenv|process\.env|ENV\[|REDACTED|\*\*\*|xxxx|your[-_]|example\.com' \
   | head -5)
```

### 這個方案為什麼不會漏掉真的密碼

- 判斷在**名稱層級**，不是整行過濾。若改成「含 `data-passport` 的整行都放行」，同一行出現的真密碼會被一起放行（壓縮過的 HTML 一行常有多個屬性）。新增案例「同一行有 data-passport 也擋」確認這種行仍被攔下。
- 沒有排除整個 `diagrams/` 或所有 `.html`：`diagrams/` 下的 HTML 若真的出現密碼賦值，仍會被攔（新增案例確認）。
- 舊規則攔得到的真實形狀，新規則仍攔得到：PASSWORD、PASSWD、PASSCODE、PASSPHRASE、`DB_PASS`、單獨的 `pass`、`PASS_1`、`client_secret`、`api_key`、JSON 的 password 與 passwd 鍵，都有案例。

### 驗證結果（在副本上，全部是我實際執行的）

| 檢查 | 結果 |
|---|---|
| 既有 16 項 + 新增 16 項測試，對**修補版**守衛 | 32 項全部通過 |
| 同一份擴充測試，對**原版**守衛 | 恰好 5 項失敗，都是「不該擋」的案例（誤判重現） |
| 8 張真實 HTML stage 後 | 原版擋（exit 2）、修補版放行（exit 0） |
| 真實 `test-guard-secrets.sh` stage 後 | 原版擋（exit 2）、修補版放行（exit 0） |
| 117 個工作區文字檔，舊規則對新規則 | 舊規則 40 行命中，新規則 0 行。只有舊規則命中的 40 行全部是 `data-passport`；只有新規則命中的行為 0 |

這些驗證在 session 暫存區（scratchpad）的副本上做，不會留在專案裡。要在專案內重現，請在修改後執行下方「完成條件」的測試。

## 新增測試案例（提案，尚未寫入測試檔）

案例的賦值內容在這張票中以描述表示，避免這張票本身被守衛誤判。實際寫入測試檔時，用與既有案例相同的寫法。

**不再誤判（預期放行）**

| 案例 | 內容形狀 | 路徑 |
|---|---|---|
| data-passport 屬性（HTML） | 一個 span 元素，帶 data-passport 屬性 | `diagrams/page.html` |
| CSS 屬性選擇器 | 以 data-passport 為條件的 CSS 規則 | `diagrams/page.html` |
| 變數 passport | 變數名為 `passport`，賦值為 12 字元以上的引號字串 | 預設 |
| JSON 鍵 passport | 鍵為 `passport` 的 JSON 物件 | 預設 |
| 守衛測試檔的安裝副本 | 與既有案例相同的假密碼賦值 | `.claude/hooks/test-guard-secrets.sh` |

**仍然攔截（預期擋下）**

| 案例 | 內容形狀 | 路徑 |
|---|---|---|
| PASSWORD 在 HTML | 名稱為 PASSWORD 的賦值 | `diagrams/page.html` |
| 同一行有 data-passport | 同一個標籤上同時有 data-passport 與 api_key 賦值 | `diagrams/page.html` |
| JSON password 在 HTML | 鍵為 password 的 JSON | `diagrams/page.html` |
| passcode、passphrase | 名稱為 passcode、passphrase 的賦值 | 預設 |
| DB_PASS、單獨的 pass、PASS_1 | 三種 PASS 變體的賦值 | 預設 |
| JSON passwd、client_secret | 兩種 JSON 鍵 | 預設 |
| 路徑排除只認路徑 | 與既有案例相同的假密碼賦值，但放在 `other/test-guard-secrets.sh` | `other/test-guard-secrets.sh` |

## 測試資料如何處理（誤判 A）

保留測試檔裡的假資料，靠路徑排除處理，並新增上表「守衛測試檔的安裝副本」案例，讓這個路徑日後被測試保護。不建議的替代做法：

- 把測試檔裡的字面值改成執行時拼接。這會大幅改寫既有測試，而且守衛的路徑排除這個洞還在。
- 改用行內標記放行。守衛的現有設計明確拒絕這種做法。

## 已知取捨與未修的相關情況（請決定）

1. **名稱清單縮小了**：舊規則因為「PASS 後面接任意字元」，連 `passkey`、`passenger`、`passage` 之類也攔；新規則只明列 PASSWORD、PASSWD、PASSCODE、PASSPHRASE 與單獨的 PASS。`passkey` 這類是否要明列進去？建議不加，除非有真實用到。
2. **未修的同類誤判**：名稱**結尾**是 pass 的字（例如 `compass`、`bypass`）仍會被當成密碼，與舊行為相同；TOKEN、SECRET 這類名稱的前綴也可能誤判（例如 `data-token`）。目前整個工作區都沒有這類命中，所以這張票不處理，出現時再開票。
3. **要不要回饋範本**：這個守衛來自 `leavebot-bootcamp-student`，衍生自 luca-skills（MIT）。`juicy-calendar` 專案有同樣缺陷。是否同步修那兩處，由你決定，本票不動。

## 完成條件

- [ ] 專案擁有者確認方案（尤其是上面「取捨」第 1 點）。
- [ ] 修改 `guard-secrets.sh` 與 `test-guard-secrets.sh`，只動本票列出的內容。
- [ ] `bash .claude/hooks/test-guard-secrets.sh` 全部通過（預期 32 項）。
- [ ] `.maintain/check.sh` 全綠（需要 `jq`；pre-commit 需已啟用）。
- [ ] 8 張 `diagrams/0*.html` 與 `.claude/hooks/test-guard-secrets.sh` 可以 commit，守衛不需要被繞過。
- [ ] 沒有新增套件，沒有整類排除 `diagrams/` 或 `.html`。
