import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteUserDocument,
  fetchUserDocuments,
  uploadUserDocument,
} from "@/features/documents/api/documents.api";
import type { DocumentType } from "@/features/documents/types/documents.types";
import { FULL_PROFILE_QUERY_KEY } from "@/features/profile/hooks/use-full-profile";

export const USER_DOCUMENTS_QUERY_KEY = ["user-documents"] as const;

export function useUserDocuments() {
  return useQuery({
    queryKey: USER_DOCUMENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetchUserDocuments();
      return response.documentos;
    },
  });
}

export function useDocumentMutations() {
  const queryClient = useQueryClient();

  const invalidate = async (tipo?: DocumentType) => {
    await queryClient.invalidateQueries({ queryKey: USER_DOCUMENTS_QUERY_KEY });
    if (tipo === "ingles") {
      await queryClient.invalidateQueries({ queryKey: FULL_PROFILE_QUERY_KEY });
    }
  };

  const upload = useMutation({
    mutationFn: ({
      tipo,
      file,
    }: {
      tipo: DocumentType;
      file: { uri: string; name: string; mimeType: string };
    }) => uploadUserDocument(tipo, file),
    onSuccess: (_data, variables) => invalidate(variables.tipo),
  });

  const remove = useMutation({
    mutationFn: (tipo: DocumentType) => deleteUserDocument(tipo),
    onSuccess: (_data, tipo) => invalidate(tipo),
  });

  return { upload, remove };
}
