import { apiClient } from "@/lib/api/client";

interface ResendVerificationCodeRequest {
  email: string;
}

export interface ResendVerificationCodeResponse {
  ok: boolean;
  codigo: string;
  mensaje: string;
  retryAfter: number;
}

export async function resendVerificationCode(
  payload: ResendVerificationCodeRequest,
): Promise<ResendVerificationCodeResponse> {
  const { data } = await apiClient.post<ResendVerificationCodeResponse>(
    "/reenviar-codigo",
    payload,
  );

  return data;
}
