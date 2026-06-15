import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { PASSWORD_POLICY_MESSAGE, validateStrongPassword } from './passwordPolicy';
import { API_BASE_URL } from './config';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

const Perfil = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [perfil, setPerfil] = useState({ nombre: '', email: '', telefono: '', rol_nombre: '' });
  const [permisosPerfil, setPermisosPerfil] = useState([]);
  const [permisosCargando, setPermisosCargando] = useState(false);
  const [passwords, setPasswords] = useState({ password_actual: '', password_nueva: '', password_confirmacion: '' });

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  const cargarPermisosPerfil = async (rolNombre) => {
    setPermisosCargando(true);
    try {
      const res = await fetch(`${API}/permisos/`, { headers: headers(false) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar los permisos del perfil.');
        return;
      }

      const filtrados = data.filter(
        (permiso) => permiso.rol_nombre === rolNombre && permiso.permitido
      );
      setPermisosPerfil(filtrados);
    } catch (err) {
      console.error('Error cargando permisos del perfil:', err);
      setError('No se pudo cargar los permisos del perfil.');
    } finally {
      setPermisosCargando(false);
    }
  };

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }
    cargarPerfil();
  }, [navigate, usuarioLocal]);

  const cargarPerfil = async () => {
    setError('');
    const res = await fetch(`${API}/perfil/`, { headers: headers(false) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo cargar perfil.');
    setPerfil(data);
    if (data.rol_nombre) {
      cargarPermisosPerfil(data.rol_nombre);
    }
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    const res = await fetch(`${API}/perfil/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ nombre: perfil.nombre, telefono: perfil.telefono }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || JSON.stringify(data.errores || {}));

    const usuarioLs = JSON.parse(localStorage.getItem('usuario'));
    localStorage.setItem('usuario', JSON.stringify({ ...usuarioLs, nombre: perfil.nombre }));
    setOk('Perfil actualizado correctamente.');
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');

    const passwordError = validateStrongPassword(passwords.password_nueva);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (passwords.password_nueva !== passwords.password_confirmacion) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    const res = await fetch(`${API}/perfil/`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(passwords),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'No se pudo actualizar contraseña.');

    setPasswords({ password_actual: '', password_nueva: '', password_confirmacion: '' });
    setOk('Contraseña actualizada correctamente.');
  };

  return (
    <div className="app-container perfil-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/perfil/fondo-perfil-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/perfil/fondo-perfil-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Mi Perfil (CU17)</h2>
          <div className="page-subtitle">Datos personales, seguridad de la cuenta y accesos asignados</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}
      {ok && <div className="success-box" style={{ marginTop: '20px' }}>{ok}</div>}

      <div className="perfil-content">
        <div className="bitacora-panel perfil-panel">
          <h3 className="usuarios-panel-title">Datos personales</h3>
          <form onSubmit={guardarPerfil}>
            <div className="input-group"><label>Nombre</label><input value={perfil.nombre || ''} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} required /></div>
            <div className="input-group"><label>Email</label><input value={perfil.email || ''} readOnly /></div>
            <div className="input-group"><label>Teléfono</label><input value={perfil.telefono || ''} onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} /></div>
            <div className="input-group"><label>Rol</label><input value={perfil.rol_nombre || ''} readOnly /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '4px' }}>Guardar perfil</button>
          </form>
        </div>

        <div className="bitacora-panel perfil-panel">
          <h3 className="usuarios-panel-title">Cambiar contraseña</h3>
          <p className="perfil-password-hint">{PASSWORD_POLICY_MESSAGE}</p>
          <form onSubmit={cambiarPassword}>
            <div className="input-group"><label>Contraseña actual</label><input type="password" value={passwords.password_actual} onChange={(e) => setPasswords({ ...passwords, password_actual: e.target.value })} required /></div>
            <div className="input-group"><label>Nueva contraseña</label><input type="password" value={passwords.password_nueva} onChange={(e) => setPasswords({ ...passwords, password_nueva: e.target.value })} required /></div>
            <div className="input-group"><label>Confirmar nueva contraseña</label><input type="password" value={passwords.password_confirmacion} onChange={(e) => setPasswords({ ...passwords, password_confirmacion: e.target.value })} required /></div>
            <button type="submit" className="bitacora-btn bitacora-btn--filter" style={{ marginTop: '4px' }}>Actualizar contraseña</button>
          </form>
        </div>

        <div className="bitacora-panel perfil-panel perfil-accesos-panel">
          <h3 className="usuarios-panel-title">Accesos asignados</h3>
          {permisosCargando ? (
            <p>Cargando permisos...</p>
          ) : permisosPerfil.length === 0 ? (
            <p>No hay permisos asignados para este rol.</p>
          ) : (
            <div className="perfil-permisos-list">
              {Object.values(
                permisosPerfil.reduce((acc, permiso) => {
                  const key = `${permiso.codigo_cu}_${permiso.nombre_modulo}`;
                  if (!acc[key]) {
                    acc[key] = {
                      codigo_cu: permiso.codigo_cu,
                      nombre_modulo: permiso.nombre_modulo,
                      acciones: [],
                    };
                  }
                  acc[key].acciones.push(permiso.accion);
                  return acc;
                }, {})
              )
                .sort((a, b) => a.codigo_cu.localeCompare(b.codigo_cu))
                .map((permiso) => (
                <div key={`${permiso.codigo_cu}_${permiso.nombre_modulo}`} className="perfil-permiso-item">
                  <strong>{permiso.codigo_cu} – {repairText(permiso.nombre_modulo)}</strong>
                  <div className="perfil-permiso-acciones">{permiso.acciones.join(', ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;