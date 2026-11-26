import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteUserDocument,
  fetchUserDocuments,
  uploadUserDocument,
} from "@/features/documents/api/documents.api";
import type { DocumentType } from "@/features/documents/types/documents.types";

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

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: USER_DOCUMENTS_QUERY_KEY });

  const upload = useMutation({
    mutationFn: ({
      tipo,
      file,
    }: {
      tipo: DocumentType;
      file: { uri: string; name: string; mimeType: string };
    }) => uploadUserDocument(tipo, file),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (tipo: DocumentType) => deleteUserDocument(tipo),
    onSuccess: invalidate,
  });

  return { upload, remove };
}
