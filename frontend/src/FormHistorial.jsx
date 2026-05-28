import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
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
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Historial de Mantenimiento (CU15)</h2>
        <div>
          <button onClick={() => navigate('/inicio')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Mi Perfil</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}
      {mensajeError && (
        <div className="alert alert-warning" style={{ marginBottom: '15px', backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '6px' }}>
          {mensajeError}
        </div>
      )}

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={criterio}
            onChange={(e) => setCriterio(e.target.value)}
            placeholder="Placa o numero de chasis"
            style={{ flex: 1, minWidth: '220px', padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#111', color: 'white' }}
          />
          <button
            type="button"
            onClick={() => iniciaBusquedaPorPlacaOChasis(criterio)}
            style={{ padding: '10px 16px', backgroundColor: '#2c5f8f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            disabled={cargando}
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            type="button"
            onClick={solicitaReportePDF}
            style={{ padding: '10px 16px', backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            disabled={cargando}
          >
            Descargar reporte PDF
          </button>
        </div>
      </div>

      {motocicleta && (
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3>Datos del vehiculo</h3>
          <p><strong>Placa:</strong> {motocicleta.placa || '-'}</p>
          <p><strong>Chasis:</strong> {motocicleta.numero_chasis || '-'}</p>
          <p><strong>Cliente:</strong> {motocicleta.cliente_nombre || '-'}</p>
          <p><strong>Marca/Modelo:</strong> {(motocicleta.marca || '-') + ' ' + (motocicleta.modelo || '')}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Ordenes de trabajo</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Orden</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha inicio</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha fin</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No hay historial disponible.</td>
                </tr>
              ) : (
                ordenes.map((orden) => (
                  <tr key={orden.codigo} style={{ borderBottom: '1px solid #2c2c2c' }}>
                    <td style={{ padding: '8px' }}>#{orden.codigo}</td>
                    <td style={{ padding: '8px' }}>{orden.estado || '-'}</td>
                    <td style={{ padding: '8px' }}>{orden.fecha_inicio || '-'}</td>
                    <td style={{ padding: '8px' }}>{orden.fecha_fin || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        type="button"
                        onClick={() => seleccionaOrdenParaVerDesglose(orden.codigo)}
                        style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
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

        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Desglose de la orden</h3>
          {ordenSeleccionada ? (
            <div>
              <p><strong>Orden:</strong> #{ordenSeleccionada.codigo}</p>
              <p><strong>Mecanico:</strong> {ordenSeleccionada.mecanico_nombre || '-'}</p>
              <p><strong>Prioridad:</strong> {ordenSeleccionada.prioridad || '-'}</p>
              <p><strong>Total:</strong> {ordenSeleccionada.total || 0}</p>
              <div style={{ marginTop: '10px' }}>
                {detalles.length === 0 ? (
                  <p>No hay detalles registrados.</p>
                ) : (
                  detalles.map((detalle) => (
                    <div key={detalle.codigo} style={{ borderBottom: '1px solid #333', padding: '6px 0' }}>
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
