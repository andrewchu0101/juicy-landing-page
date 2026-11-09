import { useSiteLanguage } from '../site/LanguageContext';

// 試用內容在 issue 004 之後才出現；本票只提供容器（UI-02：容器需能接收焦點）。
export function TrialSection() {
  const { copy } = useSiteLanguage();
  return (
    <section id="trial" aria-labelledby="trial-heading" tabIndex={-1}>
      <h2 id="trial-heading">{copy.trial.heading}</h2>
      <p>{copy.trial.note}</p>
    </section>
  );
}
