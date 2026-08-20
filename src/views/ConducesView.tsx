import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Conduce, TipoConduce } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import {
  Search,
  Plus,
  Printer,
  Download,
  Trash2,
  Edit,
  FileSpreadsheet,
  Truck,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, getTodayString, getCurrentTimeString } from '../utils/formatters.ts';
import { exportSingleConducePDF, exportConducesListPDF } from '../utils/pdfExport.ts';
import { exportConducesToExcel } from '../utils/excelExport.ts';

interface ConducesViewProps {
  onViewConduce: (conduce: Conduce) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  createPresetTipo?: TipoConduce | null;
}

const TURNOS = ['Mañana', 'Tarde', 'Noche'] as const;

function calcularHoras(horaInicio: string, horaFin: string, turno: string): number | null {
  if (!horaInicio || !horaFin) return null;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
  let minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutos <= 0) {
    if (turno === 'Noche') {
      minutos += 24 * 60; // el turno noche puede cruzar medianoche
    } else {
      return null; // inconsistente: la hora final debe ser posterior a la inicial
    }
  }
  return Math.round((minutos / 60) * 100) / 100;
}

export const ConducesView: React.FC<ConducesViewProps> = ({
  onViewConduce,
  isCreateOpen,
  setIsCreateOpen,
  createPresetTipo,
}) => {
  const {
    conduces,
    clientes,
    minas,
    servicios,
    empleados,
    equipos,
    getPrecioParaClienteYServicio,
    saveConduce,
    updateEstadoFacturacion,
    deleteConduce,
  } = useApp();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'ALL' | TipoConduce>('ALL');
  const [filterCliente, setFilterCliente] = useState('ALL');
  const [filterEstado, setFilterEstado] = useState('ALL');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [filterProyecto, setFilterProyecto] = useState('ALL');
  const [filterChofer, setFilterChofer] = useState('ALL');

  // Editing state
  const [editingConduce, setEditingConduce] = useState<Conduce | null>(null);

  // Paso 0: selección de tipo de conduce (solo al crear uno nuevo)
  const [formTipoConduce, setFormTipoConduce] = useState<TipoConduce | null>(null);

  // Campos comunes
  const [formFecha, setFormFecha] = useState(getTodayString());
  const [formHora, setFormHora] = useState(getCurrentTimeString());
  const [formClienteId, setFormClienteId] = useState('');
  const [formObra, setFormObra] = useState('');
  const [formMinaId, setFormMinaId] = useState('');
  const [formServicioId, setFormServicioId] = useState('');
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<string>('');
  const [formChoferId, setFormChoferId] = useState('');
  const [formEquipoId, setFormEquipoId] = useState('');
  const [formEstadoFacturacion, setFormEstadoFacturacion] = useState<'Pendiente' | 'Facturado' | 'Anulado' | 'Proforma'>('Pendiente');
  const [formNumeroFactura, setFormNumeroFactura] = useState('');
  const [formSellado, setFormSellado] = useState(true);
  const [formComentarios, setFormComentarios] = useState('');

  // Conduce de Equipos Pesados (por horas)
  const [formTurno, setFormTurno] = useState<string>('Mañana');
  const [formHoraInicio, setFormHoraInicio] = useState<string>('07:00');
  const [formHoraFin, setFormHoraFin] = useState<string>('15:00');
  const [formHorasTrabajadas, setFormHorasTrabajadas] = useState<string>('');
  const [formHorometroInicial, setFormHorometroInicial] = useState<string>('');
  const [formHorometroFinal, setFormHorometroFinal] = useState<string>('');

  // Conduce de Materiales / Volteo
  const [formCapacidadCamion, setFormCapacidadCamion] = useState<string>('');
  const [formViajes, setFormViajes] = useState<string>('');
  const [formCantidadM3, setFormCantidadM3] = useState<string>('');

  const servicioSeleccionado = servicios.find((s) => s.id === formServicioId);
  const materialUnidad = (servicioSeleccionado?.unidadMedida || '').toUpperCase();

  // Al abrir para crear, si viene un tipo predefinido (acceso rápido) lo aplicamos directamente.
  useEffect(() => {
    if (isCreateOpen && !editingConduce) {
      setFormTipoConduce(createPresetTipo || null);
      if (createPresetTipo === 'MATERIAL') setFormViajes('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateOpen]);

  const handleClienteChange = (clienteId: string) => {
    setFormClienteId(clienteId);
    if (clienteId && formServicioId) {
      const price = getPrecioParaClienteYServicio(clienteId, formServicioId);
      if (price > 0) setFormPrecioUnitario(String(price));
    }
  };

  const handleServicioChange = (servicioId: string) => {
    setFormServicioId(servicioId);
    const srv = servicios.find((s) => s.id === servicioId);
    if (srv) {
      const price = formClienteId ? getPrecioParaClienteYServicio(formClienteId, servicioId) : 0;
      setFormPrecioUnitario(price > 0 ? String(price) : String(srv.precioBase || ''));
    }
  };

  const handleEquipoChange = (equipoId: string) => {
    setFormEquipoId(equipoId);
    const eq = equipos.find((e) => e.id === equipoId);
    if (eq && eq.capacidadM3) {
      setFormCapacidadCamion(String(eq.capacidadM3));
    }
  };

  const resetForm = () => {
    setEditingConduce(null);
    setFormTipoConduce(null);
    setFormFecha(getTodayString());
    setFormHora(getCurrentTimeString());
    setFormClienteId('');
    setFormObra('');
    setFormMinaId('');
    setFormServicioId('');
    setFormPrecioUnitario('');
    setFormChoferId('');
    setFormEquipoId('');
    setFormEstadoFacturacion('Pendiente');
    setFormNumeroFactura('');
    setFormSellado(true);
    setFormComentarios('');
    setFormTurno('Mañana');
    setFormHoraInicio('07:00');
    setFormHoraFin('15:00');
    setFormHorasTrabajadas('');
    setFormHorometroInicial('');
    setFormHorometroFinal('');
    setFormCapacidadCamion('');
    setFormViajes('');
    setFormCantidadM3('');
  };

  const handleOpenEdit = (conduce: Conduce) => {
    setEditingConduce(conduce);
    setFormTipoConduce(conduce.tipoConduce || 'MATERIAL');
    setFormFecha(conduce.fecha);
    setFormHora(conduce.hora || getCurrentTimeString());
    setFormClienteId(conduce.clienteId);
    setFormObra(conduce.obra || conduce.proyectoMina || '');
    setFormMinaId(conduce.minaId || '');
    setFormServicioId(conduce.servicioId || '');
    setFormPrecioUnitario(String(conduce.precioUnitario));
    setFormChoferId(conduce.choferId || '');
    setFormEquipoId(conduce.equipoId || '');
    setFormEstadoFacturacion(conduce.estadoFacturacion);
    setFormNumeroFactura(conduce.numeroFactura || '');
    setFormSellado(conduce.sellado);
    setFormComentarios(conduce.comentarios || '');
    setFormTurno(conduce.turnoHorario || 'Mañana');
    setFormHoraInicio(conduce.horaInicio || '07:00');
    setFormHoraFin(conduce.horaFin || '15:00');
    setFormHorasTrabajadas(conduce.horasTrabajadas ? String(conduce.horasTrabajadas) : String(conduce.cantidad || ''));
    setFormHorometroInicial(conduce.horometroInicial ? String(conduce.horometroInicial) : '');
    setFormHorometroFinal(conduce.horometroFinal ? String(conduce.horometroFinal) : '');
    setFormCapacidadCamion(conduce.capacidadCamion ? String(conduce.capacidadCamion) : '');
    setFormViajes(conduce.viajes ? String(conduce.viajes) : '');
    setFormCantidadM3(String(conduce.cantidad || ''));
    setIsCreateOpen(true);
  };

  // Recalcula horas trabajadas automáticamente cuando cambian hora inicio/fin/turno
  useEffect(() => {
    if (formTipoConduce !== 'EQUIPO') return;
    const horas = calcularHoras(formHoraInicio, formHoraFin, formTurno);
    if (horas !== null) setFormHorasTrabajadas(String(horas));
  }, [formHoraInicio, formHoraFin, formTurno, formTipoConduce]);

  // Recalcula m3 automáticamente cuando cambian capacidad/viajes (solo si el servicio cobra por m3)
  useEffect(() => {
    if (formTipoConduce !== 'MATERIAL' || materialUnidad !== 'M3') return;
    const cap = Number(formCapacidadCamion);
    const v = Number(formViajes);
    if (cap > 0 && v > 0) setFormCantidadM3(String(cap * v));
  }, [formCapacidadCamion, formViajes, formTipoConduce, materialUnidad]);

  const handleSaveConduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTipoConduce) {
      alert('Seleccione el tipo de conduce.');
      return;
    }
    if (!formClienteId || !formServicioId || !formObra.trim()) {
      alert('Por favor complete cliente, proyecto/ubicación y servicio.');
      return;
    }

    const precioNum = Number(formPrecioUnitario);
    if (isNaN(precioNum) || precioNum < 0) {
      alert('Por favor introduzca un precio unitario válido.');
      return;
    }

    const clienteObj = clientes.find((c) => c.id === formClienteId);
    const servicioObj = servicios.find((s) => s.id === formServicioId);
    const choferObj = empleados.find((e) => e.id === formChoferId);
    const equipoObj = equipos.find((eq) => eq.id === formEquipoId);
    const minaObj = minas.find((m) => m.id === formMinaId);

    let cantidad = 0;
    let unidadMedida = servicioObj?.unidadMedida || '';
    const payloadExtra: Partial<Conduce> = {};

    if (formTipoConduce === 'EQUIPO') {
      const horas = calcularHoras(formHoraInicio, formHoraFin, formTurno);
      if (horas === null || horas <= 0) {
        alert('La hora final debe ser posterior a la hora inicial (o marque turno Noche si cruza medianoche).');
        return;
      }
      if (!formChoferId) {
        alert('Seleccione el operador del equipo.');
        return;
      }
      cantidad = horas;
      unidadMedida = 'HORA';
      payloadExtra.turnoHorario = formTurno;
      payloadExtra.horaInicio = formHoraInicio;
      payloadExtra.horaFin = formHoraFin;
      payloadExtra.horasTrabajadas = horas;
      if (formHorometroInicial) payloadExtra.horometroInicial = Number(formHorometroInicial);
      if (formHorometroFinal) payloadExtra.horometroFinal = Number(formHorometroFinal);
      if (formHorometroInicial && formHorometroFinal && Number(formHorometroFinal) < Number(formHorometroInicial)) {
        alert('El horómetro final no puede ser menor que el horómetro inicial.');
        return;
      }
    } else {
      const viajes = Number(formViajes);
      if (isNaN(viajes) || viajes <= 0) {
        alert('Indique una cantidad de viajes válida (mayor a 0).');
        return;
      }
      if (!formChoferId) {
        alert('Seleccione el chofer del camión.');
        return;
      }
      if (!formMinaId) {
        alert('Seleccione la mina de origen del material.');
        return;
      }
      if (materialUnidad === 'M3') {
        const cap = Number(formCapacidadCamion);
        const m3 = Number(formCantidadM3);
        if (isNaN(cap) || cap <= 0) {
          alert('Indique la capacidad del camión en m³.');
          return;
        }
        if (isNaN(m3) || m3 <= 0) {
          alert('Indique los metros cúbicos totales transportados.');
          return;
        }
        if (m3 > viajes * cap * 1.05) {
          alert('Los metros cúbicos registrados exceden lo que estos viajes pueden transportar según la capacidad del camión. Revise los datos.');
          return;
        }
        cantidad = m3;
        unidadMedida = 'm3';
        payloadExtra.capacidadCamion = cap;
        payloadExtra.viajes = viajes;
      } else {
        cantidad = viajes;
        unidadMedida = servicioObj?.unidadMedida || 'VIAJE';
        payloadExtra.viajes = viajes;
      }
    }

    const payload: Partial<Conduce> = {
      id: editingConduce ? editingConduce.id : undefined,
      numeroConduce: editingConduce ? editingConduce.numeroConduce : undefined,
      tipoConduce: formTipoConduce,
      fecha: formFecha,
      hora: formHora,
      clienteId: formClienteId,
      clienteNombre: clienteObj?.nombre || 'Cliente General',
      rnc: clienteObj?.rnc || '',
      obra: formObra.trim(),
      minaId: formTipoConduce === 'MATERIAL' ? formMinaId || undefined : undefined,
      minaNombre: formTipoConduce === 'MATERIAL' ? minaObj?.nombre || undefined : undefined,
      servicioId: formServicioId,
      servicioDescripcion: servicioObj?.descripcion || 'Servicio General',
      cantidad,
      unidadMedida,
      precioUnitario: precioNum,
      totalMonto: cantidad * precioNum,
      choferId: formChoferId,
      choferNombre: choferObj?.nombre || '',
      equipoId: formEquipoId || undefined,
      equipoFicha: equipoObj?.ficha || '',
      placa: equipoObj?.placa || '',
      sellado: formSellado,
      estadoFacturacion: formEstadoFacturacion,
      numeroFactura: formNumeroFactura,
      comentarios: formComentarios,
      ...payloadExtra,
    };

    await saveConduce(payload);
    setIsCreateOpen(false);
    resetForm();
  };

  const uniqueProyectos = useMemo(() => {
    const set = new Set<string>();
    conduces.forEach((c) => c.obra && set.add(c.obra.trim()));
    return Array.from(set).sort();
  }, [conduces]);

  const filteredConduces = useMemo(() => {
    return conduces.filter((c) => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches =
          c.numeroConduce.toLowerCase().includes(query) ||
          c.clienteNombre.toLowerCase().includes(query) ||
          c.obra.toLowerCase().includes(query) ||
          (c.servicioDescripcion && c.servicioDescripcion.toLowerCase().includes(query)) ||
          (c.choferNombre && c.choferNombre.toLowerCase().includes(query)) ||
          (c.equipoFicha && c.equipoFicha.toLowerCase().includes(query)) ||
          (c.placa && c.placa.toLowerCase().includes(query)) ||
          (c.material && c.material.toLowerCase().includes(query));
        if (!matches) return false;
      }
      if (filterTipo !== 'ALL' && c.tipoConduce !== filterTipo) return false;
      if (filterCliente !== 'ALL' && c.clienteId !== filterCliente) return false;
      if (filterProyecto !== 'ALL' && c.obra !== filterProyecto) return false;
      if (filterChofer !== 'ALL' && c.choferId !== filterChofer) return false;
      if (filterEstado !== 'ALL' && c.estadoFacturacion !== filterEstado) return false;
      if (filterFechaInicio && c.fecha < filterFechaInicio) return false;
      if (filterFechaFin && c.fecha > filterFechaFin) return false;
      return true;
    });
  }, [conduces, searchTerm, filterTipo, filterCliente, filterProyecto, filterChofer, filterEstado, filterFechaInicio, filterFechaFin]);

  const totalFiltradoMonto = filteredConduces.reduce((sum, c) => sum + Number(c.totalMonto || 0), 0);
  const totalHoras = filteredConduces
    .filter((c) => c.tipoConduce === 'EQUIPO')
    .reduce((sum, c) => sum + Number(c.horasTrabajadas || c.cantidad || 0), 0);
  const totalViajes = filteredConduces
    .filter((c) => c.tipoConduce === 'MATERIAL')
    .reduce((sum, c) => sum + Number(c.viajes || 0), 0);
  const totalMetros = filteredConduces
    .filter((c) => c.tipoConduce === 'MATERIAL' && (c.unidadMedida || '').toLowerCase() === 'm3')
    .reduce((sum, c) => sum + Number(c.cantidad || 0), 0);

  const closeModal = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const servicioOptions = servicios.filter((s) => {
    const u = (s.unidadMedida || '').toUpperCase();
    return formTipoConduce === 'EQUIPO' ? u === 'HORA' : u === 'M3' || u === 'VIAJE';
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por conduce, cliente, proyecto, chofer, ficha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/70 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => exportConducesToExcel(filteredConduces)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/50 text-xs font-bold transition-colors cursor-pointer"
              title="Exportar a Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              onClick={() =>
                exportConducesListPDF(
                  filteredConduces,
                  'Listado de Conduces de Producción',
                  filterFechaInicio || filterFechaFin
                    ? `${filterFechaInicio || 'Inicio'} al ${filterFechaFin || 'Actualidad'}`
                    : 'Histórico Completo'
                )
              }
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Exportar Reporte en PDF"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Reporte PDF</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Conduce</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t border-slate-800/70 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Tipo:</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Equipos y Materiales</option>
              <option value="EQUIPO">Solo Equipos Pesados</option>
              <option value="MATERIAL">Solo Materiales / Volteo</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Cliente:</label>
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todos ({clientes.length})</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Proyecto:</label>
            <select
              value={filterProyecto}
              onChange={(e) => setFilterProyecto(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todos los Proyectos</option>
              {uniqueProyectos.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Estado Facturación:</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="Pendiente">Pendiente por Facturar</option>
              <option value="Proforma">Proforma</option>
              <option value="Facturado">Facturado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Desde Fecha:</label>
            <input
              type="date"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Hasta Fecha:</label>
            <input
              type="date"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Conduces</span>
          <strong className="text-base text-slate-100 font-mono">{filteredConduces.length}</strong>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Horas de Equipos</span>
          <strong className="text-base text-amber-400 font-mono">{formatNumber(totalHoras, 1)} hrs</strong>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Viajes de Volteo</span>
          <strong className="text-base text-sky-400 font-mono">{formatNumber(totalViajes, 0)} viajes</strong>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Metros de Material</span>
          <strong className="text-base text-purple-400 font-mono">{formatNumber(totalMetros, 1)} m³</strong>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Monto Total Registrado</span>
          <strong className="text-base text-emerald-400 font-mono font-black">{formatCurrency(totalFiltradoMonto)}</strong>
        </div>
      </div>

      {/* Conduces Main Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4">No. Conduce</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Cliente / Proyecto</th>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4 text-center">Producción</th>
                <th className="py-3 px-4 text-right">Tarifa Unit.</th>
                <th className="py-3 px-4 text-right">Subtotal RD$</th>
                <th className="py-3 px-4">Equipo / Chofer</th>
                <th className="py-3 px-4 text-center">Estado Admin</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {filteredConduces.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-medium">
                    No se encontraron conduces con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredConduces.map((conduce) => (
                  <tr key={conduce.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{conduce.numeroConduce}</td>
                    <td className="py-3.5 px-4">
                      {conduce.tipoConduce === 'EQUIPO' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> Equipo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Truck className="w-3 h-3" /> Material
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(conduce.fecha)}
                      <div className="text-[10px] text-slate-500">{conduce.hora || '08:00'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{conduce.clienteNombre}</div>
                      <div className="text-[11px] text-amber-400/90 font-medium">{conduce.obra || conduce.proyectoMina}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{conduce.servicioDescripcion}</div>
                      {conduce.turnoHorario && (
                        <div className="text-[10px] text-slate-400">
                          Turno: {conduce.turnoHorario} ({conduce.horaInicio}-{conduce.horaFin})
                        </div>
                      )}
                      {conduce.viajes && (
                        <div className="text-[10px] text-slate-400">{conduce.viajes} viaje(s)</div>
                      )}
                      {conduce.minaNombre && (
                        <div className="text-[10px] text-slate-500">Mina: {conduce.minaNombre}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100 whitespace-nowrap">
                      {formatNumber(conduce.cantidad, 2)} <span className="text-[10px] text-amber-400">{conduce.unidadMedida}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatCurrency(conduce.precioUnitario)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(conduce.totalMonto)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">{conduce.choferNombre || 'Sin asignar'}</div>
                      <div className="text-[10px] text-slate-500">
                        {conduce.equipoFicha || 'Sin equipo'} {conduce.placa ? `(${conduce.placa})` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <select
                        value={conduce.estadoFacturacion}
                        onChange={(e) =>
                          updateEstadoFacturacion(conduce.id, e.target.value as 'Pendiente' | 'Facturado' | 'Anulado' | 'Proforma')
                        }
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          conduce.estadoFacturacion === 'Facturado'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : conduce.estadoFacturacion === 'Anulado'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : conduce.estadoFacturacion === 'Proforma'
                            ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Proforma">Proforma</option>
                        <option value="Facturado">Facturado</option>
                        <option value="Anulado">Anulado</option>
                      </select>
                      {conduce.numeroFactura && (
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono">Ref: {conduce.numeroFactura}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewConduce(conduce)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                          title="Ver / Imprimir Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => exportSingleConducePDF(conduce)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors cursor-pointer"
                          title="Descargar PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(conduce)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Editar conduce / corregir precio o cantidad"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar conduce ${conduce.numeroConduce}?`)) {
                              deleteConduce(conduce.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New / Edit Conduce Form */}
      <Modal
        isOpen={isCreateOpen}
        onClose={closeModal}
        title={
          editingConduce
            ? `Editar Conduce #${editingConduce.numeroConduce}`
            : formTipoConduce === 'EQUIPO'
            ? 'Registrar Conduce de Equipos Pesados'
            : formTipoConduce === 'MATERIAL'
            ? 'Registrar Conduce de Materiales / Volteo'
            : 'Registrar Nuevo Conduce'
        }
        subtitle={
          formTipoConduce === 'EQUIPO'
            ? 'Registro por horas trabajadas del equipo y su operador.'
            : formTipoConduce === 'MATERIAL'
            ? 'Registro por viajes y metros cúbicos de material transportado.'
            : 'Seleccione el tipo de conduce que desea registrar.'
        }
        maxWidth="3xl"
      >
        {!formTipoConduce ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <button
              onClick={() => setFormTipoConduce('EQUIPO')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-700 hover:border-amber-500 bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer text-center"
            >
              <Clock className="w-10 h-10 text-amber-400" />
              <span className="font-bold text-slate-100">Conduce de Equipos Pesados</span>
              <span className="text-xs text-slate-400">Registro por horas trabajadas (excavadora, buldócer, rodillo, etc.)</span>
            </button>
            <button
              onClick={() => {
                setFormTipoConduce('MATERIAL');
                setFormViajes('1');
              }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-700 hover:border-sky-500 bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer text-center"
            >
              <Truck className="w-10 h-10 text-sky-400" />
              <span className="font-bold text-slate-100">Conduce de Materiales / Volteo</span>
              <span className="text-xs text-slate-400">Registro por viajes y metros cúbicos de material transportado</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveConduce} className="space-y-4">
            {!editingConduce && (
              <button
                type="button"
                onClick={() => setFormTipoConduce(null)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-amber-400 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar tipo de conduce
              </button>
            )}

            {/* Fecha, Hora, Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha del Trabajo *</label>
                <input
                  type="date"
                  required
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hora de Registro</label>
                <input
                  type="time"
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Estado Administrativo</label>
                <select
                  value={formEstadoFacturacion}
                  onChange={(e) => setFormEstadoFacturacion(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
                >
                  <option value="Pendiente">Pendiente por Facturar</option>
                  <option value="Proforma">Proforma</option>
                  <option value="Facturado">Facturado</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>
            </div>

            {/* Cliente, Proyecto & Mina */}
            <div className={`grid grid-cols-1 gap-3 ${formTipoConduce === 'MATERIAL' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cliente *</label>
                <select
                  required
                  value={formClienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-medium"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.rnc ? `(RNC: ${c.rnc})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Proyecto / Ubicación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Torre Vista Hermosa - Nivel 4"
                  value={formObra}
                  onChange={(e) => setFormObra(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              {formTipoConduce === 'MATERIAL' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mina de Origen *</label>
                  <select
                    required
                    value={formMinaId}
                    onChange={(e) => setFormMinaId(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-medium"
                  >
                    <option value="">-- Seleccionar Mina --</option>
                    {minas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  {minas.length === 0 && (
                    <p className="text-[10px] text-rose-400 mt-1">
                      No hay minas registradas. Agréguelas primero en Configurar Empresa → Minas.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Servicio */}
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/80 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {formTipoConduce === 'EQUIPO' ? 'Tipo de Trabajo / Alquiler *' : 'Material o Flete *'}
                </label>
                <select
                  required
                  value={formServicioId}
                  onChange={(e) => handleServicioChange(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-medium"
                >
                  <option value="">-- Seleccionar del Catálogo de Servicios --</option>
                  {servicioOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.descripcion} ({s.codigo}) - por {s.unidadMedida}
                    </option>
                  ))}
                </select>
                {servicioOptions.length === 0 && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    No hay servicios configurados para este tipo. Agréguelos primero en Catálogo de Servicios.
                  </p>
                )}
              </div>

              {formTipoConduce === 'EQUIPO' ? (
                <div className="space-y-3 pt-2 border-t border-slate-700/60">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Turno *</label>
                      <select
                        value={formTurno}
                        onChange={(e) => setFormTurno(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
                      >
                        {TURNOS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Hora Inicial *</label>
                      <input
                        type="time"
                        required
                        value={formHoraInicio}
                        onChange={(e) => setFormHoraInicio(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Hora Final *</label>
                      <input
                        type="time"
                        required
                        value={formHoraFin}
                        onChange={(e) => setFormHoraFin(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <span className="text-[10px] text-amber-300 uppercase font-bold block">Horas Calculadas</span>
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {formHorasTrabajadas || '—'}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Horómetro Inicial (Opc.)</label>
                      <input
                        type="number"
                        step="any"
                        value={formHorometroInicial}
                        onChange={(e) => setFormHorometroInicial(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Horómetro Final (Opc.)</label>
                      <input
                        type="number"
                        step="any"
                        value={formHorometroFinal}
                        onChange={(e) => setFormHorometroFinal(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Tarifa por Hora (RD$) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formPrecioUnitario}
                      onChange={(e) => setFormPrecioUnitario(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-slate-700/60">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {materialUnidad === 'M3' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Capacidad Camión (m³) *</label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          value={formCapacidadCamion}
                          onChange={(e) => setFormCapacidadCamion(e.target.value)}
                          className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none text-center"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Cantidad de Viajes *</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={formViajes}
                        onChange={(e) => setFormViajes(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center"
                      />
                    </div>
                    {materialUnidad === 'M3' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Total Metros (m³) *</label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          value={formCantidadM3}
                          onChange={(e) => setFormCantidadM3(e.target.value)}
                          className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {materialUnidad === 'M3' ? 'Precio por m³ (RD$) *' : 'Precio por Viaje (RD$) *'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formPrecioUnitario}
                      onChange={(e) => setFormPrecioUnitario(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Subtotal Calculado:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {formatCurrency(
                    (formTipoConduce === 'EQUIPO'
                      ? Number(formHorasTrabajadas || 0)
                      : materialUnidad === 'M3'
                      ? Number(formCantidadM3 || 0)
                      : Number(formViajes || 0)) * Number(formPrecioUnitario || 0)
                  )}
                </span>
              </div>
            </div>

            {/* Personal y Equipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {formTipoConduce === 'EQUIPO' ? 'Operador *' : 'Chofer *'}
                </label>
                <select
                  required
                  value={formChoferId}
                  onChange={(e) => setFormChoferId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.cargo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {formTipoConduce === 'EQUIPO' ? 'Equipo / Maquinaria *' : 'Camión de Volteo *'}
                </label>
                <select
                  required
                  value={formEquipoId}
                  onChange={(e) => handleEquipoChange(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar Equipo --</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.ficha} ({eq.tipo || 'Equipo'}) {eq.placa ? `- ${eq.placa}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  No. Factura de Referencia (Opcional)
                </label>
                <input
                  type="text"
                  value={formNumeroFactura}
                  onChange={(e) => setFormNumeroFactura(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSellado}
                    onChange={(e) => setFormSellado(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                  />
                  <span>Conduce firmado / recibido conforme en obra</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Observaciones</label>
              <textarea
                rows={2}
                value={formComentarios}
                onChange={(e) => setFormComentarios(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                {editingConduce ? 'Actualizar Conduce' : 'Guardar Conduce'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
