import * as XLSX from 'xlsx';
import {
  InventoryItem,
  Borrower,
  Loan,
  ReturnRecord,
  InventoryMovement,
  SystemConfig,
  DashboardMetrics,
  CustodyRecord
} from '../types/inventory.ts';

const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers
    }
  });

  if (!res.ok) {
    let errorMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errorMessage = errorJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Config
  getConfig: () => fetchApi<SystemConfig>('/config'),
  updateConfig: (config: Partial<SystemConfig>, actor?: string) =>
    fetchApi<SystemConfig>('/config', {
      method: 'PUT',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(config)
    }),

  // Dashboard
  getDashboard: () => fetchApi<DashboardMetrics>('/dashboard'),

  // Inventory
  getItems: () => fetchApi<InventoryItem[]>('/inventory'),
  getItem: (id: string) => fetchApi<InventoryItem>(`/inventory/${id}`),
  createItem: (item: any, actor?: string) =>
    fetchApi<InventoryItem>('/inventory', {
      method: 'POST',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(item)
    }),
  updateItem: (id: string, item: any, actor?: string) =>
    fetchApi<InventoryItem>(`/inventory/${id}`, {
      method: 'PUT',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(item)
    }),
  deleteItem: (id: string, actor?: string) =>
    fetchApi<{ success: boolean }>(`/inventory/${id}`, {
      method: 'DELETE',
      headers: actor ? { 'x-actor-name': actor } : {}
    }),

  // Borrowers
  getBorrowers: () => fetchApi<Borrower[]>('/borrowers'),
  createBorrower: (borrower: any, actor?: string) =>
    fetchApi<Borrower>('/borrowers', {
      method: 'POST',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(borrower)
    }),

  // Loans
  getLoans: () => fetchApi<Loan[]>('/loans'),
  getLoan: (id: string) => fetchApi<Loan>(`/loans/${id}`),
  createLoan: (payload: any, actor?: string) =>
    fetchApi<Loan>('/loans', {
      method: 'POST',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(payload)
    }),

  // Returns
  processReturn: (payload: any, actor?: string) =>
    fetchApi<ReturnRecord>('/returns', {
      method: 'POST',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(payload)
    }),

  // Custody
  getCustody: () => fetchApi<CustodyRecord[]>('/custody'),

  // Movements
  getMovements: (itemId?: string) =>
    fetchApi<InventoryMovement[]>(`/movements${itemId ? `?itemId=${itemId}` : ''}`),

  // Bulk Import
  bulkImport: (items: any[], actor?: string) =>
    fetchApi<{
      importedCount: number;
      skippedCount: number;
      errors: { row: number; senaCode?: string; name?: string; reason: string }[];
    }>('/import', {
      method: 'POST',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify({ items })
    }),

  // Backup & Restore
  downloadBackupUrl: `${API_BASE}/backup`,
  restoreBackup: (data: any, actor?: string) =>
    fetchApi<{ success: boolean; message: string }>('/backup/restore', {
      method: 'POST',
      headers: actor ? { 'x-actor-name': actor } : {},
      body: JSON.stringify(data)
    })
};

// Export to Excel / CSV client-side utility using xlsx
export function exportDataToExcel(filename: string, sheets: { name: string; data: any[] }[]) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportDataToCSV(filename: string, data: any[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate template for download
export function downloadExcelTemplate() {
  const templateData = [
    {
      'Código SENA': 'SENA-CTCM-0104-099',
      'Código Interno': 'LAB-ENS-99',
      'Nombre': 'Prensa Hidráulica Digital para Probetas de Concreto',
      'Descripción Detallada': 'Prensa de ensayo a compresión 2000 kN con celda de carga de precisión.',
      'Categoría': 'Equipo de Laboratorio',
      'Marca': 'Pinzuar',
      'Modelo': 'PH-2000-E',
      'Número de Serie': 'PZ-2025-001',
      'Unidad de Medida': 'Unidad',
      'Cantidad': 1,
      'Ubicación': 'Zona de Rotura de Probetas',
      'Fecha Adquisición': '2025-04-12',
      'Observaciones': 'Mantenimiento y calibración semestral obligatoria.'
    },
    {
      'Código SENA': 'SENA-CTCM-0104-100',
      'Código Interno': 'LAB-MAN-50',
      'Nombre': 'Juego de Palas de Punta Herragro con Cabo Madera',
      'Descripción Detallada': 'Pala forjada para manipulación de áridos y dosificación.',
      'Categoría': 'Herramienta Manual',
      'Marca': 'Herragro',
      'Modelo': 'Pala Redonda No. 2',
      'Número de Serie': '',
      'Unidad de Medida': 'Unidad',
      'Cantidad': 8,
      'Ubicación': 'Bodega de Materiales y Áridos',
      'Fecha Adquisición': '2025-02-10',
      'Observaciones': 'Limpiar con agua y secar antes de guardar.'
    }
  ];

  exportDataToExcel('Plantilla_Inventario_SENA_Laboratorio', [
    { name: 'Plantilla_Inventario', data: templateData }
  ]);
}
