import { router, type Href } from "expo-router";
import { useEffect } from "react";

import { usePreferencesStore } from "@/stores/preferences.store";

import {
  configureNotificationHandler,
  registerDeviceForPushNotifications,
  subscribeToNotificationEvents,
} from "../lib/notifications-client";

function extractRouteFromNotificationData(
  data: Record<string, unknown> | undefined,
): Href | null {
  const rawRoute = data?.route;
  if (typeof rawRoute !== "string") return null;

  const trimmed = rawRoute.trim();
  if (!trimmed.startsWith("/")) return null;

  return trimmed as Href;
}

export function usePushNotifications(enabled: boolean) {
  const syncNotificationsFromServer = usePreferencesStore(
    (state) => state.syncNotificationsFromServer,
  );

  useEffect(() => {
    void configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let cleanupListeners: (() => void) | null = null;

    void syncNotificationsFromServer();
    void registerDeviceForPushNotifications({ promptIfNeeded: false });

    void subscribeToNotificationEvents({
      onResponse: (response) => {
        const data = response.notification.request.content.data;
        const route = extractRouteFromNotificationData(data);
        if (route) {
          router.push(route);
        }
      },
    }).then((cleanup) => {
      if (cancelled) {
        cleanup();
      } else {
        cleanupListeners = cleanup;
      }
    });

    return () => {
      cancelled = true;
      cleanupListeners?.();
    };
  }, [enabled, syncNotificationsFromServer]);
}
