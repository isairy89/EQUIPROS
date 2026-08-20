import { eq, sql } from 'drizzle-orm';
import { db } from './client.ts';
import * as schema from './schema.ts';
import {
  Cliente,
  Mina,
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

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const DatabaseRepository = {
  async getFullInitialState(): Promise<FullInitialState> {
    const [
      clientes,
      minas,
      servicios,
      preciosCliente,
      empleados,
      equipos,
      conduces,
      gasoilConfigRows,
      gasoilCompras,
      gasoilDespachos,
      gasoilConteos,
    ] = await Promise.all([
      db.select().from(schema.clientes),
      db.select().from(schema.minas),
      db.select().from(schema.servicios),
      db.select().from(schema.preciosCliente),
      db.select().from(schema.empleados),
      db.select().from(schema.equipos),
      db.select().from(schema.conduces).orderBy(sql`${schema.conduces.creadoEn} DESC NULLS LAST`),
      db.select().from(schema.gasoilConfig),
      db.select().from(schema.gasoilCompras),
      db.select().from(schema.gasoilDespachos),
      db.select().from(schema.gasoilConteos),
    ]);

    return {
      clientes: clientes as unknown as Cliente[],
      minas: minas as unknown as Mina[],
      servicios: servicios as unknown as Servicio[],
      preciosCliente: preciosCliente as unknown as PrecioCliente[],
      empleados: empleados as unknown as Empleado[],
      equipos: equipos as unknown as EquipoVehiculo[],
      conduces: conduces as unknown as Conduce[],
      gasoilConfig: (gasoilConfigRows[0] as unknown as ConfiguracionGasoil) || {
        capacidadTanquePrincipal: 0,
        nivelActual: 0,
        alertaNivelMinimo: 0,
        precioPorGalonDefecto: 0,
      },
      gasoilCompras: gasoilCompras as unknown as CompraGasoil[],
      gasoilDespachos: gasoilDespachos as unknown as DespachoGasoil[],
      gasoilConteos: gasoilConteos as unknown as ConteoGasoil[],
    };
  },

  async migrateFromLocalStorage(data: any): Promise<FullInitialState> {
    if (!data) return this.getFullInitialState();
    if (Array.isArray(data.clientes)) {
      for (const c of data.clientes) await this.saveCliente(c);
    }
    if (Array.isArray(data.minas)) {
      for (const m of data.minas) await this.saveMina(m);
    }
    if (Array.isArray(data.servicios)) {
      for (const s of data.servicios) await this.saveServicio(s);
    }
    if (Array.isArray(data.empleados)) {
      for (const e of data.empleados) await this.saveEmpleado(e);
    }
    if (Array.isArray(data.equipos)) {
      for (const eq of data.equipos) await this.saveEquipoVehiculo(eq);
    }
    if (Array.isArray(data.preciosCliente)) {
      for (const p of data.preciosCliente) await this.savePrecioCliente(p);
    }
    if (Array.isArray(data.conduces)) {
      for (const c of data.conduces) await this.saveConduce(c);
    }
    if (data.gasoilConfig) await this.saveConfiguracionGasoil(data.gasoilConfig);
    if (Array.isArray(data.gasoilCompras)) {
      for (const c of data.gasoilCompras) await this.saveCompraGasoil(c);
    }
    if (Array.isArray(data.gasoilDespachos)) {
      for (const d of data.gasoilDespachos) await this.saveDespachoGasoil(d);
    }
    if (Array.isArray(data.gasoilConteos)) {
      for (const c of data.gasoilConteos) await this.saveConteoGasoil(c);
    }
    return this.getFullInitialState();
  },

  // --- Clientes ---
  async getClientes(): Promise<Cliente[]> {
    return (await db.select().from(schema.clientes)) as unknown as Cliente[];
  },

  async saveCliente(cliente: Partial<Cliente>): Promise<Cliente> {
    if (cliente.id) {
      const [updated] = await db
        .update(schema.clientes)
        .set({
          nombre: cliente.nombre,
          rnc: cliente.rnc,
          telefono: cliente.telefono,
          email: cliente.email,
          direccion: cliente.direccion,
          contacto: cliente.contacto,
          estado: cliente.estado,
        })
        .where(eq(schema.clientes.id, cliente.id))
        .returning();
      if (updated) return updated as unknown as Cliente;
    }
    const [created] = await db
      .insert(schema.clientes)
      .values({
        id: cliente.id || genId('cli'),
        nombre: cliente.nombre || 'Nuevo Cliente',
        rnc: cliente.rnc || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        contacto: cliente.contacto || '',
        estado: cliente.estado || 'Activo',
      })
      .returning();
    return created as unknown as Cliente;
  },

  async deleteCliente(id: string): Promise<boolean> {
    await db.delete(schema.preciosCliente).where(eq(schema.preciosCliente.clienteId, id));
    await db.delete(schema.clientes).where(eq(schema.clientes.id, id));
    return true;
  },

  // --- Minas ---
  async getMinas(): Promise<Mina[]> {
    return (await db.select().from(schema.minas)) as unknown as Mina[];
  },

  async saveMina(mina: Partial<Mina>): Promise<Mina> {
    if (mina.id) {
      const [updated] = await db
        .update(schema.minas)
        .set({
          nombre: mina.nombre,
          ubicacion: mina.ubicacion,
          contacto: mina.contacto,
          telefono: mina.telefono,
          estado: mina.estado,
        })
        .where(eq(schema.minas.id, mina.id))
        .returning();
      if (updated) return updated as unknown as Mina;
    }
    const [created] = await db
      .insert(schema.minas)
      .values({
        id: mina.id || genId('mina'),
        nombre: mina.nombre || 'Nueva Mina',
        ubicacion: mina.ubicacion || '',
        contacto: mina.contacto || '',
        telefono: mina.telefono || '',
        estado: mina.estado || 'Activo',
      })
      .returning();
    return created as unknown as Mina;
  },

  async deleteMina(id: string): Promise<boolean> {
    await db.delete(schema.minas).where(eq(schema.minas.id, id));
    return true;
  },

  // --- Servicios ---
  async getServicios(): Promise<Servicio[]> {
    return (await db.select().from(schema.servicios)) as unknown as Servicio[];
  },

  async saveServicio(servicio: Partial<Servicio>): Promise<Servicio> {
    if (servicio.id) {
      const [updated] = await db
        .update(schema.servicios)
        .set({
          codigo: servicio.codigo,
          descripcion: servicio.descripcion,
          unidadMedida: servicio.unidadMedida,
          precioBase: servicio.precioBase !== undefined ? Number(servicio.precioBase) : undefined,
          categoria: servicio.categoria,
          estado: servicio.estado,
        })
        .where(eq(schema.servicios.id, servicio.id))
        .returning();
      if (updated) return updated as unknown as Servicio;
    }
    const [created] = await db
      .insert(schema.servicios)
      .values({
        id: servicio.id || genId('srv'),
        codigo: servicio.codigo || 'SRV-' + Math.floor(100 + Math.random() * 900),
        descripcion: servicio.descripcion || 'Nuevo Servicio',
        unidadMedida: servicio.unidadMedida || 'm3',
        precioBase: Number(servicio.precioBase) || 0,
        categoria: servicio.categoria || 'Otro',
        estado: servicio.estado || 'Activo',
      })
      .returning();
    return created as unknown as Servicio;
  },

  async deleteServicio(id: string): Promise<boolean> {
    await db.delete(schema.preciosCliente).where(eq(schema.preciosCliente.servicioId, id));
    await db.delete(schema.servicios).where(eq(schema.servicios.id, id));
    return true;
  },

  // --- Precios Cliente ---
  async getPreciosCliente(): Promise<PrecioCliente[]> {
    return (await db.select().from(schema.preciosCliente)) as unknown as PrecioCliente[];
  },

  async savePrecioCliente(precio: Partial<PrecioCliente>): Promise<PrecioCliente> {
    if (precio.id) {
      const [updated] = await db
        .update(schema.preciosCliente)
        .set({
          clienteId: precio.clienteId,
          servicioId: precio.servicioId,
          precioEspecial: precio.precioEspecial !== undefined ? Number(precio.precioEspecial) : undefined,
          notas: precio.notas,
        })
        .where(eq(schema.preciosCliente.id, precio.id))
        .returning();
      if (updated) return updated as unknown as PrecioCliente;
    }
    const [created] = await db
      .insert(schema.preciosCliente)
      .values({
        id: precio.id || genId('pc'),
        clienteId: precio.clienteId || '',
        servicioId: precio.servicioId || '',
        precioEspecial: Number(precio.precioEspecial) || 0,
        notas: precio.notas || '',
      })
      .returning();
    return created as unknown as PrecioCliente;
  },

  async deletePrecioCliente(id: string): Promise<boolean> {
    await db.delete(schema.preciosCliente).where(eq(schema.preciosCliente.id, id));
    return true;
  },

  // --- Empleados ---
  async getEmpleados(): Promise<Empleado[]> {
    return (await db.select().from(schema.empleados)) as unknown as Empleado[];
  },

  async saveEmpleado(empleado: Partial<Empleado>): Promise<Empleado> {
    if (empleado.id) {
      const [updated] = await db
        .update(schema.empleados)
        .set({
          codigo: empleado.codigo,
          nombre: empleado.nombre,
          cedula: empleado.cedula,
          telefono: empleado.telefono,
          cargo: empleado.cargo,
          salarioBase: empleado.salarioBase !== undefined ? Number(empleado.salarioBase) : undefined,
          pagoPorViaje: empleado.pagoPorViaje !== undefined ? Number(empleado.pagoPorViaje) : undefined,
          pagoPorMetro: empleado.pagoPorMetro !== undefined ? Number(empleado.pagoPorMetro) : undefined,
          pagoPorHora: empleado.pagoPorHora !== undefined ? Number(empleado.pagoPorHora) : undefined,
          estado: empleado.estado,
        })
        .where(eq(schema.empleados.id, empleado.id))
        .returning();
      if (updated) return updated as unknown as Empleado;
    }
    const [created] = await db
      .insert(schema.empleados)
      .values({
        id: empleado.id || genId('emp'),
        codigo: empleado.codigo || 'EMP-' + Math.floor(10 + Math.random() * 90),
        nombre: empleado.nombre || 'Nuevo Empleado',
        cedula: empleado.cedula || '',
        telefono: empleado.telefono || '',
        cargo: empleado.cargo || 'Chofer de Camión',
        salarioBase: Number(empleado.salarioBase) || 0,
        pagoPorViaje: Number(empleado.pagoPorViaje) || 0,
        pagoPorMetro: Number(empleado.pagoPorMetro) || 0,
        pagoPorHora: Number(empleado.pagoPorHora) || 0,
        estado: empleado.estado || 'Activo',
      })
      .returning();
    return created as unknown as Empleado;
  },

  async deleteEmpleado(id: string): Promise<boolean> {
    await db.delete(schema.empleados).where(eq(schema.empleados.id, id));
    return true;
  },

  // --- Equipos y Vehículos ---
  async getEquiposVehiculos(): Promise<EquipoVehiculo[]> {
    return (await db.select().from(schema.equipos)) as unknown as EquipoVehiculo[];
  },

  async saveEquipoVehiculo(equipo: Partial<EquipoVehiculo>): Promise<EquipoVehiculo> {
    if (equipo.id) {
      const [updated] = await db
        .update(schema.equipos)
        .set({
          codigo: equipo.codigo,
          ficha: equipo.ficha,
          tipo: equipo.tipo,
          marca: equipo.marca,
          modelo: equipo.modelo,
          placa: equipo.placa,
          ano: equipo.ano !== undefined ? Number(equipo.ano) : undefined,
          capacidadM3: equipo.capacidadM3 !== undefined ? Number(equipo.capacidadM3) : undefined,
          estado: equipo.estado,
          consumoPromedioGasoil:
            equipo.consumoPromedioGasoil !== undefined ? Number(equipo.consumoPromedioGasoil) : undefined,
          ultimoHorometro: equipo.ultimoHorometro !== undefined ? Number(equipo.ultimoHorometro) : undefined,
          ultimoOdometro: equipo.ultimoOdometro !== undefined ? Number(equipo.ultimoOdometro) : undefined,
        })
        .where(eq(schema.equipos.id, equipo.id))
        .returning();
      if (updated) return updated as unknown as EquipoVehiculo;
    }
    const [created] = await db
      .insert(schema.equipos)
      .values({
        id: equipo.id || genId('eq'),
        codigo: equipo.codigo || 'EQ-' + Math.floor(10 + Math.random() * 90),
        ficha: equipo.ficha || equipo.codigo || 'Ficha Nueva',
        tipo: equipo.tipo || 'Camión Volteo',
        marca: equipo.marca || '',
        modelo: equipo.modelo || '',
        placa: equipo.placa || '',
        ano: equipo.ano ? Number(equipo.ano) : new Date().getFullYear(),
        capacidadM3: Number(equipo.capacidadM3) || 0,
        estado: equipo.estado || 'Operativo',
        consumoPromedioGasoil: Number(equipo.consumoPromedioGasoil) || 0,
        ultimoHorometro: Number(equipo.ultimoHorometro) || 0,
        ultimoOdometro: Number(equipo.ultimoOdometro) || 0,
      })
      .returning();
    return created as unknown as EquipoVehiculo;
  },

  async deleteEquipoVehiculo(id: string): Promise<boolean> {
    await db.delete(schema.equipos).where(eq(schema.equipos.id, id));
    return true;
  },

  // --- Conduces ---
  async getConduces(): Promise<Conduce[]> {
    return (await db
      .select()
      .from(schema.conduces)
      .orderBy(sql`${schema.conduces.creadoEn} DESC NULLS LAST`)) as unknown as Conduce[];
  },

  async saveConduce(input: Partial<Conduce>): Promise<Conduce> {
    // Si es una actualización, se parte del registro existente para que los campos no
    // enviados conserven su valor actual en vez de perderse (evita corromper datos).
    let conduce: Partial<Conduce> = input;
    if (input.id) {
      const [existing] = await db.select().from(schema.conduces).where(eq(schema.conduces.id, input.id));
      if (existing) {
        conduce = { ...(existing as unknown as Conduce), ...input };
      }
    }

    // Snapshot de datos del equipo (placa, capacidad) al momento del registro, evitando pedirlos dos veces.
    let placa = conduce.placa;
    let capacidadCamion = conduce.capacidadCamion;
    if (conduce.equipoId && (placa === undefined || capacidadCamion === undefined)) {
      const [equipo] = await db.select().from(schema.equipos).where(eq(schema.equipos.id, conduce.equipoId));
      if (equipo) {
        if (placa === undefined) placa = (equipo as any).placa;
        if (capacidadCamion === undefined) capacidadCamion = (equipo as any).capacidadM3;
      }
    }

    const cantidad = Number(conduce.cantidad) || 0;
    const precioUnitario = Number(conduce.precioUnitario) || 0;
    const totalMonto = conduce.totalMonto !== undefined ? Number(conduce.totalMonto) : cantidad * precioUnitario;

    const commonValues = {
      numeroConduce:
        conduce.numeroConduce || `CON-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      tipoConduce: conduce.tipoConduce || 'MATERIAL',
      fecha: conduce.fecha || new Date().toISOString().split('T')[0],
      hora: conduce.hora || new Date().toTimeString().substring(0, 5),
      clienteId: conduce.clienteId || '',
      clienteNombre: conduce.clienteNombre || 'Cliente General',
      obra: conduce.obra || '',
      servicioId: conduce.servicioId || null,
      servicioDescripcion: conduce.servicioDescripcion || conduce.material || null,
      cantidad,
      unidadMedida: conduce.unidadMedida || 'm3',
      precioUnitario,
      totalMonto,
      choferId: conduce.choferId || null,
      choferNombre: conduce.choferNombre || null,
      equipoId: conduce.equipoId || null,
      equipoFicha: conduce.equipoFicha || null,
      bombaId: conduce.bombaId || null,
      bombaFicha: conduce.bombaFicha || null,
      minaId: conduce.minaId || null,
      minaNombre: conduce.minaNombre || null,
      placa: placa || null,
      turnoHorario: conduce.turnoHorario || null,
      horaInicio: conduce.horaInicio || null,
      horaFin: conduce.horaFin || null,
      horasTrabajadas: conduce.horasTrabajadas !== undefined ? Number(conduce.horasTrabajadas) : null,
      horometroInicial: conduce.horometroInicial !== undefined ? Number(conduce.horometroInicial) : null,
      horometroFinal: conduce.horometroFinal !== undefined ? Number(conduce.horometroFinal) : null,
      viajes: conduce.viajes !== undefined ? Number(conduce.viajes) : null,
      capacidadCamion: capacidadCamion !== undefined ? Number(capacidadCamion) : null,
      material: conduce.material || conduce.servicioDescripcion || null,
      rnc: conduce.rnc || null,
      sellado: conduce.sellado ?? true,
      estadoFacturacion: conduce.estadoFacturacion || 'Pendiente',
      numeroFactura: conduce.numeroFactura || null,
      fechaFacturacion: conduce.fechaFacturacion || null,
      comentarios: conduce.comentarios || null,
    };

    if (conduce.id) {
      const [updated] = await db
        .update(schema.conduces)
        .set(commonValues)
        .where(eq(schema.conduces.id, conduce.id))
        .returning();
      if (updated) return updated as unknown as Conduce;
    }

    const [created] = await db
      .insert(schema.conduces)
      .values({ id: conduce.id || genId('cnd'), ...commonValues })
      .returning();
    return created as unknown as Conduce;
  },

  async updateEstadoFacturacion(id: string, estado: 'Pendiente' | 'Facturado' | 'Anulado' | 'Proforma'): Promise<boolean> {
    const [current] = await db.select().from(schema.conduces).where(eq(schema.conduces.id, id));
    if (!current) return false;
    await db
      .update(schema.conduces)
      .set({
        estadoFacturacion: estado,
        fechaFacturacion:
          estado === 'Facturado' && !current.fechaFacturacion
            ? new Date().toISOString().split('T')[0]
            : current.fechaFacturacion,
      })
      .where(eq(schema.conduces.id, id));
    return true;
  },

  async deleteConduce(id: string): Promise<boolean> {
    await db.delete(schema.conduces).where(eq(schema.conduces.id, id));
    return true;
  },

  // --- Gasoil ---
  async getConfiguracionGasoil(): Promise<ConfiguracionGasoil> {
    const [config] = await db.select().from(schema.gasoilConfig);
    return (config as unknown as ConfiguracionGasoil) || {
      capacidadTanquePrincipal: 0,
      nivelActual: 0,
      alertaNivelMinimo: 0,
      precioPorGalonDefecto: 0,
      precioCostoGalon: 0,
    };
  },

  async saveConfiguracionGasoil(config: Partial<ConfiguracionGasoil>): Promise<ConfiguracionGasoil> {
    const [existing] = await db.select().from(schema.gasoilConfig);
    const values = {
      capacidadTanquePrincipal:
        config.capacidadTanquePrincipal !== undefined
          ? Number(config.capacidadTanquePrincipal)
          : existing?.capacidadTanquePrincipal || 0,
      nivelActual: config.nivelActual !== undefined ? Number(config.nivelActual) : existing?.nivelActual || 0,
      alertaNivelMinimo:
        config.alertaNivelMinimo !== undefined ? Number(config.alertaNivelMinimo) : existing?.alertaNivelMinimo || 0,
      precioPorGalonDefecto:
        config.precioPorGalonDefecto !== undefined
          ? Number(config.precioPorGalonDefecto)
          : existing?.precioPorGalonDefecto || 0,
      precioCostoGalon:
        config.precioCostoGalon !== undefined
          ? Number(config.precioCostoGalon)
          : existing?.precioCostoGalon ?? existing?.precioPorGalonDefecto ?? 0,
    };
    if (existing) {
      const [updated] = await db
        .update(schema.gasoilConfig)
        .set(values)
        .where(eq(schema.gasoilConfig.id, existing.id))
        .returning();
      return updated as unknown as ConfiguracionGasoil;
    }
    const [created] = await db
      .insert(schema.gasoilConfig)
      .values({ id: 'main_tank', ...values })
      .returning();
    return created as unknown as ConfiguracionGasoil;
  },

  async getComprasGasoil(): Promise<CompraGasoil[]> {
    return (await db
      .select()
      .from(schema.gasoilCompras)
      .orderBy(sql`${schema.gasoilCompras.fecha} DESC`)) as unknown as CompraGasoil[];
  },

  async saveCompraGasoil(compra: Partial<CompraGasoil>): Promise<CompraGasoil> {
    const config = await this.getConfiguracionGasoil();
    const galones = Number(compra.galones) || 0;
    const precioPorGalon = Number(compra.precioPorGalon) || config.precioCostoGalon || config.precioPorGalonDefecto;
    const total = compra.total !== undefined ? Number(compra.total) : galones * precioPorGalon;

    const [created] = await db
      .insert(schema.gasoilCompras)
      .values({
        id: compra.id || genId('gcom'),
        fecha: compra.fecha || new Date().toISOString().split('T')[0],
        proveedor: compra.proveedor || 'Distribuidora',
        numeroFactura: compra.numeroFactura || '',
        galones,
        precioPorGalon,
        total,
        recibidoPor: compra.recibidoPor || 'Encargado de Patio',
        notas: compra.notas || '',
      })
      .returning();

    await this.saveConfiguracionGasoil({
      nivelActual: Math.min(config.capacidadTanquePrincipal, config.nivelActual + galones),
    });

    return created as unknown as CompraGasoil;
  },

  async deleteCompraGasoil(id: string): Promise<boolean> {
    const [item] = await db.select().from(schema.gasoilCompras).where(eq(schema.gasoilCompras.id, id));
    if (item) {
      const config = await this.getConfiguracionGasoil();
      await this.saveConfiguracionGasoil({ nivelActual: Math.max(0, config.nivelActual - Number(item.galones)) });
    }
    await db.delete(schema.gasoilCompras).where(eq(schema.gasoilCompras.id, id));
    return true;
  },

  async getDespachosGasoil(): Promise<DespachoGasoil[]> {
    return (await db
      .select()
      .from(schema.gasoilDespachos)
      .orderBy(sql`${schema.gasoilDespachos.fecha} DESC`)) as unknown as DespachoGasoil[];
  },

  async saveDespachoGasoil(despacho: Partial<DespachoGasoil>): Promise<DespachoGasoil> {
    const galones = Number(despacho.galones) || 0;

    const [created] = await db
      .insert(schema.gasoilDespachos)
      .values({
        id: despacho.id || genId('gdes'),
        fecha: despacho.fecha || new Date().toISOString().split('T')[0],
        hora: despacho.hora || new Date().toTimeString().substring(0, 5),
        equipoId: despacho.equipoId || null,
        equipoFicha: despacho.equipoFicha || 'Equipo',
        empleadoId: despacho.empleadoId || null,
        empleadoNombre: despacho.empleadoNombre || '',
        galones,
        horometroKm: Number(despacho.horometroKm) || 0,
        conduceId: despacho.conduceId || null,
        notas: despacho.notas || '',
      })
      .returning();

    const config = await this.getConfiguracionGasoil();
    await this.saveConfiguracionGasoil({ nivelActual: Math.max(0, config.nivelActual - galones) });

    return created as unknown as DespachoGasoil;
  },

  async deleteDespachoGasoil(id: string): Promise<boolean> {
    const [item] = await db.select().from(schema.gasoilDespachos).where(eq(schema.gasoilDespachos.id, id));
    if (item) {
      const config = await this.getConfiguracionGasoil();
      await this.saveConfiguracionGasoil({
        nivelActual: Math.min(config.capacidadTanquePrincipal, config.nivelActual + Number(item.galones)),
      });
    }
    await db.delete(schema.gasoilDespachos).where(eq(schema.gasoilDespachos.id, id));
    return true;
  },

  async getConteosGasoil(): Promise<ConteoGasoil[]> {
    return (await db
      .select()
      .from(schema.gasoilConteos)
      .orderBy(sql`${schema.gasoilConteos.fecha} DESC`)) as unknown as ConteoGasoil[];
  },

  async saveConteoGasoil(conteo: Partial<ConteoGasoil>): Promise<ConteoGasoil> {
    const config = await this.getConfiguracionGasoil();
    const galonesMedidos = Number(conteo.galonesMedidos) || 0;
    const galonesSistema = Number(conteo.galonesSistema) || config.nivelActual;
    const diferencia = galonesMedidos - galonesSistema;

    const [created] = await db
      .insert(schema.gasoilConteos)
      .values({
        id: conteo.id || genId('gcnt'),
        fecha: conteo.fecha || new Date().toISOString().split('T')[0],
        hora: conteo.hora || new Date().toTimeString().substring(0, 5),
        galonesMedidos,
        galonesSistema,
        diferencia,
        responsable: conteo.responsable || 'Supervisor',
        observacion: conteo.observacion || '',
      })
      .returning();

    // Ajusta el nivel del tanque a la medición física real (fuente de verdad tras el conteo).
    await this.saveConfiguracionGasoil({ nivelActual: galonesMedidos });

    return created as unknown as ConteoGasoil;
  },

  async deleteConteoGasoil(id: string): Promise<boolean> {
    await db.delete(schema.gasoilConteos).where(eq(schema.gasoilConteos.id, id));
    return true;
  },

  async isEmpty(): Promise<boolean> {
    const [row] = await db.select({ id: schema.clientes.id }).from(schema.clientes).limit(1);
    return !row;
  },

  async truncateAll(): Promise<void> {
    await db.execute(sql`TRUNCATE TABLE gasoil_despachos, gasoil_compras, gasoil_conteos, conduces, precios_cliente, equipos, empleados, servicios, minas, clientes, gasoil_config RESTART IDENTITY CASCADE`);
  },
};
