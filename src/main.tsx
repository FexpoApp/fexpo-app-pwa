import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';

// Google OAuth is authorized for the canonical app origin. Keep legacy
// production aliases (including installed PWAs) from starting a login there.
const legacyProductionHosts = new Set([
  'fexpo-app.vercel.app',
  'fexpo-app-quispevargasomar-7449s-projects.vercel.app',
]);
if (legacyProductionHosts.has(window.location.hostname)) {
  const target = new URL(window.location.href);
  target.protocol = 'https:';
  target.host = 'app.fexpo.lat';
  window.location.replace(target.href);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}
