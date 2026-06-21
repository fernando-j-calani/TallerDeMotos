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
 * Obtiene la IP real del cliente desde servicios públicos
 * Intenta múltiples fuentes con fallback
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

	// Realizar la llamada con múltiples intentos
	ipFetchInProgress = (async () => {
		const servicios = [
			// Servicio 1: ipify (rápido y confiable)
			{
				url: 'https://api.ipify.org?format=json',
				parse: (data) => data.ip,
				timeout: 3000,
			},
			// Servicio 2: ident.me (alternativa simple)
			{
				url: 'https://ident.me',
				parse: (data) => data.trim(),
				timeout: 3000,
				isText: true,
			},
			// Servicio 3: icanhazip (alternativa simple)
			{
				url: 'https://icanhazip.com',
				parse: (data) => data.trim(),
				timeout: 3000,
				isText: true,
			},
		];

		for (const servicio of servicios) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), servicio.timeout);

				const response = await fetch(servicio.url, {
					signal: controller.signal,
					credentials: 'omit', // No incluir cookies para evitar CORS issues
				});

				clearTimeout(timeoutId);

				if (response.ok) {
					const texto = await response.text();
					const ip = servicio.isText ? servicio.parse(texto) : servicio.parse(JSON.parse(texto));
					
					// Validar que sea una IP válida (simple check)
					if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
						cachedClientIP = ip;
						console.log('✓ IP del cliente obtenida:', ip);
						return cachedClientIP;
					}
				}
			} catch (error) {
				console.warn(`No se pudo obtener IP de ${servicio.url}:`, error.message);
				// Continuar al siguiente servicio
			}
		}

		console.warn('No se pudo obtener IP del cliente desde ningún servicio');
		return null;
	})();

	return ipFetchInProgress;
};