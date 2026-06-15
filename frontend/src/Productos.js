import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const Productos = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [nuevo, setNuevo] = useState({
    codigo_barras: '',
    nombre: '',
    categoria: '',
    marca: '',
    modelo_compatible: '',
    stock_actual: 0,
    stock_minimo: 1,
    precio_compra: 0,
    precio_venta: 0,
    ubicacion_almacen: '',
    estado: 'Activo',
  });
  const [productoEdicion, setProductoEdicion] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    precio_compra: 0,
    precio_venta: 0,
    stock_actual: 0,
    stock_minimo: 0,
    ubicacion_almacen: '',
    estado: 'Activo',
  });

  const IniciaGestionBuscaRepuesto = async () => {
    await cargarProductos(busqueda);
  };

  const SolicitaCrearRepuesto = async (e) => {
    await crearProducto(e);
  };

  const SolicitaEditarDesactivar = async (producto, datosActualizados) => {
    abrirEdicion(producto);
    setEditForm(datosActualizados || editForm);
  };

  const RecibeConfirmacionVisual = (mensaje) => mensaje;

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo(
        'CU10',
        ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para gestión de productos.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarProductos();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  const cargarProductos = async (query = '') => {
    try {
      setError('');
      const url = new URL(`${API}/productos/`);
      if (query) url.searchParams.set('q', query);
      if (incluirInactivos) url.searchParams.set('incluir_inactivos', 'true');

      const res = await fetch(url.toString(), {
        headers: headers(false),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar productos.');
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando productos.');
    }
  };

  const crearProducto = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...nuevo,
      stock_minimo: Math.max(1, Number(nuevo.stock_minimo) || 1),
      ubicacion_almacen: nuevo.ubicacion_almacen.trim() || 'Sin ubicación asignada',
    };
    const res = await fetch(`${API}/productos/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));
    setNuevo({ codigo_barras: '', nombre: '', categoria: '', marca: '', modelo_compatible: '', stock_actual: 0, stock_minimo: 1, precio_compra: 0, precio_venta: 0, ubicacion_almacen: '', estado: 'Activo' });
    await cargarProductos(busqueda);
  };

  const abrirEdicion = (producto) => {
    setProductoEdicion(producto);
    setEditForm({
      nombre: producto.nombre || '',
      categoria: producto.categoria || '',
      marca: producto.marca || '',
      precio_compra: producto.precio_compra || 0,
      precio_venta: producto.precio_venta || 0,
      stock_actual: producto.stock_actual || 0,
      stock_minimo: producto.stock_minimo || 1,
      ubicacion_almacen: producto.ubicacion_almacen || '',
      estado: producto.estado || 'Activo',
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!productoEdicion) return;
    const payload = {
      ...editForm,
      stock_minimo: Math.max(1, Number(editForm.stock_minimo) || 1),
      ubicacion_almacen: editForm.ubicacion_almacen.trim() || 'Sin ubicación asignada',
    };
    const res = await fetch(`${API}/productos/${productoEdicion.codigo}/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));
    setProductoEdicion(null);
    await cargarProductos(busqueda);
  };

  const desactivarProducto = async (producto) => {
    if (!window.confirm(`¿Desactivar producto ${producto.nombre}?`)) return;
    setError('');
    const res = await fetch(`${API}/productos/${producto.codigo}/`, {
      method: 'DELETE',
      headers: headers(false),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo desactivar el producto.');
    await cargarProductos(busqueda);
  };

  return (
    <div className="app-container productos-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/productos/fondo-productos-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/productos/fondo-productos-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestión de Productos (CU10)</h2>
          <div className="page-subtitle">Administración del inventario de repuestos y productos del taller</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="productos-content">
        <div className="bitacora-panel productos-form-panel">
          <h3 className="usuarios-panel-title">Registrar producto</h3>
          <form onSubmit={crearProducto}>
            <div className="input-group"><label>Código de barras</label><input value={nuevo.codigo_barras} onChange={(e) => setNuevo({ ...nuevo, codigo_barras: e.target.value })} /></div>
            <div className="input-group"><label>Nombre</label><input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} required /></div>
            <div className="input-group"><label>Categoría</label><input value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} /></div>
            <div className="input-group"><label>Marca</label><input value={nuevo.marca} onChange={(e) => setNuevo({ ...nuevo, marca: e.target.value })} /></div>
            <div className="input-group"><label>Estado</label><select value={nuevo.estado} onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value })}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select></div>
            <div className="input-group"><label>Modelo compatible</label><input value={nuevo.modelo_compatible} onChange={(e) => setNuevo({ ...nuevo, modelo_compatible: e.target.value })} /></div>
            <div className="input-group"><label>Stock actual</label><input type="number" value={nuevo.stock_actual} onChange={(e) => setNuevo({ ...nuevo, stock_actual: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Stock mínimo</label><input type="number" min="1" value={nuevo.stock_minimo} onChange={(e) => setNuevo({ ...nuevo, stock_minimo: Number(e.target.value) })} required /></div>
            <div className="input-group"><label>Precio compra</label><input type="number" step="0.01" value={nuevo.precio_compra} onChange={(e) => setNuevo({ ...nuevo, precio_compra: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Precio venta</label><input type="number" step="0.01" value={nuevo.precio_venta} onChange={(e) => setNuevo({ ...nuevo, precio_venta: Number(e.target.value) })} /></div>
            <div className="input-group"><label>Ubicación</label><input value={nuevo.ubicacion_almacen} onChange={(e) => setNuevo({ ...nuevo, ubicacion_almacen: e.target.value })} required /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '4px' }}>Crear producto</button>
          </form>
        </div>

        <div className="bitacora-panel productos-list-panel">
          <div className="productos-list-header">
            <h3 className="usuarios-panel-title">Listado de productos</h3>
            <div className="productos-search">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, marca o categoría"
                className="bitacora-input"
              />
              <label className="productos-search-checkbox">
                <input
                  type="checkbox"
                  checked={incluirInactivos}
                  onChange={(e) => setIncluirInactivos(e.target.checked)}
                />
                Mostrar inactivos
              </label>
              <button type="button" onClick={IniciaGestionBuscaRepuesto} className="bitacora-btn bitacora-btn--filter">Buscar</button>
            </div>
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr><td colSpan="13" style={{ textAlign: 'center' }}>No hay productos registrados.</td></tr>
                ) : (
                  productos.map((p) => (
                    <tr key={p.codigo} className={(p.estado || 'Activo') === 'Inactivo' ? 'productos-row--inactiva' : ''}>
                      <td>#{p.codigo}</td>
                      <td>{p.codigo_barras || '-'}</td>
                      <td>{p.nombre}</td>
                      <td>{p.marca || '-'}</td>
                      <td>{p.categoria || '-'}</td>
                      <td>{p.modelo_compatible || '-'}</td>
                      <td>{p.stock_actual}</td>
                      <td>{p.stock_minimo}</td>
                      <td>$ {p.precio_compra}</td>
                      <td>$ {p.precio_venta}</td>
                      <td>{p.ubicacion_almacen || '-'}</td>
                      <td>
                        <span className={`usuario-status-badge ${(p.estado || 'Activo') === 'Activo' ? 'usuario-status-badge--activo' : 'usuario-status-badge--inactivo'}`}>
                          {p.estado || 'Activo'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => abrirEdicion(p)} className="table-action-btn table-action-btn--edit">Editar</button>
                        <button
                          onClick={() => desactivarProducto(p)}
                          disabled={(p.estado || 'Activo') === 'Inactivo'}
                          className="table-action-btn table-action-btn--danger"
                        >
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {productoEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar producto</h3>
            <form onSubmit={guardarEdicion}>
              <div className="input-group"><label>Nombre</label><input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required /></div>
              <div className="input-group"><label>Categoría</label><input value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} /></div>
              <div className="input-group"><label>Marca</label><input value={editForm.marca} onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })} /></div>
              <div className="input-group"><label>Estado</label><select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select></div>
              <div className="input-group"><label>Precio compra</label><input type="number" step="0.01" value={editForm.precio_compra} onChange={(e) => setEditForm({ ...editForm, precio_compra: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Precio venta</label><input type="number" step="0.01" value={editForm.precio_venta} onChange={(e) => setEditForm({ ...editForm, precio_venta: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Stock actual</label><input type="number" value={editForm.stock_actual} onChange={(e) => setEditForm({ ...editForm, stock_actual: Number(e.target.value) })} /></div>
              <div className="input-group"><label>Stock mínimo</label><input type="number" min="1" value={editForm.stock_minimo} onChange={(e) => setEditForm({ ...editForm, stock_minimo: Number(e.target.value) })} required /></div>
              <div className="input-group"><label>Ubicación</label><input value={editForm.ubicacion_almacen} onChange={(e) => setEditForm({ ...editForm, ubicacion_almacen: e.target.value })} required /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setProductoEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;