import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  FileSpreadsheet,
  FileText,
  Settings,
  AlertCircle
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'custody'
  | 'inventory'
  | 'loans'
  | 'returns'
  | 'movements'
  | 'import'
  | 'reports'
  | 'config';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeLoansCount: number;
  overdueLoansCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeLoansCount,
  overdueLoansCount
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Panel Principal',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'custody' as ActiveTab,
      label: '¿Quién tiene cada elemento?',
      icon: Users,
      badge: overdueLoansCount > 0 ? `${overdueLoansCount} vencidos` : (activeLoansCount > 0 ? `${activeLoansCount}` : null),
      badgeColor: overdueLoansCount > 0 ? 'text-amber-700 bg-amber-50' : 'text-neutral-600 bg-neutral-100',
      isHighlight: true
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventario de Laboratorio',
      icon: Package,
      badge: null
    },
    {
      id: 'loans' as ActiveTab,
      label: 'Préstamos y Salidas',
      icon: ArrowUpRight,
      badge: activeLoansCount > 0 ? `${activeLoansCount} activos` : null,
      badgeColor: 'text-[#39A900] bg-emerald-50'
    },
    {
      id: 'returns' as ActiveTab,
      label: 'Devoluciones y Recepción',
      icon: ArrowDownLeft,
      badge: null
    },
    {
      id: 'movements' as ActiveTab,
      label: 'Historial y Trazabilidad',
      icon: History,
      badge: null
    },
    {
      id: 'import' as ActiveTab,
      label: 'Importar Excel / CSV',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Informes y Exportaciones',
      icon: FileText,
      badge: null
    },
    {
      id: 'config' as ActiveTab,
      label: 'Configuración Cuentadante',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 select-none">
      {/* Institutional header badge */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/60">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
          Servicio Nacional de Aprendizaje
        </div>
        <div className="text-xs font-medium text-neutral-800 mt-0.5">
          Regional Distrito Capital
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#39A900]' : 'text-neutral-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 font-mono ${
                    isActive ? 'bg-neutral-800 text-neutral-200' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Overdue alert indicator in sidebar footer if any loans are late */}
      {overdueLoansCount > 0 && (
        <div className="p-3 mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-semibold">Atención Préstamos</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Hay {overdueLoansCount} préstamo(s) con fecha de devolución vencida.
              </div>
              <button
                onClick={() => setActiveTab('custody')}
                className="mt-1.5 text-[11px] font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
              >
                Ver en Custodia Activa →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-neutral-100 text-[11px] text-neutral-400 text-center">
        Laboratorio de Construcción SENA · v2.4
      </div>
    </aside>
  );
};
