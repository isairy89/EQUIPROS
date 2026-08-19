import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Conduce, Empleado, DespachoGasoil, Equipo } from '../types/index.ts';
import { formatCurrency, formatDate, formatNumber } from './formatters.ts';

// 1. Export single Conduce (Receipt / Proof of Delivery)
export function exportSingleConducePDF(conduce: Conduce) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Brand Name
  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPROCI', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text('ALQUILER DE MAQUINARIA PESADA • TRANSPORTE • MOVIMIENTO DE TIERRA', 14, 25);
  doc.text('RNC: 1-31-00000-1 | Tel: (809) 555-0100 | Santo Domingo, Rep. Dom.', 14, 31);

  // Conduce Badge
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(140, 10, 56, 18, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDUCE DE TRABAJO', 143, 17);
  doc.setFontSize(12);
  doc.text(conduce.numeroConduce, 143, 24);

  // General Details Section
  let y = 48;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 36, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('FECHA:', 18, y + 8);
  doc.text('HORA:', 80, y + 8);
  doc.text('ESTADO FACTURACIÓN:', 130, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(conduce.fecha), 18, y + 14);
  doc.text(conduce.hora || '--:--', 80, y + 14);
  doc.text(conduce.estadoFacturacion.toUpperCase(), 130, y + 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENTE:', 18, y + 24);
  doc.text('MINA / PROYECTO / OBRA:', 110, y + 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(conduce.clienteNombre, 18, y + 30);
  doc.text(conduce.proyectoMina || conduce.obra || 'Planta Principal / Obra', 110, y + 30);

  // Technical & Equipment details
  y = 90;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EQUIPO / MAQUINARIA:', 18, y + 8);
  doc.text('CHOFER / OPERADOR:', 85, y + 8);
  doc.text('DETALLES OPERACIONALES:', 145, y + 8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(conduce.equipoFicha || 'No especificado', 18, y + 15, { maxWidth: 62 });
  doc.text(conduce.choferNombre || 'No especificado', 85, y + 15, { maxWidth: 56 });
  
  const opDetails = conduce.turnoHorario 
    ? `Turno ${conduce.turnoHorario}` 
    : (conduce.material || (conduce.bombaFicha ? `Bomba ${conduce.bombaFicha}` : 'Estándar'));
  doc.text(opDetails, 145, y + 15, { maxWidth: 48 });

  // Items table
  autoTable(doc, {
    startY: 125,
    theme: 'grid',
    head: [['CÓDIGO / SERVICIO', 'CANTIDAD', 'UNIDAD', 'PRECIO UNITARIO', 'SUBTOTAL RD$']],
    body: [
      [
        conduce.servicioDescripcion,
        formatNumber(conduce.cantidad, 2),
        conduce.unidadMedida,
        formatCurrency(conduce.precioUnitario),
        formatCurrency(conduce.totalMonto),
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [30, 41, 59],
      cellPadding: 6,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Comments & Totals
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('OBSERVACIONES / ESPECIFICACIONES:', 14, finalY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(conduce.comentarios || 'Servicio registrado según especificaciones operacionales del cliente.', 14, finalY + 18, {
    maxWidth: 110,
  });

  // Total Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(130, finalY + 8, 66, 20, 2, 2, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(9);
  doc.text('TOTAL GENERAL RD$:', 134, finalY + 15);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(conduce.totalMonto), 134, finalY + 23);

  // Signatures Section
  const sigY = finalY + 45;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY, 70, sigY);
  doc.line(80, sigY, 130, sigY);
  doc.line(140, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Despachador / Control', 28, sigY + 5);
  doc.text('Operador / Conductor', 93, sigY + 5);
  doc.text('Recibido Conforme en Obra', 146, sigY + 5);

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('EQUIPROCI - Sistema de Control y Producción. Impreso el ' + new Date().toLocaleString('es-DO'), 14, 285);

  doc.save(`Conduce_${conduce.numeroConduce}.pdf`);
}

// 2. Export Conduces List Report
export function exportConducesListPDF(
  conduces: Conduce[],
  title: string = 'Reporte General de Conduces y Producción',
  dateRange: string = 'Histórico Completo'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPROCI - CONTROL DE PRODUCCIÓN & CONDUCES', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(title + ' | Período: ' + dateRange, 14, 19);

  const totalHoras = conduces.reduce((sum, c) => sum + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)), 0);
  const totalViajes = conduces.reduce((sum, c) => sum + Number(c.viajes || 0), 0);
  const totalMonto = conduces.reduce((sum, c) => sum + Number(c.totalMonto), 0);

  const tableBody = conduces.map((c) => [
    c.numeroConduce,
    formatDate(c.fecha),
    c.clienteNombre,
    c.proyectoMina || c.obra || '-',
    c.servicioDescripcion,
    `${formatNumber(c.cantidad, 2)} ${c.unidadMedida}`,
    c.choferNombre || '-',
    c.equipoFicha ? c.equipoFicha.replace('Ficha #', '#') : '-',
    formatCurrency(c.totalMonto),
    c.estadoFacturacion,
  ]);

  autoTable(doc, {
    startY: 32,
    theme: 'striped',
    head: [['No. Conduce', 'Fecha', 'Cliente', 'Mina / Obra', 'Servicio', 'Cant.', 'Operador/Chofer', 'Equipo', 'Total RD$', 'Estado']],
    body: tableBody,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      5: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
      9: { halign: 'center' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(180, finalY + 6, 103, 20, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Conduces: ${conduces.length} | Horas: ${formatNumber(totalHoras, 1)} | Viajes: ${totalViajes}`, 184, finalY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`MONTO TOTAL: ${formatCurrency(totalMonto)}`, 184, finalY + 20);

  doc.save(`Reporte_Conduces_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 3. Export Reporte por Mina / Proyecto PDF
export function exportReporteMinaPDF(
  reportData: Array<{
    nombreMina: string;
    totalConduces: number;
    totalHoras: number;
    totalViajes: number;
    totalM3: number;
    totalMonto: number;
    clientes: Set<string>;
  }>,
  dateRange: string,
  filterMina: string = 'ALL'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPROCI - REPORTE POR MINA / PROYECTO', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Período: ${dateRange} | Mina: ${filterMina === 'ALL' ? 'Todas' : filterMina}`, 14, 22);

  const tableBody = reportData.map((m) => [
    m.nombreMina,
    Array.from(m.clientes).join(', ') || 'General',
    m.totalConduces.toString(),
    `${formatNumber(m.totalHoras, 1)} h`,
    `${m.totalViajes} vjs`,
    `${formatNumber(m.totalM3, 1)} m³`,
    formatCurrency(m.totalMonto),
  ]);

  autoTable(doc, {
    startY: 38,
    theme: 'grid',
    head: [['Mina / Proyecto', 'Clientes', 'Conduces', 'Horas', 'Viajes', 'Metros (m³)', 'Total RD$']],
    body: tableBody,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 140;
  const grandTotal = reportData.reduce((sum, item) => sum + item.totalMonto, 0);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(120, finalY + 8, 76, 18, 2, 2, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8.5);
  doc.text('GRAN TOTAL FACTURADO:', 124, finalY + 14);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(grandTotal), 124, finalY + 21);

  doc.save(`Reporte_Minas_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 4. Export Reporte por Equipo / Maquinaria PDF
export function exportReporteEquipoPDF(
  reportData: Array<{
    equipo: Equipo;
    totalConduces: number;
    totalHoras: number;
    totalViajes: number;
    totalM3: number;
    totalFacturacion: number;
    totalGasoilGalones: number;
  }>,
  dateRange: string,
  filterEquipo: string = 'ALL'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPROCI - REPORTE DE EQUIPOS & RENDIMIENTO', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Período: ${dateRange} | Ficha: ${filterEquipo === 'ALL' ? 'Todos los Equipos' : filterEquipo}`, 14, 22);

  const tableBody = reportData.map((r) => [
    r.equipo.ficha,
    `${r.equipo.tipo} (${r.equipo.marca})`,
    r.totalConduces.toString(),
    `${formatNumber(r.totalHoras, 1)} h`,
    `${r.totalViajes} vjs`,
    `${r.totalGasoilGalones} gal`,
    formatCurrency(r.totalFacturacion),
  ]);

  autoTable(doc, {
    startY: 38,
    theme: 'grid',
    head: [['Ficha Equipo', 'Tipo / Marca', 'Conduces', 'Horas Operadas', 'Viajes', 'Gasoil Consumido', 'Facturación RD$']],
    body: tableBody,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 140;
  const grandTotal = reportData.reduce((sum, item) => sum + item.totalFacturacion, 0);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(120, finalY + 8, 76, 18, 2, 2, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8.5);
  doc.text('TOTAL FACTURACIÓN EQUIPOS:', 124, finalY + 14);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(grandTotal), 124, finalY + 21);

  doc.save(`Reporte_Equipos_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 5. Export Driver / Payroll summary PDF
export function exportDriverPayrollPDF(
  empleado: Empleado,
  conducesEmpleado: Conduce[],
  despachosEmpleado: DespachoGasoil[],
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPROCI', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('LIQUIDACIÓN DE PRODUCCIÓN Y SERVICIOS DE PERSONAL', 14, 22);
  doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 27);

  // Employee details box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 38, 182, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('EMPLEADO / OPERADOR:', 18, 46);
  doc.text('CARGO:', 90, 46);
  doc.text('CÉDULA:', 145, 46);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(empleado.nombre, 18, 53);
  doc.text(empleado.cargo, 90, 53);
  doc.text(empleado.cedula || 'N/D', 145, 53);

  const totalViajes = conducesEmpleado.reduce((acc, c) => acc + Number(c.viajes || 0), 0);
  const totalHoras = conducesEmpleado.reduce(
    (acc, c) => acc + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
    0
  );
  const totalM3 = conducesEmpleado.reduce(
    (acc, c) => acc + Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0),
    0
  );

  const pagoViajes = totalViajes * (empleado.pagoPorViaje || 0);
  const pagoMetros = totalM3 * (empleado.pagoPorMetro || 0);
  const pagoHoras = totalHoras * (empleado.pagoPorHora || 0);
  const totalProduccion = pagoViajes + pagoMetros + pagoHoras;

  // Trips / Services Table
  const tripRows = conducesEmpleado.map((c) => [
    c.numeroConduce,
    formatDate(c.fecha),
    c.clienteNombre,
    c.proyectoMina || c.obra || '-',
    `${formatNumber(c.cantidad, 2)} ${c.unidadMedida}`,
    c.equipoFicha || '-',
  ]);

  autoTable(doc, {
    startY: 72,
    theme: 'grid',
    head: [['No. Conduce', 'Fecha', 'Cliente', 'Mina / Obra', 'Cantidad / Unidad', 'Ficha Equipo']],
    body: tripRows.length > 0 ? tripRows : [['--', '--', 'Sin trabajos registrados en este período', '--', '--', '--']],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 120;

  // Breakdown calculation table
  autoTable(doc, {
    startY: finalY + 8,
    theme: 'plain',
    head: [['CONCEPTO DE PAGO / RENDIMIENTO', 'CANTIDAD / BASE', 'TARIFA RD$', 'TOTAL A LIQUIDAR RD$']],
    body: [
      ['Salario Base (Período)', 'Nómina Quincenal/Mensual', '-', formatCurrency(empleado.salarioBase || 0)],
      ['Pago por Horas Operadas', `${formatNumber(totalHoras, 1)} hrs`, formatCurrency(empleado.pagoPorHora || 0), formatCurrency(pagoHoras)],
      ['Pago por Viajes Realizados', `${totalViajes} viajes`, formatCurrency(empleado.pagoPorViaje || 0), formatCurrency(pagoViajes)],
      ['Bono por Volumen (m³)', `${formatNumber(totalM3, 2)} m³`, formatCurrency(empleado.pagoPorMetro || 0), formatCurrency(pagoMetros)],
    ],
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 40;

  // Total Box
  const granTotal = (empleado.salarioBase || 0) + totalProduccion;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(120, finalY2 + 6, 76, 18, 2, 2, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8.5);
  doc.text('TOTAL A PAGAR AL EMPLEADO:', 124, finalY2 + 12);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(granTotal), 124, finalY2 + 19);

  // Signatures
  const sigY = finalY2 + 40;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY, 80, sigY);
  doc.line(120, sigY, 180, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Firma Gerencia / Nómina', 32, sigY + 5);
  doc.text('Firma Empleado / Recibí Conforme', 128, sigY + 5);

  doc.save(`Liquidacion_${empleado.nombre.replace(/\s+/g, '_')}.pdf`);
}
