import React from 'react';
import { Conduce } from '../types/index.ts';
import { Modal } from './Modal.tsx';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters.ts';
import { exportSingleConducePDF } from '../utils/pdfExport.ts';
import { Printer, Download, CheckCircle2, XCircle } from 'lucide-react';

interface ConducePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  conduce: Conduce | null;
}

export const ConducePrintModal: React.FC<ConducePrintModalProps> = ({
  isOpen,
  onClose,
  conduce,
}) => {
  if (!conduce) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vista Previa de Conduce #${conduce.numeroConduce}`}
      subtitle="Comprobante oficial de trabajo, entrega y control de producción"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-end gap-3 pb-3 border-b border-slate-800 no-print">
          <button
            onClick={() => exportSingleConducePDF(conduce)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Descargar PDF Oficial
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprobante
          </button>
        </div>

        {/* The Document Preview (White Printable Paper) */}
        <div
          id="printable-conduce"
          className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 font-sans select-text"
        >
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-wider">
                  EQUIPROCI
                </span>
                <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                  SERVICIOS Y EQUIPOS
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                ALQUILER DE MAQUINARIA PESADA • TRANSPORTE DE MATERIALES • MOVIMIENTO DE TIERRA
              </p>
              <p className="text-[11px] text-slate-500">
                RNC: 1-31-00000-1 • Santo Domingo, Rep. Dom. • Tel: (809) 555-0100
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-wider mb-1">
                CONDUCE DE TRABAJO
              </div>
              <div className="text-xl font-extrabold text-amber-600">
                {conduce.numeroConduce}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Fecha: {formatDate(conduce.fecha)} - {conduce.hora || '08:00'}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 my-5 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <p className="text-slate-500 uppercase font-semibold text-[10px]">Cliente / Razón Social:</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{conduce.clienteNombre}</p>
              {conduce.rnc && (
                <p className="text-slate-600 mt-1">
                  <span className="font-medium text-slate-500">RNC / Cédula:</span> {conduce.rnc}
                </p>
              )}
            </div>

            <div>
              <p className="text-slate-500 uppercase font-semibold text-[10px]">Proyecto / Mina / Ubicación:</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{conduce.obra || conduce.proyectoMina || 'Ubicación General'}</p>
              <p className="text-slate-600 mt-1">
                <span className="font-medium text-slate-500">Estado Administrativo:</span>{' '}
                <span
                  className={`font-bold ${
                    conduce.estadoFacturacion === 'Facturado'
                      ? 'text-emerald-600'
                      : conduce.estadoFacturacion === 'Anulado'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                  }`}
                >
                  {conduce.estadoFacturacion}
                </span>
                {conduce.numeroFactura && ` (Ref. Factura: ${conduce.numeroFactura})`}
              </p>
            </div>
          </div>

          {/* Equipment and Operator info */}
          <div className="grid grid-cols-3 gap-3 mb-5 p-3 bg-slate-100/70 rounded-lg text-xs border border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Equipo / Maquinaria:</span>
              <span className="font-semibold text-slate-800">
                {conduce.equipoFicha || 'N/A'} {conduce.placa ? `(Placa: ${conduce.placa})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Operador / Chofer:</span>
              <span className="font-semibold text-slate-800">{conduce.choferNombre || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Detalles Operacionales:</span>
              <span className="font-semibold text-slate-800">
                {conduce.turnoHorario ? `Turno: ${conduce.turnoHorario}` : ''}
                {conduce.horaInicio && conduce.horaFin ? ` (${conduce.horaInicio} - ${conduce.horaFin})` : ''}
                {conduce.viajes ? ` ${conduce.viajes} viaje(s)` : ''}
                {conduce.horometroInicial ? ` Horóm. Ini: ${conduce.horometroInicial}` : ''}
                {conduce.horometroFinal ? ` Fin: ${conduce.horometroFinal}` : ''}
                {!conduce.turnoHorario && !conduce.viajes && !conduce.horometroInicial ? 'Operación Estándar' : ''}
              </span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-xs text-left border border-slate-200 mb-5">
            <thead className="bg-slate-900 text-white font-bold text-[11px]">
              <tr>
                <th className="p-2.5">DESCRIPCIÓN DEL MATERIAL / SERVICIO</th>
                <th className="p-2.5 text-center">CANTIDAD</th>
                <th className="p-2.5 text-center">UNIDAD</th>
                <th className="p-2.5 text-right">PRECIO UNIT.</th>
                <th className="p-2.5 text-right">TOTAL RD$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="p-3 font-semibold">{conduce.servicioDescripcion}</td>
                <td className="p-3 text-center font-bold">{formatNumber(conduce.cantidad, 2)}</td>
                <td className="p-3 text-center uppercase">{conduce.unidadMedida}</td>
                <td className="p-3 text-right">{formatCurrency(conduce.precioUnitario)}</td>
                <td className="p-3 text-right font-black text-slate-950">
                  {formatCurrency(conduce.totalMonto)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Comments & Summary */}
          <div className="flex justify-between items-start mb-12">
            <div className="w-1/2 pr-4 text-xs text-slate-600">
              <span className="font-bold text-slate-800 text-[11px] block mb-1">
                Especificaciones / Notas de Planta:
              </span>
              <p className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                {conduce.comentarios || 'Sin observaciones adicionales registradas.'}
              </p>
            </div>

            <div className="w-1/3 bg-slate-900 text-white p-3.5 rounded-lg text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                Total Conduce RD$
              </span>
              <span className="text-xl font-black text-amber-400 block mt-1">
                {formatCurrency(conduce.totalMonto)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-[10px] text-slate-500">
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <p className="font-semibold text-slate-700">Despachado en Planta</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <p className="font-semibold text-slate-700">Chofer Transportista</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <p className="font-semibold text-slate-700">Recibido en Obra (Firma y Sello)</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
