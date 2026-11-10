import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSiteLanguage } from '../site/LanguageContext';
import { connectGate } from '../trial/connectGate';
import { createTrialLoader, type TrialLoader } from '../trial/trialLoader';

// 動態 import：不符合互動資格時不會被呼叫，所以不會請求這個 chunk（FR-08、NFR-05）。
const defaultLoader = () => createTrialLoader({ loadModule: () => import('../trial/trialModule').then((m) => m.default) });

// UI-02／UI-03：互動資格成立且載入完成 → 試用；否則 → 靜態預覽容器（不可拖曳或點擊）。
// loading／dormant／preview 都顯示預覽；載入中專用畫面與失敗文案未定（MOD-02）。
export function TrialSection({ loader: injected }: { loader?: TrialLoader }) {
  const { copy } = useSiteLanguage();
  const [loader] = useState<TrialLoader>(() => injected ?? defaultLoader());
  const phase = useSyncExternalStore(loader.subscribe, loader.getPhase, loader.getPhase);

  useEffect(() => (injected ? undefined : connectGate(loader)), [loader, injected]);

  const Shell = phase === 'active' ? loader.getModule()?.TrialShell : undefined;

  return (
    <section id="trial" aria-labelledby="trial-heading" tabIndex={-1} data-trial-active={Shell ? '' : undefined}>
      <h2 id="trial-heading">{copy.trial.heading}</h2>
      <p>{copy.trial.note}</p>
      {Shell ? (
        <Shell />
      ) : (
        <figure className="trial-preview">
          <p className="trial-preview-label">{copy.trial.preview.label}</p>
          <figcaption>{copy.trial.preview.caption}</figcaption>
        </figure>
      )}
    </section>
  );
}
