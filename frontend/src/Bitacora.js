import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reutilizamos tu fondo oscuro
import { logoutUniversal } from './auth';
import { formatServerDateToLaPaz, repairText } from './textNormalization';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const Bitacora = () => {
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', usuario: '', accion: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Obtenemos los datos del usuario logueado
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);

  useEffect(() => {
    // Si no hay usuario logueado, lo pateamos de vuelta al Login
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    cargarBitacora();
  }, [navigate, usuarioLocal]);

  const cargarBitacora = async (f = filtros) => {
    setError('');
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (f.fecha_desde) params.append('fecha_desde', f.fecha_desde);
    if (f.fecha_hasta) params.append('fecha_hasta', f.fecha_hasta);
    if (f.usuario) params.append('usuario', f.usuario);
    if (f.accion) params.append('accion', f.accion);

    const query = params.toString();
    const url = query ? `${API}/bitacora/?${query}` : `${API}/bitacora/`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      setError(repairText(data.error || 'No se pudo cargar bitacora.'));
      setRegistros([]);
      return;
    }

    setRegistros(Array.isArray(data) ? data : []);
  };

  const exportarCsv = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros.usuario) params.append('usuario', filtros.usuario);
    if (filtros.accion) params.append('accion', filtros.accion);
    params.append('export', 'csv');

    const response = await fetch(`${API}/bitacora/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setError('No se pudo exportar CSV.');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitacora.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

const cerrarSesion = async () => {
    await logoutUniversal();
  navigate('/login');
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600' }}>Bitácora de Auditoría (CU20)</h2>
        <div>
          <span style={{ marginRight: '20px' }}>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          {/* NUEVO BOTÓN DE NAVEGACIÓN */}
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/usuarios')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Gestión de Usuarios
            </button>
          )}
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/roles-permisos')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Roles y Permisos
            </button>
          )}
          {(usuarioLocal?.rol === 'Administrador' || usuarioLocal?.rol === 'Recepcionista') && (
            <button onClick={() => navigate('/clientes')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Clientes
            </button>
          )}
          {(usuarioLocal?.rol === 'Administrador' || usuarioLocal?.rol === 'Recepcionista') && (
            <button onClick={() => navigate('/motocicletas')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Motocicletas
            </button>
          )}
          {(usuarioLocal?.rol === 'Administrador' || usuarioLocal?.rol === 'Recepcionista') && (
            <button onClick={() => navigate('/cotizaciones')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Cotizaciones
            </button>
          )}
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/proveedores')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Proveedores
            </button>
          )}
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/productos')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Productos
            </button>
          )}
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/compras')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Compras
            </button>
          )}
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/inventario')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Inventario
            </button>
          )}
          <button onClick={() => navigate('/perfil')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Mi Perfil
          </button>

          <button onClick={cerrarSesion} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        {error && <div className="error-box" style={{ marginBottom: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <input type="date" value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }} />
          <input type="date" value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }} />
          <input placeholder="ID usuario" value={filtros.usuario} onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })} style={{ padding: '8px', width: '130px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }} />
          <input placeholder="Acción" value={filtros.accion} onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })} style={{ padding: '8px', width: '160px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }} />
          <button onClick={() => cargarBitacora()} style={{ padding: '8px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Filtrar</button>
          <button onClick={() => { const limpio = { fecha_desde: '', fecha_hasta: '', usuario: '', accion: '' }; setFiltros(limpio); cargarBitacora(limpio); }} style={{ padding: '8px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Limpiar</button>
          <button onClick={exportarCsv} style={{ padding: '8px 12px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Exportar CSV</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ff6600', color: '#ccc' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Fecha y Hora</th>
              <th style={{ padding: '12px' }}>Usuario</th>
              <th style={{ padding: '12px' }}>Acción</th>
              <th style={{ padding: '12px' }}>Descripción Detallada</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay registros en la bitácora aún.</td></tr>
            ) : (
              registros.map((reg) => (
                <tr key={reg.codigo} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px' }}>{reg.codigo}</td>
                  <td style={{ padding: '12px' }}>
                    {formatServerDateToLaPaz(reg.fecha_hora)}
                  </td>
                  <td style={{ padding: '12px', color: '#ff6600' }}>{repairText(reg.usuario_nombre)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {repairText(reg.accion)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{repairText(reg.descripcion)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bitacora;