export type Sentiment = 'Positivo' | 'Negativo' | 'Neutro';
export type Status = 'Recibida' | 'En revisión' | 'Atendida' | 'Rechazada';
export type Topic = 'Seguridad' | 'Salud' | 'Transporte' | 'Servicios Públicos' | 'Educación' | 'Transparencia' | 'Otros';
export type Urgency = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type RequestType = 'ADMINISTRATIVA' | 'OPERATIVA' | 'DESCONOCIDA';

export interface CitizenRequest {
  id: string;
  folio: string;
  created_at: string; // ISO Date
  topic: Topic;
  sentiment: Sentiment;
  status: Status;
  department_name?: string;
  description: string;
  urgency: Urgency;
  location_text?: string;
  
  // Nuevos campos IA
  request_type?: RequestType;
  suggested_action?: string;
  analysis_status?: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR';
}

export interface AIProgress {
  total: number;
  processed: number;
  pending: number;
  percentage: number;
  status: 'idle' | 'processing';
}

export interface GovAction {
  id: string;
  date: string;
  type: string;
  description: string;
  relatedTopic: Topic;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  message: string;
  topic?: Topic;
  region?: string;
  active: boolean;
}

export interface TrendData {
  date: string;
  Seguridad: number;
  Salud: number;
  Transporte: number;
  Servicios: number;
}