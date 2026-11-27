import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  EMPLOYER_VACANCIES_QUERY_KEY,
  PUBLIC_JOBS_QUERY_KEY,
} from "@/features/employer/hooks/use-employer-vacancies";
import type {
  VacancyModality,
  VacancyReportReason,
} from "@/features/employer/types/employer.types";

import {
  applyToVacancyApi,
  fetchMyDocumentRequestsApi,
  fetchPublicVacanciesApi,
  reportVacancyApi,
  respondDocumentRequestApi,
} from "../api/jobs.api";

export const MY_DOC_REQUESTS_QUERY_KEY = [
  "candidate",
  "document-requests",
] as const;

export function usePublicVacancies(filters: {
  q?: string;
  modalidad?: VacancyModality | "all";
}) {
  return useQuery({
    queryKey: [
      ...PUBLIC_JOBS_QUERY_KEY,
      filters.q ?? "",
      filters.modalidad ?? "all",
    ],
    queryFn: () => fetchPublicVacanciesApi(filters),
  });
}

export function useApplyToVacancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idVacante,
      mensaje,
    }: {
      idVacante: number;
      mensaje?: string;
    }) => applyToVacancyApi(idVacante, mensaje),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PUBLIC_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EMPLOYER_VACANCIES_QUERY_KEY }),
      ]);
    },
  });
}

export function useReportVacancy() {
  return useMutation({
    mutationFn: ({
      idVacante,
      motivo,
      detalles,
    }: {
      idVacante: number;
      motivo: VacancyReportReason;
      detalles?: string;
    }) => reportVacancyApi(idVacante, { motivo, detalles }),
  });
}

export function useMyDocumentRequests() {
  return useQuery({
    queryKey: MY_DOC_REQUESTS_QUERY_KEY,
    queryFn: fetchMyDocumentRequestsApi,
  });
}

export function useRespondDocumentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idSolicitud,
      accion,
      documentosAutorizados,
    }: {
      idSolicitud: number;
      accion: "aprobar" | "rechazar" | "revocar";
      documentosAutorizados?: string[];
    }) =>
      respondDocumentRequestApi(idSolicitud, {
        accion,
        documentosAutorizados,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MY_DOC_REQUESTS_QUERY_KEY,
      });
    },
  });
}
