/**
 * HTTP Client centralizado para o Monitor de Licitações.
 * Suporta autenticação via Bearer JWT (localStorage / sessionStorage / window / cookie)
 * e failover com x-api-key (Regra 3: Segurança Default-On).
 */

const TOKEN_STORAGE_KEY = 'auth_token';

/**
 * Retorna o token de autenticação JWT ativo, caso exista no storage ou contexto da aplicação.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
    (window as any).__AUTH_TOKEN__ ||
    null
  );
}

/**
 * Salva o token JWT de autenticação no storage local.
 */
export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    (window as any).__AUTH_TOKEN__ = token;
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    delete (window as any).__AUTH_TOKEN__;
  }
}

/**
 * Lança um erro se a resposta HTTP não for bem-sucedida (status 2xx).
 */
export async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    let errorDetail = '';
    try {
      const data = await res.json();
      errorDetail = data?.error || data?.message || JSON.stringify(data);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(`API Error ${res.status}: ${res.statusText} - ${errorDetail}`);
  }
}

/**
 * Wrapper sobre fetch para chamadas à API, injetando Bearer JWT e chaves de API
 * em todas as requisições (GET, POST, PUT, DELETE).
 */
export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // 1. Injeta Bearer JWT se disponível (Regra 3 / login)
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 2. Injeta x-api-key como fallback de autenticação (dev / workers / service key)
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MONITOR_API_KEY) ||
    'monitor-dev-key';
  if (apiKey && !headers.has('x-api-key')) {
    headers.set('x-api-key', apiKey);
  }

  return fetch(url, {
    ...options,
    headers
  });
}
