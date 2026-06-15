import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const RolesPermisos = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [roles, setRoles] = useState([]);
  const [privilegios, setPrivilegios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [error, setError] = useState('');

  const [nuevoRol, setNuevoRol] = useState({ nombre: '', descripcion: '' });
  const [nuevoPrivilegio, setNuevoPrivilegio] = useState({ nombre: '', descripcion: '' });
  const [asignacion, setAsignacion] = useState({ id_rol: '', id_privilegio: '' });
  const [rolEdicion, setRolEdicion] = useState(null);
  const [privilegioEdicion, setPrivilegioEdicion] = useState(null);
  const [editRol, setEditRol] = useState({ nombre: '', descripcion: '' });
  const [editPrivilegio, setEditPrivilegio] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    if (!usuarioLocal || usuarioLocal.rol !== 'Administrador') {
      alert('Acceso denegado: Solo Administrador.');
      navigate(getHomeRouteByRole(usuarioLocal?.rol));
      return;
    }
    cargarDatos();
  }, [navigate, usuarioLocal]);

  const getAuthHeaders = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  const cargarDatos = async () => {
    try {
      setError('');
      const [rolesRes, privilegiosRes, asignacionesRes] = await Promise.all([
        fetch(`${API}/roles/`, { headers: getAuthHeaders(false) }),
        fetch(`${API}/privilegios/`, { headers: getAuthHeaders(false) }),
        fetch(`${API}/roles-privilegios/`, { headers: getAuthHeaders(false) }),
      ]);

      const [rolesData, privilegiosData, asignacionesData] = await Promise.all([
        rolesRes.json(),
        privilegiosRes.json(),
        asignacionesRes.json(),
      ]);

      if (!rolesRes.ok || !privilegiosRes.ok || !asignacionesRes.ok) {
        setError('No se pudieron cargar todos los datos de roles/permisos.');
      }

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPrivilegios(Array.isArray(privilegiosData) ? privilegiosData : []);
      setAsignaciones(Array.isArray(asignacionesData) ? asignacionesData : []);
    } catch (error) {
      setError('Error cargando datos de roles/permisos.');
    }
  };

  const crearRol = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/roles/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(nuevoRol),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo crear rol.');

    setNuevoRol({ nombre: '', descripcion: '' });
    await cargarDatos();
  };

  const eliminarRol = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este rol?')) return;

    const res = await fetch(`${API}/roles/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo eliminar rol.');

    await cargarDatos();
  };

  const abrirEdicionRol = (rol) => {
    setRolEdicion(rol);
    setEditRol({ nombre: rol.nombre || '', descripcion: rol.descripcion || '' });
  };

  const guardarEdicionRol = async (e) => {
    e.preventDefault();
    if (!rolEdicion) return;

    const res = await fetch(`${API}/roles/${rolEdicion.codigo}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(editRol),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo actualizar rol.');

    setRolEdicion(null);
    await cargarDatos();
  };

  const crearPrivilegio = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/privilegios/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(nuevoPrivilegio),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo crear privilegio.');

    setNuevoPrivilegio({ nombre: '', descripcion: '' });
    await cargarDatos();
  };

  const eliminarPrivilegio = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este privilegio?')) return;

    const res = await fetch(`${API}/privilegios/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo eliminar privilegio.');

    await cargarDatos();
  };

  const abrirEdicionPrivilegio = (privilegio) => {
    setPrivilegioEdicion(privilegio);
    setEditPrivilegio({ nombre: privilegio.nombre || '', descripcion: privilegio.descripcion || '' });
  };

  const guardarEdicionPrivilegio = async (e) => {
    e.preventDefault();
    if (!privilegioEdicion) return;

    const res = await fetch(`${API}/privilegios/${privilegioEdicion.codigo}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(editPrivilegio),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo actualizar privilegio.');

    setPrivilegioEdicion(null);
    await cargarDatos();
  };

  const asignarPrivilegio = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/roles-privilegios/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(asignacion),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo asignar privilegio.');

    setAsignacion({ id_rol: '', id_privilegio: '' });
    await cargarDatos();
  };

  const revocarPrivilegio = async (idRol, idPrivilegio) => {
    const res = await fetch(`${API}/roles-privilegios/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id_rol: idRol, id_privilegio: idPrivilegio }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo revocar privilegio.');

    await cargarDatos();
  };

  return (
    <div className="app-container roles-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/roles-permisos/fondo-roles-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/roles-permisos/fondo-roles-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestión de Roles y Permisos (CU03/CU04)</h2>
          <div className="page-subtitle">Administración de roles, privilegios y asignaciones del sistema</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/usuarios')} className="btn-secondary">Ir a Usuarios</button>
          <button onClick={() => navigate('/bitacora')} className="btn-secondary">Ir a Bitácora</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="roles-content">
        <div className="bitacora-panel roles-panel">
          <h3 className="usuarios-panel-title">Roles</h3>
          <form onSubmit={crearRol}>
            <div className="input-group">
              <label>Nombre del rol</label>
              <input
                value={nuevoRol.nombre}
                onChange={(e) => setNuevoRol({ ...nuevoRol, nombre: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Descripción</label>
              <input
                value={nuevoRol.descripcion}
                onChange={(e) => setNuevoRol({ ...nuevoRol, descripcion: e.target.value })}
              />
            </div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter">Crear rol</button>
          </form>

          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((rol) => (
                  <tr key={rol.codigo}>
                    <td>{repairText(rol.nombre)}</td>
                    <td>
                      <button onClick={() => abrirEdicionRol(rol)} className="table-action-btn table-action-btn--edit">Editar</button>
                      <button onClick={() => eliminarRol(rol.codigo)} className="table-action-btn table-action-btn--danger">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bitacora-panel roles-panel">
          <h3 className="usuarios-panel-title">Privilegios</h3>
          <form onSubmit={crearPrivilegio}>
            <div className="input-group">
              <label>Nombre del privilegio</label>
              <input
                value={nuevoPrivilegio.nombre}
                onChange={(e) => setNuevoPrivilegio({ ...nuevoPrivilegio, nombre: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Descripción</label>
              <input
                value={nuevoPrivilegio.descripcion}
                onChange={(e) => setNuevoPrivilegio({ ...nuevoPrivilegio, descripcion: e.target.value })}
              />
            </div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter">Crear privilegio</button>
          </form>

          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Privilegio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {privilegios.map((privilegio) => (
                  <tr key={privilegio.codigo}>
                    <td>{repairText(privilegio.nombre)}</td>
                    <td>
                      <button onClick={() => abrirEdicionPrivilegio(privilegio)} className="table-action-btn table-action-btn--edit">Editar</button>
                      <button onClick={() => eliminarPrivilegio(privilegio.codigo)} className="table-action-btn table-action-btn--danger">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bitacora-panel roles-assign-panel">
        <h3 className="usuarios-panel-title">Asignar / Revocar Permisos por Rol</h3>
        <form onSubmit={asignarPrivilegio} className="roles-assign-form">
          <div className="input-group">
            <label>Rol</label>
            <select
              required
              value={asignacion.id_rol}
              onChange={(e) => setAsignacion({ ...asignacion, id_rol: e.target.value })}
            >
              <option value="">Selecciona rol</option>
              {roles.map((rol) => <option key={rol.codigo} value={rol.codigo}>{repairText(rol.nombre)}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Privilegio</label>
            <select
              required
              value={asignacion.id_privilegio}
              onChange={(e) => setAsignacion({ ...asignacion, id_privilegio: e.target.value })}
            >
              <option value="">Selecciona privilegio</option>
              {privilegios.map((privilegio) => <option key={privilegio.codigo} value={privilegio.codigo}>{repairText(privilegio.nombre)}</option>)}
            </select>
          </div>
          <button type="submit" className="bitacora-btn bitacora-btn--filter">Asignar</button>
        </form>

        <div className="bitacora-table-wrap">
          <table className="bitacora-table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Privilegio</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((item, idx) => (
                <tr key={`${item.id_rol}-${item.id_privilegio}-${idx}`}>
                  <td>{repairText(item.rol_nombre)}</td>
                  <td>{repairText(item.privilegio_nombre)}</td>
                  <td>
                    <button onClick={() => revocarPrivilegio(item.id_rol, item.id_privilegio)} className="table-action-btn table-action-btn--danger">Revocar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rolEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar rol</h3>
            <form onSubmit={guardarEdicionRol}>
              <div className="input-group"><label>Nombre</label><input value={editRol.nombre} onChange={(e) => setEditRol({ ...editRol, nombre: e.target.value })} required /></div>
              <div className="input-group"><label>Descripción</label><input value={editRol.descripcion} onChange={(e) => setEditRol({ ...editRol, descripcion: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setRolEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {privilegioEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar privilegio</h3>
            <form onSubmit={guardarEdicionPrivilegio}>
              <div className="input-group"><label>Nombre</label><input value={editPrivilegio.nombre} onChange={(e) => setEditPrivilegio({ ...editPrivilegio, nombre: e.target.value })} required /></div>
              <div className="input-group"><label>Descripción</label><input value={editPrivilegio.descripcion} onChange={(e) => setEditPrivilegio({ ...editPrivilegio, descripcion: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setPrivilegioEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermisos;