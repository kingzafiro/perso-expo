import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelEmployerInterviewApi,
  fetchEmployerInterviewsApi,
  fetchMyInterviewsApi,
  lookupEmployerInterviewQrApi,
  resolveEmployerInterviewQrApi,
  scheduleApplicantInterviewApi,
} from "../api/interviews.api";
import type { ScheduleInterviewInput } from "../types/interviews.types";
import { applicantProfileQueryKey } from "./use-applicant-profile";

export const EMPLOYER_INTERVIEWS_QUERY_KEY = [
  "employer",
  "interviews",
] as const;

export const MY_INTERVIEWS_QUERY_KEY = ["candidate", "interviews"] as const;

export function useEmployerInterviews(enabled = true) {
  return useQuery({
    queryKey: EMPLOYER_INTERVIEWS_QUERY_KEY,
    queryFn: fetchEmployerInterviewsApi,
    enabled,
  });
}

export function useMyInterviews() {
  return useQuery({
    queryKey: MY_INTERVIEWS_QUERY_KEY,
    queryFn: fetchMyInterviewsApi,
  });
}

export function useScheduleApplicantInterview(
  idPostulacion: number | null,
  idVacante: number | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ScheduleInterviewInput) =>
      scheduleApplicantInterviewApi(idPostulacion!, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: EMPLOYER_INTERVIEWS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: MY_INTERVIEWS_QUERY_KEY }),
        ...(idPostulacion
          ? [
              queryClient.invalidateQueries({
                queryKey: applicantProfileQueryKey(idPostulacion),
              }),
            ]
          : []),
        ...(idVacante
          ? [
              queryClient.invalidateQueries({
                queryKey: ["employer", "vacancies", idVacante, "applicants"],
              }),
            ]
          : []),
      ]);
    },
  });
}

export function useLookupInterviewQr() {
  return useMutation({
    mutationFn: (codigo: string) => lookupEmployerInterviewQrApi(codigo),
  });
}

export function useResolveInterviewQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idEntrevista,
      accion,
      notas,
    }: {
      idEntrevista: number;
      accion: "aprobar" | "rechazar";
      notas?: string;
    }) => resolveEmployerInterviewQrApi(idEntrevista, { accion, notas }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: EMPLOYER_INTERVIEWS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: MY_INTERVIEWS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: applicantProfileQueryKey(res.entrevista.id_postulacion),
        }),
      ]);
    },
  });
}

export function useRescheduleEmployerInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idPostulacion,
      input,
    }: {
      idPostulacion: number;
      idVacante: number;
      input: ScheduleInterviewInput;
    }) => scheduleApplicantInterviewApi(idPostulacion, input),
    onSuccess: async (_res, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: EMPLOYER_INTERVIEWS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: MY_INTERVIEWS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: applicantProfileQueryKey(vars.idPostulacion),
        }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "vacancies", vars.idVacante, "applicants"],
        }),
      ]);
    },
  });
}

export function useCancelEmployerInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idEntrevista: number) =>
      cancelEmployerInterviewApi(idEntrevista),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: EMPLOYER_INTERVIEWS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: MY_INTERVIEWS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: applicantProfileQueryKey(res.entrevista.id_postulacion),
        }),
      ]);
    },
  });
}
