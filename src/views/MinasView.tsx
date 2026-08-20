import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Mina } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { Mountain, Search, Plus, Edit, Trash2, Phone, User, MapPin } from 'lucide-react';

export const MinasView: React.FC = () => {
  const { minas, conduces, saveMina, deleteMina } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMina, setEditingMina] = useState<Mina | null>(null);

  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estado, setEstado] = useState<'Activo' | 'Inactivo'>('Activo');

  const resetForm = () => {
    setEditingMina(null);
    setNombre('');
    setUbicacion('');
    setContacto('');
    setTelefono('');
    setEstado('Activo');
  };

  const handleOpenEdit = (m: Mina) => {
    setEditingMina(m);
    setNombre(m.nombre);
    setUbicacion(m.ubicacion || '');
    setContacto(m.contacto || '');
    setTelefono(m.telefono || '');
    setEstado(m.estado || 'Activo');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('El nombre de la mina es obligatorio');
      return;
    }
    await saveMina({
      id: editingMina ? editingMina.id : undefined,
      nombre: nombre.trim(),
      ubicacion,
      contacto,
      telefono,
      estado,
    });
    setIsModalOpen(false);
    resetForm();
  };

  const filteredMinas = minas.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(q) ||
      (m.ubicacion && m.ubicacion.toLowerCase().includes(q)) ||
      (m.contacto && m.contacto.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación o contacto..."
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
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Mina</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMinas.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            No hay minas registradas. Agrega la primera con "+ Agregar Mina".
          </div>
        )}
        {filteredMinas.map((mina) => {
          const conducesDeEstaMina = conduces.filter((c) => c.minaId === mina.id);
          const totalM3 = conducesDeEstaMina.reduce(
            (acc, c) => acc + ((c.unidadMedida || '').toLowerCase() === 'm3' ? Number(c.cantidad || 0) : 0),
            0
          );

          return (
            <div
              key={mina.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Mountain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 leading-snug">{mina.nombre}</h3>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          mina.estado === 'Activo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {mina.estado || 'Activo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(mina)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la mina ${mina.nombre}?`)) {
                          deleteMina(mina.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  {mina.ubicacion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{mina.ubicacion}</span>
                    </div>
                  )}
                  {mina.contacto && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{mina.contacto}</span>
                    </div>
                  )}
                  {mina.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{mina.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{conducesDeEstaMina.length} conduces</span>
                <span className="font-mono font-bold text-purple-400">{totalM3.toFixed(1)} m³ extraídos</span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingMina ? `Editar ${editingMina.nombre}` : 'Registrar Nueva Mina'}
        subtitle="Origen del material transportado en los conduces de Materiales / Volteo"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre de la Mina *</label>
            <input
              type="text"
              required
              placeholder="Ej: Mina San Cristóbal"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Ubicación</label>
            <input
              type="text"
              placeholder="Ej: Km 20 Autopista Duarte, San Cristóbal"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Persona de Contacto</label>
              <input
                type="text"
                placeholder="Ej: Ramón Féliz"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="(809) 555-0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
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
              {editingMina ? 'Actualizar Mina' : 'Guardar Mina'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
