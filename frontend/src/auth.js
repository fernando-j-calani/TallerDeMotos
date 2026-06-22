import { API_BASE_URL } from './config';
const API = `${API_BASE_URL}/api`;

const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
const ES_IP_PRIVADA = (ip) =>
	/^10\./.test(ip) ||
	/^192\.168\./.test(ip) ||
	/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);

/**
 * Intenta obtener la IP de LAN del dispositivo inspeccionando los
 * "ICE candidates" que genera WebRTC al crear una conexion local.
 *
 * LIMITACION CONOCIDA: desde ~2020, Chrome/Edge/Firefox ofuscan la IP local
 * con un hostname mDNS (algo como "xxxxxxxx-xxxx....local") en vez de la IP
 * real, por privacidad. En esos navegadores esta funcion no encontrara nada
 * y se debe caer al fallback de IP publica. Solo funciona en navegadores
 * sin esa proteccion activada (p.ej. configuraciones antiguas o flags manuales).
 */
const obtenerIPLocalWebRTC = () => {
	return new Promise((resolve) => {
		if (typeof window === 'undefined' || !window.RTCPeerConnection) {
			resolve(null);
			return;
		}

		const pc = new window.RTCPeerConnection({ iceServers: [] });
		let resuelto = false;

		const terminar = (ip) => {
			if (resuelto) return;
			resuelto = true;
			try { pc.close(); } catch (_e) { /* noop */ }
			resolve(ip);
		};

		pc.onicecandidate = (event) => {
			if (!event.candidate) {
				terminar(null); // fin de la recoleccion, no se encontro IP local
				return;
			}
			const match = event.candidate.candidate.match(IPV4_REGEX);
			if (match && ES_IP_PRIVADA(match[0])) {
				terminar(match[0]);
			}
		};

		pc.createDataChannel('');
		pc.createOffer()
			.then((offer) => pc.setLocalDescription(offer))
			.catch(() => terminar(null));

		// Si el navegador ofusca con mDNS o no responde, no esperamos para siempre
		setTimeout(() => terminar(null), 2000);
	});
};

/**
 * Obtiene y cachea la IP del cliente: primero intenta la IP de LAN via
 * WebRTC, y si no esta disponible (caso mas comun en navegadores modernos)
 * cae a la IP publica que reporta el servidor.
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

		const ipLocal = await obtenerIPLocalWebRTC();
		if (ipLocal) {
			localStorage.setItem('clientIP', ipLocal);
			localStorage.setItem('clientIPTimestamp', Date.now().toString());
			console.log('✓ IP del cliente (LAN via WebRTC):', ipLocal);
			return ipLocal;
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
