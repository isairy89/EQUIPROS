import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Empleado } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import {
  UserCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  DollarSign,
  Truck,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.ts';

export const EmpleadosView: React.FC = () => {
  const { empleados, saveEmpleado, deleteEmpleado, conduces } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('Operador de Maquinaria');
  const [pagoPorViaje, setPagoPorViaje] = useState<number>(0);
  const [pagoPorMetro, setPagoPorMetro] = useState<number>(0);
  const [pagoPorHora, setPagoPorHora] = useState<number>(180);
  const [salarioBase, setSalarioBase] = useState<number>(20000);
  const [activo, setActivo] = useState(true);

  const resetForm = () => {
    setEditingEmp(null);
    setNombre('');
    setCedula('');
    setTelefono('');
    setCargo('Operador de Maquinaria');
    setPagoPorViaje(0);
    setPagoPorMetro(0);
    setPagoPorHora(180);
    setSalarioBase(20000);
    setActivo(true);
  };

  const handleOpenEdit = (emp: Empleado) => {
    setEditingEmp(emp);
    setNombre(emp.nombre);
    setCedula(emp.cedula || '');
    setTelefono(emp.telefono || '');
    setCargo(emp.cargo || 'Operador de Maquinaria');
    setPagoPorViaje(emp.pagoPorViaje || 0);
    setPagoPorMetro(emp.pagoPorMetro || 0);
    setPagoPorHora(emp.pagoPorHora || 0);
    setSalarioBase(emp.salarioBase || 0);
    setActivo(emp.activo !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    await saveEmpleado({
      id: editingEmp ? editingEmp.id : undefined,
      nombre,
      cedula,
      telefono,
      cargo,
      pagoPorViaje: Number(pagoPorViaje),
      pagoPorMetro: Number(pagoPorMetro),
      pagoPorHora: Number(pagoPorHora),
      salarioBase: Number(salarioBase),
      activo,
    });
    setIsModalOpen(false);
    resetForm();
  };

  const filteredEmpleados = empleados.filter((emp) => {
    const q = searchTerm.toLowerCase();
    return (
      emp.nombre.toLowerCase().includes(q) ||
      (emp.cargo && emp.cargo.toLowerCase().includes(q)) ||
      (emp.cedula && emp.cedula.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo, cédula..."
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
          <span>+ Registrar Chofer / Operador</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmpleados.map((emp) => {
          const viajesRealizados = conduces.filter((c) => c.choferId === emp.id);
          const totalM3Transportados = viajesRealizados.reduce(
            (acc, c) => acc + (c.unidadMedida === 'm3' ? Number(c.cantidad || 0) : 0),
            0
          );

          return (
            <div
              key={emp.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {emp.cargo}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1.5">{emp.nombre}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar a ${emp.nombre}?`)) {
                          deleteEmpleado(emp.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                  {emp.cedula && (
                    <p>
                      <span className="text-slate-500">Cédula:</span> {emp.cedula}
                    </p>
                  )}
                  {emp.telefono && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{emp.telefono}</span>
                    </p>
                  )}
                </div>

                {/* Rates info */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 bg-slate-800/40 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Pago por Viaje
                    </span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formatCurrency(emp.pagoPorViaje || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Pago por m³
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {formatCurrency(emp.pagoPorMetro || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <strong>{viajesRealizados.length}</strong> viajes registrados
                </span>
                <span>{formatNumber(totalM3Transportados, 1)} m³</span>
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
        title={editingEmp ? 'Editar Personal' : 'Nuevo Chofer / Operador'}
        subtitle="Configure los datos del personal y sus tarifas de liquidación"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Ramón Valdez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cédula</label>
              <input
                type="text"
                placeholder="001-0000000-0"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cargo / Función</label>
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="Operador de Maquinaria">Operador de Maquinaria</option>
                <option value="Chofer de Camión">Chofer de Camión</option>
                <option value="Mecánico">Mecánico</option>
                <option value="Ayudante">Ayudante</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Chofer Mixer">Chofer Mixer</option>
                <option value="Operador de Bomba">Operador de Bomba</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Teléfono</label>
            <input
              type="text"
              placeholder="(809) 555-0199"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Salario Base RD$
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={salarioBase}
                onChange={(e) => setSalarioBase(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Pago / Hora RD$
              </label>
              <input
                type="number"
                step="5"
                min="0"
                value={pagoPorHora}
                onChange={(e) => setPagoPorHora(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Pago / Viaje RD$
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={pagoPorViaje}
                onChange={(e) => setPagoPorViaje(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Pago / m³ RD$
              </label>
              <input
                type="number"
                step="5"
                min="0"
                value={pagoPorMetro}
                onChange={(e) => setPagoPorMetro(Number(e.target.value))}
                className="w-full py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
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
              {editingEmp ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
