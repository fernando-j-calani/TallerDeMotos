const DEFAULT_API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? 'https://tallermotoslaroca.azurewebsites.net'
		: 'http://localhost:8000';

export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL)
	.replace(/\/$/, '');

// Cache de la IP del cliente para evitar llamadas repetidas
let cachedClientIP = null;

/**
 * Obtiene la IP real del cliente desde el navegador usando ipify
 * Se cachea para evitar múltiples llamadas
 */
export const getClientIP = async () => {
	if (cachedClientIP) {
		return cachedClientIP;
	}

	try {
		const response = await fetch('https://api.ipify.org?format=json', {
			method: 'GET',
			cache: 'force-cache'
		});
		const data = await response.json();
		cachedClientIP = data.ip;
		return cachedClientIP;
	} catch (error) {
		console.warn('No se pudo obtener IP del cliente:', error);
		return null;
	}
};