import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { MetricCard } from '../components/MetricCard.tsx';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters.ts';
import {
  FileText,
  DollarSign,
  Layers,
  Fuel,
  Truck,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewConduce: () => void;
  onViewConduce: (conduce: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewConduce,
  onViewConduce,
}) => {
  const {
    conduces,
    clientes,
    equipos,
    gasoilConfig,
    setActiveView,
    gasoilDespachos,
    empleados,
  } = useApp();

  // Metrics calculation
  const totalConduces = conduces.length;
  const totalMonto = conduces.reduce((acc, c) => acc + Number(c.totalMonto || 0), 0);
  const totalHoras = conduces.reduce(
    (acc, c) => acc + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
    0
  );
  const totalViajes = conduces.reduce(
    (acc, c) => acc + Number(c.viajes || (c.unidadMedida === 'VIAJE' ? c.cantidad : 1)),
    0
  );
  const totalM3 = conduces.reduce(
    (acc, c) => acc + (c.unidadMedida === 'METRO' || c.unidadMedida === 'm3' ? Number(c.cantidad || 0) : 0),
    0
  );
  const conducesPendientes = conduces.filter((c) => c.estadoFacturacion === 'Pendiente');
  const montoPendiente = conducesPendientes.reduce((acc, c) => acc + Number(c.totalMonto || 0), 0);
  const conducesFacturados = conduces.filter((c) => c.estadoFacturacion === 'Facturado');

  // Gasoil status
  const nivelGasoil = gasoilConfig.nivelActual || 0;
  const capacidadGasoil = gasoilConfig.capacidadTanquePrincipal || 3000;
  const porcentajeGasoil = Math.round((nivelGasoil / capacidadGasoil) * 100);
  const isGasoilBajo = nivelGasoil <= (gasoilConfig.alertaNivelMinimo || 500);

  // Group production by client
  const clientProduction = clientes.map((cli) => {
    const cliConduces = conduces.filter((c) => c.clienteId === cli.id);
    const horas = cliConduces.reduce(
      (acc, c) => acc + Number(c.horasTrabajadas || (c.unidadMedida === 'HORA' ? c.cantidad : 0)),
      0
    );
    const viajes = cliConduces.reduce(
      (acc, c) => acc + Number(c.viajes || (c.unidadMedida === 'VIAJE' ? c.cantidad : 1)),
      0
    );
    const monto = cliConduces.reduce((acc, c) => acc + Number(c.totalMonto || 0), 0);
    return {
      cliente: cli,
      totalConduces: cliConduces.length,
      horas,
      viajes,
      totalMonto: monto,
    };
  }).sort((a, b) => b.totalMonto - a.totalMonto).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Gasoil is Low */}
      {isGasoilBajo && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between backdrop-blur-sm animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-200">
                ¡Nivel Crítico de Combustible en Tanque Principal!
              </p>
              <p className="text-xs text-rose-300">
                Quedan {nivelGasoil} galones ({porcentajeGasoil}%). El umbral mínimo configurado es{' '}
                {gasoilConfig.alertaNivelMinimo} galones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('gasoil')}
            className="px-3 py-1.5 rounded-xl bg-rose-500 text-slate-950 font-bold text-xs hover:bg-rose-400 transition-colors"
          >
            Gestionar Combustible
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Horas y Viajes Totales"
          value={`${formatNumber(totalHoras, 1)} hrs`}
          subtitle={`${totalViajes} viajes • ${totalConduces} conduces`}
          icon={<Layers className="w-6 h-6" />}
          colorScheme="amber"
          onClick={() => setActiveView('conduces')}
        />

        <MetricCard
          title="Facturación Estimada"
          value={formatCurrency(totalMonto)}
          subtitle={`${conducesFacturados.length} conduces facturados`}
          icon={<DollarSign className="w-6 h-6" />}
          colorScheme="emerald"
          onClick={() => setActiveView('conduces')}
        />

        <MetricCard
          title="Pendiente de Facturar"
          value={formatCurrency(montoPendiente)}
          subtitle={`${conducesPendientes.length} conduces pendientes`}
          icon={<Clock className="w-6 h-6" />}
          colorScheme="blue"
          onClick={() => setActiveView('conduces')}
        />

        <MetricCard
          title="Inventario de Diésel"
          value={`${formatNumber(nivelGasoil, 0)} gal`}
          subtitle={`${porcentajeGasoil}% de ${formatNumber(capacidadGasoil, 0)} gal`}
          icon={<Fuel className="w-6 h-6" />}
          colorScheme={isGasoilBajo ? 'rose' : 'purple'}
          onClick={() => setActiveView('gasoil')}
        />
      </div>

      {/* Two Column Layout: Recent Conduces & Production Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Conduces Table */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Últimos Conduces Registrados
                </h3>
                <p className="text-xs text-slate-400">
                  Despachos recientes de maquinaria, viajes y servicios operacionales
                </p>
              </div>
              <button
                onClick={() => setActiveView('conduces')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">No. Conduce</th>
                    <th className="py-2.5 px-3">Cliente / Mina</th>
                    <th className="py-2.5 px-3">Servicio / Equipo</th>
                    <th className="py-2.5 px-3 text-center">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Total RD$</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {conduces.slice(0, 5).map((conduce) => (
                    <tr key={conduce.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {conduce.numeroConduce}
                        <div className="text-[10px] text-slate-500 font-sans">
                          {formatDate(conduce.fecha)} {conduce.hora}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200 truncate max-w-[150px]">
                          {conduce.clienteNombre}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {conduce.proyectoMina || conduce.obra || 'Planta'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-300 truncate max-w-[160px]">
                          {conduce.servicioDescripcion}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {conduce.equipoFicha || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-200">
                        {conduce.cantidad} {conduce.unidadMedida}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatCurrency(conduce.totalMonto)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            conduce.estadoFacturacion === 'Facturado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : conduce.estadoFacturacion === 'Anulado'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {conduce.estadoFacturacion}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onViewConduce(conduce)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Ver e Imprimir Conduce"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onOpenNewConduce}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              + Generar Nuevo Conduce
            </button>
          </div>
        </div>

        {/* Right 1 Col: Quick Status & Client Production Ranking */}
        <div className="space-y-6">
          {/* Tank Level Widget */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" />
                Tanque de Autoconsumo
              </h4>
              <span className="text-xs font-mono font-bold text-slate-400">
                {formatNumber(nivelGasoil, 0)} / {formatNumber(capacidadGasoil, 0)} gal
              </span>
            </div>

            {/* Visual Tank Bar */}
            <div className="relative w-full h-5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isGasoilBajo
                    ? 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, porcentajeGasoil))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>0 gal</span>
              <span className={isGasoilBajo ? 'text-rose-400 font-bold' : 'text-slate-300 font-bold'}>
                {porcentajeGasoil}% en tanque
              </span>
              <span>{formatNumber(capacidadGasoil, 0)} gal</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic text-center">
              Combustible para abastecimiento interno de flota
            </p>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex gap-2">
              <button
                onClick={() => setActiveView('gasoil')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors text-center cursor-pointer"
              >
                Control de Diésel y Despachos
              </button>
            </div>
          </div>

          {/* Top Clients by Volume */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Principales Clientes
            </h4>

            <div className="space-y-3">
              {clientProduction.map((item, idx) => (
                <div
                  key={item.cliente.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800/60"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {item.cliente.nombre}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.totalConduces} conduces • {formatNumber(item.horas, 1)} hrs • {item.viajes} vjs
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">
                    {formatCurrency(item.totalMonto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
