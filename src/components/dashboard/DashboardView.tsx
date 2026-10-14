import React from 'react';
import {
  Package,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  Wrench,
  AlertTriangle,
  Clock,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { DashboardMetrics, SystemConfig, CustodyRecord } from '../../types/inventory.ts';
import labHeroImage from '../../assets/images/sena_construction_lab_1792010184770.jpg';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  config: SystemConfig;
  onNavigate: (tab: any) => void;
  onNewLoan: () => void;
  onReturnFromCustody: (record: CustodyRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  config,
  onNavigate,
  onNewLoan,
  onReturnFromCustody
}) => {
  if (!metrics) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-sm text-neutral-500">Cargando indicadores del laboratorio...</div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Referencias Registradas',
      value: metrics.totalItemsCount,
      subtext: 'Herramientas y equipos únicos',
      icon: Package,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-100'
    },
    {
      label: 'Total Unidades Existentes',
      value: metrics.totalUnitsCount,
      subtext: 'Unidades físicas en inventario',
      icon: Layers,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-100'
    },
    {
      label: 'Unidades Disponibles',
      value: metrics.availableUnitsCount,
      subtext: 'Listas para préstamo inmediato',
      icon: CheckCircle2,
      color: 'text-[#39A900]',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Unidades en Préstamo',
      value: metrics.loanedUnitsCount,
      subtext: 'En poder de aprendices/instructores',
      icon: ArrowUpRight,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'En Mantenimiento',
      value: metrics.maintenanceUnitsCount,
      subtext: 'Calibración o reparación técnica',
      icon: Wrench,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Deterioradas / Bajas',
      value: metrics.damagedUnitsCount,
      subtext: 'Fuera de servicio / En trámite',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    {
      label: 'Préstamos Activos',
      value: metrics.activeLoansCount,
      subtext: 'Solicitudes en circulación',
      icon: Clock,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-100'
    },
    {
      label: 'Préstamos Vencidos',
      value: metrics.overdueLoansCount,
      subtext: 'Requieren devolución inmediata',
      icon: AlertCircle,
      color: metrics.overdueLoansCount > 0 ? 'text-amber-700' : 'text-neutral-500',
      bgColor: metrics.overdueLoansCount > 0 ? 'bg-amber-100' : 'bg-neutral-100'
    },
    {
      label: 'Devoluciones Hoy',
      value: metrics.returnsScheduledTodayCount,
      subtext: 'Programadas para la fecha',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Laboratory Banner */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 text-white shadow-xs">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-luminosity">
          <img
            src={labHeroImage}
            alt="Laboratorio de Construcción SENA"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#39A900]">
              Sistema de Gestión Integral de Inventario y Bienes SENA
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              {config.laboratory || 'Laboratorio de Construcción y Ensayos de Materiales'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              Control físico de herramientas, equipos topográficos, prensas de compresión y moldes.
              Trazabilidad en tiempo real de salidas, custodias y devoluciones bajo la custodia de{' '}
              <strong className="text-white">{config.custodianName}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={onNewLoan}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Nuevo Préstamo de Elementos
            </button>
            <button
              onClick={() => onNavigate('custody')}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              ¿Quién tiene cada elemento?
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-600 truncate">{kpi.label}</span>
                <div className={`p-1.5 rounded-md ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 truncate">{kpi.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Urgent Overdue Alerts Section */}
      {metrics.urgentReturns.length > 0 && (
        <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Alertas de Devoluciones Vencidas ({metrics.urgentReturns.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('custody')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              Ver todas en Custodia <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {metrics.urgentReturns.slice(0, 3).map((alert, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-amber-200 gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-neutral-900">
                    {alert.itemName} <span className="text-neutral-500 font-mono text-[11px]">({alert.senaCode})</span>
                  </div>
                  <div className="text-neutral-600">
                    Solicitante: <strong className="text-neutral-900">{alert.borrowerName}</strong> · Ficha: {alert.fichaNumber}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-700 font-medium font-mono text-[11px] bg-amber-100 px-2 py-0.5 rounded">
                    {alert.daysLate} día(s) de retraso
                  </span>
                  <button
                    onClick={() => onReturnFromCustody(alert)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors cursor-pointer"
                  >
                    Recibir Devolución
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Category Distribution & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">Distribución por Categorías</h2>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Ir al Inventario →
            </button>
          </div>

          <div className="space-y-3">
            {metrics.categoryDistribution.map((cat, idx) => {
              const percentage =
                metrics.totalUnitsCount > 0
                  ? Math.round((cat.units / metrics.totalUnitsCount) * 100)
                  : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-800">{cat.category}</span>
                    <span className="text-neutral-500 font-mono tabular-nums">
                      {cat.units} unid. ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#39A900] rounded-full"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Warning or Recent Movements */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">Últimos Movimientos Registrados</h2>
            <button
              onClick={() => onNavigate('movements')}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Ver Trazabilidad →
            </button>
          </div>

          {metrics.recentMovements.length === 0 ? (
            <div className="text-xs text-neutral-500 py-6 text-center">
              No hay movimientos registrados recientemente.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {metrics.recentMovements.slice(0, 5).map((mov) => (
                <div key={mov.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-neutral-900 truncate">{mov.itemName}</div>
                    <div className="text-neutral-500 text-[11px] truncate">
                      {mov.reason} {mov.borrowerPerson ? `· ${mov.borrowerPerson}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-medium ${
                        mov.quantityChanged > 0
                          ? 'text-[#39A900]'
                          : mov.quantityChanged < 0
                          ? 'text-neutral-700'
                          : 'text-neutral-500'
                      }`}
                    >
                      {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged} unid.
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {new Date(mov.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
