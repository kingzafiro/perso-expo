import { apiClient } from "@/lib/api/client";
import {
  optimizeProfilePhoto,
  PROFILE_PHOTO_MAX_BYTES,
} from "@/lib/media/image-optimizer";

export interface ProfilePhotoResponse {
  ok: boolean;
  foto: string | null;
  mensaje?: string;
}

export interface UploadProfilePhotoInput {
  uri: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  fileName?: string | null;
}

export async function getProfilePhoto(): Promise<ProfilePhotoResponse> {
  const response = await apiClient.get<ProfilePhotoResponse>(
    "/usuario/foto/perfil",
  );
  return response.data;
}

export async function uploadProfilePhoto(
  input: UploadProfilePhotoInput,
): Promise<ProfilePhotoResponse> {
  // Optimiza en el dispositivo a 1:1 y <= 50 KB antes de enviarla al servidor
  const optimized = await optimizeProfilePhoto({
    uri: input.uri,
    width: input.width,
    height: input.height,
    maxBytes: PROFILE_PHOTO_MAX_BYTES,
  });

  const formData = new FormData();

  formData.append("imagen", {
    uri: optimized.uri,
    name: optimized.fileName,
    type: optimized.mimeType,
  } as unknown as Blob);

  const response = await apiClient.post<ProfilePhotoResponse>(
    "/upload/foto/perfil",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30_000,
    },
  );

  return response.data;
}

export async function deleteProfilePhoto(): Promise<ProfilePhotoResponse> {
  const response = await apiClient.delete<ProfilePhotoResponse>(
    "/usuario/foto/perfil",
  );
  return response.data;
}
