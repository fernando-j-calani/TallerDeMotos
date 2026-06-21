import { API_BASE_URL } from './config';
const API = `${API_BASE_URL}/api`;

/**
 * Wrapper de fetch - simplemente hace fetch normal
 * El backend captura la IP desde X-Forwarded-For/REMOTE_ADDR
 */
export const fetchWithIP = (url, options = {}) => {
	return fetch(url, options);
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
