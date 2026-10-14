import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
  Calendar,
  User,
  MapPin,
  ClipboardList,
  Printer,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import {
  InventoryItem,
  Borrower,
  PersonType,
  SystemConfig,
  Loan
} from '../../types/inventory.ts';

interface LoanFormViewProps {
  items: InventoryItem[];
  borrowers: Borrower[];
  config: SystemConfig;
  preselectedItem?: InventoryItem | null;
  onSubmitLoan: (loanPayload: any) => Promise<Loan>;
  onPrintLoanReceipt: (loan: Loan) => void;
  onCancel: () => void;
}

interface CartItem {
  item: InventoryItem;
  quantity: number;
  serialNumber?: string;
}

export const LoanFormView: React.FC<LoanFormViewProps> = ({
  items,
  borrowers,
  config,
  preselectedItem,
  onSubmitLoan,
  onPrintLoanReceipt,
  onCancel
}) => {
  // Step in wizard: 1 = Details & Items, 2 = Review & Confirm
  const [step, setStep] = useState<1 | 2>(1);

  // Selected or New Borrower
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('new');
  const [borrowerData, setBorrowerData] = useState({
    documentId: '',
    fullName: '',
    personType: 'aprendiz' as PersonType,
    fichaNumber: '',
    programName: 'Tecnólogo en Construcción de Edificaciones',
    responsibleInstructor: '',
    email: '',
    phone: '',
    department: 'Ambiente 104 - Concretos'
  });

  // Loan general data
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 16);
  // Default expected return: same day at 17:00 or tomorrow
  const defaultReturn = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [requestDate, setRequestDate] = useState(todayStr);
  const [expectedReturnDate, setExpectedReturnDate] = useState(defaultReturn);
  const [custodianDeliveredBy, setCustodianDeliveredBy] = useState(config.custodianName);
  const [receiverName, setReceiverName] = useState('');
  const [siteType, setSiteType] = useState<'ambiente_formacion' | 'obra_practica' | 'taller' | 'zona_ensayos' | 'aula' | 'otro'>('ambiente_formacion');
  const [siteDescription, setSiteDescription] = useState('Pista de ensayos de mezclas - Taller CTCM');
  const [purposeType, setPurposeType] = useState<'practica_formativa' | 'actividad_academica' | 'ensayo_laboratorio' | 'obra_mantenimiento' | 'otro'>('practica_formativa');
  const [purposeDescription, setPurposeDescription] = useState('Práctica de asentamiento de concreto y toma de probetas cilíndricas');
  const [physicalConditionOut, setPhysicalConditionOut] = useState('Excelente estado de conservación, accesorios completos y limpios.');
  const [accessoriesOut, setAccessoriesOut] = useState('Varilla apisonadora, placa base y herramientas accesorias');
  const [observations, setObservations] = useState('');
  const [signatureAgreement, setSignatureAgreement] = useState(false);

  // Items in loan cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemIdToAdd, setSelectedItemIdToAdd] = useState<string>('');
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedLoan, setCompletedLoan] = useState<Loan | null>(null);

  // If a preselected item was passed from Inventory view
  useEffect(() => {
    if (preselectedItem && preselectedItem.availableQty > 0) {
      setCart([{ item: preselectedItem, quantity: 1, serialNumber: preselectedItem.serialNumber }]);
    }
  }, [preselectedItem]);

  // When picking existing borrower
  const handleSelectBorrower = (id: string) => {
    setSelectedBorrowerId(id);
    if (id === 'new') {
      setBorrowerData({
        documentId: '',
        fullName: '',
        personType: 'aprendiz',
        fichaNumber: '',
        programName: 'Tecnólogo en Construcción de Edificaciones',
        responsibleInstructor: '',
        email: '',
        phone: '',
        department: 'Ambiente 104'
      });
      setReceiverName('');
    } else {
      const b = borrowers.find((x) => x.id === id);
      if (b) {
        setBorrowerData({
          documentId: b.documentId,
          fullName: b.fullName,
          personType: b.personType,
          fichaNumber: b.fichaNumber || '',
          programName: b.programName || '',
          responsibleInstructor: b.responsibleInstructor || '',
          email: b.email || '',
          phone: b.phone || '',
          department: b.department || ''
        });
        setReceiverName(b.fullName);
      }
    }
  };

  // Add item to cart
  const handleAddItemToCart = () => {
    setErrorMessage(null);
    if (!selectedItemIdToAdd) {
      setErrorMessage('Seleccione un elemento de la lista disponible.');
      return;
    }

    const item = items.find((i) => i.id === selectedItemIdToAdd);
    if (!item) return;

    if (item.availableQty <= 0) {
      setErrorMessage(`El elemento '${item.name}' no tiene existencias disponibles en el laboratorio.`);
      return;
    }

    if (qtyToAdd <= 0) {
      setErrorMessage('La cantidad a solicitar debe ser mayor a cero.');
      return;
    }

    // Check if already in cart
    const existingIndex = cart.findIndex((c) => c.item.id === item.id);
    const existingQty = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    const totalRequested = existingQty + qtyToAdd;

    if (totalRequested > item.availableQty) {
      setErrorMessage(
        `No es posible prestar ${totalRequested} unidades de '${item.name}'. Sólo hay ${item.availableQty} disponible(s).`
      );
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qtyToAdd;
      setCart(updated);
    } else {
      setCart([...cart, { item, quantity: qtyToAdd, serialNumber: item.serialNumber }]);
    }

    // Reset selection
    setSelectedItemIdToAdd('');
    setQtyToAdd(1);
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const handleQtyChangeInCart = (index: number, newQty: number) => {
    setErrorMessage(null);
    const target = cart[index];
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    if (newQty > target.item.availableQty) {
      setErrorMessage(`Cantidad solicitada (${newQty}) excede el disponible (${target.item.availableQty}) para '${target.item.name}'.`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const validateStep1 = () => {
    setErrorMessage(null);

    if (!borrowerData.fullName.trim()) {
      setErrorMessage('Debe indicar el nombre completo de la persona solicitante.');
      return false;
    }

    if (borrowerData.personType === 'aprendiz' && !borrowerData.fichaNumber.trim()) {
      setErrorMessage('Para aprendices SENA, el número de ficha del programa es obligatorio.');
      return false;
    }

    if (cart.length === 0) {
      setErrorMessage('Debe agregar al menos un elemento o herramienta al préstamo.');
      return false;
    }

    const dReq = new Date(requestDate);
    const dExp = new Date(expectedReturnDate);
    if (dExp < dReq) {
      setErrorMessage('La fecha prevista de devolución no puede ser anterior a la fecha de salida.');
      return false;
    }

    return true;
  };

  const handleGoToReview = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleConfirmSubmit = async () => {
    setErrorMessage(null);
    if (!signatureAgreement) {
      setErrorMessage('El solicitante debe aceptar la constancia de custodia y devolución de bienes SENA.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        borrowerData: {
          ...borrowerData,
          id: selectedBorrowerId !== 'new' ? selectedBorrowerId : undefined
        },
        items: cart.map((c) => ({
          itemId: c.item.id,
          quantity: c.quantity,
          serialNumber: c.serialNumber
        })),
        requestDate,
        expectedReturnDate,
        custodianDeliveredBy,
        receiverName: receiverName || borrowerData.fullName,
        siteType,
        siteDescription,
        purposeType,
        purposeDescription,
        fichaNumber: borrowerData.fichaNumber,
        physicalConditionOut,
        accessoriesOut,
        observations,
        signatureData: 'Firma Digital Registrada en Sistema'
      };

      const result = await onSubmitLoan(payload);
      setCompletedLoan(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el préstamo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (completedLoan) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-neutral-200 shadow-sm text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#39A900] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs uppercase font-semibold text-[#39A900] tracking-wider">
            Préstamo Registrado con Éxito
          </span>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Comprobante Oficial No. {completedLoan.loanNumber}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Las existencias en inventario han sido actualizadas automáticamente. Se generaron los movimientos de trazabilidad para {completedLoan.items.length} elemento(s).
          </p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-lg text-left text-xs space-y-2 border border-neutral-200">
          <div className="flex justify-between">
            <span className="text-neutral-500">Solicitante:</span>
            <strong className="text-neutral-900">{completedLoan.borrower.fullName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Ficha SENA:</span>
            <span className="font-mono text-neutral-800">{completedLoan.fichaNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Fecha Prevista Devolución:</span>
            <span className="font-mono font-semibold text-neutral-900">
              {new Date(completedLoan.expectedReturnDate).toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Elementos entregados:</span>
            <span className="text-neutral-900 font-semibold">{completedLoan.items.length} ítem(s)</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onPrintLoanReceipt(completedLoan)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comprobante Oficial (PDF)</span>
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
          >
            Finalizar y Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Registrar Préstamo y Salida de Laboratorio
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 font-mono text-neutral-600">
              Paso {step} de 2
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Formulario institucional para entrega de herramientas, instrumentos topográficos y equipos de ensayo.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: FORM */}
      {step === 1 && (
        <div className="space-y-6">
          {/* SECCIÓN A: SOLICITANTE */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#39A900]" />
                <h2 className="text-sm font-bold text-neutral-900">
                  1. Información del Solicitante / Aprendiz / Instructor
                </h2>
              </div>

              {/* Selector de persona registrada o nueva */}
              <div className="flex items-center gap-2 text-xs">
                <label className="text-neutral-500">Seleccionar:</label>
                <select
                  value={selectedBorrowerId}
                  onChange={(e) => handleSelectBorrower(e.target.value)}
                  className="px-2 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="new">+ Registrar Nueva Persona</option>
                  {borrowers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} ({b.personType} - Ficha: {b.fichaNumber || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={borrowerData.fullName}
                  onChange={(e) => {
                    setBorrowerData({ ...borrowerData, fullName: e.target.value });
                    if (!receiverName) setReceiverName(e.target.value);
                  }}
                  placeholder="Ej. Julián David Gómez Restrepo"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Persona <span className="text-rose-500">*</span>
                </label>
                <select
                  value={borrowerData.personType}
                  onChange={(e) => setBorrowerData({ ...borrowerData, personType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="aprendiz">Aprendiz SENA</option>
                  <option value="instructor">Instructor Titular</option>
                  <option value="funcionario">Funcionario / Administrativo</option>
                  <option value="contratista">Contratista de Apoyo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Documento de Identidad (C.C. / T.I.)
                </label>
                <input
                  type="text"
                  value={borrowerData.documentId}
                  onChange={(e) => setBorrowerData({ ...borrowerData, documentId: e.target.value })}
                  placeholder="Número de identificación"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Número de Ficha SENA {borrowerData.personType === 'aprendiz' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={borrowerData.fichaNumber}
                  onChange={(e) => setBorrowerData({ ...borrowerData, fichaNumber: e.target.value })}
                  placeholder="Ej. 2841920"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Instructor Responsable de la Práctica
                </label>
                <input
                  type="text"
                  value={borrowerData.responsibleInstructor}
                  onChange={(e) => setBorrowerData({ ...borrowerData, responsibleInstructor: e.target.value })}
                  placeholder="Nombre del instructor a cargo"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Programa de Formación
                </label>
                <input
                  type="text"
                  value={borrowerData.programName}
                  onChange={(e) => setBorrowerData({ ...borrowerData, programName: e.target.value })}
                  placeholder="Ej. Tecnólogo en Construcción de Edificaciones"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Teléfono / Correo Institucional
                </label>
                <input
                  type="text"
                  value={borrowerData.phone}
                  onChange={(e) => setBorrowerData({ ...borrowerData, phone: e.target.value })}
                  placeholder="Móvil de contacto"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN B: ELEMENTOS A PRESTAR (CARRITO MULTI-ITEM) */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#39A900]" />
                <h2 className="text-sm font-bold text-neutral-900">
                  2. Elementos, Herramientas y Equipos a Entregar
                </h2>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {cart.length} elemento(s) en solicitud
              </span>
            </div>

            {/* Selector de elemento para añadir */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Seleccionar Elemento del Inventario
                </label>
                <select
                  value={selectedItemIdToAdd}
                  onChange={(e) => setSelectedItemIdToAdd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Buscar y seleccionar herramienta o equipo --</option>
                  {items.map((it) => (
                    <option
                      key={it.id}
                      value={it.id}
                      disabled={it.availableQty <= 0}
                    >
                      {it.senaCode} - {it.name} [{it.availableQty} disponibles de {it.totalQty}] {it.availableQty <= 0 ? '(AGOTADO)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono text-center"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItemToCart}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Tabla de elementos agregados */}
            {cart.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-lg">
                No ha agregado ningún elemento a este préstamo. Utilice el selector superior para añadir herramientas.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-semibold text-[10px] uppercase">
                      <th className="py-2.5 px-3">Código SENA</th>
                      <th className="py-2.5 px-3">Elemento</th>
                      <th className="py-2.5 px-2 text-center">Disponible</th>
                      <th className="py-2.5 px-3 text-center">Cantidad a Prestar</th>
                      <th className="py-2.5 px-3 text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {cart.map((entry, idx) => (
                      <tr key={entry.item.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-neutral-800">
                          {entry.item.senaCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">
                          {entry.item.name}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-neutral-500">
                          {entry.item.availableQty} {entry.item.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            max={entry.item.availableQty}
                            value={entry.quantity}
                            onChange={(e) => handleQtyChangeInCart(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-16 px-2 py-1 text-xs border border-neutral-300 rounded text-center font-mono font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECCIÓN C: CONDICIONES, FECHAS Y DESTINO */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Calendar className="w-4 h-4 text-[#39A900]" />
              <h2 className="text-sm font-bold text-neutral-900">
                3. Fechas, Lugar de Uso y Condiciones de Salida
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Fecha y Hora de Salida <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Fecha y Hora Prevista de Devolución <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Sitio o Espacio de Uso
                </label>
                <select
                  value={siteType}
                  onChange={(e) => setSiteType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="ambiente_formacion">Ambiente de Formación Interno</option>
                  <option value="zona_ensayos">Zona de Prácticas / Ensayos</option>
                  <option value="taller">Taller de Estructuras / Concretos</option>
                  <option value="obra_practica">Frente de Obra de Aprendizaje</option>
                  <option value="aula">Aula Teórica</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Descripción Específica del Lugar
                </label>
                <input
                  type="text"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="Ej. Taller 104, pista exterior de mezclas o Bloque C"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Finalidad del Préstamo
                </label>
                <select
                  value={purposeType}
                  onChange={(e) => setPurposeType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="practica_formativa">Práctica Formativa del Programa</option>
                  <option value="ensayo_laboratorio">Ensayo Técnico de Laboratorio</option>
                  <option value="actividad_academica">Demostración Académica de Instructor</option>
                  <option value="obra_mantenimiento">Mantenimiento de Sede / Instalaciones</option>
                  <option value="otro">Otra Actividad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Descripción de la Actividad
                </label>
                <input
                  type="text"
                  value={purposeDescription}
                  onChange={(e) => setPurposeDescription(e.target.value)}
                  placeholder="Ej. Toma de probetas cilíndricas según NTC 550"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Estado Físico al Entregar
                </label>
                <input
                  type="text"
                  value={physicalConditionOut}
                  onChange={(e) => setPhysicalConditionOut(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Accesorios Entregados
                </label>
                <input
                  type="text"
                  value={accessoriesOut}
                  onChange={(e) => setAccessoriesOut(e.target.value)}
                  placeholder="Estuche rígido, llave de ajuste, varilla..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cuentadante que Entrega
                </label>
                <input
                  type="text"
                  value={custodianDeliveredBy}
                  onChange={(e) => setCustodianDeliveredBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Persona que Recibe Físicamente
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nombre de quien retira los elementos"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#39A900]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGoToReview}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span>Continuar al Resumen</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SUMMARY & CONFIRMATION */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-xs uppercase font-semibold text-[#39A900] tracking-wider">
                Verificación Previa
              </span>
              <h2 className="text-base font-bold text-neutral-900 mt-0.5">
                Resumen de la Solicitud de Préstamo
              </h2>
              <p className="text-xs text-neutral-500">
                Revise cuidadosamente los datos antes de descontar las unidades del inventario disponible.
              </p>
            </div>

            {/* Recuadro solicitante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg text-xs">
              <div>
                <div className="text-neutral-500">Persona Solicitante:</div>
                <div className="font-bold text-neutral-900 text-sm mt-0.5">{borrowerData.fullName}</div>
                <div className="text-neutral-600 mt-1">
                  {borrowerData.personType.toUpperCase()} · Doc: {borrowerData.documentId || 'No registrado'}
                </div>
              </div>
              <div>
                <div className="text-neutral-500">Ficha y Programa SENA:</div>
                <div className="font-mono font-bold text-neutral-900 mt-0.5">
                  Ficha No. {borrowerData.fichaNumber || 'N/A'}
                </div>
                <div className="text-neutral-600 mt-1">{borrowerData.programName}</div>
              </div>
            </div>

            {/* Fechas y destino */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="text-neutral-500 block">Salida:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {new Date(requestDate).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="text-neutral-500 block">Devolución Prevista:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {new Date(expectedReturnDate).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <span className="text-neutral-500 block">Lugar / Propósito:</span>
                <span className="font-medium text-neutral-900 truncate block">
                  {siteDescription} · {purposeDescription}
                </span>
              </div>
            </div>

            {/* Lista de elementos a entregar */}
            <div>
              <div className="text-xs font-bold text-neutral-700 uppercase mb-2">
                Herramientas y Equipos a Entregar ({cart.length})
              </div>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Código SENA</th>
                      <th className="py-2.5 px-3">Elemento</th>
                      <th className="py-2.5 px-3 text-center">Cantidad Entregada</th>
                      <th className="py-2.5 px-3">Estado de Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {cart.map((c) => (
                      <tr key={c.item.id}>
                        <td className="py-2.5 px-3 font-mono font-medium text-neutral-800">
                          {c.item.senaCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">
                          {c.item.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-neutral-900">
                          {c.quantity} {c.item.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 text-[11px]">
                          {physicalConditionOut}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Constancia de responsabilidad y firma */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs space-y-3">
              <div className="font-bold text-emerald-950">
                Constancia y Compromiso de Custodia de Bienes Públicos SENA
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                El solicitante declara recibir en perfecto estado de funcionamiento los bienes institucionales detallados,
                comprometiéndose a utilizarlos exclusivamente en actividades formativas del laboratorio y devolverlos
                en la fecha prevista en las mismas condiciones. En caso de daño imputable o pérdida, responderá conforme
                al reglamento del aprendiz y políticas de inventario del SENA.
              </p>
              <label className="flex items-center gap-2 font-medium text-neutral-900 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={signatureAgreement}
                  onChange={(e) => setSignatureAgreement(e.target.checked)}
                  className="rounded text-[#39A900] focus:ring-[#39A900] w-4 h-4 cursor-pointer"
                />
                <span>
                  El solicitante <strong className="text-neutral-950">{borrowerData.fullName}</strong> acepta la custodia y firma la constancia de entrega.
                </span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
              >
                ← Modificar Datos
              </button>

              <button
                type="button"
                disabled={isSubmitting || !signatureAgreement}
                onClick={handleConfirmSubmit}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Procesando Préstamo...' : 'Confirmar y Guardar Préstamo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
