import { API_BASE_URL, getClientIP } from './config';
const API = `${API_BASE_URL}/api`;

/**
 * Wrapper de fetch que agrega automáticamente el header X-Client-IP
 */
export const fetchWithIP = async (url, options = {}) => {
	try {
		// Obtener la IP desde el backend
		const clientIP = await getClientIP();

		// Agregar el header si tenemos IP
		const headers = {
			...options.headers,
		};

		if (clientIP && clientIP !== 'unknown') {
			headers['X-Client-IP'] = clientIP;
		}

		return fetch(url, {
			...options,
			headers,
		});
	} catch (error) {
		// Si hay error al obtener IP, hacer el fetch sin ella
		return fetch(url, options);
	}
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
