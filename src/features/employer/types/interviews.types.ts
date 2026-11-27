export type InterviewPassStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "cancelada";

export interface InterviewPass {
  id_entrevista: number;
  id_postulacion: number;
  id_vacante: number;
  id_empresa: number;
  id_candidato: number;
  qr_token: string;
  codigo_corto: string;
  fecha_hora: string;
  direccion_oficina: string;
  referencias: string;
  latitud: number | null;
  longitud: number | null;
  foto_referencia_url: string | null;
  estado: InterviewPassStatus;
  verificado_at: string | null;
  notas_verificacion: string;
  createdAt: string | null;
  empresa: {
    id_empresa: number;
    nombre_comercial: string;
    logo_url?: string | null;
    industria: string;
    ciudad: string;
    verificada: boolean;
  } | null;
  vacante: {
    id_vacante: number;
    titulo: string;
    ciudad: string;
  } | null;
  candidato: {
    id_usuario: number;
    nombre: string;
    email: string;
    celular: string;
    foto_perfil: string | null;
  } | null;
  candidato_resumen?: {
    ubicacion: string;
    universidad: string;
    titulo: string;
    ingles_nivel: string | null;
    ultimo_empleo: string;
    cv_subido: boolean;
    cv_url: string | null;
  } | null;
}

export interface ScheduleInterviewInput {
  direccion_oficina: string;
  fecha_hora?: string;
  referencias?: string;
  latitud?: number | null;
  longitud?: number | null;
  foto?: {
    uri: string;
    name: string;
    mimeType: string;
  } | null;
}
