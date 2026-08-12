import { apiClient } from "@/lib/api/client";

interface RegisterRequest {
  email: string;
  pass: string;
}

export interface RegisterResponse {
  ok: boolean;
  id_usuario?: number;
  email: string;
  requiereVerificacion: boolean;
  codigo?: string;
  mensaje: string;
}

export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/registro", payload);

  return data;
}
