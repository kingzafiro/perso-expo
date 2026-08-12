import { apiClient } from "@/lib/api/client";

interface VerifyEmailRequest {
  email: string;
  codigo: string;
}

export interface VerifyEmailResponse {
  ok: boolean;
  mensaje: string;
  accessToken: string;
  refreshToken: string;
}

export async function verifyEmail(
  payload: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const { data } = await apiClient.post<VerifyEmailResponse>(
    "/verificar-email",
    payload,
  );

  return data;
}
