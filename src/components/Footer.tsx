import { LEGAL_LINKS } from '../config/links';
import { useSiteLanguage } from '../site/LanguageContext';

export function Footer() {
  const { copy } = useSiteLanguage();
  return (
    <footer>
      <p>{copy.footer.privacy}</p>
      <a href={LEGAL_LINKS.license}>{copy.footer.license}</a> <a href={LEGAL_LINKS.trademarks}>{copy.footer.trademarks}</a>
    </footer>
  );
}
