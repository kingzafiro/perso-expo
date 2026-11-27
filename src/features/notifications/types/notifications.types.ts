export type NotificationEnvironment = "native" | "expo-go" | "simulator" | "web";

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "undetermined"
  | "unavailable";

export interface NotificationPreferences {
  empleos: boolean;
  postulaciones: boolean;
  correo: boolean;
  seguridad: boolean;
}

export interface NotificationPermissionSnapshot {
  status: NotificationPermissionState;
  canAskAgain: boolean;
  environment: NotificationEnvironment;
}

export interface PushRegistrationResult {
  ok: boolean;
  token: string | null;
  status: NotificationPermissionState;
  canAskAgain: boolean;
  environment: NotificationEnvironment;
  reason?:
    | "web"
    | "expo-go"
    | "simulator"
    | "permission-denied"
    | "missing-project-id"
    | "token-error"
    | "server-error";
}

export interface RegisterPushTokenPayload {
  expoPushToken: string;
  plataforma: "ios" | "android" | "web";
  dispositivoNombre?: string | null;
  appVersion?: string | null;
}
