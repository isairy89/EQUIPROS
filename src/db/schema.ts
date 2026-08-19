import { pgTable, text, timestamp, numeric, boolean, integer } from 'drizzle-orm/pg-core';

export const clientes = pgTable('clientes', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  rnc: text('rnc').notNull(),
  telefono: text('telefono'),
  email: text('email'),
  direccion: text('direccion'),
  contacto: text('contacto'),
  estado: text('estado').default('Activo').notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow(),
});

export const servicios = pgTable('servicios', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull(),
  descripcion: text('descripcion').notNull(),
  unidadMedida: text('unidad_medida').notNull(),
  precioBase: numeric('precio_base', { mode: 'number' }).notNull(),
  categoria: text('categoria'),
  estado: text('estado').default('Activo').notNull(),
});

export const preciosCliente = pgTable('precios_cliente', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull(),
  servicioId: text('servicio_id').notNull(),
  precioEspecial: numeric('precio_especial', { mode: 'number' }).notNull(),
  notas: text('notas'),
});

export const empleados = pgTable('empleados', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull(),
  nombre: text('nombre').notNull(),
  cedula: text('cedula').notNull(),
  telefono: text('telefono'),
  cargo: text('cargo').notNull(),
  salarioBase: numeric('salario_base', { mode: 'number' }).default(0),
  pagoPorViaje: numeric('pago_por_viaje', { mode: 'number' }).default(0),
  pagoPorMetro: numeric('pago_por_metro', { mode: 'number' }).default(0),
  pagoPorHora: numeric('pago_por_hora', { mode: 'number' }).default(0),
  estado: text('estado').default('Activo').notNull(),
});

export const equipos = pgTable('equipos', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull(),
  ficha: text('ficha').notNull(),
  tipo: text('tipo').notNull(),
  marca: text('marca'),
  modelo: text('modelo'),
  placa: text('placa'),
  ano: integer('ano'),
  capacidadM3: numeric('capacidad_m3', { mode: 'number' }),
  estado: text('estado').default('Operativo').notNull(),
  consumoPromedioGasoil: numeric('consumo_promedio_gasoil', { mode: 'number' }),
  ultimoHorometro: numeric('ultimo_horometro', { mode: 'number' }),
  ultimoOdometro: numeric('ultimo_odometro', { mode: 'number' }),
});

export const conduces = pgTable('conduces', {
  id: text('id').primaryKey(),
  numeroConduce: text('numero_conduce').notNull(),
  tipoConduce: text('tipo_conduce').default('MATERIAL').notNull(),
  fecha: text('fecha').notNull(),
  hora: text('hora'),
  clienteId: text('cliente_id').notNull(),
  clienteNombre: text('cliente_nombre').notNull(),
  obra: text('obra').notNull(),
  servicioId: text('servicio_id'),
  servicioDescripcion: text('servicio_descripcion'),
  cantidad: numeric('cantidad', { mode: 'number' }).notNull(),
  unidadMedida: text('unidad_medida').notNull(),
  precioUnitario: numeric('precio_unitario', { mode: 'number' }).default(0).notNull(),
  totalMonto: numeric('total_monto', { mode: 'number' }).default(0).notNull(),
  choferId: text('chofer_id'),
  choferNombre: text('chofer_nombre'),
  equipoId: text('equipo_id'),
  equipoFicha: text('equipo_ficha'),
  bombaId: text('bomba_id'),
  bombaFicha: text('bomba_ficha'),
  placa: text('placa'),
  turnoHorario: text('turno_horario'),
  horaInicio: text('hora_inicio'),
  horaFin: text('hora_fin'),
  horasTrabajadas: numeric('horas_trabajadas', { mode: 'number' }),
  horometroInicial: numeric('horometro_inicial', { mode: 'number' }),
  horometroFinal: numeric('horometro_final', { mode: 'number' }),
  viajes: numeric('viajes', { mode: 'number' }),
  capacidadCamion: numeric('capacidad_camion', { mode: 'number' }),
  material: text('material'),
  rnc: text('rnc'),
  sellado: boolean('sellado').default(true),
  estadoFacturacion: text('estado_facturacion').default('Pendiente').notNull(),
  numeroFactura: text('numero_factura'),
  fechaFacturacion: text('fecha_facturacion'),
  comentarios: text('comentarios'),
  creadoEn: timestamp('creado_en').defaultNow(),
});

export const gasoilConfig = pgTable('gasoil_config', {
  id: text('id').primaryKey().default('main_tank'),
  capacidadTanquePrincipal: numeric('capacidad_tanque_principal', { mode: 'number' }).notNull(),
  nivelActual: numeric('nivel_actual', { mode: 'number' }).notNull(),
  alertaNivelMinimo: numeric('alerta_nivel_minimo', { mode: 'number' }).notNull(),
  precioPorGalonDefecto: numeric('precio_por_galon_defecto', { mode: 'number' }).notNull(),
  precioCostoGalon: numeric('precio_costo_galon', { mode: 'number' }),
});

export const gasoilCompras = pgTable('gasoil_compras', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  proveedor: text('proveedor').notNull(),
  numeroFactura: text('numero_factura'),
  galones: numeric('galones', { mode: 'number' }).notNull(),
  precioPorGalon: numeric('precio_por_galon', { mode: 'number' }).notNull(),
  total: numeric('total', { mode: 'number' }).notNull(),
  recibidoPor: text('recibido_por'),
  notas: text('notas'),
});

export const gasoilDespachos = pgTable('gasoil_despachos', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  hora: text('hora'),
  equipoId: text('equipo_id'),
  equipoFicha: text('equipo_ficha').notNull(),
  empleadoId: text('empleado_id'),
  empleadoNombre: text('empleado_nombre'),
  galones: numeric('galones', { mode: 'number' }).notNull(),
  horometroKm: numeric('horometro_km', { mode: 'number' }),
  conduceId: text('conduce_id'),
  notas: text('notas'),
});

export const gasoilConteos = pgTable('gasoil_conteos', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  hora: text('hora'),
  galonesMedidos: numeric('galones_medidos', { mode: 'number' }).notNull(),
  galonesSistema: numeric('galones_sistema', { mode: 'number' }).notNull(),
  diferencia: numeric('diferencia', { mode: 'number' }).notNull(),
  responsable: text('responsable').notNull(),
  observacion: text('observacion'),
});
