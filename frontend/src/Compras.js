import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Compras = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [detalleSeleccion, setDetalleSeleccion] = useState(null);
  const [form, setForm] = useState({
    id_proveedor: '',
    numero_factura: '',
    fecha: '',
    metodo_pago: '',
  });
  const [detalles, setDetalles] = useState([]);

  const proveedoresPorId = useMemo(
    () => new Map(proveedores.map((p) => [p.codigo, p])),
    [proveedores]
  );
  const productosPorId = useMemo(
    () => new Map(productos.map((p) => [p.codigo, p])),
    [productos]
  );

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  const hoyIso = () => new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!usuarioLocal || usuarioLocal.rol !== 'Administrador') {
      alert('Acceso denegado para gestion de compras.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }
    cargarDatos();
  }, [navigate, usuarioLocal]);

  const cargarDatos = async () => {
    try {
      setError('');
      setCargando(true);
      await Promise.all([cargarCompras(), cargarProveedores(), cargarProductos()]);
    } catch {
      setError('Error de conexion cargando datos.');
    } finally {
      setCargando(false);
    }
  };

  const cargarCompras = async () => {
    const res = await fetch(`${API}/compras/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar compras.');
      setCompras([]);
      return;
    }
    setCompras(Array.isArray(data) ? data : []);
  };

  const cargarProveedores = async () => {
    const res = await fetch(`${API}/proveedores/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar proveedores.');
      setProveedores([]);
      return;
    }
    setProveedores(Array.isArray(data) ? data : []);
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
      id_proveedor: '',
      numero_factura: '',
      fecha: hoyIso(),
      metodo_pago: '',
    });
    setDetalles([]);
    setMostrarNuevo(true);
  };

  const agregarDetalle = () => {
    setDetalles((prev) => [...prev, { id_producto: '', cantidad: '', precio_compra: '' }]);
  };

  const quitarDetalle = (index) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarDetalle = (index, campo, valor) => {
    setDetalles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const calcularSubtotal = (detalle) => {
    const cantidad = parseInt(detalle.cantidad, 10);
    const precio = parseFloat(detalle.precio_compra);
    if (Number.isNaN(cantidad) || Number.isNaN(precio)) return 0;
    return Number((cantidad * precio).toFixed(2));
  };

  const subtotalCompra = detalles.reduce((acc, item) => acc + calcularSubtotal(item), 0);
  const impuestoCompra = Number((subtotalCompra * 0.13).toFixed(2));
  const totalCompra = Number((subtotalCompra + impuestoCompra).toFixed(2));

  const formatMoney = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value ?? '-';
    return num.toFixed(2);
  };

  const obtenerProveedor = (idProveedor) => {
    const proveedor = proveedoresPorId.get(Number(idProveedor));
    return proveedor ? proveedor.empresa : 'Proveedor no encontrado';
  };

  const obtenerProducto = (idProducto) => {
    const producto = productosPorId.get(Number(idProducto));
    return producto ? producto.nombre : 'Producto no encontrado';
  };

  const crearCompra = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.id_proveedor) return setError('Seleccione un proveedor.');
    if (!form.numero_factura) return setError('Ingrese numero de factura.');
    if (!form.fecha) return setError('Ingrese fecha de compra.');
    if (!form.metodo_pago) return setError('Ingrese metodo de pago.');
    if (detalles.length === 0) return setError('Agregue al menos un repuesto.');

    for (let i = 0; i < detalles.length; i += 1) {
      const detalle = detalles[i];
      if (!detalle.id_producto || !detalle.cantidad || !detalle.precio_compra) {
        return setError(`Complete el detalle ${i + 1}.`);
      }
    }

    const detallesPayload = detalles.map((detalle) => {
      const cantidad = parseInt(detalle.cantidad, 10);
      const precio = parseFloat(detalle.precio_compra);
      const subtotal = Number((cantidad * precio).toFixed(2));
      return {
        id_producto: Number(detalle.id_producto),
        cantidad,
        precio_compra: Number(precio.toFixed(2)),
        subtotal,
      };
    });

    const payload = {
      id_proveedor: Number(form.id_proveedor),
      numero_factura: form.numero_factura,
      fecha: form.fecha,
      subtotal: Number(subtotalCompra.toFixed(2)),
      impuesto: Number(impuestoCompra.toFixed(2)),
      total: Number(totalCompra.toFixed(2)),
      metodo_pago: form.metodo_pago,
      estado: 'Registrada',
      detalles: detallesPayload,
    };

    const res = await fetch(`${API}/compras/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data));

    setMostrarNuevo(false);
    await cargarCompras();
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Gestion de Compras (CU12)</h2>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Historial de Compras</h3>
        <button
          onClick={abrirNuevo}
          style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Nueva Compra
        </button>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Factura</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Proveedor</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((compra) => (
              <tr key={compra.codigo} style={{ borderBottom: '1px solid #2c2c2c' }}>
                <td style={{ padding: '8px' }}>{compra.numero_factura || '-'}</td>
                <td style={{ padding: '8px' }}>{obtenerProveedor(compra.id_proveedor)}</td>
                <td style={{ padding: '8px' }}>{compra.fecha || '-'}</td>
                <td style={{ padding: '8px' }}>{formatMoney(compra.total)}</td>
                <td style={{ padding: '8px' }}>
                  <button
                    onClick={() => setDetalleSeleccion(compra)}
                    style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && compras.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '12px', color: '#999' }}>Sin compras registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarNuevo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '720px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#ff6600' }}>Nueva Compra</h3>
            <form onSubmit={crearCompra}>
              <div className="input-group">
                <label>Proveedor</label>
                <select
                  value={form.id_proveedor}
                  onChange={(e) => setForm({ ...form, id_proveedor: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  required
                >
                  <option value="">Seleccione proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.codigo} value={p.codigo}>{p.empresa}</option>
                  ))}
                </select>
              </div>
              <div className="input-group"><label>Factura</label><input value={form.numero_factura} onChange={(e) => setForm({ ...form, numero_factura: e.target.value })} required /></div>
              <div className="input-group"><label>Fecha</label><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></div>
              <div className="input-group"><label>Metodo de Pago</label><input value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })} required /></div>

              <div style={{ marginTop: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Detalles</h4>
                <button
                  type="button"
                  onClick={agregarDetalle}
                  style={{ padding: '6px 10px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Agregar Repuesto
                </button>
              </div>

              {detalles.length === 0 && (
                <div style={{ color: '#999', marginBottom: '10px' }}>Agregue repuestos a la compra.</div>
              )}

              {detalles.map((detalle, index) => (
                <div key={`detalle-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.6fr 0.6fr 0.6fr auto', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <select
                    value={detalle.id_producto}
                    onChange={(e) => actualizarDetalle(index, 'id_producto', e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  >
                    <option value="">Seleccione producto</option>
                    {productos.map((p) => (
                      <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                    ))}
                  </select>
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
                    value={detalle.precio_compra}
                    onChange={(e) => actualizarDetalle(index, 'precio_compra', e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                  />
                  <input
                    type="text"
                    value={formatMoney(calcularSubtotal(detalle))}
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
                <div>Subtotal: {formatMoney(subtotalCompra)}</div>
                <div>Impuesto (13%): {formatMoney(impuestoCompra)}</div>
                <div>Total: {formatMoney(totalCompra)}</div>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '720px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#ff6600' }}>Detalles de Compra</h3>
            <div style={{ marginBottom: '12px' }}>
              <strong>Factura:</strong> {detalleSeleccion.numero_factura || '-'}<br />
              <strong>Proveedor:</strong> {obtenerProveedor(detalleSeleccion.id_proveedor)}<br />
              <strong>Fecha:</strong> {detalleSeleccion.fecha || '-'}<br />
              <strong>Total:</strong> {formatMoney(detalleSeleccion.total)}
            </div>
            <div style={{ backgroundColor: '#151515', padding: '12px', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #444' }}>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Producto</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Cantidad</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Precio</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalleSeleccion.detalles || []).map((detalle, index) => (
                    <tr key={`detalle-compra-${index}`} style={{ borderBottom: '1px solid #2c2c2c' }}>
                      <td style={{ padding: '6px' }}>{obtenerProducto(detalle.id_producto)}</td>
                      <td style={{ padding: '6px' }}>{detalle.cantidad}</td>
                      <td style={{ padding: '6px' }}>{formatMoney(detalle.precio_compra)}</td>
                      <td style={{ padding: '6px' }}>{formatMoney(detalle.subtotal)}</td>
                    </tr>
                  ))}
                  {(detalleSeleccion.detalles || []).length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '10px', color: '#999' }}>Sin detalles para esta compra.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setDetalleSeleccion(null)} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;
