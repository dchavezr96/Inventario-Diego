import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, ActiveTab } from './components/layout/Sidebar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { CustodyControlView } from './components/custody/CustodyControlView.tsx';
import { InventoryView } from './components/inventory/InventoryView.tsx';
import { LoanFormView } from './components/loans/LoanFormView.tsx';
import { ReturnManagementView } from './components/returns/ReturnManagementView.tsx';
import { MovementsHistoryView } from './components/movements/MovementsHistoryView.tsx';
import { ImportExcelView } from './components/import/ImportExcelView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { CustodianConfigView } from './components/config/CustodianConfigView.tsx';
import { PrintReceiptModal } from './components/common/PrintReceiptModal.tsx';
import {
  InventoryItem,
  Borrower,
  Loan,
  ReturnRecord,
  InventoryMovement,
  SystemConfig,
  DashboardMetrics,
  CustodyRecord
} from './types/inventory.ts';
import { api } from './services/api.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_CONFIG: SystemConfig = {
  institutionName: 'SENA - Servicio Nacional de Aprendizaje',
  regional: 'Regional Distrito Capital',
  center: 'Centro de Tecnologías para la Construcción y la Madera (CTCM)',
  laboratory: 'Laboratorio de Materiales, Mezclas y Ensayos de Construcción',
  custodianName: 'Arq. Carlos Andrés Mendieta Peña',
  custodianId: 'C.C. 80.194.520',
  custodianRole: 'Instructor Técnico Cuentadante Principal',
  custodianPhone: '+57 (601) 546 1500 Ext. 14220',
  custodianEmail: 'cmendieta@sena.edu.co',
  environmentCode: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
  address: 'Calle 52 Sur No. 13-65, Sede Cazucá, Bogotá D.C.',
  inventoryPrefix: 'SENA-CTCM-LAB',
  loanPrefix: 'PRE-2026',
  returnPrefix: 'DEV-2026'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [userRole, setUserRole] = useState<'administrador' | 'cuentadante' | 'auditor'>('cuentadante');

  // Application Data State
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [custody, setCustody] = useState<CustodyRecord[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  // Navigation contexts & pre-selections
  const [preselectedItemForLoan, setPreselectedItemForLoan] = useState<InventoryItem | null>(null);
  const [preselectedLoanForReturn, setPreselectedLoanForReturn] = useState<Loan | null>(null);
  const [historyFilterItemId, setHistoryFilterItemId] = useState<string | null>(null);

  // Receipt Modal State
  const [receiptLoan, setReceiptLoan] = useState<Loan | null>(null);
  const [receiptReturn, setReceiptReturn] = useState<ReturnRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch all live data from backend
  const loadAppData = useCallback(async () => {
    try {
      setLoadError(null);
      const [
        cfgRes,
        dashRes,
        itemsRes,
        borrowersRes,
        loansRes,
        custodyRes,
        movementsRes
      ] = await Promise.all([
        api.getConfig().catch(() => DEFAULT_CONFIG),
        api.getDashboard().catch(() => null),
        api.getItems().catch(() => []),
        api.getBorrowers().catch(() => []),
        api.getLoans().catch(() => []),
        api.getCustody().catch(() => []),
        api.getMovements().catch(() => [])
      ]);

      if (cfgRes) setConfig(cfgRes);
      if (dashRes) setMetrics(dashRes);
      setItems(itemsRes);
      setBorrowers(borrowersRes);
      setLoans(loansRes);
      setCustody(custodyRes);
      setMovements(movementsRes);
    } catch (err: any) {
      console.error('Error loading app data:', err);
      setLoadError(err.message || 'No se pudo conectar con el motor de base de datos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Operations Handlers
  const handleSaveItem = async (itemData: any) => {
    await api.createItem(itemData, config.custodianName);
    await loadAppData();
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    await api.updateItem(id, updates, config.custodianName);
    await loadAppData();
  };

  const handleDeleteItem = async (id: string) => {
    await api.deleteItem(id, config.custodianName);
    await loadAppData();
  };

  const handleSubmitLoan = async (payload: any): Promise<Loan> => {
    const result = await api.createLoan(payload, config.custodianName);
    await loadAppData();
    return result;
  };

  const handleProcessReturn = async (payload: any): Promise<ReturnRecord> => {
    const result = await api.processReturn(payload, config.custodianName);
    await loadAppData();
    return result;
  };

  const handleBulkImport = async (importItems: any[]) => {
    const res = await api.bulkImport(importItems, config.custodianName);
    await loadAppData();
    return res;
  };

  const handleUpdateConfig = async (newConfig: Partial<SystemConfig>) => {
    const updated = await api.updateConfig(newConfig, config.custodianName);
    setConfig(updated);
    await loadAppData();
  };

  const handleRestoreBackup = async (backupData: any) => {
    await api.restoreBackup(backupData, config.custodianName);
    await loadAppData();
  };

  // Quick navigation shortcuts
  const handleQuickLoanItem = (item: InventoryItem) => {
    setPreselectedItemForLoan(item);
    setActiveTab('loans');
  };

  const handleReturnFromCustody = (record: CustodyRecord) => {
    const loan = loans.find((l) => l.id === record.loanId) || null;
    setPreselectedLoanForReturn(loan);
    setActiveTab('returns');
  };

  const handleViewLoanDetail = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (loan) {
      setReceiptLoan(loan);
      setReceiptReturn(null);
    }
  };

  const handleViewItemHistory = (item: InventoryItem) => {
    setHistoryFilterItemId(item.id);
    setActiveTab('movements');
  };

  const overdueCount = custody.filter((c) => c.isOverdue || c.daysLate > 0).length;
  const activeCount = loans.filter((l) => l.status === 'activo' || l.status === 'devuelto_parcial' || l.status === 'vencido').length;

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      {/* Top Bar with 3-Zone contract */}
      <Header
        config={config}
        userRole={userRole}
        setUserRole={setUserRole}
        onNewLoan={() => {
          setPreselectedItemForLoan(null);
          setActiveTab('loans');
        }}
        onNewItem={() => {
          setActiveTab('inventory');
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (No print) */}
        <div className="no-print hidden md:flex">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab !== 'movements') setHistoryFilterItemId(null);
              if (tab !== 'loans') setPreselectedItemForLoan(null);
              if (tab !== 'returns') setPreselectedLoanForReturn(null);
              setActiveTab(tab);
            }}
            activeLoansCount={activeCount}
            overdueLoansCount={overdueCount}
          />
        </div>

        {/* Main Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loadError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loadError}</span>
              </div>
              <button
                onClick={loadAppData}
                className="px-2.5 py-1 bg-white border border-rose-200 rounded text-rose-900 font-semibold cursor-pointer"
              >
                Reintentar Conexión
              </button>
            </div>
          )}

          {/* Render Active View */}
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              config={config}
              onNavigate={(tab) => setActiveTab(tab)}
              onNewLoan={() => setActiveTab('loans')}
              onReturnFromCustody={handleReturnFromCustody}
            />
          )}

          {activeTab === 'custody' && (
            <CustodyControlView
              custodyRecords={custody}
              onOpenReturnModal={handleReturnFromCustody}
              onViewLoanDetail={handleViewLoanDetail}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              items={items}
              config={config}
              userRole={userRole}
              onSaveItem={handleSaveItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onViewItemHistory={handleViewItemHistory}
              onQuickLoanItem={handleQuickLoanItem}
            />
          )}

          {activeTab === 'loans' && (
            <LoanFormView
              items={items}
              borrowers={borrowers}
              config={config}
              preselectedItem={preselectedItemForLoan}
              onSubmitLoan={handleSubmitLoan}
              onPrintLoanReceipt={(loan) => {
                setReceiptLoan(loan);
                setReceiptReturn(null);
              }}
              onCancel={() => setActiveTab('custody')}
            />
          )}

          {activeTab === 'returns' && (
            <ReturnManagementView
              loans={loans}
              config={config}
              preselectedLoan={preselectedLoanForReturn}
              onProcessReturn={handleProcessReturn}
              onPrintReturnReceipt={(ret) => {
                setReceiptReturn(ret);
                setReceiptLoan(null);
              }}
            />
          )}

          {activeTab === 'movements' && (
            <MovementsHistoryView
              movements={movements}
              filterItemId={historyFilterItemId}
              onClearItemFilter={() => setHistoryFilterItemId(null)}
            />
          )}

          {activeTab === 'import' && (
            <ImportExcelView
              existingItems={items}
              onBulkImport={handleBulkImport}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              items={items}
              loans={loans}
              custody={custody}
              movements={movements}
              config={config}
            />
          )}

          {activeTab === 'config' && (
            <CustodianConfigView
              config={config}
              userRole={userRole}
              onUpdateConfig={handleUpdateConfig}
              onRestoreBackup={handleRestoreBackup}
            />
          )}
        </main>
      </div>

      {/* Official Printable Receipt Modal */}
      {(receiptLoan || receiptReturn) && (
        <PrintReceiptModal
          loan={receiptLoan}
          returnRecord={receiptReturn}
          config={config}
          onClose={() => {
            setReceiptLoan(null);
            setReceiptReturn(null);
          }}
        />
      )}
    </div>
  );
}
