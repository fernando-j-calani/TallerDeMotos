import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';

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

  const normalizarRol = (rol = '') => rol.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const esMecanico = (usuario) => normalizarRol(usuario?.rol_nombre) === 'mecanico';
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
    if (!window.confirm(`¿Eliminar orden #${orden.codigo}?`)) return;
    setError('');
    const res = await fetch(`${API}/ordenes-trabajo/${orden.codigo}/`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo eliminar la orden.');
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
    const mano = Number(nuevo.costo_mano_obra || 0);
    const repuestos = Number(nuevo.costo_repuestos || 0);
    const total = Number((mano + repuestos).toFixed(2));
    if (Number(nuevo.total || 0) !== total) {
      setNuevo((prev) => ({ ...prev, total }));
    }
  }, [nuevo.costo_mano_obra, nuevo.costo_repuestos]);

  useEffect(() => {
    const mano = Number(editOrden.costo_mano_obra || 0);
    const repuestos = Number(editOrden.costo_repuestos || 0);
    const total = Number((mano + repuestos).toFixed(2));
    if (Number(editOrden.total || 0) !== total) {
      setEditOrden((prev) => ({ ...prev, total }));
    }
  }, [editOrden.costo_mano_obra, editOrden.costo_repuestos]);

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
      const mecanicos = lista.filter(esMecanico);
      setMecanicos(mecanicos.length ? mecanicos : lista);
    }
  };

  const obtenerMecanicoActual = (clienteId) => {
    const ordenActiva = ordenes.find((o) => Number(o.id_cliente) === Number(clienteId) && !['Finalizado', 'Rechazado'].includes(o.estado));
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
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Gestionar Órdenes de Trabajo (CU08)</h2>
        <div>
          <button onClick={() => navigate('/inicio')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Mi Perfil</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Registrar orden de trabajo</h3>
          <form onSubmit={crearOrden}>
            <div className="input-group"><label>Cotización</label><select value={nuevo.id_cotizacion} onChange={(e) => {
              const value = e.target.value;
              setNuevo({ ...nuevo, id_cotizacion: value ? Number(value) : '' });
            }}><option value="">Ninguna</option>{cotizaciones.map((c) => (<option key={c.codigo} value={c.codigo}>{`#${c.codigo} (${c.id_cliente_nombre})`}</option>))}</select></div>
            <div className="input-group"><label>Cliente</label><select value={nuevo.id_cliente} onChange={(e) => {
              const clienteId = e.target.value;
              const clienteNumero = clienteId ? Number(clienteId) : '';
              setNuevo({
                ...nuevo,
                id_cliente: clienteNumero,
                id_mecanico: clienteId ? obtenerMecanicoActual(clienteId) : '',
              });
            }} required><option value="">Seleccione</option>{clientes.map((c) => (<option key={c.codigo} value={c.codigo}>{c.nombre}</option>))}</select></div>
            <div className="input-group"><label>Motocicleta</label><select value={nuevo.id_motocicleta} onChange={(e) => {
              const value = e.target.value;
              setNuevo({ ...nuevo, id_motocicleta: value ? Number(value) : '' });
            }} required><option value="">Seleccione</option>{motocicletas.map((m) => (<option key={m.codigo} value={m.codigo}>{`${m.placa} - ${m.marca || ''} ${m.modelo || ''}`}</option>))}</select></div>
            <div className="input-group"><label>Mecánico</label><select value={nuevo.id_mecanico} onChange={(e) => {
              const value = e.target.value;
              setNuevo({ ...nuevo, id_mecanico: value ? Number(value) : '' });
            }}><option value="">Seleccione</option>{mecanicos.map((m) => (<option key={m.codigo} value={m.codigo}>{m.nombre}</option>))}</select></div>
            <div className="input-group"><label>Fecha creación</label><input type="date" value={nuevo.fecha_creacion} onChange={(e) => setNuevo({ ...nuevo, fecha_creacion: e.target.value })} required /></div>
            <div className="input-group"><label>Fecha inicio</label><input type="date" value={nuevo.fecha_inicio} onChange={(e) => setNuevo({ ...nuevo, fecha_inicio: e.target.value })} /></div>
            <div className="input-group"><label>Fecha fin</label><input type="date" value={nuevo.fecha_fin} onChange={(e) => setNuevo({ ...nuevo, fecha_fin: e.target.value })} /></div>
            <div className="input-group"><label>Kilometraje ingreso</label><input type="number" value={nuevo.kilometraje_ingreso} onChange={(e) => setNuevo({ ...nuevo, kilometraje_ingreso: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Prioridad</label><select value={nuevo.prioridad} onChange={(e) => setNuevo({ ...nuevo, prioridad: e.target.value })}><option value="Normal">Normal</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option></select></div>
            <div className="input-group"><label>Costo mano de obra</label><input type="number" step="0.01" value={nuevo.costo_mano_obra} onChange={(e) => setNuevo({ ...nuevo, costo_mano_obra: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Costo repuestos</label><input type="number" step="0.01" value={nuevo.costo_repuestos} onChange={(e) => setNuevo({ ...nuevo, costo_repuestos: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Total</label><input type="number" step="0.01" value={nuevo.total} readOnly /></div>
            <div className="input-group"><label>Estado</label><select value={nuevo.estado} onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value })}><option value="Pendiente">Pendiente</option><option value="Aprobado">Aprobado</option><option value="Rechazado">Rechazado</option></select></div>
            <button type="submit" className="btn-login">Crear orden</button>
          </form>
        </div>

        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Listado de órdenes</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar orden por cliente, moto o estado"
              style={{ flex: '1', minWidth: '220px', padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#111', color: 'white' }}
            />
            <button
              type="button"
              onClick={BuscarOrdenes}
              style={{ padding: '10px 16px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => cargarOrdenes('')}
              style={{ padding: '10px 16px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Mostrar todo
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Orden</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Motocicleta</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Mecánico</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha creación</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha inicio</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha fin</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Kilometraje</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Prioridad</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Costo mano de obra</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Costo repuestos</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Total</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesOrdenadas.map((o) => (
                <tr key={o.codigo} style={{ borderBottom: '1px solid #2c2c2c' }}>
                  <td style={{ padding: '8px' }}>#{o.codigo}</td>
                  <td style={{ padding: '8px' }}>{o.cliente_nombre || '-'}</td>
                  <td style={{ padding: '8px' }}>{o.motocicleta_placa || '-'}</td>
                  <td style={{ padding: '8px' }}>{o.mecanico_nombre || '-'}</td>
                  <td style={{ padding: '8px' }}>{o.fecha_creacion || '-'}</td>
                  <td style={{ padding: '8px' }}>{o.fecha_inicio || '-'}</td>
                  <td style={{ padding: '8px' }}>{o.fecha_fin || '-'}</td>
                  <td style={{ padding: '8px' }}>{o.kilometraje_ingreso || 0}</td>
                  <td style={{ padding: '8px' }}>{o.prioridad || '-'}</td>
                  <td style={{ padding: '8px' }}>${o.costo_mano_obra || 0}</td>
                  <td style={{ padding: '8px' }}>${o.costo_repuestos || 0}</td>
                  <td style={{ padding: '8px' }}>{o.estado || '-'}</td>
                  <td style={{ padding: '8px' }}>${o.total || 0}</td>
                  <td style={{ padding: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => abrirEdicionOrden(o)} style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => eliminarOrden(o)} style={{ backgroundColor: '#8f2d2d', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {ordenEdicion && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#ff6600' }}>Editar orden #{ordenEdicion.codigo}</h3>
            <form onSubmit={guardarEdicionOrden}>
              <div className="input-group"><label>Mecánico</label><select value={editOrden.id_mecanico} onChange={(e) => {
                const value = e.target.value;
                setEditOrden({ ...editOrden, id_mecanico: value ? Number(value) : '' });
              }}><option value="">Seleccione</option>{mecanicos.map((m) => (<option key={m.codigo} value={m.codigo}>{m.nombre}</option>))}</select></div>
              <div className="input-group"><label>Fecha inicio</label><input type="date" value={editOrden.fecha_inicio} onChange={(e) => setEditOrden({ ...editOrden, fecha_inicio: e.target.value })} /></div>
              <div className="input-group"><label>Fecha fin</label><input type="date" value={editOrden.fecha_fin} onChange={(e) => setEditOrden({ ...editOrden, fecha_fin: e.target.value })} /></div>
              <div className="input-group"><label>Estado</label><select value={editOrden.estado} onChange={(e) => setEditOrden({ ...editOrden, estado: e.target.value })}><option value="Pendiente">Pendiente</option><option value="Aprobado">Aprobado</option><option value="Rechazado">Rechazado</option><option value="Finalizado">Finalizado</option></select></div>
              <div className="input-group"><label>Prioridad</label><select value={editOrden.prioridad} onChange={(e) => setEditOrden({ ...editOrden, prioridad: e.target.value })}><option value="Normal">Normal</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option></select></div>
              <div className="input-group"><label>Costo mano de obra</label><input type="number" step="0.01" value={editOrden.costo_mano_obra} onChange={(e) => setEditOrden({ ...editOrden, costo_mano_obra: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Costo repuestos</label><input type="number" step="0.01" value={editOrden.costo_repuestos} onChange={(e) => setEditOrden({ ...editOrden, costo_repuestos: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Total</label><input type="number" step="0.01" value={editOrden.total} readOnly /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setOrdenEdicion(null)} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesTrabajo;