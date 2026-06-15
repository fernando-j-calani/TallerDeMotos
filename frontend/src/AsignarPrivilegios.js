import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { normalizeRoleText, repairText } from './textNormalization';
import { API_BASE_URL } from './config';

const ROLES = ['Cliente', 'Mecanico', 'Recepcionista', 'Administrador'];
const ADMIN_ROLE = 'Administrador';
const ROLE_MAP = {
  cliente: 'Cliente',
  mecanico: 'Mecanico',
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
};

const PERMISOS_DATA = [
  {
    seccion: 'P1',
    nombre: 'Gestión de Accesos y Seguridad',
    modulos: [
      {
        cu: 'CU01',
        nombre: 'Gestionar Inicio y Cierre de Sesión',
        acciones: ['Mostrar', 'Buscar', 'Eliminar'],
      },
      {
        cu: 'CU02',
        nombre: 'Gestionar Usuarios y Asignar Roles',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU03',
        nombre: 'Gestionar Roles y Asignar Permisos',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU04',
        nombre: 'Gestionar Permisos',
        acciones: ['Mostrar', 'Editar'],
      },
    ],
  },
  {
    seccion: 'P2',
    nombre: 'Gestión de Clientes y Vehículos',
    modulos: [
      {
        cu: 'CU05',
        nombre: 'Gestionar Clientes',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU06',
        nombre: 'Gestionar Motocicletas',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU15',
        nombre: 'Consultar Historial de Mantenimiento',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar'],
      },
      {
        cu: 'CU16',
        nombre: 'Dar Seguimiento para Clientes',
        acciones: ['Mostrar', 'Buscar', 'Exportar'],
      },
    ],
  },
  {
    seccion: 'P3',
    nombre: 'Gestión de Servicio Técnico',
    modulos: [
      {
        cu: 'CU07',
        nombre: 'Elaborar Cotizaciones',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU08',
        nombre: 'Gestionar Órdenes de Trabajo',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU09',
        nombre: 'Redactar Notas de Trabajo',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU14',
        nombre: 'Emitir Facturación',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar', 'Imprimir'],
      },
    ],
  },
  {
    seccion: 'P4',
    nombre: 'Gestión de Inventario y Suministros',
    modulos: [
      {
        cu: 'CU10',
        nombre: 'Gestionar Productos (Repuestos)',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU11',
        nombre: 'Monitorear Inventario',
        acciones: ['Mostrar', 'Buscar', 'Reportes'],
      },
      {
        cu: 'CU12',
        nombre: 'Procesar Compras a Proveedores',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
      {
        cu: 'CU13',
        nombre: 'Administrar Proveedores',
        acciones: ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar', 'Editar'],
      },
    ],
  },
  {
    seccion: 'P5',
    nombre: 'Configuración y Analítica',
    modulos: [
      {
        cu: 'CU17',
        nombre: 'Configuración de Perfil Personal',
        acciones: ['Mostrar', 'Editar'],
      },
      {
        cu: 'CU18',
        nombre: 'Generar Reportes',
        acciones: ['Mostrar', 'Buscar', 'Exportar', 'Descargar'],
      },
      {
        cu: 'CU19',
        nombre: 'Visualizar Dashboard Analítico',
        acciones: ['Mostrar', 'Exportar'],
      },
      {
        cu: 'CU20',
        nombre: 'Auditoría de Operaciones – Bitácora',
        acciones: ['Mostrar', 'Buscar', 'Exportar'],
      },
    ],
  },
];

const moduloLookup = (() => {
  const lookup = new Map();
  PERMISOS_DATA.forEach((seccion) => {
    seccion.modulos.forEach((modulo) => {
      lookup.set(modulo.cu, modulo);
    });
  });
  return lookup;
})();

const AsignarPrivilegios = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [permisos, setPermisos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuarioLocal || usuarioLocal.rol !== 'Administrador') {
      navigate('/login');
      return;
    }
    cargarPermisos();
  }, [navigate, usuarioLocal]);

  const cargarPermisos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/permisos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPermisos(buildPermissionsFromApiData(data));
      } else {
        initializePermissions();
      }
    } catch (err) {
      console.error('Error cargando permisos:', err);
      initializePermissions();
    } finally {
      setCargando(false);
    }
  };

  const buildPermissionsFromApiData = (rawPermisos) => {
    const permsObj = {};

    ROLES.forEach((rol) => {
      permsObj[rol] = {};
      PERMISOS_DATA.forEach((seccion) => {
        seccion.modulos.forEach((modulo) => {
          const key = `${modulo.cu}_${modulo.nombre}`;
          permsObj[rol][key] = {
            modulo: modulo,
            acciones: {},
          };
          modulo.acciones.forEach((accion) => {
            permsObj[rol][key].acciones[accion] = rol === ADMIN_ROLE;
          });
        });
      });
    });

    rawPermisos.forEach((permiso) => {
      const rolNormalizado = normalizeRoleText(permiso.rol_nombre);
      const rolNombre = ROLE_MAP[rolNormalizado] || repairText(permiso.rol_nombre);
      const modulo = moduloLookup.get(permiso.codigo_cu);
      const nombreModulo = modulo ? modulo.nombre : repairText(permiso.nombre_modulo);
      const key = `${permiso.codigo_cu}_${nombreModulo}`;

      if (!permsObj[rolNombre] || !permsObj[rolNombre][key]) {
        return;
      }

      permsObj[rolNombre][key].acciones[permiso.accion] = permiso.permitido;
    });

    return permsObj;
  };

  const initializePermissions = () => {
    const permsObj = {};
    ROLES.forEach((rol) => {
      permsObj[rol] = {};
      PERMISOS_DATA.forEach((seccion) => {
        seccion.modulos.forEach((modulo) => {
          const key = `${modulo.cu}_${modulo.nombre}`;
          permsObj[rol][key] = {
            modulo: modulo,
            acciones: {},
          };
          modulo.acciones.forEach((accion) => {
            permsObj[rol][key].acciones[accion] = rol === ADMIN_ROLE;
          });
        });
      });
    });
    setPermisos(permsObj);
  };

  const ensureAdminPermissions = (permsObj) => {
    const updated = { ...permsObj };
    if (!updated[ADMIN_ROLE]) {
      updated[ADMIN_ROLE] = {};
    }

    PERMISOS_DATA.forEach((seccion) => {
      seccion.modulos.forEach((modulo) => {
        const key = `${modulo.cu}_${modulo.nombre}`;
        if (!updated[ADMIN_ROLE][key]) {
          updated[ADMIN_ROLE][key] = { modulo, acciones: {} };
        }
        modulo.acciones.forEach((accion) => {
          updated[ADMIN_ROLE][key].acciones[accion] = true;
        });
      });
    });

    return updated;
  };

  const togglePermiso = (rol, cuNombre, accion) => {
    if (rol === ADMIN_ROLE) {
      return;
    }

    setPermisos((prev) => ({
      ...prev,
      [rol]: {
        ...prev[rol],
        [cuNombre]: {
          ...prev[rol][cuNombre],
          acciones: {
            ...prev[rol][cuNombre].acciones,
            [accion]: !prev[rol][cuNombre].acciones[accion],
          },
        },
      },
    }));
  };

  const toggleSelectAllRole = (rol) => {
    if (rol === ADMIN_ROLE) {
      return;
    }

    setPermisos((prev) => {
      const rolePerms = prev[rol] || {};
      const allSelected = Object.values(rolePerms).every((item) =>
        Object.values(item.acciones).every(Boolean)
      );

      const updatedRolePerms = Object.fromEntries(
        Object.entries(rolePerms).map(([cuNombre, item]) => [
          cuNombre,
          {
            ...item,
            acciones: Object.fromEntries(
              Object.entries(item.acciones).map(([accion]) => [accion, !allSelected])
            ),
          },
        ])
      );

      return {
        ...prev,
        [rol]: updatedRolePerms,
      };
    });
  };

  const goBack = () => {
    navigate(-1);
  };

  const guardarPermisos = async () => {
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const permisosAEnviar = ensureAdminPermissions(permisos);
      const response = await fetch(`${API_BASE_URL}/api/permisos/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permisosAEnviar),
      });
      let resultData = {};
      try {
        resultData = await response.json();
      } catch (jsonError) {
        console.warn('No JSON response from permisos API:', jsonError);
      }

      if (response.ok) {
        alert('Permisos guardados exitosamente');
        setPermisos(permisosAEnviar);
      } else {
        setError(resultData.error || resultData.mensaje || JSON.stringify(resultData) || 'Error al guardar los permisos');
      }
    } catch (err) {
      console.error('Error guardando permisos:', err);
      setError('Error al guardar los permisos');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="app-container privilegios-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/asignar-privilegios/fondo-privilegios-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/asignar-privilegios/fondo-privilegios-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Asignar Privilegios</h2>
          <div className="page-subtitle">El Administrador ve todo y asigna qué puede ver y hacer cada rol.</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={goBack} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      {cargando ? (
        <div className="bitacora-panel" style={{ marginTop: '20px' }}>Cargando...</div>
      ) : (
        <>
          {PERMISOS_DATA.map((seccion) => (
            <div key={seccion.seccion} className="bitacora-panel" style={{ marginTop: '20px' }}>
              <h3 className="usuarios-panel-title">{seccion.seccion}. {seccion.nombre}</h3>

              <div className="bitacora-table-wrap">
                <table className="bitacora-table privilegios-table">
                  <thead>
                    <tr className="privilegios-select-row">
                      <th></th>
                      {ROLES.map((rol) => (
                        <th key={`select-${rol}`}>
                          <button
                            type="button"
                            onClick={() => toggleSelectAllRole(rol)}
                            disabled={rol === ADMIN_ROLE}
                            className="bitacora-btn bitacora-btn--filter privilegios-select-all"
                          >
                            Seleccionar Todo
                          </button>
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th>Módulo / Acción</th>
                      {ROLES.map((rol) => (
                        <th key={rol}>{rol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seccion.modulos.map((modulo) => {
                      const cuNombreKey = `${modulo.cu}_${modulo.nombre}`;
                      return (
                        <React.Fragment key={cuNombreKey}>
                          <tr className="privilegios-row--modulo">
                            <td>{modulo.cu} – {modulo.nombre}</td>
                            {ROLES.map((rol) => (
                              <td key={rol} className="privilegios-cell">
                                <input
                                  type="checkbox"
                                  checked={permisos[rol]?.[cuNombreKey]?.acciones?.['Mostrar'] || false}
                                  onChange={() => togglePermiso(rol, cuNombreKey, 'Mostrar')}
                                  disabled={rol === ADMIN_ROLE}
                                />
                              </td>
                            ))}
                          </tr>
                          {modulo.acciones.map((accion) => (
                            <tr key={accion} className="privilegios-row--accion">
                              <td className="privilegios-accion-label">– {accion}</td>
                              {ROLES.map((rol) => (
                                <td key={rol} className="privilegios-cell">
                                  <input
                                    type="checkbox"
                                    checked={permisos[rol]?.[cuNombreKey]?.acciones?.[accion] || false}
                                    onChange={() => togglePermiso(rol, cuNombreKey, accion)}
                                    disabled={rol === ADMIN_ROLE}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="bitacora-panel" style={{ marginTop: '20px' }}>
            <div className="reportes-export-actions">
              <button onClick={guardarPermisos} disabled={guardando} className="bitacora-btn bitacora-btn--export">
                {guardando ? 'Guardando...' : 'Guardar Permisos'}
              </button>
              <button onClick={() => navigate('/inicio')} className="bitacora-btn bitacora-btn--clear">Cancelar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AsignarPrivilegios;