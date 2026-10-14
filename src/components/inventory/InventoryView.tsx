import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  History,
  ArrowUpRight,
  Package,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Download,
  Info
} from 'lucide-react';
import {
  InventoryItem,
  ItemCategory,
  ItemStatus,
  UnitOfMeasure,
  SystemConfig
} from '../../types/inventory.ts';
import { exportDataToExcel } from '../../services/api.ts';

interface InventoryViewProps {
  items: InventoryItem[];
  config: SystemConfig;
  userRole: string;
  onSaveItem: (itemData: any) => Promise<void>;
  onUpdateItem: (id: string, updates: any) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onViewItemHistory: (item: InventoryItem) => void;
  onQuickLoanItem: (item: InventoryItem) => void;
}

const CATEGORIES: ItemCategory[] = [
  'Herramienta Manual',
  'Herramienta Eléctrica',
  'Equipo de Laboratorio',
  'Instrumento de Medición',
  'Maquinaria',
  'Material de Construcción',
  'Elemento de Protección Personal (EPP)',
  'Mobiliario',
  'Otro'
];

const UNITS: UnitOfMeasure[] = [
  'Unidad',
  'Juego',
  'Kit',
  'Metro',
  'Kilogramo',
  'Litro',
  'Bolsa',
  'Caja',
  'Par'
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  config,
  userRole,
  onSaveItem,
  onUpdateItem,
  onDeleteItem,
  onViewItemHistory,
  onQuickLoanItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'senaCode' | 'name' | 'availableQty'>('senaCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form values
  const [formData, setFormData] = useState({
    senaCode: '',
    internalCode: '',
    name: '',
    description: '',
    category: 'Equipo de Laboratorio' as ItemCategory,
    brand: '',
    model: '',
    serialNumber: '',
    unitOfMeasure: 'Unidad' as UnitOfMeasure,
    totalQty: 1,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo' as ItemStatus,
    defaultLocation: 'Armario Metálico 1',
    acquisitionDate: new Date().toISOString().slice(0, 10),
    notes: '',
    custodianName: config.custodianName,
    custodianId: config.custodianId,
    department: config.laboratory,
    custodyNotes: 'Equipo bajo inventario institucional SENA CTCM.'
  });

  const resetForm = () => {
    setFormData({
      senaCode: '',
      internalCode: '',
      name: '',
      description: '',
      category: 'Equipo de Laboratorio',
      brand: '',
      model: '',
      serialNumber: '',
      unitOfMeasure: 'Unidad',
      totalQty: 1,
      maintenanceQty: 0,
      damagedQty: 0,
      status: 'operativo',
      defaultLocation: 'Armario Metálico 1',
      acquisitionDate: new Date().toISOString().slice(0, 10),
      notes: '',
      custodianName: config.custodianName,
      custodianId: config.custodianId,
      department: config.laboratory,
      custodyNotes: 'Equipo bajo inventario institucional SENA CTCM.'
    });
    setEditingItem(null);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    // Pre-populate with consecutive hint
    const nextNum = items.length + 1;
    setFormData((prev) => ({
      ...prev,
      senaCode: `${config.inventoryPrefix || 'SENA-CTCM'}-${String(nextNum).padStart(3, '0')}`,
      internalCode: `LAB-ELE-${String(nextNum).padStart(2, '0')}`
    }));
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      senaCode: item.senaCode,
      internalCode: item.internalCode || '',
      name: item.name,
      description: item.description || '',
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      unitOfMeasure: item.unitOfMeasure,
      totalQty: item.totalQty,
      maintenanceQty: item.maintenanceQty,
      damagedQty: item.damagedQty,
      status: item.status,
      defaultLocation: item.defaultLocation,
      acquisitionDate: item.acquisitionDate || '',
      notes: item.notes || '',
      custodianName: item.custodianName || config.custodianName,
      custodianId: item.custodianId || config.custodianId,
      department: item.department || config.laboratory,
      custodyNotes: item.custodyNotes || ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.senaCode.trim()) {
      setFormError('El Código SENA es obligatorio.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('El nombre del elemento es obligatorio.');
      return;
    }
    if (formData.totalQty < 0) {
      setFormError('La cantidad total no puede ser negativa.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, formData);
      } else {
        await onSaveItem(formData);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el elemento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCode = item.senaCode.toLowerCase().includes(query);
        const matchesInternal = item.internalCode?.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = item.brand?.toLowerCase().includes(query);
        const matchesLocation = item.defaultLocation?.toLowerCase().includes(query);
        const matchesSerial = item.serialNumber?.toLowerCase().includes(query);
        return matchesCode || matchesInternal || matchesName || matchesBrand || matchesLocation || matchesSerial;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, categoryFilter, statusFilter, searchTerm, sortBy, sortDirection]);

  // Export handler
  const handleExportInventory = () => {
    const exportData = filteredItems.map((i) => ({
      'Código SENA': i.senaCode,
      'Código Interno': i.internalCode,
      'Nombre Elemento': i.name,
      'Descripción': i.description,
      'Categoría': i.category,
      'Marca': i.brand,
      'Modelo': i.model,
      'No. Serie': i.serialNumber,
      'Unidad de Medida': i.unitOfMeasure,
      'Total Existencias': i.totalQty,
      'Disponibles': i.availableQty,
      'En Préstamo': i.loanedQty,
      'En Mantenimiento': i.maintenanceQty,
      'Deterioradas/Bajas': i.damagedQty,
      'Estado General': i.status.toUpperCase(),
      'Ubicación Habitual': i.defaultLocation,
      'Fecha Adquisición': i.acquisitionDate,
      'Cuentadante': i.custodianName,
      'Observaciones': i.notes
    }));

    exportDataToExcel('Inventario_General_SENA_Laboratorio', [
      { name: 'Inventario', data: exportData }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Inventario del Laboratorio
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registro, consulta individual, existencias y control patrimonial de herramientas, equipos y materiales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportInventory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>

          {userRole !== 'auditor' && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Agregar Elemento</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código SENA, nombre, marca o ubicación..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] focus:bg-white"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            >
              <option value="all">Todos los estados</option>
              <option value="operativo">Operativo</option>
              <option value="en_mantenimiento">En Mantenimiento</option>
              <option value="deteriorado">Deteriorado</option>
              <option value="baja">Dado de Baja</option>
            </select>
          </div>
        </div>

        {/* Sort & Results Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <span className="font-medium">Ordenar por:</span>
            <button
              onClick={() => {
                if (sortBy === 'senaCode') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                else { setSortBy('senaCode'); setSortDirection('asc'); }
              }}
              className={`px-2 py-1 rounded cursor-pointer ${sortBy === 'senaCode' ? 'bg-neutral-100 font-semibold text-neutral-900' : 'hover:bg-neutral-50'}`}
            >
              Código {sortBy === 'senaCode' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'name') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                else { setSortBy('name'); setSortDirection('asc'); }
              }}
              className={`px-2 py-1 rounded cursor-pointer ${sortBy === 'name' ? 'bg-neutral-100 font-semibold text-neutral-900' : 'hover:bg-neutral-50'}`}
            >
              Nombre {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'availableQty') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                else { setSortBy('availableQty'); setSortDirection('desc'); }
              }}
              className={`px-2 py-1 rounded cursor-pointer ${sortBy === 'availableQty' ? 'bg-neutral-100 font-semibold text-neutral-900' : 'hover:bg-neutral-50'}`}
            >
              Disponibilidad {sortBy === 'availableQty' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="text-neutral-500 font-mono">
            {filteredItems.length} elemento(s) encontrados
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <div className="text-sm font-semibold text-neutral-800">No se encontraron elementos</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Pruebe a cambiar los filtros o registre un nuevo elemento en el inventario.
            </p>
            {userRole !== 'auditor' && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#39A900] rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Primer Elemento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 text-neutral-600 border-b border-neutral-200 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 whitespace-nowrap">Código SENA</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Elemento & Marca</th>
                  <th className="py-3 px-3 whitespace-nowrap">Categoría</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Total</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Disp.</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Prest.</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Mto/Dañ.</th>
                  <th className="py-3 px-3 whitespace-nowrap">Estado</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Ubicación</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap min-w-[190px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Código */}
                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-neutral-900 whitespace-nowrap">
                        {item.senaCode}
                        {item.internalCode && (
                          <div className="text-[10px] text-neutral-400 font-normal">
                            {item.internalCode}
                          </div>
                        )}
                      </td>

                      {/* Elemento */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-[260px]">
                          {item.brand ? `${item.brand}` : ''} {item.model ? `· ${item.model}` : ''} {item.serialNumber ? `· S/N: ${item.serialNumber}` : ''}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-600">
                        {item.category}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-2 text-center font-mono tabular-nums font-semibold text-neutral-800">
                        {item.totalQty} <span className="text-[10px] text-neutral-400 font-normal">{item.unitOfMeasure.slice(0, 3)}</span>
                      </td>

                      {/* Disponible */}
                      <td className="py-3 px-2 text-center font-mono tabular-nums">
                        <span
                          className={`inline-block font-bold px-1.5 py-0.5 rounded text-xs ${
                            item.availableQty > 0
                              ? 'text-[#39A900] bg-emerald-50'
                              : 'text-neutral-400 bg-neutral-100'
                          }`}
                        >
                          {item.availableQty}
                        </span>
                      </td>

                      {/* Prestado */}
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-blue-700">
                        {item.loanedQty > 0 ? (
                          <span className="font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                            {item.loanedQty}
                          </span>
                        ) : (
                          <span className="text-neutral-300">0</span>
                        )}
                      </td>

                      {/* Mto / Deteriorado */}
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-neutral-600">
                        {item.maintenanceQty + item.damagedQty > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                            {item.maintenanceQty > 0 ? `M:${item.maintenanceQty}` : ''}{item.damagedQty > 0 ? ` D:${item.damagedQty}` : ''}
                          </span>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                            item.status === 'operativo'
                              ? 'text-emerald-700 bg-emerald-50'
                              : item.status === 'en_mantenimiento'
                              ? 'text-amber-800 bg-amber-100'
                              : item.status === 'deteriorado'
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-neutral-500 bg-neutral-100'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-neutral-600 text-[11px] truncate max-w-[140px]" title={item.defaultLocation}>
                        {item.defaultLocation}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1">
                        {/* Direct loan button if available */}
                        {item.availableQty > 0 && userRole !== 'auditor' && (
                          <button
                            onClick={() => onQuickLoanItem(item)}
                            className="px-2 py-1 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded transition-colors cursor-pointer"
                            title="Prestar este elemento"
                          >
                            Prestar
                          </button>
                        )}

                        <button
                          onClick={() => setViewingItem(item)}
                          className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Consultar detalles completos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onViewItemHistory(item)}
                          className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Ver historial de movimientos"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {userRole !== 'auditor' && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Editar elemento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {userRole === 'administrador' && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Confirma eliminar o dar de baja el elemento '${item.name}'?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Dar de baja / Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: FORMULARIO AGREGAR / EDITAR ELEMENTO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#39A900]" />
                <h2 className="text-base font-bold text-neutral-900">
                  {editingItem ? 'Editar Elemento de Inventario' : 'Registrar Nuevo Elemento'}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECCIÓN 1: IDENTIFICACIÓN */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1">
                  1. Identificación y Códigos Institucionales
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Código SENA <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.senaCode}
                      onChange={(e) => setFormData({ ...formData, senaCode: e.target.value })}
                      placeholder="Ej. SENA-CTCM-0104-001"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Código Interno o Consecutivo
                    </label>
                    <input
                      type="text"
                      value={formData.internalCode}
                      onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                      placeholder="Ej. LAB-ENS-01"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Nombre del Elemento o Herramienta <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Cono de Abrams Completo para Asentamiento"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Descripción Técnica Detallada
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Normas técnicas (NTC/ASTM), especificaciones, accesorios incluidos..."
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: CATEGORIZACIÓN & ESPECIFICACIONES */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1">
                  2. Características Técnicas y Clasificación
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Categoría <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Marca</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Pinzuar, Bosch, Leica, Ohaus..."
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Modelo de fábrica"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Número de Serie / Placa
                    </label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Serie individual para trazabilidad particular"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Unidad de Medida
                    </label>
                    <select
                      value={formData.unitOfMeasure}
                      onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: CONTROL DE CANTIDADES Y UBICACIÓN */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1">
                  3. Existencias, Ubicación y Estado
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Cantidad Total <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formData.totalQty}
                      onChange={(e) => setFormData({ ...formData, totalQty: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      En Mantenimiento
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.maintenanceQty}
                      onChange={(e) => setFormData({ ...formData, maintenanceQty: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Deterioradas / Bajas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.damagedQty}
                      onChange={(e) => setFormData({ ...formData, damagedQty: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    >
                      <option value="operativo">Operativo</option>
                      <option value="en_mantenimiento">En Mantenimiento</option>
                      <option value="deteriorado">Deteriorado</option>
                      <option value="baja">Dado de baja</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Ubicación Habitual en el Laboratorio
                    </label>
                    <input
                      type="text"
                      value={formData.defaultLocation}
                      onChange={(e) => setFormData({ ...formData, defaultLocation: e.target.value })}
                      placeholder="Ej. Armario 2 - Estante 3 / Mesa de Mezclas"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Fecha de Adquisición
                    </label>
                    <input
                      type="date"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: CUSTODIA INSTITUCIONAL */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1">
                  4. Responsabilidad y Custodia Institucional
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Cuentadante Responsable
                    </label>
                    <input
                      type="text"
                      value={formData.custodianName}
                      onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Identificación / Documento
                    </label>
                    <input
                      type="text"
                      value={formData.custodianId}
                      onChange={(e) => setFormData({ ...formData, custodianId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Observaciones y Cuidados Especiales
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instrucciones de limpieza, calibración periódica, lubricación..."
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                  />
                </div>
              </div>

              {/* BOTONES ACCIÓN */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Elemento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTA DETALLADA DE UN ELEMENTO */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-[#39A900] font-bold">
                  {viewingItem.senaCode}
                </span>
                <h2 className="text-base font-bold text-neutral-900 mt-0.5">
                  {viewingItem.name}
                </h2>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50 rounded-lg text-center">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Existencias</div>
                <div className="text-lg font-bold font-mono text-neutral-900">{viewingItem.totalQty}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Disponibles</div>
                <div className="text-lg font-bold font-mono text-[#39A900]">{viewingItem.availableQty}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">En Préstamo</div>
                <div className="text-lg font-bold font-mono text-blue-600">{viewingItem.loanedQty}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">Mto / Daño</div>
                <div className="text-lg font-bold font-mono text-amber-600">
                  {viewingItem.maintenanceQty + viewingItem.damagedQty}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs divide-y divide-neutral-100">
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Categoría:</span>
                <span className="font-medium text-neutral-800">{viewingItem.category}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Marca / Modelo:</span>
                <span className="font-medium text-neutral-800">
                  {viewingItem.brand || 'N/A'} {viewingItem.model ? `· ${viewingItem.model}` : ''}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Número de Serie:</span>
                <span className="font-mono text-neutral-800">{viewingItem.serialNumber || 'Sin serial asignado'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Ubicación Habitual:</span>
                <span className="font-medium text-neutral-800">{viewingItem.defaultLocation}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Cuentadante Responsable:</span>
                <span className="font-medium text-neutral-800">{viewingItem.custodianName}</span>
              </div>
              <div className="pt-2">
                <span className="text-neutral-500 block mb-0.5">Descripción:</span>
                <p className="text-neutral-700 bg-neutral-50 p-2 rounded text-[11px] leading-relaxed">
                  {viewingItem.description || 'Sin descripción técnica registrada.'}
                </p>
              </div>
              {viewingItem.notes && (
                <div className="pt-2">
                  <span className="text-neutral-500 block mb-0.5">Observaciones:</span>
                  <p className="text-neutral-600 text-[11px]">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <button
                onClick={() => {
                  setViewingItem(null);
                  onViewItemHistory(viewingItem);
                }}
                className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver Historial de Movimientos</span>
              </button>

              <div className="flex items-center gap-2">
                {viewingItem.availableQty > 0 && userRole !== 'auditor' && (
                  <button
                    onClick={() => {
                      setViewingItem(null);
                      onQuickLoanItem(viewingItem);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer"
                  >
                    Registrar Préstamo
                  </button>
                )}
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
