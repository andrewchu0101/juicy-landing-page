# Calendar 依賴授權查核（2026-11-13，唯讀）

> 範圍：Juicy Calendar（`andrewchu0101/juicy-calendar`）要採 MIT 前，先看它用到的第三方程式有沒有授權衝突。
> **這不是法律意見**，是把各套件自己宣告的授權整理出來。宣告與實際不符的情況（例如套件寫 MIT 但夾帶別的授權檔案）沒有逐檔核對。

## 決定

專案擁有者 2026-11-13：**Calendar 授權選 MIT**（與本網站一致；商標與專案識別仍依 `TRADEMARKS.md` 保留，不隨 MIT 授權）。

## 查核對象與方法

| 項目 | 內容 |
|---|---|
| Calendar 版本 | 工作樹 HEAD `a1c64e5`（發布的 `v0.2.0-beta.3` 對應的是 `Cargo.toml` 的版本 0.2.0-beta.3）；**工作樹乾淨，沒有任何修改**（`git status` 為空） |
| npm 套件 | 讀 `package-lock.json` 與 `node_modules/*/package.json` 的 `license` 欄位，依 `dev` 標記分成「會進到發布 App」與「只在建置時用」 |
| Rust crate | `cargo metadata --locked --offline --filter-platform x86_64-pc-windows-msvc`（cargo 1.99.1；`--locked` 不會改 `Cargo.lock`），只取「一般依賴」（會連結進可執行檔），排除 `build.rs` 與測試依賴 |
| 發布內容 | 實際下載 `juicy-calendar_0.2.0-beta.3_x64-portable.zip`（2,958,720 位元組，SHA-256 與網站釘選值相同）並列出內容 |

## 結果

### 會進到發布 App 的程式

**npm（11 個，含間接）：** 全部寬鬆授權。MIT 9 個（`@dnd-kit/accessibility`、`@dnd-kit/core`、`@dnd-kit/utilities`、`date-fns`、`react`、`react-dom`、`scheduler`、`zod`、`zustand`）、`Apache-2.0 OR MIT` 1 個（`@tauri-apps/api`）、`0BSD` 1 個（`tslib`）。

**Rust（230 個 crate，含間接）：**

| 授權 | 數量 | 說明 |
|---|---|---|
| MIT／Apache-2.0 及其組合（含 `OR`、`AND`、`/`） | 約 190 | 寬鬆。有 `OR` 的可任選其一 |
| Unicode-3.0 | 18 | 寬鬆（ICU 類資料），要保留聲明 |
| Unlicense OR MIT | 10 | 寬鬆，選 MIT |
| Zlib、BSD-3-Clause、0BSD、CC0-1.0 | 約 10 | 寬鬆。`brotli`、`alloc-stdlib` 等 BSD-3 要保留聲明 |
| **MPL-2.0** | **5** | `selectors`、`cssparser`、`cssparser-macros`、`dtoa-short`、`option-ext`；見下方 |

**沒有任何 GPL、AGPL、LGPL、SSPL、BUSL 或「非商業」授權；沒有授權欄位空白或無法判定的 crate／套件。**

### 只在開發或建置時用（不會被發布）

245 個 npm 套件：MIT 169、MPL-2.0 24、Apache-2.0 19、Apache-2.0 OR MIT 12、ISC 11、BSD-2-Clause 6、BSD-3-Clause 2、CC-BY-4.0 1（`caniuse-lite`，資料）、BlueOak-1.0.0 1。這些是工具，產出的 App 不含它們的程式碼，**不影響 Calendar 的授權選擇**。

## 判斷

1. **選 MIT 沒有衝突。** 發布的 App 裡沒有要求「整個作品也要開源或同授權」的 copyleft 授權。
2. **MPL-2.0（5 個 Rust crate）不擋 MIT。** MPL 是「檔案層級」的 copyleft：只要求**被你修改過的 MPL 檔案**要公開那些檔案的修改，不要求你的其他程式碼跟著用 MPL。Calendar 只是把它們當依賴使用、沒有修改，所以只需要在聲明裡列出並附上 MPL 的授權文字與原始碼取得方式（它們的原始碼就在 crates.io，公開）。
3. **真正的缺口不是授權衝突，而是「沒有隨附聲明」：**
   - **發布的 zip 只有 3 個檔案**：`juicy-calendar.exe`、`portable.flag`、`README.txt`，**沒有任何授權或第三方聲明檔**；zip 內的 `README.txt` 也沒提授權。
   - MIT、BSD、Apache-2.0 都要求散布時保留原作者的版權聲明與授權文字；React、zod、zustand、date-fns、dnd-kit 的程式碼已經編進 `.exe`，Rust 的 230 個 crate 也是。目前的 zip 沒做到這點。
   - Calendar 根目錄的 `THIRD-PARTY-NOTICES.md` **只涵蓋專案範本內容**（`luca-skills`、`mattpocock/skills` 的 MIT 聲明），**不涵蓋執行期依賴**。
   - Calendar 的 `README.md` 沒有授權章節，GitHub 的 license 欄位為空。

## 還需要專案擁有者回答或確認（我沒有查證）

1. `src-tauri/icons/` 的圖示與應用程式圖示是**你自己的作品**，還是 Tauri 範本的預設圖示？目前只看得到它們是在第一個 commit（`chore: import Juicy Calendar demo with template scaffolding`）一起匯入的，來源無法由 git 判斷。如果是第三方圖示，要另外確認其授權。
2. App 使用系統字型（`index.css` 的 `--font-sans`，沒有 `@font-face`，repo 內沒有字型檔），**沒有夾帶字型授權問題**。
3. 免安裝版需要使用者自行安裝 Microsoft Edge WebView2 執行階段（`README.txt` 第 6 點）；它是微軟的元件，**不在 zip 裡**，不屬於 Calendar 的散布內容。

## 需要另案授權才能做的事（依 `AGENTS.md`，我不修改 Calendar）

1. 在 Calendar 根目錄新增 `LICENSE`（MIT，版權人沿用本網站的 `CHU YI AN`，年份 2026）。
2. 在 Calendar 的 `README.md` 加授權章節。
3. 產生並隨附第三方聲明：把上面的 npm 與 Rust 依賴的版權與授權文字整理成 `THIRD-PARTY-LICENSES`（Rust 可用 `cargo-about` 或 `cargo-license` 類工具；npm 可用 `license-checker` 類工具；需新增開發工具的話要先過套件核准）。
4. 下一次發布時把該聲明檔放進 zip（與 NSIS 安裝檔）。**已發布的 `v0.2.0-beta.3` 不會因為補檔而改變**；若要讓既有版本合規，需要重新發布（且 release 設成不可竄改之前的檔案都可被替換）。
5. 網站頁尾的授權連結目前指向**本網站**的 `LICENSE`；Calendar 補上 LICENSE 後，下載區是否也要連到 Calendar 的授權，由專案擁有者決定。
