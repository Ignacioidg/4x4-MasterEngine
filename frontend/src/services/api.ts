const API_BASE = '/api';

export async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body: any = null,
  token: string | null = null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const storedToken = token || localStorage.getItem('4me_token');
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, options);

    if (response.status === 401) {
      if (!endpoint.includes('/auth/') && !endpoint.includes('/catalog/')) {
        localStorage.removeItem('4me_token');
        localStorage.removeItem('4me_username');
        localStorage.removeItem('4me_role');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      throw new Error('Sesión expirada o no autorizada. Inicie sesión nuevamente.');
    }

    const text = await response.text();
    let data: any = {};
    if (text) {
      if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
        throw new Error('El endpoint solicitado no está activo en la API. Asegúrese de reiniciar la API en Visual Studio.');
      }
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data.Message || data.message || `Error del servidor (${response.status})`);
    }

    return data as T;
  } catch (err: any) {
    console.error(`[API Error] ${method} ${url}:`, err);
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error('No se pudo conectar con la API de .NET. Verifique que el backend esté ejecutándose en Visual Studio.');
    }
    throw err;
  }
}
