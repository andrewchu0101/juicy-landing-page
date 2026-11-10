// 這個分頁的試用資料：模組層單例（FR-07），重新整理就清空，另一個分頁看不到。
import { createTrialStore } from './store';

export const trialStore = createTrialStore({ now: () => new Date() });
