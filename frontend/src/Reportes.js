import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { API_BASE_URL } from './config';
import { repairText } from './textNormalization';

const TIPOS_REPORTE = [
  { value: 'ingresos_por_periodo', label: 'Ingresos por período' },
  { value: 'servicios_mas_realizados', label: 'Servicios más realizados' },
  { value: 'repuestos_mas_vendidos', label: 'Repuestos más vendidos' },
  { value: 'clientes_frecuentes', label: 'Clientes frecuentes' },
  { value: 'ordenes_por_estado', label: 'Órdenes por estado' },
  { value: 'inventario_critico', label: 'Inventario crítico' },
];

const Reportes = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoConsulta, setTipoConsulta] = useState('');
  const [top, setTop] = useState(10);
  const [emailDestino, setEmailDestino] = useState('');
  const [agrupacion, setAgrupacion] = useState('dia');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preguntaAsistente, setPreguntaAsistente] = useState('');
  const [escuchando, setEscuchando] = useState(false);
  const [consultandoAsistente, setConsultandoAsistente] = useState(false);
  const reconocimientoRef = useRef(null);

  const API = `${API_BASE_URL}/api`;
  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const construirUrl = (exportar) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    if (tipoConsulta) params.append('tipo', tipoConsulta);
    if (top) params.append('top', top);
    if (emailDestino) params.append('email_destino', emailDestino);
    if (['ingresos_por_periodo', 'servicios_mas_realizados'].includes(tipoConsulta) && agrupacion) {
      params.append('agrupacion', agrupacion);
    }
    if (exportar) params.append('export', exportar);
    return `${API}/reportes/?${params.toString()}`;
  };

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const generarConsulta = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(construirUrl(), { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo generar la consulta.');
        setResultados([]);
        return;
      }
      setResultados(Array.isArray(data.resultados) ? data.resultados : []);
      setSuccess('Consulta generada correctamente.');
    } catch {
      setError('Error de conexion generando consulta.');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (formato) => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch(construirUrl(formato), { headers: headers() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo exportar el reporte.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte.${formato === 'excel' ? 'xlsx' : formato}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`Reporte ${formato.toUpperCase()} generado correctamente.`);
    } catch {
      setError('Error de conexion exportando reporte.');
    } finally {
      setLoading(false);
    }
  };

  const imprimirReporte = () => {
    window.print();
  };

  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;

  const iniciarEscucha = () => {
    if (!SpeechRecognitionApi) {
      setError('Tu navegador no soporta reconocimiento de voz. Escribe la pregunta manualmente.');
      return;
    }
    resetMessages();
    const reconocimiento = new SpeechRecognitionApi();
    reconocimiento.lang = 'es-ES';
    reconocimiento.interimResults = false;
    reconocimiento.maxAlternatives = 1;
    reconocimiento.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      setPreguntaAsistente(texto);
      preguntarAsistente(texto);
    };
    reconocimiento.onerror = () => {
      setError('No se pudo capturar el audio. Intenta nuevamente.');
      setEscuchando(false);
    };
    reconocimiento.onend = () => setEscuchando(false);
    reconocimientoRef.current = reconocimiento;
    setEscuchando(true);
    reconocimiento.start();
  };

  const detenerEscucha = () => {
    reconocimientoRef.current?.stop();
    setEscuchando(false);
  };

  const preguntarAsistente = async (textoOverride) => {
    const pregunta = (textoOverride ?? preguntaAsistente).trim();
    if (!pregunta) {
      setError('Escribe o dicta una pregunta para el asistente.');
      return;
    }
    resetMessages();
    setConsultandoAsistente(true);
    try {
      const res = await fetch(`${API}/reportes/asistente-voz/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ pregunta }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo interpretar la pregunta.');
        return;
      }
      setTipoConsulta(data.tipo || '');
      setFechaInicio(data.fecha_inicio || '');
      setFechaFin(data.fecha_fin || '');
      if (data.agrupacion) setAgrupacion(data.agrupacion);
      if (data.top) setTop(data.top);
      setResultados(Array.isArray(data.resultados) ? data.resultados : []);
      setSuccess('El asistente interpretó tu pregunta y generó el reporte.');
    } catch {
      setError('Error de conexión consultando al asistente.');
    } finally {
      setConsultandoAsistente(false);
    }
  };

  const columnas = resultados.length > 0 ? Object.keys(resultados[0]) : ['fecha', 'categoria', 'descripcion', 'cantidad', 'monto', 'estado'];
  const formatBs = (v) => {
    if (v == null) return '-';
    const num = Number(v);
    if (Number.isNaN(num)) return v;
    return 'Bs ' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const mostrarPeriodoServicio = tipoConsulta === 'servicios_mas_realizados' && agrupacion;

  const renderResultadosTable = () => {
    if (tipoConsulta === 'ingresos_por_periodo') {
      return (
        <table className="bitacora-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th># Órdenes</th>
              <th>Ingreso bruto</th>
              <th>Impuesto</th>
              <th>Ingreso neto</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center' }}>Sin resultados para los filtros seleccionados.</td></tr>
            ) : (
              resultados.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.periodo || '-'}</td>
                  <td>{row.ordenes ?? '-'}</td>
                  <td>{formatBs(row.ingreso_bruto)}</td>
                  <td>{formatBs(row.impuesto)}</td>
                  <td>{formatBs(row.ingreso_neto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (tipoConsulta === 'servicios_mas_realizados') {
      return (
        <table className="bitacora-table">
          <thead>
            <tr>
              {mostrarPeriodoServicio && <th>Periodo</th>}
              <th>Servicio</th>
              <th>Veces realizado</th>
              <th>Ingreso total</th>
              <th>% del total</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td colSpan={mostrarPeriodoServicio ? 5 : 4} style={{ padding: '16px', textAlign: 'center' }}>Sin resultados para los filtros seleccionados.</td></tr>
            ) : (
              resultados.map((r, i) => (
                <tr key={i}>
                  {mostrarPeriodoServicio && <td>{r.periodo || '-'}</td>}
                  <td>{r.servicio}</td>
                  <td>{r.veces_realizado}</td>
                  <td>{formatBs(r.ingreso_total)}</td>
                  <td>{r.porcentaje}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (tipoConsulta === 'repuestos_mas_vendidos') {
      return (
        <table className="bitacora-table">
          <thead>
            <tr>
              <th>Repuesto</th>
              <th>Cantidad vendida</th>
              <th>Ingreso total</th>
              <th>Stock actual</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center' }}>Sin resultados para los filtros seleccionados.</td></tr>
            ) : (
              resultados.map((r, i) => (
                <tr key={i}>
                  <td>{r.repuesto}</td>
                  <td>{r.cantidad_vendida}</td>
                  <td>{formatBs(r.ingreso_total)}</td>
                  <td>{r.stock_actual}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (tipoConsulta === 'clientes_frecuentes') {
      return (
        <table className="bitacora-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cédula</th>
              <th># Servicios</th>
              <th>Total gastado</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center' }}>Sin resultados para los filtros seleccionados.</td></tr>
            ) : (
              resultados.map((r, i) => (
                <tr key={i}>
                  <td>{r.cliente}</td>
                  <td>{r.cedula}</td>
                  <td>{r.cantidad_servicios}</td>
                  <td>{formatBs(r.total_gastado)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (tipoConsulta === 'ordenes_por_estado') {
      return (
        <table className="bitacora-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Cantidad</th>
              <th>% del total</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '16px', textAlign: 'center' }}>Sin resultados para los filtros seleccionados.</td></tr>
            ) : (
              resultados.map((r, i) => (
                <tr key={i}>
                  <td>{r.estado}</td>
                  <td>{r.cantidad}</td>
                  <td>{r.porcentaje}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (tipoConsulta === 'inventario_critico') {
      return (
        <table className="bitacora-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Diferencia</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center' }}>Sin productos por debajo del stock mínimo. ¡Inventario saludable!</td></tr>
            ) : (
              resultados.map((r, i) => (
                <tr key={i}>
                  <td>{r.producto}</td>
                  <td>{r.stock_actual}</td>
                  <td>{r.stock_minimo}</td>
                  <td>{r.diferencia}</td>
                  <td>{r.ubicacion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    // Tabla genérica de respaldo
    return (
      <table className="bitacora-table">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultados.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} style={{ padding: '16px', textAlign: 'center' }}>
                Sin resultados por el momento.
              </td>
            </tr>
          ) : (
            resultados.map((row, index) => (
              <tr key={`${row.descripcion || 'fila'}-${index}`}>
                {columnas.map((col) => (
                  <td key={col}>{row[col] ?? '-'}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="app-container reportes-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/reportes/fondo-reportes-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/reportes/fondo-reportes-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Generar Reportes (CU18)</h2>
          <div className="page-subtitle">Reportes analíticos en PDF, Excel y CSV con filtros de fechas, top X y envío por email</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}
      {success && <div className="success-box" style={{ marginTop: '20px' }}>{success}</div>}

      <div className="bitacora-panel reportes-panel" style={{ marginTop: '20px' }}>
        <h3 className="usuarios-panel-title">Asistente de voz</h3>
        <p className="reportes-hint">Pregunta en lenguaje natural, ej: "¿cuáles son los ingresos del último mes agrupados por semana?"</p>
        <div className="reportes-asistente-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={preguntaAsistente}
            onChange={(e) => setPreguntaAsistente(e.target.value)}
            placeholder="Escribe o dicta tu pregunta..."
            style={{ flex: '1 1 280px' }}
          />
          <button
            type="button"
            onClick={escuchando ? detenerEscucha : iniciarEscucha}
            className="bitacora-btn bitacora-btn--filter"
            disabled={consultandoAsistente}
          >
            {escuchando ? '⏹ Detener' : '🎤 Hablar'}
          </button>
          <button
            type="button"
            onClick={preguntarAsistente}
            className="bitacora-btn bitacora-btn--export"
            disabled={consultandoAsistente || escuchando || !preguntaAsistente.trim()}
          >
            {consultandoAsistente ? 'Consultando...' : 'Preguntar'}
          </button>
        </div>
      </div>

      <div className="bitacora-panel reportes-panel" style={{ marginTop: '20px' }}>
        <h3 className="usuarios-panel-title">Filtros dinámicos</h3>
        <div className="reportes-filtros-grid">
          <div className="input-group">
            <label>Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Tipo de Reporte</label>
            <select value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)}>
              <option value="">Seleccione</option>
              {TIPOS_REPORTE.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
          {['ingresos_por_periodo', 'servicios_mas_realizados'].includes(tipoConsulta) && (
            <div className="input-group">
              <label>Agrupación</label>
              <select value={agrupacion} onChange={(e) => setAgrupacion(e.target.value)}>
                <option value="dia">Por día</option>
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
              </select>
            </div>
          )}
          <div className="input-group">
            <label>Top</label>
            <input type="number" min="1" value={top} onChange={(e) => setTop(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label>Email destino (opcional)</label>
            <input type="email" value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} placeholder="usuario@correo.com" />
          </div>
        </div>
        <button
          type="button"
          onClick={generarConsulta}
          className="bitacora-btn bitacora-btn--filter"
          disabled={loading || !tipoConsulta}
          style={{ marginTop: '14px' }}
        >
          {loading ? 'Generando...' : 'Generar Consulta'}
        </button>
      </div>

      <div className="bitacora-panel reportes-panel" style={{ marginTop: '20px' }}>
        <h3 className="usuarios-panel-title">Exportación e impresión</h3>
        <div className="reportes-export-actions">
          <button type="button" onClick={() => exportarReporte('pdf')} className="bitacora-btn bitacora-btn--export" disabled={loading || !tipoConsulta}>Exportar PDF</button>
          <button type="button" onClick={() => exportarReporte('excel')} className="bitacora-btn bitacora-btn--export" disabled={loading || !tipoConsulta}>Exportar Excel</button>
          <button type="button" onClick={() => exportarReporte('csv')} className="bitacora-btn bitacora-btn--clear" disabled={loading || !tipoConsulta}>Exportar CSV</button>
          <button type="button" onClick={imprimirReporte} className="bitacora-btn bitacora-btn--clear" disabled={loading}>Imprimir</button>
        </div>
      </div>

      <div className="bitacora-panel reportes-panel" style={{ marginTop: '20px' }}>
        <h3 className="usuarios-panel-title">Resultados</h3>
        {!tipoConsulta ? (
          <p className="reportes-hint">Selecciona un tipo de reporte y genera la consulta para ver los resultados.</p>
        ) : (
          <div className="bitacora-table-wrap">
            {renderResultadosTable()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
