import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole, normalizeRole } from './navigation';
import { repairText } from './textNormalization';
import { fetchPermisosUsuario, tienePermisoCu, tienePermisoModulo } from './permissions';
import { logoutUniversal } from './auth';
import { API_BASE_URL } from './config';

const API = `${API_BASE_URL}/api`;

const normalizarClase = (valor) => (valor || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-');

const formatFechaHora = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const InicioOperativo = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [permisos, setPermisos] = useState([]);
  const [permisosCargando, setPermisosCargando] = useState(true);

  // ---- Panel del Mecánico ----
  const [misOrdenes, setMisOrdenes] = useState([]);
  const [errorOrdenes, setErrorOrdenes] = useState('');
  const [notas, setNotas] = useState([]);
  const [alertasInventario, setAlertasInventario] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [nuevaNota, setNuevaNota] = useState({ tipo_nota: 'Diagnóstico', contenido: '' });
  const [notaError, setNotaError] = useState('');
  const [notaEnviando, setNotaEnviando] = useState(false);
  const [horaActual, setHoraActual] = useState('');

  // ---- Panel de Recepción ----
  const [clientesRecepcion, setClientesRecepcion] = useState([]);
  const [ordenesRecepcion, setOrdenesRecepcion] = useState([]);
  const [cotizacionesRecepcion, setCotizacionesRecepcion] = useState([]);
  const [errorRecepcion, setErrorRecepcion] = useState('');

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const rolNormalizado = normalizeRole(usuarioLocal.rol);
    if (rolNormalizado === 'administrador' || rolNormalizado === 'cliente') {
      navigate(getHomeRouteByRole(usuarioLocal.rol));
    }
  }, [navigate, usuarioLocal]);

  useEffect(() => {
    let activo = true;
    if (!usuarioLocal) {
      setPermisos([]);
      setPermisosCargando(false);
      return () => {
        activo = false;
      };
    }

    const cargarPermisos = async () => {
      const data = await fetchPermisosUsuario();
      if (activo) {
        setPermisos(data);
        setPermisosCargando(false);
      }
    };

    cargarPermisos();
    return () => {
      activo = false;
    };
  }, [usuarioLocal]);

  const rolNormalizado = normalizeRole(usuarioLocal?.rol);
  const esRecepcionista = rolNormalizado === 'recepcionista';
  const esMecanico = rolNormalizado === 'mecanico';

  const puedeVerCu = (codigoCu) => tienePermisoCu(permisos, codigoCu, usuarioLocal?.rol);

  // ---- Reloj del turno ----
  useEffect(() => {
    const actualizarHora = () => setHoraActual(new Date().toLocaleTimeString('es-BO', { hour12: false }));
    actualizarHora();
    const intervalo = setInterval(actualizarHora, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  const cargarMisOrdenes = async () => {
    try {
      setErrorOrdenes('');
      const res = await fetch(`${API}/ordenes-trabajo/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setErrorOrdenes(data.error || 'No se pudieron cargar tus órdenes de trabajo.');
        return;
      }
      const propias = (Array.isArray(data) ? data : []).filter(
        (orden) => Number(orden.id_mecanico) === Number(usuarioLocal?.id)
      );
      setMisOrdenes(propias);
    } catch {
      setErrorOrdenes('Error de conexión cargando tus órdenes de trabajo.');
    }
  };

  const cargarNotas = async () => {
    try {
      const res = await fetch(`${API}/notas-trabajo/`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setNotas(Array.isArray(data) ? data : []);
    } catch {
      // Las notas son un complemento informativo del panel.
    }
  };

  const cargarAlertasInventario = async () => {
    try {
      const res = await fetch(`${API}/inventario/?alerta=bajo`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setAlertasInventario(Array.isArray(data) ? data : []);
    } catch {
      // Las alertas son un complemento informativo del panel.
    }
  };

  useEffect(() => {
    if (!esMecanico || permisosCargando) return;
    if (puedeVerCu('CU08')) cargarMisOrdenes();
    if (puedeVerCu('CU09')) cargarNotas();
    if (puedeVerCu('CU11')) cargarAlertasInventario();
  }, [esMecanico, permisosCargando, permisos]);

  const cargarClientesRecepcion = async () => {
    try {
      const res = await fetch(`${API}/clientes/`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setClientesRecepcion(Array.isArray(data) ? data : []);
    } catch {
      // El conteo de clientes es un complemento informativo del panel.
    }
  };

  const cargarOrdenesRecepcion = async () => {
    try {
      setErrorRecepcion('');
      const res = await fetch(`${API}/ordenes-trabajo/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setErrorRecepcion(data.error || 'No se pudieron cargar las órdenes de trabajo.');
        return;
      }
      setOrdenesRecepcion(Array.isArray(data) ? data : []);
    } catch {
      setErrorRecepcion('Error de conexión cargando las órdenes de trabajo.');
    }
  };

  const cargarCotizacionesRecepcion = async () => {
    try {
      const res = await fetch(`${API}/cotizaciones/`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setCotizacionesRecepcion(Array.isArray(data) ? data : []);
    } catch {
      // Las cotizaciones recientes son un complemento informativo del panel.
    }
  };

  useEffect(() => {
    if (!esRecepcionista || permisosCargando) return;
    if (puedeVerCu('CU05')) cargarClientesRecepcion();
    if (puedeVerCu('CU08')) cargarOrdenesRecepcion();
    if (puedeVerCu('CU07')) cargarCotizacionesRecepcion();
    if (puedeVerCu('CU11')) cargarAlertasInventario();
  }, [esRecepcionista, permisosCargando, permisos]);

  useEffect(() => {
    if (misOrdenes.length > 0 && ordenSeleccionada === null) {
      setOrdenSeleccionada(misOrdenes[0].codigo);
    }
  }, [misOrdenes, ordenSeleccionada]);

  const notasOrdenSeleccionada = useMemo(
    () => notas
      .filter((nota) => Number(nota.id_orden_trabajo) === Number(ordenSeleccionada))
      .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)),
    [notas, ordenSeleccionada]
  );

  const enviarNota = async (e) => {
    e.preventDefault();
    if (!ordenSeleccionada || !nuevaNota.contenido.trim()) return;
    setNotaEnviando(true);
    setNotaError('');
    try {
      const res = await fetch(`${API}/notas-trabajo/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id_orden_trabajo: ordenSeleccionada,
          tipo_nota: nuevaNota.tipo_nota,
          contenido: nuevaNota.contenido,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotaError(data.error || (data.errores ? JSON.stringify(data.errores) : 'No se pudo registrar la nota.'));
        return;
      }
      setNuevaNota((prev) => ({ ...prev, contenido: '' }));
      await cargarNotas();
    } catch {
      setNotaError('Error de conexión registrando la nota.');
    } finally {
      setNotaEnviando(false);
    }
  };

  const cerrarSesion = async () => {
    await logoutUniversal();
    navigate('/login', { replace: true });
  };

  const ordenesEnCurso = misOrdenes.filter((orden) => !['Finalizado', 'Rechazado'].includes(orden.estado)).length;
  const ordenesFinalizadas = misOrdenes.filter((orden) => orden.estado === 'Finalizado').length;

  const cardsRecepcionista = [
    {
      cu: 'CU08',
      titulo: 'Órdenes de Trabajo',
      descripcion: 'Genera y consulta órdenes de trabajo para el taller.',
      path: '/ordenes-trabajo',
      icono: 'fa-clipboard-list',
    },
    {
      cu: 'CU07',
      titulo: 'Cotizaciones',
      descripcion: 'Crea y administra cotizaciones para clientes y motocicletas.',
      path: '/cotizaciones',
      icono: 'fa-file-invoice-dollar',
    },
    {
      cu: 'CU05',
      titulo: 'Clientes',
      descripcion: 'Registra, edita y desactiva clientes del taller.',
      path: '/clientes',
      icono: 'fa-users',
    },
    {
      cu: 'CU06',
      titulo: 'Motocicletas',
      descripcion: 'Consulta y administra motocicletas asociadas a clientes.',
      path: '/motocicletas',
      icono: 'fa-motorcycle',
    },
    {
      cu: 'CU11',
      titulo: 'Inventario',
      descripcion: 'Observa los niveles de stock actuales y artículos en alerta.',
      path: '/inventario',
      icono: 'fa-warehouse',
    },
    {
      cu: 'CU10',
      titulo: 'Productos',
      descripcion: 'Registra y actualiza repuestos e inventario.',
      path: '/productos',
      icono: 'fa-box',
    },
    {
      cu: 'CU12',
      titulo: 'Compras',
      descripcion: 'Registra compras a proveedores y actualiza stock automáticamente.',
      path: '/compras',
      icono: 'fa-cart-shopping',
    },
    {
      cu: 'CU13',
      titulo: 'Proveedores',
      descripcion: 'Administra proveedores y sus datos de contacto.',
      path: '/proveedores',
      icono: 'fa-truck',
    },
    {
      cu: 'CU09',
      titulo: 'Notas de Trabajo',
      descripcion: 'Registra notas y observaciones técnicas por orden.',
      path: '/notas-trabajo',
      icono: 'fa-note-sticky',
    },
    {
      cu: 'CU14',
      titulo: 'Facturación',
      descripcion: 'Genera facturas y notas de servicio para los clientes.',
      path: '/facturacion',
      icono: 'fa-file-invoice',
    },
    {
      cu: 'CU16',
      titulo: 'Seguimiento de Clientes',
      descripcion: 'Registra gestiones y comunicación con los clientes.',
      path: '/seguimiento-clientes',
      icono: 'fa-headset',
    },
    {
      cu: 'CU18',
      titulo: 'Reportes',
      descripcion: 'Consulta y exporta reportes operativos del taller.',
      path: '/reportes',
      icono: 'fa-chart-line',
    },
  ];

  const tarjetasRecepcionistaVisibles = cardsRecepcionista.filter((card) => puedeVerCu(card.cu));

  const accionesRapidasRecepcion = [
    { titulo: 'Nueva Orden de Trabajo', icono: 'fa-clipboard-list', path: '/ordenes-trabajo', cu: 'CU08' },
    { titulo: 'Nueva Cotización', icono: 'fa-file-invoice-dollar', path: '/cotizaciones', cu: 'CU07' },
    { titulo: 'Registrar Cliente', icono: 'fa-user-plus', path: '/clientes', cu: 'CU05' },
    { titulo: 'Generar Factura', icono: 'fa-file-invoice', path: '/facturacion', cu: 'CU14' },
  ].filter((accion) => tienePermisoModulo(permisos, accion.cu, ['Adicionar'], usuarioLocal?.rol));

  const estadosOrdenInactivos = ['Finalizado', 'Entregado', 'Cancelado', 'Rechazado'];
  const ordenesActivasRecepcion = ordenesRecepcion.filter((orden) => !estadosOrdenInactivos.includes(orden.estado)).length;
  const cotizacionesPendientesRecepcion = cotizacionesRecepcion.filter((cot) => cot.estado === 'Pendiente').length;
  const ordenesRecientesRecepcion = ordenesRecepcion.slice(0, 6);
  const cotizacionesRecientesRecepcion = cotizacionesRecepcion.slice(0, 5);

  return (
    <div className={`app-container ${esMecanico ? 'taller-page' : ''} ${esRecepcionista ? 'taller-page recepcion-page' : ''}`}>
      {esMecanico && (
        <>
          <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/ordenes-trabajo/fondo-ordenes-trabajo-1.png)' }}></div>
          <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/ordenes-trabajo/fondo-ordenes-trabajo-2.png)' }}></div>
          <div className="page-bg-overlay"></div>
        </>
      )}

      {esRecepcionista && (
        <>
          <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/cotizaciones/fondo-cotizaciones-1.png)' }}></div>
          <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/cotizaciones/fondo-cotizaciones-2.png)' }}></div>
          <div className="page-bg-overlay"></div>
        </>
      )}

      <div className="top-panel">
        <div className="page-title">
          <h2>Inicio Operativo</h2>
          <div className="page-subtitle">{repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</div>
        </div>
        <div className="user-actions">
          <button onClick={() => navigate('/perfil')} className="btn-primary">Mi Perfil</button>
          {usuarioLocal?.rol === 'Administrador' && (
            <button onClick={() => navigate('/asignar-privilegios')} className="btn-primary">Asignar Privilegios</button>
          )}
          <button onClick={cerrarSesion} className="btn-secondary">Cerrar Sesión</button>
        </div>
      </div>

      {esMecanico ? (
        permisosCargando ? (
          <div className="taller-loading">Cargando panel operativo...</div>
        ) : (
          <div className="taller-dashboard">
            <div className="taller-hero">
              <div className="taller-hero-text">
                <span className="taller-hero-kicker">Panel del Mecánico</span>
                <h1>Bienvenido, {repairText(usuarioLocal?.nombre)}</h1>
                <p>Consulta tus órdenes de trabajo asignadas, registra avances técnicos y revisa el estado del inventario del taller.</p>
              </div>
              <div className="taller-hero-clock">
                <i className="fa-regular fa-clock"></i>
                <div>
                  <span className="taller-hero-clock-value">{horaActual}</span>
                  <span className="taller-hero-clock-label">Hora del turno</span>
                </div>
              </div>
            </div>

            <div className="taller-stats">
              <div className="taller-stat-card">
                <i className="fa-solid fa-clipboard-list"></i>
                <div className="taller-stat-info">
                  <span className="taller-stat-value">{misOrdenes.length}</span>
                  <span className="taller-stat-label">Órdenes asignadas</span>
                </div>
              </div>
              <div className="taller-stat-card">
                <i className="fa-solid fa-screwdriver-wrench"></i>
                <div className="taller-stat-info">
                  <span className="taller-stat-value">{ordenesEnCurso}</span>
                  <span className="taller-stat-label">En curso</span>
                </div>
              </div>
              <div className="taller-stat-card">
                <i className="fa-solid fa-circle-check"></i>
                <div className="taller-stat-info">
                  <span className="taller-stat-value">{ordenesFinalizadas}</span>
                  <span className="taller-stat-label">Finalizadas</span>
                </div>
              </div>
              {puedeVerCu('CU11') && (
                <div className={`taller-stat-card ${alertasInventario.length > 0 ? 'taller-stat-card--alert' : ''}`}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div className="taller-stat-info">
                    <span className="taller-stat-value">{alertasInventario.length}</span>
                    <span className="taller-stat-label">Alertas de inventario</span>
                  </div>
                </div>
              )}
            </div>

            {errorOrdenes && <div className="error-box">{errorOrdenes}</div>}

            <div className="taller-main">
              <div className="taller-panel taller-orders-panel">
                <div className="taller-panel-header">
                  <h3><i className="fa-solid fa-list-check"></i> Mis Órdenes de Trabajo</h3>
                </div>

                {!puedeVerCu('CU08') ? (
                  <div className="taller-empty">
                    <i className="fa-solid fa-lock"></i>
                    No tienes permisos para ver órdenes de trabajo.
                  </div>
                ) : misOrdenes.length === 0 ? (
                  <div className="taller-empty">
                    <i className="fa-solid fa-clipboard-check"></i>
                    No tienes órdenes de trabajo asignadas por el momento.
                  </div>
                ) : (
                  <div className="taller-order-grid">
                    {misOrdenes.map((orden) => {
                      const vehiculo = `${repairText(orden.motocicleta_marca) || ''} ${repairText(orden.motocicleta_modelo) || ''}`.trim();
                      return (
                        <div
                          key={orden.codigo}
                          className={`taller-order-card ${ordenSeleccionada === orden.codigo ? 'taller-order-card--active' : ''}`}
                          onClick={() => setOrdenSeleccionada(orden.codigo)}
                        >
                          <div className="taller-order-card-header">
                            <span className="taller-order-code">Orden #{orden.codigo}</span>
                            <span className={`taller-badge taller-badge--prioridad-${normalizarClase(orden.prioridad || 'Normal')}`}>
                              {orden.prioridad || 'Normal'}
                            </span>
                          </div>
                          <div className="taller-order-vehicle">
                            <i className="fa-solid fa-motorcycle"></i>
                            <div>
                              <strong>{vehiculo || 'Motocicleta'}</strong>
                              <span>{orden.motocicleta_placa || '—'}</span>
                            </div>
                          </div>
                          <div className="taller-order-client">
                            <i className="fa-solid fa-user"></i>
                            {repairText(orden.cliente_nombre) || 'Cliente'}
                          </div>
                          <div className="taller-order-dates">
                            <span><i className="fa-regular fa-calendar"></i> Inicio: {orden.fecha_inicio || '—'}</span>
                            <span><i className="fa-regular fa-calendar-check"></i> Fin: {orden.fecha_fin || '—'}</span>
                          </div>
                          <div className="taller-order-footer">
                            <span className={`taller-badge taller-badge--estado-${normalizarClase(orden.estado || 'Pendiente')}`}>
                              {orden.estado || 'Pendiente'}
                            </span>
                            <span className="taller-order-total">$ {orden.total || 0}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="taller-panel taller-tasks-panel">
                <div className="taller-panel-header">
                  <h3><i className="fa-solid fa-clipboard-list"></i> Tareas Técnicas{ordenSeleccionada ? ` · Orden #${ordenSeleccionada}` : ''}</h3>
                </div>

                {!ordenSeleccionada ? (
                  <div className="taller-empty">
                    <i className="fa-solid fa-arrow-pointer"></i>
                    Selecciona una orden para ver sus tareas técnicas.
                  </div>
                ) : (
                  <>
                    <div className="taller-task-list">
                      {notasOrdenSeleccionada.length === 0 ? (
                        <div className="taller-empty-inline">Sin notas registradas para esta orden todavía.</div>
                      ) : (
                        notasOrdenSeleccionada.map((nota) => (
                          <div key={nota.codigo} className="taller-task-item">
                            <div className="taller-task-header">
                              <span className="taller-task-tipo">{repairText(nota.tipo_nota) || 'Nota'}</span>
                              <span className="taller-task-fecha">{formatFechaHora(nota.fecha_hora)}</span>
                            </div>
                            <p>{repairText(nota.contenido)}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {puedeVerCu('CU09') && (
                      <form className="taller-task-form" onSubmit={enviarNota}>
                        <div className="input-group">
                          <label>Tipo de nota</label>
                          <select value={nuevaNota.tipo_nota} onChange={(e) => setNuevaNota((prev) => ({ ...prev, tipo_nota: e.target.value }))}>
                            <option value="Diagnóstico">Diagnóstico</option>
                            <option value="Avance">Avance</option>
                            <option value="Finalización">Finalización</option>
                            <option value="Observación">Observación</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Detalle</label>
                          <textarea
                            value={nuevaNota.contenido}
                            onChange={(e) => setNuevaNota((prev) => ({ ...prev, contenido: e.target.value }))}
                            rows="3"
                            placeholder="Describe el avance o diagnóstico realizado..."
                            required
                          />
                        </div>
                        {notaError && <div className="error-box">{notaError}</div>}
                        <button type="submit" className="btn-primary" disabled={notaEnviando}>
                          {notaEnviando ? 'Registrando...' : 'Registrar nota'}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>

            {puedeVerCu('CU11') && (
              <div className="taller-panel taller-alerts-panel">
                <div className="taller-panel-header">
                  <h3><i className="fa-solid fa-warehouse"></i> Alertas de Inventario</h3>
                  <button onClick={() => navigate('/inventario')} className="btn-secondary">Ver inventario</button>
                </div>
                {alertasInventario.length === 0 ? (
                  <div className="taller-empty-inline">No hay productos con stock bajo en este momento.</div>
                ) : (
                  <ul className="taller-alerts-list">
                    {alertasInventario.map((producto) => (
                      <li key={producto.codigo}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span className="taller-alert-nombre">{repairText(producto.nombre)}</span>
                        <span className="taller-alert-stock">
                          Stock: {producto.stock_actual ?? 0} / mín. {Math.max(1, Number(producto.stock_minimo) || 1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      ) : esRecepcionista ? (
        permisosCargando ? (
          <div className="taller-loading">Cargando panel de recepción...</div>
        ) : (
          <div className="taller-dashboard">
            <div className="taller-hero">
              <div className="taller-hero-text">
                <span className="taller-hero-kicker">Panel de Recepción</span>
                <h1>Bienvenido, {repairText(usuarioLocal?.nombre)}</h1>
                <p>Gestiona clientes, motocicletas, cotizaciones, órdenes de trabajo, compras e inventario del taller desde un solo lugar.</p>
              </div>
              <div className="taller-hero-clock">
                <i className="fa-regular fa-clock"></i>
                <div>
                  <span className="taller-hero-clock-value">{horaActual}</span>
                  <span className="taller-hero-clock-label">Hora del turno</span>
                </div>
              </div>
            </div>

            {accionesRapidasRecepcion.length > 0 && (
              <div className="recepcion-quick-actions">
                {accionesRapidasRecepcion.map((accion) => (
                  <button key={accion.titulo} className="recepcion-quick-action" onClick={() => navigate(accion.path)}>
                    <i className={`fa-solid ${accion.icono}`}></i>
                    <div className="recepcion-quick-action-text">
                      <span className="recepcion-quick-action-kicker">Acción Rápida</span>
                      <span className="recepcion-quick-action-title">{accion.titulo}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="taller-stats">
              <div className="taller-stat-card">
                <i className="fa-solid fa-users"></i>
                <div className="taller-stat-info">
                  <span className="taller-stat-value">{clientesRecepcion.length}</span>
                  <span className="taller-stat-label">Clientes activos</span>
                </div>
              </div>
              <div className="taller-stat-card">
                <i className="fa-solid fa-screwdriver-wrench"></i>
                <div className="taller-stat-info">
                  <span className="taller-stat-value">{ordenesActivasRecepcion}</span>
                  <span className="taller-stat-label">Órdenes activas</span>
                </div>
              </div>
              <div className="taller-stat-card">
                <i className="fa-solid fa-file-invoice-dollar"></i>
                <div className="taller-stat-info">
                  <span className="taller-stat-value">{cotizacionesPendientesRecepcion}</span>
                  <span className="taller-stat-label">Cotizaciones pendientes</span>
                </div>
              </div>
              {puedeVerCu('CU11') && (
                <div className={`taller-stat-card ${alertasInventario.length > 0 ? 'taller-stat-card--alert' : ''}`}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div className="taller-stat-info">
                    <span className="taller-stat-value">{alertasInventario.length}</span>
                    <span className="taller-stat-label">Alertas de inventario</span>
                  </div>
                </div>
              )}
            </div>

            {errorRecepcion && <div className="error-box">{errorRecepcion}</div>}

            <div className="taller-main">
              <div className="taller-panel">
                <div className="taller-panel-header">
                  <h3><i className="fa-solid fa-clipboard-list"></i> Órdenes de Trabajo Recientes</h3>
                  {puedeVerCu('CU08') && (
                    <button onClick={() => navigate('/ordenes-trabajo')} className="btn-secondary">Ver todas</button>
                  )}
                </div>

                {!puedeVerCu('CU08') ? (
                  <div className="taller-empty">
                    <i className="fa-solid fa-lock"></i>
                    No tienes permisos para ver órdenes de trabajo.
                  </div>
                ) : ordenesRecientesRecepcion.length === 0 ? (
                  <div className="taller-empty">
                    <i className="fa-solid fa-clipboard-check"></i>
                    No hay órdenes de trabajo registradas todavía.
                  </div>
                ) : (
                  <div className="recepcion-orders-list">
                    {ordenesRecientesRecepcion.map((orden) => {
                      const vehiculo = `${repairText(orden.motocicleta_marca) || ''} ${repairText(orden.motocicleta_modelo) || ''}`.trim();
                      return (
                        <div key={orden.codigo} className="recepcion-order-row" onClick={() => navigate('/ordenes-trabajo')}>
                          <div className="recepcion-order-row-id">
                            <span className="taller-order-code">#{orden.codigo}</span>
                            <span className={`taller-badge taller-badge--prioridad-${normalizarClase(orden.prioridad || 'Normal')}`}>
                              {orden.prioridad || 'Normal'}
                            </span>
                          </div>
                          <div className="recepcion-order-row-main">
                            <i className="fa-solid fa-motorcycle"></i>
                            <div>
                              <strong>{vehiculo || 'Motocicleta'}</strong>
                              <span>{repairText(orden.cliente_nombre) || 'Cliente'} · {orden.motocicleta_placa || '—'}</span>
                            </div>
                          </div>
                          <div className="recepcion-order-row-meta">
                            <span className={`taller-badge taller-badge--estado-${normalizarClase(orden.estado || 'Pendiente')}`}>
                              {orden.estado || 'Pendiente'}
                            </span>
                            <span className="recepcion-order-row-fecha">
                              <i className="fa-regular fa-calendar"></i> {orden.fecha_inicio || '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="taller-panel">
                <div className="taller-panel-header">
                  <h3><i className="fa-solid fa-grip"></i> Accesos Rápidos</h3>
                </div>
                {tarjetasRecepcionistaVisibles.length === 0 ? (
                  <div className="taller-empty">
                    <i className="fa-solid fa-lock"></i>
                    No hay módulos habilitados para este rol.
                  </div>
                ) : (
                  <div className="recepcion-module-grid">
                    {tarjetasRecepcionistaVisibles.map((card) => (
                      <button key={card.cu} className="recepcion-module-card" title={card.descripcion} onClick={() => navigate(card.path)}>
                        <i className={`fa-solid ${card.icono}`}></i>
                        <span>{card.titulo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="recepcion-secondary-grid">
              {puedeVerCu('CU11') && (
                <div className="taller-panel taller-alerts-panel">
                  <div className="taller-panel-header">
                    <h3><i className="fa-solid fa-warehouse"></i> Alertas de Stock Crítico</h3>
                    <button onClick={() => navigate('/inventario')} className="btn-secondary">Ver inventario</button>
                  </div>
                  {alertasInventario.length === 0 ? (
                    <div className="taller-empty-inline">No hay productos con stock bajo en este momento.</div>
                  ) : (
                    <ul className="taller-alerts-list">
                      {alertasInventario.map((producto) => (
                        <li key={producto.codigo}>
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span className="taller-alert-nombre">{repairText(producto.nombre)}</span>
                          <span className="taller-alert-stock">
                            Stock: {producto.stock_actual ?? 0} / mín. {Math.max(1, Number(producto.stock_minimo) || 1)}
                          </span>
                          {puedeVerCu('CU12') && (
                            <button onClick={() => navigate('/compras')} className="recepcion-reorder-btn">Reordenar</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {puedeVerCu('CU07') && (
                <div className="taller-panel">
                  <div className="taller-panel-header">
                    <h3><i className="fa-solid fa-file-invoice-dollar"></i> Cotizaciones Recientes</h3>
                    <button onClick={() => navigate('/cotizaciones')} className="btn-secondary">Ver todas</button>
                  </div>
                  {cotizacionesRecientesRecepcion.length === 0 ? (
                    <div className="taller-empty-inline">No hay cotizaciones registradas todavía.</div>
                  ) : (
                    <ul className="recepcion-quote-list">
                      {cotizacionesRecientesRecepcion.map((cot) => (
                        <li key={cot.codigo} className="recepcion-quote-row">
                          <div>
                            <strong>{repairText(cot.id_cliente_nombre) || 'Cliente'}</strong>
                            <span>{cot.id_motocicleta_placa || '—'}</span>
                          </div>
                          <div className="recepcion-quote-row-meta">
                            <span className={`taller-badge taller-badge--estado-${normalizarClase(cot.estado || 'Pendiente')}`}>
                              {cot.estado || 'Pendiente'}
                            </span>
                            <span className="recepcion-quote-total">$ {cot.total || 0}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="portal-grid">
          {permisosCargando && (
            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '18px', border: '1px solid #2c2c2c', color: '#bbb' }}>
              Cargando permisos...
            </div>
          )}

          {!permisosCargando && (
            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '18px', border: '1px solid #2c2c2c', color: '#bbb' }}>
              No hay módulos habilitados para este rol.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InicioOperativo;
