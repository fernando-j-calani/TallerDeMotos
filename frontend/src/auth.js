import { API_BASE_URL } from './config';
const API = `${API_BASE_URL}/api`;

/**
 * Obtiene y cachea la IP del cliente desde el servidor
 * Se ejecuta en paralelo (no bloqueante)
 */
export const fetchClientIPFromServer = async () => {
	try {
		// Verificar si ya está en cache
		const cachedIP = localStorage.getItem('clientIP');
		if (cachedIP && cachedIP !== 'unknown') {
			console.log('✓ IP del cliente (cache):', cachedIP);
			return cachedIP;
		}

		// Obtener IP del servidor (sin timeout agresivo para permitir respuesta)
		const response = await fetch(`${API}/get-client-ip/`, {
			method: 'GET',
			credentials: 'omit', // Sin cookies para evitar CORS issues
			timeout: 5000, // 5 segundos máximo
		});

		if (response.ok) {
			const data = await response.json();
			const ip = data.ip || 'unknown';
			
			// Cachear por 1 hora
			localStorage.setItem('clientIP', ip);
			localStorage.setItem('clientIPTimestamp', Date.now().toString());
			
			console.log('✓ IP del cliente (servidor):', ip);
			return ip;
		}
	} catch (error) {
		console.warn('⚠ No se pudo obtener IP del servidor:', error.message);
	}

	return null;
};

/**
 * Wrapper de fetch que agrega automáticamente el header X-Client-IP si está disponible
 * NO BLOQUEANTE: el login procede incluso si la IP no está disponible
 */
export const fetchWithIP = (url, options = {}) => {
	const headers = { ...options.headers };

	// Obtener IP del cache local (síncrono)
	const cachedIP = localStorage.getItem('clientIP');
	if (cachedIP && cachedIP !== 'unknown') {
		headers['X-Client-IP'] = cachedIP;
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
