import { Appearance, Platform } from "react-native";
import { create } from "zustand";

import {
  getNotificationPreferencesApi,
  updateNotificationPreferencesApi,
} from "@/features/notifications/api/notifications.api";
import type { NotificationPreferences } from "@/features/notifications/types/notifications.types";
import { secureStorage } from "@/lib/storage/secure-storage";

export type { NotificationPreferences };

export type ColorSchemePreference = "system" | "light" | "dark";

export type PersoAppIconId =
  | "default"
  | "obsidian"
  | "sunset"
  | "glass"
  | "minimal"
  | "ember"
  | "midnight"
  | "amber"
  | "graphite";

const COLOR_SCHEME_KEY = "perso_color_scheme";
const APP_ICON_KEY = "perso_app_icon";
const NOTIFICATIONS_KEY = "perso_notifications";

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  empleos: true,
  postulaciones: true,
  correo: true,
  seguridad: true,
};

function applyNativeColorScheme(preference: ColorSchemePreference) {
  if (Platform.OS === "web") return;

  try {
    Appearance.setColorScheme(
      preference === "system" ? "unspecified" : preference,
    );
  } catch {
    // Ignorar en entornos que no soporten override nativo
  }
}

interface PreferencesState {
  colorScheme: ColorSchemePreference;
  appIcon: PersoAppIconId;
  notifications: NotificationPreferences;
  hydrated: boolean;
}

interface PreferencesActions {
  hydrate: () => Promise<void>;
  setColorScheme: (preference: ColorSchemePreference) => Promise<void>;
  setAppIcon: (icon: PersoAppIconId) => Promise<void>;
  setNotificationPreference: (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => Promise<void>;
  setNotificationsBulk: (
    patch: Partial<NotificationPreferences>,
  ) => Promise<void>;
  syncNotificationsFromServer: () => Promise<void>;
}

export const usePreferencesStore = create<
  PreferencesState & PreferencesActions
>((set, get) => ({
  colorScheme: "system",
  appIcon: "default",
  notifications: DEFAULT_NOTIFICATIONS,
  hydrated: false,

  hydrate: async () => {
    try {
      const [storedScheme, storedIcon, storedNotifications] = await Promise.all(
        [
          secureStorage.getItem(COLOR_SCHEME_KEY),
          secureStorage.getItem(APP_ICON_KEY),
          secureStorage.getItem(NOTIFICATIONS_KEY),
        ],
      );

      const colorScheme: ColorSchemePreference =
        storedScheme === "light" ||
        storedScheme === "dark" ||
        storedScheme === "system"
          ? storedScheme
          : "system";

      const appIcon = (storedIcon as PersoAppIconId | null) || "default";

      let notifications = DEFAULT_NOTIFICATIONS;
      if (storedNotifications) {
        try {
          notifications = {
            ...DEFAULT_NOTIFICATIONS,
            ...JSON.parse(storedNotifications),
          };
        } catch {
          notifications = DEFAULT_NOTIFICATIONS;
        }
      }

      applyNativeColorScheme(colorScheme);

      set({
        colorScheme,
        appIcon,
        notifications,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setColorScheme: async (preference) => {
    applyNativeColorScheme(preference);
    set({ colorScheme: preference });

    try {
      await secureStorage.setItem(COLOR_SCHEME_KEY, preference);
    } catch {
      // No bloquear UI si falla persistencia
    }
  },

  setAppIcon: async (icon) => {
    set({ appIcon: icon });

    try {
      await secureStorage.setItem(APP_ICON_KEY, icon);
    } catch {
      // No bloquear UI si falla persistencia
    }
  },

  setNotificationPreference: async (key, value) => {
    const next = {
      ...get().notifications,
      [key]: value,
    };

    set({ notifications: next });

    try {
      await secureStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    } catch {
      // No bloquear UI si falla persistencia local
    }

    try {
      const accessToken = await secureStorage.getAccessToken();
      if (accessToken) {
        await updateNotificationPreferencesApi({ [key]: value });
      }
    } catch {
      // No bloquear UI si falla sincronización remota
    }
  },

  setNotificationsBulk: async (patch) => {
    const next = {
      ...get().notifications,
      ...patch,
    };

    set({ notifications: next });

    try {
      await secureStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    } catch {
      // No bloquear UI si falla persistencia local
    }

    try {
      const accessToken = await secureStorage.getAccessToken();
      if (accessToken) {
        await updateNotificationPreferencesApi(patch);
      }
    } catch {
      // No bloquear UI si falla sincronización remota
    }
  },

  syncNotificationsFromServer: async () => {
    try {
      const accessToken = await secureStorage.getAccessToken();
      if (!accessToken) return;

      const remote = await getNotificationPreferencesApi();
      const merged = {
        ...DEFAULT_NOTIFICATIONS,
        ...remote,
      };

      set({ notifications: merged });
      await secureStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(merged));
    } catch {
      // Mantener preferencias locales si falla red o backend
    }
  },
}));
