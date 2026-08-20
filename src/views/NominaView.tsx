import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Empleado, Conduce } from '../types/index.ts';
import {
  DollarSign,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  UserCheck,
  Truck,
  HardHat,
  Clock,
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getTodayString,
} from '../utils/formatters.ts';
import { exportDriverPayrollPDF, exportControlEquiposPDF } from '../utils/pdfExport.ts';
import { Modal } from '../components/Modal.tsx';
import * as XLSX from 'xlsx';

export const NominaView: React.FC = () => {
  const { empleados, conduces, gasoilDespachos } = useApp();

  // Modal "Control de Equipos": confirma el monto de TSS antes de generar el PDF
  const [controlEquiposTarget, setControlEquiposTarget] = useState<{ empleado: Empleado; conduces: Conduce[] } | null>(null);
  const [tssMonto, setTssMonto] = useState<number>(438);

  // Date filters for payroll period
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(getTodayString());
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('ALL');

  // Filter conduces within range
  const conducesEnPeriodo = useMemo(() => {
    return conduces.filter((c) => {
      if (fechaInicio && c.fecha < fechaInicio) return false;
      if (fechaFin && c.fecha > fechaFin) return false;
      if (c.estadoFacturacion === 'Anulado') return false;
      return true;
    });
  }, [conduces, fechaInicio, fechaFin]);

  // Compute breakdown for each employee
  const payrollData = useMemo(() => {
    return empleados
      .filter((emp) => selectedEmpleadoId === 'ALL' || emp.id === selectedEmpleadoId)
      .map((emp) => {
        const empConduces = conducesEnPeriodo.filter(
          (c) => c.choferId === emp.id || c.choferNombre === emp.nombre
        );
        const viajesRealizados = empConduces.reduce(
          (sum, c) => sum + Number(c.viajes || 0),
          0
        );
        const horasOperadas = empConduces.reduce(
          (sum, c) => sum + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
          0
        );
        const m3Despachados = empConduces.reduce(
          (sum, c) => sum + Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0),
          0
        );

        const pagoViajes = viajesRealizados * (emp.pagoPorViaje || 0);
        const pagoMetros = m3Despachados * (emp.pagoPorMetro || 0);
        const pagoHoras = horasOperadas * (emp.pagoPorHora || 0);
        const salarioBase = emp.salarioBase || 0;
        const totalPagar = salarioBase + pagoViajes + pagoMetros + pagoHoras;

        const despachosAsociados = gasoilDespachos.filter(
          (d) => d.empleadoId === emp.id || d.empleadoNombre === emp.nombre
        );
        const galonesGasoil = despachosAsociados.reduce((sum, d) => sum + Number(d.galones || 0), 0);

        return {
          empleado: emp,
          viajesRealizados,
          horasOperadas,
          m3Despachados,
          pagoViajes,
          pagoMetros,
          pagoHoras,
          salarioBase,
          totalPagar,
          galonesGasoil,
          conducesCount: empConduces.length,
          conduces: empConduces,
          despachos: despachosAsociados,
        };
      });
  }, [empleados, selectedEmpleadoId, conducesEnPeriodo, gasoilDespachos]);

  const totalGeneralNomina = payrollData.reduce((sum, item) => sum + item.totalPagar, 0);
  const totalViajesPeriodo = payrollData.reduce((sum, item) => sum + item.viajesRealizados, 0);
  const totalHorasPeriodo = payrollData.reduce((sum, item) => sum + item.horasOperadas, 0);
  const totalM3Periodo = payrollData.reduce((sum, item) => sum + item.m3Despachados, 0);

  const handleExportExcelNomina = () => {
    const rows = payrollData.map((item) => ({
      'Empleado / Operador': item.empleado.nombre,
      'Cargo': item.empleado.cargo,
      'Cédula': item.empleado.cedula || '',
      'Conduces Realizados': item.conducesCount,
      'Horas Operadas': item.horasOperadas,
      'Tarifa / Hora RD$': item.empleado.pagoPorHora || 0,
      'Pago por Horas RD$': item.pagoHoras,
      'Viajes Realizados': item.viajesRealizados,
      'Tarifa / Viaje RD$': item.empleado.pagoPorViaje || 0,
      'Pago por Viajes RD$': item.pagoViajes,
      'Volumen (m³)': item.m3Despachados,
      'Tarifa / m³ RD$': item.empleado.pagoPorMetro || 0,
      'Pago por m³ RD$': item.pagoMetros,
      'Salario Base RD$': item.salarioBase,
      'Total a Liquidar RD$': item.totalPagar,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidación Nómina');
    XLSX.writeFile(wb, `Nomina_Produccion_${fechaInicio}_al_${fechaFin}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Filter and Period Selection Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Liquidación de Producción, Operadores y Choferes
            </h3>
            <p className="text-xs text-slate-400">
              Control de horas trabajadas, bonos por viaje, volumen y liquidación neta por período
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcelNomina}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 text-xs font-bold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Nómina Excel</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Desde Fecha:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Hasta Fecha:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Filtrar por Empleado:</label>
            <select
              value={selectedEmpleadoId}
              onChange={(e) => setSelectedEmpleadoId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">Todos los Empleados ({empleados.length})</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.cargo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Horas Maquinaria</span>
            <h4 className="text-xl font-black text-amber-400 mt-1 font-mono">{formatNumber(totalHorasPeriodo, 1)} hrs</h4>
          </div>
          <Clock className="w-8 h-8 text-amber-400/30" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Viajes Realizados</span>
            <h4 className="text-xl font-black text-sky-400 mt-1 font-mono">{totalViajesPeriodo} vjs</h4>
          </div>
          <Truck className="w-8 h-8 text-sky-400/30" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Volumen Total (m³)</span>
            <h4 className="text-xl font-black text-purple-400 mt-1 font-mono">{formatNumber(totalM3Periodo, 1)} m³</h4>
          </div>
          <HardHat className="w-8 h-8 text-purple-400/30" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total a Liquidar</span>
            <h4 className="text-xl font-black text-emerald-400 mt-1 font-mono">{formatCurrency(totalGeneralNomina)}</h4>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-400/30" />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4">Empleado / Cargo</th>
                <th className="py-3 px-4 text-center">Horas Registradas</th>
                <th className="py-3 px-4 text-right">Pago x Horas</th>
                <th className="py-3 px-4 text-center">Viajes Realizados</th>
                <th className="py-3 px-4 text-right">Pago x Viajes</th>
                <th className="py-3 px-4 text-center">Volumen (m³)</th>
                <th className="py-3 px-4 text-right">Salario Base</th>
                <th className="py-3 px-4 text-right">Total a Pagar</th>
                <th className="py-3 px-4 text-center">Imprimir Volante</th>
                <th className="py-3 px-4 text-center">Control de Equipos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {payrollData.map((item) => (
                <tr key={item.empleado.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{item.empleado.nombre}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.empleado.cargo} {item.empleado.cedula ? `• ${item.empleado.cedula}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                    {formatNumber(item.horasOperadas, 1)} hrs
                    <div className="text-[9px] text-slate-500 font-sans">
                      ({formatCurrency(item.empleado.pagoPorHora || 0)} /h)
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                    {formatCurrency(item.pagoHoras)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-400">
                    {item.viajesRealizados} vjs
                    <div className="text-[9px] text-slate-500 font-sans">
                      ({formatCurrency(item.empleado.pagoPorViaje || 0)} /v)
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                    {formatCurrency(item.pagoViajes)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-200">
                    {formatNumber(item.m3Despachados, 1)} m³
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {formatCurrency(item.salarioBase)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                    {formatCurrency(item.totalPagar)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() =>
                        exportDriverPayrollPDF(
                          item.empleado,
                          item.conduces,
                          item.despachos,
                          fechaInicio,
                          fechaFin
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold text-[11px] border border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Volante</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        setTssMonto(438);
                        setControlEquiposTarget({ empleado: item.empleado, conduces: item.conduces });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-bold text-[11px] border border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Control Equipos</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: confirmar TSS antes de generar el PDF de Control de Equipos */}
      <Modal
        isOpen={!!controlEquiposTarget}
        onClose={() => setControlEquiposTarget(null)}
        title="Generar Control de Equipos"
        subtitle={controlEquiposTarget ? `Empleado: ${controlEquiposTarget.empleado.nombre}` : ''}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Descuento de TSS (RD$)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={tssMonto}
              onChange={(e) => setTssMonto(Number(e.target.value))}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Se resta del subtotal de producción del período para calcular el Total Neto a Pagar.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setControlEquiposTarget(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!controlEquiposTarget) return;
                exportControlEquiposPDF(
                  controlEquiposTarget.empleado,
                  controlEquiposTarget.conduces,
                  fechaInicio,
                  fechaFin,
                  tssMonto
                );
                setControlEquiposTarget(null);
              }}
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              Generar PDF
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
