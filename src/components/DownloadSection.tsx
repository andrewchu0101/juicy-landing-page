import { COPY } from '../content';
import { DOWNLOAD_LINKS } from '../config/links';

export function DownloadSection() {
  return (
    <section id="download" aria-labelledby="download-heading" data-links-verification={DOWNLOAD_LINKS.verification}>
      <h2 id="download-heading">{COPY.download.heading}</h2>
      <p>
        <a href={DOWNLOAD_LINKS.primary}>{COPY.download.primary}</a>
      </p>
      <ul>
        <li>
          <a href={DOWNLOAD_LINKS.portableZip}>{COPY.download.portableZip}</a>
        </li>
        <li>
          <a href={DOWNLOAD_LINKS.source}>{COPY.download.source}</a>
        </li>
      </ul>
      <h3>{COPY.download.factsHeading}</h3>
      <ul>
        {COPY.download.facts.map((fact) => (
          <li key={fact.id}>{fact.text}</li>
        ))}
      </ul>
    </section>
  );
}
