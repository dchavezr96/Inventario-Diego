import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Package,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  UserCheck,
  Building
} from 'lucide-react';
import {
  InventoryItem,
  Loan,
  CustodyRecord,
  InventoryMovement,
  SystemConfig
} from '../../types/inventory.ts';
import { exportDataToExcel, exportDataToCSV } from '../../services/api.ts';

interface ReportsViewProps {
  items: InventoryItem[];
  loans: Loan[];
  custody: CustodyRecord[];
  movements: InventoryMovement[];
  config: SystemConfig;
}

type ReportType =
  | 'inventario_general'
  | 'existencias_disponibles'
  | 'herramientas_prestadas'
  | 'personas_pendientes'
  | 'prestamos_vencidos'
  | 'mantenimiento_deteriorados'
  | 'bajas_perdidas'
  | 'consolidado_cuentadante';

export const ReportsView: React.FC<ReportsViewProps> = ({
  items,
  loans,
  custody,
  movements,
  config
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('inventario_general');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const reportDefinitions = [
    { id: 'inventario_general', label: '1. Inventario General del Laboratorio' },
    { id: 'existencias_disponibles', label: '2. Existencias Disponibles Inmediatas' },
    { id: 'herramientas_prestadas', label: '3. Relación de Equipos y Herramientas Prestadas' },
    { id: 'personas_pendientes', label: '4. Personas con Elementos Pendientes' },
    { id: 'prestamos_vencidos', label: '5. Préstamos Vencidos con Retraso' },
    { id: 'mantenimiento_deteriorados', label: '6. Elementos en Mantenimiento / Calibración' },
    { id: 'bajas_perdidas', label: '7. Elementos Fuera de Servicio y Bajas' },
    { id: 'consolidado_cuentadante', label: '8. Consolidado Oficial para Revisión de Cuentadante' }
  ];

  // Compute dataset for selected report
  const reportData = useMemo(() => {
    switch (activeReport) {
      case 'inventario_general':
        return items.filter((i) => {
          if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              i.name.toLowerCase().includes(q) ||
              i.senaCode.toLowerCase().includes(q) ||
              i.brand.toLowerCase().includes(q) ||
              i.defaultLocation.toLowerCase().includes(q)
            );
          }
          return true;
        });

      case 'existencias_disponibles':
        return items.filter((i) => i.availableQty > 0);

      case 'herramientas_prestadas':
        return custody;

      case 'personas_pendientes': {
        // Group custody by person
        const personMap = new Map<string, any>();
        custody.forEach((c) => {
          if (!personMap.has(c.borrowerId)) {
            personMap.set(c.borrowerId, {
              borrowerName: c.borrowerName,
              borrowerDocument: c.borrowerDocument,
              personType: c.personType,
              fichaNumber: c.fichaNumber,
              programName: c.programName,
              totalItems: 0,
              itemsList: []
            });
          }
          const p = personMap.get(c.borrowerId);
          p.totalItems += c.loanedQuantity;
          p.itemsList.push(`${c.itemName} (${c.loanedQuantity})`);
        });
        return Array.from(personMap.values());
      }

      case 'prestamos_vencidos':
        return custody.filter((c) => c.isOverdue || c.daysLate > 0);

      case 'mantenimiento_deteriorados':
        return items.filter((i) => i.maintenanceQty > 0 || i.status === 'en_mantenimiento');

      case 'bajas_perdidas':
        return items.filter((i) => i.damagedQty > 0 || i.status === 'baja' || i.status === 'deteriorado');

      case 'consolidado_cuentadante':
        return items;

      default:
        return [];
    }
  }, [activeReport, items, custody, selectedCategory, searchTerm]);

  // Export handlers
  const handleExportExcel = () => {
    exportDataToExcel(`Informe_SENA_${activeReport}`, [
      { name: 'Reporte', data: reportData }
    ]);
  };

  const handleExportCSV = () => {
    exportDataToCSV(`Informe_SENA_${activeReport}`, reportData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Informes, Auditoría y Exportaciones
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generación de reportes oficiales, consolidados para acta de cuentadancia y exportación en formatos abiertos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Informe / Guardar PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills (No print) */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-3 no-print">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
          Seleccionar Tipo de Informe Institucional:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {reportDefinitions.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id as any)}
              className={`p-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer border ${
                activeReport === rep.id
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRINTABLE OFFICIAL SENA REPORT CONTAINER */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Official Header */}
        <div className="border-b-2 border-neutral-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#39A900]">
              {config.institutionName} · {config.regional}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              {reportDefinitions.find((r) => r.id === activeReport)?.label}
            </h2>
            <div className="text-xs text-neutral-600">
              {config.center} · {config.laboratory}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-0.5 font-mono text-neutral-600">
            <div>Fecha de Emisión: <strong>{new Date().toLocaleDateString('es-CO')}</strong></div>
            <div>Cuentadante: <strong>{config.custodianName}</strong></div>
            <div>Ambiente: <strong>{config.environmentCode}</strong></div>
          </div>
        </div>

        {/* Dynamic Table based on Report Type */}
        <div className="overflow-x-auto">
          {/* 1. INVENTARIO GENERAL O EXISTENCIAS */}
          {(activeReport === 'inventario_general' ||
            activeReport === 'existencias_disponibles' ||
            activeReport === 'consolidado_cuentadante' ||
            activeReport === 'mantenimiento_deteriorados' ||
            activeReport === 'bajas_perdidas') && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Código SENA</th>
                  <th className="py-2.5 px-3">Elemento</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Marca / Modelo</th>
                  <th className="py-2.5 px-2 text-center">Total</th>
                  <th className="py-2.5 px-2 text-center">Disp.</th>
                  <th className="py-2.5 px-2 text-center">Prest.</th>
                  <th className="py-2.5 px-2 text-center">Mto.</th>
                  <th className="py-2.5 px-2 text-center">Dañ.</th>
                  <th className="py-2.5 px-3">Ubicación</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reportData.map((item: InventoryItem) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-mono font-semibold">{item.senaCode}</td>
                    <td className="py-2 px-3 font-medium text-neutral-900">{item.name}</td>
                    <td className="py-2 px-3 text-neutral-600">{item.category}</td>
                    <td className="py-2 px-3 text-neutral-600">
                      {item.brand} {item.model ? `· ${item.model}` : ''}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold">{item.totalQty}</td>
                    <td className="py-2 px-2 text-center font-mono text-[#39A900] font-bold">
                      {item.availableQty}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-blue-600">{item.loanedQty}</td>
                    <td className="py-2 px-2 text-center font-mono text-amber-600">{item.maintenanceQty}</td>
                    <td className="py-2 px-2 text-center font-mono text-rose-600">{item.damagedQty}</td>
                    <td className="py-2 px-3 text-neutral-600">{item.defaultLocation}</td>
                    <td className="py-2 px-3 uppercase text-[10px] font-semibold">
                      {item.status.replace('_', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 2. HERRAMIENTAS PRESTADAS O VENCIDAS */}
          {(activeReport === 'herramientas_prestadas' || activeReport === 'prestamos_vencidos') && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">No. Préstamo</th>
                  <th className="py-2.5 px-3">Código SENA</th>
                  <th className="py-2.5 px-3">Elemento</th>
                  <th className="py-2.5 px-2 text-center">Cant.</th>
                  <th className="py-2.5 px-3">Persona Custodio</th>
                  <th className="py-2.5 px-3">Ficha SENA</th>
                  <th className="py-2.5 px-3">Salida</th>
                  <th className="py-2.5 px-3">Devolución Prevista</th>
                  <th className="py-2.5 px-3 text-center">Retraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reportData.map((rec: CustodyRecord, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-mono font-semibold">{rec.loanNumber}</td>
                    <td className="py-2 px-3 font-mono">{rec.senaCode}</td>
                    <td className="py-2 px-3 font-medium text-neutral-900">{rec.itemName}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold">
                      {rec.loanedQuantity}
                    </td>
                    <td className="py-2 px-3">{rec.borrowerName}</td>
                    <td className="py-2 px-3 font-mono">{rec.fichaNumber}</td>
                    <td className="py-2 px-3 font-mono">
                      {new Date(rec.requestDate).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {new Date(rec.expectedReturnDate).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-2 px-3 text-center font-mono">
                      {rec.daysLate > 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          {rec.daysLate} día(s)
                        </span>
                      ) : (
                        <span className="text-emerald-700">Al día</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 3. PERSONAS CON ELEMENTOS PENDIENTES */}
          {activeReport === 'personas_pendientes' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Solicitante</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Documento</th>
                  <th className="py-2.5 px-3">Ficha SENA</th>
                  <th className="py-2.5 px-3">Programa de Formación</th>
                  <th className="py-2.5 px-2 text-center">Total Ítems</th>
                  <th className="py-2.5 px-3">Elementos en Posesión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reportData.map((p: any, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-bold text-neutral-900">{p.borrowerName}</td>
                    <td className="py-2 px-3 uppercase text-[10px]">{p.personType}</td>
                    <td className="py-2 px-3 font-mono">{p.borrowerDocument}</td>
                    <td className="py-2 px-3 font-mono">{p.fichaNumber}</td>
                    <td className="py-2 px-3">{p.programName}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-blue-700">
                      {p.totalItems}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-neutral-700">
                      {p.itemsList.join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Official Signatures Footer for Print/Audit */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs print-break-inside-avoid">
          <div className="space-y-1">
            <div className="border-t border-neutral-400 pt-2 font-bold text-neutral-900">
              {config.custodianName}
            </div>
            <div className="text-[11px] text-neutral-500">{config.custodianRole}</div>
            <div className="text-[11px] text-neutral-400">{config.custodianId}</div>
          </div>

          <div className="space-y-1">
            <div className="border-t border-neutral-400 pt-2 font-bold text-neutral-900">
              Coordinación de Formación / Almacén de Centro
            </div>
            <div className="text-[11px] text-neutral-500">
              {config.center}
            </div>
            <div className="text-[11px] text-neutral-400">Verificación y Control Patrimonial</div>
          </div>
        </div>
      </div>
    </div>
  );
};
