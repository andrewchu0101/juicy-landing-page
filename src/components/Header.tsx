import { COPY } from '../content';

export function Header() {
  return (
    <header>
      <span className="balls" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <h1>{COPY.siteName}</h1>
    </header>
  );
}
