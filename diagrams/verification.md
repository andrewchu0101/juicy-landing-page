# diagrams/ 驗證紀錄

日期：2026-11-09　工具：archify 3.2.0（版本檢查結果為 current）　Node v26.13.0
對象：`diagrams/*.html` 共 8 張，來源 `diagrams/src/*.workflow.json`，依據 `docs/03-srs.md` v0.2。

## 一、自動檢查（工具實際執行，有收據）

| 檢查 | 結果 | 收據 |
|---|---|---|
| `finalize`：validate、deliver、strict check、browser-check 四道關卡 | 8 張全部 **pass**，診斷訊息 0 | `evidence/<編號>/<名稱>.finalize-summary.json` |
| `visual-check --require-provenance`：瀏覽器量測與 1440×900、2048×1320 淺色與深色截圖 | 8 張全部 `ok: true`，診斷 0；`visualReview` 為 `pending`（截圖不等於人工審查通過） | `evidence/<編號>/visual-check/*.visual-check.json` 與 4 張 PNG、1 份 contact sheet |
| 圖與 SRS／PRD 的編號交叉檢查（我寫的腳本，不是專案或 archify 指令） | 47 項全部 PASS：圖中引用的 FR、AC、OR 編號都存在於 SRS／PRD；10 條 FR 都出現在至少一張圖；每個待決（cloud）節點都標了 OR 編號；`meta.output` 與檔名一致 | 腳本 `evidence/check-diagram-ids.py`，在專案根目錄執行 `python -I diagrams/evidence/check-diagram-ids.py` |

專案本身沒有圖表或文件的檢查指令（`.maintain/check.sh` 只驗證 hooks 與 MCP）。

## 二、人工檢查（我實際看過，不是工具判定）

- 看過全部 8 張圖的 1440×900 淺色截圖，以及圖 01 的 2048×1320 淺色截圖。結論：版面清楚，沒有節點重疊，邊線沒有穿過節點，待決節點與判定節點的顏色可以分辨。
- **發現並修正一個問題：** 第一版把 FR／AC／OR 編號放在節點的 `tag` 欄位，但 archify 預設只在放大時才顯示 tag，一般縮放下看不到編號，無法逐一對照 SRS。已把編號移到節點標題，並縮短幾個縮成小字的副標，然後**重新跑完整個驗證**；上表的結果是修正後的結果，第一輪證據已刪除。
- 逐節點對照 SRS：節點的條件與結果、邊界例子、待決項是否都有出處，由我讀過一遍。這是我自己的比對，不能取代你的逐一審圖。

## 三、未驗證項目

- 深色模式截圖，以及 2048×1320 的其他 7 張，我沒有逐張看（工具已產生，量測通過）。
- 沒有在你的實際瀏覽器中開啟 HTML，也沒有操作檢視器的「路徑」「透鏡」「靜態／動態」「匯出」功能。
- 圖是否忠實表達 SRS 的意圖，由你審；我標在 `README.md` 的 5 項歧義或缺口是我讀 SRS 時發現的，不是工具檢查結果。
- 圖中的頁面行為（建立、拒絕、持久、語言）**沒有實際在試用頁上驗證**，因為試用頁還不存在。

## 四、檔案位置

- 圖：`diagrams/01-…` 到 `08-…` 的 `.html`；每張旁邊有 archify 的 `.delivery.json` 交付收據。
- 來源：`diagrams/src/*.workflow.json`。
- 證據：`diagrams/evidence/01` 到 `08`（finalize 收據、browser-check 收據、visual-check 截圖）。
- 索引與待決說明：`diagrams/README.md`。
