import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const NotasTrabajo = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [ordenes, setOrdenes] = useState([]);
  const [notas, setNotas] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    id_orden_trabajo: '',
    fecha_hora: '',
    contenido: '',
    tipo_nota: '',
  });
  const [notaEdicion, setNotaEdicion] = useState(null);
  const [editNota, setEditNota] = useState({
    id_orden_trabajo: '',
    fecha_hora: '',
    contenido: '',
    tipo_nota: '',
  });

  const SeleccionarOrdenTrabajoAsignada = (ordenId) => {
    setNuevo({ ...nuevo, id_orden_trabajo: Number(ordenId) });
  };

  const RedactaNota = (tipo, contenido) => {
    setNuevo({ ...nuevo, tipo_nota: tipo, contenido });
  };

  const SolicitaGuardarNota = async (e) => {
    await crearNota(e);
  };

  const RecibeConfirmacionVisual = (mensaje) => mensaje;

  const aFormatoDatetimeLocal = (valor) => {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
  };

  const abrirEdicionNota = (nota) => {
    setNotaEdicion(nota);
    setEditNota({
      id_orden_trabajo: nota.id_orden_trabajo || '',
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
      id_orden_trabajo: Number(editNota.id_orden_trabajo),
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
    () => [...ordenes].sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    [ordenes]
  );

  const notasOrdenadas = useMemo(
    () => [...notas].sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    [notas]
  );

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
    setError('');
    const res = await fetch(`${API}/notas-trabajo/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(nuevo),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));
    setNuevo({ id_orden_trabajo: '', fecha_hora: '', contenido: '', tipo_nota: '' });
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
          <h3 className="usuarios-panel-title">Registrar nota de trabajo</h3>
          <form onSubmit={crearNota}>
            <div className="input-group"><label>Orden de trabajo</label><select value={nuevo.id_orden_trabajo} onChange={(e) => setNuevo({ ...nuevo, id_orden_trabajo: Number(e.target.value) })} required><option value="">Seleccione</option>{ordenesOrdenadas.map((o) => (<option key={o.codigo} value={o.codigo}>{`#${o.codigo} - ${o.cliente_nombre || ''}`}</option>))}</select></div>
            <div className="input-group"><label>Fecha y hora</label><input type="datetime-local" value={nuevo.fecha_hora} onChange={(e) => setNuevo({ ...nuevo, fecha_hora: e.target.value })} required /></div>
            <div className="input-group"><label>Tipo de nota</label><input value={nuevo.tipo_nota} onChange={(e) => setNuevo({ ...nuevo, tipo_nota: e.target.value })} /></div>
            <div className="input-group"><label>Contenido</label><textarea value={nuevo.contenido} onChange={(e) => setNuevo({ ...nuevo, contenido: e.target.value })} rows="5" required /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '16px' }}>Crear nota</button>
          </form>
        </div>

        <div className="bitacora-panel notas-list-panel">
          <div className="notas-list-header">
            <h3 className="usuarios-panel-title">Listado de notas</h3>
          </div>
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
                {notasOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No hay notas registradas.</td>
                  </tr>
                ) : (
                  notasOrdenadas.map((n) => (
                    <tr key={n.codigo}>
                      <td>#{n.codigo}</td>
                      <td>{n.orden_numero || '-'}</td>
                      <td>{n.mecanico_nombre || '-'}</td>
                      <td>{n.tipo_nota || '-'}</td>
                      <td className="notas-contenido-cell">{n.contenido || '-'}</td>
                      <td>{n.fecha_hora || '-'}</td>
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
        </div>
      </div>

      {notaEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 className="usuarios-panel-title">Editar nota #{notaEdicion.codigo}</h3>
            <form onSubmit={guardarEdicionNota}>
              <div className="input-group"><label>Orden de trabajo</label><select value={editNota.id_orden_trabajo} onChange={(e) => setEditNota({ ...editNota, id_orden_trabajo: Number(e.target.value) })} required><option value="">Seleccione</option>{ordenesOrdenadas.map((o) => (<option key={o.codigo} value={o.codigo}>{`#${o.codigo} - ${o.cliente_nombre || ''}`}</option>))}</select></div>
              <div className="input-group"><label>Fecha y hora</label><input type="datetime-local" value={editNota.fecha_hora} onChange={(e) => setEditNota({ ...editNota, fecha_hora: e.target.value })} required /></div>
              <div className="input-group"><label>Tipo de nota</label><input value={editNota.tipo_nota} onChange={(e) => setEditNota({ ...editNota, tipo_nota: e.target.value })} /></div>
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