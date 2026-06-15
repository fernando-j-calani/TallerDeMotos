import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPermisosUsuario, tienePermisoCu } from './permissions';

const MENU_GROUPS = [
  {
    key: 'P1',
    label: 'P1',
    icon: 'fa-user-shield',
    items: [
      { label: 'CU01 – Iniciar/Cerrar Sesión', path: '/login', cu: 'CU01' },
      { label: 'CU02 – Administrar Usuarios', path: '/usuarios', cu: 'CU02' },
      { label: 'CU03 – Configurar Roles', path: '/roles-permisos', cu: 'CU03|CU04' },
      { label: 'CU04 – Gestionar Permisos', path: '/roles-permisos', cu: 'CU03|CU04' },
    ],
  },
  {
    key: 'P2',
    label: 'P2',
    icon: 'fa-motorcycle',
    items: [
      { label: 'CU05 – Gestionar Clientes', path: '/clientes', cu: 'CU05' },
      { label: 'CU06 – Gestionar Motocicletas', path: '/motocicletas', cu: 'CU06' },
      { label: 'CU15 – Historial de Mantenimiento', path: '/historial-mantenimiento', cu: 'CU15' },
      { label: 'CU16 – Gestionar Seguimiento para Clientes', path: '/seguimiento-clientes', cu: 'CU16' },
    ],
  },
  {
    key: 'P3',
    label: 'P3',
    icon: 'fa-file-invoice-dollar',
    items: [
      { label: 'CU07 – Elaborar Cotización', path: '/cotizaciones', cu: 'CU07' },
      { label: 'CU08 – Gestionar Órdenes de Trabajo', path: '/ordenes-trabajo', cu: 'CU08' },
      { label: 'CU09 – Redactar Notas de Trabajo', path: '/notas-trabajo', cu: 'CU09' },
      { label: 'CU14 – Emitir Facturación', path: '/facturacion', cu: 'CU14' },
    ],
  },
  {
    key: 'P4',
    label: 'P4',
    icon: 'fa-warehouse',
    items: [
      { label: 'CU12 – Procesar Compras a Proveedores', path: '/compras', cu: 'CU12' },
      { label: 'CU10 – Gestionar Productos (Repuestos)', path: '/productos', cu: 'CU10' },
      { label: 'CU11 – Monitorear Inventario', path: '/inventario', cu: 'CU11' },
      { label: 'CU13 – Administrar Proveedores', path: '/proveedores', cu: 'CU13' },
    ],
  },
  {
    key: 'P5',
    label: 'P5',
    icon: 'fa-chart-pie',
    items: [
      { label: 'CU17 – Configuración de Perfil Personal', path: '/perfil', cu: 'CU17' },
      { label: 'CU18 – Generar Reportes', path: '/reportes', cu: 'CU18' },
      { label: 'CU19 – Visualizar Dashboard Analítico', path: '/dashboard-analitico', cu: 'CU19' },
      { label: 'CU20 – Bitácora de Auditoría', path: '/bitacora', cu: 'CU20' },
    ],
  },
];

const AdminMenu = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const menuBarRef = useRef(null);
  const dropdownRefs = useRef({});

  const openMenu = (key) => setActive(key);
  const closeMenu = () => setActive('');

  const toggleMenu = (key) => {
    setActive((current) => (current === key ? '' : key));
  };

  // Cierra el desplegable automáticamente si el usuario no elige ninguna opción
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(''), 8000);
    return () => clearTimeout(timer);
  }, [active]);

  // Cierra el desplegable si el usuario hace clic fuera de la barra de menú
  useEffect(() => {
    if (!active) return;
    const handleClickOutside = (event) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target)) {
        setActive('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active]);

  // Si el desplegable se sale de la pantalla por la derecha, lo recorremos
  // hacia la izquierda lo justo para que quede dentro del área visible
  useEffect(() => {
    if (!active) return;
    const dropdownEl = dropdownRefs.current[active];
    if (!dropdownEl) return;
    dropdownEl.style.left = '0px';
    const rect = dropdownEl.getBoundingClientRect();
    const margin = 12;
    const overflowRight = rect.right - (window.innerWidth - margin);
    if (overflowRight > 0) {
      const maxShift = Math.max(rect.left - margin, 0);
      const shift = Math.min(overflowRight, maxShift);
      if (shift > 0) {
        dropdownEl.style.left = `-${shift}px`;
      }
    }
  }, [active]);

  useEffect(() => {
    let activo = true;
    if (!usuarioLocal) {
      setPermisos([]);
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    const cargarPermisos = async () => {
      const data = await fetchPermisosUsuario();
      if (activo) {
        setPermisos(data);
        setCargando(false);
      }
    };

    cargarPermisos();
    return () => {
      activo = false;
    };
  }, [usuarioLocal]);

  const gruposVisibles = useMemo(() => {
    if (!usuarioLocal) return [];
    if (usuarioLocal.rol === 'Administrador') return MENU_GROUPS;

    return MENU_GROUPS.map((group) => {
      const items = group.items.filter((item) => tienePermisoCu(permisos, item.cu, usuarioLocal?.rol));
      if (items.length === 0) return null;
      return { ...group, items };
    }).filter(Boolean);
  }, [permisos, usuarioLocal]);

  if (!usuarioLocal || (!cargando && gruposVisibles.length === 0)) {
    return null;
  }

  return (
    <div className="admin-menu-bar" ref={menuBarRef} onMouseLeave={closeMenu}>
      {gruposVisibles.map((group) => (
        <div key={group.key} className="admin-menu-group">
          <button
            type="button"
            onClick={() => toggleMenu(group.key)}
            onMouseEnter={() => openMenu(group.key)}
            className="admin-menu-button"
          >
            <i className={`fas ${group.icon}`}></i>
            {group.label}
          </button>
          {active === group.key && group.items.length > 0 && (
            <div
              className="admin-menu-dropdown"
              ref={(el) => { dropdownRefs.current[group.key] = el; }}
            >
              {group.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="admin-menu-item"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => navigate('/reportes')}
        className="admin-menu-button admin-menu-report"
      >
        REPORTES
      </button>
    </div>
  );
};

export default AdminMenu;
