import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';
import { fetchPermisosUsuario, tienePermisoCu } from './permissions';
import { logoutUniversal } from './auth';

const API = `${API_BASE_URL}/api`;

const formatKilometraje = (valor) => {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(numero)) {
    return '—';
  }
  return `${numero.toLocaleString('es-BO')} km`;
};

const MisMotocicletas = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [cliente, setCliente] = useState(null);
  const [motos, setMotos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [puedeVerBitacora, setPuedeVerBitacora] = useState(false);

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!usuarioLocal || usuarioLocal.rol !== 'Cliente') {
      navigate('/login');
      return;
    }

    cargarMisMotocicletas();
    cargarPermisoBitacora();
  }, [navigate, usuarioLocal]);

  const cargarPermisoBitacora = async () => {
    const permisos = await fetchPermisosUsuario();
    setPuedeVerBitacora(tienePermisoCu(permisos, 'CU20', usuarioLocal?.rol));
  };

  const cargarMisMotocicletas = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await fetch(`${API}/mis-motocicletas/`, { headers: headers(false) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudieron cargar tus motocicletas.');
        setMotos([]);
        setCliente(null);
        return;
      }

      setCliente(data.cliente || null);
      setMotos(Array.isArray(data.motocicletas) ? data.motocicletas : []);
      if (data.mensaje) {
        setError(data.mensaje);
      }
    } catch {
      setError('Error de conexión cargando motocicletas.');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await logoutUniversal();
    navigate('/login', { replace: true });
  };

  const totalMotos = motos.length;
  const motosActivas = motos.filter((moto) => (moto.estado || 'Activo') === 'Activo').length;
  const motosInactivas = totalMotos - motosActivas;
  const nombreCliente = repairText(cliente?.nombre || usuarioLocal?.nombre || 'Piloto');

  return (
    <div className="app-container motos-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/motocicletas/fondo-motocicletas-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/motocicletas/fondo-motocicletas-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Mi Garaje</h2>
          <div className="page-subtitle">Tus motocicletas registradas en Taller La Roca</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          {puedeVerBitacora && (
            <button onClick={() => navigate('/bitacora')} className="btn-secondary">Bitácora</button>
          )}
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={cerrarSesion} className="btn-secondary">Cerrar Sesión</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="garage-hero">
        <div className="garage-hero-text">
          <span className="garage-hero-kicker">Panel del Cliente</span>
          <h1>Bienvenido, {nombreCliente}</h1>
          <p>Consulta el estado de tu flota: placa, kilometraje, cilindraje y demás datos de cada motocicleta registrada a tu nombre.</p>
        </div>
        <div className="garage-hero-stats">
          <div className="garage-hero-stat">
            <span className="garage-hero-stat-value">{totalMotos}</span>
            <span className="garage-hero-stat-label">Vehículos</span>
          </div>
          <div className="garage-hero-stat">
            <span className="garage-hero-stat-value">{motosActivas}</span>
            <span className="garage-hero-stat-label">Activos</span>
          </div>
          <div className="garage-hero-stat">
            <span className="garage-hero-stat-value">{motosInactivas}</span>
            <span className="garage-hero-stat-label">Inactivos</span>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="bitacora-panel" style={{ marginTop: '20px' }}>Cargando motocicletas...</div>
      ) : motos.length === 0 ? (
        <div className="garage-empty">
          <i className="fa-solid fa-motorcycle"></i>
          No tienes motocicletas asociadas todavía.
        </div>
      ) : (
        <div className="garage-grid">
          {motos.map((moto) => {
            const estado = moto.estado || 'Activo';
            const esActivo = estado === 'Activo';
            const marcaModelo = `${repairText(moto.marca)} ${repairText(moto.modelo)}`.trim() || 'Motocicleta';

            return (
              <div key={moto.codigo} className={`garage-card ${esActivo ? '' : 'garage-card--inactivo'}`}>
                <div className="garage-card-media">
                  <i className="fa-solid fa-motorcycle"></i>
                  <span className={`garage-card-status garage-card-status--${esActivo ? 'activo' : 'inactivo'}`}>
                    {estado}
                  </span>
                  <span className="garage-card-plate">{moto.placa}</span>
                </div>
                <div className="garage-card-body">
                  <h3 className="garage-card-title">{marcaModelo}</h3>
                  <div className="garage-card-subtitle">Año {moto.anio || '—'}</div>
                  <div className="garage-card-meta">
                    <div className="garage-card-meta-item">
                      <i className="fa-solid fa-gauge-high"></i>
                      <span>{formatKilometraje(moto.kilometraje_actual)}</span>
                    </div>
                    <div className="garage-card-meta-item">
                      <i className="fa-solid fa-gears"></i>
                      <span>{moto.cilindraje || '—'}</span>
                    </div>
                    <div className="garage-card-meta-item">
                      <i className="fa-solid fa-palette"></i>
                      <span>{repairText(moto.color) || '—'}</span>
                    </div>
                    <div className="garage-card-meta-item" title={moto.numero_chasis || ''}>
                      <i className="fa-solid fa-fingerprint"></i>
                      <span>{moto.numero_chasis || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisMotocicletas;
