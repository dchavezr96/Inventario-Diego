import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Database,
  Building,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { SystemConfig } from '../../types/inventory.ts';
import { api } from '../../services/api.ts';

interface CustodianConfigViewProps {
  config: SystemConfig;
  userRole: string;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => Promise<void>;
  onRestoreBackup: (data: any) => Promise<void>;
}

export const CustodianConfigView: React.FC<CustodianConfigViewProps> = ({
  config,
  userRole,
  onUpdateConfig,
  onRestoreBackup
}) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      await onUpdateConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/backup', '_blank');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ADVERTENCIA: La restauración sobrescribirá la base de datos actual con la información del archivo de respaldo. ¿Desea continuar?')) {
      return;
    }

    setIsRestoring(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        await onRestoreBackup(json);
        alert('Base de datos restaurada correctamente. La página se actualizará.');
        window.location.reload();
      } catch (err: any) {
        setErrorMessage('Error al restaurar copia: ' + err.message);
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Configuración Institucional y Cuentadancia SENA
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Datos del responsable patrimonial, identificación del centro de formación y parámetros de respaldo de la base de datos.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#39A900] shrink-0" />
          <span>Configuración institucional actualizada correctamente.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: DATOS DEL CUENTADANTE */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-[#39A900]" />
            <h2 className="text-sm font-bold text-neutral-900">
              1. Responsable del Inventario (Cuentadante Principal)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Nombre Completo del Cuentadante <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.custodianName}
                onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Cédula de Ciudadanía / Documento <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.custodianId}
                onChange={(e) => setFormData({ ...formData, custodianId: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Cargo o Rol Institucional
              </label>
              <input
                type="text"
                value={formData.custodianRole}
                onChange={(e) => setFormData({ ...formData, custodianRole: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Correo Electrónico Institucional (@sena.edu.co)
              </label>
              <input
                type="email"
                value={formData.custodianEmail}
                onChange={(e) => setFormData({ ...formData, custodianEmail: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: IDENTIFICACIÓN DEL LABORATORIO Y CENTRO */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
            <Building className="w-4 h-4 text-[#39A900]" />
            <h2 className="text-sm font-bold text-neutral-900">
              2. Dependencia, Regional y Centro de Formación
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Nombre de la Entidad
              </label>
              <input
                type="text"
                value={formData.institutionName}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Regional SENA
              </label>
              <input
                type="text"
                value={formData.regional}
                onChange={(e) => setFormData({ ...formData, regional: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-neutral-700 mb-1">
                Centro de Formación Profesional
              </label>
              <input
                type="text"
                value={formData.center}
                onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Laboratorio o Taller Principal
              </label>
              <input
                type="text"
                value={formData.laboratory}
                onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Ambiente de Formación / Código
              </label>
              <input
                type="text"
                value={formData.environmentCode}
                onChange={(e) => setFormData({ ...formData, environmentCode: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: PREFIJOS DE CONSECUTIVOS */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-2">
            <h2 className="text-sm font-bold text-neutral-900">
              3. Prefijos de Consecutivos Institucionales
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Prefijo Inventario:
              </label>
              <input
                type="text"
                value={formData.inventoryPrefix}
                onChange={(e) => setFormData({ ...formData, inventoryPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Prefijo Préstamos:
              </label>
              <input
                type="text"
                value={formData.loanPrefix}
                onChange={(e) => setFormData({ ...formData, loanPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Prefijo Devoluciones:
              </label>
              <input
                type="text"
                value={formData.returnPrefix}
                onChange={(e) => setFormData({ ...formData, returnPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando Cambios...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>

      {/* SECCIÓN 4: COPIAS DE SEGURIDAD Y PERSISTENCIA (BACKUP & RESTORE) */}
      <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
          <Database className="w-4 h-4 text-[#39A900]" />
          <h2 className="text-sm font-bold text-neutral-900">
            4. Copias de Seguridad, Respaldo y Persistencia de la Base de Datos
          </h2>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          La base de datos se almacena de forma persistente en el servidor en formato JSON relacional con escrituras atómicas.
          Para garantizar la preservación de los registros ante cortes de energía o traslados de computador, puede descargar una copia íntegra de seguridad en cualquier momento y restaurarla cuando sea necesario.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Download backup */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <Download className="w-4 h-4 text-[#39A900]" />
              <span>Descargar Copia de Seguridad (.json)</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Exporta todos los elementos, solicitantes, préstamos activos, devoluciones, movimientos y logs de auditoría en un único archivo seguro.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 cursor-pointer shadow-xs"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Descargar Respaldo Completo</span>
            </button>
          </div>

          {/* Restore backup */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Restaurar Copia de Seguridad</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Carga un archivo de respaldo previamente descargado para recuperar el estado exacto del inventario y préstamos.
            </p>
            <div>
              <input
                type="file"
                id="restore-backup-input"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <label
                htmlFor="restore-backup-input"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isRestoring ? 'Restaurando...' : 'Seleccionar Archivo de Respaldo'}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
