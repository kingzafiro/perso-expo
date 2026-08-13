import { apiClient } from "@/lib/api/client";

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  mensaje: string;
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/forgot-password",
    payload,
  );

  return data;
}
