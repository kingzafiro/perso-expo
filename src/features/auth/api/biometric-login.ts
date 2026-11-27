import type { AuthResponse, AuthUser } from "@/features/auth/types/auth.types";
import { apiClient } from "@/lib/api/client";

interface RenewTokenApiResponse {
  ok: boolean;
  accessToken: string;
  tokenType?: "Bearer";
  usuario?: AuthUser;
}

export async function renewSessionWithBiometricToken(
  refreshToken: string,
): Promise<Omit<AuthResponse, "usuario"> & { usuario?: AuthUser }> {
  const { data } = await apiClient.post<RenewTokenApiResponse>("/renew/token", {
    refreshToken,
  });

  if (!data?.accessToken) {
    throw new Error("No se recibió un token de acceso válido.");
  }

  return {
    ok: data.ok,
    tokenType: data.tokenType,
    accessToken: data.accessToken,
    refreshToken,
    usuario: data.usuario,
  };
}
