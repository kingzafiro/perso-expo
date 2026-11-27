import type { AuthUser } from "@/features/auth/types/auth.types";

export interface ProfileUser extends AuthUser {
  celular?: string | null;
  celular_verificado?: boolean;
  celular_verificado_at?: string | null;
}

export interface ProfileDireccion {
  estado: string;
  municipio: string;
  calle: string;
  numero: string;
  colonia: string;
  cp: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface ProfileInformacion {
  universidad: string;
  titulo: string;
  inglesCodigo: string;
  inglesNivel: string | null;
  certificado: boolean;
  historia: string;
}

export interface ProfileEmpleo {
  empleos: string;
  empresa: string;
  puesto: string;
  tiempo: string;
  telefono: string;
}

export interface ProfileExperienciaYear {
  id: number;
  year_one: string;
  year_two: string;
  experiencia: string;
}

export interface FullProfile {
  usuario: ProfileUser;
  direccion: ProfileDireccion | null;
  informacion: ProfileInformacion | null;
  empleo: ProfileEmpleo | null;
  experiencias: ProfileExperienciaYear[];
}

export interface FullProfileResponse {
  ok: boolean;
  perfil: FullProfile;
}

export const ENGLISH_LEVELS = [
  { code: "1", label: "A1", description: "Principiante" },
  { code: "2", label: "A2", description: "Básico" },
  { code: "3", label: "B1", description: "Intermedio" },
  { code: "4", label: "B2", description: "Intermedio alto" },
  { code: "5", label: "C1", description: "Avanzado" },
  { code: "6", label: "C2", description: "Dominio" },
] as const;

export const SUGGESTED_JOB_INTERESTS = [
  "Tecnología",
  "Diseño",
  "Ventas",
  "Administración",
  "Operaciones",
  "Logística",
  "Marketing",
  "Finanzas",
  "Atención al cliente",
  "Ingeniería",
  "Recursos Humanos",
  "Salud",
] as const;
