import { DownloadSection } from './components/DownloadSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TrialSection } from './components/TrialSection';

export function App() {
  return (
    <>
      <Header />
      <main>
        <TrialSection />
        <DownloadSection />
      </main>
      <Footer />
    </>
  );
}
