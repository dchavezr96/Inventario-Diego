import React from 'react';
import { HardHat, Plus, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { SystemConfig } from '../../types/inventory.ts';

interface HeaderProps {
  config: SystemConfig;
  userRole: 'administrador' | 'cuentadante' | 'auditor';
  setUserRole: (role: 'administrador' | 'cuentadante' | 'auditor') => void;
  onNewLoan: () => void;
  onNewItem: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  userRole,
  setUserRole,
  onNewLoan,
  onNewItem
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-neutral-200">
      {/* Zone 1: Brand Wordmark (Single text element with icon) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#39A900] text-white shadow-xs">
          <HardHat className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-neutral-900 whitespace-nowrap">
            SENA <span className="text-[#39A900]">LabConstrucción</span>
          </span>
          <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[280px]">
            {config.center || 'Centro de Tecnologías para la Construcción y la Madera'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation contextual info & quick role selector */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-800">Cuentadante:</span>
          <span className="text-neutral-600 truncate max-w-[220px]">{config.custodianName}</span>
        </div>
        <span aria-hidden="true" className="text-neutral-300">|</span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-800">Ambiente:</span>
          <span className="text-neutral-600 truncate max-w-[180px]">{config.environmentCode}</span>
        </div>
        <span aria-hidden="true" className="text-neutral-300">|</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#39A900]" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as any)}
            className="bg-neutral-100 border border-neutral-200 text-neutral-800 rounded px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#39A900]"
            title="Cambiar rol de usuario"
          >
            <option value="cuentadante">Rol: Cuentadante</option>
            <option value="administrador">Rol: Administrador</option>
            <option value="auditor">Rol: Auditoría / Consulta</option>
          </select>
        </div>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onNewLoan}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8800] rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Registrar Préstamo</span>
        </button>

        {userRole !== 'auditor' && (
          <button
            onClick={onNewItem}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Nuevo Elemento</span>
          </button>
        )}
      </div>
    </header>
  );
};
