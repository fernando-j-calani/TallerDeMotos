import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';

const API = `${API_BASE_URL}/api`;

const CATALOGO_SERVICIOS_MANO_OBRA = {
  'Mantenimientos Preventivos y Ajustes Rápidos': [
    { nombre: 'Mantenimiento General Básico', precio: 100 },
    { nombre: 'Limpieza y Calibración de Carburador', precio: 30 },
    { nombre: 'Cambio de Aceite de Motor', precio: 15 },
    { nombre: 'Cambio o Limpieza de Bujía', precio: 10 },
    { nombre: 'Mantenimiento de Sistema de Arrastre', precio: 30 },
  ],
  'Sistema de Frenos y Suspensión': [
    { nombre: 'Revisión y Cambio de Pastillas/Zapatas', precio: 15 },
    { nombre: 'Mantenimiento de Amortiguadores Delanteros', precio: 80 },
    { nombre: 'Cambio de Grasa/Rodamientos de Rueda', precio: 30 },
  ],
  'Mecánica Pesada y Motor': [
    { nombre: 'Reparación Completa de Motor', precio: 350 },
    { nombre: 'Cambio de Anillas', precio: 200 },
    { nombre: 'Cambio de Empaquetaduras de Motor', precio: 250 },
    { nombre: 'Cambio de Discos de Embrague', precio: 70 },
    { nombre: 'Asentado de Válvulas', precio: 80 },
  ],
  'Sistema Eléctrico': [
    { nombre: 'Revisión Eléctrica General', precio: 50 },
    { nombre: 'Instalación o Cambio de Ramal Eléctrico Completo', precio: 120 },
    { nombre: 'Cambio de Componentes', precio: 30 },
  ],
};

const CATEGORIAS_MANO_OBRA = [...Object.keys(CATALOGO_SERVICIOS_MANO_OBRA), 'Otros'];

const inferirCategoriaServicio = (nombreServicio) => {
  for (const [categoria, servicios] of Object.entries(CATALOGO_SERVICIOS_MANO_OBRA)) {
    if (servicios.some((s) => s.nombre === nombreServicio)) return categoria;
  }
  return 'Otros';
};

const detalleDesdeBackend = (detalle, productos) => {
  if (detalle.tipo === 'Repuesto') {
    if (detalle.id_producto) {
      return { ...detalle, categoria_servicio: '' };
    }
    const producto = productos.find((p) => (p.nombre || '').toLowerCase() === (detalle.descripcion || '').toLowerCase());
    return { ...detalle, id_producto: producto ? producto.codigo : null, categoria_servicio: '' };
  }
  if (detalle.tipo === 'Mano de Obra') {
    return { ...detalle, categoria_servicio: inferirCategoriaServicio(detalle.descripcion), id_producto: null };
  }
  return { ...detalle, id_producto: null, categoria_servicio: '' };
};

const detalleVacio = () => ({
  tipo: '',
  categoria_servicio: '',
  id_producto: null,
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  subtotal: 0,
});

const LineaDetalleCotizacion = ({ detalle, index, productos, onTipoChange, onCategoriaChange, onServicioChange, onProductoChange, onCampoChange, onEliminar }) => {
  const productoSeleccionado = productos.find((p) => p.codigo === detalle.id_producto);
  const stockDisponible = productoSeleccionado ? Number(productoSeleccionado.stock_actual || 0) : 0;
  const serviciosDisponibles = CATALOGO_SERVICIOS_MANO_OBRA[detalle.categoria_servicio] || [];

  return (
    <div className="cotizaciones-detalle-item">
      <div className="cotizaciones-detalle-grid">
        <div className="input-group">
          <label>Tipo</label>
          <select value={detalle.tipo} onChange={(e) => onTipoChange(index, e.target.value)}>
            <option value="">Seleccione</option>
            <option value="Repuesto">Repuesto</option>
            <option value="Mano de Obra">Mano de Obra</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        {detalle.tipo === 'Repuesto' && (
          <div className="input-group">
            <label>Descripción (Repuesto)</label>
            <select value={detalle.id_producto || ''} onChange={(e) => onProductoChange(index, e.target.value)}>
              <option value="">Seleccione un repuesto</option>
              {productos.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {`${p.nombre} (stock: ${p.stock_actual ?? 0})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {detalle.tipo === 'Mano de Obra' && (
          <div className="input-group">
            <label>Categoría de servicio</label>
            <select value={detalle.categoria_servicio} onChange={(e) => onCategoriaChange(index, e.target.value)}>
              <option value="">Seleccione una categoría</option>
              {CATEGORIAS_MANO_OBRA.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
        )}

        {detalle.tipo === 'Mano de Obra' && detalle.categoria_servicio && detalle.categoria_servicio !== 'Otros' && (
          <div className="input-group">
            <label>Servicio</label>
            <select
              value={detalle.descripcion}
              onChange={(e) => {
                const servicio = serviciosDisponibles.find((s) => s.nombre === e.target.value);
                onServicioChange(index, servicio ? servicio.nombre : '', servicio ? servicio.precio : 0);
              }}
            >
              <option value="">Seleccione un servicio</option>
              {serviciosDisponibles.map((s) => (<option key={s.nombre} value={s.nombre}>{`${s.nombre} - Bs. ${s.precio}`}</option>))}
            </select>
          </div>
        )}

        {detalle.tipo === 'Mano de Obra' && detalle.categoria_servicio === 'Otros' && (
          <div className="input-group">
            <label>Servicio</label>
            <input
              type="text"
              placeholder="Describe el servicio"
              value={detalle.descripcion}
              onChange={(e) => onCampoChange(index, 'descripcion', e.target.value)}
            />
          </div>
        )}

        {detalle.tipo === 'Otros' && (
          <div className="input-group">
            <label>Descripción</label>
            <input value={detalle.descripcion} onChange={(e) => onCampoChange(index, 'descripcion', e.target.value)} />
          </div>
        )}

        <div className="input-group">
          <label>Cantidad</label>
          {detalle.tipo === 'Repuesto' && detalle.id_producto ? (
            <>
              <input
                type="number"
                min="1"
                max={stockDisponible}
                list={`stock-datalist-${index}`}
                value={detalle.cantidad}
                onChange={(e) => {
                  const valor = Math.max(1, Math.min(Number(e.target.value) || 1, stockDisponible || 1));
                  onCampoChange(index, 'cantidad', valor);
                }}
              />
              <datalist id={`stock-datalist-${index}`}>
                {Array.from({ length: stockDisponible }, (_, i) => i + 1).map((n) => (<option key={n} value={n} />))}
              </datalist>
            </>
          ) : (
            <input
              type="number"
              min="1"
              value={detalle.cantidad}
              onChange={(e) => onCampoChange(index, 'cantidad', Number(e.target.value))}
            />
          )}
        </div>

        <div className="input-group">
          <label>Precio unitario</label>
          <input
            type="number"
            step="0.01"
            value={detalle.precio_unitario}
            disabled={detalle.tipo === 'Repuesto' || (detalle.tipo === 'Mano de Obra' && detalle.categoria_servicio !== 'Otros')}
            onChange={(e) => onCampoChange(index, 'precio_unitario', Number(e.target.value))}
          />
        </div>

        <div className="input-group">
          <label>Subtotal</label>
          <input type="number" step="0.01" value={detalle.subtotal} disabled />
        </div>
      </div>
      <div className="cotizaciones-detalle-actions">
        <button type="button" onClick={() => onEliminar(index)} className="table-action-btn table-action-btn--danger">Eliminar</button>
      </div>
    </div>
  );
};

const Cotizaciones = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [clientes, setClientes] = useState([]);
  const [motocicletas, setMotocicletas] = useState([]);
  const [productos, setProductos] = useState([]);
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
    detalles: [detalleVacio()],
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
    detalles: [detalleVacio()],
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
      detalles: [detalleVacio()],
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
    const detallesExistentes = Array.isArray(cotizacion.detalles) && cotizacion.detalles.length > 0
      ? cotizacion.detalles.map((d) => detalleDesdeBackend(d, productos))
      : [detalleVacio()];
    setEditCotizacion({
      id_cliente: cotizacion.id_cliente || '',
      id_motocicleta: cotizacion.id_motocicleta || '',
      fecha_emision: cotizacion.fecha_emision || '',
      fecha_validez: cotizacion.fecha_validez || '',
      impuesto: cotizacion.impuesto || 0,
      estado: cotizacion.estado || 'Pendiente',
      detalles: detallesExistentes,
    });
  };

  const calcularTotalesEdicion = () => {
    const subtotal = editCotizacion.detalles.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const impuesto = Number(editCotizacion.impuesto || 0);
    const total = subtotal + impuesto;
    return { subtotal, total };
  };

  const actualizarDetalleEdicion = (index, field, value) => {
    const detalles = [...editCotizacion.detalles];
    detalles[index] = { ...detalles[index], [field]: value };
    detalles[index].subtotal = Number(detalles[index].cantidad || 0) * Number(detalles[index].precio_unitario || 0);
    setEditCotizacion({ ...editCotizacion, detalles });
  };

  const agregarLineaEdicion = () => {
    setEditCotizacion({ ...editCotizacion, detalles: [...editCotizacion.detalles, detalleVacio()] });
  };

  const eliminarLineaEdicion = (index) => {
    const detalles = editCotizacion.detalles.filter((_, i) => i !== index);
    setEditCotizacion({ ...editCotizacion, detalles: detalles.length ? detalles : [detalleVacio()] });
  };

  const cambiarTipoDetalleEdicion = (index, nuevoTipo) => {
    const detalles = [...editCotizacion.detalles];
    detalles[index] = { ...detalleVacio(), tipo: nuevoTipo };
    setEditCotizacion({ ...editCotizacion, detalles });
  };

  const cambiarCategoriaServicioEdicion = (index, categoria) => {
    const detalles = [...editCotizacion.detalles];
    detalles[index] = { ...detalles[index], categoria_servicio: categoria, descripcion: '', precio_unitario: 0, subtotal: 0 };
    setEditCotizacion({ ...editCotizacion, detalles });
  };

  const seleccionarServicioEdicion = (index, nombreServicio, precio) => {
    const detalles = [...editCotizacion.detalles];
    const cantidad = Number(detalles[index].cantidad || 1);
    detalles[index] = { ...detalles[index], descripcion: nombreServicio, precio_unitario: precio, subtotal: cantidad * precio };
    setEditCotizacion({ ...editCotizacion, detalles });
  };

  const seleccionarProductoEdicion = (index, productoIdStr) => {
    const producto = productos.find((p) => p.codigo === Number(productoIdStr));
    const detalles = [...editCotizacion.detalles];
    const cantidad = 1;
    const precio = producto ? Number(producto.precio_venta || 0) : 0;
    detalles[index] = {
      ...detalles[index],
      id_producto: producto ? producto.codigo : null,
      descripcion: producto ? producto.nombre : '',
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
    };
    setEditCotizacion({ ...editCotizacion, detalles });
  };

  const guardarEdicionCotizacion = async (e) => {
    e.preventDefault();
    if (!cotizacionEdicion) return;
    setError('');
    const { subtotal, total } = calcularTotalesEdicion();
    const payload = {
      id_cliente: Number(editCotizacion.id_cliente),
      id_motocicleta: Number(editCotizacion.id_motocicleta),
      fecha_emision: editCotizacion.fecha_emision,
      fecha_validez: editCotizacion.fecha_validez,
      impuesto: Number(editCotizacion.impuesto || 0),
      estado: editCotizacion.estado,
      detalles: editCotizacion.detalles,
      subtotal,
      total,
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
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo(
        'CU07',
        ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para gestión de cotizaciones.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarClientes();
      cargarMotocicletas();
      cargarProductos();
      cargarCotizaciones();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        cargarClientes();
        cargarMotocicletas();
        cargarProductos();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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

  const cargarProductos = async () => {
    const res = await fetch(`${API}/productos/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setProductos(Array.isArray(data) ? data : []);
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
    setNuevo({ ...nuevo, detalles: [...nuevo.detalles, detalleVacio()] });
  };

  const eliminarLinea = (index) => {
    const detalles = nuevo.detalles.filter((_, i) => i !== index);
    setNuevo({ ...nuevo, detalles: detalles.length ? detalles : [detalleVacio()] });
  };

  const cambiarTipoDetalle = (index, nuevoTipo) => {
    const detalles = [...nuevo.detalles];
    detalles[index] = { ...detalleVacio(), tipo: nuevoTipo };
    setNuevo({ ...nuevo, detalles });
  };

  const cambiarCategoriaServicio = (index, categoria) => {
    const detalles = [...nuevo.detalles];
    detalles[index] = { ...detalles[index], categoria_servicio: categoria, descripcion: '', precio_unitario: 0, subtotal: 0 };
    setNuevo({ ...nuevo, detalles });
  };

  const seleccionarServicio = (index, nombreServicio, precio) => {
    const detalles = [...nuevo.detalles];
    const cantidad = Number(detalles[index].cantidad || 1);
    detalles[index] = { ...detalles[index], descripcion: nombreServicio, precio_unitario: precio, subtotal: cantidad * precio };
    setNuevo({ ...nuevo, detalles });
  };

  const seleccionarProducto = (index, productoIdStr) => {
    const producto = productos.find((p) => p.codigo === Number(productoIdStr));
    const detalles = [...nuevo.detalles];
    const cantidad = 1;
    const precio = producto ? Number(producto.precio_venta || 0) : 0;
    detalles[index] = {
      ...detalles[index],
      id_producto: producto ? producto.codigo : null,
      descripcion: producto ? producto.nombre : '',
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
    };
    setNuevo({ ...nuevo, detalles });
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
    <div className="app-container cotizaciones-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/cotizaciones/fondo-cotizaciones-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/cotizaciones/fondo-cotizaciones-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Elaborar Cotizaciones (CU07)</h2>
          <div className="page-subtitle">Registro y gestión de cotizaciones para clientes</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="cotizaciones-content">
        <div className="bitacora-panel cotizaciones-form-panel">
          <h3 className="usuarios-panel-title">Registrar cotización</h3>
          <form onSubmit={crearCotizacion}>
            <div className="input-group">
              <label>Cliente</label>
              <select value={nuevo.id_cliente} onChange={(e) => setNuevo({ ...nuevo, id_cliente: Number(e.target.value), id_motocicleta: '' })} required>
                <option value="">Seleccione</option>
                {clientes.map((c) => (<option key={c.codigo} value={c.codigo}>{c.nombre}</option>))}
              </select>
            </div>
            <div className="input-group">
              <label>Motocicleta</label>
              <select value={nuevo.id_motocicleta} onChange={(e) => setNuevo({ ...nuevo, id_motocicleta: Number(e.target.value) })} required disabled={!nuevo.id_cliente}>
                <option value="">{nuevo.id_cliente ? 'Seleccione' : 'Seleccione primero un cliente'}</option>
                {motocicletas.filter((m) => m.id_cliente === nuevo.id_cliente).map((m) => (<option key={m.codigo} value={m.codigo}>{`${m.placa} - ${m.marca || ''} ${m.modelo || ''}`}</option>))}
              </select>
            </div>
            <div className="input-group">
              <label>Fecha emisión</label>
              <input type="date" value={nuevo.fecha_emision} onChange={(e) => setNuevo({ ...nuevo, fecha_emision: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Fecha validez</label>
              <input type="date" value={nuevo.fecha_validez} onChange={(e) => setNuevo({ ...nuevo, fecha_validez: e.target.value })} required />
            </div>

            <div className="cotizaciones-items-header">
              <h4>Items</h4>
              <button type="button" onClick={agregarLinea} className="bitacora-btn bitacora-btn--export">Agregar item</button>
            </div>
            {nuevo.detalles.map((detalle, index) => (
              <LineaDetalleCotizacion
                key={index}
                detalle={detalle}
                index={index}
                productos={productos}
                onTipoChange={cambiarTipoDetalle}
                onCategoriaChange={cambiarCategoriaServicio}
                onServicioChange={seleccionarServicio}
                onProductoChange={seleccionarProducto}
                onCampoChange={actualizarDetalle}
                onEliminar={eliminarLinea}
              />
            ))}

            <div className="input-group">
              <label>Impuesto</label>
              <input type="number" step="0.01" value={nuevo.impuesto} onChange={(e) => setNuevo({ ...nuevo, impuesto: Number(e.target.value) })} />
            </div>

            <div className="cotizaciones-totales">
              <div><strong>Subtotal:</strong> ${calcularTotales().subtotal}</div>
              <div><strong>Impuesto:</strong> ${Number(nuevo.impuesto || 0).toFixed(2)}</div>
              <div><strong>Total:</strong> ${calcularTotales().total}</div>
              <div><strong>Estado inicial:</strong> {nuevo.estado}</div>
            </div>

            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '16px' }}>Crear cotización</button>
          </form>
        </div>

        <div className="bitacora-panel cotizaciones-list-panel">
          <div className="cotizaciones-list-header">
            <h3 className="usuarios-panel-title">Listado de cotizaciones</h3>
          </div>
          <div className="cotizaciones-search">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cotización por cliente o motocicleta"
              className="bitacora-input"
            />
            <button type="button" onClick={BuscarCotizaciones} className="bitacora-btn bitacora-btn--filter">Buscar</button>
            <button type="button" onClick={() => cargarCotizaciones('')} className="bitacora-btn bitacora-btn--clear">Mostrar todo</button>
          </div>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Motocicleta</th>
                  <th>Fecha emisión</th>
                  <th>Fecha validez</th>
                  <th>Subtotal</th>
                  <th>Impuesto</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizacionesOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center' }}>No hay cotizaciones registradas.</td>
                  </tr>
                ) : (
                  cotizacionesOrdenadas.map((c) => (
                    <tr key={c.codigo}>
                      <td>#{c.codigo}</td>
                      <td>{c.id_cliente_nombre || '-'}</td>
                      <td>{c.id_motocicleta_placa || '-'}</td>
                      <td>{c.fecha_emision || '-'}</td>
                      <td>{c.fecha_validez || '-'}</td>
                      <td>${c.subtotal}</td>
                      <td>${c.impuesto}</td>
                      <td>${c.total}</td>
                      <td>{c.estado || '-'}</td>
                      <td>
                        {(c.estado || '').trim().toLowerCase() !== 'aprobada' && (
                          <button onClick={() => aceptarCotizacion(c.codigo)} className="table-action-btn table-action-btn--success">Aceptar</button>
                        )}
                        <button onClick={() => abrirEdicionCotizacion(c)} className="table-action-btn table-action-btn--edit">Editar</button>
                        <button onClick={() => eliminarCotizacion(c)} className="table-action-btn table-action-btn--danger">Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {cotizacionEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--lg">
            <h3 className="usuarios-panel-title">Editar cotización #{cotizacionEdicion.codigo}</h3>
            <form onSubmit={guardarEdicionCotizacion}>
              <div className="input-group">
                <label>Cliente</label>
                <select value={editCotizacion.id_cliente} onChange={(e) => setEditCotizacion({ ...editCotizacion, id_cliente: Number(e.target.value), id_motocicleta: '' })} required>
                  <option value="">Seleccione</option>
                  {clientes.map((c) => (<option key={c.codigo} value={c.codigo}>{c.nombre}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Motocicleta</label>
                <select value={editCotizacion.id_motocicleta} onChange={(e) => setEditCotizacion({ ...editCotizacion, id_motocicleta: Number(e.target.value) })} required disabled={!editCotizacion.id_cliente}>
                  <option value="">{editCotizacion.id_cliente ? 'Seleccione' : 'Seleccione primero un cliente'}</option>
                  {motocicletas.filter((m) => m.id_cliente === editCotizacion.id_cliente).map((m) => (<option key={m.codigo} value={m.codigo}>{`${m.placa} - ${m.marca || ''} ${m.modelo || ''}`}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Fecha emisión</label>
                <input type="date" value={editCotizacion.fecha_emision} onChange={(e) => setEditCotizacion({ ...editCotizacion, fecha_emision: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Fecha validez</label>
                <input type="date" value={editCotizacion.fecha_validez} onChange={(e) => setEditCotizacion({ ...editCotizacion, fecha_validez: e.target.value })} required />
              </div>

              <div className="cotizaciones-items-header">
                <h4>Items</h4>
                <button type="button" onClick={agregarLineaEdicion} className="bitacora-btn bitacora-btn--export">Agregar item</button>
              </div>
              {editCotizacion.detalles.map((detalle, index) => (
                <LineaDetalleCotizacion
                  key={index}
                  detalle={detalle}
                  index={index}
                  productos={productos}
                  onTipoChange={cambiarTipoDetalleEdicion}
                  onCategoriaChange={cambiarCategoriaServicioEdicion}
                  onServicioChange={seleccionarServicioEdicion}
                  onProductoChange={seleccionarProductoEdicion}
                  onCampoChange={actualizarDetalleEdicion}
                  onEliminar={eliminarLineaEdicion}
                />
              ))}

              <div className="input-group">
                <label>Impuesto</label>
                <input type="number" step="0.01" value={editCotizacion.impuesto} onChange={(e) => setEditCotizacion({ ...editCotizacion, impuesto: Number(e.target.value) })} />
              </div>

              <div className="cotizaciones-totales">
                <div><strong>Subtotal:</strong> ${calcularTotalesEdicion().subtotal}</div>
                <div><strong>Impuesto:</strong> ${Number(editCotizacion.impuesto || 0).toFixed(2)}</div>
                <div><strong>Total:</strong> ${calcularTotalesEdicion().total}</div>
              </div>

              <div className="input-group">
                <label>Estado</label>
                <select value={editCotizacion.estado} onChange={(e) => setEditCotizacion({ ...editCotizacion, estado: e.target.value })}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setCotizacionEdicion(null)} className="bitacora-btn bitacora-btn--clear">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;