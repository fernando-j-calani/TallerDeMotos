// frontend/src/Usuarios.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reutilizamos los colores y estilos base
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';

const CLIENT_TEMP_PASSWORD = 'zaq12wsx';

const normalizarTextoCorreo = (texto) => {
  return (texto || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

const generarCorreoCliente = (nombreCompleto, usuariosActuales = []) => {
  const base = normalizarTextoCorreo(nombreCompleto) || 'cliente';
  const existentes = new Set(usuariosActuales.map((usuario) => (usuario.email || '').toLowerCase()));

  let candidato = `${base}@laroca.com`;
  let contador = 1;

  while (existentes.has(candidato)) {
    candidato = `${base}${contador}@laroca.com`;
    contador += 1;
  }

  return candidato;
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [clientesElegibles, setClientesElegibles] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [mostrarGeneradorCliente, setMostrarGeneradorCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const navigate = useNavigate();
  const usuarioLocal = JSON.parse(localStorage.getItem('usuario'));

  // Estado para el formulario del nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '', email: '', password: '', telefono: '', id_rol: '', cedula: ''
  });
  const [usuarioEdicion, setUsuarioEdicion] = useState(null);
  const [editUsuario, setEditUsuario] = useState({ nombre: '', email: '', telefono: '', id_rol: '' });

    useEffect(() => {
        // 1. Verificamos la seguridad
        const usuarioLocal = JSON.parse(localStorage.getItem('usuario'));
        if (!usuarioLocal || usuarioLocal.rol !== 'Administrador') {
        alert("Acceso denegado: Solo el Administrador puede gestionar usuarios.");
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
        }
        
        // 2. Cargamos los datos (solo si somos administradores)
        cargarDatos();
        
        // El arreglo vacío [] es OBLIGATORIO para evitar el bucle infinito.
        // Le dice a React: "Ejecuta esto SOLO UNA VEZ al montar el componente".
    }, [navigate]);

  const cargarDatos = () => {
    const token = localStorage.getItem('token');
    setError('');
    setOk('');

    // Pedimos los usuarios
    fetch(`${API_BASE_URL}/api/usuarios/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar usuarios.');
        setUsuarios(data);
      })
      .catch((err) => setError(err.message));
    
    // Pedimos los roles (Para llenar el "select" del formulario)
    fetch(`${API_BASE_URL}/api/roles/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar roles.');
        setRoles(data);
      })
      .catch((err) => setError(err.message));
  };

  const cargarClientesElegibles = async () => {
    try {
      setError('');
      setOk('');
      const token = localStorage.getItem('token');
      const [clientesRes, usuariosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/clientes/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/usuarios/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [clientesData, usuariosData] = await Promise.all([
        clientesRes.json(),
        usuariosRes.json(),
      ]);

      if (!clientesRes.ok) throw new Error(clientesData.error || 'No se pudo cargar clientes.');
      if (!usuariosRes.ok) throw new Error(usuariosData.error || 'No se pudo cargar usuarios.');

      const usuariosClienteActivos = new Set(
        (Array.isArray(usuariosData) ? usuariosData : [])
          .filter((usuario) => (usuario.rol_nombre || '') === 'Cliente' && (usuario.estado || 'Activo') === 'Activo')
          .map((usuario) => (usuario.nombre || '').trim().toLowerCase())
      );

      const elegibles = (Array.isArray(clientesData) ? clientesData : []).filter((cliente) => {
        if ((cliente.estado || 'Activo') !== 'Activo') return false;
        return !usuariosClienteActivos.has((cliente.nombre || '').trim().toLowerCase());
      });

      setClientesElegibles(elegibles);
      setMostrarGeneradorCliente(true);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los clientes elegibles.');
    }
  };

  const crearUsuarioCliente = async (cliente) => {
    try {
      setError('');
      setOk('');
      const token = localStorage.getItem('token');
      const rolCliente = roles.find((rol) => rol.nombre === 'Cliente');

      if (!rolCliente) {
        setError('No se encontró el rol Cliente.');
        return;
      }

      const email = generarCorreoCliente(cliente.nombre, usuarios);
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: cliente.nombre,
          email,
          password: CLIENT_TEMP_PASSWORD,
          telefono: cliente.telefono || '',
          id_rol: rolCliente.codigo,
        }),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error || 'No se pudo generar el usuario del cliente.');
        return;
      }

      setOk(`Usuario generado para ${cliente.nombre} con email ${email} y contraseña temporal ${CLIENT_TEMP_PASSWORD}.`);
      await cargarDatos();
      await cargarClientesElegibles();
    } catch {
      setError('Error de conexión al generar usuario cliente.');
    }
  };

  const manejarCambio = (e) => {
    setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
  };

  const rolSeleccionadoEsCliente = roles.some(
    (rol) => String(rol.codigo) === String(nuevoUsuario.id_rol) && (rol.nombre || '').trim().toLowerCase() === 'cliente'
  );

  const crearUsuario = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...nuevoUsuario,
        })
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        setError('');
        setNuevoUsuario({ nombre: '', email: '', password: '', telefono: '', id_rol: '', cedula: '' }); // Limpiar formulario
        cargarDatos(); // Recargar la tabla
      } else {
        setError(datos.error || 'No se pudo crear usuario.');
      }
    } catch (error) {
      setError("Error de conexión al servidor");
    }
  };

  const abrirEdicionUsuario = (usuario) => {
    setUsuarioEdicion(usuario);
    setEditUsuario({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      id_rol: String(usuario.id_rol || ''),
    });
  };

  const guardarEdicionUsuario = async (e) => {
    e.preventDefault();
    if (!usuarioEdicion) return;

    const idRol = parseInt(editUsuario.id_rol, 10);
    if (Number.isNaN(idRol)) return setError('ID de rol inválido.');

    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/${usuarioEdicion.codigo}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: editUsuario.nombre, email: editUsuario.email, telefono: editUsuario.telefono, id_rol: idRol }),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error || 'No se pudo editar usuario.');
        return;
      }

      setError('');
      setUsuarioEdicion(null);
      cargarDatos();
    } catch {
      setError('Error de conexión al editar usuario.');
    }
  };

  const cambiarEstadoUsuario = async (usuario) => {
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';

    if (!window.confirm(`¿Cambiar estado de ${usuario.nombre} a ${nuevoEstado}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario.codigo}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error || 'No se pudo actualizar estado.');
        return;
      }

      setError('');
      cargarDatos();
    } catch {
      setError('Error de conexión al cambiar estado.');
    }
  };

  return (
    <div className="app-container usuarios-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/usuarios/fondo-usuarios-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/usuarios/fondo-usuarios-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Gestión de Usuarios (CU02)</h2>
          <div className="page-subtitle">Administración de cuentas, roles y accesos del sistema</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/roles-permisos')} className="btn-secondary">Roles y Permisos</button>
          <button onClick={cargarClientesElegibles} className="btn-primary">Generar usuario cliente</button>
          <button onClick={() => navigate('/bitacora')} className="btn-secondary">Ir a Bitácora</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}
      {ok && <div className="success-box" style={{ marginTop: '20px' }}>{ok}</div>}

      <div className="usuarios-content">
        {/* PANEL IZQUIERDO: Formulario para Crear Usuario */}
        <div className="bitacora-panel usuarios-form-panel">
          <h3 className="usuarios-panel-title">Crear Nuevo Usuario</h3>
          <form onSubmit={crearUsuario}>
            <div className="input-group">
              <label>Nombre Completo</label>
              <input type="text" name="nombre" value={nuevoUsuario.nombre} onChange={manejarCambio} required />
            </div>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input type="email" name="email" value={nuevoUsuario.email} onChange={manejarCambio} required />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input type="password" name="password" value={nuevoUsuario.password} onChange={manejarCambio} required />
            </div>
            <div className="input-group">
              <label>Teléfono</label>
              <input type="text" name="telefono" value={nuevoUsuario.telefono} onChange={manejarCambio} />
            </div>
            <div className="input-group">
              <label>Rol del Sistema</label>
              <select name="id_rol" value={nuevoUsuario.id_rol} onChange={manejarCambio} required>
                <option value="">-- Seleccione un Rol --</option>
                {roles.map(rol => (
                  <option key={rol.codigo} value={rol.codigo}>{repairText(rol.nombre)}</option>
                ))}
              </select>
            </div>
            {rolSeleccionadoEsCliente && (
              <div className="input-group">
                <label>Cédula del Cliente</label>
                <input type="text" name="cedula" value={nuevoUsuario.cedula} onChange={manejarCambio} required />
              </div>
            )}
            <button type="submit" className="bitacora-btn bitacora-btn--filter">Registrar Usuario</button>
          </form>
        </div>

        {/* PANEL DERECHO: Tabla de Usuarios Existentes */}
        <div className="bitacora-panel usuarios-table-panel">
          <h3 className="usuarios-panel-title">Usuarios del Sistema</h3>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.codigo}>
                    <td>{repairText(u.nombre)}</td>
                    <td>{u.email}</td>
                    <td className="bitacora-user">{repairText(u.rol_nombre)}</td>
                    <td>
                      <span className={`usuario-status-badge ${u.estado === 'Activo' ? 'usuario-status-badge--activo' : 'usuario-status-badge--inactivo'}`}>
                        {u.estado}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => abrirEdicionUsuario(u)} className="table-action-btn table-action-btn--edit">
                        Editar
                      </button>
                      <button onClick={() => cambiarEstadoUsuario(u)} className={`table-action-btn ${u.estado === 'Activo' ? 'table-action-btn--danger' : 'table-action-btn--success'}`}>
                        {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {usuarioEdicion && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--sm">
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Editar usuario</h3>
            <form onSubmit={guardarEdicionUsuario}>
              <div className="input-group">
                <label>Nombre</label>
                <input value={editUsuario.nombre} onChange={(e) => setEditUsuario({ ...editUsuario, nombre: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Correo Electrónico</label>
                <input type="email" value={editUsuario.email} onChange={(e) => setEditUsuario({ ...editUsuario, email: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input value={editUsuario.telefono} onChange={(e) => setEditUsuario({ ...editUsuario, telefono: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Rol</label>
                <select
                  value={editUsuario.id_rol}
                  onChange={(e) => setEditUsuario({ ...editUsuario, id_rol: e.target.value })}
                  required
                >
                  <option value="">-- Seleccione un Rol --</option>
                  {roles.map((rol) => (
                    <option key={rol.codigo} value={rol.codigo}>{repairText(rol.nombre)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setUsuarioEdicion(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="bitacora-btn bitacora-btn--filter">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarGeneradorCliente && (
        <div className="usuarios-modal-overlay">
          <div className="usuarios-modal usuarios-modal--lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-accent)' }}>Generar usuario cliente</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>Se muestran solo clientes activos que aún no tienen una cuenta Cliente activa.</p>
              </div>
              <button type="button" onClick={() => setMostrarGeneradorCliente(false)} className="btn-secondary">Cerrar</button>
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Buscar cliente</label>
              <input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Nombre o cédula" />
            </div>

            <div style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
              Contraseña temporal: <strong style={{ color: 'var(--color-accent)' }}>{CLIENT_TEMP_PASSWORD}</strong>
            </div>

            <div className="bitacora-table-wrap">
              <table className="bitacora-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Email sugerido</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesElegibles
                    .filter((cliente) => {
                      const filtro = busquedaCliente.trim().toLowerCase();
                      if (!filtro) return true;
                      return (cliente.nombre || '').toLowerCase().includes(filtro) || (cliente.cedula || '').toLowerCase().includes(filtro);
                    })
                    .map((cliente) => {
                      const emailSugerido = generarCorreoCliente(cliente.nombre, usuarios);
                      return (
                        <tr key={cliente.codigo}>
                          <td>{cliente.nombre}</td>
                          <td>{cliente.cedula}</td>
                          <td>{cliente.telefono || '-'}</td>
                          <td className="bitacora-user">{emailSugerido}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => crearUsuarioCliente(cliente)}
                              className="table-action-btn table-action-btn--success"
                            >
                              Crear cuenta
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {clientesElegibles.filter((cliente) => {
                    const filtro = busquedaCliente.trim().toLowerCase();
                    if (!filtro) return true;
                    return (cliente.nombre || '').toLowerCase().includes(filtro) || (cliente.cedula || '').toLowerCase().includes(filtro);
                  }).length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No hay clientes elegibles para generar usuario.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;