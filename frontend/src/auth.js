import { API_BASE_URL, getClientIP } from './config';
const API = `${API_BASE_URL}/api`;

/**
 * Wrapper de fetch que agrega automáticamente la IP del cliente en el header X-Client-IP
 */
export const fetchWithIP = async (url, options = {}) => {
  const clientIP = await getClientIP();
  
  const headers = {
    ...options.headers,
  };

  if (clientIP) {
    headers['X-Client-IP'] = clientIP;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const logoutUniversal = async () => {
  const token = localStorage.getItem('token');

  try {
    if (token) {
      await fetchWithIP(`${API}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (_error) {
    // Ignoramos error de red: igualmente limpiamos sesión local.
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
};
