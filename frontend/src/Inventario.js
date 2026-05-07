import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Inventario = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ajuste, setAjuste] = useState({ producto: null, nuevo_stock: '', justificacion: '' });
  const [busqueda, setBusqueda] = useState('');

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!usuarioLocal || usuarioLocal.rol !== 'Administrador') {
      alert('Acceso denegado para gestion de inventario.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }
    cargarProductos();
  }, [navigate, usuarioLocal]);

  const cargarProductos = async () => {
    try {
      setError('');
      setCargando(true);
      const res = await fetch(`${API}/productos/`, { headers: headers(false) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar inventario.');
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexion cargando inventario.');
    } finally {
      setCargando(false);
    }
  };

  const abrirAjuste = (producto) => {
    setError('');
    setAjuste({ producto, nuevo_stock: producto.stock_actual ?? '', justificacion: '' });
  };

  const cerrarAjuste = () => {
    setAjuste({ producto: null, nuevo_stock: '', justificacion: '' });
  };

  const guardarAjuste = async (e) => {
    e.preventDefault();
    if (!ajuste.producto) return;

    const nuevoStock = parseInt(ajuste.nuevo_stock, 10);
    if (Number.isNaN(nuevoStock) || nuevoStock < 0) {
      return setError('Ingrese un stock valido (0 o mayor).');
    }

    const res = await fetch(`${API}/productos/${ajuste.producto.codigo}/`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ stock_actual: nuevoStock }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data));

    cerrarAjuste();
    await cargarProductos();
  };

  const esStockBajo = (producto) => {
    if (producto.stock_actual == null || producto.stock_minimo == null) return false;
    return Number(producto.stock_actual) <= Number(producto.stock_minimo);
  };

  const textoBusqueda = busqueda.trim().toLowerCase();
  const productosFiltrados = productos.filter((p) => {
    if (!textoBusqueda) return true;
    const nombre = (p.nombre || '').toLowerCase();
    const codigoBarras = (p.codigo_barras || '').toLowerCase();
    return nombre.includes(textoBusqueda) || codigoBarras.includes(textoBusqueda);
  });
  const totalEnAlerta = productos.filter((p) => esStockBajo(p)).length;

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Panel de Inventario (CU11)</h2>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ padding: '8px 12px', backgroundColor: '#2c2c2c', borderRadius: '6px', color: totalEnAlerta > 0 ? '#ff4d4f' : '#8bc34a', fontWeight: 'bold' }}>
          {totalEnAlerta > 0 ? `⚠️ ${totalEnAlerta} Repuestos con Stock Bajo` : '✅ Sin alertas de stock'}
        </div>
        <input
          placeholder="Buscar por nombre o codigo de barras"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ padding: '8px 12px', width: '320px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
        />
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Codigo Barras</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Categoria</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Stock Actual</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Stock Minimo</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Alerta</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => {
              const stockBajo = esStockBajo(p);
              return (
                <tr key={p.codigo} style={{ borderBottom: '1px solid #2c2c2c' }}>
                  <td style={{ padding: '8px' }}>{p.codigo_barras || '-'}</td>
                  <td style={{ padding: '8px' }}>{p.nombre}</td>
                  <td style={{ padding: '8px' }}>{p.categoria || '-'}</td>
                  <td style={{ padding: '8px', color: stockBajo ? '#ff4d4f' : 'white', fontWeight: stockBajo ? 'bold' : 'normal' }}>
                    {p.stock_actual ?? '-'}
                  </td>
                  <td style={{ padding: '8px' }}>{p.stock_minimo ?? '-'}</td>
                  <td style={{ padding: '8px' }}>
                    {stockBajo ? (
                      <span style={{ backgroundColor: '#8f2d2d', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Stock Bajo</span>
                    ) : (
                      <span style={{ color: '#8bc34a' }}>OK</span>
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => abrirAjuste(p)}
                      style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      Ajuste Manual
                    </button>
                  </td>
                </tr>
              );
            })}
            {!cargando && productosFiltrados.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '12px', color: '#999' }}>Sin productos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ajuste.producto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '520px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#ff6600' }}>Ajuste Manual de Stock</h3>
            <div style={{ marginBottom: '12px' }}>
              <strong>Producto:</strong> {ajuste.producto.nombre}<br />
              <strong>Stock Actual:</strong> {ajuste.producto.stock_actual ?? '-'}
            </div>
            <form onSubmit={guardarAjuste}>
              <div className="input-group">
                <label>Nuevo Stock</label>
                <input
                  type="number"
                  min="0"
                  value={ajuste.nuevo_stock}
                  onChange={(e) => setAjuste({ ...ajuste, nuevo_stock: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Justificacion</label>
                <textarea
                  rows="3"
                  value={ajuste.justificacion}
                  onChange={(e) => setAjuste({ ...ajuste, justificacion: e.target.value })}
                  placeholder="Motivo del ajuste (merma, perdida, inventario, etc.)"
                  style={{ width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #333' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={cerrarAjuste} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
