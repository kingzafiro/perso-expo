import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform } from "react-native";

import {
  EMPLOYER_VACANCIES_QUERY_KEY,
  PUBLIC_JOBS_QUERY_KEY,
} from "@/features/employer/hooks/use-employer-vacancies";
import type {
  EmployerVacancy,
  VacancyModality,
  VacancyReportReason,
} from "@/features/employer/types/employer.types";

import {
  applyToVacancyApi,
  fetchFavoriteVacanciesApi,
  fetchMyApplicationsApi,
  fetchMyDocumentRequestsApi,
  fetchPublicVacanciesApi,
  reportVacancyApi,
  respondDocumentRequestApi,
  toggleFavoriteVacancyApi,
} from "../api/jobs.api";

export const MY_DOC_REQUESTS_QUERY_KEY = [
  "candidate",
  "document-requests",
] as const;

export const MY_FAVORITE_JOBS_QUERY_KEY = [
  "candidate",
  "favorite-vacancies",
] as const;

export const MY_APPLICATIONS_QUERY_KEY = [
  "candidate",
  "applications",
] as const;

const FAVORITE_DEBOUNCE_MS = 500;

interface PendingFavoriteSync {
  confirmedState: boolean;
  desiredState: boolean;
  vacancySnapshot: EmployerVacancy;
  timer: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
  onSettled?: (idVacante: number, finalState: boolean) => void;
}

const pendingFavoritesMap = new Map<number, PendingFavoriteSync>();

function applyFavoriteOptimisticUpdate(
  queryClient: QueryClient,
  vacancy: EmployerVacancy,
  nextFavorite: boolean,
) {
  const idVacante = vacancy.id_vacante;

  queryClient.setQueriesData<EmployerVacancy[]>(
    { queryKey: PUBLIC_JOBS_QUERY_KEY },
    (old) =>
      old?.map((item) =>
        item.id_vacante === idVacante
          ? { ...item, es_favorito: nextFavorite }
          : item,
      ),
  );

  queryClient.setQueryData<EmployerVacancy[]>(
    MY_FAVORITE_JOBS_QUERY_KEY,
    (old) => {
      if (!old) return old;
      if (nextFavorite) {
        const exists = old.some((item) => item.id_vacante === idVacante);
        if (exists) {
          return old.map((item) =>
            item.id_vacante === idVacante
              ? { ...item, es_favorito: true }
              : item,
          );
        }
        return [{ ...vacancy, es_favorito: true }, ...old];
      }
      return old.filter((item) => item.id_vacante !== idVacante);
    },
  );
}

async function flushFavoriteSync(
  queryClient: QueryClient,
  idVacante: number,
) {
  const entry = pendingFavoritesMap.get(idVacante);
  if (!entry || entry.inFlight) return;

  if (entry.desiredState === entry.confirmedState) {
    pendingFavoritesMap.delete(idVacante);
    return;
  }

  const targetState = entry.desiredState;
  entry.inFlight = true;

  try {
    const res = await toggleFavoriteVacancyApi(idVacante, targetState);
    entry.confirmedState = res.es_favorito;
  } catch {
    // Revert optimistic UI only if the user has not already toggled again
    if (entry.desiredState === targetState) {
      entry.desiredState = entry.confirmedState;
      applyFavoriteOptimisticUpdate(
        queryClient,
        entry.vacancySnapshot,
        entry.confirmedState,
      );
      entry.onSettled?.(idVacante, entry.confirmedState);
    }
  } finally {
    entry.inFlight = false;
  }

  const latest = pendingFavoritesMap.get(idVacante);
  if (!latest) return;

  if (latest.desiredState !== latest.confirmedState) {
    if (latest.timer) clearTimeout(latest.timer);
    latest.timer = setTimeout(() => {
      latest.timer = null;
      void flushFavoriteSync(queryClient, idVacante);
    }, FAVORITE_DEBOUNCE_MS);
  } else {
    pendingFavoritesMap.delete(idVacante);
    // Keep UI silent: cache is already up-to-date; only refresh inactive favorites query if never fetched
    if (queryClient.getQueryData(MY_FAVORITE_JOBS_QUERY_KEY) === undefined) {
      await queryClient.invalidateQueries({
        queryKey: MY_FAVORITE_JOBS_QUERY_KEY,
        refetchType: "inactive",
      });
    }
  }
}

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

export function useFavoriteVacancies() {
  return useQuery({
    queryKey: MY_FAVORITE_JOBS_QUERY_KEY,
    queryFn: fetchFavoriteVacanciesApi,
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: MY_APPLICATIONS_QUERY_KEY,
    queryFn: fetchMyApplicationsApi,
  });
}

export function useToggleFavoriteVacancy() {
  const queryClient = useQueryClient();

  const toggleFavorite = useCallback(
    (
      vacancy: EmployerVacancy,
      options?: { onSettled?: (idVacante: number, finalState: boolean) => void },
    ): boolean => {
      const idVacante = vacancy.id_vacante;
      const existing = pendingFavoritesMap.get(idVacante);
      const currentState = existing
        ? existing.desiredState
        : Boolean(vacancy.es_favorito);
      const nextState = !currentState;

      if (Platform.OS !== "web") {
        void Haptics.impactAsync(
          nextState
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Soft,
        );
      }

      // Instant optimistic update across feed and Mis favoritos
      applyFavoriteOptimisticUpdate(queryClient, vacancy, nextState);

      if (existing) {
        if (existing.timer) clearTimeout(existing.timer);
        existing.desiredState = nextState;
        existing.vacancySnapshot = { ...vacancy, es_favorito: nextState };
        if (options?.onSettled) existing.onSettled = options.onSettled;
        existing.timer = setTimeout(() => {
          existing.timer = null;
          void flushFavoriteSync(queryClient, idVacante);
        }, FAVORITE_DEBOUNCE_MS);
      } else {
        const entry: PendingFavoriteSync = {
          confirmedState: currentState,
          desiredState: nextState,
          vacancySnapshot: { ...vacancy, es_favorito: nextState },
          timer: null,
          inFlight: false,
          onSettled: options?.onSettled,
        };
        entry.timer = setTimeout(() => {
          entry.timer = null;
          void flushFavoriteSync(queryClient, idVacante);
        }, FAVORITE_DEBOUNCE_MS);
        pendingFavoritesMap.set(idVacante, entry);
      }

      return nextState;
    },
    [queryClient],
  );

  return { toggleFavorite };
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
        queryClient.invalidateQueries({ queryKey: MY_FAVORITE_JOBS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MY_APPLICATIONS_QUERY_KEY }),
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
