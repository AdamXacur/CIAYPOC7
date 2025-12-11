import { CitizenRequest, GovAction, Alert, TrendData } from './types';

export const MOCK_REQUESTS: CitizenRequest[] = [
  { id: '1', folio: 'YUC-2024-001', date: '2024-05-20', topic: 'Transporte', sentiment: 'Negativo', status: 'Recibida', department: 'Secretaría de Movilidad', description: 'El autobús de la ruta 52 tarda más de 45 minutos en pasar por la mañana.', urgency: 'Media', location: 'Mérida Centro' },
  { id: '2', folio: 'YUC-2024-002', date: '2024-05-20', topic: 'Salud', sentiment: 'Neutro', status: 'En revisión', department: 'Secretaría de Salud', description: 'Solicitud de información sobre horarios de vacunación en el centro de salud.', urgency: 'Baja', location: 'Valladolid' },
  { id: '3', folio: 'YUC-2024-003', date: '2024-05-21', topic: 'Seguridad', sentiment: 'Negativo', status: 'Atendida', department: 'SSP', description: 'Robo de luminarias en la colonia México. Se requiere patrullaje.', urgency: 'Alta', location: 'Mérida Norte' },
  { id: '4', folio: 'YUC-2024-004', date: '2024-05-21', topic: 'Servicios Públicos', sentiment: 'Positivo', status: 'Atendida', department: 'Ayuntamiento', description: 'Agradecimiento por la rápida reparación del bache en la calle 60.', urgency: 'Baja', location: 'Mérida Centro' },
  { id: '5', folio: 'YUC-2024-005', date: '2024-05-22', topic: 'Transporte', sentiment: 'Negativo', status: 'Recibida', department: 'Secretaría de Movilidad', description: 'Chofer de ruta Va y Ven no respetó la parada establecida.', urgency: 'Media', location: 'Kanasín' },
  { id: '6', folio: 'YUC-2024-006', date: '2024-05-22', topic: 'Salud', sentiment: 'Negativo', status: 'En revisión', department: 'Secretaría de Salud', description: 'Falta de medicamentos para diabetes en el hospital O´Horán.', urgency: 'Crítica', location: 'Mérida Sur' },
  { id: '7', folio: 'YUC-2024-007', date: '2024-05-23', topic: 'Seguridad', sentiment: 'Neutro', status: 'Recibida', department: 'SSP', description: 'Reporte de vehículo abandonado hace 3 días.', urgency: 'Baja', location: 'Progreso' },
  { id: '8', folio: 'YUC-2024-008', date: '2024-05-23', topic: 'Educación', sentiment: 'Positivo', status: 'Atendida', department: 'SEGEY', description: 'Excelente atención en la inscripción escolar en línea.', urgency: 'Baja', location: 'Mérida' },
  { id: '9', folio: 'YUC-2024-009', date: '2024-05-24', topic: 'Transporte', sentiment: 'Negativo', status: 'Recibida', department: 'Secretaría de Movilidad', description: 'Unidades en mal estado y sin aire acondicionado.', urgency: 'Alta', location: 'Umán' },
  { id: '10', folio: 'YUC-2024-010', date: '2024-05-24', topic: 'Servicios Públicos', sentiment: 'Negativo', status: 'En revisión', department: 'JAPAY', description: 'Fuga de agua potable importante en la avenida principal.', urgency: 'Crítica', location: 'Mérida Poniente' },
];

export const MOCK_ACTIONS: GovAction[] = [
  { id: 'A1', date: '2024-05-18', type: 'Inversión', description: 'Entrega de 20 nuevas unidades de transporte "Va y Ven".', relatedTopic: 'Transporte' },
  { id: 'A2', date: '2024-05-21', type: 'Operativo', description: 'Despliegue de operativo de seguridad vacacional en la costa.', relatedTopic: 'Seguridad' },
  { id: 'A3', date: '2024-05-23', type: 'Mantenimiento', description: 'Brigada emergente de reparación de fugas JAPAY.', relatedTopic: 'Servicios Públicos' },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'AL1', type: 'warning', message: 'Incremento del 15% en quejas de Transporte en zona Kanasín.', topic: 'Transporte', region: 'Kanasín', active: true },
  { id: 'AL2', type: 'critical', message: 'Pico de reportes de falta de agua en Mérida Poniente.', topic: 'Servicios Públicos', region: 'Mérida Poniente', active: true },
];

export const TREND_DATA: TrendData[] = [
  { date: '2024-05-18', Seguridad: 12, Salud: 5, Transporte: 20, Servicios: 8 },
  { date: '2024-05-19', Seguridad: 10, Salud: 6, Transporte: 18, Servicios: 12 },
  { date: '2024-05-20', Seguridad: 15, Salud: 8, Transporte: 25, Servicios: 10 },
  { date: '2024-05-21', Seguridad: 11, Salud: 4, Transporte: 22, Servicios: 9 },
  { date: '2024-05-22', Seguridad: 9, Salud: 7, Transporte: 15, Servicios: 18 },
  { date: '2024-05-23', Seguridad: 13, Salud: 9, Transporte: 19, Servicios: 22 },
  { date: '2024-05-24', Seguridad: 14, Salud: 6, Transporte: 16, Servicios: 25 },
];
