import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Loan, ReturnRecord, SystemConfig } from '../../types/inventory.ts';

interface PrintReceiptModalProps {
  loan?: Loan | null;
  returnRecord?: ReturnRecord | null;
  config: SystemConfig;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  loan,
  returnRecord,
  config,
  onClose
}) => {
  if (!loan && !returnRecord) return null;

  const isReturn = !!returnRecord;
  const receiptTitle = isReturn
    ? 'COMPROBANTE OFICIAL DE RECEPCIÓN Y DEVOLUCIÓN DE BIENES'
    : 'COMPROBANTE OFICIAL DE SALIDA Y PRÉSTAMO DE HERRAMIENTAS Y EQUIPOS';
  const receiptCode = isReturn ? returnRecord?.returnNumber : loan?.loanNumber;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-300 max-w-3xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Controls (No print) */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-100 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#39A900]" />
            <span className="text-xs font-bold text-neutral-800">
              Vista Previa de Impresión Oficial (PDF)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-neutral-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="p-8 sm:p-10 space-y-6 text-neutral-900 bg-white">
          {/* Institutional Header with SENA Logo lockup */}
          <div className="border-b-2 border-neutral-900 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold tracking-tight text-neutral-900 uppercase">
                  SERVICIO NACIONAL DE APRENDIZAJE - SENA
                </div>
                <div className="text-xs font-semibold text-[#39A900]">
                  {config.regional} · {config.center}
                </div>
                <div className="text-xs text-neutral-700">
                  {config.laboratory} · {config.environmentCode}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-neutral-100 border border-neutral-300 rounded font-mono font-bold text-xs text-neutral-900">
                  {receiptCode}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  Fecha Emisión: {new Date().toLocaleDateString('es-CO')}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide border-t border-b border-neutral-200 py-1.5 text-neutral-900">
                {receiptTitle}
              </h1>
            </div>
          </div>

          {/* Section: Applicant & Custody Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="space-y-1">
              <div>
                <span className="text-neutral-500 font-medium">Persona Solicitante / Custodio: </span>
                <strong className="text-neutral-900">
                  {isReturn ? returnRecord?.borrowerName : loan?.borrower.fullName}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Documento de Identidad: </span>
                <span className="font-mono text-neutral-800">
                  {isReturn ? returnRecord?.borrowerDocument : loan?.borrower.documentId || 'C.C. Registrada'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Tipo de Vinculación: </span>
                <span className="uppercase text-neutral-800 font-semibold">
                  {loan?.borrower.personType || 'APRENDIZ'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Programa de Formación: </span>
                <span className="text-neutral-800">
                  {loan?.borrower.programName || 'Construcción y Obras Civiles'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-neutral-500 font-medium">Número de Ficha SENA: </span>
                <strong className="font-mono text-neutral-900">
                  {isReturn ? returnRecord?.fichaNumber : loan?.fichaNumber}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Instructor Responsable: </span>
                <span className="text-neutral-800">
                  {loan?.borrower.responsibleInstructor || 'Coordinación Académica'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">
                  {isReturn ? 'Fecha de Devolución:' : 'Fecha y Hora de Salida:'}{' '}
                </span>
                <span className="font-mono font-semibold text-neutral-900">
                  {isReturn
                    ? new Date(returnRecord?.returnDate || '').toLocaleString('es-CO')
                    : new Date(loan?.requestDate || '').toLocaleString('es-CO')}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Devolución Prevista: </span>
                <span className="font-mono font-semibold text-neutral-900">
                  {loan ? new Date(loan.expectedReturnDate).toLocaleString('es-CO') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Items Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Detalle de Elementos, Herramientas y Equipos:
            </div>

            <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2.5 border-r border-neutral-300">Ítem</th>
                  <th className="py-2 px-2.5 border-r border-neutral-300">Código SENA</th>
                  <th className="py-2 px-3 border-r border-neutral-300 min-w-[200px]">
                    Descripción del Elemento
                  </th>
                  <th className="py-2 px-2 text-center border-r border-neutral-300">Cant.</th>
                  <th className="py-2 px-2.5 border-r border-neutral-300">Unidad</th>
                  <th className="py-2 px-3">
                    {isReturn ? 'Condición al Retornar' : 'Estado de Salida y Accesorios'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {!isReturn &&
                  loan?.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2 px-2.5 border-r border-neutral-300 font-mono text-center">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-neutral-300 font-mono font-bold">
                        {it.itemSenaCode}
                      </td>
                      <td className="py-2 px-3 border-r border-neutral-300 font-medium">
                        {it.itemName}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r border-neutral-300">
                        {it.quantityDelivered}
                      </td>
                      <td className="py-2 px-2.5 border-r border-neutral-300 text-neutral-600">
                        {it.unitOfMeasure}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-neutral-700">
                        {loan.physicalConditionOut}
                        {loan.accessoriesOut ? ` · Accesorios: ${loan.accessoriesOut}` : ''}
                      </td>
                    </tr>
                  ))}

                {isReturn &&
                  returnRecord?.items.map((retIt, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2.5 border-r border-neutral-300 font-mono text-center">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-neutral-300 font-mono font-bold">
                        {retIt.itemSenaCode}
                      </td>
                      <td className="py-2 px-3 border-r border-neutral-300 font-medium">
                        {retIt.itemName}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r border-neutral-300">
                        {retIt.quantityReturned}
                      </td>
                      <td className="py-2 px-2.5 border-r border-neutral-300 text-neutral-600">
                        Unidad
                      </td>
                      <td className="py-2 px-3 text-[11px] text-neutral-700">
                        Condición: <strong>{retIt.conditionOnReturn.toUpperCase().replace('_', ' ')}</strong>. Acción:{' '}
                        {retIt.actionTaken.replace('_', ' ')}
                        {retIt.observations ? ` (${retIt.observations})` : ''}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Site and purpose details */}
          {loan && !isReturn && (
            <div className="text-xs p-3 bg-neutral-50 rounded border border-neutral-200 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500 font-medium">Sitio de Uso: </span>
                <span className="text-neutral-900 font-semibold">{loan.siteDescription}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Finalidad: </span>
                <span className="text-neutral-900 font-semibold">{loan.purposeDescription}</span>
              </div>
            </div>
          )}

          {/* Legal Custody Declaration Text */}
          <div className="p-3 bg-neutral-50 rounded border border-neutral-300 text-[10px] text-neutral-600 leading-relaxed text-justify">
            <strong>DECLARACIÓN DE CUSTODIA Y RESPONSABILIDAD:</strong> De conformidad con el Manual de
            Administración y Control de Bienes del SENA, el solicitante asume la custodia directa y cuidado
            patrimonial de las herramientas y equipos entregados. Se compromete a operarlos únicamente en
            las actividades formativas autorizadas, adoptar las medidas de bioseguridad pertinentes y devolverlos
            en la fecha prevista en óptimo estado de conservación y aseo. Cualquier novedad, daño o pérdida
            deberá reportarse de inmediato al cuentadante del laboratorio.
          </div>

          {/* Signatures Grid */}
          <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs print-break-inside-avoid">
            <div className="space-y-1">
              <div className="border-t border-neutral-500 pt-1 font-bold text-neutral-900">
                {isReturn ? returnRecord?.receiverName : config.custodianName}
              </div>
              <div className="text-[11px] text-neutral-600">
                {config.custodianRole}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                Cuentadante / Entrega - Recibe
              </div>
            </div>

            <div className="space-y-1">
              <div className="border-t border-neutral-500 pt-1 font-bold text-neutral-900">
                {isReturn ? returnRecord?.borrowerName : loan?.borrower.fullName}
              </div>
              <div className="text-[11px] text-neutral-600">
                Doc: {isReturn ? returnRecord?.borrowerDocument : loan?.borrower.documentId || 'C.C.'} · Ficha:{' '}
                {isReturn ? returnRecord?.fichaNumber : loan?.fichaNumber}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                Firma Solicitante / Aprendiz / Instructor
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
