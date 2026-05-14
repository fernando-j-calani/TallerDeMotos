import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Cotizaciones = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [clientes, setClientes] = useState([]);
  const [motocicletas, setMotocicletas] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    id_cliente: '',
    id_motocicleta: '',
    fecha_emision: '',
    fecha_validez: '',
    subtotal: 0,
    impuesto: 0,
    total: 0,
    estado: 'Pendiente',
    detalles: [{ tipo: '', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }],
  });
  const [busqueda, setBusqueda] = useState('');
  const [cotizacionEdicion, setCotizacionEdicion] = useState(null);
  const [editCotizacion, setEditCotizacion] = useState({
    id_cliente: '',
    id_motocicleta: '',
    fecha_emision: '',
    fecha_validez: '',
    impuesto: 0,
    estado: 'Pendiente',
  });

  const cotizacionesOrdenadas = useMemo(
    () => [...cotizaciones].sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    [cotizaciones]
  );

  const IniciarNuevaCotizacion = () => {
    setNuevo({
      id_cliente: '',
      id_motocicleta: '',
      fecha_emision: '',
      fecha_validez: '',
      subtotal: 0,
      impuesto: 0,
      total: 0,
      estado: 'Pendiente',
      detalles: [{ tipo: '', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }],
    });
  };

  const SeleccionaCliente = (clienteId) => {
    setNuevo({ ...nuevo, id_cliente: Number(clienteId) });
  };

  const AgregaItemsACotizacion = () => {
    agregarLinea();
  };

  const GuardaLaCotizacion = async (e) => {
    await crearCotizacion(e);
  };

  const SolicitaModificacion = () => {
    setError('');
  };

  const Elimina = (index) => {
    eliminarLinea(index);
  };

  const SeleccionaBuscar = () => {
    cargarCotizaciones();
  };

  const RecibeConfirmacion = (respuesta) => {
    return respuesta;
  };

  const GenerarOT = async (cotizacionId) => {
    await aceptarCotizacion(cotizacionId);
  };

  const BuscarCotizaciones = async () => {
    setError('');
    await cargarCotizaciones(busqueda);
  };

  const abrirEdicionCotizacion = (cotizacion) => {
    setCotizacionEdicion(cotizacion);
    setEditCotizacion({
      id_cliente: cotizacion.id_cliente || '',
      id_motocicleta: cotizacion.id_motocicleta || '',
      fecha_emision: cotizacion.fecha_emision || '',
      fecha_validez: cotizacion.fecha_validez || '',
      impuesto: cotizacion.impuesto || 0,
      estado: cotizacion.estado || 'Pendiente',
    });
  };

  const guardarEdicionCotizacion = async (e) => {
    e.preventDefault();
    if (!cotizacionEdicion) return;
    setError('');
    const payload = {
      id_cliente: Number(editCotizacion.id_cliente),
      id_motocicleta: Number(editCotizacion.id_motocicleta),
      fecha_emision: editCotizacion.fecha_emision,
      fecha_validez: editCotizacion.fecha_validez,
      impuesto: Number(editCotizacion.impuesto || 0),
      estado: editCotizacion.estado,
    };

    try {
      const res = await fetch(`${API}/cotizaciones/${cotizacionEdicion.codigo}/`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const errores = data && data.errores ? JSON.stringify(data.errores) : '';
        const mensaje = (data && data.error) || errores || 'No se pudo actualizar la cotización.';
        setError(mensaje);
        return;
      }
      setCotizacionEdicion(null);
      if (data && data.cotizacion) {
        setCotizaciones((prev) => prev.map((c) => (c.codigo === data.cotizacion.codigo ? data.cotizacion : c)));
      } else {
        await cargarCotizaciones(busqueda);
      }
    } catch (err) {
      console.error('Error guardando cotización:', err);
      setError('Error de conexión al guardar la cotización.');
    }
  };

  const eliminarCotizacion = async (cotizacion) => {
    if (!window.confirm(`¿Eliminar cotización #${cotizacion.codigo}?`)) return;
    setError('');
    const res = await fetch(`${API}/cotizaciones/${cotizacion.codigo}/`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo eliminar la cotización.');
    await cargarCotizaciones(busqueda);
  };

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!usuarioLocal || !['Administrador', 'Recepcionista'].includes(usuarioLocal.rol)) {
      alert('Acceso denegado para gestión de cotizaciones.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }

    cargarClientes();
    cargarMotocicletas();
    cargarCotizaciones();
  }, [navigate, usuarioLocal]);

  const cargarClientes = async () => {
    const res = await fetch(`${API}/clientes/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setClientes(Array.isArray(data) ? data : []);
  };

  const cargarMotocicletas = async () => {
    const res = await fetch(`${API}/motocicletas/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setMotocicletas(Array.isArray(data) ? data : []);
  };

  const cargarCotizaciones = async (query = '') => {
    try {
      setError('');
      const url = new URL(`${API}/cotizaciones/`);
      if (query) url.searchParams.set('q', query);
      const res = await fetch(url.toString(), { headers: headers() });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar cotizaciones.');
      setCotizaciones(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando cotizaciones.');
    }
  };

  const actualizarDetalle = (index, field, value) => {
    const detalles = [...nuevo.detalles];
    detalles[index] = { ...detalles[index], [field]: value };
    detalles[index].subtotal = Number(detalles[index].cantidad || 0) * Number(detalles[index].precio_unitario || 0);
    setNuevo({ ...nuevo, detalles });
  };

  const agregarLinea = () => {
    setNuevo({ ...nuevo, detalles: [...nuevo.detalles, { tipo: '', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }] });
  };

  const eliminarLinea = (index) => {
    const detalles = nuevo.detalles.filter((_, i) => i !== index);
    setNuevo({ ...nuevo, detalles: detalles.length ? detalles : [{ tipo: '', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }] });
  };

  const calcularTotales = () => {
    const subtotal = nuevo.detalles.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const impuesto = Number(nuevo.impuesto || 0);
    const total = subtotal + impuesto;
    return { subtotal, total };
  };

  const crearCotizacion = async (e) => {
    e.preventDefault();
    setError('');
    const { subtotal, total } = calcularTotales();
    const payload = { ...nuevo, subtotal, total };

    try {
      const res = await fetch(`${API}/cotizaciones/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return setError(data.error || JSON.stringify(data.errores || {}) || 'No se pudo crear la cotización.');
      }
      setNuevo({ id_cliente: '', id_motocicleta: '', fecha_emision: '', fecha_validez: '', subtotal: 0, impuesto: 0, total: 0, estado: 'Pendiente', detalles: [{ tipo: '', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }] });
      await cargarCotizaciones();
    } catch (err) {
      console.error('Error creando cotización:', err);
      setError('Error de conexión al crear la cotización.');
    }
  };

  const aceptarCotizacion = async (cotizacionId) => {
    if (!window.confirm('¿Aceptar esta cotización y generar cliente/usuario si es necesario?')) return;
    const res = await fetch(`${API}/cotizaciones/${cotizacionId}/aceptar/`, { method: 'POST', headers: headers() });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo aceptar la cotización.');
    await cargarCotizaciones();
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Elaborar Cotizaciones (CU07)</h2>
        <div>
          <button onClick={() => navigate('/inicio')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Mi Perfil</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Registrar cotización</h3>
          <form onSubmit={crearCotizacion}>
            <div className="input-group"><label>Cliente</label><select value={nuevo.id_cliente} onChange={(e) => setNuevo({ ...nuevo, id_cliente: Number(e.target.value) })} required><option value="">Seleccione</option>{clientes.map((c) => (<option key={c.codigo} value={c.codigo}>{c.nombre}</option>))}</select></div>
            <div className="input-group"><label>Motocicleta</label><select value={nuevo.id_motocicleta} onChange={(e) => setNuevo({ ...nuevo, id_motocicleta: Number(e.target.value) })} required><option value="">Seleccione</option>{motocicletas.map((m) => (<option key={m.codigo} value={m.codigo}>{`${m.placa} - ${m.marca || ''} ${m.modelo || ''}`}</option>))}</select></div>
            <div className="input-group"><label>Fecha emisión</label><input type="date" value={nuevo.fecha_emision} onChange={(e) => setNuevo({ ...nuevo, fecha_emision: e.target.value })} required /></div>
            <div className="input-group"><label>Fecha validez</label><input type="date" value={nuevo.fecha_validez} onChange={(e) => setNuevo({ ...nuevo, fecha_validez: e.target.value })} required /></div>
            <div style={{ marginTop: '15px' }}>
              <h4>Items</h4>
              {nuevo.detalles.map((detalle, index) => (
                <div key={index} style={{ backgroundColor: '#121212', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div className="input-group"><label>Tipo</label><input value={detalle.tipo} onChange={(e) => actualizarDetalle(index, 'tipo', e.target.value)} /></div>
                  <div className="input-group"><label>Descripción</label><input value={detalle.descripcion} onChange={(e) => actualizarDetalle(index, 'descripcion', e.target.value)} /></div>
                  <div className="input-group"><label>Cantidad</label><input type="number" min="1" value={detalle.cantidad} onChange={(e) => actualizarDetalle(index, 'cantidad', Number(e.target.value))} /></div>
                  <div className="input-group"><label>Precio unitario</label><input type="number" step="0.01" value={detalle.precio_unitario} onChange={(e) => actualizarDetalle(index, 'precio_unitario', Number(e.target.value))} /></div>
                  <div className="input-group"><label>Subtotal</label><input type="number" step="0.01" value={detalle.subtotal} disabled /></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={() => eliminarLinea(index)} style={{ backgroundColor: '#8f2d2d', border: 'none', color: 'white', borderRadius: '5px', padding: '6px 10px', cursor: 'pointer' }}>Eliminar</button></div>
                </div>
              ))}
              <button type="button" onClick={agregarLinea} style={{ padding: '8px 12px', borderRadius: '5px', border: 'none', backgroundColor: '#2c5f8f', color: 'white', cursor: 'pointer' }}>Agregar item</button>
            </div>
            <div className="input-group"><label>Impuesto</label><input type="number" step="0.01" value={nuevo.impuesto} onChange={(e) => setNuevo({ ...nuevo, impuesto: Number(e.target.value) })} /></div>
            <div style={{ marginTop: '12px' }}>
              <strong>Subtotal:</strong> ${calcularTotales().subtotal} <br />
              <strong>Impuesto:</strong> ${Number(nuevo.impuesto || 0).toFixed(2)} <br />
              <strong>Total:</strong> ${calcularTotales().total} <br />
              <strong>Estado inicial:</strong> {nuevo.estado}
            </div>
            <button type="submit" className="btn-login" style={{ marginTop: '16px' }}>Crear cotización</button>
          </form>
        </div>

        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Listado de cotizaciones</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cotización por cliente o motocicleta"
              style={{ flex: '1', minWidth: '220px', padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#111', color: 'white' }}
            />
            <button
              type="button"
              onClick={BuscarCotizaciones}
              style={{ padding: '10px 16px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => cargarCotizaciones('')}
              style={{ padding: '10px 16px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Mostrar todo
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Motocicleta</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha emisión</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha validez</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Subtotal</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Impuesto</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Total</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizacionesOrdenadas.map((c) => (
                <tr key={c.codigo} style={{ borderBottom: '1px solid #2c2c2c' }}>
                  <td style={{ padding: '8px' }}>#{c.codigo}</td>
                  <td style={{ padding: '8px' }}>{c.id_cliente_nombre || '-'}</td>
                  <td style={{ padding: '8px' }}>{c.id_motocicleta_placa || '-'}</td>
                  <td style={{ padding: '8px' }}>{c.fecha_emision || '-'}</td>
                  <td style={{ padding: '8px' }}>{c.fecha_validez || '-'}</td>
                  <td style={{ padding: '8px' }}>${c.subtotal}</td>
                  <td style={{ padding: '8px' }}>${c.impuesto}</td>
                  <td style={{ padding: '8px' }}>${c.total}</td>
                  <td style={{ padding: '8px' }}>{c.estado || '-'}</td>
                  <td style={{ padding: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => aceptarCotizacion(c.codigo)} style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>Aceptar</button>
                    <button onClick={() => abrirEdicionCotizacion(c)} style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => eliminarCotizacion(c)} style={{ backgroundColor: '#8f2d2d', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {cotizacionEdicion && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#ff6600' }}>Editar cotización #{cotizacionEdicion.codigo}</h3>
            <form onSubmit={guardarEdicionCotizacion}>
              <div className="input-group"><label>Cliente</label><select value={editCotizacion.id_cliente} onChange={(e) => setEditCotizacion({ ...editCotizacion, id_cliente: Number(e.target.value) })} required><option value="">Seleccione</option>{clientes.map((c) => (<option key={c.codigo} value={c.codigo}>{c.nombre}</option>))}</select></div>
              <div className="input-group"><label>Motocicleta</label><select value={editCotizacion.id_motocicleta} onChange={(e) => setEditCotizacion({ ...editCotizacion, id_motocicleta: Number(e.target.value) })} required><option value="">Seleccione</option>{motocicletas.map((m) => (<option key={m.codigo} value={m.codigo}>{`${m.placa} - ${m.marca || ''} ${m.modelo || ''}`}</option>))}</select></div>
              <div className="input-group"><label>Fecha emisión</label><input type="date" value={editCotizacion.fecha_emision} onChange={(e) => setEditCotizacion({ ...editCotizacion, fecha_emision: e.target.value })} required /></div>
              <div className="input-group"><label>Fecha validez</label><input type="date" value={editCotizacion.fecha_validez} onChange={(e) => setEditCotizacion({ ...editCotizacion, fecha_validez: e.target.value })} required /></div>
              <div className="input-group"><label>Impuesto</label><input type="number" step="0.01" value={editCotizacion.impuesto} onChange={(e) => setEditCotizacion({ ...editCotizacion, impuesto: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Estado</label><select value={editCotizacion.estado} onChange={(e) => setEditCotizacion({ ...editCotizacion, estado: e.target.value })}><option value="Pendiente">Pendiente</option><option value="Aprobado">Aprobado</option><option value="Rechazado">Rechazado</option></select></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setCotizacionEdicion(null)} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;