import { useSiteLanguage } from '../site/LanguageContext';
import { DOWNLOAD_LINKS } from '../config/links';

export function DownloadSection() {
  const { copy } = useSiteLanguage();
  return (
    <section id="download" aria-labelledby="download-heading" data-links-verification={DOWNLOAD_LINKS.verification}>
      <h2 id="download-heading">{copy.download.heading}</h2>
      <p>
        <a href={DOWNLOAD_LINKS.primary}>{copy.download.primary}</a>
      </p>
      <ul>
        <li>
          <a href={DOWNLOAD_LINKS.portableZip}>{copy.download.portableZip}</a>
        </li>
        <li>
          <a href={DOWNLOAD_LINKS.source}>{copy.download.source}</a>
        </li>
      </ul>
      <h3>{copy.download.checksum.heading}</h3>
      <p>
        {copy.download.checksum.label}: <code>{DOWNLOAD_LINKS.sha256}</code>
      </p>
      <p>{copy.download.checksum.howTo}</p>
      <h3>{copy.download.factsHeading}</h3>
      <ul>
        {copy.download.facts.map((fact) => (
          <li key={fact.id}>{fact.text}</li>
        ))}
      </ul>
    </section>
  );
}
