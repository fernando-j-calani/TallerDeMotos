const DEFAULT_API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? 'https://tallermotoslaroca.azurewebsites.net'
		: 'http://localhost:8000';

export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL)
	.replace(/\/$/, '');

// Cache de la IP del cliente
let cachedClientIP = null;
let ipFetchInProgress = null;

/**
 * Obtiene la IP real del cliente desde el backend
 * El backend la calcula desde X-Forwarded-For, REMOTE_ADDR, etc.
 */
export const getClientIP = async () => {
	// Si ya tiene cache, devolverlo
	if (cachedClientIP) {
		return cachedClientIP;
	}

	// Si una llamada ya está en progreso, esperar a esa
	if (ipFetchInProgress) {
		return ipFetchInProgress;
	}

	// Realizar la llamada
	ipFetchInProgress = (async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/get-client-ip/`, {
				method: 'GET',
				credentials: 'include',
			});
			const data = await response.json();
			cachedClientIP = data.ip || null;
			return cachedClientIP;
		} catch (error) {
			console.warn('No se pudo obtener IP del cliente:', error);
			return null;
		} finally {
			ipFetchInProgress = null;
		}
	})();

	return ipFetchInProgress;
};