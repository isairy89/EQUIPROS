import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Cliente, PrecioCliente } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.ts';

export const ClientesView: React.FC = () => {
  const {
    clientes,
    servicios,
    preciosCliente,
    conduces,
    saveCliente,
    deleteCliente,
    savePrecioCliente,
    deletePrecioCliente,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedClientForPrices, setSelectedClientForPrices] = useState<Cliente | null>(null);

  // Client form
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [clientNombre, setClientNombre] = useState('');
  const [clientRnc, setClientRnc] = useState('');
  const [clientTelefono, setClientTelefono] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientDireccion, setClientDireccion] = useState('');
  const [clientContacto, setClientContacto] = useState('');
  const [clientEstado, setClientEstado] = useState<'Activo' | 'Inactivo'>('Activo');

  // Special price form
  const [priceServicioId, setPriceServicioId] = useState('');
  const [priceMonto, setPriceMonto] = useState<number>(0);
  const [priceNotas, setPriceNotas] = useState('');

  const resetClientForm = () => {
    setEditingClient(null);
    setClientNombre('');
    setClientRnc('');
    setClientTelefono('');
    setClientEmail('');
    setClientDireccion('');
    setClientContacto('');
    setClientEstado('Activo');
  };

  const handleOpenEditClient = (c: Cliente) => {
    setEditingClient(c);
    setClientNombre(c.nombre);
    setClientRnc(c.rnc);
    setClientTelefono(c.telefono || '');
    setClientEmail(c.email || '');
    setClientDireccion(c.direccion || '');
    setClientContacto(c.contacto || '');
    setClientEstado(c.estado || 'Activo');
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNombre || !clientRnc) {
      alert('Nombre y RNC son obligatorios');
      return;
    }
    await saveCliente({
      id: editingClient ? editingClient.id : undefined,
      nombre: clientNombre,
      rnc: clientRnc,
      telefono: clientTelefono,
      email: clientEmail,
      direccion: clientDireccion,
      contacto: clientContacto,
      estado: clientEstado,
    });
    setIsClientModalOpen(false);
    resetClientForm();
  };

  const handleOpenPricesModal = (c: Cliente) => {
    setSelectedClientForPrices(c);
    setPriceServicioId(servicios[0]?.id || '');
    setPriceMonto(servicios[0]?.precioBase || 0);
    setPriceNotas('');
    setIsPriceModalOpen(true);
  };

  const handleSaveSpecialPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPrices || !priceServicioId) return;

    const serv = servicios.find((s) => s.id === priceServicioId);
    // Si ya existe una tarifa especial para este cliente+servicio, se actualiza en vez de duplicarla.
    const existente = preciosCliente.find(
      (p) => p.clienteId === selectedClientForPrices.id && p.servicioId === priceServicioId
    );
    await savePrecioCliente({
      id: existente?.id,
      clienteId: selectedClientForPrices.id,
      clienteNombre: selectedClientForPrices.nombre,
      servicioId: priceServicioId,
      servicioDescripcion: serv?.descripcion || '',
      precioEspecial: Number(priceMonto),
      notas: priceNotas,
    });

    setPriceNotas('');
  };

  const filteredClients = clientes.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.rnc.toLowerCase().includes(q) ||
      (c.contacto && c.contacto.toLowerCase().includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, RNC, contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => {
            resetClientForm();
            setIsClientModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Cliente</span>
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientConduces = conduces.filter((c) => c.clienteId === client.id);
          const totalM3 = clientConduces.reduce(
            (acc, c) => acc + (c.unidadMedida === 'm3' ? Number(c.cantidad || 0) : 0),
            0
          );
          const totalFacturado = clientConduces.reduce(
            (acc, c) => acc + Number(c.totalMonto || 0),
            0
          );
          const clientSpecialPrices = preciosCliente.filter((p) => p.clienteId === client.id);

          return (
            <div
              key={client.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Client Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 leading-snug">
                      {client.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-amber-400 font-semibold">
                        RNC: {client.rnc}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          client.estado === 'Activo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {client.estado}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditClient(client)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar cliente ${client.nombre}?`)) {
                          deleteCliente(client.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  {client.contacto && (
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{client.contacto}</span>
                    </div>
                  )}
                  {client.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{client.telefono}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{client.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Metrics snippet */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 bg-slate-800/50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Despachado
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatNumber(totalM3, 1)} m³ ({clientConduces.length})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Facturación Total
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(totalFacturado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Prices Trigger Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {clientSpecialPrices.length} tarifas asignadas
                </span>
                <button
                  onClick={() => handleOpenPricesModal(client)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Tarifas Especiales</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Client Edit/Create */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          resetClientForm();
        }}
        title={editingClient ? `Editar ${editingClient.nombre}` : 'Registrar Nuevo Cliente'}
        subtitle="Datos de facturación, RNC y contactos para conduces"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveClient} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Razón Social / Nombre Comercial *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Constructora del Caribe SRL"
              value={clientNombre}
              onChange={(e) => setClientNombre(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">RNC / Cédula *</label>
              <input
                type="text"
                required
                placeholder="1-31-00000-0"
                value={clientRnc}
                onChange={(e) => setClientRnc(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="(809) 555-0000"
                value={clientTelefono}
                onChange={(e) => setClientTelefono(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Persona de Contacto</label>
              <input
                type="text"
                placeholder="Ing. Residente"
                value={clientContacto}
                onChange={(e) => setClientContacto(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="compras@empresa.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Dirección Principal</label>
            <input
              type="text"
              placeholder="Av. Principal #100, Santo Domingo"
              value={clientDireccion}
              onChange={(e) => setClientDireccion(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Estado</label>
            <select
              value={clientEstado}
              onChange={(e) => setClientEstado(e.target.value as any)}
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
                setIsClientModalOpen(false);
                resetClientForm();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20"
            >
              {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Special Prices Manager */}
      <Modal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        title={`Tarifas Especiales: ${selectedClientForPrices?.nombre}`}
        subtitle="Precios pactados por m³ o viaje que sobreescriben la tarifa base del catálogo"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Add Special Price Form */}
          <form
            onSubmit={handleSaveSpecialPrice}
            className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3"
          >
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Asignar Nueva Tarifa Especial
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Servicio</label>
                <select
                  required
                  value={priceServicioId}
                  onChange={(e) => {
                    setPriceServicioId(e.target.value);
                    const s = servicios.find((item) => item.id === e.target.value);
                    if (s) setPriceMonto(s.precioBase);
                  }}
                  className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.descripcion} (Base: {formatCurrency(s.precioBase)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Precio Especial RD$
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={priceMonto}
                  onChange={(e) => setPriceMonto(Number(e.target.value))}
                  className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-bold text-right"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notas / Obra</label>
                <input
                  type="text"
                  placeholder="Ej: Contrato Obra Torre Azul"
                  value={priceNotas}
                  onChange={(e) => setPriceNotas(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors"
              >
                Guardar Tarifa Especial
              </button>
            </div>
          </form>

          {/* List of current special prices for this client */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">Tarifas Registradas Actualmente</h4>
            {selectedClientForPrices &&
            preciosCliente.filter((p) => p.clienteId === selectedClientForPrices.id).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800">
                Este cliente no tiene tarifas especiales pactadas (se aplican los precios base del catálogo).
              </div>
            ) : (
              <div className="divide-y divide-slate-800 bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden">
                {selectedClientForPrices &&
                  preciosCliente
                    .filter((p) => p.clienteId === selectedClientForPrices.id)
                    .map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-200">{item.servicioDescripcion}</p>
                          {item.notas && <p className="text-[11px] text-slate-400">{item.notas}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {formatCurrency(item.precioEspecial)}
                          </span>
                          <button
                            onClick={() => deletePrecioCliente(item.id)}
                            className="p-1 rounded-lg hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Eliminar tarifa especial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
