import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './Login.css';
import { getHomeRouteByRole } from './navigation';
import { API_BASE_URL } from './config';
import { validarPermisoModulo } from './permissions';
import { repairText } from './textNormalization';

const API = `${API_BASE_URL}/api`;

// Datos configurables via frontend/.env.local (no se suben al repositorio)
const DATOS_CUENTA_BANCARIA = {
  banco: process.env.REACT_APP_BANCO_NOMBRE || 'Banco Ejemplo',
  tipoCuenta: process.env.REACT_APP_BANCO_TIPO_CUENTA || 'Ahorros',
  numeroCuenta: process.env.REACT_APP_BANCO_NUMERO_CUENTA || '0000000-000-000',
  titular: process.env.REACT_APP_BANCO_TITULAR || 'Nombre Apellido',
  nit: process.env.REACT_APP_BANCO_NIT || '00000000',
};

const numeroALetras = (numero) => {
  const n = Math.floor(Number(numero) || 0);
  if (n === 0) return 'CERO';

  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISEIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const convertirMenor100 = (valor) => {
    if (valor < 10) return unidades[valor];
    if (valor >= 10 && valor < 20) return especiales[valor - 10];
    if (valor === 20) return 'VEINTE';
    if (valor > 20 && valor < 30) return `VEINTI${unidades[valor - 20]}`;
    const d = Math.floor(valor / 10);
    const u = valor % 10;
    if (u === 0) return decenas[d];
    return `${decenas[d]} Y ${unidades[u]}`;
  };

  const convertirMenor1000 = (valor) => {
    if (valor === 100) return 'CIEN';
    if (valor < 100) return convertirMenor100(valor);
    const c = Math.floor(valor / 100);
    const resto = valor % 100;
    if (resto === 0) return centenas[c];
    return `${centenas[c]} ${convertirMenor100(resto)}`;
  };

  if (n < 1000) return convertirMenor1000(n).trim();
  if (n < 2000) {
    const resto = n - 1000;
    return resto ? `MIL ${convertirMenor1000(resto)}`.trim() : 'MIL';
  }
  if (n < 10000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const milesTexto = `${unidades[miles]} MIL`;
    return resto ? `${milesTexto} ${convertirMenor1000(resto)}`.trim() : milesTexto;
  }
  return 'MIL';
};

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
  const [comprobante, setComprobante] = useState(null);

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

  const cambiaMetodoPago = (metodoPago) => {
    registraPagoYDatosFiscales(form.nit_cliente, form.razon_social, metodoPago);
    if (metodoPago !== 'Transferencia' && metodoPago !== 'QR') {
      setComprobante(null);
    }
  };

  const generarPdfOrdenServicio = (data) => {
    const orden = data.orden || {};
    const cliente = data.cliente || {};
    const moto = data.motocicleta || {};
    const detalles = Array.isArray(data.detalles) ? data.detalles : [];

    const clienteNombre = cliente?.nombre || orden?.cliente_nombre || orden?.cliente || '';
    const clienteEmail = cliente?.email || orden?.cliente_email || '';
    const clienteCedula = cliente?.cedula || orden?.cliente_cedula || '';
    const clienteNit = cliente?.nit || orden?.cliente_nit || '';
    const clienteRazon = cliente?.razon_social || orden?.cliente_razon_social || '';
    const clienteTelefono = cliente?.telefono || orden?.cliente_telefono || '';

    const placa = moto?.placa || orden?.motocicleta_placa || '';
    const marca = moto?.marca || orden?.motocicleta_marca || '';
    const modelo = moto?.modelo || orden?.motocicleta_modelo || '';
    const chasis = moto?.numero_chasis || orden?.motocicleta_chasis || '';

    const horaIngreso = orden?.hora_ingreso || '';
    const proformaNro = orden?.proforma_nro || '';
    const entregadoPor = orden?.entregado_por_nombre || '';
    const entregadoCi = orden?.entregado_por_ci || '';
    const combustibleNivel = orden?.combustible_nivel || '';
    const kilometrajeRecorrido = orden?.kilometraje_recorrido || '';
    const fechaEstimadaEntrega = orden?.fecha_estimada_entrega || '';
    const cotizadoPor = orden?.cotizado_por || '';
    const estadoOrden = orden?.estado || '';
    const fechaFin = orden?.fecha_fin || '';
    const fechaCreacion = orden?.fecha_creacion || '';

    const toNumber = (value) => Number(value || 0) || 0;
    const formatDate = (value) => (value ? new Date(value).toLocaleDateString('es-BO') : '');
    const formatDateTime = (value) => (value ? new Date(value).toLocaleString('es-BO', { hour12: false }) : '');
    const nowText = formatDateTime(new Date());

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const marginX = 14;
    const contentWidth = 182;

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('LA ROCA', marginX, 14);
    doc.setFontSize(12);
    doc.text(`Orden de Servicio No. ${orden?.codigo || ''}`, pageWidth / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Usuario: ${usuarioLocal?.nombre || ''}`, pageWidth - marginX, 10, { align: 'right' });
    doc.text(`Fecha/Hora: ${nowText}`, pageWidth - marginX, 14, { align: 'right' });

    // Section 1: Info
    const infoY = 18;
    const infoH = 52;
    doc.rect(marginX, infoY, contentWidth, infoH);
    doc.line(marginX + contentWidth / 2, infoY, marginX + contentWidth / 2, infoY + infoH);

    doc.setFontSize(8.5);
    const leftX = marginX + 2;
    const rightX = marginX + contentWidth / 2 + 2;
    const lineH = 4.5;
    let y = infoY + 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(fechaCreacion), leftX + 20, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Hora ingreso:', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(horaIngreso, leftX + 28, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente ID:', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clienteCedula, leftX + 24, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clienteNombre, leftX + 18, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clienteEmail, leftX + 16, y);

    y = infoY + 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Razon Social:', rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clienteRazon, rightX + 30, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('NIT:', rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clienteNit, rightX + 12, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA:', rightX, y);
    doc.setFillColor(255, 230, 200);
    doc.rect(rightX + 24, y - 3.2, 40, 4.6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.text(proformaNro, rightX + 25, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Placa:', rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(placa, rightX + 14, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Marca:', rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(marca, rightX + 16, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Modelo:', rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(modelo, rightX + 18, y);
    y += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Chasis:', rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(chasis, rightX + 18, y);

    // Section 2: Logistics
    const logY = infoY + infoH + 4;
    const logH = 34;
    const halfW = contentWidth / 2;
    doc.rect(marginX, logY, halfW, logH);
    doc.rect(marginX + halfW, logY, halfW, logH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ENTREGA', marginX + 2, logY + 5);
    doc.text('RECEPCION', marginX + halfW + 2, logY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.text(`Nombre: ${entregadoPor}`, marginX + 2, logY + 11);
    doc.text(`CI: ${entregadoCi}`, marginX + 2, logY + 16);
    doc.text(`Telefono: ${clienteTelefono}`, marginX + 2, logY + 21);

    doc.text(`Recibido por: ${usuarioLocal?.nombre || ''}`, marginX + halfW + 2, logY + 11);
    doc.text(`Combustible %: ${combustibleNivel}`, marginX + halfW + 2, logY + 16);
    doc.text(`Kilometraje: ${kilometrajeRecorrido}`, marginX + halfW + 2, logY + 21);
    doc.text(`Tecnico: ${orden?.mecanico_nombre || ''}`, marginX + halfW + 2, logY + 26);
    doc.text(`Cotizado por: ${cotizadoPor}`, marginX + halfW + 2, logY + 30);

    doc.setFont('helvetica', 'bold');
    doc.text(`Entrega Estimada: ${formatDate(fechaEstimadaEntrega)}`, pageWidth - marginX, logY + 11, { align: 'right' });
    doc.text(`Entrega Real: ${formatDate(fechaFin)}`, pageWidth - marginX, logY + 16, { align: 'right' });
    doc.text(`Estado: ${estadoOrden}`, pageWidth - marginX, logY + 21, { align: 'right' });

    // Section 3: Table
    const tableY = logY + logH + 6;
    const headerH = 7;
    const groupH = 6;
    const rowH = 6;
    const maxRows = Math.min(detalles.length, 8);
    const totalRows = maxRows + 2;
    const tableH = headerH + groupH + totalRows * rowH;
    const colWidths = [50, 35, 30, 25, 42];
    const colX = [marginX];
    colWidths.forEach((width) => {
      colX.push(colX[colX.length - 1] + width);
    });

    doc.rect(marginX, tableY, contentWidth, tableH);
    colX.slice(1).forEach((x) => doc.line(x, tableY, x, tableY + tableH));

    doc.setFillColor(230, 230, 230);
    doc.rect(marginX, tableY, contentWidth, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Producto', marginX + 2, tableY + 4.8);
    doc.text('No. Parte', colX[1] + 2, tableY + 4.8);
    doc.text('Precio', colX[2] + 2, tableY + 4.8);
    doc.text('Cant.', colX[3] + 2, tableY + 4.8);
    doc.text('Total', colX[4] + 2, tableY + 4.8);

    doc.setFillColor(245, 245, 245);
    doc.rect(marginX, tableY + headerH, contentWidth, groupH, 'F');
    doc.text('COBRAR EN PROFORMA', marginX + 2, tableY + headerH + 4.2);

    doc.setFont('helvetica', 'normal');
    let rowY = tableY + headerH + groupH;
    for (let i = 0; i < maxRows; i += 1) {
      const item = detalles[i] || {};
      const producto = item.descripcion || item.producto_nombre || item.tipo || 'Repuesto';
      const noParte = item.producto_codigo_barras || item.producto_codigo || '';
      rowY += rowH;
      doc.text(String(producto), marginX + 2, rowY - 2);
      doc.text(String(noParte), colX[1] + 2, rowY - 2);
      doc.text(String(item.precio_unitario || ''), colX[2] + 2, rowY - 2);
      doc.text(String(item.cantidad || ''), colX[3] + 2, rowY - 2);
      doc.text(String(item.subtotal || ''), colX[4] + 2, rowY - 2);
      doc.line(marginX, rowY, marginX + contentWidth, rowY);
    }

    const totalGeneral = detalles.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
    const subtotalY = tableY + headerH + groupH + maxRows * rowH;
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal', colX[3] - 6, subtotalY - 2);
    doc.text(totalGeneral.toFixed(2), colX[4] + 2, subtotalY - 2);
    doc.line(marginX, subtotalY, marginX + contentWidth, subtotalY);

    const totalY = subtotalY + rowH;
    doc.text('Total General', colX[3] - 8, totalY - 2);
    doc.text(totalGeneral.toFixed(2), colX[4] + 2, totalY - 2);
    doc.line(marginX, totalY, marginX + contentWidth, totalY);

    // Section 4: Footer
    const footerY = tableY + tableH + 6;
    const footerH = 36;
    doc.rect(marginX, footerY, contentWidth, footerH);
    doc.line(marginX + contentWidth / 2, footerY, marginX + contentWidth / 2, footerY + footerH);
    doc.setFontSize(8.3);
    doc.setFont('helvetica', 'bold');
    doc.text('REQUERIMIENTOS DEL CLIENTE', marginX + 2, footerY + 5);
    doc.text('TRABAJOS Y/O SOLUCIONES', marginX + contentWidth / 2 + 2, footerY + 5);

    const toList = (text) => {
      if (!text) return [];
      const byLine = text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
      if (byLine.length > 1) return byLine;
      const bySemi = text.split(';').map((t) => t.trim()).filter(Boolean);
      if (bySemi.length > 1) return bySemi;
      return text.split('.').map((t) => t.trim()).filter(Boolean);
    };

    doc.setFont('helvetica', 'normal');
    const reqList = toList(orden?.req_cliente || '');
    const solList = toList(orden?.soluciones_tecnicas || '');
    let reqY = footerY + 10;
    let solY = footerY + 10;
    reqList.slice(0, 4).forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, marginX + 2, reqY);
      reqY += 5;
    });
    solList.slice(0, 4).forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, marginX + contentWidth / 2 + 2, solY);
      solY += 5;
    });

    const sugY = footerY + footerH + 4;
    const sugH = 16;
    doc.rect(marginX, sugY, contentWidth, sugH);
    doc.setFont('helvetica', 'bold');
    doc.text('SUGERENCIAS Y/U OBSERVACIONES', marginX + 2, sugY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const sugText = (orden?.sugerencias_obs || '').toString();
    const sugLines = doc.splitTextToSize(sugText, contentWidth - 4);
    doc.text(sugLines.slice(0, 2), marginX + 2, sugY + 10);

    doc.save(`orden_servicio_${orden?.codigo || 'orden'}.pdf`);
  };

  const generarPdfFactura = (data) => {
    const factura = data.factura || {};
    const orden = data.orden || {};
    const cliente = data.cliente || {};
    const detalles = Array.isArray(data.detalles) ? data.detalles : [];

    const razonSocial = cliente?.razon_social || factura?.razon_social || cliente?.nombre || orden?.cliente || '';
    const nitCi = cliente?.nit || factura?.nit_cliente || cliente?.cedula || '';
    const fechaFactura = factura?.fecha_emision || new Date().toISOString().slice(0, 10);
    const fechaTexto = new Date(fechaFactura).toLocaleDateString('es-BO');
    const montoManoObra = Number(orden?.costo_mano_obra || factura?.monto_servicio_facturado || 0) || 0;
    const montoTexto = montoManoObra.toFixed(2);
    const montoLiteral = numeroALetras(montoManoObra);

    const servicios = detalles.filter((item) => {
      const tipo = (item?.tipo || '').toLowerCase();
      const descripcion = (item?.descripcion || '').toLowerCase();
      return tipo.includes('servicio') || tipo.includes('mano') || descripcion.includes('servicio') || descripcion.includes('mano');
    });

    const filas = servicios.length
      ? servicios.map((item) => ({
        cantidad: item?.cantidad || 1,
        descripcion: item?.descripcion || item?.tipo || 'Servicio',
        precio: Number(item?.precio_unitario || montoManoObra) || 0,
        subtotal: Number(item?.subtotal || montoManoObra) || 0,
      }))
      : [
        {
          cantidad: 1,
          descripcion: 'Servicio de Mantenimiento General (Mano de Obra)',
          precio: montoManoObra,
          subtotal: montoManoObra,
        },
      ];

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const marginX = 14;
    const contentWidth = 182;

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    // Encabezado izquierdo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('TALLER LA ROCA', marginX, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Casa Matriz', marginX, 21);
    doc.text('Direccion: 6to Anillo, entre Av. 2 de Agosto y Av. Alemana', marginX, 25);
    doc.text('Telefono: 73766956', marginX, 29);
    doc.text('Santa Cruz - Bolivia', marginX, 33);

    // Encabezado derecho (Caja fiscal)
    const boxW = 70;
    const boxH = 22;
    const boxX = pageWidth - marginX - boxW;
    const boxY = 12;
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('NIT: 123456789', boxX + 4, boxY + 6);
    doc.text(`FACTURA N°: ${factura?.codigo || ''}`, boxX + 4, boxY + 12);
    doc.text(`AUTORIZACION N°: ${factura?.numero_autorizacion || '10000012345'}`, boxX + 4, boxY + 18);

    // Titulo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('F A C T U R A', pageWidth / 2, 45, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('Con derecho a credito fiscal', pageWidth / 2, 50, { align: 'center' });

    // Datos cliente
    const clienteY = 54;
    const clienteH = 18;
    doc.rect(marginX, clienteY, contentWidth, clienteH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Lugar y Fecha: Santa Cruz, ${fechaTexto}`, marginX + 2, clienteY + 6);
    doc.text(`Senor(es): ${razonSocial}`, marginX + 2, clienteY + 12);
    doc.text(`NIT/CI: ${nitCi}`, marginX + 2, clienteY + 16);

    // Tabla detalle
    const tableY = clienteY + clienteH + 4;
    const headerH = 7;
    const rowH = 7;
    const maxRows = Math.min(filas.length, 6);
    const tableH = headerH + rowH * (maxRows + 1);
    const colWidths = [20, 90, 30, 42];
    const colX = [marginX];
    colWidths.forEach((width) => {
      colX.push(colX[colX.length - 1] + width);
    });

    doc.rect(marginX, tableY, contentWidth, tableH);
    colX.slice(1).forEach((x) => doc.line(x, tableY, x, tableY + tableH));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CANTIDAD', colX[0] + 2, tableY + 5);
    doc.text('DESCRIPCION', colX[1] + 2, tableY + 5);
    doc.text('P. UNITARIO', colX[2] + 2, tableY + 5);
    doc.text('SUBTOTAL', colX[3] + 2, tableY + 5);

    doc.setFont('helvetica', 'normal');
    let rowY = tableY + headerH;
    for (let i = 0; i < maxRows; i += 1) {
      const item = filas[i];
      rowY += rowH;
      doc.text(String(item.cantidad || ''), colX[0] + 2, rowY - 2);
      doc.text(String(item.descripcion || ''), colX[1] + 2, rowY - 2);
      doc.text(String(item.precio.toFixed(2)), colX[2] + 2, rowY - 2);
      doc.text(String(item.subtotal.toFixed(2)), colX[3] + 2, rowY - 2);
      doc.line(marginX, rowY, marginX + contentWidth, rowY);
    }

    const totalY = tableY + tableH + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`SON: ${montoLiteral} 00/100 BOLIVIANOS`, marginX, totalY);

    const totalBoxW = 60;
    const totalBoxH = 10;
    const totalBoxX = pageWidth - marginX - totalBoxW;
    const totalBoxY = totalY - 6;
    doc.rect(totalBoxX, totalBoxY, totalBoxW, totalBoxH);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL Bs. ${montoTexto}`, totalBoxX + 4, totalBoxY + 6.5);

    const leyendaY = totalBoxY + totalBoxH + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAIS, EL USO ILICITO SERA SANCIONADO SEGUN LEY.', pageWidth / 2, leyendaY, { align: 'center' });
    doc.text('Ley N° 453: El proveedor debera entregar el producto en las modalidades y terminos ofertados.', pageWidth / 2, leyendaY + 4, { align: 'center' });

    doc.save(`factura_${factura?.codigo || 'orden'}.pdf`);
  };

  const recibeConfirmacionVisualYPDFs = (responseData) => {
    setResultado(responseData);
    generarPdfOrdenServicio(responseData);
    generarPdfFactura(responseData);
  };

  const solicitaEmitirComprobantes = async (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    if (!form.orden_id) return setError('Seleccione una orden finalizada.');
    if (!form.nit_cliente || !form.razon_social) return setError('NIT y Razon Social son obligatorios.');
    if ((form.metodo_pago === 'Transferencia' || form.metodo_pago === 'QR') && !comprobante) {
      return setError('Debe adjuntar el comprobante de pago.');
    }

    setCargando(true);
    try {
      let body;
      const { 'Content-Type': contentType, ...resto } = headers();
      let requestHeaders = { 'Content-Type': contentType, ...resto };
      if (comprobante) {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ''));
        formData.append('comprobante_pago', comprobante);
        body = formData;
        requestHeaders = resto;
      } else {
        body = JSON.stringify(form);
      }

      const res = await fetch(`${API}/facturacion/`, {
        method: 'POST',
        headers: requestHeaders,
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo procesar la facturacion.');
        return;
      }
      recibeConfirmacionVisualYPDFs(data);
      setComprobante(null);
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
    <div className="app-container facturacion-page">
      <div className="page-bg-layer page-bg-layer--a" style={{ backgroundImage: 'url(/static/img/facturacion/fondo-facturacion-1.png)' }}></div>
      <div className="page-bg-layer page-bg-layer--b" style={{ backgroundImage: 'url(/static/img/facturacion/fondo-facturacion-2.png)' }}></div>
      <div className="page-bg-overlay"></div>

      <div className="top-panel">
        <div className="page-title">
          <h2>Emitir Facturación (CU14)</h2>
          <div className="page-subtitle">Generación de notas de servicio y facturas a partir de órdenes finalizadas</div>
        </div>
        <div className="user-actions">
          <span>👤 {repairText(usuarioLocal?.nombre)} ({repairText(usuarioLocal?.rol)})</span>
          <button onClick={() => navigate('/inicio')} className="btn-secondary">Inicio</button>
          <button onClick={() => navigate('/perfil')} className="btn-secondary">Mi Perfil</button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Atrás</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="facturacion-content">
        <div className="bitacora-panel facturacion-form-panel">
          <h3 className="usuarios-panel-title">Procesar facturación</h3>
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
              <label>Método de pago</label>
              <select
                value={form.metodo_pago}
                onChange={(e) => cambiaMetodoPago(e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="QR">QR</option>
              </select>
            </div>

            {(form.metodo_pago === 'Transferencia' || form.metodo_pago === 'QR') && (
              <div className="facturacion-pago-info">
                <p><strong>Banco:</strong> {DATOS_CUENTA_BANCARIA.banco}</p>
                <p><strong>Tipo de cuenta:</strong> {DATOS_CUENTA_BANCARIA.tipoCuenta}</p>
                <p><strong>N° de cuenta:</strong> {DATOS_CUENTA_BANCARIA.numeroCuenta}</p>
                <p><strong>Titular:</strong> {DATOS_CUENTA_BANCARIA.titular}</p>
                <p><strong>NIT:</strong> {DATOS_CUENTA_BANCARIA.nit}</p>
                {form.metodo_pago === 'QR' && (
                  <div className="facturacion-qr-wrap">
                    <img src="/static/img/facturacion/qr-pago.jpeg" alt="QR para pago" className="facturacion-qr-img" />
                    <p className="facturacion-qr-hint">Escanea el código con tu app bancaria para pagar</p>
                  </div>
                )}
              </div>
            )}

            {(form.metodo_pago === 'Transferencia' || form.metodo_pago === 'QR') && (
              <div className="input-group">
                <label>Comprobante de pago</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setComprobante(e.target.files[0] || null)}
                  required
                />
              </div>
            )}

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
              <label>Razón social</label>
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
            <button type="submit" className="bitacora-btn bitacora-btn--filter" disabled={cargando} style={{ marginTop: '16px' }}>
              {cargando ? 'Procesando...' : 'Procesar facturación'}
            </button>
          </form>
        </div>

        <div className="bitacora-panel facturacion-detail-panel">
          <h3 className="usuarios-panel-title">Detalle de la orden</h3>
          {ordenSeleccionada ? (
            <div className="facturacion-detail-info">
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
            <div className="facturacion-result-box">
              <h4>Facturación generada</h4>
              <p><strong>Nota servicio:</strong> #{resultado?.nota_servicio?.codigo || '-'}</p>
              <p><strong>Factura:</strong> #{resultado?.factura?.codigo || '-'}</p>
              <p><strong>Estado orden:</strong> {resultado?.orden?.estado || '-'}</p>
              <p><strong>Método de pago:</strong> {resultado?.factura?.metodo_pago || resultado?.metodo_pago || '-'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bitacora-panel facturacion-history-panel">
        <h3 className="usuarios-panel-title">Historial de facturas</h3>
        <div className="bitacora-table-wrap">
          <table className="bitacora-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Motocicleta</th>
                <th>Estado</th>
                <th>Nota</th>
                <th>Factura</th>
                <th>Método</th>
                <th>Comprobante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>No hay facturas registradas.</td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={`${item?.orden?.codigo || 'orden'}-${item?.factura?.codigo || 'factura'}`}>
                    <td>#{item?.orden?.codigo || '-'}</td>
                    <td>{item?.orden?.cliente_nombre || '-'}</td>
                    <td>{item?.orden?.motocicleta_placa || '-'}</td>
                    <td>{item?.orden?.estado || '-'}</td>
                    <td>#{item?.nota_servicio?.codigo || '-'}</td>
                    <td>#{item?.factura?.codigo || '-'}</td>
                    <td>{item?.factura?.metodo_pago || '-'}</td>
                    <td>
                      {item?.factura?.metodo_pago === 'PayPal' ? (
                        item?.factura?.comprobante_pago ? `PayPal: ${item.factura.comprobante_pago}` : '-'
                      ) : item?.factura?.comprobante_pago ? (
                        <a
                          href={`${API_BASE_URL}/media/${item.factura.comprobante_pago}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => descargarHistorial(item)}
                        className="table-action-btn table-action-btn--success"
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
    </div>
  );
};

export default FormFacturacion;
