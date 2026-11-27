import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";

import { renewSessionWithBiometricToken } from "@/features/auth/api/biometric-login";
import type { ApiErrorResponse, AuthUser } from "@/features/auth/types/auth.types";
import {
  type BiometricStatus,
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricStatus,
  unlockBiometricCredential,
} from "@/lib/auth/biometrics";
import { saveSessionTokens } from "@/lib/auth/session";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

const INITIAL_STATUS: BiometricStatus = {
  isSupported: false,
  hasHardware: false,
  isEnrolled: false,
  kind: Platform.OS === "ios" ? "face-id" : "biometrics",
  label: Platform.OS === "ios" ? "Face ID" : "Biometría",
  isEnabled: false,
  hasStoredCredential: false,
  canLoginWithBiometrics: false,
  savedAccount: null,
};

const statusListeners = new Set<() => void>();

export function notifyBiometricStatusChanged() {
  statusListeners.forEach((listener) => {
    listener();
  });
}

export function useBiometricStatus() {
  const [status, setStatus] = useState<BiometricStatus>(INITIAL_STATUS);
  const [isChecking, setIsChecking] = useState(Platform.OS !== "web");

  const refresh = useCallback(async () => {
    const next = await getBiometricStatus();
    setStatus(next);
    setIsChecking(false);
    return next;
  }, []);

  useEffect(() => {
    void refresh();

    const listener = () => {
      void refresh();
    };
    statusListeners.add(listener);

    if (Platform.OS === "web") {
      return () => {
        statusListeners.delete(listener);
      };
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refresh();
      }
    });

    return () => {
      statusListeners.delete(listener);
      subscription.remove();
    };
  }, [refresh]);

  return { status, isChecking, refresh };
}

export function useBiometricToggle() {
  const user = useAuthStore((state) => state.user);
  const { status, isChecking, refresh } = useBiometricStatus();
  const [isToggling, setIsToggling] = useState(false);

  const toggleBiometrics = useCallback(
    async (nextValue: boolean) => {
      if (isToggling) return;
      setIsToggling(true);

      try {
        if (!nextValue) {
          await disableBiometricLogin();
          notifyBiometricStatusChanged();
          await refresh();
          if (Platform.OS !== "web") {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return;
        }

        if (!status.isEnrolled) {
          Alert.alert(
            `${status.label} no configurado`,
            `Activa ${status.label} en los ajustes de tu dispositivo para poder usarlo en Perso.`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Abrir ajustes",
                onPress: () => {
                  void Linking.openSettings();
                },
              },
            ],
          );
          return;
        }

        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken || !user) {
          Alert.alert(
            "Sesión no disponible",
            "Cierra sesión e inicia nuevamente para activar el acceso biométrico.",
          );
          return;
        }

        const result = await enableBiometricLogin({
          refreshToken,
          user,
          requirePrompt: true,
        });

        notifyBiometricStatusChanged();
        await refresh();

        if (result.ok) {
          if (Platform.OS !== "web") {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          Alert.alert(
            `${result.label} activado`,
            `Ahora podrás iniciar sesión en Perso usando ${result.label}.`,
          );
          return;
        }

        if (!result.cancelled && result.message) {
          Alert.alert(`No se pudo activar ${status.label}`, result.message);
        }
      } finally {
        setIsToggling(false);
      }
    },
    [isToggling, refresh, status.isEnrolled, status.label, user],
  );

  return {
    status,
    isChecking,
    isToggling,
    toggleBiometrics,
    refresh,
  };
}

export interface BiometricLoginResult {
  ok: boolean;
  cancelled?: boolean;
  expired?: boolean;
  message?: string;
}

export function useBiometricLogin(
  onStatusChange?: () => void | Promise<unknown>,
) {
  return useMutation<BiometricLoginResult, never, void>({
    mutationFn: async () => {
      const unlocked = await unlockBiometricCredential();

      if (!unlocked.ok) {
        if (unlocked.missing) {
          notifyBiometricStatusChanged();
          await onStatusChange?.();
        }
        return {
          ok: false,
          cancelled: unlocked.cancelled,
          message: unlocked.message || undefined,
        };
      }

      const { credential, label } = unlocked;

      try {
        const renewed = await renewSessionWithBiometricToken(
          credential.refreshToken,
        );

        const resolvedUser: AuthUser = renewed.usuario ?? {
          id_usuario: credential.userId,
          email: credential.email,
          nombre: credential.nombre ?? null,
        };

        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }

        await saveSessionTokens(
          renewed.accessToken,
          renewed.refreshToken,
          resolvedUser,
        );

        return { ok: true };
      } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const statusCode = error.response?.status;
          if (statusCode === 401 || statusCode === 403) {
            await disableBiometricLogin();
            notifyBiometricStatusChanged();
            await onStatusChange?.();
            return {
              ok: false,
              expired: true,
              message: `Tu sesión con ${label} expiró. Inicia sesión con tu correo para activarla nuevamente.`,
            };
          }

          return {
            ok: false,
            message:
              error.response?.data?.mensaje ??
              "No pudimos conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.",
          };
        }

        return {
          ok: false,
          message: `No fue posible iniciar sesión con ${label}. Inténtalo nuevamente.`,
        };
      }
    },
  });
}
