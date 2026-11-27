import { Platform } from "react-native";

import { env } from "@/config/env";
import { apiClient } from "@/lib/api/client";

import type {
  InterviewPass,
  ScheduleInterviewInput,
} from "../types/interviews.types";

export async function scheduleApplicantInterviewApi(
  idPostulacion: number,
  input: ScheduleInterviewInput,
): Promise<{ ok: boolean; mensaje: string; entrevista: InterviewPass }> {
  const formData = new FormData();
  formData.append("direccion_oficina", input.direccion_oficina.trim());
  if (input.fecha_hora?.trim()) {
    formData.append("fecha_hora", input.fecha_hora.trim());
  }
  if (input.referencias?.trim()) {
    formData.append("referencias", input.referencias.trim());
  }
  if (typeof input.latitud === "number" && Number.isFinite(input.latitud)) {
    formData.append("latitud", String(input.latitud));
  }
  if (typeof input.longitud === "number" && Number.isFinite(input.longitud)) {
    formData.append("longitud", String(input.longitud));
  }

  if (input.foto) {
    if (Platform.OS === "web") {
      const response = await fetch(input.foto.uri);
      const blob = await response.blob();
      formData.append("foto_referencia", blob, input.foto.name);
    } else {
      formData.append("foto_referencia", {
        uri: input.foto.uri,
        name: input.foto.name,
        type: input.foto.mimeType,
      } as unknown as Blob);
    }
  }

  const { data } = await apiClient.post<{
    ok: boolean;
    mensaje: string;
    entrevista: InterviewPass;
  }>(`/postulaciones/${idPostulacion}/entrevista`, formData, {
    baseURL: env.employerApiUrl,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function fetchEmployerInterviewsApi(): Promise<InterviewPass[]> {
  const { data } = await apiClient.get<{
    ok: boolean;
    entrevistas: InterviewPass[];
  }>("/entrevistas", {
    baseURL: env.employerApiUrl,
  });
  return data.entrevistas ?? [];
}

export async function lookupEmployerInterviewQrApi(
  codigo: string,
): Promise<InterviewPass> {
  const { data } = await apiClient.post<{
    ok: boolean;
    entrevista: InterviewPass;
  }>(
    "/entrevistas/verificar-qr",
    { codigo: codigo.trim() },
    { baseURL: env.employerApiUrl },
  );
  return data.entrevista;
}

export async function resolveEmployerInterviewQrApi(
  idEntrevista: number,
  payload: { accion: "aprobar" | "rechazar"; notas?: string },
): Promise<{ ok: boolean; mensaje: string; entrevista: InterviewPass }> {
  const { data } = await apiClient.patch<{
    ok: boolean;
    mensaje: string;
    entrevista: InterviewPass;
  }>(`/entrevistas/${idEntrevista}/verificar`, payload, {
    baseURL: env.employerApiUrl,
  });
  return data;
}

export async function cancelEmployerInterviewApi(
  idEntrevista: number,
): Promise<{ ok: boolean; mensaje: string; entrevista: InterviewPass }> {
  const { data } = await apiClient.patch<{
    ok: boolean;
    mensaje: string;
    entrevista: InterviewPass;
  }>(
    `/entrevistas/${idEntrevista}/cancelar`,
    {},
    { baseURL: env.employerApiUrl },
  );
  return data;
}

export async function fetchMyInterviewsApi(): Promise<InterviewPass[]> {
  const { data } = await apiClient.get<{
    ok: boolean;
    entrevistas: InterviewPass[];
  }>("/mis-entrevistas", {
    baseURL: env.vacanciesApiUrl,
  });
  return data.entrevistas ?? [];
}
