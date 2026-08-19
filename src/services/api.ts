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

const TOKEN_KEY = 'equiproci_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const json = await response.json();
      if (json.error) errMsg = json.error;
    } catch {
      // ignore
    }

    if (response.status === 401 && endpoint !== '/api/auth/login') {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_unauthorized'));
      }
    }

    throw new Error(errMsg);
  }

  return response.json();
}

export const ApiService = {
  // Session & Auth
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const res = await request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setAuthToken(null);
    }
  },

  async checkHealth(): Promise<{ status: string; authConfigured: boolean }> {
    return request('/api/health');
  },

  // Bootstrap full state
  async getInitialState(): Promise<FullInitialState> {
    return request<FullInitialState>('/api/initial-state');
  },

  async migrateLocalData(data: any): Promise<FullInitialState> {
    const res = await request<{ success: boolean; data: FullInitialState }>('/api/migrate-local-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async resetData(): Promise<FullInitialState> {
    const res = await request<{ success: boolean; data: FullInitialState }>('/api/reset-data', {
      method: 'POST',
    });
    return res.data;
  },

  // Clientes
  async getClientes(): Promise<Cliente[]> {
    return request<Cliente[]>('/api/clientes');
  },
  async saveCliente(cliente: Partial<Cliente>): Promise<Cliente> {
    return request<Cliente>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    });
  },
  async deleteCliente(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  // Servicios
  async getServicios(): Promise<Servicio[]> {
    return request<Servicio[]>('/api/servicios');
  },
  async saveServicio(servicio: Partial<Servicio>): Promise<Servicio> {
    return request<Servicio>('/api/servicios', {
      method: 'POST',
      body: JSON.stringify(servicio),
    });
  },
  async deleteServicio(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/servicios/${id}`, {
      method: 'DELETE',
    });
  },

  // Precios Cliente
  async getPreciosCliente(): Promise<PrecioCliente[]> {
    return request<PrecioCliente[]>('/api/precios-cliente');
  },
  async savePrecioCliente(precio: Partial<PrecioCliente>): Promise<PrecioCliente> {
    return request<PrecioCliente>('/api/precios-cliente', {
      method: 'POST',
      body: JSON.stringify(precio),
    });
  },
  async deletePrecioCliente(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/precios-cliente/${id}`, {
      method: 'DELETE',
    });
  },

  // Empleados
  async getEmpleados(): Promise<Empleado[]> {
    return request<Empleado[]>('/api/empleados');
  },
  async saveEmpleado(empleado: Partial<Empleado>): Promise<Empleado> {
    return request<Empleado>('/api/empleados', {
      method: 'POST',
      body: JSON.stringify(empleado),
    });
  },
  async deleteEmpleado(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/empleados/${id}`, {
      method: 'DELETE',
    });
  },

  // Equipos
  async getEquipos(): Promise<EquipoVehiculo[]> {
    return request<EquipoVehiculo[]>('/api/equipos');
  },
  async saveEquipo(equipo: Partial<EquipoVehiculo>): Promise<EquipoVehiculo> {
    return request<EquipoVehiculo>('/api/equipos', {
      method: 'POST',
      body: JSON.stringify(equipo),
    });
  },
  async deleteEquipo(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/equipos/${id}`, {
      method: 'DELETE',
    });
  },

  // Conduces
  async getConduces(): Promise<Conduce[]> {
    return request<Conduce[]>('/api/conduces');
  },
  async saveConduce(conduce: Partial<Conduce>): Promise<Conduce> {
    return request<Conduce>('/api/conduces', {
      method: 'POST',
      body: JSON.stringify(conduce),
    });
  },
  async updateEstadoFacturacion(id: string, estado: 'Pendiente' | 'Facturado' | 'Anulado'): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/conduces/${id}/facturacion`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  },
  async deleteConduce(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/conduces/${id}`, {
      method: 'DELETE',
    });
  },

  // Gasoil
  async getGasoilConfig(): Promise<ConfiguracionGasoil> {
    return request<ConfiguracionGasoil>('/api/gasoil/config');
  },
  async saveGasoilConfig(config: Partial<ConfiguracionGasoil>): Promise<ConfiguracionGasoil> {
    return request<ConfiguracionGasoil>('/api/gasoil/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
  async getGasoilCompras(): Promise<CompraGasoil[]> {
    return request<CompraGasoil[]>('/api/gasoil/compras');
  },
  async saveGasoilCompra(compra: Partial<CompraGasoil>): Promise<CompraGasoil> {
    return request<CompraGasoil>('/api/gasoil/compras', {
      method: 'POST',
      body: JSON.stringify(compra),
    });
  },
  async deleteGasoilCompra(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/gasoil/compras/${id}`, {
      method: 'DELETE',
    });
  },
  async getGasoilDespachos(): Promise<DespachoGasoil[]> {
    return request<DespachoGasoil[]>('/api/gasoil/despachos');
  },
  async saveGasoilDespacho(despacho: Partial<DespachoGasoil>): Promise<DespachoGasoil> {
    return request<DespachoGasoil>('/api/gasoil/despachos', {
      method: 'POST',
      body: JSON.stringify(despacho),
    });
  },
  async deleteGasoilDespacho(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/gasoil/despachos/${id}`, {
      method: 'DELETE',
    });
  },
  async getGasoilConteos(): Promise<ConteoGasoil[]> {
    return request<ConteoGasoil[]>('/api/gasoil/conteos');
  },
  async saveGasoilConteo(conteo: Partial<ConteoGasoil>): Promise<ConteoGasoil> {
    return request<ConteoGasoil>('/api/gasoil/conteos', {
      method: 'POST',
      body: JSON.stringify(conteo),
    });
  },
  async deleteGasoilConteo(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/gasoil/conteos/${id}`, {
      method: 'DELETE',
    });
  },
};
