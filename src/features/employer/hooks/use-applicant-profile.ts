import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getApplicantFullProfileApi,
  requestApplicantDocumentsApi,
} from "../api/applicant-profile.api";

export function applicantProfileQueryKey(idPostulacion: number | null) {
  return ["employer", "applicant-profile", idPostulacion] as const;
}

export function useApplicantFullProfile(
  idPostulacion: number | null,
  idVacante: number | null = null,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: applicantProfileQueryKey(idPostulacion),
    queryFn: async () => {
      const result = await getApplicantFullProfileApi(idPostulacion!);
      if (result.postulacion.auto_en_revision && idVacante) {
        void queryClient.invalidateQueries({
          queryKey: ["employer", "vacancies", idVacante, "applicants"],
        });
      }
      return result;
    },
    enabled: Boolean(idPostulacion),
  });
}

export function useRequestApplicantDocuments(idPostulacion: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { documentos: string[]; mensaje?: string }) =>
      requestApplicantDocumentsApi(idPostulacion!, payload),
    onSuccess: async () => {
      if (idPostulacion) {
        await queryClient.invalidateQueries({
          queryKey: applicantProfileQueryKey(idPostulacion),
        });
      }
    },
  });
}
