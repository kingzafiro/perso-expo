import { apiClient } from "@/lib/api/client";

import type {
  NotificationPreferences,
  RegisterPushTokenPayload,
} from "../types/notifications.types";

interface RegisterPushTokenResponse {
  ok: boolean;
  mensaje: string;
  token?: {
    id_push_token: number;
    expoPushToken: string;
    plataforma: string;
    activo: boolean;
  };
}

interface UnregisterPushTokenResponse {
  ok: boolean;
  mensaje: string;
  desactivados?: number;
}

interface PreferencesResponse {
  ok: boolean;
  preferencias: NotificationPreferences;
}

interface TestPushResponse {
  ok: boolean;
  mensaje: string;
  enviados?: number;
  fallidos?: number;
}

export async function registerPushTokenApi(payload: RegisterPushTokenPayload) {
  const { data } = await apiClient.post<RegisterPushTokenResponse>(
    "/usuario/notificaciones/token",
    payload,
  );
  return data;
}

export async function unregisterPushTokenApi(expoPushToken: string) {
  const { data } = await apiClient.delete<UnregisterPushTokenResponse>(
    "/usuario/notificaciones/token",
    {
      data: { expoPushToken },
    },
  );
  return data;
}

export async function getNotificationPreferencesApi() {
  const { data } = await apiClient.get<PreferencesResponse>(
    "/usuario/notificaciones/preferencias",
  );
  return data.preferencias;
}

export async function updateNotificationPreferencesApi(
  preferences: Partial<NotificationPreferences>,
) {
  const { data } = await apiClient.put<PreferencesResponse>(
    "/usuario/notificaciones/preferencias",
    preferences,
  );
  return data.preferencias;
}

export async function sendTestPushNotificationApi() {
  const { data } = await apiClient.post<TestPushResponse>(
    "/usuario/notificaciones/prueba",
  );
  return data;
}
