// 試用模組入口（動態載入的 chunk）。目前是佔位：真正的試用（TrialShell、ensureReady）在 005～009 接入。
// 只有互動資格成立時才會被請求（FR-08、NFR-05）。
import type { TrialModule } from './trialLoader';

const trialModule: TrialModule = {
  ensureReady: async () => {},
  TrialShell: () => null,
};

export default trialModule;
