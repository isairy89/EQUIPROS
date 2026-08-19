import * as XLSX from 'xlsx';
import { Conduce, Cliente, DespachoGasoil, Empleado } from '../types/index.ts';

export function exportConducesToExcel(conduces: Conduce[], fileName: string = 'Conduces_EQUIPROCI.xlsx') {
  const data = conduces.map((c) => ({
    'No. Conduce': c.numeroConduce,
    'Fecha': c.fecha,
    'Hora': c.hora || '',
    'Cliente': c.clienteNombre,
    'RNC': c.rnc || '',
    'Obra / Destino': c.obra,
    'Servicio / Producto': c.servicioDescripcion,
    'Cantidad': c.cantidad,
    'Unidad': c.unidadMedida,
    'Precio Unitario RD$': c.precioUnitario,
    'Total RD$': c.totalMonto,
    'Chofer': c.choferNombre || '',
    'Equipo / Mixer': c.equipoFicha || '',
    'Bomba': c.bombaFicha || '',
    'Estado Facturación': c.estadoFacturacion,
    'No. Factura': c.numeroFactura || '',
    'Sellado': c.sellado ? 'Sí' : 'No',
    'Comentarios': c.comentarios || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conduces');
  XLSX.writeFile(workbook, fileName);
}

export function exportGasoilToExcel(despachos: DespachoGasoil[], fileName: string = 'Despachos_Gasoil_EQUIPROCI.xlsx') {
  const data = despachos.map((d) => ({
    'Fecha': d.fecha,
    'Hora': d.hora || '',
    'Equipo / Ficha': d.equipoFicha,
    'Empleado': d.empleadoNombre || '',
    'Galones Despachados': d.galones,
    'Horómetro / Km': d.horometroKm || '',
    'Conduce Asociado': d.conduceId || '',
    'Notas': d.notas || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Despachos Combustible');
  XLSX.writeFile(workbook, fileName);
}
