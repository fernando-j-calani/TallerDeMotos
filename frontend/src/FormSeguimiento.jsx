import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { repairText } from './textNormalization';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';

const API = `${API_BASE_URL}/api`;

const FormSeguimiento = () => {
  const navigate = useNavigate();
  const usuarioLocal = useMemo(() => JSON.parse(localStorage.getItem('usuario')), []);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [tipoGestion, setTipoGestion] = useState('Seguimiento');
  const [mensaje, setMensaje] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
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
      const permitido = await validarPermisoModulo('CU16', ['Mostrar', 'Buscar', 'Adicionar'], usuarioLocal?.rol);
      if (!permitido) {
        alert('Acceso denegado para seguimiento de clientes.');
        navigate(getHomeRouteByRole(usuarioLocal?.rol));
        return;
      }
      await iniciaPanelFiltraRecordatorios();
    };

    validarAcceso();
  }, [navigate, usuarioLocal]);

  const iniciaPanelFiltraRecordatorios = async () => {
    setError('');
    setExito('');
    setCargando(true);
    try {
      const res = await fetch(`${API}/seguimiento-clientes/`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar seguimiento.');
        return;
      }
      setClientes(Array.isArray(data.clientes) ? data.clientes : []);
    } catch {
      setError('Error de conexion cargando seguimiento.');
    } finally {
      setCargando(false);
    }
  };

  const obtenerPlantilla = (segmento, cliente) => {
    const nombre = cliente?.nombre || 'cliente';
    if (segmento === 'Retiro') {
      return `Hola ${nombre}, tu motocicleta ya esta lista para retiro. Por favor coordina tu visita.`;
    }
    if (segmento === 'Encuesta') {
      return `Hola ${nombre}, esperamos que el servicio haya sido satisfactorio. Puedes compartir tu opinion?`;
    }
    return `Hola ${nombre}, te recordamos tu mantenimiento preventivo. Podemos agendar una visita?`;
  };

  const seleccionaClienteYRedactaMensaje = (cliente) => {
    const dataCliente = cliente?.cliente || null;
    setClienteSeleccionado(dataCliente);
    const segmento = cliente?.segmento || 'Seguimiento';
    setTipoGestion(segmento);
    setMensaje(obtenerPlantilla(segmento, dataCliente));
    setObservaciones('');
    setError('');
    setExito('');
  };

  const ejecutaEnvioYAnotaRespuesta = async () => {
    if (!clienteSeleccionado) {
      setError('Seleccione un cliente antes de enviar.');
      return;
    }
    if (!clienteSeleccionado.email) {
      setError('El cliente no tiene email registrado.');
      return;
    }
    if (!mensaje.trim()) {
      setError('El mensaje es obligatorio.');
      return;
    }

    setError('');
    setExito('');
    setCargando(true);

    try {
      const payload = {
        id_cliente: clienteSeleccionado.codigo,
        email: clienteSeleccionado.email,
        texto: mensaje,
        tipo_gestion: tipoGestion,
        observaciones,
      };

      const res = await fetch(`${API}/seguimiento-clientes/`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.error_critico || 'No se pudo enviar seguimiento.');
        return;
      }
      confirmaRegistroInteraccionVisualmente(data);
    } catch {
      setError('Error de conexion enviando seguimiento.');
    } finally {
      setCargando(false);
    }
  };

  const confirmaRegistroInteraccionVisualmente = async (respuesta) => {
    setExito(respuesta.mensaje || 'Seguimiento enviado y registrado.');
    setClienteSeleccionado(null);
    setTipoGestion('Seguimiento');
    setMensaje('');
    setObservaciones('');
    await iniciaPanelFiltraRecordatorios();
  };

  return (
    <div className="app-container seguimiento-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/seguimiento-clientes/fondo-seguimiento-clientes-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/seguimiento-clientes/fondo-seguimiento-clientes-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Seguimiento para Clientes (CU16)</h2>
          <div className="page-subtitle">Gestión de seguimiento y fidelización de clientes</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}
      {exito && <div className="success-box" style={{ marginTop: '20px' }}>{exito}</div>}

      <div className="seguimiento-content">
        <div className="bitacora-panel seguimiento-list-panel">
          <div className="seguimiento-list-header">
            <h3 className="usuarios-panel-title">Clientes segmentados</h3>
            <button
              type="button"
              onClick={iniciaPanelFiltraRecordatorios}
              className="bitacora-btn bitacora-btn--clear"
              disabled={cargando}
            >
              Refrescar
            </button>
          </div>
          <div className="bitacora-table-wrap">
            <table className="bitacora-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Segmento</th>
                  <th>Última visita</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No hay clientes para seguimiento.</td>
                  </tr>
                ) : (
                  clientes.map((item) => (
                    <tr key={item.cliente?.codigo || item.ultima_visita || item.segmento}>
                      <td>{item.cliente?.nombre || '-'}</td>
                      <td>{item.segmento || '-'}</td>
                      <td>{item.ultima_visita || '-'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => seleccionaClienteYRedactaMensaje(item)}
                          className="table-action-btn table-action-btn--edit"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bitacora-panel seguimiento-detail-panel">
          <h3 className="usuarios-panel-title">Mensaje de seguimiento</h3>
          {clienteSeleccionado ? (
            <div>
              <p><strong>Cliente:</strong> {clienteSeleccionado.nombre}</p>
              <p><strong>Email:</strong> {clienteSeleccionado.email || '-'}</p>
              <div className="input-group">
                <label>Tipo de gestión</label>
                <input value={tipoGestion} onChange={(e) => setTipoGestion(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Mensaje</label>
                <textarea rows="5" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Observaciones</label>
                <textarea rows="3" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={ejecutaEnvioYAnotaRespuesta}
                className="bitacora-btn bitacora-btn--filter"
                disabled={cargando}
              >
                {cargando ? 'Enviando...' : 'Enviar seguimiento'}
              </button>
            </div>
          ) : (
            <p>Seleccione un cliente para redactar el mensaje.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormSeguimiento;
