export type ItemCategory =
  | 'Herramienta Manual'
  | 'Herramienta Eléctrica'
  | 'Equipo de Laboratorio'
  | 'Instrumento de Medición'
  | 'Maquinaria'
  | 'Material de Construcción'
  | 'Elemento de Protección Personal (EPP)'
  | 'Mobiliario'
  | 'Otro';

export type ItemStatus = 'operativo' | 'en_mantenimiento' | 'deteriorado' | 'baja';

export type UnitOfMeasure =
  | 'Unidad'
  | 'Juego'
  | 'Kit'
  | 'Metro'
  | 'Kilogramo'
  | 'Litro'
  | 'Bolsa'
  | 'Caja'
  | 'Par';

export interface InventoryItem {
  id: string;
  senaCode: string;
  internalCode: string;
  name: string;
  description: string;
  category: ItemCategory;
  brand: string;
  model: string;
  serialNumber?: string;
  unitOfMeasure: UnitOfMeasure;
  initialQty: number;
  totalQty: number;
  availableQty: number;
  loanedQty: number;
  maintenanceQty: number;
  damagedQty: number;
  status: ItemStatus;
  defaultLocation: string;
  acquisitionDate?: string;
  notes?: string;
  photoUrl?: string;
  custodianName: string;
  custodianId: string;
  department: string;
  custodyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PersonType = 'aprendiz' | 'instructor' | 'funcionario' | 'contratista' | 'otro';

export interface Borrower {
  id: string;
  documentId: string;
  fullName: string;
  personType: PersonType;
  fichaNumber: string;
  programName: string;
  responsibleInstructor?: string;
  email?: string;
  phone?: string;
  department?: string;
  createdAt: string;
  activeLoansCount?: number;
}

export type LoanStatus = 'activo' | 'vencido' | 'devuelto_parcial' | 'devuelto_total' | 'cancelado';

export interface LoanItemDetail {
  id: string;
  loanId: string;
  itemId: string;
  itemSenaCode: string;
  itemName: string;
  unitOfMeasure: string;
  quantityRequested: number;
  quantityDelivered: number;
  quantityReturned: number;
  quantityDamaged: number;
  quantityPending: number;
  serialNumber?: string;
  status: 'prestado' | 'devuelto' | 'parcial' | 'deteriorado' | 'perdido';
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerId: string;
  borrower: {
    fullName: string;
    documentId: string;
    personType: PersonType;
    fichaNumber: string;
    programName: string;
    phone?: string;
    email?: string;
    responsibleInstructor?: string;
    department?: string;
  };
  requestDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  custodianDeliveredBy: string;
  receiverName: string;
  siteType: 'ambiente_formacion' | 'obra_practica' | 'taller' | 'zona_ensayos' | 'aula' | 'otro';
  siteDescription: string;
  purposeType: 'practica_formativa' | 'actividad_academica' | 'ensayo_laboratorio' | 'obra_mantenimiento' | 'otro';
  purposeDescription: string;
  fichaNumber: string;
  status: LoanStatus;
  physicalConditionOut: string;
  accessoriesOut?: string;
  observations?: string;
  signatureData?: string;
  evidencePhotoUrl?: string;
  items: LoanItemDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItemDetail {
  loanDetailId: string;
  itemId: string;
  itemSenaCode: string;
  itemName: string;
  quantityReturned: number;
  quantityDamaged: number;
  quantityLost: number;
  conditionOnReturn: 'buen_estado' | 'desgaste_normal' | 'danado' | 'incompleto' | 'perdido';
  actionTaken: 'retorno_disponible' | 'enviar_mantenimiento' | 'baja_deterioro' | 'pendiente_aclaracion';
  observations?: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  loanId: string;
  loanNumber: string;
  borrowerName: string;
  borrowerDocument: string;
  fichaNumber: string;
  returnDate: string;
  receiverName: string;
  accessoriesReturned?: string;
  notesDamagesLosses?: string;
  evidencePhotoUrl?: string;
  items: ReturnItemDetail[];
  createdAt: string;
}

export type MovementType =
  | 'creacion'
  | 'ajuste_cantidad'
  | 'prestamo_salida'
  | 'devolucion_total'
  | 'devolucion_parcial'
  | 'traslado_ubicacion'
  | 'ingreso_mantenimiento'
  | 'retorno_mantenimiento'
  | 'deterioro'
  | 'baja'
  | 'perdida'
  | 'correccion_administrativa';

export interface InventoryMovement {
  id: string;
  movementNumber: string;
  timestamp: string;
  type: MovementType;
  itemId: string;
  itemSenaCode: string;
  itemName: string;
  quantityChanged: number;
  balanceAvailable: number;
  balanceLoaned: number;
  balanceTotal: number;
  responsiblePerson: string;
  borrowerPerson?: string;
  reason: string;
  observations?: string;
  referenceDocument?: string;
  createdAt: string;
}

export interface SystemConfig {
  institutionName: string;
  regional: string;
  center: string;
  laboratory: string;
  custodianName: string;
  custodianId: string;
  custodianRole: string;
  custodianPhone: string;
  custodianEmail: string;
  environmentCode: string;
  address: string;
  inventoryPrefix: string;
  loanPrefix: string;
  returnPrefix: string;
}

export interface CustodyRecord {
  loanId: string;
  loanNumber: string;
  itemId: string;
  senaCode: string;
  itemName: string;
  category: ItemCategory;
  totalQty: number;
  availableQty: number;
  loanedQuantity: number;
  borrowerId: string;
  borrowerName: string;
  borrowerDocument: string;
  personType: PersonType;
  fichaNumber: string;
  programName: string;
  requestDate: string;
  expectedReturnDate: string;
  daysLate: number;
  isOverdue: boolean;
  siteDescription: string;
  purposeDescription: string;
  status: LoanStatus;
}

export interface DashboardMetrics {
  totalItemsCount: number;
  totalUnitsCount: number;
  availableUnitsCount: number;
  loanedUnitsCount: number;
  maintenanceUnitsCount: number;
  damagedUnitsCount: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  returnsScheduledTodayCount: number;
  recentMovements: InventoryMovement[];
  categoryDistribution: { category: string; count: number; units: number }[];
  statusDistribution: { status: string; count: number }[];
  lowStockItems: InventoryItem[];
  urgentReturns: CustodyRecord[];
}
