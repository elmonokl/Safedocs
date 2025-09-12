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
    const message = data?.message || 'Error de red';
    throw new Error(message);
  }

  return data;
}

