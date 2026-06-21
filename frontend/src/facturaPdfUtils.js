import { jsPDF } from 'jspdf';

export const numeroALetras = (numero) => {
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

export const generarPdfFactura = (data) => {
  const factura = data.factura || {};
  const orden = data.orden || {};
  const cliente = data.cliente || {};
  const detalles = Array.isArray(data.detalles) ? data.detalles : [];

  const razonSocial = cliente?.razon_social || factura?.razon_social || cliente?.nombre || orden?.cliente || '';
  const nitCi = cliente?.nit || factura?.nit_cliente || cliente?.cedula || '';
  const fechaFactura = factura?.fecha_emision || new Date().toISOString().slice(0, 10);
  const fechaTexto = new Date(fechaFactura).toLocaleDateString('es-BO');
  const costoManoObra = Number(orden?.costo_mano_obra || 0) || 0;
  const costoRepuestos = Number(orden?.costo_repuestos || 0) || 0;
  const montoTotal = Number(factura?.monto_servicio_facturado ?? (costoManoObra + costoRepuestos)) || 0;
  const montoTexto = montoTotal.toFixed(2);
  const montoLiteral = numeroALetras(montoTotal);

  // Si la orden tiene items detallados (repuestos/mano de obra usados), se listan todos.
  // Si no, se usa el resumen de costos de la orden (que ya viene de la cotizacion aprobada).
  const filas = detalles.length
    ? detalles.map((item) => ({
      cantidad: item?.cantidad || 1,
      descripcion: item?.descripcion || item?.tipo || 'Item',
      precio: Number(item?.precio_unitario || 0) || 0,
      subtotal: Number(item?.subtotal || 0) || 0,
    }))
    : [
      ...(costoManoObra > 0 ? [{
        cantidad: 1,
        descripcion: 'Mano de obra',
        precio: costoManoObra,
        subtotal: costoManoObra,
      }] : []),
      ...(costoRepuestos > 0 ? [{
        cantidad: 1,
        descripcion: 'Repuestos',
        precio: costoRepuestos,
        subtotal: costoRepuestos,
      }] : []),
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
