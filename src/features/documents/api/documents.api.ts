import { Platform } from "react-native";

import {
  DOCUMENT_META,
  type DocumentType,
  type UploadDocumentResponse,
  type UserDocumentsResponse,
} from "@/features/documents/types/documents.types";
import { apiClient } from "@/lib/api/client";

export async function fetchUserDocuments(): Promise<UserDocumentsResponse> {
  const { data } = await apiClient.get<UserDocumentsResponse>(
    "/usuario/documentos",
  );
  return data;
}

export async function uploadUserDocument(
  tipo: DocumentType,
  file: { uri: string; name: string; mimeType: string },
): Promise<UploadDocumentResponse> {
  const meta = DOCUMENT_META[tipo];
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

  const { data } = await apiClient.post<UploadDocumentResponse>(
    meta.endpoint,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 45_000,
    },
  );

  return data;
}

export async function deleteUserDocument(
  tipo: DocumentType,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.delete(`/usuario/documentos/${tipo}`);
  return data;
}
