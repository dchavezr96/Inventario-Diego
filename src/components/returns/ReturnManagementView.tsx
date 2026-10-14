import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
  Package,
  Calendar,
  User,
  Wrench,
  AlertTriangle,
  Printer,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Loan, SystemConfig, ReturnRecord, CustodyRecord } from '../../types/inventory.ts';

interface ReturnManagementViewProps {
  loans: Loan[];
  config: SystemConfig;
  preselectedLoan?: Loan | null;
  onProcessReturn: (payload: any) => Promise<ReturnRecord>;
  onPrintReturnReceipt: (receipt: ReturnRecord) => void;
}

export const ReturnManagementView: React.FC<ReturnManagementViewProps> = ({
  loans,
  config,
  preselectedLoan,
  onProcessReturn,
  onPrintReturnReceipt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(preselectedLoan || null);

  // Return form state
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 16));
  const [receiverName, setReceiverName] = useState(config.custodianName);
  const [accessoriesReturned, setAccessoriesReturned] = useState('Accesorios y estuches completos');
  const [notesDamagesLosses, setNotesDamagesLosses] = useState('');

  // Per-item return status
  const [returnItemStates, setReturnItemStates] = useState<
    Record<
      string,
      {
        quantityReturned: number;
        quantityDamaged: number;
        quantityLost: number;
        conditionOnReturn: 'buen_estado' | 'desgaste_normal' | 'danado' | 'incompleto' | 'perdido';
        actionTaken: 'retorno_disponible' | 'enviar_mantenimiento' | 'baja_deterioro' | 'pendiente_aclaracion';
        observations: string;
      }
    >
  >({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReturn, setCompletedReturn] = useState<ReturnRecord | null>(null);

  // Filter loans that have items pending return
  const pendingLoans = useMemo(() => {
    return loans.filter((l) => {
      const hasPending = l.items.some((i) => i.quantityPending > 0);
      if (!hasPending) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesLoanNum = l.loanNumber.toLowerCase().includes(q);
        const matchesBorrower = l.borrower.fullName.toLowerCase().includes(q);
        const matchesDoc = l.borrower.documentId.toLowerCase().includes(q);
        const matchesFicha = l.fichaNumber.toLowerCase().includes(q);
        const matchesItem = l.items.some(
          (it) => it.itemName.toLowerCase().includes(q) || it.itemSenaCode.toLowerCase().includes(q)
        );
        return matchesLoanNum || matchesBorrower || matchesDoc || matchesFicha || matchesItem;
      }

      return true;
    });
  }, [loans, searchTerm]);

  // When selecting a loan to return
  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setCompletedReturn(null);
    setErrorMessage(null);

    // Initialize per-item return states with pending quantity
    const initialMap: Record<string, any> = {};
    loan.items.forEach((item) => {
      if (item.quantityPending > 0) {
        initialMap[item.id] = {
          quantityReturned: item.quantityPending,
          quantityDamaged: 0,
          quantityLost: 0,
          conditionOnReturn: 'buen_estado',
          actionTaken: 'retorno_disponible',
          observations: ''
        };
      }
    });
    setReturnItemStates(initialMap);
  };

  const handleItemStateChange = (itemId: string, field: string, value: any) => {
    setReturnItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const calculateDaysLate = (expectedDate: string) => {
    const now = new Date();
    const exp = new Date(expectedDate);
    if (now <= exp) return 0;
    const diff = now.getTime() - exp.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;
    setErrorMessage(null);

    // Validate that at least one item has quantities being processed
    const itemsToSubmit: any[] = [];
    for (const loanItem of selectedLoan.items) {
      const state = returnItemStates[loanItem.id];
      if (!state) continue;

      const total = Number(state.quantityReturned) + Number(state.quantityDamaged) + Number(state.quantityLost);
      if (total <= 0) continue;

      if (total > loanItem.quantityPending) {
        setErrorMessage(
          `La cantidad ingresada (${total}) para '${loanItem.itemName}' supera las unidades pendientes (${loanItem.quantityPending}).`
        );
        return;
      }

      itemsToSubmit.push({
        loanDetailId: loanItem.id,
        quantityReturned: Number(state.quantityReturned),
        quantityDamaged: Number(state.quantityDamaged),
        quantityLost: Number(state.quantityLost),
        conditionOnReturn: state.conditionOnReturn,
        actionTaken: state.actionTaken,
        observations: state.observations
      });
    }

    if (itemsToSubmit.length === 0) {
      setErrorMessage('Debe indicar al menos una unidad a devolver, dañar o reportar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        loanId: selectedLoan.id,
        returnDate,
        receiverName,
        accessoriesReturned,
        notesDamagesLosses,
        items: itemsToSubmit
      };

      const result = await onProcessReturn(payload);
      setCompletedReturn(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la devolución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS VOUCHER VIEW
  if (completedReturn) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-neutral-200 shadow-sm text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#39A900] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs uppercase font-semibold text-[#39A900] tracking-wider">
            Devolución Registrada en el Sistema
          </span>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Comprobante de Recepción No. {completedReturn.returnNumber}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Se actualizaron las cantidades del inventario (disponibles, mantenimiento o bajas) y se registraron los movimientos correspondientes.
          </p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-lg text-left text-xs space-y-2 border border-neutral-200">
          <div className="flex justify-between">
            <span className="text-neutral-500">Préstamo Original:</span>
            <strong className="text-neutral-900">#{completedReturn.loanNumber}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Persona que Entrega:</span>
            <span className="text-neutral-900 font-semibold">{completedReturn.borrowerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Ficha SENA:</span>
            <span className="font-mono text-neutral-800">{completedReturn.fichaNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Recibido por:</span>
            <span className="text-neutral-900">{completedReturn.receiverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Fecha de Recepción:</span>
            <span className="font-mono text-neutral-900">
              {new Date(completedReturn.returnDate).toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onPrintReturnReceipt(completedReturn)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comprobante de Recepción (PDF)</span>
          </button>

          <button
            onClick={() => {
              setSelectedLoan(null);
              setCompletedReturn(null);
            }}
            className="px-4 py-2.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
          >
            Registrar Otra Devolución
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Devolución y Recepción de Elementos
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Recepción física de herramientas, inspección técnica, novedades de avería o pérdida y liquidación de préstamos.
          </p>
        </div>

        {selectedLoan && (
          <button
            onClick={() => setSelectedLoan(null)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            ← Volver a la Lista de Préstamos
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VIEW 1: SELECT LOAN TO RETURN */}
      {!selectedLoan ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar préstamo por número (#PRE-...), nombre de aprendiz, ficha, código SENA o herramienta..."
              className="w-full text-xs bg-transparent focus:outline-none"
            />
          </div>

          {/* Pending Loans Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            {pendingLoans.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#39A900] mx-auto" />
                <div className="text-sm font-semibold text-neutral-800">
                  No hay préstamos pendientes de devolución
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Todos los préstamos activos han sido liquidados o no coinciden con los términos de búsqueda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[10px] uppercase font-semibold">
                      <th className="py-3 px-3.5">No. Préstamo</th>
                      <th className="py-3 px-3.5">Solicitante</th>
                      <th className="py-3 px-3">Ficha SENA</th>
                      <th className="py-3 px-3.5 min-w-[200px]">Elementos Pendientes</th>
                      <th className="py-3 px-3">Salida</th>
                      <th className="py-3 px-3">Prevista</th>
                      <th className="py-3 px-3 text-center">Estado / Días Retraso</th>
                      <th className="py-3 px-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {pendingLoans.map((loan) => {
                      const daysLate = calculateDaysLate(loan.expectedReturnDate);
                      const isOverdue = daysLate > 0;

                      return (
                        <tr
                          key={loan.id}
                          className={`hover:bg-neutral-50/70 transition-colors ${
                            isOverdue ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-neutral-900">
                            {loan.loanNumber}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-neutral-900">{loan.borrower.fullName}</div>
                            <div className="text-[11px] text-neutral-500">
                              {loan.borrower.personType.toUpperCase()} · C.C. {loan.borrower.documentId}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-neutral-700">
                            {loan.fichaNumber}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="space-y-1">
                              {loan.items
                                .filter((it) => it.quantityPending > 0)
                                .map((it) => (
                                  <div key={it.id} className="text-[11px] text-neutral-800">
                                    <strong className="font-mono text-neutral-900">
                                      {it.quantityPending}
                                    </strong>{' '}
                                    {it.unitOfMeasure} · {it.itemName}
                                  </div>
                                ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                            {new Date(loan.requestDate).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                            <span className={isOverdue ? 'text-amber-800 font-bold' : 'text-neutral-700'}>
                              {new Date(loan.expectedReturnDate).toLocaleDateString('es-CO')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isOverdue ? (
                              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                Vencido ({daysLate}d)
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                En Plazo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleSelectLoan(loan)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              Recibir Elementos
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
      ) : (
        /* VIEW 2: PROCESS RETURN FORM */
        <div className="space-y-6">
          {/* Card Resumen Préstamo */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-3 gap-2">
              <div>
                <span className="text-xs uppercase font-semibold text-neutral-500">
                  Préstamo en Proceso de Devolución
                </span>
                <h2 className="text-lg font-bold text-neutral-900 font-mono">
                  {selectedLoan.loanNumber}
                </h2>
              </div>

              {calculateDaysLate(selectedLoan.expectedReturnDate) > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>
                    Préstamo con {calculateDaysLate(selectedLoan.expectedReturnDate)} día(s) de retraso
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="text-neutral-500 block">Solicitante:</span>
                <strong className="text-neutral-900 text-sm mt-0.5 block">
                  {selectedLoan.borrower.fullName}
                </strong>
                <span className="text-neutral-600 text-[11px]">
                  {selectedLoan.borrower.personType.toUpperCase()} · Ficha: {selectedLoan.fichaNumber}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="text-neutral-500 block">Salida del Laboratorio:</span>
                <span className="font-mono font-medium text-neutral-800">
                  {new Date(selectedLoan.requestDate).toLocaleString('es-CO')}
                </span>
                <span className="text-neutral-500 block mt-1">Prevista:</span>
                <span className="font-mono font-medium text-neutral-800">
                  {new Date(selectedLoan.expectedReturnDate).toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="text-neutral-500 block">Sitio / Propósito:</span>
                <span className="text-neutral-800 font-medium block truncate">
                  {selectedLoan.siteDescription}
                </span>
                <span className="text-neutral-600 text-[11px] block truncate">
                  {selectedLoan.purposeDescription}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de Devolución por Ítem */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-2">
              <h3 className="text-sm font-bold text-neutral-900">
                Inspección y Cantidades Devueltas por Elemento
              </h3>
              <p className="text-xs text-neutral-500">
                Indique cuántas unidades se reciben en buen estado y reporte novedades si hay daños o pérdidas.
              </p>
            </div>

            <div className="space-y-4">
              {selectedLoan.items
                .filter((item) => item.quantityPending > 0)
                .map((loanItem) => {
                  const state = returnItemStates[loanItem.id] || {
                    quantityReturned: loanItem.quantityPending,
                    quantityDamaged: 0,
                    quantityLost: 0,
                    conditionOnReturn: 'buen_estado',
                    actionTaken: 'retorno_disponible',
                    observations: ''
                  };

                  return (
                    <div
                      key={loanItem.id}
                      className="p-4 bg-neutral-50/70 rounded-lg border border-neutral-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-neutral-900 text-xs">
                            {loanItem.itemName}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Código: {loanItem.itemSenaCode} · Entregadas: {loanItem.quantityDelivered} · Ya devueltas: {loanItem.quantityReturned}
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-[#39A900] bg-emerald-50 px-2.5 py-1 rounded">
                          Pendientes de Devolver: {loanItem.quantityPending} {loanItem.unitOfMeasure}
                        </div>
                      </div>

                      {/* Inputs de cantidades y estado */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div>
                          <label className="block text-neutral-700 font-medium mb-1">
                            Cant. Buen Estado:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={loanItem.quantityPending}
                            value={state.quantityReturned}
                            onChange={(e) =>
                              handleItemStateChange(
                                loanItem.id,
                                'quantityReturned',
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-1">
                            Cant. Averiada / Dañada:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={loanItem.quantityPending}
                            value={state.quantityDamaged}
                            onChange={(e) => {
                              const damaged = parseInt(e.target.value, 10) || 0;
                              handleItemStateChange(loanItem.id, 'quantityDamaged', damaged);
                              if (damaged > 0 && state.actionTaken === 'retorno_disponible') {
                                handleItemStateChange(loanItem.id, 'actionTaken', 'enviar_mantenimiento');
                                handleItemStateChange(loanItem.id, 'conditionOnReturn', 'danado');
                              }
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded font-mono text-amber-700 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-1">
                            Estado Físico:
                          </label>
                          <select
                            value={state.conditionOnReturn}
                            onChange={(e) =>
                              handleItemStateChange(loanItem.id, 'conditionOnReturn', e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded"
                          >
                            <option value="buen_estado">Buen Estado / Operativo</option>
                            <option value="desgaste_normal">Desgaste Normal de Uso</option>
                            <option value="danado">Dañado / Fisurado / Roto</option>
                            <option value="incompleto">Incompleto / Faltan Piezas</option>
                            <option value="perdido">Perdido / No Recuperado</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-1">
                            Destino del Elemento:
                          </label>
                          <select
                            value={state.actionTaken}
                            onChange={(e) =>
                              handleItemStateChange(loanItem.id, 'actionTaken', e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded"
                          >
                            <option value="retorno_disponible">Retornar a Disponible</option>
                            <option value="enviar_mantenimiento">Enviar a Mantenimiento</option>
                            <option value="baja_deterioro">Baja por Deterioro Irreversible</option>
                            <option value="pendiente_aclaracion">Pendiente de Aclaración</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={state.observations}
                          onChange={(e) =>
                            handleItemStateChange(loanItem.id, 'observations', e.target.value)
                          }
                          placeholder="Observaciones de recepción sobre este elemento (limpieza, rayaduras, etc.)..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Datos Generales de la Recepción */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Fecha y Hora Real de Devolución
                </label>
                <input
                  type="datetime-local"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg font-mono focus:ring-1 focus:ring-[#39A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Funcionario / Cuentadante que Recibe
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Accesorios y Estuches Devueltos
                </label>
                <input
                  type="text"
                  value={accessoriesReturned}
                  onChange={(e) => setAccessoriesReturned(e.target.value)}
                  placeholder="Estuche rígido, protectores de lentes, llaves de ajuste..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Novedades Generales, Daños o Pérdidas
                </label>
                <input
                  type="text"
                  value={notesDamagesLosses}
                  onChange={(e) => setNotesDamagesLosses(e.target.value)}
                  placeholder="Ninguna novedad / Pendiente informe técnico de instructor"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmReturn}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando Devolución...' : 'Confirmar Recepción y Liquidar'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
