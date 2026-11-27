import { Platform } from "react-native";

import { env } from "@/config/env";
import { apiClient } from "@/lib/api/client";

import type {
  AdminOverview,
  AdminReport,
  ApplicationStatus,
  BillingCycle,
  EmployerPdfExtraction,
  EmployerPlanId,
  EmployerProfile,
  EmployerStatusPayload,
  EmployerVacancy,
  VacancyApplicant,
  VacancyContractType,
  VacancyModality,
  VacancySalaryPeriod,
  VacancyStatus,
} from "../types/employer.types";

export interface UpsertEmployerProfileInput {
  companyName: string;
  legalName?: string;
  rfc?: string;
  industry: string;
  companySize: string;
  city: string;
  contactName: string;
  contactRole: string;
  workEmail: string;
  phone: string;
  description: string;
  selectedPlanId?: EmployerPlanId | null;
  billingCycle?: BillingCycle;
}

export interface SyncSubscriptionInput {
  planId?: EmployerPlanId;
  billingCycle?: BillingCycle;
  productId?: string;
  isTrial?: boolean;
  expirationDate?: string | null;
  platform?: "ios" | "android" | "web";
}

export interface CreateVacancyInput {
  titulo: string;
  modalidad: VacancyModality;
  tipo_contrato: VacancyContractType;
  ciudad: string;
  codigo_postal?: string;
  zona_colonia?: string;
  salario_min?: number | null;
  salario_max?: number | null;
  salario_periodo: VacancySalaryPeriod;
  horario?: string;
  experiencia?: string;
  escolaridad?: string;
  beneficios: string[];
  descripcion: string;
  responsabilidades?: string;
  requisitos?: string;
  perfil_tecnico?: string;
  ofrecemos?: string;
  contacto_visible?: string;
}

export async function getEmployerStatusApi(): Promise<EmployerStatusPayload> {
  const { data } = await apiClient.get<EmployerStatusPayload & { ok: boolean }>(
    "/status",
    { baseURL: env.employerApiUrl },
  );
  return {
    empresa: data.empresa ?? null,
    suscripcion: data.suscripcion ?? null,
    hasAccess: Boolean(data.hasAccess),
    isAdmin: Boolean(data.isAdmin),
    limits: data.limits ?? {
      maxActiveVacancies: 0,
      activeVacancies: 0,
      trialDays: 14,
    },
    sandboxEnabled: Boolean(data.sandboxEnabled),
    migrationPending: Boolean(data.migrationPending),
  };
}

export async function upsertEmployerProfileApi(
  payload: UpsertEmployerProfileInput,
): Promise<EmployerStatusPayload & { mensaje: string; empresa: EmployerProfile }> {
  const { data } = await apiClient.put<
    EmployerStatusPayload & { ok: boolean; mensaje: string; empresa: EmployerProfile }
  >("/profile", payload, { baseURL: env.employerApiUrl });
  return data;
}

export async function syncEmployerSubscriptionApi(
  payload: SyncSubscriptionInput,
): Promise<EmployerStatusPayload> {
  const { data } = await apiClient.post<EmployerStatusPayload & { ok: boolean }>(
    "/subscription/sync",
    payload,
    { baseURL: env.employerApiUrl },
  );
  return data;
}

export async function activateSandboxTrialApi(payload: {
  planId: EmployerPlanId;
  billingCycle: BillingCycle;
}): Promise<EmployerStatusPayload & { mensaje: string }> {
  const { data } = await apiClient.post<
    EmployerStatusPayload & { ok: boolean; mensaje: string }
  >("/subscription/sandbox-trial", payload, { baseURL: env.employerApiUrl });
  return data;
}

export async function getEmployerVacanciesApi(): Promise<EmployerVacancy[]> {
  const { data } = await apiClient.get<{
    ok: boolean;
    vacantes: EmployerVacancy[];
  }>("/vacantes", { baseURL: env.employerApiUrl });
  return data.vacantes ?? [];
}

export async function createEmployerVacancyApi(
  payload: CreateVacancyInput,
): Promise<EmployerVacancy> {
  const { data } = await apiClient.post<{
    ok: boolean;
    vacante: EmployerVacancy;
  }>("/vacantes", payload, { baseURL: env.employerApiUrl });
  return data.vacante;
}

export async function updateEmployerVacancyApi(
  idVacante: number,
  payload: CreateVacancyInput,
): Promise<EmployerVacancy> {
  const { data } = await apiClient.put<{
    ok: boolean;
    vacante: EmployerVacancy;
  }>(`/vacantes/${idVacante}`, payload, { baseURL: env.employerApiUrl });
  return data.vacante;
}

export async function deleteEmployerVacancyApi(idVacante: number) {
  await apiClient.delete(`/vacantes/${idVacante}`, {
    baseURL: env.employerApiUrl,
  });
}

export async function updateEmployerVacancyStatusApi(
  idVacante: number,
  estado: VacancyStatus,
): Promise<EmployerVacancy> {
  const { data } = await apiClient.patch<{
    ok: boolean;
    vacante: EmployerVacancy;
  }>(`/vacantes/${idVacante}/estado`, { estado }, { baseURL: env.employerApiUrl });
  return data.vacante;
}

export async function getVacancyApplicantsApi(
  idVacante: number,
): Promise<VacancyApplicant[]> {
  const { data } = await apiClient.get<{
    ok: boolean;
    postulantes: VacancyApplicant[];
  }>(`/vacantes/${idVacante}/postulantes`, { baseURL: env.employerApiUrl });
  return data.postulantes ?? [];
}

export async function updateApplicantStatusApi(
  idPostulacion: number,
  estado: ApplicationStatus,
) {
  const { data } = await apiClient.patch<{
    ok: boolean;
    postulacion: { id_postulacion: number; estado: ApplicationStatus };
  }>(
    `/postulaciones/${idPostulacion}/estado`,
    { estado },
    { baseURL: env.employerApiUrl },
  );
  return data.postulacion;
}

export async function getAdminOverviewApi(): Promise<AdminOverview> {
  const { data } = await apiClient.get<{ ok: boolean; resumen: AdminOverview }>(
    "/admin/resumen",
    { baseURL: env.employerApiUrl },
  );
  return data.resumen;
}

export async function getAdminReportsApi(): Promise<AdminReport[]> {
  const { data } = await apiClient.get<{ ok: boolean; reportes: AdminReport[] }>(
    "/admin/reportes",
    { baseURL: env.employerApiUrl },
  );
  return data.reportes ?? [];
}

export async function uploadEmployerVerificationPdfApi(file: {
  uri: string;
  name: string;
  mimeType: string;
}): Promise<
  EmployerStatusPayload & {
    ok: boolean;
    mensaje: string;
    extraccion: EmployerPdfExtraction;
  }
> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append("archivo", blob, file.name);
  } else {
    formData.append("archivo", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<
    EmployerStatusPayload & {
      ok: boolean;
      mensaje: string;
      extraccion: EmployerPdfExtraction;
    }
  >("/verificacion/documento", formData, {
    baseURL: env.employerApiUrl,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 45_000,
  });

  return data;
}
