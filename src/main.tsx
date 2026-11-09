import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './site/LanguageContext';
import { createSiteLanguageStore } from './site/siteLanguage';
import { detectLanguage } from './site/detectLanguage';
import { createWebLanguageBackend } from './site/webLanguageBackend';
import './styles.css';

const store = createSiteLanguageStore({
  backend: createWebLanguageBackend(() => localStorage),
  detectLanguage,
  candidates: navigator.languages,
});
void store.load();

const root = document.getElementById('root');
if (!root) throw new Error('找不到 #root：index.html 必須提供掛載點');
createRoot(root).render(
  <StrictMode>
    <LanguageProvider store={store}>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
