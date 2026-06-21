import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import './Login.css';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';
import { logoutUniversal } from './auth';
import { generarPdfFactura } from './facturaPdfUtils';

const API = `${API_BASE_URL}/api`;
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'test';

const PagoCliente = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [facturas, setFacturas] = useState([]);

  const headers = (json = true) => {
    const token = localStorage.getItem('token');
    return json
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (!usuarioLocal || usuarioLocal.rol !== 'Cliente') {
      navigate('/login');
      return;
    }

    cargarPendientes();
    cargarFacturas();
  }, [navigate, usuarioLocal]);

  const cargarFacturas = async () => {
    try {
      const res = await fetch(`${API}/mis-facturas/`, { headers: headers(false) });
      const data = await res.json();
      if (res.ok) setFacturas(Array.isArray(data.facturas) ? data.facturas : []);
    } catch {
      // El historial de facturas es informativo; si falla, no bloquea el resto de la pantalla.
    }
  };

  const cargarPendientes = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await fetch(`${API}/mis-pagos/`, { headers: headers(false) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudieron cargar tus pagos pendientes.');
        setOrdenes([]);
        return;
      }

      setOrdenes(Array.isArray(data.ordenes) ? data.ordenes : []);
      if (data.mensaje) {
        setError(data.mensaje);
      }
    } catch {
      setError('Error de conexión cargando tus pagos pendientes.');
    } finally {
      setCargando(false);
    }
  };

  const seleccionaOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setMetodoPago('');
    setComprobante(null);
    setError('');
    setResultado(null);
  };

  const enviarComprobanteQR = async (e) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;
    if (!comprobante) return setError('Debe adjuntar el comprobante de pago.');

    setProcesando(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('orden_id', ordenSeleccionada.codigo);
      formData.append('comprobante_pago', comprobante);

      const res = await fetch(`${API}/mis-pagos/qr/`, {
        method: 'POST',
        headers: headers(false),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo registrar el pago.');
        return;
      }

      setResultado(data);
      setComprobante(null);
      setOrdenSeleccionada(null);
      setMetodoPago('');
      await cargarPendientes();
      await cargarFacturas();
    } catch {
      setError('Error de conexión registrando el pago.');
    } finally {
      setProcesando(false);
    }
  };

  const crearOrdenPaypal = async () => {
    const res = await fetch(`${API}/mis-pagos/paypal/crear-orden/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ orden_id: ordenSeleccionada.codigo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo iniciar el pago con PayPal.');
    return data.paypal_order_id;
  };

  const capturarOrdenPaypal = async (paypalOrderId) => {
    const res = await fetch(`${API}/mis-pagos/paypal/capturar/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ orden_id: ordenSeleccionada.codigo, paypal_order_id: paypalOrderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo confirmar el pago con PayPal.');
    return data;
  };

  const cerrarSesion = async () => {
    await logoutUniversal();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-container facturacion-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/facturacion/fondo-facturacion-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/facturacion/fondo-facturacion-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Pagar mi orden</h2>
          <div className="page-subtitle">Paga tus órdenes finalizadas con QR o PayPal</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/mis-motocicletas')} className="btn-secondary">Mi Garaje</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={cerrarSesion} className="btn-secondary">Cerrar Sesión</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      {cargando ? (
        <div className="bitacora-panel" style={{ marginTop: '20px' }}>Cargando órdenes pendientes...</div>
      ) : ordenes.length === 0 && !resultado ? (
        <div className="garage-empty">
          <i className="fa-solid fa-receipt"></i>
          No tienes órdenes pendientes de pago.
        </div>
      ) : (
        <div className="facturacion-content">
          <div className="bitacora-panel facturacion-form-panel">
            <h3 className="usuarios-panel-title">Órdenes pendientes de pago</h3>
            {ordenes.length === 0 ? (
              <p>No tienes órdenes pendientes de pago.</p>
            ) : (
              ordenes.map((orden) => (
                <div key={orden.codigo} className="input-group">
                  <button
                    type="button"
                    className={`bitacora-btn ${ordenSeleccionada?.codigo === orden.codigo ? 'bitacora-btn--filter' : 'btn-secondary'}`}
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => seleccionaOrden(orden)}
                  >
                    Orden #{orden.codigo} - {orden.motocicleta_placa || 'Sin placa'} - Total: {orden.total_general}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="bitacora-panel facturacion-detail-panel">
            <h3 className="usuarios-panel-title">Pagar</h3>

            {resultado && (
              <div className="facturacion-result-box">
                <h4>¡Pago registrado!</h4>
                <p><strong>Nota servicio:</strong> #{resultado?.nota_servicio?.codigo || '-'}</p>
                <p><strong>Factura:</strong> #{resultado?.factura?.codigo || '-'}</p>
                <p><strong>Estado orden:</strong> {resultado?.orden?.estado || '-'}</p>
                <p><strong>Método de pago:</strong> {resultado?.factura?.metodo_pago || '-'}</p>
                <button
                  type="button"
                  className="bitacora-btn bitacora-btn--filter"
                  style={{ marginTop: '10px' }}
                  onClick={() => generarPdfFactura(resultado)}
                >
                  Descargar factura (PDF)
                </button>
              </div>
            )}

            {!ordenSeleccionada ? (
              <p>Selecciona una orden pendiente para realizar el pago.</p>
            ) : (
              <>
                <div className="facturacion-detail-info">
                  <p><strong>Orden:</strong> #{ordenSeleccionada.codigo}</p>
                  <p><strong>Motocicleta:</strong> {ordenSeleccionada.motocicleta_placa || '-'}</p>
                  <p><strong>Mano de obra:</strong> {ordenSeleccionada.costo_mano_obra || 0}</p>
                  <p><strong>Repuestos:</strong> {ordenSeleccionada.costo_repuestos || 0}</p>
                  <p><strong>Total a pagar:</strong> {ordenSeleccionada.total_general}</p>
                </div>

                <div className="input-group">
                  <label>Método de pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => {
                      setMetodoPago(e.target.value);
                      setComprobante(null);
                      setError('');
                    }}
                  >
                    <option value="">Seleccione</option>
                    <option value="QR">QR</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>

                {metodoPago === 'QR' && (
                  <form onSubmit={enviarComprobanteQR}>
                    <div className="facturacion-pago-info">
                      <div className="facturacion-qr-wrap">
                        <img src="/static/img/facturacion/qr-pago.jpeg" alt="QR para pago" className="facturacion-qr-img" />
                        <p className="facturacion-qr-hint">Escanea el código con tu app bancaria para pagar</p>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Comprobante de pago</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setComprobante(e.target.files[0] || null)}
                        required
                      />
                    </div>
                    <button type="submit" className="bitacora-btn bitacora-btn--filter" disabled={procesando} style={{ marginTop: '16px' }}>
                      {procesando ? 'Enviando...' : 'Enviar comprobante'}
                    </button>
                  </form>
                )}

                {metodoPago === 'PayPal' && (
                  <div style={{ marginTop: '16px' }}>
                    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
                      <PayPalButtons
                        style={{ layout: 'vertical' }}
                        disabled={procesando}
                        forceReRender={[ordenSeleccionada?.codigo]}
                        createOrder={() => crearOrdenPaypal()}
                        onApprove={async (data) => {
                          setProcesando(true);
                          setError('');
                          try {
                            const respuesta = await capturarOrdenPaypal(data.orderID);
                            setResultado(respuesta);
                            setOrdenSeleccionada(null);
                            setMetodoPago('');
                            await cargarPendientes();
                            await cargarFacturas();
                          } catch (err) {
                            setError(err.message || 'No se pudo confirmar el pago con PayPal.');
                          } finally {
                            setProcesando(false);
                          }
                        }}
                        onError={() => setError('Ocurrió un error al procesar el pago con PayPal.')}
                      />
                    </PayPalScriptProvider>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="bitacora-panel facturacion-history-panel">
        <h3 className="usuarios-panel-title">Mis Facturas</h3>
        <div className="bitacora-table-wrap">
          <table className="bitacora-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Motocicleta</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Método</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No tienes facturas registradas todavía.</td>
                </tr>
              ) : (
                facturas.map((item) => (
                  <tr key={`${item?.orden?.codigo || 'orden'}-${item?.factura?.codigo || 'factura'}`}>
                    <td>#{item?.orden?.codigo || '-'}</td>
                    <td>{item?.orden?.motocicleta_placa || '-'}</td>
                    <td>{item?.factura?.fecha_emision || '-'}</td>
                    <td>{item?.nota_servicio?.total_general || '-'}</td>
                    <td>{item?.factura?.metodo_pago || '-'}</td>
                    <td>
                      <button
                        onClick={() => generarPdfFactura(item)}
                        className="table-action-btn table-action-btn--success"
                      >
                        Descargar PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PagoCliente;
