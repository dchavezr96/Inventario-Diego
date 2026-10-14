import fs from 'node:fs';
import path from 'node:path';
import {
  InventoryItem,
  Borrower,
  Loan,
  LoanItemDetail,
  ReturnRecord,
  InventoryMovement,
  SystemConfig,
  DashboardMetrics,
  CustodyRecord
} from '../types/inventory.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sena_lab_db.json');

export interface DatabaseSchema {
  config: SystemConfig;
  items: InventoryItem[];
  borrowers: Borrower[];
  loans: Loan[];
  returns: ReturnRecord[];
  movements: InventoryMovement[];
  auditLogs: {
    id: string;
    timestamp: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    user: string;
  }[];
}

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

const INITIAL_BORROWERS: Borrower[] = [
  {
    id: 'bor-1',
    documentId: '1023849102',
    fullName: 'Julián David Gómez Restrepo',
    personType: 'aprendiz',
    fichaNumber: '2841920',
    programName: 'Tecnólogo en Construcción de Edificaciones',
    responsibleInstructor: 'Ing. Germán Osorio',
    email: 'jdgomez920@misena.edu.co',
    phone: '312 458 9012',
    department: 'Ambiente 104 - Concretos',
    createdAt: '2026-02-10T08:00:00.000Z'
  },
  {
    id: 'bor-2',
    documentId: '1014892341',
    fullName: 'Valentina Morales Castaño',
    personType: 'aprendiz',
    fichaNumber: '2712490',
    programName: 'Tecnólogo en Obras Civiles',
    responsibleInstructor: 'Inga. Martha Lucía Rivas',
    email: 'vmorales490@misena.edu.co',
    phone: '315 789 2314',
    department: 'Zona de Ensayos Topográficos',
    createdAt: '2026-02-12T09:30:00.000Z'
  },
  {
    id: 'bor-3',
    documentId: '79845123',
    fullName: 'Ing. Germán Osorio Pineda',
    personType: 'instructor',
    fichaNumber: '2841920',
    programName: 'Tecnólogo en Construcción de Edificaciones',
    responsibleInstructor: 'Coordinación Académica',
    email: 'gosorio@sena.edu.co',
    phone: '320 891 4567',
    department: 'Taller de Estructuras y Encofrados',
    createdAt: '2026-01-20T07:00:00.000Z'
  },
  {
    id: 'bor-4',
    documentId: '1032489567',
    fullName: 'Mateo Alejandro Torres Ortiz',
    personType: 'aprendiz',
    fichaNumber: '2841920',
    programName: 'Tecnólogo en Construcción de Edificaciones',
    responsibleInstructor: 'Ing. Germán Osorio',
    email: 'matorres567@misena.edu.co',
    phone: '310 654 3218',
    department: 'Ambiente 102 - Taller de Mezclas',
    createdAt: '2026-02-15T10:15:00.000Z'
  },
  {
    id: 'bor-5',
    documentId: '52891240',
    fullName: 'Arquímedes Salazar Peña',
    personType: 'contratista',
    fichaNumber: 'N/A',
    programName: 'Mantenimiento de Infraestructura SENA',
    responsibleInstructor: 'Arq. Carlos Andrés Mendieta',
    email: 'asalazar.ctto@sena.edu.co',
    phone: '318 902 3411',
    department: 'Mantenimiento y Adecuaciones',
    createdAt: '2026-02-25T11:00:00.000Z'
  }
];

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    senaCode: 'SENA-CTCM-0104-001',
    internalCode: 'LAB-ENS-01',
    name: 'Cono de Abrams Completo (Asentamiento de Concreto)',
    description: 'Juego de ensayo de asentamiento NTC 396 / ASTM C143. Incluye cono metálico sin costura, varilla apisonadora de 5/8" con punta semiesférica y placa de apoyo metálica con pisaderas.',
    category: 'Equipo de Laboratorio',
    brand: 'Pinzuar',
    model: 'PZ-CONO-NTC',
    serialNumber: 'PZ-2024-8901',
    unitOfMeasure: 'Juego',
    initialQty: 5,
    totalQty: 5,
    availableQty: 3,
    loanedQty: 2,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Armario Metálico 1 - Estante B',
    acquisitionDate: '2024-03-15',
    notes: 'Verificar varilla y limpieza rigurosa después de cada vaciado.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Equipo bajo inventario institucional SENA CTCM.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'item-2',
    senaCode: 'SENA-CTCM-0104-002',
    internalCode: 'LAB-ENS-02',
    name: 'Martillo Schmidt / Esclerómetro Digital para Concreto',
    description: 'Esclerómetro tipo N para ensayos no destructivos de dureza superficial y estimación de resistencia a la compresión en estructuras de concreto según NTC 3692 / ASTM C805. Incluye yunque de calibración y piedra abrasiva.',
    category: 'Instrumento de Medición',
    brand: 'Proceq',
    model: 'SilverSchmidt Tipo N',
    serialNumber: 'PQ-90821-2023',
    unitOfMeasure: 'Unidad',
    initialQty: 2,
    totalQty: 2,
    availableQty: 1,
    loanedQty: 1,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Vitrina de Instrumentos Especiales - Nivel 2',
    acquisitionDate: '2023-11-20',
    notes: 'Equipo de alta precisión. Requiere calibración con yunque patrón antes de cada uso.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Custodia restringida a instructores y aprendices en fase de ensayos de campo.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-02T14:00:00.000Z'
  },
  {
    id: 'item-3',
    senaCode: 'SENA-CTCM-0104-003',
    internalCode: 'LAB-TOP-01',
    name: 'Nivel Óptico Automático con Trípode y Mira Estadimétrica',
    description: 'Nivel óptico topográfico 32X de aumento con compensador magnético amortiguado. Incluye trípode de aluminio de doble fijación y mira de aluminio telescópica de 5 metros con nivel esférico.',
    category: 'Instrumento de Medición',
    brand: 'Leica Geosystems',
    model: 'NA332',
    serialNumber: 'LEI-8432190',
    unitOfMeasure: 'Kit',
    initialQty: 4,
    totalQty: 4,
    availableQty: 3,
    loanedQty: 1,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Zona Topográfica - Casillero T-01',
    acquisitionDate: '2024-05-10',
    notes: 'Comprobar colimación y estado de burbuja esférica al recibir.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Préstamo exclusivo con trípode y mira estadimétrica completa.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-02-28T09:00:00.000Z'
  },
  {
    id: 'item-4',
    senaCode: 'SENA-CTCM-0104-004',
    internalCode: 'LAB-PWR-01',
    name: 'Rotomartillo Percutor SDS Plus 800W con Estuche y Cinceles',
    description: 'Rotomartillo electro-neumático de 3 modos (rotación, percusión y cincelado). Fuerza de impacto 3.0 Joules. Incluye set de brocas para concreto y cincel de pala y punta.',
    category: 'Herramienta Eléctrica',
    brand: 'Bosch',
    model: 'GBH 2-28 D',
    serialNumber: 'BSH-7749102',
    unitOfMeasure: 'Unidad',
    initialQty: 6,
    totalQty: 6,
    availableQty: 4,
    loanedQty: 1,
    maintenanceQty: 1,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Estante de Herramientas Eléctricas E-2',
    acquisitionDate: '2024-02-18',
    notes: 'Una unidad en mantenimiento preventivo por cambio de carbones.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Exige verificación de cable y clavija industrial al prestar.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-03T11:20:00.000Z'
  },
  {
    id: 'item-5',
    senaCode: 'SENA-CTCM-0104-005',
    internalCode: 'LAB-PWR-02',
    name: 'Pulidora Angular 7 Pulgadas 2400W Industrial',
    description: 'Amoladora angular para corte y desbaste de acero de refuerzo y mampostería. Gatillo tipo paleta de hombre muerto y guarda de protección ajustable.',
    category: 'Herramienta Eléctrica',
    brand: 'DeWalt',
    model: 'DWE490-B3',
    serialNumber: 'DW-991204',
    unitOfMeasure: 'Unidad',
    initialQty: 4,
    totalQty: 4,
    availableQty: 2,
    loanedQty: 2,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Estante de Herramientas Eléctricas E-1',
    acquisitionDate: '2023-09-12',
    notes: 'Obligatorio uso con careta facial de policarbonato y guantes de carnaza.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Préstamo con llave para tuerca de apriete y guarda montada.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-04T16:00:00.000Z'
  },
  {
    id: 'item-6',
    senaCode: 'SENA-CTCM-0104-006',
    internalCode: 'LAB-MOL-01',
    name: 'Moldes Metálicos Cilíndricos para Probetas de Concreto 6" x 12"',
    description: 'Molde de hierro fundido bipartido con placa base y tornillos de ajuste rápido para elaboración de cilindros de prueba de resistencia a la compresión NTC 550 / ASTM C31.',
    category: 'Equipo de Laboratorio',
    brand: 'Pinzuar',
    model: 'MC-612-HD',
    serialNumber: 'Lote Fundición 2024',
    unitOfMeasure: 'Unidad',
    initialQty: 24,
    totalQty: 24,
    availableQty: 18,
    loanedQty: 6,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Bodega de Curado y Mezclas - Tarima C-1',
    acquisitionDate: '2024-01-20',
    notes: 'Aplicar desmoldante biodegradable antes de vaciar concreto.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Entregar limpios y sin adherencias de mortero fraguado.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'item-7',
    senaCode: 'SENA-CTCM-0104-007',
    internalCode: 'LAB-MED-01',
    name: 'Balanza de Precisión Digital 30kg / 0.5g para Agregados',
    description: 'Balanza electrónica con plato de acero inoxidable 30x30cm, función de tara, conteo de piezas y calibración externa. Utilizada para dosificación de muestras de grava y arena.',
    category: 'Instrumento de Medición',
    brand: 'Ohaus',
    model: 'Defender 3000',
    serialNumber: 'OH-30041289',
    unitOfMeasure: 'Unidad',
    initialQty: 3,
    totalQty: 3,
    availableQty: 2,
    loanedQty: 1,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Mesa Antivibratoria de Ensayos M-1',
    acquisitionDate: '2023-08-05',
    notes: 'No exponer a vibraciones excesivas ni exceder capacidad de 30 kg.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Incluye adaptador de corriente original 110V y cubierta plástica.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-02T10:00:00.000Z'
  },
  {
    id: 'item-8',
    senaCode: 'SENA-CTCM-0104-008',
    internalCode: 'LAB-MAN-01',
    name: 'Flexómetro de Alta Resistencia 8m / 26ft con Gancho Magnético',
    description: 'Cinta métrica profesional con revestimiento BladeArmor anti-abrasión y escala métrica en milímetros y pulgadas.',
    category: 'Herramienta Manual',
    brand: 'Stanley',
    model: 'FatMax 8M',
    serialNumber: 'N/A',
    unitOfMeasure: 'Unidad',
    initialQty: 15,
    totalQty: 15,
    availableQty: 10,
    loanedQty: 4,
    maintenanceQty: 0,
    damagedQty: 1,
    status: 'operativo',
    defaultLocation: 'Panel de Herramientas Manuales P-02',
    acquisitionDate: '2024-06-01',
    notes: 'Una unidad dada de baja por cinta doblada y resorte roto.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Revisar retorno de cinta al entregar.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-05T09:30:00.000Z'
  },
  {
    id: 'item-9',
    senaCode: 'SENA-CTCM-0104-009',
    internalCode: 'LAB-MAN-02',
    name: 'Cincel de Pala Ancha 300mm con Empuñadura Protectora',
    description: 'Cincel forjado en acero cromo-vanadio para demolición manual y remoción de revoque o mortero.',
    category: 'Herramienta Manual',
    brand: 'Bellota',
    model: '5825-300',
    serialNumber: 'N/A',
    unitOfMeasure: 'Unidad',
    initialQty: 12,
    totalQty: 12,
    availableQty: 9,
    loanedQty: 3,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Cajón de Herramientas de Impacto C-03',
    acquisitionDate: '2024-02-10',
    notes: 'Afilado y rectificado periódico de bisel.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Uso exclusivo con guantes y gafas.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-02-20T11:00:00.000Z'
  },
  {
    id: 'item-10',
    senaCode: 'SENA-CTCM-0104-010',
    internalCode: 'LAB-EPP-01',
    name: 'Casco de Seguridad Dieléctrico Tipo I Clase E Blanco SENA',
    description: 'Casco con suspensión de cuatro puntos y barbuquejo elástico de tres apoyos. Cumple norma ANSI/ISEA Z89.1 y NTC 1523.',
    category: 'Elemento de Protección Personal (EPP)',
    brand: 'Arseg / 3M',
    model: 'H-700 Blanco',
    serialNumber: 'Lote 2025-EPP',
    unitOfMeasure: 'Unidad',
    initialQty: 30,
    totalQty: 30,
    availableQty: 26,
    loanedQty: 4,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Estante de EPP y Bioseguridad B-1',
    acquisitionDate: '2025-01-10',
    notes: 'Desinfectar arnés después de cada entrega.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Préstamo temporal para visitas técnicas y prácticas de laboratorio.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-01T15:00:00.000Z'
  },
  {
    id: 'item-11',
    senaCode: 'SENA-CTCM-0104-011',
    internalCode: 'LAB-ENS-03',
    name: 'Juego de Tamices para Granulometría de Suelos y Agregados ASTM',
    description: 'Serie de mallas en marco de bronce de 8 pulgadas de diámetro: 2", 1-1/2", 1", 3/4", 1/2", 3/8", Nº 4, 8, 16, 30, 50, 100, 200, tapa y fondo colector según NTC 77 / ASTM C136.',
    category: 'Equipo de Laboratorio',
    brand: 'W.S. Tyler / Pinzuar',
    model: 'Serie ASTM E-11',
    serialNumber: 'TM-2023-771',
    unitOfMeasure: 'Juego',
    initialQty: 3,
    totalQty: 3,
    availableQty: 2,
    loanedQty: 1,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Estante de Granulometría G-1',
    acquisitionDate: '2023-05-18',
    notes: 'Limpiar únicamente con brochas de cerda de bronce suave para no deformar aberturas.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Verificar juego completo al recibir (13 tamices + fondo + tapa).',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-02-18T10:00:00.000Z'
  },
  {
    id: 'item-12',
    senaCode: 'SENA-CTCM-0104-012',
    internalCode: 'LAB-MAQ-01',
    name: 'Mezcladora Trompo Eléctrica 1/2 Bulto 1.5 HP',
    description: 'Hormigonera portátil para preparación de mezclas de concreto y mortero de prueba. Capacidad de tambor 130 litros con corona de fundición y ruedas macizas.',
    category: 'Maquinaria',
    brand: 'IMER',
    model: 'Syntesi 140',
    serialNumber: 'IMR-2023-0982',
    unitOfMeasure: 'Unidad',
    initialQty: 2,
    totalQty: 2,
    availableQty: 2,
    loanedQty: 0,
    maintenanceQty: 0,
    damagedQty: 0,
    status: 'operativo',
    defaultLocation: 'Zona Exterior de Dosificación y Mezclado',
    acquisitionDate: '2023-10-14',
    notes: 'Lavado con agua a presión inmediatamente después de concluir el vaciado.',
    custodianName: 'Arq. Carlos Andrés Mendieta Peña',
    custodianId: 'C.C. 80.194.520',
    department: 'Ambiente 104 - Taller de Mezclas y Control de Calidad',
    custodyNotes: 'Revisión mensual de lubricación y engranajes.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z'
  }
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan-1',
    loanNumber: 'PRE-2026-0001',
    borrowerId: 'bor-1',
    borrower: {
      fullName: 'Julián David Gómez Restrepo',
      documentId: '1023849102',
      personType: 'aprendiz',
      fichaNumber: '2841920',
      programName: 'Tecnólogo en Construcción de Edificaciones',
      phone: '312 458 9012',
      email: 'jdgomez920@misena.edu.co',
      responsibleInstructor: 'Ing. Germán Osorio',
      department: 'Ambiente 104 - Concretos'
    },
    requestDate: '2026-03-02T08:30:00.000Z',
    expectedReturnDate: '2026-03-02T17:00:00.000Z', // Overdue relative to current simulated time
    custodianDeliveredBy: 'Arq. Carlos Andrés Mendieta Peña',
    receiverName: 'Julián David Gómez Restrepo',
    siteType: 'zona_ensayos',
    siteDescription: 'Pista de ensayos de mezclas - Módulo B',
    purposeType: 'practica_formativa',
    purposeDescription: 'Práctica de caracterización y ensayo de asentamiento de concreto hidráulico f\'c=21 MPa con aditivo plastificante.',
    fichaNumber: '2841920',
    status: 'vencido',
    physicalConditionOut: 'Excelente estado de conservación, limpio, con accesorios completos.',
    accessoriesOut: 'Cono de acero, varilla lisa 5/8" con extremos semiesféricos, base de apoyo con pisaderas.',
    observations: 'Préstamo autorizado para práctica de laboratorio de tecnología del concreto.',
    items: [
      {
        id: 'li-1',
        loanId: 'loan-1',
        itemId: 'item-1',
        itemSenaCode: 'SENA-CTCM-0104-001',
        itemName: 'Cono de Abrams Completo (Asentamiento de Concreto)',
        unitOfMeasure: 'Juego',
        quantityRequested: 1,
        quantityDelivered: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 1,
        serialNumber: 'PZ-2024-8901',
        status: 'prestado'
      },
      {
        id: 'li-2',
        loanId: 'loan-1',
        itemId: 'item-6',
        itemSenaCode: 'SENA-CTCM-0104-006',
        itemName: 'Moldes Metálicos Cilíndricos para Probetas de Concreto 6" x 12"',
        unitOfMeasure: 'Unidad',
        quantityRequested: 4,
        quantityDelivered: 4,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 4,
        status: 'prestado'
      }
    ],
    createdAt: '2026-03-02T08:30:00.000Z',
    updatedAt: '2026-03-02T08:30:00.000Z'
  },
  {
    id: 'loan-2',
    loanNumber: 'PRE-2026-0002',
    borrowerId: 'bor-2',
    borrower: {
      fullName: 'Valentina Morales Castaño',
      documentId: '1014892341',
      personType: 'aprendiz',
      fichaNumber: '2712490',
      programName: 'Tecnólogo en Obras Civiles',
      phone: '315 789 2314',
      email: 'vmorales490@misena.edu.co',
      responsibleInstructor: 'Inga. Martha Lucía Rivas',
      department: 'Zona de Ensayos Topográficos'
    },
    requestDate: '2026-03-04T07:15:00.000Z',
    expectedReturnDate: '2026-03-04T16:30:00.000Z',
    custodianDeliveredBy: 'Arq. Carlos Andrés Mendieta Peña',
    receiverName: 'Valentina Morales Castaño',
    siteType: 'ambiente_formacion',
    siteDescription: 'Plazoleta central y talud oriental CTCM',
    purposeType: 'practica_formativa',
    purposeDescription: 'Nivelación geométrica compuesta de circuito cerrado para rasante de vía interna del centro.',
    fichaNumber: '2712490',
    status: 'activo',
    physicalConditionOut: 'Operativo, lente sin rayaduras, tornillos nivelantes limpios.',
    accessoriesOut: 'Trípode Leica GST05 con correa, mira telescópica 5m con nivel esférico y funda.',
    observations: 'Se recuerda proteger el equipo de la lluvia.',
    items: [
      {
        id: 'li-3',
        loanId: 'loan-2',
        itemId: 'item-3',
        itemSenaCode: 'SENA-CTCM-0104-003',
        itemName: 'Nivel Óptico Automático con Trípode y Mira Estadimétrica',
        unitOfMeasure: 'Kit',
        quantityRequested: 1,
        quantityDelivered: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 1,
        serialNumber: 'LEI-8432190',
        status: 'prestado'
      },
      {
        id: 'li-4',
        loanId: 'loan-2',
        itemId: 'item-8',
        itemSenaCode: 'SENA-CTCM-0104-008',
        itemName: 'Flexómetro de Alta Resistencia 8m / 26ft con Gancho Magnético',
        unitOfMeasure: 'Unidad',
        quantityRequested: 2,
        quantityDelivered: 2,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 2,
        status: 'prestado'
      }
    ],
    createdAt: '2026-03-04T07:15:00.000Z',
    updatedAt: '2026-03-04T07:15:00.000Z'
  },
  {
    id: 'loan-3',
    loanNumber: 'PRE-2026-0003',
    borrowerId: 'bor-3',
    borrower: {
      fullName: 'Ing. Germán Osorio Pineda',
      documentId: '79845123',
      personType: 'instructor',
      fichaNumber: '2841920',
      programName: 'Tecnólogo en Construcción de Edificaciones',
      phone: '320 891 4567',
      email: 'gosorio@sena.edu.co',
      responsibleInstructor: 'Coordinación Académica',
      department: 'Taller de Estructuras y Encofrados'
    },
    requestDate: '2026-03-05T08:00:00.000Z',
    expectedReturnDate: '2026-03-05T18:00:00.000Z',
    custodianDeliveredBy: 'Arq. Carlos Andrés Mendieta Peña',
    receiverName: 'Ing. Germán Osorio Pineda',
    siteType: 'taller',
    siteDescription: 'Estructuras de concreto armado - Ambiente 102',
    purposeType: 'actividad_academica',
    purposeDescription: 'Demostración práctica de esclerometría en vigas desencofradas y ensayo de granulometría.',
    fichaNumber: '2841920',
    status: 'activo',
    physicalConditionOut: 'Excelente estado, calibrado con yunque patrón.',
    accessoriesOut: 'Maletín rígido, yunque patrón de dureza, piedra de carburo de silicio, cable USB.',
    observations: 'Entrega directa al instructor titular.',
    items: [
      {
        id: 'li-5',
        loanId: 'loan-3',
        itemId: 'item-2',
        itemSenaCode: 'SENA-CTCM-0104-002',
        itemName: 'Martillo Schmidt / Esclerómetro Digital para Concreto',
        unitOfMeasure: 'Unidad',
        quantityRequested: 1,
        quantityDelivered: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 1,
        serialNumber: 'PQ-90821-2023',
        status: 'prestado'
      },
      {
        id: 'li-6',
        loanId: 'loan-3',
        itemId: 'item-11',
        itemSenaCode: 'SENA-CTCM-0104-011',
        itemName: 'Juego de Tamices para Granulometría de Suelos y Agregados ASTM',
        unitOfMeasure: 'Juego',
        quantityRequested: 1,
        quantityDelivered: 1,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 1,
        serialNumber: 'TM-2023-771',
        status: 'prestado'
      }
    ],
    createdAt: '2026-03-05T08:00:00.000Z',
    updatedAt: '2026-03-05T08:00:00.000Z'
  },
  {
    id: 'loan-4',
    loanNumber: 'PRE-2026-0004',
    borrowerId: 'bor-5',
    borrower: {
      fullName: 'Arquímedes Salazar Peña',
      documentId: '52891240',
      personType: 'contratista',
      fichaNumber: 'N/A',
      programName: 'Mantenimiento de Infraestructura SENA',
      phone: '318 902 3411',
      email: 'asalazar.ctto@sena.edu.co',
      responsibleInstructor: 'Arq. Carlos Andrés Mendieta',
      department: 'Mantenimiento y Adecuaciones'
    },
    requestDate: '2026-03-04T13:00:00.000Z',
    expectedReturnDate: '2026-03-05T17:00:00.000Z',
    custodianDeliveredBy: 'Arq. Carlos Andrés Mendieta Peña',
    receiverName: 'Arquímedes Salazar Peña',
    siteType: 'obra_practica',
    siteDescription: 'Adecuación de pisos y muros en Bloque C',
    purposeType: 'obra_mantenimiento',
    purposeDescription: 'Corte de juntas de dilatación en contrapiso de concreto y regatas para tubería eléctrica.',
    fichaNumber: 'MTO-2026-01',
    status: 'activo',
    physicalConditionOut: 'Buen estado, discos no incluidos, probada en vacío satisfactoriamente.',
    accessoriesOut: 'Guarda protectora de 7", mango auxiliar antivibración, llave de pivotes.',
    observations: 'Contrato de mantenimiento preventivo locativo CTCM.',
    items: [
      {
        id: 'li-7',
        loanId: 'loan-4',
        itemId: 'item-5',
        itemSenaCode: 'SENA-CTCM-0104-005',
        itemName: 'Pulidora Angular 7 Pulgadas 2400W Industrial',
        unitOfMeasure: 'Unidad',
        quantityRequested: 2,
        quantityDelivered: 2,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 2,
        status: 'prestado'
      },
      {
        id: 'li-8',
        loanId: 'loan-4',
        itemId: 'item-9',
        itemSenaCode: 'SENA-CTCM-0104-009',
        itemName: 'Cincel de Pala Ancha 300mm con Empuñadura Protectora',
        unitOfMeasure: 'Unidad',
        quantityRequested: 3,
        quantityDelivered: 3,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: 3,
        status: 'prestado'
      }
    ],
    createdAt: '2026-03-04T13:00:00.000Z',
    updatedAt: '2026-03-04T13:00:00.000Z'
  }
];

const INITIAL_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-1',
    movementNumber: 'MOV-2026-0001',
    timestamp: '2026-01-15T08:00:00.000Z',
    type: 'creacion',
    itemId: 'item-1',
    itemSenaCode: 'SENA-CTCM-0104-001',
    itemName: 'Cono de Abrams Completo (Asentamiento de Concreto)',
    quantityChanged: 5,
    balanceAvailable: 5,
    balanceLoaned: 0,
    balanceTotal: 5,
    responsiblePerson: 'Arq. Carlos Andrés Mendieta Peña',
    reason: 'Ingreso inicial por dotación institucional SENA 2024-2026',
    observations: 'Equipos recibidos a satisfacción según acta de entrega de almacén central.',
    referenceDocument: 'Acta Almacén No. 2024-089',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'mov-2',
    movementNumber: 'MOV-2026-0002',
    timestamp: '2026-03-02T08:30:00.000Z',
    type: 'prestamo_salida',
    itemId: 'item-1',
    itemSenaCode: 'SENA-CTCM-0104-001',
    itemName: 'Cono de Abrams Completo (Asentamiento de Concreto)',
    quantityChanged: -1,
    balanceAvailable: 4,
    balanceLoaned: 1,
    balanceTotal: 5,
    responsiblePerson: 'Arq. Carlos Andrés Mendieta Peña',
    borrowerPerson: 'Julián David Gómez Restrepo (Ficha 2841920)',
    reason: 'Préstamo para práctica formativa de concretos',
    observations: 'Salida autorizada según formato de préstamo.',
    referenceDocument: 'Préstamo #PRE-2026-0001',
    createdAt: '2026-03-02T08:30:00.000Z'
  },
  {
    id: 'mov-3',
    movementNumber: 'MOV-2026-0003',
    timestamp: '2026-03-02T08:30:00.000Z',
    type: 'prestamo_salida',
    itemId: 'item-6',
    itemSenaCode: 'SENA-CTCM-0104-006',
    itemName: 'Moldes Metálicos Cilíndricos para Probetas de Concreto 6" x 12"',
    quantityChanged: -4,
    balanceAvailable: 20,
    balanceLoaned: 4,
    balanceTotal: 24,
    responsiblePerson: 'Arq. Carlos Andrés Mendieta Peña',
    borrowerPerson: 'Julián David Gómez Restrepo (Ficha 2841920)',
    reason: 'Préstamo para vaciado de cilindros de concreto hidráulico',
    observations: 'Entrega con pernos y bases metálicas.',
    referenceDocument: 'Préstamo #PRE-2026-0001',
    createdAt: '2026-03-02T08:30:00.000Z'
  },
  {
    id: 'mov-4',
    movementNumber: 'MOV-2026-0004',
    timestamp: '2026-03-03T11:20:00.000Z',
    type: 'ingreso_mantenimiento',
    itemId: 'item-4',
    itemSenaCode: 'SENA-CTCM-0104-004',
    itemName: 'Rotomartillo Percutor SDS Plus 800W con Estuche y Cinceles',
    quantityChanged: -1,
    balanceAvailable: 4,
    balanceLoaned: 1,
    balanceTotal: 6,
    responsiblePerson: 'Arq. Carlos Andrés Mendieta Peña',
    reason: 'Mantenimiento preventivo de escobillas y engrase de caja de percusión',
    observations: 'Remitido a taller electromecánico de la sede.',
    referenceDocument: 'Orden de Mantenimiento No. MTO-044',
    createdAt: '2026-03-03T11:20:00.000Z'
  },
  {
    id: 'mov-5',
    movementNumber: 'MOV-2026-0005',
    timestamp: '2026-03-05T09:30:00.000Z',
    type: 'deterioro',
    itemId: 'item-8',
    itemSenaCode: 'SENA-CTCM-0104-008',
    itemName: 'Flexómetro de Alta Resistencia 8m / 26ft con Gancho Magnético',
    quantityChanged: -1,
    balanceAvailable: 10,
    balanceLoaned: 4,
    balanceTotal: 15,
    responsiblePerson: 'Arq. Carlos Andrés Mendieta Peña',
    reason: 'Cinta metálica fracturada por desgaste en práctica anterior',
    observations: 'Se traslada a condición fuera de servicio a la espera de trámite de baja.',
    referenceDocument: 'Acta de Novedad Técnica #NOV-012',
    createdAt: '2026-03-05T09:30:00.000Z'
  }
];

class DatabaseService {
  private db: DatabaseSchema | null = null;
  private isWriting = false;

  constructor() {
    this.ensureDataDirectory();
    this.loadDatabase();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (this.db) return this.db;

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        return this.db!;
      } catch (err) {
        console.error('Error reading database file, loading default initial state', err);
      }
    }

    this.db = {
      config: DEFAULT_CONFIG,
      items: INITIAL_ITEMS,
      borrowers: INITIAL_BORROWERS,
      loans: INITIAL_LOANS,
      returns: [],
      movements: INITIAL_MOVEMENTS,
      auditLogs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          action: 'SISTEMA_INICIALIZADO',
          entity: 'SISTEMA',
          entityId: 'ROOT',
          details: 'Base de datos del Laboratorio de Construcción SENA inicializada con éxito.',
          user: 'Arq. Carlos Andrés Mendieta Peña'
        }
      ]
    };

    this.saveDatabase();
    return this.db;
  }

  private saveDatabase() {
    if (!this.db) return;
    try {
      this.ensureDataDirectory();
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file', err);
    }
  }

  // --- CONFIGURATION ---
  public getConfig(): SystemConfig {
    return this.loadDatabase().config;
  }

  public updateConfig(newConfig: Partial<SystemConfig>, actor: string): SystemConfig {
    const db = this.loadDatabase();
    db.config = { ...db.config, ...newConfig };
    this.logAudit('ACTUALIZACION_CONFIGURACION', 'CONFIG', 'SYSTEM', 'Datos institucionales y del cuentadante actualizados', actor);
    this.saveDatabase();
    return db.config;
  }

  // --- INVENTORY ITEMS ---
  public getItems(): InventoryItem[] {
    return this.loadDatabase().items;
  }

  public getItemById(id: string): InventoryItem | undefined {
    return this.loadDatabase().items.find((i) => i.id === id);
  }

  public getItemBySenaCode(senaCode: string): InventoryItem | undefined {
    const cleanCode = senaCode.trim().toLowerCase();
    return this.loadDatabase().items.find((i) => i.senaCode.trim().toLowerCase() === cleanCode);
  }

  public createItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'availableQty' | 'loanedQty' | 'maintenanceQty' | 'damagedQty'> & { availableQty?: number; maintenanceQty?: number; damagedQty?: number }, actor: string): InventoryItem {
    const db = this.loadDatabase();
    
    // Check duplicate SENA code
    if (this.getItemBySenaCode(itemData.senaCode)) {
      throw new Error(`Ya existe un elemento registrado con el Código SENA '${itemData.senaCode}'. Por favor verifique el código.`);
    }

    const totalQty = Number(itemData.totalQty) || 0;
    const maintenanceQty = Number(itemData.maintenanceQty) || 0;
    const damagedQty = Number(itemData.damagedQty) || 0;
    const availableQty = Math.max(0, totalQty - maintenanceQty - damagedQty);

    const newItem: InventoryItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      totalQty,
      availableQty,
      loanedQty: 0,
      maintenanceQty,
      damagedQty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.items.push(newItem);

    // Register movement
    this.recordMovement({
      type: 'creacion',
      itemId: newItem.id,
      itemSenaCode: newItem.senaCode,
      itemName: newItem.name,
      quantityChanged: newItem.totalQty,
      balanceAvailable: newItem.availableQty,
      balanceLoaned: 0,
      balanceTotal: newItem.totalQty,
      responsiblePerson: actor || newItem.custodianName,
      reason: 'Registro inicial de nuevo elemento en inventario',
      observations: newItem.notes || 'Elemento incorporado al inventario activo del laboratorio.',
      referenceDocument: 'Alta de Inventario'
    });

    this.logAudit('CREAR_ELEMENTO', 'ITEM', newItem.id, `Elemento creado: ${newItem.name} (${newItem.senaCode})`, actor);
    this.saveDatabase();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<InventoryItem>, actor: string): InventoryItem {
    const db = this.loadDatabase();
    const index = db.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Elemento con ID ${id} no encontrado.`);
    }

    const current = db.items[index];

    // Check duplicate SENA code if changing
    if (updates.senaCode && updates.senaCode.trim().toLowerCase() !== current.senaCode.trim().toLowerCase()) {
      const existing = this.getItemBySenaCode(updates.senaCode);
      if (existing && existing.id !== id) {
        throw new Error(`El Código SENA '${updates.senaCode}' ya está asignado a otro elemento (${existing.name}).`);
      }
    }

    // Check quantity adjustments
    let newTotal = updates.totalQty !== undefined ? Number(updates.totalQty) : current.totalQty;
    let newMaintenance = updates.maintenanceQty !== undefined ? Number(updates.maintenanceQty) : current.maintenanceQty;
    let newDamaged = updates.damagedQty !== undefined ? Number(updates.damagedQty) : current.damagedQty;
    const currentLoaned = current.loanedQty;

    // Available is calculated dynamically
    const newAvailable = newTotal - currentLoaned - newMaintenance - newDamaged;
    if (newAvailable < 0) {
      throw new Error(`La cantidad disponible resultante sería negativa (${newAvailable}). No puede reducir el total por debajo de las unidades prestadas (${currentLoaned}) más mantenimiento y deterioradas.`);
    }

    const qtyDiff = newTotal - current.totalQty;

    const updatedItem: InventoryItem = {
      ...current,
      ...updates,
      totalQty: newTotal,
      availableQty: newAvailable,
      maintenanceQty: newMaintenance,
      damagedQty: newDamaged,
      updatedAt: new Date().toISOString()
    };

    db.items[index] = updatedItem;

    // If total quantity or state changed, record movement
    if (qtyDiff !== 0) {
      this.recordMovement({
        type: 'ajuste_cantidad',
        itemId: updatedItem.id,
        itemSenaCode: updatedItem.senaCode,
        itemName: updatedItem.name,
        quantityChanged: qtyDiff,
        balanceAvailable: updatedItem.availableQty,
        balanceLoaned: updatedItem.loanedQty,
        balanceTotal: updatedItem.totalQty,
        responsiblePerson: actor,
        reason: 'Ajuste manual de existencias',
        observations: updates.notes || `Ajuste administrativo de cantidad (${qtyDiff > 0 ? '+' : ''}${qtyDiff}).`,
        referenceDocument: 'Ajuste Administrativo'
      });
    }

    this.logAudit('ACTUALIZAR_ELEMENTO', 'ITEM', updatedItem.id, `Actualizado: ${updatedItem.name}`, actor);
    this.saveDatabase();
    return updatedItem;
  }

  public deleteItem(id: string, actor: string): boolean {
    const db = this.loadDatabase();
    const item = db.items.find((i) => i.id === id);
    if (!item) throw new Error('Elemento no encontrado');

    // Rule: Cannot delete item with active loans
    if (item.loanedQty > 0) {
      throw new Error(`No es posible eliminar el elemento '${item.name}' porque tiene ${item.loanedQty} unidad(es) prestadas activas.`);
    }

    // Check if it has movements
    const movements = db.movements.filter((m) => m.itemId === id);
    if (movements.length > 0) {
      // Instead of hard physical delete breaking audit trails, apply 'baja' with zero available
      item.status = 'baja';
      item.totalQty = 0;
      item.availableQty = 0;
      item.updatedAt = new Date().toISOString();
      this.recordMovement({
        type: 'baja',
        itemId: item.id,
        itemSenaCode: item.senaCode,
        itemName: item.name,
        quantityChanged: -item.availableQty,
        balanceAvailable: 0,
        balanceLoaned: 0,
        balanceTotal: 0,
        responsiblePerson: actor,
        reason: 'Baja y retiro definitivo del inventario activo',
        observations: 'El registro se conserva en el archivo histórico por trazabilidad institucional.',
        referenceDocument: 'Acta de Baja Definitiva'
      });
      this.logAudit('BAJA_ELEMENTO', 'ITEM', id, `Elemento dado de baja: ${item.name}`, actor);
      this.saveDatabase();
      return true;
    }

    // If completely new with no movements (e.g. created just now by mistake)
    db.items = db.items.filter((i) => i.id !== id);
    this.logAudit('ELIMINAR_ELEMENTO', 'ITEM', id, `Eliminado físicamente elemento sin historial: ${item.name}`, actor);
    this.saveDatabase();
    return true;
  }

  // --- BORROWERS ---
  public getBorrowers(): Borrower[] {
    const db = this.loadDatabase();
    // compute active loans count
    return db.borrowers.map((b) => {
      const activeCount = db.loans.filter((l) => l.borrowerId === b.id && (l.status === 'activo' || l.status === 'vencido' || l.status === 'devuelto_parcial')).length;
      return { ...b, activeLoansCount: activeCount };
    });
  }

  public createBorrower(data: Omit<Borrower, 'id' | 'createdAt'>, actor: string): Borrower {
    const db = this.loadDatabase();
    const existing = db.borrowers.find((b) => b.documentId.trim() === data.documentId.trim());
    if (existing) {
      return existing;
    }

    const newBorrower: Borrower = {
      ...data,
      id: `bor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    db.borrowers.push(newBorrower);
    this.logAudit('CREAR_SOLICITANTE', 'BORROWER', newBorrower.id, `Solicitante registrado: ${newBorrower.fullName} (${newBorrower.documentId})`, actor);
    this.saveDatabase();
    return newBorrower;
  }

  // --- LOANS & OUTPUTS ---
  public getLoans(): Loan[] {
    const db = this.loadDatabase();
    const now = new Date();
    // Update overdue status dynamically
    db.loans.forEach((l) => {
      if ((l.status === 'activo' || l.status === 'devuelto_parcial') && new Date(l.expectedReturnDate) < now) {
        l.status = 'vencido';
      }
    });
    return db.loans;
  }

  public getLoanById(id: string): Loan | undefined {
    return this.getLoans().find((l) => l.id === id);
  }

  public createLoan(
    payload: {
      borrowerData: {
        id?: string;
        documentId: string;
        fullName: string;
        personType: any;
        fichaNumber: string;
        programName: string;
        phone?: string;
        email?: string;
        responsibleInstructor?: string;
        department?: string;
      };
      items: {
        itemId: string;
        quantity: number;
        serialNumber?: string;
      }[];
      requestDate: string;
      expectedReturnDate: string;
      custodianDeliveredBy: string;
      receiverName: string;
      siteType: any;
      siteDescription: string;
      purposeType: any;
      purposeDescription: string;
      fichaNumber: string;
      physicalConditionOut: string;
      accessoriesOut?: string;
      observations?: string;
      signatureData?: string;
      evidencePhotoUrl?: string;
    },
    actor: string
  ): Loan {
    const db = this.loadDatabase();

    // 1. Validate dates
    const reqDate = new Date(payload.requestDate);
    const expDate = new Date(payload.expectedReturnDate);
    if (expDate < reqDate) {
      throw new Error('La fecha prevista de devolución no puede ser anterior a la fecha de salida.');
    }

    // 2. Validate items & stock availability
    if (!payload.items || payload.items.length === 0) {
      throw new Error('El préstamo debe contener al menos un elemento con cantidad válida.');
    }

    // Transactional pre-check
    for (const reqItem of payload.items) {
      const item = db.items.find((i) => i.id === reqItem.itemId);
      if (!item) {
        throw new Error(`Elemento no encontrado en inventario (ID: ${reqItem.itemId}).`);
      }
      if (reqItem.quantity <= 0) {
        throw new Error(`La cantidad solicitada para '${item.name}' debe ser mayor a cero.`);
      }
      if (item.availableQty < reqItem.quantity) {
        throw new Error(`Stock insuficiente para '${item.name}'. Disponibles: ${item.availableQty}, Solicitadas: ${reqItem.quantity}.`);
      }
    }

    // 3. Ensure borrower exists or create
    let borrower = db.borrowers.find((b) => b.documentId.trim() === payload.borrowerData.documentId.trim());
    if (!borrower) {
      borrower = {
        id: `bor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        documentId: payload.borrowerData.documentId.trim(),
        fullName: payload.borrowerData.fullName.trim(),
        personType: payload.borrowerData.personType,
        fichaNumber: payload.borrowerData.fichaNumber || payload.fichaNumber,
        programName: payload.borrowerData.programName,
        phone: payload.borrowerData.phone,
        email: payload.borrowerData.email,
        responsibleInstructor: payload.borrowerData.responsibleInstructor,
        department: payload.borrowerData.department,
        createdAt: new Date().toISOString()
      };
      db.borrowers.push(borrower);
    }

    // 4. Generate consecutive loan number
    const year = new Date().getFullYear();
    const countOfYear = db.loans.filter((l) => l.loanNumber.includes(`${year}`)).length + 1;
    const loanNumber = `${db.config.loanPrefix || 'PRE'}-${year}-${String(countOfYear).padStart(4, '0')}`;

    const loanId = `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5. Build loan item details and deduct from inventory atomically
    const loanItems: Loan['items'] = [];

    for (const reqItem of payload.items) {
      const item = db.items.find((i) => i.id === reqItem.itemId)!;
      
      // Deduct available, increment loaned
      item.availableQty -= reqItem.quantity;
      item.loanedQty += reqItem.quantity;
      item.updatedAt = new Date().toISOString();

      const detailId = `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      loanItems.push({
        id: detailId,
        loanId,
        itemId: item.id,
        itemSenaCode: item.senaCode,
        itemName: item.name,
        unitOfMeasure: item.unitOfMeasure,
        quantityRequested: reqItem.quantity,
        quantityDelivered: reqItem.quantity,
        quantityReturned: 0,
        quantityDamaged: 0,
        quantityPending: reqItem.quantity,
        serialNumber: reqItem.serialNumber || item.serialNumber,
        status: 'prestado'
      });

      // Record movement for each item
      this.recordMovement({
        type: 'prestamo_salida',
        itemId: item.id,
        itemSenaCode: item.senaCode,
        itemName: item.name,
        quantityChanged: -reqItem.quantity,
        balanceAvailable: item.availableQty,
        balanceLoaned: item.loanedQty,
        balanceTotal: item.totalQty,
        responsiblePerson: payload.custodianDeliveredBy || actor,
        borrowerPerson: `${borrower.fullName} (${borrower.fichaNumber || borrower.personType})`,
        reason: `Préstamo registrado: ${payload.purposeDescription}`,
        observations: `Destino: ${payload.siteDescription}. Condición: ${payload.physicalConditionOut}`,
        referenceDocument: `Préstamo #${loanNumber}`
      });
    }

    const newLoan: Loan = {
      id: loanId,
      loanNumber,
      borrowerId: borrower.id,
      borrower: {
        fullName: borrower.fullName,
        documentId: borrower.documentId,
        personType: borrower.personType,
        fichaNumber: borrower.fichaNumber,
        programName: borrower.programName,
        phone: borrower.phone,
        email: borrower.email,
        responsibleInstructor: borrower.responsibleInstructor,
        department: borrower.department
      },
      requestDate: payload.requestDate,
      expectedReturnDate: payload.expectedReturnDate,
      custodianDeliveredBy: payload.custodianDeliveredBy || db.config.custodianName,
      receiverName: payload.receiverName || borrower.fullName,
      siteType: payload.siteType,
      siteDescription: payload.siteDescription,
      purposeType: payload.purposeType,
      purposeDescription: payload.purposeDescription,
      fichaNumber: payload.fichaNumber || borrower.fichaNumber,
      status: 'activo',
      physicalConditionOut: payload.physicalConditionOut,
      accessoriesOut: payload.accessoriesOut,
      observations: payload.observations,
      signatureData: payload.signatureData,
      evidencePhotoUrl: payload.evidencePhotoUrl,
      items: loanItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.loans.unshift(newLoan);
    this.logAudit('CREAR_PRESTAMO', 'LOAN', newLoan.id, `Préstamo creado: ${newLoan.loanNumber} a ${borrower.fullName}`, actor);
    this.saveDatabase();
    return newLoan;
  }

  // --- RETURNS & LIQUIDATIONS ---
  public processReturn(
    payload: {
      loanId: string;
      returnDate: string;
      receiverName: string;
      accessoriesReturned?: string;
      notesDamagesLosses?: string;
      evidencePhotoUrl?: string;
      items: {
        loanDetailId: string;
        quantityReturned: number;
        quantityDamaged: number;
        quantityLost: number;
        conditionOnReturn: 'buen_estado' | 'desgaste_normal' | 'danado' | 'incompleto' | 'perdido';
        actionTaken: 'retorno_disponible' | 'enviar_mantenimiento' | 'baja_deterioro' | 'pendiente_aclaracion';
        observations?: string;
      }[];
    },
    actor: string
  ): ReturnRecord {
    const db = this.loadDatabase();
    const loan = db.loans.find((l) => l.id === payload.loanId);
    if (!loan) {
      throw new Error(`Préstamo con ID ${payload.loanId} no encontrado.`);
    }

    if (loan.status === 'devuelto_total' || loan.status === 'cancelado') {
      throw new Error(`El préstamo ${loan.loanNumber} ya se encuentra liquidado.`);
    }

    const year = new Date().getFullYear();
    const returnCount = db.returns.length + 1;
    const returnNumber = `${db.config.returnPrefix || 'DEV'}-${year}-${String(returnCount).padStart(4, '0')}`;

    const returnRecord: ReturnRecord = {
      id: `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      returnNumber,
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      borrowerName: loan.borrower.fullName,
      borrowerDocument: loan.borrower.documentId,
      fichaNumber: loan.fichaNumber,
      returnDate: payload.returnDate || new Date().toISOString(),
      receiverName: payload.receiverName || db.config.custodianName,
      accessoriesReturned: payload.accessoriesReturned,
      notesDamagesLosses: payload.notesDamagesLosses,
      evidencePhotoUrl: payload.evidencePhotoUrl,
      items: [],
      createdAt: new Date().toISOString()
    };

    let allLoanItemsResolved = true;

    for (const retItem of payload.items) {
      const loanDetail = loan.items.find((li: LoanItemDetail) => li.id === retItem.loanDetailId);
      if (!loanDetail) continue;

      const item = db.items.find((i) => i.id === loanDetail.itemId);
      if (!item) continue;

      const qReturned = Number(retItem.quantityReturned) || 0;
      const qDamaged = Number(retItem.quantityDamaged) || 0;
      const qLost = Number(retItem.quantityLost) || 0;
      const totalProcessedThisReturn = qReturned + qDamaged + qLost;

      if (totalProcessedThisReturn <= 0) continue;

      if (totalProcessedThisReturn > loanDetail.quantityPending) {
        throw new Error(
          `La cantidad total ingresada (${totalProcessedThisReturn}) para '${loanDetail.itemName}' supera las unidades pendientes (${loanDetail.quantityPending}).`
        );
      }

      // Update loan detail counts
      loanDetail.quantityReturned += qReturned;
      loanDetail.quantityDamaged += qDamaged;
      loanDetail.quantityPending -= totalProcessedThisReturn;

      if (loanDetail.quantityPending === 0) {
        loanDetail.status = qDamaged > 0 ? 'deteriorado' : qLost > 0 ? 'perdido' : 'devuelto';
      } else {
        loanDetail.status = 'parcial';
        allLoanItemsResolved = false;
      }

      // Update Inventory based on condition & action taken
      // 1. Decrement loanedQty by total returned/processed
      item.loanedQty = Math.max(0, item.loanedQty - totalProcessedThisReturn);

      // 2. Adjust available or maintenance or damaged:
      if (retItem.actionTaken === 'retorno_disponible') {
        item.availableQty += qReturned;
      } else if (retItem.actionTaken === 'enviar_mantenimiento') {
        item.maintenanceQty += (qReturned + qDamaged);
      } else if (retItem.actionTaken === 'baja_deterioro') {
        item.damagedQty += (qReturned + qDamaged);
        item.totalQty = Math.max(0, item.totalQty - qLost);
      } else {
        // pendiente aclaracion
        item.maintenanceQty += qDamaged;
      }

      item.updatedAt = new Date().toISOString();

      // Record detailed return line
      returnRecord.items.push({
        loanDetailId: loanDetail.id,
        itemId: item.id,
        itemSenaCode: item.senaCode,
        itemName: item.name,
        quantityReturned: qReturned,
        quantityDamaged: qDamaged,
        quantityLost: qLost,
        conditionOnReturn: retItem.conditionOnReturn,
        actionTaken: retItem.actionTaken,
        observations: retItem.observations
      });

      // Record movement
      const movType = (loanDetail.quantityPending === 0 && loan.items.every((it: LoanItemDetail) => it.quantityPending === 0)) ? 'devolucion_total' : 'devolucion_parcial';
      this.recordMovement({
        type: qDamaged > 0 ? 'deterioro' : movType,
        itemId: item.id,
        itemSenaCode: item.senaCode,
        itemName: item.name,
        quantityChanged: qReturned,
        balanceAvailable: item.availableQty,
        balanceLoaned: item.loanedQty,
        balanceTotal: item.totalQty,
        responsiblePerson: payload.receiverName || actor,
        borrowerPerson: loan.borrower.fullName,
        reason: `Devolución comprobante #${returnNumber} de Préstamo #${loan.loanNumber}`,
        observations: `Condición: ${retItem.conditionOnReturn}. Acción: ${retItem.actionTaken}. Dañadas: ${qDamaged}, Pérdidas: ${qLost}. Obs: ${retItem.observations || 'Sin novedad'}`,
        referenceDocument: `Comprobante Devolución #${returnNumber}`
      });
    }

    // Check if entire loan is now completed
    const anyPending = loan.items.some((li: LoanItemDetail) => li.quantityPending > 0);
    loan.status = anyPending ? 'devuelto_parcial' : 'devuelto_total';
    if (!anyPending) {
      loan.actualReturnDate = payload.returnDate || new Date().toISOString();
    }
    loan.updatedAt = new Date().toISOString();

    db.returns.unshift(returnRecord);
    this.logAudit('REGISTRAR_DEVOLUCION', 'RETURN', returnRecord.id, `Devolución ${returnRecord.returnNumber} del préstamo ${loan.loanNumber}`, actor);
    this.saveDatabase();
    return returnRecord;
  }

  // --- MOVEMENTS & AUDIT ---
  public getMovements(filterItemId?: string): InventoryMovement[] {
    const db = this.loadDatabase();
    if (filterItemId) {
      return db.movements.filter((m) => m.itemId === filterItemId);
    }
    return db.movements;
  }

  private recordMovement(m: Omit<InventoryMovement, 'id' | 'movementNumber' | 'createdAt' | 'timestamp'> & { timestamp?: string }) {
    const db = this.loadDatabase();
    const count = db.movements.length + 1;
    const year = new Date().getFullYear();
    const movementNumber = `MOV-${year}-${String(count).padStart(4, '0')}`;
    const newMovement: InventoryMovement = {
      ...m,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      movementNumber,
      timestamp: m.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.movements.unshift(newMovement);
  }

  private logAudit(action: string, entity: string, entityId: string, details: string, user: string) {
    const db = this.loadDatabase();
    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      details,
      user: user || db.config.custodianName
    });
  }

  // --- QUERY: ¿QUIÉN TIENE CADA ELEMENTO? (CUSTODY CONTROL) ---
  public getCustodyRecords(): CustodyRecord[] {
    const db = this.loadDatabase();
    const now = new Date();
    const records: CustodyRecord[] = [];

    // Find all active or partial or overdue loans
    const activeLoans = db.loans.filter((l) => l.status === 'activo' || l.status === 'vencido' || l.status === 'devuelto_parcial');

    for (const loan of activeLoans) {
      const expDate = new Date(loan.expectedReturnDate);
      const isOverdue = expDate < now;
      const diffMs = now.getTime() - expDate.getTime();
      const daysLate = isOverdue ? Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24))) : 0;

      for (const itemDetail of loan.items) {
        if (itemDetail.quantityPending > 0) {
          const item = db.items.find((i) => i.id === itemDetail.itemId);
          records.push({
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            itemId: itemDetail.itemId,
            senaCode: itemDetail.itemSenaCode,
            itemName: itemDetail.itemName,
            category: item?.category || 'Otro',
            totalQty: item?.totalQty || 0,
            availableQty: item?.availableQty || 0,
            loanedQuantity: itemDetail.quantityPending,
            borrowerId: loan.borrowerId,
            borrowerName: loan.borrower.fullName,
            borrowerDocument: loan.borrower.documentId,
            personType: loan.borrower.personType,
            fichaNumber: loan.fichaNumber || loan.borrower.fichaNumber,
            programName: loan.borrower.programName,
            requestDate: loan.requestDate,
            expectedReturnDate: loan.expectedReturnDate,
            daysLate,
            isOverdue,
            siteDescription: loan.siteDescription,
            purposeDescription: loan.purposeDescription,
            status: isOverdue ? 'vencido' : loan.status
          });
        }
      }
    }

    return records;
  }

  // --- DASHBOARD METRICS ---
  public getDashboardMetrics(): DashboardMetrics {
    const db = this.loadDatabase();
    const custodyRecords = this.getCustodyRecords();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const totalItemsCount = db.items.length;
    let totalUnitsCount = 0;
    let availableUnitsCount = 0;
    let loanedUnitsCount = 0;
    let maintenanceUnitsCount = 0;
    let damagedUnitsCount = 0;

    const categoryMap: Record<string, { count: number; units: number }> = {};
    const statusMap: Record<string, number> = {
      operativo: 0,
      en_mantenimiento: 0,
      deteriorado: 0,
      baja: 0
    };

    const lowStockItems: InventoryItem[] = [];

    for (const item of db.items) {
      totalUnitsCount += item.totalQty;
      availableUnitsCount += item.availableQty;
      loanedUnitsCount += item.loanedQty;
      maintenanceUnitsCount += item.maintenanceQty;
      damagedUnitsCount += item.damagedQty;

      statusMap[item.status] = (statusMap[item.status] || 0) + 1;

      if (!categoryMap[item.category]) {
        categoryMap[item.category] = { count: 0, units: 0 };
      }
      categoryMap[item.category].count += 1;
      categoryMap[item.category].units += item.totalQty;

      if (item.availableQty <= 2 && item.totalQty > 0) {
        lowStockItems.push(item);
      }
    }

    const activeLoans = db.loans.filter((l) => l.status === 'activo' || l.status === 'devuelto_parcial' || l.status === 'vencido');
    const overdueLoans = activeLoans.filter((l) => new Date(l.expectedReturnDate) < now);
    const returnsToday = activeLoans.filter((l) => l.expectedReturnDate.startsWith(todayStr));

    const categoryDistribution = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      units: data.units
    }));

    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count
    }));

    return {
      totalItemsCount,
      totalUnitsCount,
      availableUnitsCount,
      loanedUnitsCount,
      maintenanceUnitsCount,
      damagedUnitsCount,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      returnsScheduledTodayCount: returnsToday.length,
      recentMovements: db.movements.slice(0, 10),
      categoryDistribution,
      statusDistribution,
      lowStockItems,
      urgentReturns: custodyRecords.filter((r) => r.isOverdue || r.daysLate > 0).slice(0, 10)
    };
  }

  // --- BULK IMPORT ---
  public bulkImport(
    itemsToImport: any[],
    actor: string
  ): {
    importedCount: number;
    skippedCount: number;
    errors: { row: number; senaCode?: string; name?: string; reason: string }[];
  } {
    const db = this.loadDatabase();
    let importedCount = 0;
    let skippedCount = 0;
    const errors: { row: number; senaCode?: string; name?: string; reason: string }[] = [];

    const existingCodes = new Set(db.items.map((i) => i.senaCode.trim().toLowerCase()));

    for (let i = 0; i < itemsToImport.length; i++) {
      const rowNum = i + 1;
      const raw = itemsToImport[i];

      const senaCode = String(raw.senaCode || raw['Código SENA'] || raw['CODIGO SENA'] || raw['Codigo'] || '').trim();
      const name = String(raw.name || raw['Nombre'] || raw['Elemento'] || raw['Descripción'] || '').trim();

      if (!senaCode) {
        errors.push({ row: rowNum, reason: 'Código SENA obligatorio no especificado.' });
        skippedCount++;
        continue;
      }

      if (!name) {
        errors.push({ row: rowNum, senaCode, reason: 'Nombre del elemento obligatorio no especificado.' });
        skippedCount++;
        continue;
      }

      if (existingCodes.has(senaCode.toLowerCase())) {
        errors.push({ row: rowNum, senaCode, name, reason: 'Código SENA duplicado ya existente en la base de datos.' });
        skippedCount++;
        continue;
      }

      const totalQty = Math.max(0, parseInt(raw.totalQty || raw.quantity || raw['Cantidad'] || raw['Existencias'] || '1', 10) || 1);
      const category = raw.category || raw['Categoría'] || raw['Categoria'] || 'Equipo de Laboratorio';
      const brand = raw.brand || raw['Marca'] || 'Genérico / SENA';
      const model = raw.model || raw['Modelo'] || 'Estándar';
      const unitOfMeasure = raw.unitOfMeasure || raw['Unidad de Medida'] || 'Unidad';
      const location = raw.defaultLocation || raw['Ubicación'] || raw['Ubicacion'] || 'Ambiente 104';
      const serialNumber = raw.serialNumber || raw['Serie'] || raw['Serial'] || '';

      const newItem: InventoryItem = {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        senaCode,
        internalCode: raw.internalCode || `LAB-IMP-${rowNum}`,
        name,
        description: raw.description || raw['Descripción Detallada'] || `Elemento importado: ${name}`,
        category: category as any,
        brand,
        model,
        serialNumber,
        unitOfMeasure: unitOfMeasure as any,
        initialQty: totalQty,
        totalQty,
        availableQty: totalQty,
        loanedQty: 0,
        maintenanceQty: 0,
        damagedQty: 0,
        status: 'operativo',
        defaultLocation: location,
        acquisitionDate: raw.acquisitionDate || new Date().toISOString().slice(0, 10),
        notes: raw.notes || 'Importado masivamente vía archivo',
        custodianName: db.config.custodianName,
        custodianId: db.config.custodianId,
        department: db.config.laboratory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.items.push(newItem);
      existingCodes.add(senaCode.toLowerCase());

      this.recordMovement({
        type: 'creacion',
        itemId: newItem.id,
        itemSenaCode: newItem.senaCode,
        itemName: newItem.name,
        quantityChanged: newItem.totalQty,
        balanceAvailable: newItem.availableQty,
        balanceLoaned: 0,
        balanceTotal: newItem.totalQty,
        responsiblePerson: actor,
        reason: 'Carga e importación masiva de inventario',
        observations: `Importado en lote. Archivo procesado fila #${rowNum}.`,
        referenceDocument: 'Importación Masiva'
      });

      importedCount++;
    }

    this.logAudit('IMPORTACION_MASIVA', 'INVENTORY', 'BULK', `Importados: ${importedCount}, Omitidos/Errores: ${skippedCount}`, actor);
    this.saveDatabase();

    return { importedCount, skippedCount, errors };
  }

  // --- BACKUP & RESTORE ---
  public exportFullBackup(): DatabaseSchema {
    return this.loadDatabase();
  }

  public restoreBackup(data: DatabaseSchema, actor: string): boolean {
    if (!data.items || !data.config || !data.loans) {
      throw new Error('El archivo de respaldo no cuenta con la estructura válida del sistema SENA.');
    }
    this.db = data;
    this.logAudit('RESTAURACION_BACKUP', 'DATABASE', 'FULL', 'Base de datos restaurada desde copia de seguridad externa', actor);
    this.saveDatabase();
    return true;
  }
}

export const dbService = new DatabaseService();
