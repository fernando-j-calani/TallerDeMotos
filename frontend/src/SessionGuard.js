import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { logoutUniversal } from './auth';

const INTERVALO_MS = 3000;

// Componente sin UI: detecta si la sesión actual fue cerrada (porque se
// inició sesión con la misma cuenta en otro dispositivo/navegador, o porque
// otra pestaña de este mismo navegador cerró sesión) y redirige a /login.
// Revisa cada pocos segundos y, además, de inmediato cuando la pestaña
// recupera el foco/visibilidad, para que el cierre se note casi al instante.
const SessionGuard = () => {
  const navigate = useNavigate();
  const verificandoRef = useRef(false);

  useEffect(() => {
    const cerrarPorOtroDispositivo = async (mensaje) => {
      await logoutUniversal();
      localStorage.setItem('sesion_cerrada_motivo', mensaje);
      navigate('/login');
    };

    const verificarSesion = async () => {
      const token = localStorage.getItem('token');
      if (!token || verificandoRef.current) return;

      verificandoRef.current = true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/perfil/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.sesion_reemplazada) {
            await cerrarPorOtroDispositivo(data.error || 'Tu sesión se cerró porque iniciaste sesión en otro dispositivo.');
          }
        }
      } catch {
        // Error de red: no forzamos logout, puede ser solo falta de conexión momentánea.
      } finally {
        verificandoRef.current = false;
      }
    };

    verificarSesion();
    const intervalo = setInterval(verificarSesion, INTERVALO_MS);

    const onVisibleOFocus = () => {
      if (document.visibilityState === 'visible') {
        verificarSesion();
      }
    };
    document.addEventListener('visibilitychange', onVisibleOFocus);
    window.addEventListener('focus', onVisibleOFocus);

    const onStorageChange = (event) => {
      if (event.key === 'token' && !event.newValue) {
        navigate('/login');
      }
    };
    window.addEventListener('storage', onStorageChange);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', onVisibleOFocus);
      window.removeEventListener('focus', onVisibleOFocus);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [navigate]);

  return null;
};

export default SessionGuard;
