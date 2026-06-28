import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { logoutUniversal } from './auth';
import './SesionInactividad.css';

const TICK_MS = 5000;
const REFRESH_THROTTLE_MS = 60 * 1000;
const AVISO_INACTIVIDAD_MS = 25 * 60 * 1000;
const CIERRE_INACTIVIDAD_MS = 30 * 60 * 1000;
const ESPERA_RESPUESTA_MS = CIERRE_INACTIVIDAD_MS - AVISO_INACTIVIDAD_MS;
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

// Componente sin UI visible salvo cuando aparece el aviso: mantiene la
// sesión "viva" mientras el usuario interactúa con el sistema (reinicia la
// expiración del token), y si detecta 25 min de inactividad muestra un
// aviso para extender o cerrar sesión. Con el aviso visible, solo un click
// (en cualquier parte de la pantalla o en el botón "Extender") lo oculta y
// reinicia el contador desde 0; mover el mouse, hacer scroll o presionar
// una tecla no cuentan. Si no hay ningún click, cierra sesión
// automáticamente a los 30 min de inactividad.
const SesionInactividad = () => {
  const navigate = useNavigate();
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const ultimaActividadRef = useRef(Date.now());
  const ultimoRefrescoRef = useRef(Date.now());
  const avisoVisibleRef = useRef(false);
  const avisoMostradoEnRef = useRef(null);
  const tokenAnteriorRef = useRef(!!localStorage.getItem('token'));
  const refrescandoRef = useRef(false);

  useEffect(() => {
    const refrescarToken = async () => {
      if (refrescandoRef.current) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      refrescandoRef.current = true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/refresh-token/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.token) {
            localStorage.setItem('token', data.token);
          }
        }
        ultimoRefrescoRef.current = Date.now();
      } catch {
        // Sin conexión momentánea: se reintentará en el siguiente tick.
      } finally {
        refrescandoRef.current = false;
      }
    };

    const ocultarAviso = () => {
      avisoVisibleRef.current = false;
      avisoMostradoEnRef.current = null;
      setMostrarAviso(false);
    };

    const cerrarPorInactividad = async () => {
      ocultarAviso();
      await logoutUniversal();
      localStorage.setItem('sesion_cerrada_motivo', 'Sesión expirada, vuelva a autenticarse nuevamente.');
      navigate('/login', { replace: true });
    };

    const marcarActividad = (evento) => {
      if (avisoVisibleRef.current) {
        // Con el aviso visible, solo un click real (en cualquier parte de la
        // pantalla o en el botón "Extender") cuenta como respuesta implícita:
        // lo oculta y refresca el token. Mover el mouse, hacer scroll o
        // presionar una tecla NO debe descartarlo por accidente.
        if (evento?.type !== 'click') return;
        ultimaActividadRef.current = Date.now();
        ocultarAviso();
        refrescarToken();
        return;
      }
      ultimaActividadRef.current = Date.now();
    };

    const tick = async () => {
      const token = localStorage.getItem('token');

      // Detectamos transición login/logout por presencia de token, no por su valor:
      // el propio refresco de token lo cambia, y comparar el string completo lo
      // confundía con una sesión nueva, reiniciando el reloj en cada refresco.
      const habiaSesion = tokenAnteriorRef.current;
      const haySesion = !!token;
      tokenAnteriorRef.current = haySesion;

      if (haySesion !== habiaSesion) {
        ultimaActividadRef.current = Date.now();
        ultimoRefrescoRef.current = Date.now();
        if (avisoVisibleRef.current) ocultarAviso();
      }

      if (!token) return;

      const ahora = Date.now();

      if (!avisoVisibleRef.current) {
        const inactivo = ahora - ultimaActividadRef.current;
        if (inactivo >= AVISO_INACTIVIDAD_MS) {
          avisoVisibleRef.current = true;
          avisoMostradoEnRef.current = ahora;
          setMostrarAviso(true);
        } else if (ahora - ultimoRefrescoRef.current >= REFRESH_THROTTLE_MS) {
          await refrescarToken();
        }
      } else if (ahora - avisoMostradoEnRef.current >= ESPERA_RESPUESTA_MS) {
        await cerrarPorInactividad();
      }
    };

    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, marcarActividad, { passive: true }));
    const intervalo = setInterval(tick, TICK_MS);

    return () => {
      EVENTOS_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, marcarActividad));
      clearInterval(intervalo);
    };
  }, [navigate]);

  const manejarExtender = async () => {
    avisoVisibleRef.current = false;
    avisoMostradoEnRef.current = null;
    setMostrarAviso(false);
    ultimaActividadRef.current = Date.now();

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/refresh-token/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.token) {
            localStorage.setItem('token', data.token);
          }
        }
      } catch {
        // Si falla por red, el siguiente tick reintentará el refresco normalmente.
      }
    }
  };

  const manejarCerrarSesion = async () => {
    avisoVisibleRef.current = false;
    avisoMostradoEnRef.current = null;
    setMostrarAviso(false);
    await logoutUniversal();
    navigate('/login', { replace: true });
  };

  if (!mostrarAviso) return null;

  return (
    <div className="sesion-inactividad-overlay">
      <div className="sesion-inactividad-card">
        <h2>Tu sesión está por expirar</h2>
        <p>Llevas un tiempo sin actividad. ¿Deseas extender tu sesión? (Un clic en cualquier parte de la pantalla también la extiende.)</p>
        <div className="sesion-inactividad-acciones">
          <button type="button" className="btn-extender" onClick={manejarExtender}>
            Extender
          </button>
          <button type="button" className="btn-cerrar-sesion" onClick={manejarCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SesionInactividad;
