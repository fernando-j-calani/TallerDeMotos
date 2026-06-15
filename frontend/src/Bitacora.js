import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reutilizamos tu fondo oscuro
import { logoutUniversal } from './auth';
import { formatServerDateToLaPaz, repairText } from './textNormalization';
import AdminMenu from './AdminMenu';
import { API_BASE_URL } from './config';

const ESTADISTICAS_INICIALES = {
  total_eventos: 0,
  eventos_hoy: 0,
  accion_mas_frecuente: null,
  accion_mas_frecuente_total: 0,
  usuario_mas_activo: null,
  usuario_mas_activo_total: 0,
};

const TRUNCAR_DESCRIPCION = 90;

const Bitacora = () => {
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', usuario: '', accion: '' });
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [estadisticas, setEstadisticas] = useState(ESTADISTICAS_INICIALES);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  // Obtenemos los datos del usuario logueado
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);

  useEffect(() => {
    // Si no hay usuario logueado, lo pateamos de vuelta al Login
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    cargarBitacora();
  }, [navigate, usuarioLocal]);

  const cargarBitacora = async (f = filtros, paginaSolicitada = 1) => {
    setError('');
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (f.fecha_desde) params.append('fecha_desde', f.fecha_desde);
    if (f.fecha_hasta) params.append('fecha_hasta', f.fecha_hasta);
    if (f.usuario) params.append('usuario', f.usuario);
    if (f.accion) params.append('accion', f.accion);
    params.append('page', paginaSolicitada);
    params.append('page_size', 25);

    const url = `${API_BASE_URL}/api/bitacora/?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      setError(repairText(data.error || 'No se pudo cargar bitacora.'));
      setRegistros([]);
      return;
    }

    setRegistros(Array.isArray(data.resultados) ? data.resultados : []);
    setPagina(data.paginacion?.pagina || 1);
    setTotalPaginas(data.paginacion?.total_paginas || 1);
    setTotalRegistros(data.paginacion?.total_registros || 0);
    setEstadisticas(data.estadisticas || ESTADISTICAS_INICIALES);
    setExpandedId(null);
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === pagina) return;
    cargarBitacora(filtros, nuevaPagina);
  };

  const truncarDescripcion = (texto) => {
    if (!texto) return '';
    return texto.length > TRUNCAR_DESCRIPCION ? `${texto.slice(0, TRUNCAR_DESCRIPCION)}…` : texto;
  };

  const exportarCsv = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros.usuario) params.append('usuario', filtros.usuario);
    if (filtros.accion) params.append('accion', filtros.accion);
    params.append('export', 'csv');

    const response = await fetch(`${API_BASE_URL}/api/bitacora/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setError('No se pudo exportar CSV.');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitacora.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const cerrarSesion = async () => {
    await logoutUniversal();
    navigate('/login');
  };

  return (
    <div className="app-container bitacora-page">
      <div className="bitacora-bg-layer bitacora-bg-layer--moto" style={{ backgroundImage: 'url(/static/img/bitacora/fondo-moto.png)' }}></div>
      <div className="bitacora-bg-layer bitacora-bg-layer--taller" style={{ backgroundImage: 'url(/static/img/bitacora/fondo-taller.png)' }}></div>
      <div className="bitacora-bg-overlay"></div>
      <div className="top-panel">
        <div className="page-title">
          <h2>Bitácora de Auditoría (CU20)</h2>
          <div className="page-subtitle">Admin Principal (Administrador)</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/perfil')} className="btn-primary">Mi Perfil</button>
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/asignar-privilegios')} className="btn-primary">Asignar Privilegios</button>
          )}
          <button onClick={cerrarSesion} className="btn-secondary">Cerrar Sesión</button>
        </div>
      </div>

      <AdminMenu />

      <div className="bitacora-stats">
        <div className="bitacora-stat-card">
          <div className="bitacora-stat-value">{estadisticas.total_eventos}</div>
          <div className="bitacora-stat-label">Total de eventos</div>
        </div>
        <div className="bitacora-stat-card">
          <div className="bitacora-stat-value">{estadisticas.eventos_hoy}</div>
          <div className="bitacora-stat-label">Eventos de hoy</div>
        </div>
        <div className="bitacora-stat-card">
          <div className="bitacora-stat-value">{estadisticas.accion_mas_frecuente ? repairText(estadisticas.accion_mas_frecuente) : '—'}</div>
          <div className="bitacora-stat-label">
            Acción más frecuente{estadisticas.accion_mas_frecuente_total ? ` (${estadisticas.accion_mas_frecuente_total})` : ''}
          </div>
        </div>
        <div className="bitacora-stat-card">
          <div className="bitacora-stat-value">{estadisticas.usuario_mas_activo ? repairText(estadisticas.usuario_mas_activo) : '—'}</div>
          <div className="bitacora-stat-label">
            Usuario más activo{estadisticas.usuario_mas_activo_total ? ` (${estadisticas.usuario_mas_activo_total})` : ''}
          </div>
        </div>
      </div>

      <div className="bitacora-panel" style={{ marginTop: '20px' }}>
        {error && <div className="error-box">{error}</div>}
        <div className="bitacora-toolbar">
          <input type="date" className="bitacora-input" value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} />
          <input type="date" className="bitacora-input" value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} />
          <input placeholder="ID usuario" className="bitacora-input bitacora-input--usuario" value={filtros.usuario} onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })} />
          <input placeholder="Acción" className="bitacora-input bitacora-input--accion" value={filtros.accion} onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })} />
          <button onClick={() => cargarBitacora(filtros, 1)} className="bitacora-btn bitacora-btn--filter">Filtrar</button>
          <button onClick={() => { const limpio = { fecha_desde: '', fecha_hasta: '', usuario: '', accion: '' }; setFiltros(limpio); cargarBitacora(limpio, 1); }} className="bitacora-btn bitacora-btn--clear">Limpiar</button>
          <button onClick={exportarCsv} className="bitacora-btn bitacora-btn--export">Exportar CSV</button>
        </div>
        <div className="bitacora-table-wrap">
          <table className="bitacora-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Descripción Detallada</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No hay registros en la bitácora aún.</td></tr>
              ) : (
                registros.map((reg) => {
                  const descripcion = repairText(reg.descripcion);
                  const esLarga = descripcion.length > TRUNCAR_DESCRIPCION;
                  const expandida = expandedId === reg.codigo;
                  return (
                    <React.Fragment key={reg.codigo}>
                      <tr
                        className={esLarga ? 'bitacora-row bitacora-row--clickable' : 'bitacora-row'}
                        onClick={esLarga ? () => setExpandedId(expandida ? null : reg.codigo) : undefined}
                      >
                        <td>{reg.codigo}</td>
                        <td>
                          {formatServerDateToLaPaz(reg.fecha_hora)}
                        </td>
                        <td className="bitacora-user">{repairText(reg.usuario_nombre)}</td>
                        <td>
                          <span className="bitacora-role-badge">
                            {repairText(reg.usuario_rol)}
                          </span>
                        </td>
                        <td>
                          <span className="bitacora-badge">
                            {repairText(reg.accion)}
                          </span>
                        </td>
                        <td>
                          {truncarDescripcion(descripcion)}
                          {esLarga && (
                            <span className="bitacora-expand-icon">{expandida ? '▾' : '▸'}</span>
                          )}
                        </td>
                      </tr>
                      {expandida && (
                        <tr className="bitacora-detail-row">
                          <td colSpan="6">{descripcion}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bitacora-pagination">
          <button
            className="bitacora-page-btn"
            disabled={pagina <= 1}
            onClick={() => cambiarPagina(pagina - 1)}
          >
            ‹ Anterior
          </button>
          <span className="bitacora-page-info">
            Página {pagina} de {totalPaginas} ({totalRegistros} registro{totalRegistros === 1 ? '' : 's'})
          </span>
          <button
            className="bitacora-page-btn"
            disabled={pagina >= totalPaginas}
            onClick={() => cambiarPagina(pagina + 1)}
          >
            Siguiente ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bitacora;