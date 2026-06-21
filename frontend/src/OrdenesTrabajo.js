import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const OrdenesTrabajo = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [clientes, setClientes] = useState([]);
  const [motocicletas, setMotocicletas] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    id_cotizacion: '',
    id_cliente: '',
    id_motocicleta: '',
    id_mecanico: '',
    fecha_creacion: '',
    fecha_inicio: '',
    fecha_fin: '',
    kilometraje_ingreso: 0,
    estado: 'Pendiente',
    prioridad: 'Normal',
    costo_mano_obra: 0,
    costo_repuestos: 0,
    total: 0,
  });
  const [busqueda, setBusqueda] = useState('');
  const [ordenEdicion, setOrdenEdicion] = useState(null);
  const [editOrden, setEditOrden] = useState({
    id_mecanico: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'Pendiente',
    prioridad: 'Normal',
    costo_mano_obra: 0,
    costo_repuestos: 0,
    total: 0,
  });

  const esMecanico = (usuario) => {
    const rol = (usuario?.rol_nombre || '').toLowerCase();
    return rol.includes('mec') && rol.includes('nico');
  };
  const fechaBoliviaHoy = () => {
    // Date.now() ya es UTC real, independiente del huso horario del equipo del usuario.
    const bolivia = new Date(Date.now() - 4 * 60 * 60000);
    return bolivia.toISOString().slice(0, 10);
  };
  const sumarItemsPorTipo = (cotizacion, tipoBuscado) =>
    (cotizacion?.detalles || [])
      .filter((d) => (d.tipo || '').trim().toLowerCase() === tipoBuscado)
      .reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
  const toNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
  };
  const toIdOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };
  const toDateOrNull = (value) => (value ? value : null);

  const parseResponse = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return { data: await res.json(), isJson: true };
    }
    return { data: await res.text(), isJson: false };
  };

  const IniciaOrden = () => {
    setNuevo({ id_cotizacion: '', id_cliente: '', id_motocicleta: '', id_mecanico: '', fecha_creacion: '', fecha_inicio: '', fecha_fin: '', kilometraje_ingreso: 0, estado: 'Pendiente', prioridad: 'Normal', costo_mano_obra: 0, costo_repuestos: 0, total: 0 });
  };

  const AsignarMecanicoYPrioridad = (mecanicoId, prioridad) => {
    setNuevo({ ...nuevo, id_mecanico: Number(mecanicoId), prioridad });
  };

  const ActualizarEstados = (estado) => {
    setNuevo({ ...nuevo, estado });
  };

  const ActualizarRepuestosUtilizados = (repuestos) => {
    setError('');
  };

  const RecibeAlertaParaFacturacion = (mensaje) => mensaje;

  const BuscarOrdenes = async () => {
    setError('');
    await cargarOrdenes(busqueda);
  };

  const abrirEdicionOrden = (orden) => {
    setOrdenEdicion(orden);
    setEditOrden({
      id_mecanico: orden.id_mecanico || '',
      fecha_inicio: orden.fecha_inicio || '',
      fecha_fin: orden.fecha_fin || '',
      estado: orden.estado || 'Pendiente',
      prioridad: orden.prioridad || 'Normal',
      costo_mano_obra: orden.costo_mano_obra || 0,
      costo_repuestos: orden.costo_repuestos || 0,
      total: orden.total || 0,
    });
  };

  const guardarEdicionOrden = async (e) => {
    e.preventDefault();
    if (!ordenEdicion) return;
    setError('');
    const payload = {
      id_mecanico: toIdOrNull(editOrden.id_mecanico),
      fecha_inicio: toDateOrNull(editOrden.fecha_inicio),
      fecha_fin: toDateOrNull(editOrden.fecha_fin),
      estado: editOrden.estado,
      prioridad: editOrden.prioridad,
      costo_mano_obra: toNumber(editOrden.costo_mano_obra, 0),
      costo_repuestos: toNumber(editOrden.costo_repuestos, 0),
      total: toNumber(editOrden.total, 0),
    };
    try {
      const res = await fetch(`${API}/ordenes-trabajo/${ordenEdicion.codigo}/`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const { data, isJson } = await parseResponse(res);
      if (!res.ok) {
        if (isJson) {
          setError(data.error || JSON.stringify(data.errores || {}));
          console.log('OrdenTrabajo error response:', data);
        } else {
          setError('Error inesperado del servidor.');
          console.log('OrdenTrabajo error response:', data);
        }
        return;
      }
      setOrdenEdicion(null);
      await cargarOrdenes(busqueda);
    } catch (err) {
      console.log('OrdenTrabajo error response:', err);
      setError('Error de conexión actualizando la orden.');
    }
  };

  const eliminarOrden = async (orden) => {
    if (!window.confirm(`¿Cancelar orden #${orden.codigo}? Esto no borra el historial, solo la marca como Cancelada.`)) return;
    setError('');
    const res = await fetch(`${API}/ordenes-trabajo/${orden.codigo}/`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo cancelar la orden.');
    await cargarOrdenes(busqueda);
  };

  const ordenesOrdenadas = useMemo(
    () => [...ordenes].sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    [ordenes]
  );

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo(
        'CU08',
        ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para gestión de órdenes de trabajo.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarClientes();
      cargarMotocicletas();
      cargarCotizaciones();
      cargarUsuarios();
      cargarOrdenes();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  useEffect(() => {
    if (nuevo.id_cotizacion) return;
    const mano = Number(nuevo.costo_mano_obra || 0);
    const repuestos = Number(nuevo.costo_repuestos || 0);
    const total = Number((mano + repuestos).toFixed(2));
    if (Number(nuevo.total || 0) !== total) {
      setNuevo((prev) => ({ ...prev, total }));
    }
  }, [nuevo.costo_mano_obra, nuevo.costo_repuestos, nuevo.id_cotizacion]);

  useEffect(() => {
    const mano = Number(editOrden.costo_mano_obra || 0);
    const repuestos = Number(editOrden.costo_repuestos || 0);
    const total = Number((mano + repuestos).toFixed(2));
    if (Number(editOrden.total || 0) !== total) {
      setEditOrden((prev) => ({ ...prev, total }));
    }
  }, [editOrden.costo_mano_obra, editOrden.costo_repuestos]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        cargarClientes();
        cargarMotocicletas();
        cargarCotizaciones();
        cargarUsuarios();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const cargarClientes = async () => {
    const res = await fetch(`${API}/clientes/`, { headers: headers(false) });
    const data = await res.json();
    if (res.ok) setClientes(Array.isArray(data) ? data : []);
  };

  const cargarMotocicletas = async () => {
    const res = await fetch(`${API}/motocicletas/`, { headers: headers(false) });
    const data = await res.json();
    if (res.ok) setMotocicletas(Array.isArray(data) ? data : []);
  };

  const cargarCotizaciones = async () => {
    const res = await fetch(`${API}/cotizaciones/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setCotizaciones(Array.isArray(data) ? data : []);
  };

  const cargarUsuarios = async () => {
    const res = await fetch(`${API}/usuarios/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) {
      const lista = Array.isArray(data) ? data : [];
      setMecanicos(lista.filter(esMecanico));
    }
  };

  const obtenerMecanicoActual = (clienteId) => {
    const ordenActiva = ordenes.find((o) => Number(o.id_cliente) === Number(clienteId) && !['Finalizado', 'Facturado', 'Cancelado'].includes(o.estado));
    return ordenActiva ? ordenActiva.id_mecanico || ordenActiva.id_mecanico : '';
  };

  const cargarOrdenes = async (query = '') => {
    try {
      setError('');
      const url = new URL(`${API}/ordenes-trabajo/`);
      if (query) url.searchParams.set('q', query);
      const res = await fetch(url.toString(), { headers: headers() });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar órdenes.');
      setOrdenes(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando órdenes de trabajo.');
    }
  };

  const crearOrden = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      id_cotizacion: toIdOrNull(nuevo.id_cotizacion),
      id_cliente: toIdOrNull(nuevo.id_cliente),
      id_motocicleta: toIdOrNull(nuevo.id_motocicleta),
      id_mecanico: toIdOrNull(nuevo.id_mecanico),
      fecha_creacion: toDateOrNull(nuevo.fecha_creacion),
      fecha_inicio: toDateOrNull(nuevo.fecha_inicio),
      fecha_fin: toDateOrNull(nuevo.fecha_fin),
      kilometraje_ingreso: toNumber(nuevo.kilometraje_ingreso, 0),
      estado: nuevo.estado,
      prioridad: nuevo.prioridad,
      costo_mano_obra: toNumber(nuevo.costo_mano_obra, 0),
      costo_repuestos: toNumber(nuevo.costo_repuestos, 0),
      total: toNumber(nuevo.total, 0),
    };
    try {
      const res = await fetch(`${API}/ordenes-trabajo/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const { data, isJson } = await parseResponse(res);
      if (!res.ok) {
        if (isJson) {
          setError(data.error || JSON.stringify(data.errores || {}));
          console.log('OrdenTrabajo error response:', data);
        } else {
          setError('Error inesperado del servidor.');
          console.log('OrdenTrabajo error response:', data);
        }
        return;
      }
      setNuevo({ id_cotizacion: '', id_cliente: '', id_motocicleta: '', id_mecanico: '', fecha_creacion: '', fecha_inicio: '', fecha_fin: '', kilometraje_ingreso: 0, estado: 'Pendiente', prioridad: 'Normal', costo_mano_obra: 0, costo_repuestos: 0, total: 0 });
      await cargarOrdenes();
    } catch (err) {
      console.log('OrdenTrabajo error response:', err);
      setError('Error de conexión creando la orden.');
    }
  };

  return (
    <div className="app-container ordenes-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/ordenes-trabajo/fondo-ordenes-trabajo-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/ordenes-trabajo/fondo-ordenes-trabajo-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestionar Órdenes de Trabajo (CU08)</h2>
          <div className="page-subtitle">Registro y seguimiento de órdenes de trabajo del taller</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="ordenes-content">
        <div className="bitacora-panel ordenes-form-panel">
          <h3 className="usuarios-panel-title">Registrar orden de trabajo</h3>
          <form onSubmit={crearOrden}>
            <div className="input-group"><label>Cotización</label><select value={nuevo.id_cotizacion} onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setNuevo({ ...nuevo, id_cotizacion: '', id_cliente: '', id_motocicleta: '', costo_mano_obra: 0, costo_repuestos: 0, total: 0 });
                return;
              }
              const cot = cotizaciones.find((c) => c.codigo === Number(value));
              const moto = motocicletas.find((m) => m.codigo === cot?.id_motocicleta);
              setNuevo({
                ...nuevo,
                id_cotizacion: Number(value),
                id_cliente: cot?.id_cliente || '',
                id_motocicleta: cot?.id_motocicleta || '',
                kilometraje_ingreso: moto ? Number(moto.kilometraje_actual || 0) : nuevo.kilometraje_ingreso,
                costo_mano_obra: sumarItemsPorTipo(cot, 'mano de obra'),
                costo_repuestos: sumarItemsPorTipo(cot, 'repuesto'),
                total: Number(cot?.total || 0),
              });
            }}>
              <option value="">Ninguna</option>
              {cotizaciones.filter((c) => (c.estado || '').toLowerCase() === 'aprobada').map((c) => (<option key={c.codigo} value={c.codigo}>{`#${c.codigo} (${c.id_cliente_nombre})`}</option>))}
            </select></div>
            <div className="input-group"><label>Cliente</label><select value={nuevo.id_cliente} disabled={!!nuevo.id_cotizacion} onChange={(e) => {
              const clienteId = e.target.value;
              const clienteNumero = clienteId ? Number(clienteId) : '';
              setNuevo({
                ...nuevo,
                id_cliente: clienteNumero,
                id_mecanico: clienteId ? obtenerMecanicoActual(clienteId) : '',
              });
            }} required><option value="">Seleccione</option>{clientes.map((c) => (<option key={c.codigo} value={c.codigo}>{c.nombre}</option>))}</select></div>
            <div className="input-group"><label>Motocicleta</label><select value={nuevo.id_motocicleta} disabled={!!nuevo.id_cotizacion} onChange={(e) => {
              const value = e.target.value;
              const moto = motocicletas.find((m) => m.codigo === Number(value));
              setNuevo({ ...nuevo, id_motocicleta: value ? Number(value) : '', kilometraje_ingreso: moto ? Number(moto.kilometraje_actual || 0) : nuevo.kilometraje_ingreso });
            }} required><option value="">Seleccione</option>{motocicletas.map((m) => (<option key={m.codigo} value={m.codigo}>{`${m.placa} - ${m.marca || ''} ${m.modelo || ''}`}</option>))}</select></div>
            <div className="input-group"><label>Mecánico</label><select value={nuevo.id_mecanico} onChange={(e) => {
              const value = e.target.value;
              setNuevo({ ...nuevo, id_mecanico: value ? Number(value) : '' });
            }}><option value="">Seleccione</option>{mecanicos.map((m) => (<option key={m.codigo} value={m.codigo}>{m.nombre}</option>))}</select></div>
            <div className="input-group"><label>Fecha creación</label><input type="date" value={fechaBoliviaHoy()} disabled /></div>
            <div className="input-group"><label>Fecha inicio</label><input type="date" value={nuevo.fecha_inicio} onChange={(e) => setNuevo({ ...nuevo, fecha_inicio: e.target.value })} required /></div>
            <div className="input-group"><label>Fecha fin</label><input type="date" value={nuevo.fecha_fin} onChange={(e) => setNuevo({ ...nuevo, fecha_fin: e.target.value })} /></div>
            <div className="input-group"><label>Kilometraje ingreso</label><input type="number" value={nuevo.kilometraje_ingreso} onChange={(e) => setNuevo({ ...nuevo, kilometraje_ingreso: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Prioridad</label><select value={nuevo.prioridad} onChange={(e) => setNuevo({ ...nuevo, prioridad: e.target.value })}><option value="Normal">Normal</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option></select></div>
            <div className="input-group"><label>Costo mano de obra</label><input type="number" step="0.01" value={nuevo.costo_mano_obra} disabled={!!nuevo.id_cotizacion} onChange={(e) => setNuevo({ ...nuevo, costo_mano_obra: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Costo repuestos</label><input type="number" step="0.01" value={nuevo.costo_repuestos} disabled={!!nuevo.id_cotizacion} onChange={(e) => setNuevo({ ...nuevo, costo_repuestos: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Total</label><input type="number" step="0.01" value={nuevo.total} readOnly /></div>
            <div className="input-group"><label>Estado</label><select value={nuevo.estado} onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value })}><option value="Pendiente">Pendiente</option><option value="Esperando Repuesto">Esperando Repuesto</option><option value="Finalizado">Finalizado</option><option value="Facturado">Facturado</option></select></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '16px' }}>Crear orden</button>
          </form>
        </div>

        <div className="bitacora-panel ordenes-list-panel">
          <div className="ordenes-list-header">
            <h3 className="usuarios-panel-title">Listado de órdenes</h3>
          </div>
          <div className="ordenes-search">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar orden por cliente, moto o estado"
              className="bitacora-input"
            />
            <button type="button" onClick={BuscarOrdenes} className="bitacora-btn bitacora-btn--filter">Buscar</button>
            <button type="button" onClick={() => cargarOrdenes('')} className="bitacora-btn bitacora-btn--clear">Mostrar todo</button>
          </div>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Motocicleta</th>
                  <th>Mecánico</th>
                  <th>Fecha creación</th>
                  <th>Fecha inicio</th>
                  <th>Fecha fin</th>
                  <th>Kilometraje</th>
                  <th>Prioridad</th>
                  <th>Costo mano de obra</th>
                  <th>Costo repuestos</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenesOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: 'center' }}>No hay órdenes registradas.</td>
                  </tr>
                ) : (
                  ordenesOrdenadas.map((o) => (
                    <tr key={o.codigo}>
                      <td>#{o.codigo}</td>
                      <td>{o.cliente_nombre || '-'}</td>
                      <td>{o.motocicleta_placa || '-'}</td>
                      <td>{o.mecanico_nombre || '-'}</td>
                      <td>{o.fecha_creacion || '-'}</td>
                      <td>{o.fecha_inicio || '-'}</td>
                      <td>{o.fecha_fin || '-'}</td>
                      <td>{o.kilometraje_ingreso || 0}</td>
                      <td>{o.prioridad || '-'}</td>
                      <td>${o.costo_mano_obra || 0}</td>
                      <td>${o.costo_repuestos || 0}</td>
                      <td>{o.estado || '-'}</td>
                      <td>${o.total || 0}</td>
                      <td>
                        <button onClick={() => abrirEdicionOrden(o)} className="table-action-btn table-action-btn--edit">Editar</button>
                        {(o.estado || '').toLowerCase() !== 'cancelado' && (
                          <button onClick={() => eliminarOrden(o)} className="table-action-btn table-action-btn--danger">Cancelar</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {ordenEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 className="usuarios-panel-title">Editar orden #{ordenEdicion.codigo}</h3>
            <form onSubmit={guardarEdicionOrden}>
              <div className="input-group"><label>Mecánico</label><select value={editOrden.id_mecanico} onChange={(e) => {
                const value = e.target.value;
                setEditOrden({ ...editOrden, id_mecanico: value ? Number(value) : '' });
              }}><option value="">Seleccione</option>{mecanicos.map((m) => (<option key={m.codigo} value={m.codigo}>{m.nombre}</option>))}</select></div>
              <div className="input-group"><label>Fecha inicio</label><input type="date" value={editOrden.fecha_inicio} onChange={(e) => setEditOrden({ ...editOrden, fecha_inicio: e.target.value })} required /></div>
              <div className="input-group"><label>Fecha fin</label><input type="date" value={editOrden.fecha_fin} onChange={(e) => setEditOrden({ ...editOrden, fecha_fin: e.target.value })} /></div>
              <div className="input-group"><label>Estado</label><select value={editOrden.estado} onChange={(e) => setEditOrden({ ...editOrden, estado: e.target.value })}><option value="Pendiente">Pendiente</option><option value="Esperando Repuesto">Esperando Repuesto</option><option value="Finalizado">Finalizado</option><option value="Facturado">Facturado</option></select></div>
              <div className="input-group"><label>Prioridad</label><select value={editOrden.prioridad} onChange={(e) => setEditOrden({ ...editOrden, prioridad: e.target.value })}><option value="Normal">Normal</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option></select></div>
              <div className="input-group"><label>Costo mano de obra</label><input type="number" step="0.01" value={editOrden.costo_mano_obra} onChange={(e) => setEditOrden({ ...editOrden, costo_mano_obra: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Costo repuestos</label><input type="number" step="0.01" value={editOrden.costo_repuestos} onChange={(e) => setEditOrden({ ...editOrden, costo_repuestos: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Total</label><input type="number" step="0.01" value={editOrden.total} readOnly /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setOrdenEdicion(null)} className="bitacora-btn bitacora-btn--clear">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesTrabajo;