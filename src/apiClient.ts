/**
 * HTTP Client centralizado para o Monitor de Licitações.
 */

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
 * Wrapper sobre fetch para chamadas à API, injetando chaves e validando retorno se solicitado.
 */
export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  // A injeção do x-api-key atualmente está ocorrendo globalmente no main.tsx.
  // Caso o interceptor global seja removido, a injeção deve ser feita aqui:
  /*
  options.headers = {
    ...options.headers,
    'x-api-key': import.meta.env.VITE_MONITOR_API_KEY || 'monitor-dev-key'
  };
  */

  const res = await fetch(url, options);
  
  // Por padrão, chamadas via apiClient podem ser validadas externamente 
  // usando assertOk(res), ou podemos chamar internamente.
  // Para flexibilidade, retornamos o Response e deixamos o chamador usar assertOk
  // onde for conveniente.
  return res;
}
