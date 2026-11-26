import type {
  FullProfileResponse,
  ProfileDireccion,
  ProfileExperienciaYear,
  ProfileUser,
} from "@/features/profile/types/profile.types";
import { apiClient } from "@/lib/api/client";

export async function fetchFullProfile(): Promise<FullProfileResponse> {
  const { data } = await apiClient.get<FullProfileResponse>(
    "/usuario/informacion",
  );
  return data;
}

export async function savePersonalInfo(payload: {
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  celular?: string;
}): Promise<{ ok: boolean; mensaje: string; usuario?: ProfileUser }> {
  const { data } = await apiClient.post("/usuario/datos/nombre", payload);
  return data;
}

export async function saveAddress(
  payload: ProfileDireccion,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post("/usuario/direccion", payload);
  return data;
}

export async function saveUniversity(
  universidad: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post("/usuario/universidad", {
    universidad,
  });
  return data;
}

export async function saveDegree(
  titulo: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post("/usuario/titulo", { titulo });
  return data;
}

export async function saveEnglish(payload: {
  ingles: string;
  certificado: boolean;
}): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post("/usuario/ingles", payload);
  return data;
}

export async function saveBio(
  historia: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post("/usuario/historia", { historia });
  return data;
}

export async function saveJobInterests(
  empleos: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post("/usuario/datos/empleos", { empleos });
  return data;
}

export async function saveLastJob(payload: {
  empresa: string;
  puesto: string;
  tiempo: string;
  telefono: string;
}): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.post(
    "/usuario/datos/antiguo/empleo",
    payload,
  );
  return data;
}

export async function createExperienceYear(payload: {
  year_one: string;
  year_two: string;
  experiencia: string;
}): Promise<{
  ok: boolean;
  mensaje: string;
  experiencia: ProfileExperienciaYear;
}> {
  const { data } = await apiClient.post("/usuario/experiencia/years", payload);
  return data;
}

export async function updateExperienceYear(
  id: number,
  payload: {
    year_one: string;
    year_two: string;
    experiencia: string;
  },
): Promise<{
  ok: boolean;
  mensaje: string;
  experiencia: ProfileExperienciaYear;
}> {
  const { data } = await apiClient.put(
    `/usuario/experiencia/years/${id}`,
    payload,
  );
  return data;
}

export async function deleteExperienceYear(
  id: number,
): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await apiClient.delete(`/usuario/experiencia/years/${id}`);
  return data;
}
