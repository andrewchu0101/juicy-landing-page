import { LEGAL_LINKS } from '../config/links';
import { COPY } from '../content';

export function Footer() {
  return (
    <footer>
      <a href={LEGAL_LINKS.license}>{COPY.footer.license}</a> <a href={LEGAL_LINKS.trademarks}>{COPY.footer.trademarks}</a>
    </footer>
  );
}
