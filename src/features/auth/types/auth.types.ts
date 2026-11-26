export interface AuthUser {
  id_usuario: number;
  nombre: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  email: string;
  foto_perfil?: string | null;
}

export interface AuthResponse {
  ok: boolean;
  usuario: AuthUser;
  tokenType?: "Bearer";
  accessToken: string;
  refreshToken: string;
}

export interface GoogleLoginPayload {
  idToken?: string;
  accessToken?: string;
}

export interface AppleLoginPayload {
  identityToken: string;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  };
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
  usuario?: AuthUser;
  accessToken: string;
  refreshToken: string;
}
