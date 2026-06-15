import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const Proveedores = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    empresa: '',
    nit: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [proveedorEdicion, setProveedorEdicion] = useState(null);
  const [editForm, setEditForm] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const consultarProveedor = () => {
    cargarProveedores();
  };

  const actualizarProveedor = async (proveedorActualizado) => {
    setProveedorEdicion(proveedorActualizado);
    setEditForm({
      empresa: proveedorActualizado.empresa || '',
      contacto: proveedorActualizado.contacto || '',
      telefono: proveedorActualizado.telefono || '',
      email: proveedorActualizado.email || '',
      direccion: proveedorActualizado.direccion || '',
    });
  };

  const registrarNuevoProveedor = async (e) => {
    await crearProveedor(e);
  };

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
        'CU13',
        ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
        usuarioLocal?.rol
      );
      if (!permitido) {
        alert('Acceso denegado para gestión de proveedores.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }

      cargarProveedores();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  const cargarProveedores = async () => {
    try {
      setError('');
      const res = await fetch(`${API}/proveedores/`, {
        headers: headers(false),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudo cargar proveedores.');
      setProveedores(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexión cargando proveedores.');
    }
  };

  const crearProveedor = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/proveedores/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(nuevo),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));
    setNuevo({ empresa: '', nit: '', contacto: '', telefono: '', email: '', direccion: '' });
    await cargarProveedores();
  };

  const abrirEdicion = (proveedor) => {
    setProveedorEdicion(proveedor);
    setEditForm({
      empresa: proveedor.empresa || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!proveedorEdicion) return;

    const res = await fetch(`${API}/proveedores/${proveedorEdicion.codigo}/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));

    setProveedorEdicion(null);
    await cargarProveedores();
  };

  const eliminarProveedor = async (proveedor) => {
    if (!window.confirm(`¿Eliminar proveedor ${proveedor.empresa}?`)) return;
    setError('');
    const res = await fetch(`${API}/proveedores/${proveedor.codigo}/`, {
      method: 'DELETE',
      headers: headers(false),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo eliminar el proveedor.');
    await cargarProveedores();
  };

  return (
    <div className="app-container proveedores-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/proveedores/fondo-proveedores-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/proveedores/fondo-proveedores-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestión de Proveedores (CU13)</h2>
          <div className="page-subtitle">Administración de proveedores y datos de contacto para compras del taller</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="proveedores-content">
        <div className="bitacora-panel proveedores-form-panel">
          <h3 className="usuarios-panel-title">Registrar proveedor</h3>
          <form onSubmit={crearProveedor}>
            <div className="input-group"><label>Empresa</label><input value={nuevo.empresa} onChange={(e) => setNuevo({ ...nuevo, empresa: e.target.value })} required /></div>
            <div className="input-group"><label>NIT</label><input value={nuevo.nit} onChange={(e) => setNuevo({ ...nuevo, nit: e.target.value })} required /></div>
            <div className="input-group"><label>Contacto</label><input value={nuevo.contacto} onChange={(e) => setNuevo({ ...nuevo, contacto: e.target.value })} /></div>
            <div className="input-group"><label>Teléfono</label><input value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} /></div>
            <div className="input-group"><label>Email</label><input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></div>
            <div className="input-group"><label>Dirección</label><input value={nuevo.direccion} onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })} /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '4px' }}>Crear proveedor</button>
          </form>
        </div>

        <div className="bitacora-panel proveedores-list-panel">
          <h3 className="usuarios-panel-title">Listado de proveedores</h3>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Empresa</th>
                  <th>NIT</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }}>No hay proveedores registrados.</td></tr>
                ) : (
                  proveedores.map((p) => (
                    <tr key={p.codigo}>
                      <td>#{p.codigo}</td>
                      <td>{p.empresa}</td>
                      <td>{p.nit}</td>
                      <td>{p.contacto || '-'}</td>
                      <td>{p.telefono || '-'}</td>
                      <td>{p.email || '-'}</td>
                      <td>{p.direccion || '-'}</td>
                      <td>
                        <button onClick={() => abrirEdicion(p)} className="table-action-btn table-action-btn--edit">Editar</button>
                        <button onClick={() => eliminarProveedor(p)} className="table-action-btn table-action-btn--danger">Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {proveedorEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar proveedor</h3>
            <form onSubmit={guardarEdicion}>
              <div className="input-group"><label>Empresa</label><input value={editForm.empresa} onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })} required /></div>
              <div className="input-group"><label>Contacto</label><input value={editForm.contacto} onChange={(e) => setEditForm({ ...editForm, contacto: e.target.value })} /></div>
              <div className="input-group"><label>Teléfono</label><input value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} /></div>
              <div className="input-group"><label>Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div className="input-group"><label>Dirección</label><input value={editForm.direccion} onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setProveedorEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
