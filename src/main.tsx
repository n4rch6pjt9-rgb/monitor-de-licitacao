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

// Interceptador global para chamadas /api:
// 1. Injeta Bearer JWT a partir do storage de login se presente.
// 2. Local DEV ONLY: se VITE_MONITOR_API_KEY foi explicitamente setado, injeta x-api-key (sem fallback).
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

    // Local DEV ONLY: injeta x-api-key apenas com chave explícita em import.meta.env
    if (import.meta.env?.DEV && import.meta.env?.VITE_MONITOR_API_KEY) {
      const explicitDevKey = import.meta.env.VITE_MONITOR_API_KEY.trim();
      if (explicitDevKey && !headers.has('x-api-key')) {
        headers.set('x-api-key', explicitDevKey);
      }
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
