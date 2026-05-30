import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

const Reportes = () => {
  const navigate = useNavigate();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoConsulta, setTipoConsulta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (exportar) params.append('export', exportar);
    return `${API}/reportes/?${params.toString()}`;
  };

  const generarConsulta = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(construirUrl(), { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo generar la consulta.');
        return;
      }
      setResultados(Array.isArray(data.resultados) ? data.resultados : []);
    } catch {
      setError('Error de conexion generando consulta.');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (formato) => {
    setError('');
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
    } catch {
      setError('Error de conexion exportando reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#ff6600', margin: 0 }}>Modulo de Reportes Analiticos</h2>
          <div style={{ color: '#aaa', marginTop: '6px' }}>Panel de consulta y exportacion de reportes</div>
        </div>
        <button
          onClick={() => navigate('/bitacora')}
          style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Volver a Bitacora
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}

      <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Filtros dinamicos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
          <div className="input-group">
            <label>Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Tipo de Consulta</label>
            <select value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)}>
              <option value="">Seleccione</option>
              <option value="financiero">Financiero</option>
              <option value="operativo">Rendimiento Operativo</option>
              <option value="inventario">Inventario/Repuestos</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={generarConsulta}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              disabled={loading || !tipoConsulta}
            >
              {loading ? 'Generando...' : 'Generar Consulta'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Panel de exportacion</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => exportarReporte('pdf')} style={{ padding: '10px 16px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={loading || !tipoConsulta}>Exportar PDF</button>
          <button type="button" onClick={() => exportarReporte('csv')} style={{ padding: '10px 16px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={loading || !tipoConsulta}>Exportar CSV</button>
          <button type="button" onClick={() => exportarReporte('excel')} style={{ padding: '10px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={loading || !tipoConsulta}>Exportar Excel</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Resultados</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Categoria</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Descripcion</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Monto</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#aaa' }}>
                  Sin resultados por el momento.
                </td>
              </tr>
            ) : (
              resultados.map((row, index) => (
                <tr key={`${row.descripcion || 'fila'}-${index}`} style={{ borderBottom: '1px solid #2c2c2c' }}>
                  <td style={{ padding: '8px' }}>{row.fecha || '-'}</td>
                  <td style={{ padding: '8px' }}>{row.categoria || '-'}</td>
                  <td style={{ padding: '8px' }}>{row.descripcion || '-'}</td>
                  <td style={{ padding: '8px' }}>{row.monto ?? '-'}</td>
                  <td style={{ padding: '8px' }}>{row.estado || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reportes;
