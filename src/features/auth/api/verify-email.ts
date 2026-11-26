import type { VerifyEmailResponse } from "@/features/auth/types/auth.types";
import { apiClient } from "@/lib/api/client";

interface VerifyEmailRequest {
  email: string;
  codigo: string;
}

export type { VerifyEmailResponse };

export async function verifyEmail(
  payload: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const { data } = await apiClient.post<VerifyEmailResponse>(
    "/verificar-email",
    payload,
  );

  return data;
}
