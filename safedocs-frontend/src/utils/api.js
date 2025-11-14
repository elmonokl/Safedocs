const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';

export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const token = localStorage.getItem('token');

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isJsonBody = body && !isFormData;

  const finalHeaders = {
    'Accept': 'application/json',
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers
  };

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    ...(body ? (isJsonBody ? { body: JSON.stringify(body) } : { body }) : {})
  });

  let data;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    // Manejo especial para errores de rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || response.headers.get('X-RateLimit-Reset');
      const message = data?.message || 'Demasiadas solicitudes';
      const retrySeconds = data?.retryAfter || (retryAfter ? parseInt(retryAfter) : null);
      
      const error = new Error(message);
      error.status = 429;
      error.retryAfter = retrySeconds;
      error.resetTime = data?.resetTime || null;
      throw error;
    }
    
    const message = data?.message || 'Error de red';
    const error = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = data; // Incluir la respuesta completa para acceder a los errores de validación
    console.error('Error en apiFetch:', {
      status: response.status,
      statusText: response.statusText,
      data,
      url,
      method,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
    });
    throw error;
  }

  return data;
}

