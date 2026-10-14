import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { downloadExcelTemplate } from '../../services/api.ts';
import { InventoryItem } from '../../types/inventory.ts';

interface ImportExcelViewProps {
  existingItems: InventoryItem[];
  onBulkImport: (items: any[]) => Promise<{
    importedCount: number;
    skippedCount: number;
    errors: { row: number; senaCode?: string; name?: string; reason: string }[];
  }>;
  onNavigateToInventory: () => void;
}

export const ImportExcelView: React.FC<ImportExcelViewProps> = ({
  existingItems,
  onBulkImport,
  onNavigateToInventory
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnsInFile, setColumnsInFile] = useState<string[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Column Mappings (System Field -> Column in File)
  const [mappings, setMappings] = useState({
    senaCode: '',
    name: '',
    totalQty: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    unitOfMeasure: '',
    defaultLocation: '',
    description: '',
    notes: ''
  });

  // Preview & Validation State
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [rowValidationErrors, setRowValidationErrors] = useState<
    { row: number; field: string; message: string; isFatal: boolean }[]
  >([]);

  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    errors: { row: number; senaCode?: string; name?: string; reason: string }[];
  } | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file using XLSX
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setImportResult(null);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          alert('El archivo no contiene filas de datos.');
          setIsProcessingFile(false);
          return;
        }

        const headers = Object.keys(json[0]);
        setColumnsInFile(headers);
        setRawRows(json);

        // Auto-detect columns intelligently
        const autoMap: any = { ...mappings };
        headers.forEach((h) => {
          const norm = h.toLowerCase().trim();
          if (norm.includes('sena') || norm.includes('código') || norm.includes('codigo') || norm.includes('placa')) {
            autoMap.senaCode = h;
          } else if (norm.includes('nombre') || norm.includes('elemento') || norm.includes('herramienta') || norm.includes('equipo')) {
            autoMap.name = h;
          } else if (norm.includes('cant') || norm.includes('existencia') || norm.includes('unidad') || norm.includes('stock')) {
            autoMap.totalQty = h;
          } else if (norm.includes('cat') || norm.includes('tipo')) {
            autoMap.category = h;
          } else if (norm.includes('marca')) {
            autoMap.brand = h;
          } else if (norm.includes('modelo')) {
            autoMap.model = h;
          } else if (norm.includes('serie') || norm.includes('serial')) {
            autoMap.serialNumber = h;
          } else if (norm.includes('medida') || norm.includes('unidad')) {
            autoMap.unitOfMeasure = h;
          } else if (norm.includes('ubicaci') || norm.includes('estante') || norm.includes('lugar')) {
            autoMap.defaultLocation = h;
          } else if (norm.includes('descrip')) {
            autoMap.description = h;
          } else if (norm.includes('obs') || norm.includes('nota')) {
            autoMap.notes = h;
          }
        });

        setMappings(autoMap);
        generatePreview(json, autoMap);
      } catch (err: any) {
        alert('Error al leer el archivo: ' + err.message);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Generate preview items and run validation rules
  const generatePreview = (rows: any[], curMappings: typeof mappings) => {
    const existingCodes = new Set(existingItems.map((i) => i.senaCode.trim().toLowerCase()));
    const seenInFileCodes = new Set<string>();

    const items: any[] = [];
    const errors: { row: number; field: string; message: string; isFatal: boolean }[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const senaCode = String(row[curMappings.senaCode] || '').trim();
      const name = String(row[curMappings.name] || '').trim();
      const totalQty = parseInt(String(row[curMappings.totalQty] || '1'), 10) || 1;
      const category = String(row[curMappings.category] || 'Equipo de Laboratorio').trim();
      const brand = String(row[curMappings.brand] || 'Genérico').trim();
      const model = String(row[curMappings.model] || 'Estándar').trim();
      const serialNumber = String(row[curMappings.serialNumber] || '').trim();
      const defaultLocation = String(row[curMappings.defaultLocation] || 'Ambiente 104').trim();
      const description = String(row[curMappings.description] || name).trim();
      const notes = String(row[curMappings.notes] || '').trim();

      // Validations
      if (!senaCode) {
        errors.push({ row: rowNum, field: 'senaCode', message: 'Código SENA vacío', isFatal: true });
      } else if (existingCodes.has(senaCode.toLowerCase())) {
        errors.push({
          row: rowNum,
          field: 'senaCode',
          message: `Código SENA '${senaCode}' ya existe en el inventario actual`,
          isFatal: true
        });
      } else if (seenInFileCodes.has(senaCode.toLowerCase())) {
        errors.push({
          row: rowNum,
          field: 'senaCode',
          message: `Código SENA '${senaCode}' repetido dentro de este mismo archivo`,
          isFatal: true
        });
      } else {
        seenInFileCodes.add(senaCode.toLowerCase());
      }

      if (!name) {
        errors.push({ row: rowNum, field: 'name', message: 'Nombre del elemento obligatorio', isFatal: true });
      }

      items.push({
        _rowNum: rowNum,
        senaCode,
        name,
        totalQty,
        category,
        brand,
        model,
        serialNumber,
        defaultLocation,
        description,
        notes,
        hasError: errors.some((e) => e.row === rowNum && e.isFatal)
      });
    });

    setPreviewItems(items);
    setRowValidationErrors(errors);
  };

  const handleMappingChange = (field: keyof typeof mappings, val: string) => {
    const updated = { ...mappings, [field]: val };
    setMappings(updated);
    generatePreview(rawRows, updated);
  };

  const handleExecuteImport = async () => {
    const fatalRows = new Set(rowValidationErrors.filter((e) => e.isFatal).map((e) => e.row));
    const validItems = previewItems.filter((i) => !fatalRows.has(i._rowNum));

    if (validItems.length === 0) {
      alert('No hay filas válidas para importar. Corrija los errores de mapeo o código.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await onBulkImport(validItems);
      setImportResult(res);
    } catch (err: any) {
      alert('Error en importación: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRawRows([]);
    setPreviewItems([]);
    setRowValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Importación Masiva de Inventario (Excel / CSV)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cargue su base de datos existente (.xlsx, .csv), relacione columnas, valide códigos duplicados e incorpore los elementos al sistema.
          </p>
        </div>

        <button
          onClick={downloadExcelTemplate}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[#39A900]" />
          <span>Descargar Plantilla Oficial Excel</span>
        </button>
      </div>

      {/* FINAL REPORT BANNER IF IMPORT COMPLETED */}
      {importResult && (
        <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#39A900] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Resultado de la Importación Masiva
              </h2>
              <p className="text-xs text-neutral-500">
                Base de datos actualizada con los nuevos registros y movimientos de trazabilidad generados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-[11px] text-emerald-800 uppercase font-semibold">
                Registros Importados
              </div>
              <div className="text-2xl font-bold font-mono text-[#39A900] mt-1">
                {importResult.importedCount}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[11px] text-neutral-600 uppercase font-semibold">
                Omitidos / Duplicados
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-800 mt-1">
                {importResult.skippedCount}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[11px] text-neutral-600 uppercase font-semibold">
                Total Procesados
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                {importResult.importedCount + importResult.skippedCount}
              </div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs font-semibold text-neutral-700">
                Detalle de filas no importadas ({importResult.errors.length}):
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                {importResult.errors.map((err, i) => (
                  <div key={i} className="p-2 bg-rose-50 rounded text-rose-800 text-[11px]">
                    Fila {err.row}: {err.reason} {err.senaCode ? `(Código: ${err.senaCode})` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
            <button
              onClick={onNavigateToInventory}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer"
            >
              Ver Inventario Actualizado →
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
            >
              Cargar Otro Archivo
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: FILE DROP AREA */}
      {!file && !importResult && (
        <div className="p-10 bg-white rounded-xl border-2 border-dashed border-neutral-300 hover:border-[#39A900] transition-colors text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#39A900] flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-900">
              Seleccione o arrastre su archivo de inventario
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Formatos compatibles: Microsoft Excel (.xlsx, .xls) o valores separados por comas (.csv).
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="excel-file-upload"
            />
            <label
              htmlFor="excel-file-upload"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Examinar Archivo en el Equipo</span>
            </label>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2">
            No es necesario que las columnas tengan nombres exactos: podrá relacionarlas en el siguiente paso.
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & PREVIEW */}
      {file && !importResult && (
        <div className="space-y-6">
          {/* File summary pill */}
          <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-[#39A900]" />
              <div>
                <div className="text-xs font-bold text-neutral-900">{file.name}</div>
                <div className="text-[11px] text-neutral-500">
                  {rawRows.length} fila(s) detectadas · {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
            >
              Cambiar Archivo
            </button>
          </div>

          {/* Column Relationship Mapping Form */}
          <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-2">
              <h3 className="text-sm font-bold text-neutral-900">
                1. Relacionar Columnas del Archivo con Campos del SENA
              </h3>
              <p className="text-xs text-neutral-500">
                Asigne qué columna de su Excel corresponde a cada dato institucional.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Código SENA <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mappings.senaCode}
                  onChange={(e) => handleMappingChange('senaCode', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {columnsInFile.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Nombre del Elemento <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mappings.name}
                  onChange={(e) => handleMappingChange('name', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {columnsInFile.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Cantidad / Existencias
                </label>
                <select
                  value={mappings.totalQty}
                  onChange={(e) => handleMappingChange('totalQty', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Por defecto (1 unidad) --</option>
                  {columnsInFile.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Categoría</label>
                <select
                  value={mappings.category}
                  onChange={(e) => handleMappingChange('category', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Por defecto (Equipo Lab) --</option>
                  {columnsInFile.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Marca</label>
                <select
                  value={mappings.brand}
                  onChange={(e) => handleMappingChange('brand', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Opcional --</option>
                  {columnsInFile.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Ubicación</label>
                <select
                  value={mappings.defaultLocation}
                  onChange={(e) => handleMappingChange('defaultLocation', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded focus:ring-1 focus:ring-[#39A900]"
                >
                  <option value="">-- Por defecto (Ambiente 104) --</option>
                  {columnsInFile.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Validation Status Notice */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-neutral-200 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              {rowValidationErrors.filter((e) => e.isFatal).length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
              )}
              <span>
                <strong>{previewItems.length - rowValidationErrors.filter((e) => e.isFatal).length}</strong> filas válidas de {previewItems.length}.
                {rowValidationErrors.filter((e) => e.isFatal).length > 0 && (
                  <span className="text-amber-800 ml-1">
                    ({rowValidationErrors.filter((e) => e.isFatal).length} fila(s) contienen duplicados o datos faltantes).
                  </span>
                )}
              </span>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={isImporting || previewItems.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isImporting ? 'Importando...' : 'Confirmar e Importar Filas Válidas'}</span>
            </button>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-neutral-100 text-xs font-bold text-neutral-800">
              2. Vista Previa de Filas a Importar ({previewItems.length})
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-semibold text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Fila</th>
                    <th className="py-2.5 px-3">Código SENA</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-2 text-center">Cant.</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Marca</th>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3">Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {previewItems.map((item) => {
                    const rowErr = rowValidationErrors.find((e) => e.row === item._rowNum);

                    return (
                      <tr
                        key={item._rowNum}
                        className={rowErr?.isFatal ? 'bg-rose-50/50' : 'hover:bg-neutral-50/50'}
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-neutral-500">
                          #{item._rowNum}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-neutral-900">
                          {item.senaCode || <span className="text-rose-600 italic">Vacío</span>}
                        </td>
                        <td className="py-2 px-3 font-medium text-neutral-900">
                          {item.name || <span className="text-rose-600 italic">Vacío</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold">
                          {item.totalQty}
                        </td>
                        <td className="py-2 px-3 text-neutral-600">{item.category}</td>
                        <td className="py-2 px-3 text-neutral-600">{item.brand}</td>
                        <td className="py-2 px-3 text-neutral-600">{item.defaultLocation}</td>
                        <td className="py-2 px-3">
                          {rowErr ? (
                            <span className="text-rose-700 text-[11px] font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{rowErr.message}</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>Válido</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
