import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  BarChart3,
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  Fuel,
  Users,
  DollarSign,
  TrendingUp,
  Truck,
  HardHat,
  Clock,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getTodayString,
} from '../utils/formatters.ts';
import {
  exportConducesListPDF,
  exportReporteMinaPDF,
  exportReporteMinaAgregadoPDF,
  exportReporteEquipoPDF,
  exportFacturaProformaPDF,
} from '../utils/pdfExport.ts';
import { exportConducesToExcel, exportGasoilToExcel } from '../utils/excelExport.ts';
import * as XLSX from 'xlsx';

export const ReportesView: React.FC = () => {
  const { conduces, clientes, minas, servicios, equipos, gasoilDespachos, empleados } = useApp();

  const [reportType, setReportType] = useState<'minas' | 'minaAgregado' | 'equipos' | 'clientes' | 'combustible' | 'conduces'>('minas');
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(getTodayString());
  const [selectedMina, setSelectedMina] = useState<string>('ALL');
  const [selectedMinaId, setSelectedMinaId] = useState<string>('ALL');
  const [selectedEquipoFicha, setSelectedEquipoFicha] = useState<string>('ALL');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('ALL');

  // List of unique Minas / Proyectos extracted from conduces
  const minasProyectosList = useMemo(() => {
    const list = new Set<string>();
    conduces.forEach((c) => {
      const loc = c.proyectoMina || c.obra;
      if (loc && loc.trim() !== '') {
        list.add(loc.trim());
      }
    });
    return Array.from(list).sort();
  }, [conduces]);

  // Filter conduces within date range and specific entity filters
  const filteredConduces = useMemo(() => {
    return conduces.filter((c) => {
      if (fechaInicio && c.fecha < fechaInicio) return false;
      if (fechaFin && c.fecha > fechaFin) return false;
      if (selectedClienteId !== 'ALL' && c.clienteId !== selectedClienteId) return false;
      if (selectedEquipoFicha !== 'ALL' && c.equipoFicha !== selectedEquipoFicha) return false;
      if (selectedMina !== 'ALL') {
        const loc = (c.proyectoMina || c.obra || '').trim().toLowerCase();
        if (loc !== selectedMina.toLowerCase()) return false;
      }
      if (selectedMinaId !== 'ALL' && c.minaId !== selectedMinaId) return false;
      return true;
    });
  }, [conduces, fechaInicio, fechaFin, selectedClienteId, selectedEquipoFicha, selectedMina, selectedMinaId]);

  // 1. Reporte por Mina / Proyecto
  const reportByMina = useMemo(() => {
    const minasMap = new Map<
      string,
      {
        nombreMina: string;
        conduces: typeof conduces;
        totalConduces: number;
        totalHoras: number;
        totalViajes: number;
        totalM3: number;
        totalMonto: number;
        clientes: Set<string>;
      }
    >();

    // Seed with existing unique locations or from filtered conduces
    filteredConduces.forEach((c) => {
      const minaKey = (c.proyectoMina || c.obra || 'Planta / Proyecto General').trim();
      if (!minasMap.has(minaKey)) {
        minasMap.set(minaKey, {
          nombreMina: minaKey,
          conduces: [],
          totalConduces: 0,
          totalHoras: 0,
          totalViajes: 0,
          totalM3: 0,
          totalMonto: 0,
          clientes: new Set<string>(),
        });
      }
      const group = minasMap.get(minaKey)!;
      group.conduces.push(c);
      group.totalConduces += 1;
      group.totalHoras += Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0));
      group.totalViajes += Number(c.viajes || 0);
      group.totalM3 += Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0);
      group.totalMonto += Number(c.totalMonto || 0);
      if (c.clienteNombre) group.clientes.add(c.clienteNombre);
    });

    return Array.from(minasMap.values()).sort((a, b) => b.totalMonto - a.totalMonto);
  }, [filteredConduces]);

  // 1b. Reporte por Mina (origen del material) y Tipo de Agregado
  const reportByMinaAgregado = useMemo(() => {
    const map = new Map<
      string,
      { minaNombre: string; material: string; totalConduces: number; totalViajes: number; totalM3: number; totalMonto: number }
    >();

    filteredConduces
      .filter((c) => c.tipoConduce === 'MATERIAL' && c.minaId)
      .forEach((c) => {
        const minaNombre = c.minaNombre || 'Mina sin nombre';
        const material = c.material || c.servicioDescripcion || 'Material General';
        const key = `${minaNombre}__${material}`;
        if (!map.has(key)) {
          map.set(key, { minaNombre, material, totalConduces: 0, totalViajes: 0, totalM3: 0, totalMonto: 0 });
        }
        const group = map.get(key)!;
        group.totalConduces += 1;
        group.totalViajes += Number(c.viajes || 0);
        group.totalM3 += Number((c.unidadMedida || '').toLowerCase() === 'm3' ? c.cantidad : 0);
        group.totalMonto += Number(c.totalMonto || 0);
      });

    return Array.from(map.values()).sort((a, b) => a.minaNombre.localeCompare(b.minaNombre) || b.totalMonto - a.totalMonto);
  }, [filteredConduces]);

  // 2. Reporte por Equipo / Maquinaria / Camión
  const reportByEquipo = useMemo(() => {
    const despachosPeriodo = gasoilDespachos.filter((d) => {
      if (fechaInicio && d.fecha < fechaInicio) return false;
      if (fechaFin && d.fecha > fechaFin) return false;
      return true;
    });

    return equipos
      .filter((eq) => selectedEquipoFicha === 'ALL' || eq.ficha === selectedEquipoFicha)
      .map((eq) => {
        const eqConduces = filteredConduces.filter((c) => c.equipoFicha === eq.ficha || c.equipoId === eq.id);
        const eqDespachos = despachosPeriodo.filter((d) => d.equipoFicha === eq.ficha || d.equipoId === eq.id);

        const totalHoras = eqConduces.reduce(
          (sum, c) => sum + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
          0
        );
        const totalViajes = eqConduces.reduce(
          (sum, c) => sum + Number(c.viajes || 0),
          0
        );
        const totalM3 = eqConduces.reduce(
          (sum, c) => sum + Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0),
          0
        );
        const totalFacturacion = eqConduces.reduce((sum, c) => sum + Number(c.totalMonto || 0), 0);
        const totalGasoilGalones = eqDespachos.reduce((sum, d) => sum + Number(d.galones || 0), 0);

        return {
          equipo: eq,
          totalConduces: eqConduces.length,
          totalHoras,
          totalViajes,
          totalM3,
          totalFacturacion,
          totalGasoilGalones,
          despachosCount: eqDespachos.length,
          conduces: eqConduces,
        };
      })
      .filter((r) => r.totalConduces > 0 || r.totalGasoilGalones > 0 || selectedEquipoFicha !== 'ALL')
      .sort((a, b) => b.totalFacturacion - a.totalFacturacion);
  }, [equipos, selectedEquipoFicha, filteredConduces, gasoilDespachos, fechaInicio, fechaFin]);

  // 3. Reporte por Cliente
  const reportByClient = useMemo(() => {
    return clientes
      .map((cli) => {
        const cliConduces = filteredConduces.filter((c) => c.clienteId === cli.id);
        const totalHoras = cliConduces.reduce(
          (sum, c) => sum + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
          0
        );
        const totalViajes = cliConduces.reduce(
          (sum, c) => sum + Number(c.viajes || 0),
          0
        );
        const totalM3 = cliConduces.reduce(
          (sum, c) => sum + Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0),
          0
        );
        const totalMonto = cliConduces.reduce((sum, c) => sum + Number(c.totalMonto || 0), 0);
        const pendientes = cliConduces.filter((c) => c.estadoFacturacion === 'Pendiente').length;
        const facturados = cliConduces.filter((c) => c.estadoFacturacion === 'Facturado').length;

        return {
          cliente: cli,
          conduces: cliConduces,
          totalConduces: cliConduces.length,
          totalHoras,
          totalViajes,
          totalM3,
          totalMonto,
          pendientes,
          facturados,
        };
      })
      .filter((r) => r.totalConduces > 0 || r.totalMonto > 0)
      .sort((a, b) => b.totalMonto - a.totalMonto);
  }, [clientes, filteredConduces]);

  // 4. Reporte de Combustible Gasoil
  const reportByFuel = useMemo(() => {
    const despachosPeriodo = gasoilDespachos.filter((d) => {
      if (fechaInicio && d.fecha < fechaInicio) return false;
      if (fechaFin && d.fecha > fechaFin) return false;
      return true;
    });

    return equipos
      .filter((eq) => selectedEquipoFicha === 'ALL' || eq.ficha === selectedEquipoFicha)
      .map((eq) => {
        const eqDespachos = despachosPeriodo.filter((d) => d.equipoFicha === eq.ficha);
        const galonesTotal = eqDespachos.reduce((sum, d) => sum + Number(d.galones || 0), 0);
        const viajesEquipo = filteredConduces.filter((c) => c.equipoFicha === eq.ficha);
        const horasEquipo = viajesEquipo.reduce(
          (sum, c) => sum + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
          0
        );
        const m3Transportados = viajesEquipo.reduce(
          (sum, c) => sum + Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0),
          0
        );

        return {
          equipo: eq,
          despachosCount: eqDespachos.length,
          galonesTotal,
          viajesEquipo: viajesEquipo.length,
          horasEquipo,
          m3Transportados,
          galonesPorHora: horasEquipo > 0 ? (galonesTotal / horasEquipo).toFixed(2) : '0.00',
        };
      })
      .filter((r) => r.galonesTotal > 0 || r.viajesEquipo > 0)
      .sort((a, b) => b.galonesTotal - a.galonesTotal);
  }, [equipos, gasoilDespachos, filteredConduces, fechaInicio, fechaFin, selectedEquipoFicha]);

  // Summary Metrics of filtered data
  const summaryTotalHoras = useMemo(() => {
    return filteredConduces.reduce(
      (sum, c) => sum + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
      0
    );
  }, [filteredConduces]);

  const summaryTotalViajes = useMemo(() => {
    return filteredConduces.reduce(
      (sum, c) => sum + Number(c.viajes || 0),
      0
    );
  }, [filteredConduces]);

  const summaryTotalM3 = useMemo(() => {
    return filteredConduces.reduce(
      (sum, c) => sum + Number(c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? c.cantidad : 0),
      0
    );
  }, [filteredConduces]);

  const summaryTotalMonto = useMemo(() => {
    return filteredConduces.reduce((sum, c) => sum + Number(c.totalMonto || 0), 0);
  }, [filteredConduces]);

  // Handler for Excel Export based on active report
  const handleExportExcel = () => {
    if (reportType === 'minas') {
      const rows = reportByMina.map((m) => ({
        'Proyecto / Mina': m.nombreMina,
        'Clientes Involucrados': Array.from(m.clientes).join(', '),
        'Total Conduces': m.totalConduces,
        'Horas Maquinaria': m.totalHoras,
        'Viajes Realizados': m.totalViajes,
        'Metros Cúbicos (m³)': m.totalM3,
        'Total Facturado RD$': m.totalMonto,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Minas Proyectos');
      XLSX.writeFile(wb, `Reporte_Minas_${fechaInicio}_al_${fechaFin}.xlsx`);
    } else if (reportType === 'minaAgregado') {
      const rows = reportByMinaAgregado.map((r) => ({
        'Mina': r.minaNombre,
        'Material / Agregado': r.material,
        'Total Conduces': r.totalConduces,
        'Viajes Realizados': r.totalViajes,
        'Metros Cúbicos (m³)': r.totalM3,
        'Total Facturado RD$': r.totalMonto,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Mina Agregado');
      XLSX.writeFile(wb, `Reporte_Mina_Agregado_${fechaInicio}_al_${fechaFin}.xlsx`);
    } else if (reportType === 'equipos') {
      const rows = reportByEquipo.map((r) => ({
        'Ficha': r.equipo.ficha,
        'Tipo': r.equipo.tipo,
        'Marca / Modelo': `${r.equipo.marca} ${r.equipo.modelo}`,
        'Placa': r.equipo.placa || '',
        'Conduces': r.totalConduces,
        'Horas Trabajadas': r.totalHoras,
        'Viajes': r.totalViajes,
        'Volumen m³': r.totalM3,
        'Gasoil Consumido (Gal)': r.totalGasoilGalones,
        'Total Facturación RD$': r.totalFacturacion,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Equipos Maquinaria');
      XLSX.writeFile(wb, `Reporte_Equipos_${fechaInicio}_al_${fechaFin}.xlsx`);
    } else if (reportType === 'combustible') {
      const despachosFiltrados =
        selectedEquipoFicha === 'ALL'
          ? gasoilDespachos
          : gasoilDespachos.filter((d) => d.equipoFicha === selectedEquipoFicha);
      exportGasoilToExcel(despachosFiltrados);
    } else {
      exportConducesToExcel(filteredConduces);
    }
  };

  // Handler for PDF Export based on active report
  const handleExportPDF = () => {
    const periodoStr = `${formatDate(fechaInicio)} al ${formatDate(fechaFin)}`;
    if (reportType === 'minas') {
      exportReporteMinaPDF(reportByMina, periodoStr, selectedMina);
    } else if (reportType === 'minaAgregado') {
      const minaFiltroNombre = selectedMinaId === 'ALL' ? 'ALL' : minas.find((m) => m.id === selectedMinaId)?.nombre || 'ALL';
      exportReporteMinaAgregadoPDF(reportByMinaAgregado, periodoStr, minaFiltroNombre);
    } else if (reportType === 'equipos') {
      exportReporteEquipoPDF(reportByEquipo, periodoStr, selectedEquipoFicha);
    } else {
      exportConducesListPDF(
        filteredConduces,
        'Reporte de Producción y Conduces EQUIPROCI',
        periodoStr
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter and selector header */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Módulo de Reportes & Producción
            </h3>
            <p className="text-xs text-slate-400">
              Informes operacionales por Mina/Proyecto, Equipos/Camiones, Clientes y Combustible
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 text-xs font-bold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Report Category Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="md:col-span-2">
            <label className="text-slate-400 block mb-1 font-semibold">Tipo de Reporte:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
            >
              <option value="minas">1. Reporte por Proyecto / Obra (Horas, Viajes, Metros)</option>
              <option value="minaAgregado">2. Reporte por Mina y Tipo de Agregado</option>
              <option value="equipos">3. Reporte por Equipo / Camión (Rendimiento y Producción)</option>
              <option value="clientes">4. Reporte por Cliente (Facturación y Pendientes)</option>
              <option value="combustible">5. Despacho de Gasoil por Equipo</option>
              <option value="conduces">6. Listado Detallado de Conduces Emitidos</option>
            </select>
          </div>

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

          {/* Contextual filter depending on report type */}
          <div>
            {reportType === 'minas' && (
              <>
                <label className="text-slate-400 block mb-1 font-semibold">Proyecto / Obra:</label>
                <select
                  value={selectedMina}
                  onChange={(e) => setSelectedMina(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">Todas las Minas / Proyectos</option>
                  {minasProyectosList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            )}

            {(reportType === 'equipos' || reportType === 'combustible') && (
              <>
                <label className="text-slate-400 block mb-1 font-semibold">Filtrar Equipo:</label>
                <select
                  value={selectedEquipoFicha}
                  onChange={(e) => setSelectedEquipoFicha(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">Todos los Equipos</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.ficha}>
                      {eq.ficha} ({eq.tipo})
                    </option>
                  ))}
                </select>
              </>
            )}

            {reportType === 'minaAgregado' && (
              <>
                <label className="text-slate-400 block mb-1 font-semibold">Filtrar Mina:</label>
                <select
                  value={selectedMinaId}
                  onChange={(e) => setSelectedMinaId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">Todas las Minas</option>
                  {minas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </>
            )}

            {(reportType === 'clientes' || reportType === 'conduces') && (
              <>
                <label className="text-slate-400 block mb-1 font-semibold">Filtrar Cliente:</label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">Todos los Clientes</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Conduces</span>
            <div className="text-lg font-black text-slate-100 font-mono mt-0.5">{filteredConduces.length}</div>
          </div>
          <FileText className="w-5 h-5 text-amber-400/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Horas Maquinaria</span>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{formatNumber(summaryTotalHoras, 1)} hrs</div>
          </div>
          <Clock className="w-5 h-5 text-amber-400/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Viajes Camión</span>
            <div className="text-lg font-black text-sky-400 font-mono mt-0.5">{summaryTotalViajes} vjs</div>
          </div>
          <Truck className="w-5 h-5 text-sky-400/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Metros (m³)</span>
            <div className="text-lg font-black text-purple-400 font-mono mt-0.5">{formatNumber(summaryTotalM3, 1)} m³</div>
          </div>
          <Layers className="w-5 h-5 text-purple-400/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Facturación</span>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">{formatCurrency(summaryTotalMonto)}</div>
          </div>
          <DollarSign className="w-5 h-5 text-emerald-400/40" />
        </div>
      </div>

      {/* REPORT 1: Por Mina / Proyecto */}
      {reportType === 'minas' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-400" />
              Producción Consolidada por Proyecto / Obra
            </span>
            <span className="text-slate-400">
              Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Clientes</th>
                  <th className="py-3 px-4 text-center">Conduces</th>
                  <th className="py-3 px-4 text-center">Horas de Equipo</th>
                  <th className="py-3 px-4 text-center">Viajes</th>
                  <th className="py-3 px-4 text-center">Metros (m³)</th>
                  <th className="py-3 px-4 text-right">Monto Total RD$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {reportByMina.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No hay registros de producción en minas o proyectos para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reportByMina.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {m.nombreMina}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                        {Array.from(m.clientes).join(', ') || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                        {m.totalConduces}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                        {formatNumber(m.totalHoras, 1)} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-400">
                        {m.totalViajes} vjs
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                        {formatNumber(m.totalM3, 1)} m³
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        {formatCurrency(m.totalMonto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 1b: Por Mina y Tipo de Agregado */}
      {reportType === 'minaAgregado' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-400" />
              Producción por Mina de Origen y Tipo de Agregado
            </span>
            <span className="text-slate-400">
              Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Mina</th>
                  <th className="py-3 px-4">Material / Agregado</th>
                  <th className="py-3 px-4 text-center">Conduces</th>
                  <th className="py-3 px-4 text-center">Viajes</th>
                  <th className="py-3 px-4 text-center">Metros (m³)</th>
                  <th className="py-3 px-4 text-right">Monto Total RD$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {reportByMinaAgregado.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No hay conduces de materiales vinculados a una mina para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reportByMinaAgregado.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-400">{row.minaNombre}</td>
                      <td className="py-3.5 px-4 text-slate-200">{row.material}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                        {row.totalConduces}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-400">
                        {row.totalViajes} vjs
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                        {formatNumber(row.totalM3, 1)} m³
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        {formatCurrency(row.totalMonto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: Por Equipo / Maquinaria */}
      {reportType === 'equipos' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              Rendimiento Operacional por Equipo / Maquinaria
            </span>
            <span className="text-slate-400">
              Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Ficha / Maquinaria</th>
                  <th className="py-3 px-4">Tipo & Datos</th>
                  <th className="py-3 px-4 text-center">Conduces</th>
                  <th className="py-3 px-4 text-center">Horas Operadas</th>
                  <th className="py-3 px-4 text-center">Viajes</th>
                  <th className="py-3 px-4 text-center">Volumen m³</th>
                  <th className="py-3 px-4 text-center">Gasoil Consumido</th>
                  <th className="py-3 px-4 text-right">Facturación Generada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {reportByEquipo.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No hay actividad registrada para los equipos en este período.
                    </td>
                  </tr>
                ) : (
                  reportByEquipo.map((r) => (
                    <tr key={r.equipo.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-amber-400">
                        {r.equipo.ficha}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {r.equipo.marca} {r.equipo.modelo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold">
                          {r.equipo.tipo}
                        </span>
                        {r.equipo.placa && (
                          <span className="ml-1 text-[10px] text-slate-400 font-mono">
                            Placa: {r.equipo.placa}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                        {r.totalConduces}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                        {formatNumber(r.totalHoras, 1)} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-400">
                        {r.totalViajes} vjs
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                        {formatNumber(r.totalM3, 1)} m³
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                        {r.totalGasoilGalones} gal
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        {formatCurrency(r.totalFacturacion)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: Por Cliente */}
      {reportType === 'clientes' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200">Resumen Consolidado por Cliente</span>
            <span className="text-slate-400">
              Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Cliente / RNC</th>
                  <th className="py-3 px-4 text-center">Conduces</th>
                  <th className="py-3 px-4 text-center">Horas</th>
                  <th className="py-3 px-4 text-center">Viajes</th>
                  <th className="py-3 px-4 text-center">Volumen (m³)</th>
                  <th className="py-3 px-4 text-center">Pendientes Fac.</th>
                  <th className="py-3 px-4 text-center">Facturados</th>
                  <th className="py-3 px-4 text-right">Facturación Estimada RD$</th>
                  <th className="py-3 px-4 text-center">Proforma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {reportByClient.map((r) => (
                  <tr key={r.cliente.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {r.cliente.nombre}
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        RNC: {r.cliente.rnc}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      {r.totalConduces}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                      {formatNumber(r.totalHoras, 1)} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-400">
                      {r.totalViajes}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                      {formatNumber(r.totalM3, 1)} m³
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                        {r.pendientes}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                        {r.facturados}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(r.totalMonto)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() =>
                          exportFacturaProformaPDF(
                            r.cliente,
                            r.conduces,
                            `${formatDate(fechaInicio)} al ${formatDate(fechaFin)}`
                          )
                        }
                        disabled={r.conduces.length === 0}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold text-[11px] border border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Generar Factura Proforma en PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Proforma</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: Combustible Diésel */}
      {reportType === 'combustible' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200">Consumo de Gasoil y Rendimiento por Ficha</span>
            <span className="text-slate-400">
              Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Ficha / Maquinaria</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center">Despachos Gasoil</th>
                  <th className="py-3 px-4 text-center">Galones Consumidos</th>
                  <th className="py-3 px-4 text-center">Horas Operadas</th>
                  <th className="py-3 px-4 text-center">Viajes Realizados</th>
                  <th className="py-3 px-4 text-right">Galones / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {reportByFuel.map((r) => (
                  <tr key={r.equipo.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-amber-400 font-mono">
                      {r.equipo.ficha}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {r.equipo.marca} {r.equipo.modelo}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{r.equipo.tipo}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{r.despachosCount}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                      {r.galonesTotal} gal
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">{formatNumber(r.horasEquipo, 1)} hrs</td>
                    <td className="py-3.5 px-4 text-center font-mono">{r.viajesEquipo} vjs</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                      {r.galonesPorHora} gal/h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: Conduces List summary */}
      {reportType === 'conduces' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200">
              Listado Cronológico de Conduces ({filteredConduces.length} registros)
            </span>
            <span className="text-slate-400">
              Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">No. Conduce</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Servicio</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-right">Total RD$</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {filteredConduces.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{c.numeroConduce}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{formatDate(c.fecha)}</td>
                    <td className="py-3 px-4 text-slate-200 font-semibold">{c.clienteNombre}</td>
                    <td className="py-3 px-4 text-slate-300">{c.proyectoMina || c.obra || '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{c.servicioDescripcion}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-100">
                      {c.cantidad} {c.unidadMedida}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(c.totalMonto)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.estadoFacturacion === 'Facturado'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {c.estadoFacturacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
