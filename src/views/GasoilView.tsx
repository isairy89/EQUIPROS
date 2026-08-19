import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Fuel,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Truck,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Info,
  Layers,
  Scale,
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getTodayString,
  getCurrentTimeString,
} from '../utils/formatters.ts';
import { exportGasoilToExcel } from '../utils/excelExport.ts';

interface GasoilViewProps {
  isDespachoModalOpen: boolean;
  setIsDespachoModalOpen: (open: boolean) => void;
}

export const GasoilView: React.FC<GasoilViewProps> = ({
  isDespachoModalOpen,
  setIsDespachoModalOpen,
}) => {
  const {
    gasoilConfig,
    gasoilCompras,
    gasoilDespachos,
    gasoilConteos,
    equipos,
    empleados,
    saveGasoilConfig,
    saveGasoilCompra,
    deleteGasoilCompra,
    saveGasoilDespacho,
    deleteGasoilDespacho,
    saveGasoilConteo,
    deleteGasoilConteo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'despachos' | 'compras' | 'conteos' | 'config'>('despachos');

  // Modal states
  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [isConteoModalOpen, setIsConteoModalOpen] = useState(false);

  // Despacho Form
  const [despachoFecha, setDespachoFecha] = useState(getTodayString());
  const [despachoHora, setDespachoHora] = useState(getCurrentTimeString());
  const [despachoEquipoId, setDespachoEquipoId] = useState('');
  const [despachoEmpleadoId, setDespachoEmpleadoId] = useState('');
  const [despachoGalones, setDespachoGalones] = useState<number>(35);
  const [despachoHorometroKm, setDespachoHorometroKm] = useState('');
  const [despachoNotas, setDespachoNotas] = useState('');

  // Compra / Entrada Form
  const [compraFecha, setCompraFecha] = useState(getTodayString());
  const [compraProveedor, setCompraProveedor] = useState('Combustibles Nacionales S.A.');
  const [compraFactura, setCompraFactura] = useState('');
  const [compraGalones, setCompraGalones] = useState<number>(1000);
  const [compraPrecioGalon, setCompraPrecioGalon] = useState<number>(gasoilConfig.precioCostoGalon || 230);
  const [compraNotas, setCompraNotas] = useState('');

  // Conteo / Varillada Form
  const [conteoFecha, setConteoFecha] = useState(getTodayString());
  const [conteoHora, setConteoHora] = useState(getCurrentTimeString());
  const [conteoGalonesMedidos, setConteoGalonesMedidos] = useState<number>(gasoilConfig.nivelActual || 0);
  const [conteoRealizadoPor, setConteoRealizadoPor] = useState('Encargado de Patio');
  const [conteoNotas, setConteoNotas] = useState('');

  // Config Form
  const [cfgCapacidad, setCfgCapacidad] = useState(gasoilConfig.capacidadTanquePrincipal || 3500);
  const [cfgNivelActual, setCfgNivelActual] = useState(gasoilConfig.nivelActual || 0);
  const [cfgAlertaMinimo, setCfgAlertaMinimo] = useState(gasoilConfig.alertaNivelMinimo || 500);
  const [cfgPrecioCosto, setCfgPrecioCosto] = useState(gasoilConfig.precioCostoGalon || 230);

  // Theoretical Balance Calculations:
  // Saldo Teórico = (Nivel Actual en Tanque o Inicial)
  const totalCompradoGasoil = useMemo(() => {
    return gasoilCompras.reduce((sum, c) => sum + Number(c.galones || 0), 0);
  }, [gasoilCompras]);

  const totalDespachadoGasoil = useMemo(() => {
    return gasoilDespachos.reduce((sum, d) => sum + Number(d.galones || 0), 0);
  }, [gasoilDespachos]);

  const nivelGasoil = gasoilConfig.nivelActual || 0;
  const capacidadGasoil = gasoilConfig.capacidadTanquePrincipal || 3500;
  const porcentaje = capacidadGasoil > 0 ? ((nivelGasoil / capacidadGasoil) * 100).toFixed(1) : '0.0';
  const porcentajeNum = Math.min(100, Math.max(0, parseFloat(porcentaje)));
  const isBajo = nivelGasoil <= (gasoilConfig.alertaNivelMinimo || 500);

  // Last recorded horometer for selected equipment (Anomaly detection)
  const ultimoDespachoEquipo = useMemo(() => {
    if (!despachoEquipoId) return null;
    const eq = equipos.find((e) => e.id === despachoEquipoId);
    if (!eq) return null;
    const despachosDeEsteEquipo = gasoilDespachos
      .filter((d) => d.equipoId === despachoEquipoId || d.equipoFicha === eq.ficha)
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    return despachosDeEsteEquipo.length > 0 ? despachosDeEsteEquipo[0] : null;
  }, [despachoEquipoId, equipos, gasoilDespachos]);

  // Check if current entered horometer is descending
  const isHorometroDescendente = useMemo(() => {
    if (!ultimoDespachoEquipo || !despachoHorometroKm) return false;
    const prevStr = String(ultimoDespachoEquipo.horometroKm || '');
    const currStr = String(despachoHorometroKm || '');
    const prevNum = parseFloat(prevStr.replace(/[^0-9.]/g, ''));
    const currNum = parseFloat(currStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(prevNum) && !isNaN(currNum) && currNum > 0 && currNum < prevNum) {
      return { prev: prevNum, curr: currNum };
    }
    return false;
  }, [ultimoDespachoEquipo, despachoHorometroKm]);

  // Last physical measurement
  const ultimaVarillada = useMemo(() => {
    if (gasoilConteos.length === 0) return null;
    return [...gasoilConteos].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))[0];
  }, [gasoilConteos]);

  const handleSaveDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despachoEquipoId || !despachoGalones) {
      alert('Seleccione el equipo y la cantidad de galones');
      return;
    }
    const eq = equipos.find((item) => item.id === despachoEquipoId);
    const emp = empleados.find((item) => item.id === despachoEmpleadoId);

    await saveGasoilDespacho({
      fecha: despachoFecha,
      hora: despachoHora,
      equipoId: despachoEquipoId,
      equipoFicha: eq?.ficha || '',
      empleadoId: despachoEmpleadoId,
      empleadoNombre: emp?.nombre || '',
      galones: Number(despachoGalones),
      horometroKm: despachoHorometroKm,
      notas: despachoNotas,
    });

    setIsDespachoModalOpen(false);
    setDespachoNotas('');
    setDespachoHorometroKm('');
  };

  const handleSaveCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compraGalones || !compraProveedor) {
      alert('Complete los datos obligatorios de la compra');
      return;
    }
    await saveGasoilCompra({
      fecha: compraFecha,
      proveedor: compraProveedor,
      numeroFactura: compraFactura,
      galones: Number(compraGalones),
      precioPorGalon: Number(compraPrecioGalon),
      totalMonto: Number(compraGalones) * Number(compraPrecioGalon),
      notas: compraNotas,
    });
    setIsCompraModalOpen(false);
    setCompraNotas('');
  };

  const handleSaveConteo = async (e: React.FormEvent) => {
    e.preventDefault();
    const galonesSistema = gasoilConfig.nivelActual || 0;
    const galonesFisicos = Number(conteoGalonesMedidos);
    const diferencia = galonesFisicos - galonesSistema;

    await saveGasoilConteo({
      fecha: conteoFecha,
      hora: conteoHora,
      galonesSistema,
      galonesMedidos: galonesFisicos,
      diferencia,
      responsable: conteoRealizadoPor,
      notas: conteoNotas,
    });
    setIsConteoModalOpen(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGasoilConfig({
      capacidadTanquePrincipal: Number(cfgCapacidad),
      nivelActual: Number(cfgNivelActual),
      alertaNivelMinimo: Number(cfgAlertaMinimo),
      precioCostoGalon: Number(cfgPrecioCosto),
    });
  };

  return (
    <div className="space-y-6">
      {/* Visual Tank Dashboard Header */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Fuel className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100">Control de Combustible Interno</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Autoconsumo / Patio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión de entradas de diésel, inventario del tanque y despachos a maquinaria y camiones propios
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDespachoModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Despacho a Equipo</span>
            </button>

            <button
              onClick={() => setIsCompraModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Entrada / Compra de Gasoil</span>
            </button>

            <button
              onClick={() => {
                setConteoGalonesMedidos(gasoilConfig.nivelActual || 0);
                setIsConteoModalOpen(true);
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Varillada / Control Físico</span>
            </button>
          </div>
        </div>

        {/* Tank Level Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Diésel Disponible en Tanque
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${isBajo ? 'text-rose-400' : 'text-amber-400'}`}>
                {formatNumber(nivelGasoil, 0)} gal
              </span>
              <span className="text-xs text-slate-500 font-medium">existencia actual</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500 shrink-0" />
              Combustible para abastecimiento interno de flota
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Capacidad del Tanque
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-slate-200">
                {formatNumber(capacidadGasoil, 0)} gal
              </span>
              <span className="text-xs text-slate-500 font-medium">almacenamiento total</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Costo ref: <span className="text-slate-300 font-mono font-bold">{formatCurrency(gasoilConfig.precioCostoGalon || 230)}</span>/gal
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Porcentaje Disponible
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${isBajo ? 'text-rose-400' : 'text-emerald-400'}`}>
                {porcentaje}%
              </span>
              <span className="text-xs text-slate-500 font-medium">del volumen</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Alerta mínimo: <span className="font-mono text-rose-400 font-bold">{gasoilConfig.alertaNivelMinimo || 500} gal</span>
            </p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>0 gal (Vacío)</span>
            <span className="font-bold text-slate-300">
              {porcentaje}% de capacidad del tanque
            </span>
            <span>{formatNumber(capacidadGasoil, 0)} gal (Capacidad Máxima)</span>
          </div>

          <div className="relative w-full h-6 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-950 ${
                isBajo
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse text-white'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300'
              }`}
              style={{ width: `${Math.max(5, porcentajeNum)}%` }}
            >
              {porcentajeNum > 15 && `${porcentaje}%`}
            </div>
          </div>
        </div>

        {/* Theoretical Balance summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Entradas Acumuladas (+):</span>
            <span className="font-mono font-bold text-emerald-400">+{formatNumber(totalCompradoGasoil, 0)} gal</span>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Despachos a Equipos (-):</span>
            <span className="font-mono font-bold text-rose-400">-{formatNumber(totalDespachadoGasoil, 0)} gal</span>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Última Varillada Física:</span>
            <span className="font-mono font-bold text-sky-400">
              {ultimaVarillada ? `${ultimaVarillada.galonesMedidos} gal (${ultimaVarillada.diferencia > 0 ? '+' : ''}${ultimaVarillada.diferencia} gal)` : 'Sin registros'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('despachos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === 'despachos'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Despachos a Equipos ({gasoilDespachos.length})
        </button>

        <button
          onClick={() => setActiveTab('compras')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === 'compras'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Entradas y Compras de Gasoil ({gasoilCompras.length})
        </button>

        <button
          onClick={() => setActiveTab('conteos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === 'conteos'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Varilladas & Control Físico ({gasoilConteos.length})
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Parámetros del Tanque
        </button>

        <div className="ml-auto shrink-0">
          <button
            onClick={() => exportGasoilToExcel(gasoilDespachos)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold hover:bg-emerald-900 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Despachos</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Despachos a Equipos */}
      {activeTab === 'despachos' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Registro de Despachos Internos a Equipos</h4>
              <p className="text-xs text-slate-400">
                Salidas de combustible asignadas a maquinaria pesada y camiones de la flota
              </p>
            </div>
            <button
              onClick={() => setIsDespachoModalOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Nuevo Despacho</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Equipo / Ficha</th>
                  <th className="py-3 px-4">Operador / Chofer</th>
                  <th className="py-3 px-4 text-center">Galones Despachados</th>
                  <th className="py-3 px-4">Horómetro / Odómetro</th>
                  <th className="py-3 px-4">Observaciones</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {gasoilDespachos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No hay despachos internos registrados.
                    </td>
                  </tr>
                ) : (
                  gasoilDespachos.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        {formatDate(d.fecha)} <span className="text-slate-500">{d.hora}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-400">{d.equipoFicha}</td>
                      <td className="py-3 px-4 text-slate-200">{d.empleadoNombre || '-'}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-100">
                        {d.galones} gal
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{d.horometroKm || '-'}</td>
                      <td className="py-3 px-4 text-slate-400">{d.notas || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar despacho de ${d.galones} gal a ${d.equipoFicha}?`)) {
                              deleteGasoilDespacho(d.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar despacho"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Entradas / Compras de Gasoil */}
      {activeTab === 'compras' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Entradas y Compras de Gasoil Mayorista</h4>
              <p className="text-xs text-slate-400">
                Recepciones de combustible que incrementan el inventario del tanque propio
              </p>
            </div>
            <button
              onClick={() => setIsCompraModalOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Registrar Entrada</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proveedor Mayorista</th>
                  <th className="py-3 px-4">Factura / Conduce</th>
                  <th className="py-3 px-4 text-center">Galones Recibidos</th>
                  <th className="py-3 px-4 text-right">Costo / Galón</th>
                  <th className="py-3 px-4 text-right">Costo Total RD$</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {gasoilCompras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No hay compras o entradas registradas.
                    </td>
                  </tr>
                ) : (
                  gasoilCompras.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono">{formatDate(c.fecha)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{c.proveedor}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{c.numeroFactura || '-'}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                        +{c.galones} gal
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(c.precioPorGalon)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(c.totalMonto)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar registro de entrada de ${c.galones} gal?`)) {
                              deleteGasoilCompra(c.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar compra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Varilladas & Control Físico */}
      {activeTab === 'conteos' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Control Físico y Auditoría de Mermas (Varillada)</h4>
              <p className="text-xs text-slate-400">
                Comparación de la medición física del tanque contra el saldo teórico del sistema
              </p>
            </div>
            <button
              onClick={() => {
                setConteoGalonesMedidos(gasoilConfig.nivelActual || 0);
                setIsConteoModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Registrar Varillada</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4 text-center">Saldo Teórico</th>
                  <th className="py-3 px-4 text-center">Medición Física (Varillada)</th>
                  <th className="py-3 px-4 text-center">Diferencia / Merma</th>
                  <th className="py-3 px-4 text-center">% Desviación</th>
                  <th className="py-3 px-4">Realizado por</th>
                  <th className="py-3 px-4">Notas</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {gasoilConteos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No hay mediciones físicas de varillada registradas.
                    </td>
                  </tr>
                ) : (
                  gasoilConteos.map((co) => {
                    const pctDiff = co.galonesSistema > 0
                      ? ((co.diferencia / co.galonesSistema) * 100).toFixed(2)
                      : '0.00';
                    return (
                      <tr key={co.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          {formatDate(co.fecha)} <span className="text-slate-500">{co.hora}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">
                          {formatNumber(co.galonesSistema, 0)} gal
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                          {formatNumber(co.galonesMedidos, 0)} gal
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span
                            className={
                              co.diferencia >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {co.diferencia > 0 ? `+${co.diferencia}` : co.diferencia} gal
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs">
                          <span
                            className={
                              co.diferencia >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {Number(pctDiff) > 0 ? `+${pctDiff}` : pctDiff}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">{co.responsable}</td>
                        <td className="py-3 px-4 text-slate-400">{co.notas || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar registro de varillada?')) {
                                deleteGasoilConteo(co.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Parámetros del Tanque */}
      {activeTab === 'config' && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="text-base font-bold text-slate-100 mb-1">Parámetros del Tanque de Autoconsumo</h3>
          <p className="text-xs text-slate-400 mb-5">
            Configure la capacidad nominal y los límites de alerta para el control de inventario de diésel interno.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Capacidad Total del Tanque (Galones)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={cfgCapacidad}
                  onChange={(e) => setCfgCapacidad(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Saldo Teórico Actual (Galones)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={cfgNivelActual}
                  onChange={(e) => setCfgNivelActual(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Alerta de Nivel Mínimo Crítico (Galones)
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={cfgAlertaMinimo}
                  onChange={(e) => setCfgAlertaMinimo(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Precio Costo Referencia (RD$ / Galón)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={cfgPrecioCosto}
                  onChange={(e) => setCfgPrecioCosto(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Guardar Parámetros
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Despacho a Equipo */}
      <Modal
        isOpen={isDespachoModalOpen}
        onClose={() => setIsDespachoModalOpen(false)}
        title="Despacho Interno de Gasoil a Equipo"
        subtitle="Salida de combustible desde el tanque propio hacia maquinaria o camión"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDespacho} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha</label>
              <input
                type="date"
                required
                value={despachoFecha}
                onChange={(e) => setDespachoFecha(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Hora</label>
              <input
                type="time"
                required
                value={despachoHora}
                onChange={(e) => setDespachoHora(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Equipo / Vehículo Destino *</label>
              <select
                required
                value={despachoEquipoId}
                onChange={(e) => setDespachoEquipoId(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Equipo --</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.ficha} ({eq.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Operador / Chofer</label>
              <select
                value={despachoEmpleadoId}
                onChange={(e) => setDespachoEmpleadoId(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Personal --</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} ({emp.cargo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference of last recorded horometer for selected equipment */}
          {ultimoDespachoEquipo && (
            <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs flex items-center justify-between">
              <span className="text-slate-400">Último Horómetro/Odómetro Registrado:</span>
              <span className="font-mono font-bold text-amber-400">
                {ultimoDespachoEquipo.horometroKm || 'Sin dato'} ({formatDate(ultimoDespachoEquipo.fecha)})
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Galones Despachados *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={despachoGalones}
                onChange={(e) => setDespachoGalones(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Horómetro u Odómetro Actual</label>
              <input
                type="text"
                placeholder="Ej: 4,820 hrs o 125,400 km"
                value={despachoHorometroKm}
                onChange={(e) => setDespachoHorometroKm(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Anomaly warning banner if descending horometer detected */}
          {isHorometroDescendente && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Advertencia de lectura de horómetro descendente</p>
                <p className="text-[11px] text-amber-300/80">
                  El valor ingresado ({isHorometroDescendente.curr}) es menor al anterior ({isHorometroDescendente.prev}). Verifique si el equipo cambió de horómetro o si fue un error de digitación.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Observaciones / Notas</label>
            <input
              type="text"
              placeholder="Tanque lleno para jornada de excavación en mina..."
              value={despachoNotas}
              onChange={(e) => setDespachoNotas(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDespachoModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Registrar Despacho Interno
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Entrada / Compra de Gasoil */}
      <Modal
        isOpen={isCompraModalOpen}
        onClose={() => setIsCompraModalOpen(false)}
        title="Registrar Entrada / Compra de Gasoil"
        subtitle="Abastecimiento mayorista al tanque principal de autoconsumo"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCompra} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha de Entrada</label>
              <input
                type="date"
                required
                value={compraFecha}
                onChange={(e) => setCompraFecha(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">No. Factura / Conduce Proveedor</label>
              <input
                type="text"
                placeholder="FAC-99482"
                value={compraFactura}
                onChange={(e) => setCompraFactura(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Proveedor Mayorista *</label>
            <input
              type="text"
              required
              placeholder="Ej: Combustibles Nacionales S.A."
              value={compraProveedor}
              onChange={(e) => setCompraProveedor(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Galones Recibidos *</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={compraGalones}
                onChange={(e) => setCompraGalones(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Precio Costo por Galón RD$ *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={compraPrecioGalon}
                onChange={(e) => setCompraPrecioGalon(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right font-mono"
              />
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-bold">
                Costo Total: {formatCurrency(Number(compraGalones || 0) * Number(compraPrecioGalon || 0))}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Observaciones</label>
            <input
              type="text"
              placeholder="Camión cisterna #4, sello #8821..."
              value={compraNotas}
              onChange={(e) => setCompraNotas(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCompraModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Registrar Entrada de Combustible
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Varillada / Control Físico */}
      <Modal
        isOpen={isConteoModalOpen}
        onClose={() => setIsConteoModalOpen(false)}
        title="Medición Física de Tanque (Varillada)"
        subtitle="Auditoría física de nivel para comparación con el saldo teórico y cálculo de mermas"
        maxWidth="md"
      >
        <form onSubmit={handleSaveConteo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha de Medición</label>
              <input
                type="date"
                required
                value={conteoFecha}
                onChange={(e) => setConteoFecha(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Hora</label>
              <input
                type="time"
                required
                value={conteoHora}
                onChange={(e) => setConteoHora(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/80 pb-2">
              <span>Saldo Teórico del Sistema:</span>
              <strong className="text-slate-100 font-mono text-sm">{formatNumber(gasoilConfig.nivelActual || 0, 0)} gal</strong>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cantidad Física Medida (Varillada) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={conteoGalonesMedidos}
                onChange={(e) => setConteoGalonesMedidos(Number(e.target.value))}
                className="w-full py-2.5 px-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center text-amber-400 font-mono"
              />
            </div>

            {/* Computed Difference */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Diferencia / Merma resultante:</span>
              <div className="text-right">
                <span
                  className={`font-mono font-bold text-sm block ${
                    Number(conteoGalonesMedidos) - (gasoilConfig.nivelActual || 0) >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {Number(conteoGalonesMedidos) - (gasoilConfig.nivelActual || 0) > 0 ? '+' : ''}
                  {Number(conteoGalonesMedidos) - (gasoilConfig.nivelActual || 0)} gal
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (
                  {(
                    ((Number(conteoGalonesMedidos) - (gasoilConfig.nivelActual || 0)) /
                      Math.max(1, gasoilConfig.nivelActual || 1)) *
                    100
                  ).toFixed(2)}
                  %)
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              * Nota: La varillada registra la auditoría física para el control de mermas sin alterar el saldo teórico del sistema.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Medición Realizada por *</label>
            <input
              type="text"
              required
              value={conteoRealizadoPor}
              onChange={(e) => setConteoRealizadoPor(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Observaciones</label>
            <input
              type="text"
              placeholder="Lectura de varilla milimétrica matutina..."
              value={conteoNotas}
              onChange={(e) => setConteoNotas(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsConteoModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              Guardar Registro de Varillada
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
