import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Cotizaciones = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [motos, setMotos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [detalleSeleccion, setDetalleSeleccion] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState({
    id_cliente: '',
    id_motocicleta: '',
    fecha_emision: '',
    dias_validez: '7',
  });
  const [detalles, setDetalles] = useState([]);

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  const hoyIso = () => new Date().toISOString().slice(0, 10);

  const sumarDias = (fechaIso, dias) => {
    if (!fechaIso) return '';
    const base = new Date(`${fechaIso}T00:00:00`);
    base.setDate(base.getDate() + dias);
    return base.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const rolesPermitidos = ['Administrador', 'Recepcionista'];
    if (!usuarioLocal || !rolesPermitidos.includes(usuarioLocal.rol)) {
      alert('Acceso denegado para gestion de cotizaciones.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }
    cargarDatos();
  }, [navigate, usuarioLocal]);

  const cargarDatos = async () => {
    try {
      setError('');
      setCargando(true);
      await Promise.all([
        cargarCotizaciones(),
        cargarClientes(),
        cargarMotocicletas(),
        cargarProductos(),
      ]);
    } catch {
      setError('Error de conexion cargando datos.');
    } finally {
      setCargando(false);
    }
  };

  const cargarCotizaciones = async () => {
    const res = await fetch(`${API}/cotizaciones/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar cotizaciones.');
      setCotizaciones([]);
      return;
    }
    setCotizaciones(Array.isArray(data) ? data : []);
  };

  const cargarClientes = async () => {
    const res = await fetch(`${API}/clientes/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar clientes.');
      setClientes([]);
      return;
    }
    setClientes(Array.isArray(data) ? data : []);
  };

  const cargarMotocicletas = async () => {
    const res = await fetch(`${API}/motocicletas/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar motocicletas.');
      setMotos([]);
      return;
    }
    setMotos(Array.isArray(data) ? data : []);
  };

  const cargarProductos = async () => {
    const res = await fetch(`${API}/productos/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar productos.');
      setProductos([]);
      return;
    }
    setProductos(Array.isArray(data) ? data : []);
  };

  const abrirNuevo = () => {
    setError('');
    setForm({
      id_cliente: '',
      id_motocicleta: '',
      fecha_emision: hoyIso(),
      dias_validez: '7',
    });
    setDetalles([]);
    setMostrarNuevo(true);
  };

  const agregarRepuesto = () => {
    setDetalles((prev) => [...prev, { tipo: 'Repuesto', producto_id: '', descripcion: '', cantidad: '', precio_unitario: '' }]);
  };

  const agregarManoObra = () => {
    setDetalles((prev) => [...prev, { tipo: 'Mano de obra', producto_id: '', descripcion: '', cantidad: '', precio_unitario: '' }]);
  };

  const quitarDetalle = (index) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarDetalle = (index, campo, valor) => {
    setDetalles((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  };

  const calcularSubtotalFila = (detalle) => {
    const cantidad = parseInt(detalle.cantidad, 10);
    const precio = parseFloat(detalle.precio_unitario);
    if (Number.isNaN(cantidad) || Number.isNaN(precio)) return 0;
    return Number((cantidad * precio).toFixed(2));
  };

  const round2 = (value) => Number((Number(value) || 0).toFixed(2));
  const subtotalGeneral = round2(detalles.reduce((acc, item) => acc + calcularSubtotalFila(item), 0));
  const impuestoGeneral = round2(subtotalGeneral * 0.13);
  const totalGeneral = round2(parseFloat(subtotalGeneral) + parseFloat(impuestoGeneral));

  const formatMoney = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value ?? '-';
    return num.toFixed(2);
  };

  const clientesPorId = useMemo(
    () => new Map(clientes.map((c) => [c.codigo, c])),
    [clientes]
  );
  const motosPorId = useMemo(
    () => new Map(motos.map((m) => [m.codigo, m])),
    [motos]
  );
  const productosPorId = useMemo(
    () => new Map(productos.map((p) => [p.codigo, p])),
    [productos]
  );

  const motosCliente = useMemo(() => {
    if (!form.id_cliente) return [];
    return motos.filter((m) => Number(m.id_cliente) === Number(form.id_cliente));
  }, [motos, form.id_cliente]);

  const obtenerCliente = (idCliente) => {
    const cliente = clientesPorId.get(Number(idCliente));
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  const cotizacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return cotizaciones;
    return cotizaciones.filter((c) => {
      const codigo = String(c.codigo ?? '').toLowerCase();
      const clienteNombre = obtenerCliente(c.id_cliente).toLowerCase();
      return codigo.includes(texto) || clienteNombre.includes(texto);
    });
  }, [busqueda, cotizaciones, clientesPorId]);

  const obtenerMoto = (idMoto) => {
    const moto = motosPorId.get(Number(idMoto));
    return moto ? moto.placa : 'Motocicleta no encontrada';
  };

  const obtenerProducto = (idProducto) => {
    const producto = productosPorId.get(Number(idProducto));
    return producto ? producto.nombre : 'Producto no encontrado';
  };

  const crearCotizacion = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.id_cliente) return setError('Seleccione un cliente.');
    if (!form.id_motocicleta) return setError('Seleccione una motocicleta.');
    if (!form.fecha_emision) return setError('Ingrese fecha de emision.');
    if (detalles.length === 0) return setError('Agregue al menos un detalle.');

    for (let i = 0; i < detalles.length; i += 1) {
      const detalle = detalles[i];
      if (!detalle.cantidad || !detalle.precio_unitario) {
        return setError(`Complete cantidad y precio en el detalle ${i + 1}.`);
      }
      if (detalle.tipo === 'Repuesto' && !detalle.producto_id) {
        return setError(`Seleccione un repuesto en el detalle ${i + 1}.`);
      }
      if (detalle.tipo === 'Mano de obra' && !detalle.descripcion) {
        return setError(`Ingrese descripcion en el detalle ${i + 1}.`);
      }
    }

    const fechaValidez = sumarDias(form.fecha_emision, Number(form.dias_validez || 0));

    const detallesPayload = detalles.map((detalle) => {
      const cantidad = parseInt(detalle.cantidad, 10);
      const precio = parseFloat(detalle.precio_unitario);
      const subtotal = round2(cantidad * precio);
      const descripcion = detalle.tipo === 'Repuesto'
        ? obtenerProducto(detalle.producto_id)
        : detalle.descripcion;

      return {
        tipo: detalle.tipo,
        descripcion,
        cantidad,
        precio_unitario: round2(precio),
        subtotal,
      };
    });

    const payload = {
      id_cliente: Number(form.id_cliente),
      id_motocicleta: Number(form.id_motocicleta),
      fecha_emision: form.fecha_emision,
      fecha_validez: fechaValidez,
      subtotal: subtotalGeneral,
      impuesto: impuestoGeneral,
      total: totalGeneral,
      estado: 'Pendiente',
      detalles: detallesPayload,
    };

    const res = await fetch(`${API}/cotizaciones/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data));

    setMostrarNuevo(false);
    await cargarCotizaciones();
  };

  const actualizarEstado = async (cotizacion, nuevoEstado) => {
    setError('');
    const res = await fetch(`${API}/cotizaciones/${cotizacion.codigo}/`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data));

    setCotizaciones((prev) => prev.map((item) => (
      item.codigo === cotizacion.codigo ? { ...item, estado: nuevoEstado } : item
    )));
    setDetalleSeleccion((prev) => (
      prev && prev.codigo === cotizacion.codigo ? { ...prev, estado: nuevoEstado } : prev
    ));
  };

  const imprimirPdf = () => {
    window.print();
  };

  const detalleSubtotal = detalleSeleccion ? round2(detalleSeleccion.subtotal ?? 0) : 0;
  const detalleImpuesto = round2(detalleSubtotal * 0.13);
  const detalleTotal = round2(parseFloat(detalleSubtotal) + parseFloat(detalleImpuesto));

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <style>{`
        @media print {
          /* Ocultar absolutamente todo en la pagina */
          body * {
            visibility: hidden;
          }
          /* Hacer visible SOLO el area de impresion y sus elementos hijos */
          #area-impresion, #area-impresion * {
            visibility: visible;
            color: black !important;
          }
          /* Posicionar el recibo en la esquina superior izquierda de la hoja en blanco */
          #area-impresion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Forzar tabla blanca y sin fondos oscuros */
          #area-impresion table, #area-impresion th, #area-impresion td {
            background-color: transparent !important;
            border-color: black !important;
          }
          /* Eliminar margenes extra para que no genere una segunda pagina vacia */
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Gestion de Cotizaciones (CU07)</h2>
        <div>
          <button
            onClick={() => navigate('/perfil')}
            style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Mi Perfil
          </button>
          <button
            onClick={() => navigate(getHomeRouteByRole(usuarioLocal?.rol))}
            style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Inicio
          </button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>Listado</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            placeholder="Buscar por cliente o codigo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: '8px 12px', width: '260px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
          />
          <button
            onClick={abrirNuevo}
            style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Nueva Cotizacion
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Codigo</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Fecha Emision</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizacionesFiltradas.map((c) => {
              const estadoActual = c.estado || 'Pendiente';
              const esPendiente = estadoActual === 'Pendiente';
              return (
                <tr key={c.codigo} style={{ borderBottom: '1px solid #2c2c2c' }}>
                  <td style={{ padding: '8px' }}>{c.codigo}</td>
                  <td style={{ padding: '8px' }}>{obtenerCliente(c.id_cliente)}</td>
                  <td style={{ padding: '8px' }}>{c.fecha_emision || '-'}</td>
                  <td style={{ padding: '8px' }}>{formatMoney(c.total)}</td>
                  <td style={{ padding: '8px' }}>{estadoActual}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setDetalleSeleccion(c)}
                        style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                      >
                        Ver Detalles
                      </button>
                      {esPendiente && (
                        <>
                          <button
                            onClick={() => actualizarEstado(c, 'Aprobada')}
                            style={{ backgroundColor: '#2f8f4e', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => actualizarEstado(c, 'Rechazada')}
                            style={{ backgroundColor: '#8f2d2d', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!cargando && cotizacionesFiltradas.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '12px', color: '#999' }}>
                  {busqueda ? 'Sin resultados para la busqueda.' : 'Sin cotizaciones registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarNuevo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '760px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#ff6600' }}>Nueva Cotizacion</h3>
            <form onSubmit={crearCotizacion}>
              <div className="input-group">
                <label>Cliente</label>
                <select
                  value={form.id_cliente}
                  onChange={(e) => setForm({ ...form, id_cliente: e.target.value, id_motocicleta: '' })}
                  style={{ width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  required
                >
                  <option value="">Seleccione cliente</option>
                  {clientes.map((c) => (
                    <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Motocicleta</label>
                <select
                  value={form.id_motocicleta}
                  onChange={(e) => setForm({ ...form, id_motocicleta: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  disabled={!form.id_cliente}
                  required
                >
                  <option value="">Seleccione motocicleta</option>
                  {motosCliente.map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.placa}</option>
                  ))}
                </select>
              </div>
              <div className="input-group"><label>Fecha Emision</label><input type="date" value={form.fecha_emision} onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} required /></div>
              <div className="input-group">
                <label>Fecha Validez</label>
                <select
                  value={form.dias_validez}
                  onChange={(e) => setForm({ ...form, dias_validez: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                >
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                </select>
                <div style={{ marginTop: '6px', color: '#ccc', fontSize: '12px' }}>
                  Vence el {sumarDias(form.fecha_emision, Number(form.dias_validez || 0)) || '-'}
                </div>
              </div>

              <div style={{ marginTop: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Detalles</h4>
                <div>
                  <button
                    type="button"
                    onClick={agregarRepuesto}
                    style={{ marginRight: '8px', padding: '6px 10px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Agregar Repuesto
                  </button>
                  <button
                    type="button"
                    onClick={agregarManoObra}
                    style={{ padding: '6px 10px', backgroundColor: '#5f8f2c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Agregar Mano de Obra
                  </button>
                </div>
              </div>

              {detalles.length === 0 && (
                <div style={{ color: '#999', marginBottom: '10px' }}>Agregue detalles a la cotizacion.</div>
              )}

              {detalles.map((detalle, index) => (
                <div key={`detalle-${index}`} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.8fr 0.6fr 0.6fr 0.6fr auto', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    value={detalle.tipo}
                    readOnly
                    style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#1b1b1b', color: '#ccc', border: '1px solid #333' }}
                  />
                  {detalle.tipo === 'Repuesto' ? (
                    <select
                      value={detalle.producto_id}
                      onChange={(e) => actualizarDetalle(index, 'producto_id', e.target.value)}
                      style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                    >
                      <option value="">Seleccione producto</option>
                      {productos.map((p) => (
                        <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Descripcion"
                      value={detalle.descripcion}
                      onChange={(e) => actualizarDetalle(index, 'descripcion', e.target.value)}
                      style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                    />
                  )}
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={detalle.cantidad}
                    onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    value={detalle.precio_unitario}
                    onChange={(e) => actualizarDetalle(index, 'precio_unitario', e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  />
                  <input
                    type="text"
                    value={formatMoney(calcularSubtotalFila(detalle))}
                    readOnly
                    style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#1b1b1b', color: '#ccc', border: '1px solid #333' }}
                  />
                  <button
                    type="button"
                    onClick={() => quitarDetalle(index)}
                    style={{ padding: '6px 10px', backgroundColor: '#8f2d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Quitar
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '10px', marginBottom: '10px' }}>
                <div>Subtotal: {formatMoney(subtotalGeneral)}</div>
                <div>Impuesto (13%): {formatMoney(impuestoGeneral)}</div>
                <div>Total: {formatMoney(totalGeneral)}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setMostrarNuevo(false)} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalleSeleccion && (
        <div className="print-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="print-area" style={{ width: '100%', maxWidth: '760px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <div id="area-impresion">
              <h3 style={{ marginTop: 0, color: '#ff6600' }}>Detalle de Cotizacion</h3>
              <div style={{ marginBottom: '12px' }}>
                <strong>Cliente:</strong> {obtenerCliente(detalleSeleccion.id_cliente)}<br />
                <strong>Motocicleta:</strong> {obtenerMoto(detalleSeleccion.id_motocicleta)}<br />
                <strong>Fecha Emision:</strong> {detalleSeleccion.fecha_emision || '-'}<br />
                <strong>Estado:</strong> {detalleSeleccion.estado || 'Pendiente'}
              </div>
              <div style={{ backgroundColor: '#151515', padding: '12px', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Tipo</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Descripcion</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Cantidad</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Precio</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detalleSeleccion.detalles || []).map((detalle, index) => (
                      <tr key={`detalle-cot-${index}`} style={{ borderBottom: '1px solid #2c2c2c' }}>
                        <td style={{ padding: '6px' }}>{detalle.tipo}</td>
                        <td style={{ padding: '6px' }}>{detalle.descripcion || '-'}</td>
                        <td style={{ padding: '6px' }}>{detalle.cantidad}</td>
                        <td style={{ padding: '6px' }}>{formatMoney(detalle.precio_unitario)}</td>
                        <td style={{ padding: '6px' }}>{formatMoney(detalle.subtotal)}</td>
                      </tr>
                    ))}
                    {(detalleSeleccion.detalles || []).length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '10px', color: '#999' }}>Sin detalles para esta cotizacion.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <div>
                  <div>Subtotal: {formatMoney(detalleSubtotal)}</div>
                  <div>Impuesto (13%): {formatMoney(detalleImpuesto)}</div>
                  <div>Total: {formatMoney(detalleTotal)}</div>
                </div>
              </div>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={imprimirPdf} style={{ padding: '8px 12px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Imprimir PDF</button>
              <button type="button" onClick={() => setDetalleSeleccion(null)} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;
