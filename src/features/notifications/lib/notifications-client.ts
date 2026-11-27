import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import type * as NotificationsTypes from "expo-notifications";
import { Platform } from "react-native";

import { secureStorage } from "@/lib/storage/secure-storage";

import {
  registerPushTokenApi,
  unregisterPushTokenApi,
} from "../api/notifications.api";
import type {
  NotificationEnvironment,
  NotificationPermissionSnapshot,
  NotificationPermissionState,
  PushRegistrationResult,
} from "../types/notifications.types";

const PUSH_TOKEN_STORAGE_KEY = "perso_expo_push_token";
const BRAND_COLOR = "#F06808";

let notificationsModulePromise: Promise<typeof NotificationsTypes> | null =
  null;
let handlerConfigured = false;
let channelsConfigured = false;

export function getNotificationEnvironment(): NotificationEnvironment {
  if (Platform.OS === "web") {
    return "web";
  }

  if (isRunningInExpoGo()) {
    return "expo-go";
  }

  if (!Device.isDevice) {
    return "simulator";
  }

  return "native";
}

export function isPushSupportedEnvironment(): boolean {
  return getNotificationEnvironment() === "native";
}

async function loadNotificationsModule(): Promise<
  typeof NotificationsTypes | null
> {
  if (Platform.OS === "web" || isRunningInExpoGo()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }

  return notificationsModulePromise;
}

function resolveEasProjectId(): string | null {
  const fromExpoConfig = (
    Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  )?.eas?.projectId;
  const fromEasConfig = Constants.easConfig?.projectId;

  return fromExpoConfig ?? fromEasConfig ?? null;
}

function mapPermissionState(
  Notifications: typeof NotificationsTypes,
  settings: NotificationsTypes.NotificationPermissionsStatus,
): NotificationPermissionState {
  if (
    settings.granted ||
    settings.status === "granted" ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return "granted";
  }

  if (settings.status === "denied") {
    return "denied";
  }

  return "undetermined";
}

export async function configureNotificationHandler(): Promise<void> {
  if (handlerConfigured) return;

  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  handlerConfigured = true;
}

export async function ensureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android" || channelsConfigured) return;

  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;

  await Promise.all([
    Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: BRAND_COLOR,
    }),
    Notifications.setNotificationChannelAsync("empleos", {
      name: "Nuevos empleos",
      description: "Vacantes recomendadas para tu perfil",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: BRAND_COLOR,
    }),
    Notifications.setNotificationChannelAsync("postulaciones", {
      name: "Actualizaciones y avisos",
      description: "Avances en tus procesos y mensajes",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: BRAND_COLOR,
    }),
    Notifications.setNotificationChannelAsync("seguridad", {
      name: "Alertas de seguridad",
      description: "Cambios de contraseña e inicios de sesión",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: BRAND_COLOR,
    }),
  ]);

  channelsConfigured = true;
}

export async function getNotificationPermissionSnapshot(): Promise<NotificationPermissionSnapshot> {
  const environment = getNotificationEnvironment();
  const Notifications = await loadNotificationsModule();

  if (!Notifications) {
    return {
      status: "unavailable",
      canAskAgain: false,
      environment,
    };
  }

  const settings = await Notifications.getPermissionsAsync();

  return {
    status: mapPermissionState(Notifications, settings),
    canAskAgain: settings.canAskAgain,
    environment,
  };
}

export async function getSavedPushToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function registerDeviceForPushNotifications(options?: {
  promptIfNeeded?: boolean;
}): Promise<PushRegistrationResult> {
  const promptIfNeeded = options?.promptIfNeeded ?? false;
  const environment = getNotificationEnvironment();

  if (environment === "web") {
    return {
      ok: false,
      token: null,
      status: "unavailable",
      canAskAgain: false,
      environment,
      reason: "web",
    };
  }

  if (environment === "expo-go") {
    return {
      ok: false,
      token: null,
      status: "unavailable",
      canAskAgain: false,
      environment,
      reason: "expo-go",
    };
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return {
      ok: false,
      token: null,
      status: "unavailable",
      canAskAgain: false,
      environment,
      reason: "expo-go",
    };
  }

  await configureNotificationHandler();
  await ensureAndroidNotificationChannels();

  let settings = await Notifications.getPermissionsAsync();
  let status = mapPermissionState(Notifications, settings);

  if (status !== "granted") {
    if (!promptIfNeeded || !settings.canAskAgain) {
      return {
        ok: false,
        token: null,
        status,
        canAskAgain: settings.canAskAgain,
        environment,
        reason: "permission-denied",
      };
    }

    settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    status = mapPermissionState(Notifications, settings);

    if (status !== "granted") {
      return {
        ok: false,
        token: null,
        status,
        canAskAgain: settings.canAskAgain,
        environment,
        reason: "permission-denied",
      };
    }
  }

  if (environment === "simulator") {
    return {
      ok: false,
      token: null,
      status: "granted",
      canAskAgain: true,
      environment,
      reason: "simulator",
    };
  }

  const projectId = resolveEasProjectId();
  if (!projectId) {
    return {
      ok: false,
      token: null,
      status: "granted",
      canAskAgain: true,
      environment,
      reason: "missing-project-id",
    };
  }

  let expoPushToken: string;
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    expoPushToken = tokenResponse.data;
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudo obtener ExpoPushToken:", error);
    }
    return {
      ok: false,
      token: null,
      status: "granted",
      canAskAgain: true,
      environment,
      reason: "token-error",
    };
  }

  try {
    const plataforma = Platform.OS === "ios" ? "ios" : "android";
    await registerPushTokenApi({
      expoPushToken,
      plataforma,
      dispositivoNombre: Device.deviceName ?? Device.modelName ?? null,
      appVersion: Constants.expoConfig?.version ?? null,
    });

    await secureStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);

    return {
      ok: true,
      token: expoPushToken,
      status: "granted",
      canAskAgain: true,
      environment,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudo registrar ExpoPushToken en backend:", error);
    }
    return {
      ok: false,
      token: expoPushToken,
      status: "granted",
      canAskAgain: true,
      environment,
      reason: "server-error",
    };
  }
}

export async function unregisterCurrentDevicePushToken(): Promise<void> {
  try {
    const savedToken = await secureStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (!savedToken) return;

    await unregisterPushTokenApi(savedToken).catch(() => {
      // No bloquear cierre de sesión si falla red o token expiró
    });
    await secureStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // No bloquear cierre de sesión
  }
}

export async function subscribeToNotificationEvents(handlers: {
  onReceived?: (notification: NotificationsTypes.Notification) => void;
  onResponse?: (response: NotificationsTypes.NotificationResponse) => void;
}): Promise<() => void> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return () => {};
  }

  await configureNotificationHandler();
  await ensureAndroidNotificationChannels();

  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse && handlers.onResponse) {
    handlers.onResponse(lastResponse);
    Notifications.clearLastNotificationResponse();
  }

  const receivedSub = handlers.onReceived
    ? Notifications.addNotificationReceivedListener(handlers.onReceived)
    : null;

  const responseSub = handlers.onResponse
    ? Notifications.addNotificationResponseReceivedListener(handlers.onResponse)
    : null;

  return () => {
    receivedSub?.remove();
    responseSub?.remove();
  };
}
