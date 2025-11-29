// URL base de la API, toma el valor de las variables de entorno o usa localhost por defecto
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';

// Función principal para hacer peticiones HTTP a la API
// Maneja automáticamente la autenticación, el formato de datos y los errores
export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  // Obtiene el token de autenticación del localStorage
  const token = localStorage.getItem('token');

  // Detecta si el body es FormData (para uploads) o JSON
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isJsonBody = body && !isFormData;

  // Configura los headers de la petición
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
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.warn('Error parseando respuesta JSON:', e);
    data = {};
  }

  // Maneja errores HTTP
  if (!response.ok) {
    // Manejo especial para rate limiting (429)
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
    
    // Intentar extraer mensaje de error de diferentes formatos
    let message = 'Error en la solicitud';
    
    if (data?.message) {
      message = data.message;
    } else if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      message = data.errors[0].message || data.errors.map(e => e.message || e.msg).join(', ');
    } else if (data?.error) {
      message = typeof data.error === 'string' ? data.error : data.error.message || 'Error desconocido';
    } else {
      // Mensajes por defecto según el código de estado
      const defaultMessages = {
        400: 'Solicitud inválida. Verifica los datos ingresados.',
        401: 'No autorizado. Inicia sesión nuevamente.',
        403: 'Acceso denegado.',
        404: 'Recurso no encontrado.',
        500: 'Error interno del servidor. Intenta nuevamente más tarde.'
      };
      message = defaultMessages[response.status] || `Error ${response.status}: ${response.statusText}`;
    }
    
    const error = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = data;
    console.error('Error en apiFetch:', {
      status: response.status,
      statusText: response.statusText,
      data,
      message,
      url,
      method,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
    });
    throw error;
  }

  return data;
}

