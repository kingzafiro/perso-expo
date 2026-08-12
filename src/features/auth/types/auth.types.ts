export interface AuthUser {
  id_usuario: number;
  nombre: string;
  email: string;
}

export interface AuthResponse {
  ok: boolean;
  usuario: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  ok: boolean;
  codigo?: string;
  mensaje: string;
}

export interface RegisterResponse {
  ok: boolean;
  id_usuario?: number;
  email: string;
  requiereVerificacion: boolean;
  codigo?: string;
  mensaje: string;
}

export interface VerifyEmailResponse {
  ok: boolean;
  mensaje: string;
  accessToken: string;
  refreshToken: string;
}
