import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getApplicantFullProfileApi,
  requestApplicantDocumentsApi,
} from "../api/applicant-profile.api";

export function applicantProfileQueryKey(idPostulacion: number | null) {
  return ["employer", "applicant-profile", idPostulacion] as const;
}

export function useApplicantFullProfile(idPostulacion: number | null) {
  return useQuery({
    queryKey: applicantProfileQueryKey(idPostulacion),
    queryFn: () => getApplicantFullProfileApi(idPostulacion!),
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
