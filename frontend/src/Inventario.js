import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const Inventario = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [mostrarBajoStock, setMostrarBajoStock] = useState(false);
  const [historialCodigo, setHistorialCodigo] = useState('');
  const [historial, setHistorial] = useState([]);
  const [ajusteCodigo, setAjusteCodigo] = useState('');
  const [ajusteCantidad, setAjusteCantidad] = useState(0);
  const [ajusteMotivo, setAjusteMotivo] = useState('');
  const [ajusteMensaje, setAjusteMensaje] = useState('');

  const ValidarStockYAlertas = (producto) => {
    return Number(producto.stock_actual) <= Number(producto.stock_minimo || 1);
  };

  const RecibeConfirmacionYDatos = (datos) => datos;

  const resolverProducto = (valor) => productos.find(
    (p) => String(p.codigo) === String(valor).trim()
      || (p.codigo_barras || '').toLowerCase() === String(valor).trim().toLowerCase()
  );

  const ConsultaHistorialProductos = async () => {
    if (!historialCodigo.trim()) {
      setError('Ingresa el código o código de barras del producto para consultar historial.');
      return;
    }
    setError('');
    const producto = resolverProducto(historialCodigo);
    if (!producto) {
      setHistorial([]);
      setAjusteMensaje(`Producto ${historialCodigo} no encontrado en el inventario.`);
      return;
    }
    try {
      const res = await fetch(`${API}/inventario/historial/?producto=${producto.codigo}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo consultar el historial.');
      setHistorial(Array.isArray(data) ? data : []);
      setAjusteMensaje(`Historial cargado para ${producto.nombre} (#${producto.codigo}).`);
    } catch {
      setError('Error de conexión consultando historial.');
    }
  };

  const RegistraAjusteManual = async () => {
    if (!ajusteCodigo.trim()) {
      setError('Ingresa el código o código de barras del producto para ajustar stock.');
      return;
    }
    const producto = resolverProducto(ajusteCodigo);
    if (!producto) {
      setError(`Producto ${ajusteCodigo} no encontrado en el inventario.`);
      return;
    }
    const cantidad = Number(ajusteCantidad);
    if (!cantidad) {
      setError('Ingresa una cantidad distinta de cero para el ajuste.');
      return;
    }
    setError('');
    try {
      const res = await fetch(`${API}/inventario/ajuste/`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_producto: producto.codigo, cantidad, motivo: ajusteMotivo }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo aplicar el ajuste.');
      setAjusteMensaje(`Ajuste aplicado a ${producto.nombre}: ${cantidad >= 0 ? `+${cantidad}` : cantidad} (stock resultante: ${data.producto.stock_actual}).`);
      setAjusteCodigo('');
      setAjusteCantidad(0);
      setAjusteMotivo('');
      await cargarInventario(mostrarBajoStock);
    } catch {
      setError('Error de conexión aplicando el ajuste.');
    }
  };

  const productosOrdenados = useMemo(
    () => [...productos].sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    [productos]
  );

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo(
        'CU11',
        ['Mostrar', 'Buscar', 'Reportes'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para monitoreo de inventario.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarInventario(mostrarBajoStock);
    };

    validarAcceso();
  }, [navigate, usuarioLocal, mostrarBajoStock]);

  const cargarInventario = async (soloBajo) => {
    try {
      setError('');
      const query = soloBajo ? '?alerta=bajo' : '';
      const res = await fetch(`${API}/inventario/${query}`, {
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar inventario.');
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando inventario.');
    }
  };

  return (
    <div className="app-container inventario-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/inventario/fondo-inventario-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/inventario/fondo-inventario-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Monitoreo de Inventario (CU11)</h2>
          <div className="page-subtitle">Seguimiento de niveles de stock, alertas y ajustes de productos</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="bitacora-panel inventario-table-panel">
        <div className="inventario-toolbar">
          <label className="inventario-filter-checkbox">
            <input
              type="checkbox"
              checked={mostrarBajoStock}
              onChange={(e) => setMostrarBajoStock(e.target.checked)}
            />
            Mostrar solo stock bajo
          </label>
          <span className="inventario-toolbar-note">
            Stock mínimo se muestra como mínimo 1 y todas las ubicaciones se completan en la tabla.
          </span>
          <span className="inventario-total">Total de productos: <strong>{productos.length}</strong></span>
        </div>

        <div className="bitacora-table-wrap">
          <table className="bitacora-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Código barras</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Modelo compatible</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
                <th>Precio compra</th>
                <th>Precio venta</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productosOrdenados.length === 0 ? (
                <tr><td colSpan="12" style={{ textAlign: 'center' }}>No hay productos en inventario.</td></tr>
              ) : (
                productosOrdenados.map((p) => {
                  const stockMinimo = Math.max(1, Number(p.stock_minimo) || 1);
                  const ubicacion = p.ubicacion_almacen?.trim() || 'Sin ubicación asignada';
                  const estaBajo = Number(p.stock_actual) <= stockMinimo;
                  return (
                    <tr key={p.codigo} className={estaBajo ? 'inventario-row--bajo' : ''}>
                      <td>#{p.codigo}</td>
                      <td>{p.codigo_barras || '-'}</td>
                      <td>{p.nombre || '-'}</td>
                      <td>{p.marca || '-'}</td>
                      <td>{p.categoria || '-'}</td>
                      <td>{p.modelo_compatible || '-'}</td>
                      <td><strong>{p.stock_actual || 0}</strong></td>
                      <td>{stockMinimo}</td>
                      <td>$ {p.precio_compra || 0}</td>
                      <td>$ {p.precio_venta || 0}</td>
                      <td>{ubicacion}</td>
                      <td>
                        <span className={`usuario-status-badge ${(p.estado || 'Activo') === 'Activo' ? 'usuario-status-badge--activo' : 'usuario-status-badge--inactivo'}`}>
                          {p.estado || 'Activo'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="inventario-content">
        <div className="bitacora-panel inventario-form-panel">
          <h3 className="usuarios-panel-title">Consultar historial de producto</h3>
          <div className="input-group"><label>Código o código de barras del producto</label><input value={historialCodigo} onChange={(e) => setHistorialCodigo(e.target.value)} placeholder="Ej. 86 o PROD-085" /></div>
          <button type="button" onClick={ConsultaHistorialProductos} className="bitacora-btn bitacora-btn--filter">Consultar historial</button>
          {ajusteMensaje && <div className="inventario-mensaje">{ajusteMensaje}</div>}
          {historial.length > 0 && (
            <div className="inventario-historial-list">
              <h4>Movimientos</h4>
              <ul>
                {historial.map((item, index) => (
                  <li key={index}>{`${item.fecha} · ${item.tipo}: ${item.descripcion} (${item.cantidad >= 0 ? `+${item.cantidad}` : item.cantidad})`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="bitacora-panel inventario-form-panel">
          <h3 className="usuarios-panel-title">Registrar ajuste manual</h3>
          <div className="input-group"><label>Código o código de barras del producto</label><input value={ajusteCodigo} onChange={(e) => setAjusteCodigo(e.target.value)} placeholder="Ej. 86 o PROD-085" /></div>
          <div className="input-group"><label>Cantidad a ajustar</label><input type="number" value={ajusteCantidad} onChange={(e) => setAjusteCantidad(Number(e.target.value))} /></div>
          <div className="input-group"><label>Motivo</label><input value={ajusteMotivo} onChange={(e) => setAjusteMotivo(e.target.value)} placeholder="Ej. Merma, conteo físico, daño" /></div>
          <button type="button" onClick={RegistraAjusteManual} className="bitacora-btn bitacora-btn--filter">Aplicar ajuste</button>
          {ajusteMensaje && <div className="inventario-mensaje">{ajusteMensaje}</div>}
        </div>
      </div>
    </div>
  );
};

export default Inventario;