import type { AuthUser } from "@/features/auth/types/auth.types";
import { apiClient } from "@/lib/api/client";

export interface UpdateProfilePayload {
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
}

export interface UpdateProfileResponse {
  ok: boolean;
  mensaje: string;
  usuario: AuthUser;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  const response = await apiClient.put<UpdateProfileResponse>(
    "/usuario/perfil",
    payload,
  );
  return response.data;
}
