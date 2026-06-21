import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const fechaHoraBoliviaAhora = () => {
  // Date.now() ya es UTC real, independiente del huso horario del equipo del usuario.
  const bolivia = new Date(Date.now() - 4 * 60 * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${bolivia.getUTCFullYear()}-${pad(bolivia.getUTCMonth() + 1)}-${pad(bolivia.getUTCDate())}T${pad(bolivia.getUTCHours())}:${pad(bolivia.getUTCMinutes())}`;
};

const NotasTrabajo = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [ordenes, setOrdenes] = useState([]);
  const [notas, setNotas] = useState([]);
  const [error, setError] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [busquedaPlaca, setBusquedaPlaca] = useState('');
  const [nuevo, setNuevo] = useState({
    fecha_hora: fechaHoraBoliviaAhora(),
    contenido: '',
    tipo_nota: 'Diagnóstico',
  });
  const [notaEdicion, setNotaEdicion] = useState(null);
  const [editNota, setEditNota] = useState({
    fecha_hora: '',
    contenido: '',
    tipo_nota: '',
  });

  const formatearFechaHora = (valor) => {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '-';
    const bolivia = new Date(fecha.getTime() - 4 * 60 * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(bolivia.getUTCDate())}/${pad(bolivia.getUTCMonth() + 1)}/${bolivia.getUTCFullYear()} ${pad(bolivia.getUTCHours())}:${pad(bolivia.getUTCMinutes())}`;
  };

  const aFormatoDatetimeLocal = (valor) => {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    // Reexpresa el instante UTC como hora de Bolivia, sin depender del huso del navegador.
    const bolivia = new Date(fecha.getTime() - 4 * 60 * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${bolivia.getUTCFullYear()}-${pad(bolivia.getUTCMonth() + 1)}-${pad(bolivia.getUTCDate())}T${pad(bolivia.getUTCHours())}:${pad(bolivia.getUTCMinutes())}`;
  };

  const seleccionarOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setNuevo({ fecha_hora: fechaHoraBoliviaAhora(), contenido: '', tipo_nota: 'Diagnóstico' });
    setError('');
  };

  const abrirEdicionNota = (nota) => {
    setNotaEdicion(nota);
    setEditNota({
      fecha_hora: aFormatoDatetimeLocal(nota.fecha_hora),
      contenido: nota.contenido || '',
      tipo_nota: nota.tipo_nota || '',
    });
  };

  const guardarEdicionNota = async (e) => {
    e.preventDefault();
    if (!notaEdicion) return;
    setError('');
    const payload = {
      fecha_hora: editNota.fecha_hora,
      contenido: editNota.contenido,
      tipo_nota: editNota.tipo_nota,
    };
    const res = await fetch(`${API}/notas-trabajo/${notaEdicion.codigo}/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || JSON.stringify(data.errores || {}));
      return;
    }
    setNotaEdicion(null);
    await cargarNotas();
  };

  const eliminarNota = async (nota) => {
    if (!window.confirm(`¿Eliminar nota #${nota.codigo}?`)) return;
    setError('');
    const res = await fetch(`${API}/notas-trabajo/${nota.codigo}/`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo eliminar la nota.');
    await cargarNotas();
  };

  const ordenesOrdenadas = useMemo(
    () => [...ordenes]
      .filter((o) => (o.estado || '').toLowerCase() !== 'cancelado')
      .filter((o) => (o.motocicleta_placa || '').toLowerCase().includes(busquedaPlaca.trim().toLowerCase()))
      .sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    [ordenes, busquedaPlaca]
  );

  const notasDeOrdenSeleccionada = useMemo(() => {
    if (!ordenSeleccionada) return [];
    return [...notas]
      .filter((n) => Number(n.id_orden_trabajo) === Number(ordenSeleccionada.codigo))
      .sort((a, b) => Number(a.codigo) - Number(b.codigo));
  }, [notas, ordenSeleccionada]);

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo(
        'CU09',
        ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para notas de trabajo.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarOrdenes();
      cargarNotas();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        cargarOrdenes();
        cargarNotas();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const cargarOrdenes = async () => {
    const res = await fetch(`${API}/ordenes-trabajo/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setOrdenes(Array.isArray(data) ? data : []);
  };

  const cargarNotas = async () => {
    try {
      setError('');
      const res = await fetch(`${API}/notas-trabajo/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar notas.');
      setNotas(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando notas de trabajo.');
    }
  };

  const crearNota = async (e) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;
    setError('');
    const payload = { ...nuevo, id_orden_trabajo: ordenSeleccionada.codigo };
    const res = await fetch(`${API}/notas-trabajo/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));
    setNuevo({ fecha_hora: fechaHoraBoliviaAhora(), contenido: '', tipo_nota: 'Diagnóstico' });
    await cargarNotas();
  };

  return (
    <div className="app-container notas-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/notas-trabajo/fondo-notas-trabajo-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/notas-trabajo/fondo-notas-trabajo-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Notas de Trabajo (CU09)</h2>
          <div className="page-subtitle">Registro de seguimiento y observaciones sobre las órdenes de trabajo</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="notas-content">
        <div className="bitacora-panel notas-form-panel">
          <h3 className="usuarios-panel-title">Lista de Notas</h3>
          <div className="notas-search" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={busquedaPlaca}
              onChange={(e) => setBusquedaPlaca(e.target.value)}
              placeholder="Buscar por placa de la moto"
              className="bitacora-input"
            />
          </div>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Motocicleta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenesOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No hay órdenes de trabajo registradas.</td>
                  </tr>
                ) : (
                  ordenesOrdenadas.map((o) => (
                    <tr
                      key={o.codigo}
                      onClick={() => seleccionarOrden(o)}
                      style={{ cursor: 'pointer' }}
                      className={ordenSeleccionada?.codigo === o.codigo ? 'motos-row--inactiva' : ''}
                    >
                      <td>#{o.codigo}</td>
                      <td>{o.cliente_nombre || '-'}</td>
                      <td>{o.motocicleta_placa || '-'}</td>
                      <td>{o.estado || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bitacora-panel notas-list-panel">
          <div className="notas-list-header">
            <h3 className="usuarios-panel-title">Detalles {ordenSeleccionada ? `- Orden #${ordenSeleccionada.codigo}` : ''}</h3>
          </div>

          {!ordenSeleccionada ? (
            <p>Seleccione una orden de trabajo en el panel de la izquierda para ver sus notas.</p>
          ) : (
            <>
              <form onSubmit={crearNota} style={{ marginBottom: '20px' }}>
                <div className="input-group"><label>Fecha y hora</label><input type="datetime-local" value={nuevo.fecha_hora} onChange={(e) => setNuevo({ ...nuevo, fecha_hora: e.target.value })} required /></div>
                <div className="input-group">
                  <label>Tipo de nota</label>
                  <select value={nuevo.tipo_nota} onChange={(e) => setNuevo({ ...nuevo, tipo_nota: e.target.value })}>
                    <option value="Diagnóstico">Diagnóstico</option>
                    <option value="Avance">Avance</option>
                    <option value="Sistema">Sistema</option>
                  </select>
                </div>
                <div className="input-group"><label>Contenido</label><textarea value={nuevo.contenido} onChange={(e) => setNuevo({ ...nuevo, contenido: e.target.value })} rows="4" required /></div>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Crear nota</button>
              </form>

              <div className="bitacora-table-wrap">
                <table className="bitacora-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Orden</th>
                      <th>Mecánico</th>
                      <th>Tipo</th>
                      <th>Contenido</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasDeOrdenSeleccionada.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>No hay notas registradas para esta orden.</td>
                      </tr>
                    ) : (
                      notasDeOrdenSeleccionada.map((n) => (
                        <tr key={n.codigo}>
                          <td>#{n.codigo}</td>
                          <td>{n.orden_numero || '-'}</td>
                          <td>{n.mecanico_nombre || '-'}</td>
                          <td>{n.tipo_nota || '-'}</td>
                          <td className="notas-contenido-cell">{n.contenido || '-'}</td>
                          <td>{formatearFechaHora(n.fecha_hora)}</td>
                          <td>
                            <button onClick={() => abrirEdicionNota(n)} className="table-action-btn table-action-btn--edit">Editar</button>
                            <button onClick={() => eliminarNota(n)} className="table-action-btn table-action-btn--danger">Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {notaEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 className="usuarios-panel-title">Editar nota #{notaEdicion.codigo}</h3>
            <form onSubmit={guardarEdicionNota}>
              <div className="input-group"><label>Fecha y hora</label><input type="datetime-local" value={editNota.fecha_hora} onChange={(e) => setEditNota({ ...editNota, fecha_hora: e.target.value })} required /></div>
              <div className="input-group">
                <label>Tipo de nota</label>
                <select value={editNota.tipo_nota} onChange={(e) => setEditNota({ ...editNota, tipo_nota: e.target.value })}>
                  <option value="Diagnóstico">Diagnóstico</option>
                  <option value="Avance">Avance</option>
                  <option value="Sistema">Sistema</option>
                </select>
              </div>
              <div className="input-group"><label>Contenido</label><textarea value={editNota.contenido} onChange={(e) => setEditNota({ ...editNota, contenido: e.target.value })} rows="5" required /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setNotaEdicion(null)} className="bitacora-btn bitacora-btn--clear">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotasTrabajo;
