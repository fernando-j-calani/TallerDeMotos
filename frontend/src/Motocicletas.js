import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Motocicletas = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [motos, setMotos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    id_cliente: '',
    placa: '',
    marca: '',
    modelo: '',
    anio: '',
    cilindraje: '',
    color: '',
    numero_motor: '',
    numero_chasis: '',
    kilometraje_actual: '',
  });
  const [motoEdicion, setMotoEdicion] = useState(null);
  const [editForm, setEditForm] = useState({ marca: '', modelo: '' });

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!usuarioLocal || !['Administrador', 'Recepcionista'].includes(usuarioLocal.rol)) {
      alert('Acceso denegado para gestión de motocicletas.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }
    cargarBase();
  }, [navigate, usuarioLocal]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') cargarClientes();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const cargarBase = async () => {
    await Promise.all([cargarMotos('', mostrarInactivos), cargarClientes()]);
  };

  const cargarClientes = async () => {
    const res = await fetch(`${API}/clientes/`, { headers: headers(false) });
    const data = await res.json();
    if (res.ok) setClientes(Array.isArray(data) ? data : []);
  };

  const cargarMotos = async (q = '', incluirInactivos = mostrarInactivos) => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (incluirInactivos) params.append('incluir_inactivos', 'true');

      const query = params.toString();
      const url = query ? `${API}/motocicletas/?${query}` : `${API}/motocicletas/`;
      const res = await fetch(url, { headers: headers(false) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar motocicletas.');
      setMotos(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando motocicletas.');
    }
  };

  const crearMoto = async (e) => {
    e.preventDefault();
    const payload = {
      ...nuevo,
      anio: nuevo.anio ? parseInt(nuevo.anio, 10) : null,
      kilometraje_actual: nuevo.kilometraje_actual || null,
    };

    const res = await fetch(`${API}/motocicletas/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));

    setNuevo({ id_cliente: '', placa: '', marca: '', modelo: '', anio: '', cilindraje: '', color: '', numero_motor: '', numero_chasis: '', kilometraje_actual: '' });
    await cargarMotos(busqueda, mostrarInactivos);
  };

  const abrirEdicion = (moto) => {
    setMotoEdicion(moto);
    setEditForm({ marca: moto.marca || '', modelo: moto.modelo || '' });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!motoEdicion) return;

    const res = await fetch(`${API}/motocicletas/${motoEdicion.codigo}/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));

    setMotoEdicion(null);
    await cargarMotos(busqueda, mostrarInactivos);
  };

  const cambiarEstadoMoto = async (moto) => {
    if ((moto.estado || 'Activo') === 'Inactivo') {
      return setError('La motocicleta ya está inactiva.');
    }

    if (!window.confirm(`¿Desactivar motocicleta ${moto.placa}?`)) return;

    const res = await fetch(`${API}/motocicletas/${moto.codigo}/`, {
      method: 'DELETE',
      headers: headers(false),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo desactivar motocicleta.');

    await cargarMotos(busqueda, mostrarInactivos);
  };

  return (
    <div className="app-container motos-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/motocicletas/fondo-motocicletas-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/motocicletas/fondo-motocicletas-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestión de Motocicletas (CU06)</h2>
          <div className="page-subtitle">Administración de motocicletas registradas</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/clientes')} className="btn-secondary">Clientes</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(getHomeRouteByRole(usuarioLocal?.rol))} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="motos-content">
        <div className="bitacora-panel motos-form-panel">
          <h3 className="usuarios-panel-title">Registrar Motocicleta</h3>
          <form onSubmit={crearMoto}>
            <div className="input-group">
              <label>Cliente</label>
              <select
                value={nuevo.id_cliente}
                onChange={(e) => setNuevo({ ...nuevo, id_cliente: e.target.value })}
                required
              >
                <option value="">Selecciona cliente</option>
                {clientes.map((c) => (
                  <option key={c.codigo} value={c.codigo}>{c.nombre} - {c.cedula}</option>
                ))}
              </select>
            </div>
            <div className="input-group"><label>Placa</label><input value={nuevo.placa} onChange={(e) => setNuevo({ ...nuevo, placa: e.target.value })} required /></div>
            <div className="input-group"><label>Marca</label><input value={nuevo.marca} onChange={(e) => setNuevo({ ...nuevo, marca: e.target.value })} /></div>
            <div className="input-group"><label>Modelo</label><input value={nuevo.modelo} onChange={(e) => setNuevo({ ...nuevo, modelo: e.target.value })} /></div>
            <div className="input-group"><label>Año</label><input type="number" value={nuevo.anio} onChange={(e) => setNuevo({ ...nuevo, anio: e.target.value })} /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter">Crear motocicleta</button>
          </form>
        </div>

        <div className="bitacora-panel motos-list-panel">
          <div className="motos-list-header">
            <h3 className="usuarios-panel-title">Listado</h3>
            <div className="motos-search">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por placa"
                className="bitacora-input"
              />
              <label className="motos-search-checkbox">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setMostrarInactivos(checked);
                    cargarMotos(busqueda, checked);
                  }}
                />
                Mostrar inactivas
              </label>
              <button onClick={() => cargarMotos(busqueda, mostrarInactivos)} className="bitacora-btn bitacora-btn--filter">Buscar</button>
            </div>
          </div>

          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Marca/Modelo</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {motos.map((m) => (
                  <tr key={m.codigo} className={(m.estado || 'Activo') === 'Inactivo' ? 'motos-row--inactiva' : ''}>
                    <td>{m.placa}</td>
                    <td>{(m.marca || '-') + ' / ' + (m.modelo || '-')}</td>
                    <td>{m.cliente_nombre || '-'}</td>
                    <td>
                      <span className={`usuario-status-badge ${(m.estado || 'Activo') === 'Activo' ? 'usuario-status-badge--activo' : 'usuario-status-badge--inactivo'}`}>
                        {m.estado || 'Activo'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => abrirEdicion(m)} className="table-action-btn table-action-btn--edit">Editar</button>
                      <button
                        onClick={() => cambiarEstadoMoto(m)}
                        disabled={(m.estado || 'Activo') === 'Inactivo'}
                        className="table-action-btn table-action-btn--danger"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {motoEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar motocicleta</h3>
            <form onSubmit={guardarEdicion}>
              <div className="input-group"><label>Marca</label><input value={editForm.marca} onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })} /></div>
              <div className="input-group"><label>Modelo</label><input value={editForm.modelo} onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setMotoEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Motocicletas;