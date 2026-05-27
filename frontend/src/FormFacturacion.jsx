import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';

const API = `${API_BASE_URL}/api`;

const FormFacturacion = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [form, setForm] = useState({
    orden_id: '',
    metodo_pago: '',
    estado_pago: 'Pendiente',
    nit_cliente: '',
    razon_social: '',
    impuesto: '0',
    observaciones: '',
  });
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
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
      const permitido = await validarPermisoModulo('CU14', ['Mostrar', 'Adicionar'], usuarioLocal?.rol);
      if (!permitido) {
        alert('Acceso denegado para facturacion.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }
      await cargarOrdenesFinalizadas();
      await cargarHistorialFacturacion();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  const cargarOrdenesFinalizadas = async () => {
    try {
      setError('');
      const res = await fetch(`${API}/ordenes-trabajo/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar ordenes.');
        return;
      }
      const lista = Array.isArray(data) ? data : [];
      const finalizadas = lista.filter((o) => (o.estado || '').toLowerCase() === 'finalizado');
      setOrdenes(finalizadas);
    } catch {
      setError('Error de conexion cargando ordenes finalizadas.');
    }
  };

  const cargarHistorialFacturacion = async () => {
    try {
      const res = await fetch(`${API}/facturacion/historial/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar historial de facturacion.');
        return;
      }
      setHistorial(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de conexion cargando historial de facturacion.');
    }
  };

  const seleccionaOrdenFinalizada = (ordenId) => {
    const orden = ordenes.find((o) => Number(o.codigo) === Number(ordenId)) || null;
    setOrdenSeleccionada(orden);
    setResultado(null);
    setForm((prev) => ({
      ...prev,
      orden_id: orden ? orden.codigo : '',
    }));
  };

  const iniciaFacturacion = (ordenId) => {
    seleccionaOrdenFinalizada(ordenId);
  };

  const registraPagoYDatosFiscales = (nit, razonSocial, metodoPago) => {
    setForm((prev) => ({
      ...prev,
      nit_cliente: nit ?? prev.nit_cliente,
      razon_social: razonSocial ?? prev.razon_social,
      metodo_pago: metodoPago ?? prev.metodo_pago,
    }));
  };

  const generarPdfNotaServicio = (data) => {
    const nota = data.nota_servicio || {};
    const orden = data.orden || {};

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Nota de Servicio', 14, 20);
    doc.setFontSize(11);
    doc.text(`Nota #: ${nota.codigo || ''}`, 14, 30);
    doc.text(`Fecha: ${nota.fecha_emision || ''}`, 14, 36);
    doc.text(`Orden #: ${orden.codigo || ''}`, 14, 42);
    doc.text(`Cliente: ${orden.cliente || ''}`, 14, 48);
    doc.text(`Motocicleta: ${orden.motocicleta || ''}`, 14, 54);
    doc.text(`Total repuestos: ${nota.total_repuestos || ''}`, 14, 64);
    doc.text(`Total mano de obra: ${nota.total_mano_obra || ''}`, 14, 70);
    doc.text(`Total general: ${nota.total_general || ''}`, 14, 76);
    doc.text(`Estado pago: ${nota.estado_pago || ''}`, 14, 82);
    doc.save(`nota_servicio_${nota.codigo || 'orden'}.pdf`);
  };

  const generarPdfFactura = (data) => {
    const factura = data.factura || {};
    const orden = data.orden || {};

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Factura', 14, 20);
    doc.setFontSize(11);
    doc.text(`Factura #: ${factura.codigo || ''}`, 14, 30);
    doc.text(`Fecha: ${factura.fecha_emision || ''}`, 14, 36);
    doc.text(`Orden #: ${orden.codigo || ''}`, 14, 42);
    doc.text(`Cliente: ${orden.cliente || ''}`, 14, 48);
    doc.text(`NIT: ${factura.nit_cliente || ''}`, 14, 54);
    doc.text(`Razon social: ${factura.razon_social || ''}`, 14, 60);
    doc.text(`Monto mano de obra: ${factura.monto_servicio_facturado || ''}`, 14, 70);
    doc.text(`Impuesto: ${factura.impuesto || ''}`, 14, 76);
    doc.text(`Total facturado: ${factura.total_facturado || ''}`, 14, 82);
    doc.save(`factura_${factura.codigo || 'orden'}.pdf`);
  };

  const recibeConfirmacionVisualYPDFs = (responseData) => {
    setResultado(responseData);
    generarPdfNotaServicio(responseData);
    generarPdfFactura(responseData);
  };

  const solicitaEmitirComprobantes = async (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    if (!form.orden_id) return setError('Seleccione una orden finalizada.');
    if (!form.nit_cliente || !form.razon_social) return setError('NIT y Razon Social son obligatorios.');

    setCargando(true);
    try {
      const res = await fetch(`${API}/facturacion/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo procesar la facturacion.');
        return;
      }
      recibeConfirmacionVisualYPDFs(data);
      await cargarOrdenesFinalizadas();
      await cargarHistorialFacturacion();
    } catch {
      setError('Error de conexion procesando facturacion.');
    } finally {
      setCargando(false);
    }
  };

  const descargarHistorial = (item) => {
    if (!item?.nota_servicio || !item?.factura) {
      setError('No hay datos completos para generar los PDFs.');
      return;
    }
    recibeConfirmacionVisualYPDFs(item);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Emitir Facturacion (CU14)</h2>
        <div>
          <button onClick={() => navigate('/inicio')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Mi Perfil</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Procesar facturacion</h3>
          <form onSubmit={solicitaEmitirComprobantes}>
            <div className="input-group">
              <label>Orden finalizada</label>
              <select value={form.orden_id} onChange={(e) => iniciaFacturacion(e.target.value)} required>
                <option value="">Seleccione</option>
                {ordenes.map((o) => (
                  <option key={o.codigo} value={o.codigo}>
                    {`#${o.codigo} - ${o.cliente_nombre || ''}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Metodo de pago</label>
              <input
                value={form.metodo_pago}
                onChange={(e) => registraPagoYDatosFiscales(form.nit_cliente, form.razon_social, e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Estado de pago</label>
              <select value={form.estado_pago} onChange={(e) => setForm({ ...form, estado_pago: e.target.value })}>
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Parcial">Parcial</option>
              </select>
            </div>
            <div className="input-group">
              <label>NIT</label>
              <input
                value={form.nit_cliente}
                onChange={(e) => registraPagoYDatosFiscales(e.target.value, form.razon_social, form.metodo_pago)}
                required
              />
            </div>
            <div className="input-group">
              <label>Razon social</label>
              <input
                value={form.razon_social}
                onChange={(e) => registraPagoYDatosFiscales(form.nit_cliente, e.target.value, form.metodo_pago)}
                required
              />
            </div>
            <div className="input-group">
              <label>Impuesto</label>
              <input type="number" step="0.01" value={form.impuesto} onChange={(e) => setForm({ ...form, impuesto: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Observaciones</label>
              <textarea rows="3" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </div>
            <button type="submit" className="btn-login" disabled={cargando}>
              {cargando ? 'Procesando...' : 'Procesar facturacion'}
            </button>
          </form>
        </div>

        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Detalle de la orden</h3>
          {ordenSeleccionada ? (
            <div>
              <p><strong>Orden:</strong> #{ordenSeleccionada.codigo}</p>
              <p><strong>Cliente:</strong> {ordenSeleccionada.cliente_nombre || '-'}</p>
              <p><strong>Motocicleta:</strong> {ordenSeleccionada.motocicleta_placa || '-'}</p>
              <p><strong>Mano de obra:</strong> {ordenSeleccionada.costo_mano_obra || 0}</p>
              <p><strong>Repuestos:</strong> {ordenSeleccionada.costo_repuestos || 0}</p>
              <p><strong>Total:</strong> {ordenSeleccionada.total || 0}</p>
            </div>
          ) : (
            <p>Seleccione una orden finalizada para ver el detalle.</p>
          )}

          {resultado && (
            <div style={{ marginTop: '20px', backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0, color: '#ff6600' }}>Facturacion generada</h4>
              <p><strong>Nota servicio:</strong> #{resultado?.nota_servicio?.codigo || '-'}</p>
              <p><strong>Factura:</strong> #{resultado?.factura?.codigo || '-'}</p>
              <p><strong>Estado orden:</strong> {resultado?.orden?.estado || '-'}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '24px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
        <h3>Historial de facturas</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Orden</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Motocicleta</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Nota</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Factura</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '12px', textAlign: 'center' }}>No hay facturas registradas.</td>
              </tr>
            ) : (
              historial.map((item) => (
                <tr key={`${item?.orden?.codigo || 'orden'}-${item?.factura?.codigo || 'factura'}`} style={{ borderBottom: '1px solid #2c2c2c' }}>
                  <td style={{ padding: '8px' }}>#{item?.orden?.codigo || '-'}</td>
                  <td style={{ padding: '8px' }}>{item?.orden?.cliente_nombre || '-'}</td>
                  <td style={{ padding: '8px' }}>{item?.orden?.motocicleta_placa || '-'}</td>
                  <td style={{ padding: '8px' }}>{item?.orden?.estado || '-'}</td>
                  <td style={{ padding: '8px' }}>#{item?.nota_servicio?.codigo || '-'}</td>
                  <td style={{ padding: '8px' }}>#{item?.factura?.codigo || '-'}</td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => descargarHistorial(item)}
                      style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      Descargar PDFs
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormFacturacion;
