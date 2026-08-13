import { apiClient } from "@/lib/api/client";

export interface ResetPasswordRequest {
  resetToken: string;
  nuevaPassword: string;
}

export interface ResetPasswordResponse {
  ok: boolean;
  mensaje: string;
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    "/reset-password",
    payload,
  );

  return data;
}
