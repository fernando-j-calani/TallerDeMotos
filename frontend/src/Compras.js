import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;
const OTRO_PROVEEDOR = '__otro__';
const OTRO_PRODUCTO = '__otro_producto__';

// Si el backend usa Cloudinary, comprobante_pago ya viene como URL absoluta (https://...).
// Si usa almacenamiento local, viene como ruta ya resuelta (ej. /media/comprobantes_compra/x.png).
const urlComprobante = (valor) => (valor && valor.startsWith('http') ? valor : `${API_BASE_URL}${valor}`);

const fechaBoliviaHoy = () => {
  // Date.now() ya es UTC real, independiente del huso horario del equipo del usuario.
  const bolivia = new Date(Date.now() - 4 * 60 * 60000);
  return bolivia.toISOString().slice(0, 10);
};

const generarNumeroFactura = () => `FAC-${Math.floor(100 + Math.random() * 900)}`;

const formularioVacio = () => ({
  id_proveedor: '',
  proveedor_nuevo_nombre: '',
  numero_factura: '',
  fecha: fechaBoliviaHoy(),
  subtotal: 0,
  impuesto: 0,
  total: 0,
  metodo_pago: '',
  estado: 'Pendiente',
  detalles: [{ id_producto: '', producto_nuevo_nombre: '', cantidad: 1, precio_compra: 0, subtotal: 0 }],
});

const Compras = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState(formularioVacio());
  const [comprobante, setComprobante] = useState(null);
  const [mostrarProveedorNuevo, setMostrarProveedorNuevo] = useState(false);

  const IniciaRegistroCompra = () => {
    setNuevo(formularioVacio());
    setComprobante(null);
    setMostrarProveedorNuevo(false);
  };

  const SeleccionarProveedorYProductos = (valorSeleccionado) => {
    if (valorSeleccionado === OTRO_PROVEEDOR) {
      setMostrarProveedorNuevo(true);
      setNuevo({ ...nuevo, id_proveedor: '', detalles: [{ id_producto: '', producto_nuevo_nombre: '', cantidad: 1, precio_compra: 0, subtotal: 0 }] });
      return;
    }
    setMostrarProveedorNuevo(false);
    setNuevo({
      ...nuevo,
      id_proveedor: Number(valorSeleccionado),
      proveedor_nuevo_nombre: '',
      numero_factura: generarNumeroFactura(),
      detalles: [{ id_producto: '', producto_nuevo_nombre: '', cantidad: 1, precio_compra: 0, subtotal: 0 }],
    });
  };

  const IngresaNombreProveedorNuevo = (nombre) => {
    setNuevo((prev) => ({
      ...prev,
      proveedor_nuevo_nombre: nombre,
      numero_factura: prev.numero_factura || (nombre.trim() ? generarNumeroFactura() : ''),
    }));
  };

  const IngresaDatos = (campo, valor) => {
    setNuevo({ ...nuevo, [campo]: valor });
  };

  const RecibeConfirmacionVisual = (mensaje) => mensaje;

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo(
        'CU12',
        ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para gestión de compras.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarProveedores();
      cargarProductos();
      cargarCompras();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  const cargarProveedores = async () => {
    const res = await fetch(`${API}/proveedores/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setProveedores(Array.isArray(data) ? data : []);
  };

  const cargarProductos = async () => {
    const res = await fetch(`${API}/productos/`, { headers: headers() });
    const data = await res.json();
    if (res.ok) setProductos(Array.isArray(data) ? data : []);
  };

  const cargarCompras = async () => {
    try {
      setError('');
      const res = await fetch(`${API}/compras/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar compras.');
      setCompras(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando compras.');
    }
  };

  const productosFiltrados = useMemo(() => {
    if (!nuevo.id_proveedor) return productos;
    return productos.filter((p) => Number(p.id_proveedor) === Number(nuevo.id_proveedor));
  }, [productos, nuevo.id_proveedor]);

  const comprobantePreviewUrl = useMemo(
    () => (comprobante ? URL.createObjectURL(comprobante) : null),
    [comprobante]
  );

  const actualizarDetalle = (index, field, value) => {
    const detalles = [...nuevo.detalles];
    detalles[index] = { ...detalles[index], [field]: value };
    if (field === 'id_producto') {
      if (value === OTRO_PRODUCTO) {
        detalles[index].precio_compra = 0;
      } else {
        const producto = productos.find((p) => p.codigo === value);
        detalles[index].precio_compra = producto ? Number(producto.precio_compra) : 0;
        detalles[index].producto_nuevo_nombre = '';
      }
    }
    detalles[index].subtotal = Number(detalles[index].cantidad || 0) * Number(detalles[index].precio_compra || 0);
    setNuevo({ ...nuevo, detalles });
  };

  const agregarLinea = () => {
    setNuevo({ ...nuevo, detalles: [...nuevo.detalles, { id_producto: '', producto_nuevo_nombre: '', cantidad: 1, precio_compra: 0, subtotal: 0 }] });
  };

  const eliminarLinea = (index) => {
    const detalles = nuevo.detalles.filter((_, i) => i !== index);
    setNuevo({ ...nuevo, detalles: detalles.length ? detalles : [{ id_producto: '', producto_nuevo_nombre: '', cantidad: 1, precio_compra: 0, subtotal: 0 }] });
  };

  const calcularTotales = () => {
    const subtotal = nuevo.detalles.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const impuesto = Number(nuevo.impuesto || 0);
    const total = subtotal + impuesto;
    return { subtotal, total };
  };

  const crearCompra = async (e) => {
    e.preventDefault();
    setError('');

    if (!nuevo.id_proveedor && !nuevo.proveedor_nuevo_nombre.trim()) {
      return setError('Seleccione un proveedor o ingrese el nombre del proveedor nuevo.');
    }
    if ((nuevo.metodo_pago === 'Transferencia' || nuevo.metodo_pago === 'QR') && !comprobante) {
      return setError('Debe adjuntar el comprobante de pago.');
    }
    const lineaProductoNuevoSinNombre = nuevo.detalles.some(
      (d) => d.id_producto === OTRO_PRODUCTO && !d.producto_nuevo_nombre.trim()
    );
    if (lineaProductoNuevoSinNombre) {
      return setError('Ingrese el nombre del producto nuevo en cada línea marcada como "Otro".');
    }

    const { subtotal, total } = calcularTotales();
    const detallesParaEnviar = nuevo.detalles.map((d) => ({
      ...d,
      id_producto: d.id_producto === OTRO_PRODUCTO ? '' : d.id_producto,
    }));
    const datosCompra = {
      id_proveedor: nuevo.id_proveedor || '',
      proveedor_nuevo_nombre: nuevo.proveedor_nuevo_nombre,
      numero_factura: nuevo.numero_factura,
      fecha: nuevo.fecha,
      subtotal,
      impuesto: nuevo.impuesto,
      total,
      metodo_pago: nuevo.metodo_pago,
      estado: nuevo.estado,
    };

    let body;
    let requestHeaders;
    if (comprobante) {
      const formData = new FormData();
      Object.entries(datosCompra).forEach(([key, value]) => formData.append(key, value ?? ''));
      formData.append('detalles', JSON.stringify(detallesParaEnviar));
      formData.append('comprobante_pago', comprobante);
      body = formData;
      const { 'Content-Type': _contentType, ...resto } = headers();
      requestHeaders = resto;
    } else {
      body = JSON.stringify({ ...datosCompra, detalles: detallesParaEnviar });
      requestHeaders = headers();
    }

    const res = await fetch(`${API}/compras/`, {
      method: 'POST',
      headers: requestHeaders,
      body,
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));
    IniciaRegistroCompra();
    await cargarProveedores();
    await cargarProductos();
    await cargarCompras();
  };

  return (
    <div className="app-container compras-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/compras/fondo-compras-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/compras/fondo-compras-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Compras a Proveedores (CU12)</h2>
          <div className="page-subtitle">Registro de compras de productos a proveedores para reposición de inventario</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="compras-content">
        <div className="bitacora-panel compras-form-panel">
          <h3 className="usuarios-panel-title">Registrar compra</h3>
          <form onSubmit={crearCompra}>
            <div className="input-group">
              <label>Proveedor</label>
              <select
                value={mostrarProveedorNuevo ? OTRO_PROVEEDOR : nuevo.id_proveedor}
                onChange={(e) => SeleccionarProveedorYProductos(e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {proveedores.map((p) => (
                  <option key={p.codigo} value={p.codigo}>{p.empresa}</option>
                ))}
                <option value={OTRO_PROVEEDOR}>Otro</option>
              </select>
            </div>

            {mostrarProveedorNuevo && (
              <div className="input-group">
                <label>Nombre del proveedor nuevo</label>
                <input
                  value={nuevo.proveedor_nuevo_nombre}
                  onChange={(e) => IngresaNombreProveedorNuevo(e.target.value)}
                  placeholder="Ingrese el nombre del proveedor"
                  required
                />
              </div>
            )}

            <div className="input-group"><label>Número factura</label><input value={nuevo.numero_factura} onChange={(e) => IngresaDatos('numero_factura', e.target.value)} required /></div>
            <div className="input-group"><label>Fecha</label><input type="date" value={nuevo.fecha} onChange={(e) => IngresaDatos('fecha', e.target.value)} required /></div>
            <div className="input-group"><label>Impuesto</label><input type="number" step="0.01" value={nuevo.impuesto} onChange={(e) => IngresaDatos('impuesto', Number(e.target.value))} /></div>
            <div className="input-group"><label>Método de pago</label><select value={nuevo.metodo_pago} onChange={(e) => { IngresaDatos('metodo_pago', e.target.value); setComprobante(null); }}>
              <option value="">Seleccione</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="QR">QR</option>
            </select></div>

            {(nuevo.metodo_pago === 'Transferencia' || nuevo.metodo_pago === 'QR') && (
              <div className="input-group">
                <label>Comprobante de pago</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setComprobante(e.target.files[0] || null)}
                  required={!comprobante}
                />
                {comprobante && (
                  <a href={comprobantePreviewUrl} target="_blank" rel="noopener noreferrer" className="compras-comprobante-link">
                    📎 {comprobante.name}
                  </a>
                )}
              </div>
            )}

            <div className="input-group"><label>Estado</label><select value={nuevo.estado} onChange={(e) => IngresaDatos('estado', e.target.value)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Negado">Negado</option>
            </select></div>

            <div className="compras-detalles">
              <h4 className="compras-detalles-title">Detalles de compra</h4>
              {nuevo.detalles.map((detalle, index) => (
                <div key={index} className="compras-detalle-item">
                  <div className="input-group">
                    <label>Producto</label>
                    <select
                      value={detalle.id_producto}
                      onChange={(e) => actualizarDetalle(index, 'id_producto', e.target.value === OTRO_PRODUCTO ? OTRO_PRODUCTO : Number(e.target.value))}
                      required
                    >
                      <option value="">Seleccione</option>
                      {productosFiltrados.map((prod) => (<option key={prod.codigo} value={prod.codigo}>{prod.nombre}</option>))}
                      <option value={OTRO_PRODUCTO}>Otro</option>
                    </select>
                    {detalle.id_producto === OTRO_PRODUCTO && (
                      <input
                        value={detalle.producto_nuevo_nombre}
                        onChange={(e) => actualizarDetalle(index, 'producto_nuevo_nombre', e.target.value)}
                        placeholder="Ingrese el nombre del producto"
                        required
                      />
                    )}
                  </div>
                  <div className="input-group"><label>Cantidad</label><input type="number" min="1" value={detalle.cantidad} onChange={(e) => actualizarDetalle(index, 'cantidad', Number(e.target.value))} required /></div>
                  <div className="input-group"><label>Precio compra</label><input type="number" step="0.01" value={detalle.precio_compra} onChange={(e) => actualizarDetalle(index, 'precio_compra', Number(e.target.value))} required /></div>
                  <div className="input-group"><label>Subtotal</label><input type="number" step="0.01" value={detalle.subtotal} disabled /></div>
                  <div className="compras-detalle-actions"><button type="button" onClick={() => eliminarLinea(index)} className="table-action-btn table-action-btn--danger">Eliminar</button></div>
                </div>
              ))}
              <button type="button" onClick={agregarLinea} className="bitacora-btn bitacora-btn--export" style={{ marginBottom: '4px' }}>Agregar línea</button>
            </div>

            <div className="compras-totales">
              <p><strong>Subtotal:</strong> ${calcularTotales().subtotal}</p>
              <p><strong>Total:</strong> ${calcularTotales().total}</p>
            </div>

            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '16px' }}>Crear compra</button>
          </form>
        </div>

        <div className="bitacora-panel compras-list-panel">
          <h3 className="usuarios-panel-title">Compras registradas</h3>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Proveedor</th>
                  <th>N° Factura</th>
                  <th>Fecha</th>
                  <th>Subtotal</th>
                  <th>Impuesto</th>
                  <th>Total</th>
                  <th>Método de pago</th>
                  <th>Comprobante</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center' }}>No hay compras registradas.</td></tr>
                ) : (
                  compras.map((c) => (
                    <tr key={c.codigo}>
                      <td>#{c.codigo}</td>
                      <td>{c.proveedor_empresa || '-'}</td>
                      <td>{c.numero_factura || '-'}</td>
                      <td>{c.fecha || '-'}</td>
                      <td>${c.subtotal || 0}</td>
                      <td>${c.impuesto || 0}</td>
                      <td>${c.total || 0}</td>
                      <td>{c.metodo_pago || '-'}</td>
                      <td>
                        {c.comprobante_pago ? (
                          <a href={urlComprobante(c.comprobante_pago)} target="_blank" rel="noopener noreferrer" title="Ver comprobante">
                            {c.comprobante_pago.split('/').pop()}
                          </a>
                        ) : '-'}
                      </td>
                      <td>{c.estado || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compras;
