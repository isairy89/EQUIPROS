export interface Cliente {
  id: string;
  nombre: string;
  rnc: string;
  telefono: string;
  email: string;
  direccion: string;
  contacto?: string;
  estado?: 'Activo' | 'Inactivo';
  activo?: boolean;
  fechaCreacion?: string;
}

export interface Mina {
  id: string;
  nombre: string;
  ubicacion?: string;
  contacto?: string;
  telefono?: string;
  estado?: 'Activo' | 'Inactivo';
}

export interface Servicio {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: 'HORA' | 'VIAJE' | 'METRO' | 'm3' | 'tonelada' | 'unidad' | string;
  precioBase: number;
  categoria?: 'Maquinaria Pesada' | 'Transporte / Camiones' | 'Materiales / Mina' | 'Hormigón' | 'Bombeo' | 'Alquiler' | 'Otro' | string;
  estado?: 'Activo' | 'Inactivo';
  activo?: boolean;
}

export interface PrecioCliente {
  id: string;
  clienteId: string;
  clienteNombre?: string;
  servicioId: string;
  servicioDescripcion?: string;
  precioEspecial: number;
  notas?: string;
}

export interface Empleado {
  id: string;
  codigo?: string;
  nombre: string;
  cedula?: string;
  telefono?: string;
  cargo: 'Operador de Maquinaria' | 'Chofer de Camión' | 'Chofer Mixer' | 'Operador de Bomba' | 'Mecánico' | 'Ayudante' | 'Supervisor' | 'Administrativo' | string;
  salarioBase?: number;
  pagoPorViaje?: number;
  pagoPorMetro?: number;
  pagoPorHora?: number;
  estado?: 'Activo' | 'Inactivo';
  activo?: boolean;
}

export interface EquipoVehiculo {
  id: string;
  codigo?: string;
  ficha: string;
  tipo?: 'Retroexcavadora / Pala' | 'Camión Volteo' | 'Camión Mixer' | 'Bomba de Hormigón' | 'Tractor / Buldócer' | 'Rodillo Compactador' | 'Pala Mecánica' | 'Generador' | 'Vehículo Liviano' | string;
  marca?: string;
  modelo?: string;
  placa?: string;
  ano?: number;
  capacidadM3?: number;
  estado?: 'Operativo' | 'En Mantenimiento' | 'Mantenimiento' | 'Fuera de Servicio';
  consumoPromedioGasoil?: number; // km/gal o gal/h
  rendimientoEstimado?: number;
  ultimoHorometro?: number;
  ultimoOdometro?: number;
}

export type Equipo = EquipoVehiculo;

export type TipoConduce = 'EQUIPO' | 'MATERIAL';

export interface Conduce {
  id: string;
  numeroConduce: string;
  tipoConduce: TipoConduce;
  fecha: string; // YYYY-MM-DD
  hora?: string;  // HH:mm
  clienteId: string;
  clienteNombre: string;
  obra: string; // Proyecto / Ubicación destino
  proyectoMina?: string;
  minaId?: string; // Origen del material (solo Conduce de Materiales)
  minaNombre?: string;
  servicioId: string;
  servicioDescripcion: string;
  cantidad: number; // Horas, Viajes, o Metros según servicio
  unidadMedida: 'HORA' | 'VIAJE' | 'METRO' | 'm3' | string;
  precioUnitario: number;
  totalMonto: number;
  // Personal y Equipo
  choferId?: string; // Operador (conduce de Equipo) o Chofer (conduce de Material)
  choferNombre?: string;
  equipoId?: string; // Equipo pesado o camión de volteo
  equipoFicha?: string;
  bombaId?: string;
  bombaFicha?: string;
  placa?: string; // snapshot de equipos.placa al momento del registro
  // Conduce de Equipos Pesados (por horas)
  turnoHorario?: 'Mañana' | 'Tarde' | 'Noche' | string;
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  horasTrabajadas?: number;
  horometroInicial?: number | string;
  horometroFinal?: number | string;
  // Conduce de Materiales / Volteo (por viajes y m3)
  viajes?: number;
  capacidadCamion?: number; // snapshot de equipos.capacidadM3 al momento del registro
  material?: string;
  // Control administrativo
  rnc?: string;
  sellado: boolean;
  estadoFacturacion: 'Pendiente' | 'Facturado' | 'Anulado' | 'Proforma';
  numeroFactura?: string;
  fechaFacturacion?: string;
  comentarios?: string;
  creadoEn?: string;
}

export interface ConfiguracionGasoil {
  capacidadTanquePrincipal: number; // galones
  nivelActual: number;              // galones
  alertaNivelMinimo: number;         // galones
  precioPorGalonDefecto?: number;   // RD$
  precioCostoGalon?: number;        // RD$
}

export interface CompraGasoil {
  id: string;
  fecha: string;
  proveedor: string;
  numeroFactura?: string;
  galones: number;
  precioPorGalon: number;
  total?: number;
  totalMonto?: number;
  recibidoPor?: string;
  notas?: string;
}

export interface DespachoGasoil {
  id: string;
  fecha: string;
  hora?: string;
  equipoId?: string;
  equipoFicha: string;
  empleadoId?: string;
  empleadoNombre?: string;
  galones: number;
  horometroKm?: number | string;
  conduceId?: string;
  notas?: string;
}

export interface ConteoGasoil {
  id: string;
  fecha: string;
  hora?: string;
  galonesMedidos: number;
  galonesSistema: number;
  diferencia: number;
  responsable?: string;
  observacion?: string;
  notas?: string;
}

export interface FullInitialState {
  clientes: Cliente[];
  minas: Mina[];
  servicios: Servicio[];
  preciosCliente: PrecioCliente[];
  empleados: Empleado[];
  equipos: EquipoVehiculo[];
  conduces: Conduce[];
  gasoilConfig: ConfiguracionGasoil;
  gasoilCompras: CompraGasoil[];
  gasoilDespachos: DespachoGasoil[];
  gasoilConteos: ConteoGasoil[];
}
