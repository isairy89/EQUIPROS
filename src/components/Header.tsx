import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  FilePlus,
  Fuel,
  RefreshCw,
  User,
  LogOut,
  Calendar,
} from 'lucide-react';
import { formatDate, getTodayString } from '../utils/formatters.ts';

interface HeaderProps {
  onOpenNewConduce: () => void;
  onOpenNewGasoilDespacho: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewConduce,
  onOpenNewGasoilDespacho,
}) => {
  const { activeView, isLoading, refreshData, currentUser, handleLogout } = useApp();

  const viewTitles: Record<string, { title: string; desc: string }> = {
    dashboard: {
      title: 'Panel de Control y Métricas',
      desc: 'Resumen en tiempo real de conduces, producción, flota y combustible',
    },
    conduces: {
      title: 'Registro y Control de Conduces',
      desc: 'Conduces de equipos pesados (por horas) y materiales/volteo (por m³ y viajes)',
    },
    produccion: {
      title: 'Control de Producción',
      desc: 'Producción acumulada por cliente, proyecto, material, equipo y fecha',
    },
    clientes: {
      title: 'Clientes y Proyectos',
      desc: 'Cartera de clientes, obras activas y tarifas especiales por cliente',
    },
    minas: {
      title: 'Minas',
      desc: 'Origen del material transportado en los conduces de materiales/volteo',
    },
    servicios: {
      title: 'Catálogo de Servicios y Precios',
      desc: 'Alquiler de maquinaria por hora, materiales por m³ y fletes de transporte',
    },
    empleados: {
      title: 'Empleados y Personal',
      desc: 'Operadores de maquinaria, choferes de camión y personal general',
    },
    equipos: {
      title: 'Equipos y Vehículos',
      desc: 'Maquinaria pesada, camiones de volteo y su estado operativo',
    },
    gasoil: {
      title: 'Control de Gasoil (Autoconsumo)',
      desc: 'Inventario de tanque propio, entradas mayoristas y despachos internos a maquinaria',
    },
    nomina: {
      title: 'Reporte de Nómina',
      desc: 'Horas trabajadas, viajes realizados y conduces asociados por empleado',
    },
    reportes: {
      title: 'Reporte a Clientes',
      desc: 'Información consolidada por cliente, proyecto y rango de fechas para facturación',
    },
    ajustes: {
      title: 'Ajustes del Sistema y Respaldos',
      desc: 'Exportación/importación de base de datos y configuración',
    },
  };

  const currentTitle = viewTitles[activeView] || {
    title: 'EQUIPROCI',
    desc: 'Sistema de Gestión',
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20 shrink-0 no-print">
      {/* View Title */}
      <div className="min-w-0 pr-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2.5 truncate">
          {currentTitle.title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">{currentTitle.desc}</p>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Date Display */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 font-medium">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Hoy: {formatDate(getTodayString())}</span>
        </div>

        {/* Quick Gasoil Dispense Button */}
        <button
          onClick={onOpenNewGasoilDespacho}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all duration-150 active:scale-95 cursor-pointer"
          title="Despachar Gasoil a Equipo"
        >
          <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden md:inline">Despachar Gasoil</span>
        </button>

        {/* Quick New Conduce Button */}
        <button
          onClick={onOpenNewConduce}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <FilePlus className="w-4 h-4 shrink-0" />
          <span>+ Nuevo Conduce</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-colors cursor-pointer"
          title="Sincronizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* User profile dropdown / logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden lg:inline truncate max-w-[120px]">
              {currentUser?.name || 'Administrador'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
