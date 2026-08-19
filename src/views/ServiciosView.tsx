import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Servicio } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters.ts';

export const ServiciosView: React.FC = () => {
  const { servicios, saveServicio, deleteServicio, conduces } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

  // Form states
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<'HORA' | 'VIAJE' | 'METRO' | string>('HORA');
  const [precioBase, setPrecioBase] = useState<string>('');
  const [categoria, setCategoria] = useState('Maquinaria Pesada');
  const [activo, setActivo] = useState(true);

  const resetForm = () => {
    setEditingServicio(null);
    setCodigo('');
    setDescripcion('');
    setUnidadMedida('HORA');
    setPrecioBase('');
    setCategoria('Maquinaria Pesada');
    setActivo(true);
  };

  const handleOpenEdit = (s: Servicio) => {
    setEditingServicio(s);
    setCodigo(s.codigo);
    setDescripcion(s.descripcion);
    setUnidadMedida(s.unidadMedida || 'HORA');
    setPrecioBase(s.precioBase ? String(s.precioBase) : '');
    setCategoria(s.categoria || 'Maquinaria Pesada');
    setActivo(s.activo !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !descripcion.trim()) {
      alert('Código y descripción son obligatorios');
      return;
    }
    const precio = Number(precioBase);
    if (isNaN(precio) || precio < 0) {
      alert('Introduzca un precio base válido');
      return;
    }
    await saveServicio({
      id: editingServicio ? editingServicio.id : undefined,
      codigo: codigo.trim().toUpperCase(),
      descripcion: descripcion.trim(),
      unidadMedida,
      precioBase: precio,
      categoria,
      activo,
    });
    setIsModalOpen(false);
    resetForm();
  };

  const filteredServicios = servicios.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.codigo.toLowerCase().includes(q) ||
      s.descripcion.toLowerCase().includes(q) ||
      (s.categoria && s.categoria.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por código, descripción o categoría..."
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
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Servicio / Tarifa Base</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServicios.map((srv) => {
          const conducesUsados = conduces.filter((c) => c.servicioId === srv.id);
          const totalCantidad = conducesUsados.reduce(
            (acc, c) => acc + Number(c.cantidad || 0),
            0
          );

          return (
            <div
              key={srv.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                      {srv.codigo}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {srv.categoria || 'Servicio'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar servicio ${srv.descripcion}?`)) {
                          deleteServicio(srv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mt-2 leading-snug">
                  {srv.descripcion}
                </h3>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Precio Base / Catálogo
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatCurrency(srv.precioBase)}
                  </span>
                  <span className="text-xs text-amber-400 font-bold"> / {srv.unidadMedida}</span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {conducesUsados.length} conduces ({totalCantidad} {srv.unidadMedida})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
        subtitle="Configure el código, unidad de cobro (HORA, VIAJE, METRO) y precio base"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Código *</label>
              <input
                type="text"
                required
                placeholder="Ej: RETRO-01, VOLTEO-01, MAT-ARENA"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="Maquinaria Pesada">Maquinaria Pesada (Excavación / Nivelación)</option>
                <option value="Transporte / Camiones">Transporte / Acarreo en Camiones</option>
                <option value="Materiales / Mina">Materiales / Agregados de Mina</option>
                <option value="Alquiler">Alquiler de Equipos</option>
                <option value="Hormigón">Hormigón / Bombeo</option>
                <option value="Otro">Otro Servicio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Descripción del Servicio *</label>
            <input
              type="text"
              required
              placeholder="Ej: Alquiler Retroexcavadora CAT 420F con operador"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unidad de Cobro *
              </label>
              <select
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold"
              >
                <option value="HORA">HORA — para Conduce de Equipos Pesados</option>
                <option value="m3">m³ — para Conduce de Materiales / Volteo</option>
                <option value="VIAJE">VIAJE — para Conduce de Materiales / Volteo (flete)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Precio Base Estándar (RD$) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="0.00"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
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
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {editingServicio ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
