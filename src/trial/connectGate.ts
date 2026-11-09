// 把互動資格閘門（MOD-01）接到 TrialLoader（MOD-02）。回傳取消連線的函式。
import { isInteractive, subscribeInteractive, type MatchMediaFn } from './interactiveGate';
import type { TrialLoader } from './trialLoader';

export function connectGate(loader: TrialLoader, matchMedia?: MatchMediaFn): () => void {
  loader.setInteractive(isInteractive(matchMedia));
  return subscribeInteractive((value) => loader.setInteractive(value), matchMedia);
}
