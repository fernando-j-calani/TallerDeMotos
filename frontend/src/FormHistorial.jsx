import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';

const API = `${API_BASE_URL}/api`;

const FormHistorial = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [criterio, setCriterio] = useState('');
  const [motocicleta, setMotocicleta] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [error, setError] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(false);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    if (!usuarioLocal) {
      navigate('/login');
      return;
    }

    const validarAcceso = async () => {
      const permitido = await validarPermisoModulo('CU15', ['Mostrar', 'Buscar', 'Exportar'], usuarioLocal?.rol);
      if (!permitido) {
        alert('Acceso denegado para historial de mantenimiento.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  const iniciaBusquedaPorPlacaOChasis = async (nuevoCriterio) => {
    const valor = (nuevoCriterio || '').trim();
    if (!valor) {
      setError('Ingrese una placa o chasis para buscar.');
      return;
    }

    setError('');
    setMensajeError('');
    setCargando(true);
    setOrdenSeleccionada(null);
    setDetalles([]);

    try {
      const res = await fetch(`${API}/historial-mantenimiento/?q=${encodeURIComponent(valor)}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setMensajeError('Vehiculo no encontrado o sin antecedentes.');
          setMotocicleta(null);
          setOrdenes([]);
          return;
        }
        setError(data.error || 'No se pudo obtener el historial.');
        return;
      }
      if (!data?.motocicleta || !Array.isArray(data?.ordenes) || data.ordenes.length === 0) {
        setMensajeError('Vehiculo no encontrado o sin antecedentes.');
      }
      muestraResultadosVisualesYPDF({ ...data, modo: 'busqueda' });
    } catch {
      setError('Error de conexion buscando historial.');
    } finally {
      setCargando(false);
    }
  };

  const seleccionaOrdenParaVerDesglose = async (ordenId) => {
    if (!ordenId) return;
    setError('');

    try {
      const res = await fetch(`${API}/historial-mantenimiento/${ordenId}/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar el detalle.');
        return;
      }
      setOrdenSeleccionada(data.orden || null);
      setDetalles(Array.isArray(data.detalles) ? data.detalles : []);
    } catch {
      setError('Error de conexion cargando detalles.');
    }
  };

  const solicitaReportePDF = async () => {
    const valor = (criterio || '').trim();
    if (!valor) {
      setError('Ingrese una placa o chasis antes de exportar.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      const res = await fetch(`${API}/historial-mantenimiento/reporte/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ criterio: valor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo generar el reporte.');
        return;
      }
      muestraResultadosVisualesYPDF({ ...data, modo: 'reporte' });
    } catch {
      setError('Error de conexion generando reporte.');
    } finally {
      setCargando(false);
    }
  };

  const muestraResultadosVisualesYPDF = (datos) => {
    const moto = datos.motocicleta || null;
    const listaOrdenes = Array.isArray(datos.ordenes) ? datos.ordenes : [];
    setMotocicleta(moto);
    setOrdenes(listaOrdenes);

    if (datos.modo !== 'reporte') return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Historial de Mantenimiento', 14, 20);

    doc.setFontSize(11);
    doc.text(`Placa: ${moto?.placa || '-'}`, 14, 30);
    doc.text(`Chasis: ${moto?.numero_chasis || '-'}`, 14, 36);
    doc.text(`Cliente: ${moto?.cliente_nombre || '-'}`, 14, 42);
    doc.text(`Marca/Modelo: ${(moto?.marca || '-') + ' ' + (moto?.modelo || '')}`, 14, 48);

    let y = 60;
    listaOrdenes.forEach((orden, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`Orden #${orden.codigo} - ${orden.estado || '-'}`, 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.text(`Fecha inicio: ${orden.fecha_inicio || '-'} | Fecha fin: ${orden.fecha_fin || '-'}`, 14, y);
      y += 6;
      doc.text(`Mecanico: ${orden.mecanico_nombre || '-'}`, 14, y);
      y += 6;
      doc.text(`Total: ${orden.total || 0}`, 14, y);
      y += 8;
      if (index < listaOrdenes.length - 1) {
        doc.setDrawColor(180);
        doc.line(14, y, 195, y);
        y += 6;
      }
    });

    doc.save(`historial_mantenimiento_${moto?.placa || 'vehiculo'}.pdf`);
  };

  return (
    <div className="app-container historial-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/historial-mantenimiento/fondo-historial-mantenimiento-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/historial-mantenimiento/fondo-historial-mantenimiento-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Historial de Mantenimiento (CU15)</h2>
          <div className="page-subtitle">Consulta del historial de mantenimiento de vehículos</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="bitacora-panel historial-search-panel">
        <div className="historial-search-bar">
          <input
            value={criterio}
            onChange={(e) => setCriterio(e.target.value)}
            placeholder="Placa o número de chasis"
            className="bitacora-input"
          />
          <button
            type="button"
            onClick={() => iniciaBusquedaPorPlacaOChasis(criterio)}
            className="bitacora-btn bitacora-btn--filter"
            disabled={cargando}
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            type="button"
            onClick={solicitaReportePDF}
            className="bitacora-btn bitacora-btn--export"
            disabled={cargando}
          >
            Descargar reporte PDF
          </button>
        </div>

        {mensajeError && (
          <div className="historial-warning-box">
            {mensajeError}
          </div>
        )}
      </div>

      {motocicleta && (
        <div className="bitacora-panel historial-vehiculo-panel">
          <h3 className="usuarios-panel-title">Datos del vehículo</h3>
          <div className="historial-info-grid">
            <div className="historial-info-item">
              <span className="historial-info-label">Placa</span>
              <span>{motocicleta.placa || '-'}</span>
            </div>
            <div className="historial-info-item">
              <span className="historial-info-label">Chasis</span>
              <span>{motocicleta.numero_chasis || '-'}</span>
            </div>
            <div className="historial-info-item">
              <span className="historial-info-label">Cliente</span>
              <span>{motocicleta.cliente_nombre || '-'}</span>
            </div>
            <div className="historial-info-item">
              <span className="historial-info-label">Marca/Modelo</span>
              <span>{(motocicleta.marca || '-') + ' ' + (motocicleta.modelo || '')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="historial-content">
        <div className="bitacora-panel historial-ordenes-panel">
          <h3 className="usuarios-panel-title">Órdenes de trabajo</h3>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th>Fecha inicio</th>
                  <th>Fecha fin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No hay historial disponible.</td>
                  </tr>
                ) : (
                  ordenes.map((orden) => (
                    <tr key={orden.codigo}>
                      <td>#{orden.codigo}</td>
                      <td>{orden.estado || '-'}</td>
                      <td>{orden.fecha_inicio || '-'}</td>
                      <td>{orden.fecha_fin || '-'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => seleccionaOrdenParaVerDesglose(orden.codigo)}
                          className="table-action-btn table-action-btn--edit"
                        >
                          Ver desglose
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bitacora-panel historial-desglose-panel">
          <h3 className="usuarios-panel-title">Desglose de la orden</h3>
          {ordenSeleccionada ? (
            <div>
              <p><strong>Orden:</strong> #{ordenSeleccionada.codigo}</p>
              <p><strong>Mecánico:</strong> {ordenSeleccionada.mecanico_nombre || '-'}</p>
              <p><strong>Prioridad:</strong> {ordenSeleccionada.prioridad || '-'}</p>
              <p><strong>Total:</strong> {ordenSeleccionada.total || 0}</p>
              <div style={{ marginTop: '10px' }}>
                {detalles.length === 0 ? (
                  <p>No hay detalles registrados.</p>
                ) : (
                  detalles.map((detalle) => (
                    <div key={detalle.codigo} className="historial-detalle-item">
                      <div><strong>{detalle.tipo}</strong> - {detalle.descripcion}</div>
                      <div>Cantidad: {detalle.cantidad} | Precio: {detalle.precio_unitario} | Subtotal: {detalle.subtotal}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p>Seleccione una orden para ver el desglose.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormHistorial;
