import { useSiteLanguage } from '../site/LanguageContext';
import type { SiteLanguage } from '../site/webLanguageBackend';

// 選項名稱用各自的語言書寫，不隨目前語言翻譯（NFR-02 不把它算殘留）。
const OPTIONS: readonly { language: SiteLanguage; label: string }[] = [
  { language: 'zh-TW', label: '繁體中文' },
  { language: 'en', label: 'English' },
];

export function Header() {
  const { language, copy, setLanguage } = useSiteLanguage();
  return (
    <header>
      <span className="balls" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <h1>{copy.siteName}</h1>
      <div role="group" aria-label="語言 / Language" className="language-switch">
        {OPTIONS.map((option) => (
          <button
            key={option.language}
            type="button"
            lang={option.language}
            aria-pressed={option.language === language}
            onClick={() => setLanguage(option.language)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </header>
  );
}
