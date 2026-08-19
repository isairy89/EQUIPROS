import React from 'react';
import { useApp, ViewType } from '../context/AppContext.tsx';
import {
  LayoutDashboard,
  FileText,
  Users,
  Layers,
  UserCheck,
  Truck,
  Fuel,
  BarChart3,
  DollarSign,
  Settings,
  Flame,
  Clock,
  ClipboardList,
} from 'lucide-react';

interface SidebarProps {
  onOpenNewConduceEquipo: () => void;
  onOpenNewConduceMaterial: () => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const NavButton: React.FC<{ item: NavItem; isActive: boolean; onClick: () => void }> = ({
  item,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
      isActive
        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}>{item.icon}</span>
      <span>{item.label}</span>
    </div>
    {item.badge && (
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isActive
            ? 'bg-slate-950 text-amber-400'
            : String(item.badge).includes('Bajo')
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`}
      >
        {item.badge}
      </span>
    )}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-3 pt-4 pb-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">{children}</p>
);

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewConduceEquipo, onOpenNewConduceMaterial }) => {
  const { activeView, setActiveView, conduces, gasoilConfig } = useApp();

  const conducesPendientes = conduces.filter((c) => c.estadoFacturacion === 'Pendiente').length;
  const isGasoilBajo = (gasoilConfig.nivelActual || 0) <= (gasoilConfig.alertaNivelMinimo || 500);

  const configurarEmpresa: NavItem[] = [
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { id: 'servicios', label: 'Servicios y Precios', icon: <Layers className="w-5 h-5" /> },
    { id: 'empleados', label: 'Empleados y Personal', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'equipos', label: 'Equipos y Vehículos', icon: <Truck className="w-5 h-5" /> },
  ];

  const operacionDiaria: NavItem[] = [
    {
      id: 'conduces',
      label: 'Registro de Conduces',
      icon: <FileText className="w-5 h-5" />,
      badge: conducesPendientes > 0 ? `${conducesPendientes} pend.` : undefined,
    },
    { id: 'produccion', label: 'Control de Producción', icon: <BarChart3 className="w-5 h-5" /> },
    {
      id: 'gasoil',
      label: 'Control de Gasoil',
      icon: <Fuel className="w-5 h-5" />,
      badge: isGasoilBajo ? '¡Bajo!' : undefined,
    },
  ];

  const consultasReportes: NavItem[] = [
    { id: 'reportes', label: 'Reporte a Clientes', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'nomina', label: 'Reporte de Nómina', icon: <DollarSign className="w-5 h-5" /> },
  ];

  const renderGroup = (items: NavItem[]) =>
    items.map((item) => (
      <NavButton key={item.id} item={item} isActive={activeView === item.id} onClick={() => setActiveView(item.id)} />
    ));

  return (
    <aside className="w-64 h-full bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 select-none no-print overflow-hidden">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
          <Flame className="w-6 h-6 fill-current text-slate-950" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-wider">EQUIPROCI</h1>
          <p className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">Equipos & Proyectos Civiles</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <NavButton
          item={{ id: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard className="w-5 h-5" /> }}
          isActive={activeView === 'dashboard'}
          onClick={() => setActiveView('dashboard')}
        />

        <SectionLabel>Registrar Conduce Campo</SectionLabel>
        <button
          onClick={onOpenNewConduceEquipo}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
        >
          <Clock className="w-5 h-5" />
          <span>Conduce de Equipos Pesados</span>
        </button>
        <button
          onClick={onOpenNewConduceMaterial}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all cursor-pointer"
        >
          <Truck className="w-5 h-5" />
          <span>Conduce de Materiales / Volteo</span>
        </button>

        <SectionLabel>Configurar Empresa</SectionLabel>
        {renderGroup(configurarEmpresa)}

        <SectionLabel>Operación Diaria</SectionLabel>
        {renderGroup(operacionDiaria)}

        <SectionLabel>Consultas y Reportes</SectionLabel>
        {renderGroup(consultasReportes)}

        <SectionLabel>Sistema</SectionLabel>
        <NavButton
          item={{ id: 'ajustes', label: 'Configuración y Datos', icon: <Settings className="w-5 h-5" /> }}
          isActive={activeView === 'ajustes'}
          onClick={() => setActiveView('ajustes')}
        />
      </nav>

      {/* Bottom Status Card */}
      <div className="p-3 m-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Tanque Gasoil:</span>
          <span className={`font-bold ${isGasoilBajo ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
            {gasoilConfig.nivelActual} / {gasoilConfig.capacidadTanquePrincipal} gal
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isGasoilBajo ? 'bg-rose-500' : 'bg-amber-500'}`}
            style={{
              width: `${Math.min(
                100,
                Math.round(((gasoilConfig.nivelActual || 0) / (gasoilConfig.capacidadTanquePrincipal || 1)) * 100)
              )}%`,
            }}
          />
        </div>
      </div>
    </aside>
  );
};
