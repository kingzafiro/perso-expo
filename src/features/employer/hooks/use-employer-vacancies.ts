import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useEmployerStore } from "@/stores/employer.store";

import {
  createEmployerVacancyApi,
  deleteEmployerVacancyApi,
  getAdminOverviewApi,
  getAdminReportsApi,
  getEmployerVacanciesApi,
  getVacancyApplicantsApi,
  updateApplicantStatusApi,
  updateEmployerVacancyApi,
  updateEmployerVacancyStatusApi,
  type CreateVacancyInput,
} from "../api/employer.api";
import type { ApplicationStatus, VacancyStatus } from "../types/employer.types";

export const EMPLOYER_VACANCIES_QUERY_KEY = ["employer", "vacancies"] as const;
export const PUBLIC_JOBS_QUERY_KEY = ["public", "vacancies"] as const;
const CANDIDATE_FAVORITES_QUERY_KEY = ["candidate", "favorite-vacancies"] as const;
const CANDIDATE_APPLICATIONS_QUERY_KEY = ["candidate", "applications"] as const;

export function useEmployerVacancies(enabled: boolean) {
  return useQuery({
    queryKey: EMPLOYER_VACANCIES_QUERY_KEY,
    queryFn: getEmployerVacanciesApi,
    enabled,
  });
}

export function useCreateEmployerVacancy() {
  const queryClient = useQueryClient();
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);

  return useMutation({
    mutationFn: (input: CreateVacancyInput) => createEmployerVacancyApi(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EMPLOYER_VACANCIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PUBLIC_JOBS_QUERY_KEY }),
        syncFromServer(),
      ]);
    },
  });
}

export function useUpdateEmployerVacancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idVacante,
      input,
    }: {
      idVacante: number;
      input: CreateVacancyInput;
    }) => updateEmployerVacancyApi(idVacante, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EMPLOYER_VACANCIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PUBLIC_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_FAVORITES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY }),
      ]);
    },
  });
}

export function useDeleteEmployerVacancy() {
  const queryClient = useQueryClient();
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);

  return useMutation({
    mutationFn: (idVacante: number) => deleteEmployerVacancyApi(idVacante),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EMPLOYER_VACANCIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PUBLIC_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_FAVORITES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY }),
        syncFromServer(),
      ]);
    },
  });
}

export function useUpdateEmployerVacancyStatus() {
  const queryClient = useQueryClient();
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);

  return useMutation({
    mutationFn: ({
      idVacante,
      estado,
    }: {
      idVacante: number;
      estado: VacancyStatus;
    }) => updateEmployerVacancyStatusApi(idVacante, estado),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EMPLOYER_VACANCIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PUBLIC_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_FAVORITES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_APPLICATIONS_QUERY_KEY }),
        syncFromServer(),
      ]);
    },
  });
}

export function useVacancyApplicants(idVacante: number | null) {
  return useQuery({
    queryKey: ["employer", "vacancies", idVacante, "applicants"],
    queryFn: () => getVacancyApplicantsApi(idVacante!),
    enabled: Boolean(idVacante),
  });
}

export function useUpdateApplicantStatus(idVacante: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idPostulacion,
      estado,
    }: {
      idPostulacion: number;
      estado: ApplicationStatus;
    }) => updateApplicantStatusApi(idPostulacion, estado),
    onSuccess: async () => {
      if (idVacante) {
        await queryClient.invalidateQueries({
          queryKey: ["employer", "vacancies", idVacante, "applicants"],
        });
      }
    },
  });
}

export function useAdminOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["employer", "admin", "overview"],
    queryFn: getAdminOverviewApi,
    enabled,
  });
}

export function useAdminReports(enabled: boolean) {
  return useQuery({
    queryKey: ["employer", "admin", "reports"],
    queryFn: getAdminReportsApi,
    enabled,
  });
}
