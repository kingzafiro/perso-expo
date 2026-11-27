import type { ApplicationStatus } from "./employer.types";
import type { InterviewPass } from "./interviews.types";

export type DocumentRequestStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "revocada";

export interface ApplicantDocumentItem {
  tipo: string;
  etiqueta: string;
  formato: "pdf" | "image";
  oficial: boolean;
  subido: boolean;
  autorizado: boolean;
  url: string | null;
}

export interface RequestedDocumentChip {
  tipo: string;
  etiqueta: string;
  subido?: boolean;
  autorizado: boolean;
}

export interface DocumentAccessRequest {
  id_solicitud: number;
  id_postulacion: number;
  id_vacante: number;
  id_empresa: number;
  estado: DocumentRequestStatus;
  mensaje: string;
  documentos_solicitados: RequestedDocumentChip[];
  documentos_autorizados: string[];
  respondido_at: string | null;
  createdAt: string | null;
  empresa: {
    id_empresa: number;
    nombre_comercial: string;
    industria: string;
    ciudad: string;
    verificada: boolean;
  } | null;
  vacante: {
    id_vacante: number;
    titulo: string;
    ciudad: string;
  } | null;
}

export interface ApplicantFullProfilePayload {
  postulacion: {
    id_postulacion: number;
    id_vacante: number;
    estado: ApplicationStatus;
    auto_en_revision?: boolean;
    mensaje_presentacion: string;
    createdAt: string | null;
  };
  vacante: {
    id_vacante: number;
    titulo: string;
  } | null;
  perfil: {
    usuario: {
      id_usuario: number;
      nombre: string | null;
      apellido_paterno: string | null;
      apellido_materno: string | null;
      celular: string | null;
      email: string;
      foto_perfil: string | null;
    };
    direccion: {
      municipio: string;
      estado: string;
      colonia: string;
      cp: string;
    } | null;
    informacion: {
      universidad: string;
      titulo: string;
      inglesCodigo: string;
      inglesNivel: string | null;
      certificado: boolean;
      historia: string;
    } | null;
    empleo: {
      empleos: string;
      empresa: string;
      puesto: string;
      tiempo: string;
      telefono: string;
    } | null;
    experiencias: {
      id: number;
      year_one: string;
      year_two: string;
      experiencia: string;
    }[];
  };
  cv: {
    subido: boolean;
    url: string | null;
    etiqueta: string;
  };
  documentos: ApplicantDocumentItem[];
  solicitudes: DocumentAccessRequest[];
  entrevista_activa?: InterviewPass | null;
}
