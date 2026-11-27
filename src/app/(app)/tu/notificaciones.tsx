import axios from "axios";
import * as Haptics from "expo-haptics";
import {
  Bell,
  BellOff,
  Briefcase,
  Mail,
  Send,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { sendTestPushNotificationApi } from "@/features/notifications/api/notifications.api";
import {
  getNotificationPermissionSnapshot,
  getSavedPushToken,
  registerDeviceForPushNotifications,
} from "@/features/notifications/lib/notifications-client";
import type {
  NotificationEnvironment,
  NotificationPermissionState,
} from "@/features/notifications/types/notifications.types";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { usePreferencesStore } from "@/stores/preferences.store";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (serverMessage) return serverMessage;
  }
  return fallback;
}

export default function NotificacionesScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const notifications = usePreferencesStore((state) => state.notifications);
  const setNotificationPreference = usePreferencesStore(
    (state) => state.setNotificationPreference,
  );
  const syncNotificationsFromServer = usePreferencesStore(
    (state) => state.syncNotificationsFromServer,
  );

  const [environment, setEnvironment] =
    useState<NotificationEnvironment>("native");
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionState>("undetermined");
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);
  const [missingProjectId, setMissingProjectId] = useState(false);
  const [activating, setActivating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const refreshDeviceStatus = useCallback(async () => {
    const [snapshot, savedToken] = await Promise.all([
      getNotificationPermissionSnapshot(),
      getSavedPushToken(),
    ]);

    setEnvironment(snapshot.environment);
    setPermissionStatus(snapshot.status);
    setCanAskAgain(snapshot.canAskAgain);
    setRegisteredToken(savedToken);

    if (snapshot.environment === "native" && snapshot.status === "granted") {
      const result = await registerDeviceForPushNotifications({
        promptIfNeeded: false,
      });
      setRegisteredToken(result.token ?? savedToken);
      setMissingProjectId(result.reason === "missing-project-id");
    }
  }, []);

  useEffect(() => {
    void syncNotificationsFromServer();
    void refreshDeviceStatus();

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshDeviceStatus();
      }
    });

    return () => {
      sub.remove();
    };
  }, [refreshDeviceStatus, syncNotificationsFromServer]);

  const handleActivatePush = async () => {
    if (activating) return;
    setActivating(true);

    try {
      const result = await registerDeviceForPushNotifications({
        promptIfNeeded: true,
      });

      setEnvironment(result.environment);
      setPermissionStatus(result.status);
      setCanAskAgain(result.canAskAgain);
      setRegisteredToken(result.token);
      setMissingProjectId(result.reason === "missing-project-id");

      if (result.ok) {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
        Alert.alert(
          "Notificaciones activadas",
          "Este dispositivo ya está registrado para recibir avisos de Perso.",
        );
        return;
      }

      if (result.reason === "permission-denied" && !result.canAskAgain) {
        Alert.alert(
          "Permiso desactivado",
          "Activa las notificaciones para Perso desde la configuración del sistema.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Abrir configuración",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
        return;
      }

      if (result.reason === "missing-project-id") {
        Alert.alert(
          "Configuración de EAS pendiente",
          "Ejecuta `eas init` para vincular el proyecto y generar el projectId de Expo.",
        );
      }
    } finally {
      setActivating(false);
    }
  };

  const handleSendTestPush = async () => {
    if (sendingTest) return;
    setSendingTest(true);

    try {
      const res = await sendTestPushNotificationApi();
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      Alert.alert(
        "Prueba enviada",
        res.mensaje || "Deberías recibir la notificación en unos segundos.",
      );
    } catch (error) {
      Alert.alert(
        "No se pudo enviar la prueba",
        getErrorMessage(
          error,
          "Verifica que este dispositivo esté registrado y con conexión.",
        ),
      );
    } finally {
      setSendingTest(false);
    }
  };

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const trackFalse = isDark ? "#3A3633" : "#D6D1CC";

  const statusConfig = (() => {
    if (environment === "expo-go") {
      return {
        title: "Modo Expo Go",
        subtitle:
          "Las notificaciones push remotas requieren un Development Build (eas build --profile development).",
        value: "Limitado",
        iconBgColor: "#FF9F0A",
        icon: <Smartphone size={18} color="#FFFFFF" />,
      };
    }

    if (environment === "simulator") {
      return {
        title: "Simulador detectado",
        subtitle:
          "Las notificaciones push remotas requieren un dispositivo físico iOS o Android.",
        value: "Simulador",
        iconBgColor: "#8E8E93",
        icon: <Smartphone size={18} color="#FFFFFF" />,
      };
    }

    if (environment === "web") {
      return {
        title: "Versión web",
        subtitle: "Las notificaciones push móviles están disponibles en iOS y Android.",
        value: "Web",
        iconBgColor: "#8E8E93",
        icon: <Smartphone size={18} color="#FFFFFF" />,
      };
    }

    if (permissionStatus !== "granted") {
      return {
        title: "Push desactivadas en el dispositivo",
        subtitle: canAskAgain
          ? "Actívalas para recibir alertas en tiempo real."
          : "Habilítalas desde la configuración de tu dispositivo.",
        value: "Inactivas",
        iconBgColor: "#FF3B30",
        icon: <BellOff size={18} color="#FFFFFF" />,
      };
    }

    if (missingProjectId) {
      return {
        title: "Falta vincular proyecto EAS",
        subtitle:
          "Permiso concedido, pero falta `extra.eas.projectId` (ejecuta `eas init`).",
        value: "Pendiente",
        iconBgColor: "#FF9F0A",
        icon: <Smartphone size={18} color="#FFFFFF" />,
      };
    }

    return {
      title: "Notificaciones push activas",
      subtitle: registeredToken
        ? "Dispositivo vinculado con Expo Push Service."
        : "Permiso concedido. Sincronizando dispositivo...",
      value: registeredToken ? "Activas" : "Conectando",
      iconBgColor: "#34C759",
      icon: <Bell size={18} color="#FFFFFF" />,
    };
  })();

  const showActivateButton =
    environment === "native" && permissionStatus !== "granted";
  const showTestButton =
    environment === "native" &&
    permissionStatus === "granted" &&
    Boolean(registeredToken);

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Notificaciones" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsGroup
          title="Estado del dispositivo"
          footer="Tus preferencias se sincronizan con tu cuenta en todos tus dispositivos."
        >
          <SettingsRow
            title={statusConfig.title}
            subtitle={statusConfig.subtitle}
            value={statusConfig.value}
            icon={statusConfig.icon}
            iconBgColor={statusConfig.iconBgColor}
            showChevron={
              environment === "native" &&
              permissionStatus !== "granted" &&
              !canAskAgain
            }
            onPress={
              environment === "native" &&
              permissionStatus !== "granted" &&
              !canAskAgain
                ? () => {
                    void Linking.openSettings();
                  }
                : undefined
            }
          />
        </SettingsGroup>

        {showActivateButton ? (
          <AppButton
            title={
              canAskAgain
                ? "Activar notificaciones push"
                : "Abrir configuración del sistema"
            }
            loading={activating}
            onPress={
              canAskAgain
                ? handleActivatePush
                : () => {
                    void Linking.openSettings();
                  }
            }
          />
        ) : null}

        {showTestButton ? (
          <SettingsGroup>
            <SettingsRow
              title="Enviar notificación de prueba"
              subtitle="Verifica la entrega en este dispositivo"
              value={sendingTest ? "Enviando..." : undefined}
              icon={<Send size={18} color="#FFFFFF" />}
              iconBgColor={theme.primary}
              showChevron={!sendingTest}
              onPress={sendingTest ? undefined : handleSendTestPush}
            />
          </SettingsGroup>
        ) : null}

        <SettingsGroup
          title="Actividad"
          footer="Elige qué alertas deseas recibir sobre empleos y actividad de tu cuenta."
        >
          <SettingsRow
            title="Nuevos empleos"
            subtitle="Vacantes recomendadas para ti"
            icon={<Briefcase size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            showDivider
            showChevron={false}
            rightElement={
              <Switch
                value={notifications.empleos}
                onValueChange={(value) =>
                  setNotificationPreference("empleos", value)
                }
                trackColor={{ false: trackFalse, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingsRow
            title="Actualizaciones y avisos"
            subtitle="Cambios en tus procesos y mensajes"
            icon={<Bell size={18} color="#FFFFFF" />}
            iconBgColor="#FF3B30"
            showDivider
            showChevron={false}
            rightElement={
              <Switch
                value={notifications.postulaciones}
                onValueChange={(value) =>
                  setNotificationPreference("postulaciones", value)
                }
                trackColor={{ false: trackFalse, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingsRow
            title="Correos electrónicos"
            subtitle="Resúmenes y avisos en tu correo"
            icon={<Mail size={18} color="#FFFFFF" />}
            iconBgColor="#0A84FF"
            showDivider
            showChevron={false}
            rightElement={
              <Switch
                value={notifications.correo}
                onValueChange={(value) =>
                  setNotificationPreference("correo", value)
                }
                trackColor={{ false: trackFalse, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingsRow
            title="Alertas de seguridad"
            subtitle="Cambios de contraseña e inicios de sesión"
            icon={<ShieldCheck size={18} color="#FFFFFF" />}
            iconBgColor="#34C759"
            showChevron={false}
            rightElement={
              <Switch
                value={notifications.seguridad}
                onValueChange={(value) =>
                  setNotificationPreference("seguridad", value)
                }
                trackColor={{ false: trackFalse, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </SettingsGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 20,
  },
});
