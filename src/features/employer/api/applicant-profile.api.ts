import { env } from "@/config/env";
import { apiClient } from "@/lib/api/client";

import type {
  ApplicantFullProfilePayload,
  DocumentAccessRequest,
} from "../types/applicant-profile.types";

export async function getApplicantFullProfileApi(
  idPostulacion: number,
): Promise<ApplicantFullProfilePayload> {
  const { data } = await apiClient.get<
    ApplicantFullProfilePayload & { ok: boolean }
  >(`/postulaciones/${idPostulacion}/perfil`, {
    baseURL: env.employerApiUrl,
  });
  return data;
}

export async function requestApplicantDocumentsApi(
  idPostulacion: number,
  payload: { documentos: string[]; mensaje?: string },
): Promise<{ ok: boolean; mensaje: string; solicitud: DocumentAccessRequest }> {
  const { data } = await apiClient.post<{
    ok: boolean;
    mensaje: string;
    solicitud: DocumentAccessRequest;
  }>(`/postulaciones/${idPostulacion}/solicitar-documentos`, payload, {
    baseURL: env.employerApiUrl,
  });
  return data;
}
