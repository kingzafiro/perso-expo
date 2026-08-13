import { apiClient } from "@/lib/api/client";

export interface VerifyRecoveryRequest {
  email: string;
  codigo: string;
}

export interface VerifyRecoveryResponse {
  ok: boolean;
  mensaje: string;
  resetToken: string;
}

export async function verifyRecovery(
  payload: VerifyRecoveryRequest,
): Promise<VerifyRecoveryResponse> {
  const { data } = await apiClient.post<VerifyRecoveryResponse>(
    "/verificar-recuperacion",
    payload,
  );

  return data;
}
