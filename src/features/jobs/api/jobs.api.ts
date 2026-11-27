import { env } from "@/config/env";
import type { DocumentAccessRequest } from "@/features/employer/types/applicant-profile.types";
import type {
  EmployerVacancy,
  VacancyModality,
  VacancyReportReason,
} from "@/features/employer/types/employer.types";
import { apiClient } from "@/lib/api/client";

export async function fetchPublicVacanciesApi(filters?: {
  q?: string;
  modalidad?: VacancyModality | "all";
}): Promise<EmployerVacancy[]> {
  const params: Record<string, string> = {};
  if (filters?.q?.trim()) params.q = filters.q.trim();
  if (filters?.modalidad && filters.modalidad !== "all") {
    params.modalidad = filters.modalidad;
  }

  const { data } = await apiClient.get<{
    ok: boolean;
    vacantes: EmployerVacancy[];
  }>("/", {
    baseURL: env.vacanciesApiUrl,
    params,
  });

  return data.vacantes ?? [];
}

export async function applyToVacancyApi(
  idVacante: number,
  mensaje_presentacion?: string,
) {
  const { data } = await apiClient.post<{
    ok: boolean;
    mensaje: string;
    alreadyApplied?: boolean;
    estado: string;
  }>(
    `/${idVacante}/postular`,
    { mensaje_presentacion: mensaje_presentacion?.trim() || undefined },
    { baseURL: env.vacanciesApiUrl },
  );

  return data;
}

export async function reportVacancyApi(
  idVacante: number,
  payload: { motivo: VacancyReportReason; detalles?: string },
) {
  const { data } = await apiClient.post<{ ok: boolean; mensaje: string }>(
    `/${idVacante}/reportar`,
    payload,
    { baseURL: env.vacanciesApiUrl },
  );
  return data;
}

export async function fetchMyDocumentRequestsApi(): Promise<
  DocumentAccessRequest[]
> {
  const { data } = await apiClient.get<{
    ok: boolean;
    solicitudes: DocumentAccessRequest[];
  }>("/mis-solicitudes-documentos", {
    baseURL: env.vacanciesApiUrl,
  });
  return data.solicitudes ?? [];
}

export async function respondDocumentRequestApi(
  idSolicitud: number,
  payload: {
    accion: "aprobar" | "rechazar" | "revocar";
    documentosAutorizados?: string[];
  },
): Promise<{ ok: boolean; mensaje: string; solicitud: DocumentAccessRequest }> {
  const { data } = await apiClient.patch<{
    ok: boolean;
    mensaje: string;
    solicitud: DocumentAccessRequest;
  }>(`/mis-solicitudes-documentos/${idSolicitud}`, payload, {
    baseURL: env.vacanciesApiUrl,
  });
  return data;
}
