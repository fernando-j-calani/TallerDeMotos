import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
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
    <div style={{ padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#ff6600', margin: 0 }}>Seguimiento para Clientes (CU16)</h2>
        <div>
          <button onClick={() => navigate('/inicio')} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inicio</button>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Mi Perfil</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '15px' }}>{error}</div>}
      {exito && <div className="alert alert-success" style={{ marginBottom: '15px', backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '6px' }}>{exito}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Clientes segmentados</h3>
            <button
              type="button"
              onClick={iniciaPanelFiltraRecordatorios}
              style={{ padding: '6px 12px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              disabled={cargando}
            >
              Refrescar
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Segmento</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Ultima visita</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Accion</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '12px', textAlign: 'center' }}>No hay clientes para seguimiento.</td>
                </tr>
              ) : (
                clientes.map((item) => (
                  <tr key={item.cliente?.codigo || item.ultima_visita || item.segmento} style={{ borderBottom: '1px solid #2c2c2c' }}>
                    <td style={{ padding: '8px' }}>{item.cliente?.nombre || '-'}</td>
                    <td style={{ padding: '8px' }}>{item.segmento || '-'}</td>
                    <td style={{ padding: '8px' }}>{item.ultima_visita || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        type="button"
                        onClick={() => seleccionaClienteYRedactaMensaje(item)}
                        style={{ backgroundColor: '#2c5f8f', border: 'none', color: 'white', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
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

        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
          <h3>Mensaje de seguimiento</h3>
          {clienteSeleccionado ? (
            <div>
              <p><strong>Cliente:</strong> {clienteSeleccionado.nombre}</p>
              <p><strong>Email:</strong> {clienteSeleccionado.email || '-'}</p>
              <div className="input-group">
                <label>Tipo de gestion</label>
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
                className="btn-login"
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
