import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Clientes = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    cedula: '',
    nombre: '',
    telefono: '',
    telefono_alternativo: '',
    direccion: '',
    email: '',
  });
  const [clienteEdicion, setClienteEdicion] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '' });

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!usuarioLocal || !['Administrador', 'Recepcionista'].includes(usuarioLocal.rol)) {
      alert('Acceso denegado para gestión de clientes.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }
    cargarClientes('', mostrarInactivos);
  }, [navigate, usuarioLocal]);

  const cargarClientes = async (q = '', incluirInactivos = mostrarInactivos) => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (incluirInactivos) params.append('incluir_inactivos', 'true');

      const query = params.toString();
      const url = query ? `${API}/clientes/?${query}` : `${API}/clientes/`;
      const res = await fetch(url, { headers: headers(false) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar clientes.');
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando clientes.');
    }
  };

  const crearCliente = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/clientes/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(nuevo),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));

    setNuevo({ cedula: '', nombre: '', telefono: '', telefono_alternativo: '', direccion: '', email: '' });
    await cargarClientes(busqueda, mostrarInactivos);
  };

  const abrirEdicion = (cliente) => {
    setClienteEdicion(cliente);
    setEditForm({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!clienteEdicion) return;

    const res = await fetch(`${API}/clientes/${clienteEdicion.codigo}/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));

    setClienteEdicion(null);
    await cargarClientes(busqueda, mostrarInactivos);
  };

  const cambiarEstadoCliente = async (cliente) => {
    const estadoActual = cliente.estado || 'Activo';
    const estaInactivo = estadoActual === 'Inactivo';

    const confirmar = estaInactivo
      ? window.confirm(`¿Activar cliente ${cliente.nombre}?`)
      : window.confirm(`¿Desactivar cliente ${cliente.nombre}?`);

    if (!confirmar) return;

    const res = await fetch(`${API}/clientes/${cliente.codigo}/`, {
      method: estaInactivo ? 'PUT' : 'DELETE',
      headers: headers(estaInactivo),
      body: estaInactivo ? JSON.stringify({ estado: 'Activo' }) : undefined,
    });

    const data = await res.json();
    if (!res.ok) {
      return setError(
        data.error
          || (estaInactivo ? 'No se pudo activar cliente.' : 'No se pudo desactivar cliente.')
      );
    }

    await cargarClientes(busqueda, mostrarInactivos);
  };

  return (
    <div className="app-container clientes-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/clientes/fondo-clientes-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/clientes/fondo-clientes-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestión de Clientes (CU05)</h2>
          <div className="page-subtitle">Administración de clientes del taller</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/motocicletas')} className="btn-secondary">Motocicletas</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(getHomeRouteByRole(usuarioLocal?.rol))} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="clientes-content">
        <div className="bitacora-panel clientes-form-panel">
          <h3 className="usuarios-panel-title">Registrar Cliente</h3>
          <form onSubmit={crearCliente}>
            <div className="input-group"><label>Cédula/NIT</label><input value={nuevo.cedula} onChange={(e) => setNuevo({ ...nuevo, cedula: e.target.value })} required /></div>
            <div className="input-group"><label>Nombre</label><input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} required /></div>
            <div className="input-group"><label>Teléfono</label><input value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} /></div>
            <div className="input-group"><label>Teléfono alternativo</label><input value={nuevo.telefono_alternativo} onChange={(e) => setNuevo({ ...nuevo, telefono_alternativo: e.target.value })} /></div>
            <div className="input-group"><label>Dirección</label><input value={nuevo.direccion} onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })} /></div>
            <div className="input-group"><label>Email</label><input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter">Crear cliente</button>
          </form>
        </div>

        <div className="bitacora-panel clientes-list-panel">
          <div className="clientes-list-header">
            <h3 className="usuarios-panel-title">Listado</h3>
            <div className="clientes-search">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o cédula"
                className="bitacora-input"
              />
              <label className="clientes-search-checkbox">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setMostrarInactivos(checked);
                    cargarClientes(busqueda, checked);
                  }}
                />
                Mostrar inactivos
              </label>
              <button onClick={() => cargarClientes(busqueda, mostrarInactivos)} className="bitacora-btn bitacora-btn--filter">Buscar</button>
            </div>
          </div>

          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.codigo} className={(c.estado || 'Activo') === 'Inactivo' ? 'clientes-row--inactiva' : ''}>
                    <td>{c.cedula}</td>
                    <td>{c.nombre}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>
                      <span className={`usuario-status-badge ${(c.estado || 'Activo') === 'Activo' ? 'usuario-status-badge--activo' : 'usuario-status-badge--inactivo'}`}>
                        {c.estado || 'Activo'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => abrirEdicion(c)} className="table-action-btn table-action-btn--edit">Editar</button>
                      <button
                        onClick={() => cambiarEstadoCliente(c)}
                        className={`table-action-btn ${(c.estado || 'Activo') === 'Inactivo' ? 'table-action-btn--success' : 'table-action-btn--danger'}`}
                      >
                        {(c.estado || 'Activo') === 'Inactivo' ? 'Activar' : 'Desactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {clienteEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar cliente</h3>
            <form onSubmit={guardarEdicion}>
              <div className="input-group"><label>Nombre</label><input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required /></div>
              <div className="input-group"><label>Teléfono</label><input value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setClienteEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;