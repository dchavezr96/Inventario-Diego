import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  FileSpreadsheet,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Wrench,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { InventoryMovement, MovementType } from '../../types/inventory.ts';
import { exportDataToExcel, exportDataToCSV } from '../../services/api.ts';

interface MovementsHistoryViewProps {
  movements: InventoryMovement[];
  filterItemId?: string | null;
  onClearItemFilter?: () => void;
}

export const MovementsHistoryView: React.FC<MovementsHistoryViewProps> = ({
  movements,
  filterItemId,
  onClearItemFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      if (filterItemId && mov.itemId !== filterItemId) return false;
      if (typeFilter !== 'all' && mov.type !== typeFilter) return false;

      if (startDate && new Date(mov.timestamp) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(mov.timestamp) > end) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = mov.itemName.toLowerCase().includes(q);
        const matchesCode = mov.itemSenaCode.toLowerCase().includes(q);
        const matchesDoc = mov.referenceDocument?.toLowerCase().includes(q);
        const matchesPerson = mov.borrowerPerson?.toLowerCase().includes(q);
        const matchesResponsible = mov.responsiblePerson?.toLowerCase().includes(q);
        const matchesReason = mov.reason?.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesDoc || matchesPerson || matchesResponsible || matchesReason;
      }

      return true;
    });
  }, [movements, filterItemId, typeFilter, startDate, endDate, searchTerm]);

  // Export
  const handleExportExcel = () => {
    const data = filteredMovements.map((m) => ({
      'No. Movimiento': m.movementNumber,
      'Fecha y Hora': new Date(m.timestamp).toLocaleString('es-CO'),
      'Tipo de Movimiento': m.type.toUpperCase().replace('_', ' '),
      'Código SENA': m.itemSenaCode,
      'Elemento': m.itemName,
      'Variación Cantidad': m.quantityChanged,
      'Saldo Disponible': m.balanceAvailable,
      'Saldo Prestado': m.balanceLoaned,
      'Saldo Total': m.balanceTotal,
      'Responsable Operación': m.responsiblePerson,
      'Persona Relacionada': m.borrowerPerson || 'N/A',
      'Motivo': m.reason,
      'Documento Referencia': m.referenceDocument || 'N/A',
      'Observaciones': m.observations || ''
    }));

    exportDataToExcel('Historial_Movimientos_SENA', [
      { name: 'Trazabilidad', data }
    ]);
  };

  const handleExportCSV = () => {
    const data = filteredMovements.map((m) => ({
      'No': m.movementNumber,
      'Fecha': new Date(m.timestamp).toLocaleString('es-CO'),
      'Tipo': m.type,
      'Codigo_SENA': m.itemSenaCode,
      'Elemento': m.itemName,
      'Cantidad': m.quantityChanged,
      'Disponible': m.balanceAvailable,
      'Total': m.balanceTotal,
      'Responsable': m.responsiblePerson,
      'Solicitante': m.borrowerPerson || '',
      'Documento': m.referenceDocument || ''
    }));
    exportDataToCSV('Historial_Movimientos_SENA', data);
  };

  const getBadgeStyle = (type: MovementType) => {
    switch (type) {
      case 'creacion':
        return 'text-emerald-700 bg-emerald-50';
      case 'prestamo_salida':
        return 'text-blue-700 bg-blue-50';
      case 'devolucion_total':
        return 'text-[#39A900] bg-emerald-50';
      case 'devolucion_parcial':
        return 'text-teal-700 bg-teal-50';
      case 'ingreso_mantenimiento':
      case 'retorno_mantenimiento':
        return 'text-amber-800 bg-amber-100';
      case 'deterioro':
      case 'baja':
      case 'perdida':
        return 'text-rose-700 bg-rose-50';
      default:
        return 'text-neutral-700 bg-neutral-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Historial y Trazabilidad de Movimientos
            </h1>
            {filterItemId && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold flex items-center gap-1">
                Filtrado por elemento
                {onClearItemFilter && (
                  <button onClick={onClearItemFilter} className="hover:text-blue-900 font-bold ml-1 cursor-pointer">
                    ×
                  </button>
                )}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registro cronológico auditable e inmutable de salidas, retornos, ajustes patrimoniales y novedades técnicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código SENA, herramienta, solicitante, documento..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            >
              <option value="all">Todos los tipos de movimiento</option>
              <option value="prestamo_salida">Salida por Préstamo</option>
              <option value="devolucion_total">Devolución Total</option>
              <option value="devolucion_parcial">Devolución Parcial</option>
              <option value="creacion">Alta / Creación Inicial</option>
              <option value="ajuste_cantidad">Ajuste de Cantidades</option>
              <option value="ingreso_mantenimiento">Ingreso a Mantenimiento</option>
              <option value="retorno_mantenimiento">Retorno de Mantenimiento</option>
              <option value="deterioro">Deterioro / Avería</option>
              <option value="baja">Baja Definitiva</option>
              <option value="correccion_administrativa">Corrección Administrativa</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Fecha inicial"
              className="w-1/2 px-2 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            />
            <span className="text-neutral-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Fecha final"
              className="w-1/2 px-2 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <div>
            Mostrando <strong>{filteredMovements.length}</strong> registro(s) de trazabilidad
          </div>
          {(startDate || endDate || typeFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setTypeFilter('all');
                setSearchTerm('');
              }}
              className="text-[#39A900] font-semibold hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 text-neutral-300 mx-auto" />
            <div className="text-sm font-semibold text-neutral-800">
              No hay movimientos que coincidan con los criterios
            </div>
            <p className="text-xs text-neutral-500">
              Intente ajustar los filtros de fecha o búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[10px] uppercase font-semibold">
                  <th className="py-3 px-3.5 whitespace-nowrap">No. Movimiento</th>
                  <th className="py-3 px-3 whitespace-nowrap">Fecha y Hora</th>
                  <th className="py-3 px-3 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-3.5 min-w-[180px]">Elemento / Código</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Variación</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Disp.</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Total</th>
                  <th className="py-3 px-3.5 min-w-[160px]">Persona / Responsable</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Motivo & Observaciones</th>
                  <th className="py-3 px-3 whitespace-nowrap">Comprobante / Ref.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredMovements.map((mov) => {
                  return (
                    <tr key={mov.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-neutral-800 whitespace-nowrap">
                        {mov.movementNumber}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                        {new Date(mov.timestamp).toLocaleDateString('es-CO')}
                        <span className="text-[10px] text-neutral-400 block">
                          {new Date(mov.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${getBadgeStyle(
                            mov.type
                          )}`}
                        >
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900 leading-tight">
                          {mov.itemName}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                          {mov.itemSenaCode}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            mov.quantityChanged > 0
                              ? 'text-[#39A900]'
                              : mov.quantityChanged < 0
                              ? 'text-neutral-800'
                              : 'text-neutral-400'
                          }
                        >
                          {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-mono text-neutral-600">
                        {mov.balanceAvailable}
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-semibold text-neutral-800">
                        {mov.balanceTotal}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="text-neutral-900 font-medium">{mov.responsiblePerson}</div>
                        {mov.borrowerPerson && (
                          <div className="text-[11px] text-neutral-500">
                            Solicitante: {mov.borrowerPerson}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="text-neutral-800 leading-tight">{mov.reason}</div>
                        {mov.observations && (
                          <div className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                            {mov.observations}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                        {mov.referenceDocument || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
