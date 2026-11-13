import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSiteLanguage } from '../site/LanguageContext';
import type { SiteLanguage } from '../site/webLanguageBackend';
import { connectGate } from '../trial/connectGate';
import { createTrialLoader, type TrialLoader } from '../trial/trialLoader';

// 動態 import：不符合互動資格時不會被呼叫，所以不會請求這個 chunk（FR-08、NFR-05）。
const defaultLoader = (getLanguage: () => SiteLanguage) =>
  createTrialLoader({ loadModule: () => import('../trial/trialModule').then((m) => m.default), getLanguage });

type Preview = { label: string; caption: string; image: { src: string; alt: string } };

// 靜態圖：不可拖曳、不可點擊（AC-01.6）。尺寸固定以免載入時版面跳動。
function PreviewFigure({ preview, width, height }: { preview: Preview; width: number; height: number }) {
  return (
    <figure className="trial-preview">
      <p className="trial-preview-label">{preview.label}</p>
      <img className="trial-preview-image" src={preview.image.src} alt={preview.image.alt} width={width} height={height} draggable={false} />
      <figcaption>{preview.caption}</figcaption>
    </figure>
  );
}

// UI-02／UI-03：互動資格成立且載入完成 → 兩個階段式的區塊（專案擁有者 2026-11-14）：
//   步驟 1 試著長按（六顆展示球、hover 晃動，只展示）、步驟 2 拖球建立時間區塊（原本的試用，三顆球）；
// 否則 → 各自的靜態預覽容器（不可拖曳或點擊）。loading／dormant／preview 都顯示預覽；載入中專用畫面與失敗文案未定（MOD-02）。
export function TrialSection({ loader: injected }: { loader?: TrialLoader }) {
  const { copy, language } = useSiteLanguage();
  // 載入器初始化試用的當下才讀語言（種子球名稱用）；之後切換語言不會改名（FR-10）。
  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  const [loader] = useState<TrialLoader>(() => injected ?? defaultLoader(() => languageRef.current));
  const phase = useSyncExternalStore(loader.subscribe, loader.getPhase, loader.getPhase);

  useEffect(() => (injected ? undefined : connectGate(loader)), [loader, injected]);

  const module = phase === 'active' ? loader.getModule() : null;
  const Shell = module?.TrialShell;
  const RadialShell = module?.RadialShell;
  const { one, two } = copy.trial.steps;

  return (
    <section id="trial" aria-labelledby="trial-heading" tabIndex={-1} data-trial-active={Shell ? '' : undefined}>
      <h2 id="trial-heading">{copy.trial.heading}</h2>
      <p>{copy.trial.note}</p>

      <div id="trial-step-1" className="trial-step">
        <h3>{one.heading}</h3>
        <p>{one.instruction}</p>
        {RadialShell ? <RadialShell /> : <PreviewFigure preview={one.preview} width={1280} height={512} />}
      </div>

      <div id="trial-step-2" className="trial-step">
        <h3>{two.heading}</h3>
        <p>{two.instruction}</p>
        {Shell ? <Shell /> : <PreviewFigure preview={copy.trial.preview} width={1280} height={802} />}
      </div>
    </section>
  );
}
