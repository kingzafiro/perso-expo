import type { LoginFormData } from "@/features/auth/schemas/login.schema";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { apiClient } from "@/lib/api/client";

export async function login(data: LoginFormData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/login", {
    email: data.email,
    pass: data.password,
  });

  return response.data;
}
