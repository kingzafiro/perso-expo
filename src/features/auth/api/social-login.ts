import type {
  AppleLoginPayload,
  AuthResponse,
  GoogleLoginPayload,
} from "@/features/auth/types/auth.types";
import { apiClient } from "@/lib/api/client";

export async function loginWithGoogle(
  payload: GoogleLoginPayload,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/google", payload);
  return response.data;
}

export async function loginWithApple(
  payload: AppleLoginPayload,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/apple", payload);
  return response.data;
}
