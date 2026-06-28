import { API_BASE_URL } from './config';
const API = `${API_BASE_URL}/api`;

export const logoutUniversal = async () => {
  const token = localStorage.getItem('token');

  try {
    if (token) {
      await fetch(`${API}/logout/`, {
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
