import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { ConducePrintModal } from './components/ConducePrintModal.tsx';
import { Conduce, TipoConduce } from './types/index.ts';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { ConducesView } from './views/ConducesView.tsx';
import { ClientesView } from './views/ClientesView.tsx';
import { ServiciosView } from './views/ServiciosView.tsx';
import { EmpleadosView } from './views/EmpleadosView.tsx';
import { EquiposView } from './views/EquiposView.tsx';
import { GasoilView } from './views/GasoilView.tsx';
import { ProduccionView } from './views/ProduccionView.tsx';
import { NominaView } from './views/NominaView.tsx';
import { ReportesView } from './views/ReportesView.tsx';
import { AjustesView } from './views/AjustesView.tsx';

// Login component
import { Flame, Lock, User, ShieldCheck } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { handleLogin } = useApp();
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleLogin(user, pass);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/25 text-slate-950 mx-auto">
            <Flame className="w-8 h-8 fill-current text-slate-950" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wider">EQUIPROCI</h2>
          <p className="text-xs text-slate-400 font-medium">
            Control de Conduces, Producción de Equipos Pesados y Combustible
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">
            Credenciales de prueba: <strong className="text-amber-400 font-mono">admin</strong> /{' '}
            <strong className="text-amber-400 font-mono">admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { activeView, setActiveView, isLoggedIn } = useApp();

  // Modals controlled at top level for quick shortcuts
  const [selectedConduceForPrint, setSelectedConduceForPrint] = useState<Conduce | null>(null);
  const [isConduceCreateOpen, setIsConduceCreateOpen] = useState<boolean>(false);
  const [conduceCreatePresetTipo, setConduceCreatePresetTipo] = useState<TipoConduce | null>(null);
  const [isGasoilDespachoOpen, setIsGasoilDespachoOpen] = useState<boolean>(false);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const handleOpenNewConduceGlobal = (tipo?: TipoConduce) => {
    setConduceCreatePresetTipo(tipo || null);
    setActiveView('conduces');
    setIsConduceCreateOpen(true);
  };

  const handleOpenNewGasoilGlobal = () => {
    setActiveView('gasoil');
    setIsGasoilDespachoOpen(true);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenNewConduce={handleOpenNewConduceGlobal}
            onViewConduce={(conduce) => setSelectedConduceForPrint(conduce)}
          />
        );
      case 'conduces':
        return (
          <ConducesView
            onViewConduce={(conduce) => setSelectedConduceForPrint(conduce)}
            isCreateOpen={isConduceCreateOpen}
            setIsCreateOpen={setIsConduceCreateOpen}
            createPresetTipo={conduceCreatePresetTipo}
          />
        );
      case 'produccion':
        return <ProduccionView />;
      case 'clientes':
        return <ClientesView />;
      case 'servicios':
        return <ServiciosView />;
      case 'empleados':
        return <EmpleadosView />;
      case 'equipos':
        return <EquiposView />;
      case 'gasoil':
        return (
          <GasoilView
            isDespachoModalOpen={isGasoilDespachoOpen}
            setIsDespachoModalOpen={setIsGasoilDespachoOpen}
          />
        );
      case 'nomina':
        return <NominaView />;
      case 'reportes':
        return <ReportesView />;
      case 'ajustes':
        return <AjustesView />;
      default:
        return (
          <DashboardView
            onOpenNewConduce={handleOpenNewConduceGlobal}
            onViewConduce={(conduce) => setSelectedConduceForPrint(conduce)}
          />
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenNewConduceEquipo={() => handleOpenNewConduceGlobal('EQUIPO')}
        onOpenNewConduceMaterial={() => handleOpenNewConduceGlobal('MATERIAL')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          onOpenNewConduce={handleOpenNewConduceGlobal}
          onOpenNewGasoilDespacho={handleOpenNewGasoilGlobal}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 overflow-y-auto custom-scrollbar">
          {renderActiveView()}
        </main>
      </div>

      {/* Conduce Printable Ticket Modal */}
      <ConducePrintModal
        isOpen={!!selectedConduceForPrint}
        onClose={() => setSelectedConduceForPrint(null)}
        conduce={selectedConduceForPrint}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
