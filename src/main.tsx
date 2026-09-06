import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as amplitude from '@amplitude/unified';
import App from './App.tsx';
import './index.css';

const amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
if (!amplitudeApiKey) {
  console.warn('Amplitude API key missing — analytics disabled');
} else {
  amplitude.initAll(amplitudeApiKey, {"analytics":{"autocapture":true},"sessionReplay":{"sampleRate":1}});
  amplitude.track('Viewed Dashboard Page', { prompt_version: 'BA400.4' }); // helps improve this setup flow — safe to remove once you've verified the event lands
}

// Interceptador global para injetar credenciais de autenticação (Bearer JWT e x-api-key)
// em todas as chamadas /api (Regra 3: Segurança Default-On)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    config = config || {};
    const headers = new Headers(config.headers || {});

    // Injeta Bearer JWT se existir no storage
    const token =
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      (window as any).__AUTH_TOKEN__;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Injeta x-api-key fallback
    const apiKey = import.meta.env.VITE_MONITOR_API_KEY || 'monitor-dev-key';
    if (apiKey && !headers.has('x-api-key')) {
      headers.set('x-api-key', apiKey);
    }

    config.headers = headers;
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
