// 試用模組入口（動態載入的 chunk）。只有互動資格成立時才會被請求（FR-08、NFR-05）。
// 試用的資料與手勢在 src/trial/；這裡把初始化（種子球、示範日）與畫面（TrialApp）接成 TrialModule。
import type { TrialModule } from './trialLoader';
import { createTrialRuntime } from './trialRuntime';
import { trialStore } from './trialStore';
import { RadialDemo } from './ui/RadialDemo';
import { TrialApp } from './ui/TrialApp';

// 初始化只做一次（INV-02）：再次呼叫（例如資格消失又恢復）直接返回，不會清掉訪客已放的區塊。
const runtime = createTrialRuntime({ store: trialStore, now: () => new Date() });

const trialModule: TrialModule = {
  ensureReady: (options) => runtime.ensureReady(options),
  TrialShell: TrialApp,
  RadialShell: RadialDemo,
};

export default trialModule;
