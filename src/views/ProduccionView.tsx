import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatCurrency, formatNumber, getTodayString } from '../utils/formatters.ts';
import { BarChart3, Clock, Truck, Layers, Users, Calendar } from 'lucide-react';

type AgrupacionKey = 'cliente' | 'proyecto' | 'material' | 'equipo' | 'fecha';

export const ProduccionView: React.FC = () => {
  const { conduces, clientes, equipos } = useApp();

  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [filterTipo, setFilterTipo] = useState<'ALL' | 'EQUIPO' | 'MATERIAL'>('ALL');
  const [agrupacion, setAgrupacion] = useState<AgrupacionKey>('cliente');

  const conducesFiltrados = useMemo(() => {
    return conduces.filter((c) => {
      if (filterTipo !== 'ALL' && c.tipoConduce !== filterTipo) return false;
      if (filterFechaInicio && c.fecha < filterFechaInicio) return false;
      if (filterFechaFin && c.fecha > filterFechaFin) return false;
      return true;
    });
  }, [conduces, filterTipo, filterFechaInicio, filterFechaFin]);

  const totales = useMemo(() => {
    const horas = conducesFiltrados
      .filter((c) => c.tipoConduce === 'EQUIPO')
      .reduce((s, c) => s + Number(c.horasTrabajadas || c.cantidad || 0), 0);
    const viajes = conducesFiltrados
      .filter((c) => c.tipoConduce === 'MATERIAL')
      .reduce((s, c) => s + Number(c.viajes || 0), 0);
    const m3 = conducesFiltrados
      .filter((c) => c.tipoConduce === 'MATERIAL' && (c.unidadMedida || '').toLowerCase() === 'm3')
      .reduce((s, c) => s + Number(c.cantidad || 0), 0);
    const monto = conducesFiltrados.reduce((s, c) => s + Number(c.totalMonto || 0), 0);
    return { horas, viajes, m3, monto, totalConduces: conducesFiltrados.length };
  }, [conducesFiltrados]);

  const groupKeyLabel: Record<AgrupacionKey, string> = {
    cliente: 'Cliente',
    proyecto: 'Proyecto / Ubicación',
    material: 'Servicio / Material',
    equipo: 'Equipo / Vehículo',
    fecha: 'Fecha',
  };

  const agrupado = useMemo(() => {
    const map = new Map<
      string,
      { key: string; horas: number; viajes: number; m3: number; monto: number; conduces: number }
    >();

    for (const c of conducesFiltrados) {
      let key = '';
      switch (agrupacion) {
        case 'cliente':
          key = c.clienteNombre || 'Sin cliente';
          break;
        case 'proyecto':
          key = c.obra || 'Sin proyecto';
          break;
        case 'material':
          key = c.servicioDescripcion || 'Sin servicio';
          break;
        case 'equipo':
          key = c.equipoFicha || 'Sin equipo asignado';
          break;
        case 'fecha':
          key = c.fecha;
          break;
      }
      const entry = map.get(key) || { key, horas: 0, viajes: 0, m3: 0, monto: 0, conduces: 0 };
      if (c.tipoConduce === 'EQUIPO') entry.horas += Number(c.horasTrabajadas || c.cantidad || 0);
      if (c.tipoConduce === 'MATERIAL') {
        entry.viajes += Number(c.viajes || 0);
        if ((c.unidadMedida || '').toLowerCase() === 'm3') entry.m3 += Number(c.cantidad || 0);
      }
      entry.monto += Number(c.totalMonto || 0);
      entry.conduces += 1;
      map.set(key, entry);
    }

    return Array.from(map.values()).sort((a, b) => b.monto - a.monto);
  }, [conducesFiltrados, agrupacion]);

  const equiposActivos = equipos.filter((e) => e.estado === 'Operativo').length;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Tipo de Conduce:</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Equipos y Materiales</option>
              <option value="EQUIPO">Solo Equipos Pesados</option>
              <option value="MATERIAL">Solo Materiales / Volteo</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Agrupar por:</label>
            <select
              value={agrupacion}
              onChange={(e) => setAgrupacion(e.target.value as AgrupacionKey)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="cliente">Cliente</option>
              <option value="proyecto">Proyecto / Ubicación</option>
              <option value="material">Servicio / Material</option>
              <option value="equipo">Equipo / Vehículo</option>
              <option value="fecha">Fecha</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Desde Fecha:</label>
            <input
              type="date"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Hasta Fecha:</label>
            <input
              type="date"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Conduces
          </div>
          <strong className="text-xl text-slate-100 font-mono">{totales.totalConduces}</strong>
        </div>
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
            <Clock className="w-3.5 h-3.5" /> Horas de Equipos
          </div>
          <strong className="text-xl text-amber-400 font-mono">{formatNumber(totales.horas, 1)}</strong>
        </div>
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
            <Truck className="w-3.5 h-3.5" /> Viajes de Volteo
          </div>
          <strong className="text-xl text-sky-400 font-mono">{formatNumber(totales.viajes, 0)}</strong>
        </div>
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
            <Layers className="w-3.5 h-3.5" /> Metros de Material
          </div>
          <strong className="text-xl text-purple-400 font-mono">{formatNumber(totales.m3, 1)}</strong>
        </div>
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
            <Users className="w-3.5 h-3.5" /> Equipos Operativos
          </div>
          <strong className="text-xl text-emerald-400 font-mono">
            {equiposActivos} / {equipos.length}
          </strong>
        </div>
      </div>

      {/* Tabla agrupada */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
          Producción por {groupKeyLabel[agrupacion]}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4">{groupKeyLabel[agrupacion]}</th>
                <th className="py-3 px-4 text-center">Conduces</th>
                <th className="py-3 px-4 text-center">Horas</th>
                <th className="py-3 px-4 text-center">Viajes</th>
                <th className="py-3 px-4 text-center">m³</th>
                <th className="py-3 px-4 text-right">Monto RD$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {agrupado.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No hay conduces registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                agrupado.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {agrupacion === 'fecha' ? row.key : row.key}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{row.conduces}</td>
                    <td className="py-3 px-4 text-center font-mono text-amber-400">
                      {row.horas > 0 ? formatNumber(row.horas, 1) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sky-400">
                      {row.viajes > 0 ? formatNumber(row.viajes, 0) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-purple-400">
                      {row.m3 > 0 ? formatNumber(row.m3, 1) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(row.monto)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {agrupado.length > 0 && (
              <tfoot className="bg-slate-800/60 font-bold text-slate-100 border-t border-slate-700">
                <tr>
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-center font-mono">{totales.totalConduces}</td>
                  <td className="py-3 px-4 text-center font-mono text-amber-400">{formatNumber(totales.horas, 1)}</td>
                  <td className="py-3 px-4 text-center font-mono text-sky-400">{formatNumber(totales.viajes, 0)}</td>
                  <td className="py-3 px-4 text-center font-mono text-purple-400">{formatNumber(totales.m3, 1)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatCurrency(totales.monto)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
