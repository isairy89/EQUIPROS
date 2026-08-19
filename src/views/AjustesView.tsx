import React, { useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Database,
  Building,
  Server,
} from 'lucide-react';

export const AjustesView: React.FC = () => {
  const {
    exportJSONBackup,
    importJSONBackup,
    resetToSampleData,
    clientes,
    servicios,
    conduces,
    empleados,
    equipos,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importJSONBackup(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* System info */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              EQUIPROCI - Equipos y Proyectos Civiles S.R.L.
            </h3>
            <p className="text-xs text-slate-400">
              Plataforma Integral de Control Operativo: Conduces, Producción, Equipos y Combustible
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clientes</span>
            <strong className="text-amber-400 font-mono text-lg">{clientes.length}</strong>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Servicios</span>
            <strong className="text-slate-200 font-mono text-lg">{servicios.length}</strong>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Conduces</span>
            <strong className="text-emerald-400 font-mono text-lg">{conduces.length}</strong>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Personal</span>
            <strong className="text-slate-200 font-mono text-lg">{empleados.length}</strong>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Equipos</span>
            <strong className="text-slate-200 font-mono text-lg">{equipos.length}</strong>
          </div>
        </div>
      </div>

      {/* Backup and Data Persistence Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          Copias de Seguridad y Respaldos del Sistema
        </h3>
        <p className="text-xs text-slate-400">
          Descargue copias completas de la base de datos (conduces, clientes, flota, inventario de combustible y nómina) o restaure respaldos previos en formato JSON seguro.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                Descargar Copia de Seguridad Completa
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Genera un archivo .json estructurado con todo el historial de transacciones y catálogos.
              </p>
            </div>
            <button
              onClick={exportJSONBackup}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Exportar Backup JSON
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-400" />
                Restaurar Base de Datos desde Respaldo
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Carga un archivo de respaldo previo y sincroniza todos los módulos del sistema.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Seleccionar Archivo JSON
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-400" />
          Restablecer a Datos de Demostración
        </h3>
        <p className="text-xs text-rose-300/80">
          Esta acción restablece todos los conduces, catálogos y registros de combustible al paquete de datos predeterminado de EQUIPROCI. Use con precaución.
        </p>

        <div className="flex justify-end">
          <button
            onClick={() => {
              if (
                confirm(
                  '¿Está seguro de que desea restablecer todos los datos a la configuración inicial por defecto?'
                )
              ) {
                resetToSampleData();
              }
            }}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Restablecer Valores Predeterminados
          </button>
        </div>
      </div>
    </div>
  );
};
