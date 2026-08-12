export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  ok: boolean;
  msg: string;
  nombre: string;
  rol: string;
  token: string;
}
