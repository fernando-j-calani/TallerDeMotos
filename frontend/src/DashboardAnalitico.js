import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { API_BASE_URL } from './config';
import { repairText } from './textNormalization';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const DashboardAnalitico = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const formatBs = (v) => {
    const num = Number(v);
    if (Number.isNaN(num)) return v ?? '-';
    return 'Bs ' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatFecha = (iso) => {
    if (!iso || iso.length < 10) return iso;
    const [, mes, dia] = iso.split('-');
    return `${dia}/${mes}`;
  };

  const descargarArchivo = (nombre, contenido, tipoMime) => {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportarCsv = () => {
    if (!data) return;

    let csv = 'Métrica,Valor\n';
    csv += `Ingresos del día,${data.ingresos_del_dia}\n`;
    csv += `Órdenes activas,${data.ordenes_activas}\n`;
    csv += `Alertas de stock,${data.alertas_stock.length}\n`;
    csv += `Servicios pendientes,${data.servicios_pendientes}\n\n`;

    csv += 'Ingresos últimos 14 días,Ingreso\n';
    data.serie_ingresos_ultimos_14_dias.forEach((row) => {
      csv += `${row.fecha},${row.ingreso}\n`;
    });

    csv += '\nAlertas de stock,Stock actual,Stock mínimo,Diferencia,Ubicación\n';
    data.alertas_stock.slice(0, 10).forEach((row) => {
      csv += `${row.producto},${row.stock_actual},${row.stock_minimo},${row.diferencia},${row.ubicacion || ''}\n`;
    });

    descargarArchivo('dashboard_analitico.csv', csv, 'text/csv;charset=utf-8;');
  };

  const exportarExcel = () => {
    if (!data) return;

    const makeRow = (cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
    let html = '<html><head><meta charset="UTF-8"></head><body>';
    html += '<h2>Dashboard Analítico</h2>';
    html += '<table border="1" style="border-collapse:collapse;">';
    html += makeRow(['Métrica', 'Valor']);
    html += makeRow(['Ingresos del día', data.ingresos_del_dia]);
    html += makeRow(['Órdenes activas', data.ordenes_activas]);
    html += makeRow(['Alertas de stock', data.alertas_stock.length]);
    html += makeRow(['Servicios pendientes', data.servicios_pendientes]);
    html += '</table><br/>';

    html += '<h3>Ingresos últimos 14 días</h3>';
    html += '<table border="1" style="border-collapse:collapse;">';
    html += makeRow(['Fecha', 'Ingreso']);
    data.serie_ingresos_ultimos_14_dias.forEach((row) => {
      html += makeRow([row.fecha, row.ingreso]);
    });
    html += '</table><br/>';

    html += '<h3>Alertas de stock</h3>';
    html += '<table border="1" style="border-collapse:collapse;">';
    html += makeRow(['Producto', 'Stock actual', 'Stock mínimo', 'Diferencia', 'Ubicación']);
    data.alertas_stock.slice(0, 10).forEach((row) => {
      html += makeRow([row.producto, row.stock_actual, row.stock_minimo, row.diferencia, row.ubicacion || '']);
    });
    html += '</table>';
    html += '</body></html>';

    descargarArchivo('dashboard_analitico.xls', html, 'application/vnd.ms-excel');
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    setLoading(true);
    fetch(`${API_BASE_URL}/api/dashboard/`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => r.json())
      .then((j) => {
        if (j && j.exito) {
          setData(j.dashboard);
        } else {
          const msg = (j && j.error) || 'No se pudo obtener datos del servidor.';
          setData(null);
          setError(msg);
        }
      })
      .catch((e) => {
        console.error(e);
        setError('Error de red al cargar el dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-container dashboard-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/dashboard-analitico/fondo-dashboard-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/dashboard-analitico/fondo-dashboard-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Dashboard Analítico (CU19)</h2>
          <div className="page-subtitle">Métricas en tiempo real: ingresos, órdenes activas, alertas de stock y servicios pendientes</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      {loading && (
        <div className="bitacora-panel" style={{ marginTop: '20px' }}>Cargando dashboard...</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="bitacora-stats" style={{ marginTop: '20px' }}>
            <div className="bitacora-stat-card">
              <div className="bitacora-stat-value">{formatBs(data.ingresos_del_dia)}</div>
              <div className="bitacora-stat-label">Ingresos del día</div>
            </div>
            <div className="bitacora-stat-card bitacora-row--clickable" onClick={() => navigate('/ordenes-trabajo')}>
              <div className="bitacora-stat-value">{data.ordenes_activas}</div>
              <div className="bitacora-stat-label">Órdenes activas</div>
            </div>
            <div
              className={`bitacora-stat-card bitacora-row--clickable${data.alertas_stock.length > 0 ? ' dashboard-stat-card--alert' : ''}`}
              onClick={() => navigate('/inventario')}
            >
              <div className="bitacora-stat-value">{data.alertas_stock.length}</div>
              <div className="bitacora-stat-label">Alertas de stock</div>
            </div>
            <div className="bitacora-stat-card bitacora-row--clickable" onClick={() => navigate('/ordenes-trabajo')}>
              <div className="bitacora-stat-value">{data.servicios_pendientes}</div>
              <div className="bitacora-stat-label">Servicios pendientes</div>
            </div>
          </div>

          <div className="dashboard-charts-grid">
            <div className="bitacora-panel">
              <h3 className="usuarios-panel-title">Ingresos últimos 14 días</h3>
              <div className="dashboard-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.serie_ingresos_ultimos_14_dias} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="fecha" tickFormatter={formatFecha} tick={{ fill: '#bbb', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#bbb' }} />
                    <Tooltip
                      formatter={(value) => [formatBs(value), 'Ingreso']}
                      labelFormatter={(label) => formatFecha(label)}
                      contentStyle={{ backgroundColor: '#1b1b1b', border: '1px solid #333', borderRadius: 6 }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#ef4444' }}
                    />
                    <Bar dataKey="ingreso" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bitacora-panel">
              <h3 className="usuarios-panel-title">Alertas de stock (top 10)</h3>
              {data.alertas_stock.length === 0 ? (
                <p className="dashboard-empty-hint">Sin alertas de stock por el momento.</p>
              ) : (
                <div className="dashboard-alerts-list">
                  {data.alertas_stock.slice(0, 10).map((p, i) => (
                    <div className="dashboard-alert-item" key={i}>
                      <div className="dashboard-alert-product">{p.producto}</div>
                      <div className="dashboard-alert-meta">
                        Stock: {p.stock_actual} / Mín: {p.stock_minimo}{p.ubicacion ? ` · ${p.ubicacion}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bitacora-panel" style={{ marginTop: '20px' }}>
            <h3 className="usuarios-panel-title">Exportación</h3>
            <div className="reportes-export-actions">
              <button type="button" onClick={exportarExcel} className="bitacora-btn bitacora-btn--export">Exportar Excel</button>
              <button type="button" onClick={exportarCsv} className="bitacora-btn bitacora-btn--clear">Exportar CSV</button>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="bitacora-panel" style={{ marginTop: '20px' }}>No se pudieron cargar los datos del dashboard.</div>
      )}
    </div>
  );
};

export default DashboardAnalitico;
