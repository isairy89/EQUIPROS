import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Cliente,
  Servicio,
  PrecioCliente,
  Empleado,
  EquipoVehiculo,
  Conduce,
  ConfiguracionGasoil,
  CompraGasoil,
  DespachoGasoil,
  ConteoGasoil,
  FullInitialState,
} from '../types/index.ts';
import { ApiService, getAuthToken } from '../services/api.ts';
import {
  INITIAL_CLIENTES,
  INITIAL_SERVICIOS,
  INITIAL_PRECIOS_CLIENTE,
  INITIAL_EMPLEADOS,
  INITIAL_EQUIPOS,
  INITIAL_CONDUCES,
  INITIAL_GASOIL_CONFIG,
  INITIAL_GASOIL_COMPRAS,
  INITIAL_GASOIL_DESPACHOS,
  INITIAL_GASOIL_CONTEOS,
} from '../db/seed.ts';

export type ViewType =
  | 'dashboard'
  | 'conduces'
  | 'produccion'
  | 'clientes'
  | 'servicios'
  | 'empleados'
  | 'equipos'
  | 'gasoil'
  | 'reportes'
  | 'nomina'
  | 'ajustes';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isLoading: boolean;
  isLoggedIn: boolean;
  currentUser: { username: string; name: string } | null;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Data Collections
  clientes: Cliente[];
  servicios: Servicio[];
  preciosCliente: PrecioCliente[];
  empleados: Empleado[];
  equipos: EquipoVehiculo[];
  conduces: Conduce[];
  gasoilConfig: ConfiguracionGasoil;
  gasoilCompras: CompraGasoil[];
  gasoilDespachos: DespachoGasoil[];
  gasoilConteos: ConteoGasoil[];

  // Data Mutation Methods
  saveCliente: (cliente: Partial<Cliente>) => Promise<Cliente>;
  deleteCliente: (id: string) => Promise<void>;

  saveServicio: (servicio: Partial<Servicio>) => Promise<Servicio>;
  deleteServicio: (id: string) => Promise<void>;

  savePrecioCliente: (precio: Partial<PrecioCliente>) => Promise<PrecioCliente>;
  deletePrecioCliente: (id: string) => Promise<void>;
  getPrecioParaClienteYServicio: (clienteId: string, servicioId: string) => number;

  saveEmpleado: (empleado: Partial<Empleado>) => Promise<Empleado>;
  deleteEmpleado: (id: string) => Promise<void>;

  saveEquipo: (equipo: Partial<EquipoVehiculo>) => Promise<EquipoVehiculo>;
  deleteEquipo: (id: string) => Promise<void>;

  saveConduce: (conduce: Partial<Conduce>) => Promise<Conduce>;
  updateEstadoFacturacion: (id: string, estado: 'Pendiente' | 'Facturado' | 'Anulado') => Promise<void>;
  deleteConduce: (id: string) => Promise<void>;

  saveGasoilConfig: (config: Partial<ConfiguracionGasoil>) => Promise<void>;
  saveGasoilCompra: (compra: Partial<CompraGasoil>) => Promise<CompraGasoil>;
  deleteGasoilCompra: (id: string) => Promise<void>;

  saveGasoilDespacho: (despacho: Partial<DespachoGasoil>) => Promise<DespachoGasoil>;
  deleteGasoilDespacho: (id: string) => Promise<void>;

  saveGasoilConteo: (conteo: Partial<ConteoGasoil>) => Promise<ConteoGasoil>;
  deleteGasoilConteo: (id: string) => Promise<void>;

  refreshData: () => Promise<void>;
  resetToSampleData: () => Promise<void>;
  exportJSONBackup: () => void;
  importJSONBackup: (jsonContent: string) => Promise<void>;

  // Auth
  handleLogin: (user: string, pass: string) => Promise<boolean>;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string } | null>({
    username: 'admin',
    name: 'Administrador EQUIPROCI',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // State entities
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [servicios, setServicios] = useState<Servicio[]>(INITIAL_SERVICIOS);
  const [preciosCliente, setPreciosCliente] = useState<PrecioCliente[]>(INITIAL_PRECIOS_CLIENTE);
  const [empleados, setEmpleados] = useState<Empleado[]>(INITIAL_EMPLEADOS);
  const [equipos, setEquipos] = useState<EquipoVehiculo[]>(INITIAL_EQUIPOS);
  const [conduces, setConduces] = useState<Conduce[]>(INITIAL_CONDUCES);
  const [gasoilConfig, setGasoilConfig] = useState<ConfiguracionGasoil>(INITIAL_GASOIL_CONFIG);
  const [gasoilCompras, setGasoilCompras] = useState<CompraGasoil[]>(INITIAL_GASOIL_COMPRAS);
  const [gasoilDespachos, setGasoilDespachos] = useState<DespachoGasoil[]>(INITIAL_GASOIL_DESPACHOS);
  const [gasoilConteos, setGasoilConteos] = useState<ConteoGasoil[]>(INITIAL_GASOIL_CONTEOS);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const applyFullState = (state: FullInitialState) => {
    if (state.clientes) setClientes(state.clientes);
    if (state.servicios) setServicios(state.servicios);
    if (state.preciosCliente) setPreciosCliente(state.preciosCliente);
    if (state.empleados) setEmpleados(state.empleados);
    if (state.equipos) setEquipos(state.equipos);
    if (state.conduces) setConduces(state.conduces);
    if (state.gasoilConfig) setGasoilConfig(state.gasoilConfig);
    if (state.gasoilCompras) setGasoilCompras(state.gasoilCompras);
    if (state.gasoilDespachos) setGasoilDespachos(state.gasoilDespachos);
    if (state.gasoilConteos) setGasoilConteos(state.gasoilConteos);
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getInitialState();
      applyFullState(data);
      setIsLoggedIn(true);
    } catch (err: any) {
      if (err?.message && (err.message.includes('Autenticación requerida') || err.message.includes('401'))) {
        setIsLoggedIn(false);
      } else {
        console.warn('Usando datos locales o de reserva:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check health and initial session
    const initAuth = async () => {
      try {
        const health = await ApiService.checkHealth();
        if (!health.authConfigured) {
          setIsLoggedIn(true);
        }
      } catch {
        // Continue with refreshData
      }
      await refreshData();
    };

    initAuth();

    const handleUnauthorized = () => {
      setIsLoggedIn(false);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, []);

  // Sincronización en tiempo real: cuando otra PC guarda/elimina algo, esta PC refresca sola.
  useEffect(() => {
    if (!isLoggedIn) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const token = getAuthToken() || '';
    const source = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

    source.onmessage = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      // Agrupa ráfagas de cambios (p.ej. varias filas guardadas seguidas) en un solo refresco.
      debounceTimer = setTimeout(() => {
        refreshData();
      }, 400);
    };

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Helper to determine exact price for a given client & service
  const getPrecioParaClienteYServicio = (clienteId: string, servicioId: string): number => {
    const especial = preciosCliente.find(
      (p) => p.clienteId === clienteId && p.servicioId === servicioId
    );
    if (especial && Number(especial.precioEspecial) > 0) {
      return Number(especial.precioEspecial);
    }
    const serv = servicios.find((s) => s.id === servicioId);
    return serv ? Number(serv.precioBase) : 0;
  };

  // --- CRUD Handlers ---

  const saveCliente = async (cliente: Partial<Cliente>): Promise<Cliente> => {
    try {
      const saved = await ApiService.saveCliente(cliente);
      setClientes((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      showToast('Cliente guardado correctamente', 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al guardar cliente: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteCliente = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteCliente(id);
      setClientes((prev) => prev.filter((c) => c.id !== id));
      setPreciosCliente((prev) => prev.filter((p) => p.clienteId !== id));
      showToast('Cliente eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar cliente: ' + err.message, 'error');
      throw err;
    }
  };

  const saveServicio = async (servicio: Partial<Servicio>): Promise<Servicio> => {
    try {
      const saved = await ApiService.saveServicio(servicio);
      setServicios((prev) => {
        const idx = prev.findIndex((s) => s.id === saved.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast('Servicio guardado correctamente', 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al guardar servicio: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteServicio = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteServicio(id);
      setServicios((prev) => prev.filter((s) => s.id !== id));
      setPreciosCliente((prev) => prev.filter((p) => p.servicioId !== id));
      showToast('Servicio eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar servicio: ' + err.message, 'error');
      throw err;
    }
  };

  const savePrecioCliente = async (precio: Partial<PrecioCliente>): Promise<PrecioCliente> => {
    try {
      const saved = await ApiService.savePrecioCliente(precio);
      setPreciosCliente((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast('Tarifa especial para cliente actualizada', 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al guardar tarifa especial: ' + err.message, 'error');
      throw err;
    }
  };

  const deletePrecioCliente = async (id: string): Promise<void> => {
    try {
      await ApiService.deletePrecioCliente(id);
      setPreciosCliente((prev) => prev.filter((p) => p.id !== id));
      showToast('Tarifa especial eliminada', 'info');
    } catch (err: any) {
      showToast('Error al eliminar tarifa: ' + err.message, 'error');
      throw err;
    }
  };

  const saveEmpleado = async (empleado: Partial<Empleado>): Promise<Empleado> => {
    try {
      const saved = await ApiService.saveEmpleado(empleado);
      setEmpleados((prev) => {
        const idx = prev.findIndex((e) => e.id === saved.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast('Empleado / Operador guardado', 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al guardar empleado: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteEmpleado = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteEmpleado(id);
      setEmpleados((prev) => prev.filter((e) => e.id !== id));
      showToast('Empleado eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar empleado: ' + err.message, 'error');
      throw err;
    }
  };

  const saveEquipo = async (equipo: Partial<EquipoVehiculo>): Promise<EquipoVehiculo> => {
    try {
      const saved = await ApiService.saveEquipo(equipo);
      setEquipos((prev) => {
        const idx = prev.findIndex((eq) => eq.id === saved.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast('Equipo guardado correctamente', 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al guardar equipo: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteEquipo = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteEquipo(id);
      setEquipos((prev) => prev.filter((eq) => eq.id !== id));
      showToast('Equipo eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar equipo: ' + err.message, 'error');
      throw err;
    }
  };

  const saveConduce = async (conduce: Partial<Conduce>): Promise<Conduce> => {
    try {
      const saved = await ApiService.saveConduce(conduce);
      setConduces((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      showToast(`Conduce ${saved.numeroConduce} registrado con éxito`, 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al guardar conduce: ' + err.message, 'error');
      throw err;
    }
  };

  const updateEstadoFacturacion = async (id: string, estado: 'Pendiente' | 'Facturado' | 'Anulado'): Promise<void> => {
    try {
      await ApiService.updateEstadoFacturacion(id, estado);
      setConduces((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estadoFacturacion: estado } : c))
      );
      showToast(`Estado actualizado a: ${estado}`, 'success');
    } catch (err: any) {
      showToast('Error al actualizar facturación: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteConduce = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteConduce(id);
      setConduces((prev) => prev.filter((c) => c.id !== id));
      showToast('Conduce eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar conduce: ' + err.message, 'error');
      throw err;
    }
  };

  const saveGasoilConfig = async (config: Partial<ConfiguracionGasoil>): Promise<void> => {
    try {
      const saved = await ApiService.saveGasoilConfig(config);
      setGasoilConfig(saved);
      showToast('Configuración de tanque de combustible guardada', 'success');
    } catch (err: any) {
      showToast('Error al guardar configuración: ' + err.message, 'error');
      throw err;
    }
  };

  const saveGasoilCompra = async (compra: Partial<CompraGasoil>): Promise<CompraGasoil> => {
    try {
      const saved = await ApiService.saveGasoilCompra(compra);
      setGasoilCompras((prev) => [saved, ...prev]);
      setGasoilConfig((prev) => ({
        ...prev,
        nivelActual: Math.min(prev.capacidadTanquePrincipal, prev.nivelActual + Number(saved.galones)),
      }));
      showToast(`Entrada de ${saved.galones} galones registrada`, 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al registrar compra de gasoil: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteGasoilCompra = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteGasoilCompra(id);
      setGasoilCompras((prev) => prev.filter((c) => c.id !== id));
      showToast('Registro de compra eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar compra: ' + err.message, 'error');
      throw err;
    }
  };

  const saveGasoilDespacho = async (despacho: Partial<DespachoGasoil>): Promise<DespachoGasoil> => {
    try {
      const saved = await ApiService.saveGasoilDespacho(despacho);
      setGasoilDespachos((prev) => [saved, ...prev]);
      setGasoilConfig((prev) => ({
        ...prev,
        nivelActual: Math.max(0, prev.nivelActual - Number(saved.galones)),
      }));
      showToast(`Despacho de ${saved.galones} galones a ${saved.equipoFicha} registrado`, 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al registrar despacho de combustible: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteGasoilDespacho = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteGasoilDespacho(id);
      setGasoilDespachos((prev) => prev.filter((d) => d.id !== id));
      showToast('Despacho eliminado', 'info');
    } catch (err: any) {
      showToast('Error al eliminar despacho: ' + err.message, 'error');
      throw err;
    }
  };

  const saveGasoilConteo = async (conteo: Partial<ConteoGasoil>): Promise<ConteoGasoil> => {
    try {
      const saved = await ApiService.saveGasoilConteo(conteo);
      setGasoilConteos((prev) => [saved, ...prev]);
      showToast('Registro de varillada / control físico guardado', 'success');
      return saved;
    } catch (err: any) {
      showToast('Error al registrar medición: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteGasoilConteo = async (id: string): Promise<void> => {
    try {
      await ApiService.deleteGasoilConteo(id);
      setGasoilConteos((prev) => prev.filter((c) => c.id !== id));
      showToast('Medición eliminada', 'info');
    } catch (err: any) {
      showToast('Error al eliminar medición: ' + err.message, 'error');
      throw err;
    }
  };

  const resetToSampleData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await ApiService.resetData();
      applyFullState(res);
      showToast('Sistema restablecido a los valores iniciales', 'success');
    } catch (err: any) {
      // Fallback in memory
      setClientes(INITIAL_CLIENTES);
      setServicios(INITIAL_SERVICIOS);
      setPreciosCliente(INITIAL_PRECIOS_CLIENTE);
      setEmpleados(INITIAL_EMPLEADOS);
      setEquipos(INITIAL_EQUIPOS);
      setConduces(INITIAL_CONDUCES);
      setGasoilConfig(INITIAL_GASOIL_CONFIG);
      setGasoilCompras(INITIAL_GASOIL_COMPRAS);
      setGasoilDespachos(INITIAL_GASOIL_DESPACHOS);
      setGasoilConteos(INITIAL_GASOIL_CONTEOS);
      showToast('Datos de demostración restablecidos en memoria', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const exportJSONBackup = () => {
    const data: FullInitialState = {
      clientes,
      servicios,
      preciosCliente,
      empleados,
      equipos,
      conduces,
      gasoilConfig,
      gasoilCompras,
      gasoilDespachos,
      gasoilConteos,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_EQUIPROCI_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada', 'success');
  };

  const importJSONBackup = async (jsonContent: string) => {
    try {
      setIsLoading(true);
      const parsed = JSON.parse(jsonContent);
      const updated = await ApiService.migrateLocalData(parsed);
      applyFullState(updated);
      showToast('Copia de seguridad restaurada correctamente', 'success');
    } catch (err: any) {
      showToast('Error al importar copia de seguridad: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await ApiService.login(user, pass);
      setIsLoggedIn(true);
      setCurrentUser(res.user);
      showToast('Bienvenido a EQUIPROCI, ' + res.user.name, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error de autenticación', 'error');
      return false;
    }
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    showToast('Sesión cerrada', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        isLoading,
        isLoggedIn,
        currentUser,
        toasts,
        showToast,
        removeToast,
        clientes,
        servicios,
        preciosCliente,
        empleados,
        equipos,
        conduces,
        gasoilConfig,
        gasoilCompras,
        gasoilDespachos,
        gasoilConteos,
        saveCliente,
        deleteCliente,
        saveServicio,
        deleteServicio,
        savePrecioCliente,
        deletePrecioCliente,
        getPrecioParaClienteYServicio,
        saveEmpleado,
        deleteEmpleado,
        saveEquipo,
        deleteEquipo,
        saveConduce,
        updateEstadoFacturacion,
        deleteConduce,
        saveGasoilConfig,
        saveGasoilCompra,
        deleteGasoilCompra,
        saveGasoilDespacho,
        deleteGasoilDespacho,
        saveGasoilConteo,
        deleteGasoilConteo,
        refreshData,
        resetToSampleData,
        exportJSONBackup,
        importJSONBackup,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
