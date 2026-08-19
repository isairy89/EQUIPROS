import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { EquipoVehiculo } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import {
  Truck,
  Search,
  Plus,
  Edit,
  Trash2,
  Fuel,
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters.ts';

export const EquiposView: React.FC = () => {
  const { equipos, saveEquipo, deleteEquipo, conduces, gasoilDespachos } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<EquipoVehiculo | null>(null);

  // Form states
  const [codigo, setCodigo] = useState('');
  const [ficha, setFicha] = useState('');
  const [tipo, setTipo] = useState<string>('Camión Volteo');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [capacidadM3, setCapacidadM3] = useState<number>(8);
  const [estado, setEstado] = useState<'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio'>('Operativo');
  const [rendimientoEstimado, setRendimientoEstimado] = useState<number>(2.5);

  const resetForm = () => {
    setEditingEquipo(null);
    setCodigo('');
    setFicha('');
    setTipo('Camión Volteo');
    setMarca('');
    setModelo('');
    setPlaca('');
    setCapacidadM3(8);
    setEstado('Operativo');
    setRendimientoEstimado(2.5);
  };

  const handleOpenEdit = (eq: EquipoVehiculo) => {
    setEditingEquipo(eq);
    setCodigo(eq.codigo);
    setFicha(eq.ficha);
    setTipo(eq.tipo || 'Camión Volteo');
    setMarca(eq.marca || '');
    setModelo(eq.modelo || '');
    setPlaca(eq.placa || '');
    setCapacidadM3(eq.capacidadM3 || 8);
    setEstado(eq.estado || 'Operativo');
    setRendimientoEstimado(eq.rendimientoEstimado || 2.5);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ficha) {
      alert('La ficha identificadora es obligatoria');
      return;
    }
    await saveEquipo({
      id: editingEquipo ? editingEquipo.id : undefined,
      codigo: codigo || ficha,
      ficha,
      tipo,
      marca,
      modelo,
      placa,
      capacidadM3: Number(capacidadM3),
      estado,
      rendimientoEstimado: Number(rendimientoEstimado),
    });
    setIsModalOpen(false);
    resetForm();
  };

  const filteredEquipos = equipos.filter((eq) => {
    const q = searchTerm.toLowerCase();
    return (
      eq.ficha.toLowerCase().includes(q) ||
      (eq.marca && eq.marca.toLowerCase().includes(q)) ||
      (eq.placa && eq.placa.toLowerCase().includes(q)) ||
      (eq.tipo && eq.tipo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Create */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por ficha, marca, placa o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Equipo</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEquipos.map((eq) => {
          const viajesRealizados = conduces.filter(
            (c) => c.equipoFicha === eq.ficha || c.bombaFicha === eq.ficha
          );
          const totalGasoilConsumido = gasoilDespachos
            .filter((d) => d.equipoFicha === eq.ficha)
            .reduce((acc, d) => acc + Number(d.galones || 0), 0);

          return (
            <div
              key={eq.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      {eq.ficha}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        eq.estado === 'Operativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : eq.estado === 'En Mantenimiento'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {eq.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(eq)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar equipo ${eq.ficha}?`)) {
                          deleteEquipo(eq.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="text-sm font-bold text-slate-100">{eq.tipo}</h3>
                  <p className="text-xs text-slate-400">
                    {eq.marca} {eq.modelo} {eq.placa ? `• Placa: ${eq.placa}` : ''}
                  </p>
                </div>

                {/* Capacity and details */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 bg-slate-800/40 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Capacidad
                    </span>
                    <span className="font-bold text-slate-200 font-mono">
                      {eq.capacidadM3 ? `${eq.capacidadM3} m³` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Gasoil Despachado
                    </span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formatNumber(totalGasoilConsumido, 1)} gal
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{viajesRealizados.length} despachos / servicios</span>
                <span className="text-[11px] text-slate-500">Rend: ~{eq.rendimientoEstimado || 2.5} km/gal</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingEquipo ? `Editar ${editingEquipo.ficha}` : 'Registrar Nuevo Equipo'}
        subtitle="Agregue unidades de transporte y maquinaria pesada a la flota"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Ficha / Identificador *</label>
              <input
                type="text"
                required
                placeholder="Ej: Ficha #05"
                value={ficha}
                onChange={(e) => setFicha(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Maquinaria</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="Retroexcavadora / Pala">Retroexcavadora / Pala</option>
                <option value="Tractor / Buldócer">Tractor / Buldócer</option>
                <option value="Rodillo Compactador">Rodillo Compactador</option>
                <option value="Pala Mecánica">Pala Mecánica / Cargador</option>
                <option value="Camión Volteo">Camión Volteo</option>
                <option value="Camión Mixer">Camión Mixer (Hormigonera)</option>
                <option value="Bomba de Hormigón">Bomba de Hormigón (Pluma)</option>
                <option value="Vehículo Liviano">Vehículo de Apoyo / Camioneta</option>
                <option value="Generador">Generador / Planta Eléctrica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Marca</label>
              <input
                type="text"
                placeholder="Mack / Kenworth"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Granite 2021"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Placa</label>
              <input
                type="text"
                placeholder="L-123456"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Capacidad Tambor (m³)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={capacidadM3}
                onChange={(e) => setCapacidadM3(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="Operativo">Operativo</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
                <option value="Fuera de Servicio">Fuera de Servicio</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Rend. Est. (km/gal)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={rendimientoEstimado}
                onChange={(e) => setRendimientoEstimado(Number(e.target.value))}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-center"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20"
            >
              {editingEquipo ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
