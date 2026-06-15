import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Login.css';
import { repairText, formatServerDateToLaPaz } from './textNormalization';
import { API_BASE_URL } from './config';
import { logoutUniversal } from './auth';

const API = `${API_BASE_URL}/api`;

const ESTADOS_POSITIVOS = ['finalizado', 'facturado', 'pagado'];

const formatKilometraje = (valor) => {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(numero)) {
    return '—';
  }
  return `${numero.toLocaleString('es-BO')} km`;
};

const DetalleMotocicleta = () => {
  const navigate = useNavigate();
  const { codigo } = useParams();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [motocicleta, setMotocicleta] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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

    cargarHistorial();
  }, [navigate, usuarioLocal, codigo]);

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await fetch(`${API}/mis-motocicletas/${codigo}/historial/`, { headers: headers(false) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo cargar el historial de la motocicleta.');
        setMotocicleta(null);
        setOrdenes([]);
        return;
      }

      setMotocicleta(data.motocicleta || null);
      setOrdenes(Array.isArray(data.ordenes) ? data.ordenes : []);
    } catch {
      setError('Error de conexión cargando el historial.');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await logoutUniversal();
    navigate('/login', { replace: true });
  };

  const marcaModelo = motocicleta
    ? `${repairText(motocicleta.marca)} ${repairText(motocicleta.modelo)}`.trim() || 'Motocicleta'
    : '';

  return (
    <div className="app-container motos-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/motocicletas/fondo-motocicletas-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/motocicletas/fondo-motocicletas-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Detalle de mi motocicleta</h2>
          <div className="page-subtitle">Órdenes de trabajo y notas de avance registradas</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/mis-motocicletas')} className="btn-secondary">Mi Garaje</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={cerrarSesion} className="btn-secondary">Cerrar Sesión</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      {cargando ? (
        <div className="bitacora-panel" style={{ marginTop: '20px' }}>Cargando historial...</div>
      ) : motocicleta && (
        <>
          <div className="bitacora-panel" style={{ marginTop: '20px' }}>
            <h3 className="usuarios-panel-title">{marcaModelo} - {motocicleta.placa}</h3>
            <div className="facturacion-detail-info">
              <p><strong>Año:</strong> {motocicleta.anio || '—'}</p>
              <p><strong>Cilindraje:</strong> {motocicleta.cilindraje || '—'}</p>
              <p><strong>Color:</strong> {repairText(motocicleta.color) || '—'}</p>
              <p><strong>N° de chasis:</strong> {motocicleta.numero_chasis || '—'}</p>
              <p><strong>Kilometraje actual:</strong> {formatKilometraje(motocicleta.kilometraje_actual)}</p>
            </div>
          </div>

          {ordenes.length === 0 ? (
            <div className="garage-empty">
              <i className="fa-solid fa-clipboard-list"></i>
              Esta motocicleta no tiene órdenes de trabajo registradas.
            </div>
          ) : (
            ordenes.map((orden) => {
              const esPositivo = ESTADOS_POSITIVOS.includes((orden.estado || '').trim().toLowerCase());

              return (
                <div key={orden.codigo} className="bitacora-panel" style={{ marginTop: '20px' }}>
                  <h3 className="usuarios-panel-title">
                    Orden #{orden.codigo}{' '}
                    <span className={`usuario-status-badge usuario-status-badge--${esPositivo ? 'activo' : 'inactivo'}`}>
                      {orden.estado || 'Sin estado'}
                    </span>
                  </h3>
                  <div className="facturacion-detail-info">
                    <p><strong>Fecha de ingreso:</strong> {orden.fecha_creacion || '-'}</p>
                    <p><strong>Fecha de inicio:</strong> {orden.fecha_inicio || '-'}</p>
                    <p><strong>Fecha de finalización:</strong> {orden.fecha_fin || '-'}</p>
                    <p><strong>Mecánico asignado:</strong> {repairText(orden.mecanico_nombre) || '-'}</p>
                    <p><strong>Prioridad:</strong> {orden.prioridad || '-'}</p>
                    <p><strong>Mano de obra:</strong> {orden.costo_mano_obra || 0}</p>
                    <p><strong>Repuestos:</strong> {orden.costo_repuestos || 0}</p>
                    <p><strong>Total:</strong> {orden.total_general}</p>
                  </div>

                  <h4 className="usuarios-panel-title" style={{ marginTop: '16px' }}>Notas de avance</h4>
                  {(!orden.notas || orden.notas.length === 0) ? (
                    <p>Sin novedades registradas.</p>
                  ) : (
                    orden.notas.map((nota) => (
                      <div key={nota.codigo} className="historial-detalle-item">
                        <p>
                          <strong>{repairText(nota.tipo_nota) || 'Nota'}</strong>
                          {' — '}
                          {nota.fecha_hora ? formatServerDateToLaPaz(nota.fecha_hora) : 'Sin fecha'}
                          {' · '}
                          {repairText(nota.mecanico_nombre) || '-'}
                        </p>
                        <p>{repairText(nota.contenido)}</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
};

export default DetalleMotocicleta;
