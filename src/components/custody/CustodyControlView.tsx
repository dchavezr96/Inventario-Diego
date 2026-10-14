import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  Filter,
  UserCheck,
  Package,
  Calendar,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { CustodyRecord } from '../../types/inventory.ts';
import { exportDataToExcel, exportDataToCSV } from '../../services/api.ts';

interface CustodyControlViewProps {
  custodyRecords: CustodyRecord[];
  onOpenReturnModal: (record: CustodyRecord) => void;
  onViewLoanDetail: (loanId: string) => void;
}

export const CustodyControlView: React.FC<CustodyControlViewProps> = ({
  custodyRecords,
  onOpenReturnModal,
  onViewLoanDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activos' | 'vencidos'>('all');
  const [selectedBorrowerFilter, setSelectedBorrowerFilter] = useState<string>('all');
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>('all');

  // Extract unique borrowers and items for dropdown filtering
  const uniqueBorrowers = useMemo(() => {
    const map = new Map<string, string>();
    custodyRecords.forEach((r) => map.set(r.borrowerId, r.borrowerName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [custodyRecords]);

  const uniqueItems = useMemo(() => {
    const map = new Map<string, string>();
    custodyRecords.forEach((r) => map.set(r.senaCode, `${r.itemName} (${r.senaCode})`));
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
  }, [custodyRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return custodyRecords.filter((rec) => {
      // Status filter
      if (statusFilter === 'vencidos' && !rec.isOverdue && rec.daysLate <= 0) return false;
      if (statusFilter === 'activos' && (rec.isOverdue || rec.daysLate > 0)) return false;

      // Borrower filter
      if (selectedBorrowerFilter !== 'all' && rec.borrowerId !== selectedBorrowerFilter) return false;

      // Item filter
      if (selectedItemFilter !== 'all' && rec.senaCode !== selectedItemFilter) return false;

      // Search term (code, name, borrower, document, ficha, purpose, site)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCode = rec.senaCode.toLowerCase().includes(query);
        const matchesName = rec.itemName.toLowerCase().includes(query);
        const matchesBorrower = rec.borrowerName.toLowerCase().includes(query);
        const matchesDoc = rec.borrowerDocument.toLowerCase().includes(query);
        const matchesFicha = rec.fichaNumber.toLowerCase().includes(query);
        const matchesSite = rec.siteDescription.toLowerCase().includes(query);
        const matchesLoan = rec.loanNumber.toLowerCase().includes(query);
        return matchesCode || matchesName || matchesBorrower || matchesDoc || matchesFicha || matchesSite || matchesLoan;
      }

      return true;
    });
  }, [custodyRecords, statusFilter, selectedBorrowerFilter, selectedItemFilter, searchTerm]);

  // Export handlers
  const handleExportExcel = () => {
    const exportData = filteredRecords.map((r) => ({
      'No. Préstamo': r.loanNumber,
      'Código SENA': r.senaCode,
      'Elemento': r.itemName,
      'Categoría': r.category,
      'Total Existencias': r.totalQty,
      'Disponibles Lab': r.availableQty,
      'Cantidad Prestada': r.loanedQuantity,
      'Custodio / Solicitante': r.borrowerName,
      'Tipo': r.personType,
      'Documento': r.borrowerDocument,
      'Ficha SENA': r.fichaNumber,
      'Programa de Formación': r.programName,
      'Fecha Salida': new Date(r.requestDate).toLocaleDateString('es-CO'),
      'Fecha Prevista Devolución': new Date(r.expectedReturnDate).toLocaleDateString('es-CO'),
      'Días Retraso': r.daysLate,
      'Estado Préstamo': r.isOverdue ? 'VENCIDO' : 'ACTIVO',
      'Sitio de Uso': r.siteDescription,
      'Finalidad': r.purposeDescription
    }));

    exportDataToExcel('Custodia_Activa_Quien_Tiene_Cada_Elemento', [
      { name: 'Custodia_Activa', data: exportData }
    ]);
  };

  const handleExportCSV = () => {
    const exportData = filteredRecords.map((r) => ({
      'No. Préstamo': r.loanNumber,
      'Código SENA': r.senaCode,
      'Elemento': r.itemName,
      'Cantidad Prestada': r.loanedQuantity,
      'Solicitante': r.borrowerName,
      'Ficha': r.fichaNumber,
      'Fecha Salida': new Date(r.requestDate).toLocaleDateString('es-CO'),
      'Fecha Prevista': new Date(r.expectedReturnDate).toLocaleDateString('es-CO'),
      'Días Retraso': r.daysLate,
      'Estado': r.isOverdue ? 'VENCIDO' : 'ACTIVO',
      'Sitio': r.siteDescription
    }));
    exportDataToCSV('Custodia_Activa_SENA', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              ¿Quién tiene cada elemento?
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#39A900]/10 text-[#39A900] font-semibold">
              Control Prioritario
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Localización inmediata de herramientas y equipos prestados a aprendices, instructores y contratistas.
          </p>
        </div>

        {/* Action Controls */}
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Quick Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código SENA, elemento, persona, cédula o ficha..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] focus:bg-white"
            />
          </div>

          {/* Filter by Person */}
          <div>
            <select
              value={selectedBorrowerFilter}
              onChange={(e) => setSelectedBorrowerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            >
              <option value="all">Todas las personas ({uniqueBorrowers.length})</option>
              {uniqueBorrowers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Item */}
          <div>
            <select
              value={selectedItemFilter}
              onChange={(e) => setSelectedItemFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            >
              <option value="all">Todos los elementos ({uniqueItems.length})</option>
              {uniqueItems.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Todos los Préstamos ({custodyRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter('activos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'activos'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Al Día / En Plazo
            </button>
            <button
              onClick={() => setStatusFilter('vencidos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'vencidos'
                  ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Vencidos con Retraso
            </button>
          </div>

          <div className="text-xs text-neutral-500 font-mono">
            Mostrando <strong>{filteredRecords.length}</strong> registro(s) de custodia activa
          </div>
        </div>
      </div>

      {/* Main Custody Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-8 h-8 text-neutral-300 mx-auto" />
            <div className="text-sm font-semibold text-neutral-800">
              No hay elementos en préstamo bajo los filtros seleccionados
            </div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Todos los elementos están actualmente resguardados en el laboratorio o no coinciden con la búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 text-neutral-600 border-b border-neutral-200 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 whitespace-nowrap">Código SENA</th>
                  <th className="py-3 px-3.5 whitespace-nowrap min-w-[200px]">Elemento / Herramienta</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Existencias</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Prestadas</th>
                  <th className="py-3 px-3.5 whitespace-nowrap min-w-[180px]">Persona Responsable</th>
                  <th className="py-3 px-3 whitespace-nowrap">Ficha / Programa</th>
                  <th className="py-3 px-3 whitespace-nowrap">Salida</th>
                  <th className="py-3 px-3 whitespace-nowrap">Devolución Prevista</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">Estado / Retraso</th>
                  <th className="py-3 px-3 whitespace-nowrap">Sitio & Propósito</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRecords.map((record, index) => {
                  const isLate = record.isOverdue || record.daysLate > 0;

                  return (
                    <tr
                      key={`${record.loanId}-${record.itemId}-${index}`}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isLate ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Código SENA */}
                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-neutral-800 whitespace-nowrap">
                        {record.senaCode}
                      </td>

                      {/* Elemento */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900">{record.itemName}</div>
                        <div className="text-[11px] text-neutral-500">
                          {record.category} · Préstamo #{record.loanNumber}
                        </div>
                      </td>

                      {/* Total y Disponibles */}
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-neutral-600">
                        <div>{record.totalQty} total</div>
                        <div className="text-[10px] text-[#39A900] font-medium">{record.availableQty} disp.</div>
                      </td>

                      {/* Cantidad Prestada */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold text-sm text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                          {record.loanedQuantity}
                        </span>
                      </td>

                      {/* Solicitante */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900">{record.borrowerName}</div>
                        <div className="text-[11px] text-neutral-500">
                          {record.personType.toUpperCase()} · C.C. {record.borrowerDocument}
                        </div>
                      </td>

                      {/* Ficha & Programa */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] font-medium text-neutral-800">
                          {record.fichaNumber || 'N/A'}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate max-w-[150px]" title={record.programName}>
                          {record.programName}
                        </div>
                      </td>

                      {/* Fecha Salida */}
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-600 font-mono text-[11px]">
                        {new Date(record.requestDate).toLocaleDateString('es-CO')}
                      </td>

                      {/* Fecha Devolución */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        <span className={isLate ? 'text-amber-800 font-bold' : 'text-neutral-700'}>
                          {new Date(record.expectedReturnDate).toLocaleDateString('es-CO')}
                        </span>
                      </td>

                      {/* Estado y Retraso */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isLate ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              Vencido
                            </span>
                            <span className="text-[10px] text-amber-700 font-mono mt-0.5">
                              {record.daysLate} día(s) retraso
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">
                            Al Día
                          </span>
                        )}
                      </td>

                      {/* Sitio y Propósito */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-medium text-neutral-800 truncate" title={record.siteDescription}>
                          {record.siteDescription}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate" title={record.purposeDescription}>
                          {record.purposeDescription}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => onOpenReturnModal(record)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded transition-colors cursor-pointer shadow-xs"
                          title="Registrar devolución de este elemento"
                        >
                          Devolver
                        </button>
                        <button
                          onClick={() => onViewLoanDetail(record.loanId)}
                          className="px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors cursor-pointer"
                          title="Ver detalle del préstamo"
                        >
                          Detalle
                        </button>
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
