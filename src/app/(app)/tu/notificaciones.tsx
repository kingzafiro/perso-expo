import { Bell, Briefcase, Mail, ShieldCheck } from "lucide-react-native";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { usePreferencesStore } from "@/stores/preferences.store";

export default function NotificacionesScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const notifications = usePreferencesStore((state) => state.notifications);
  const setNotificationPreference = usePreferencesStore(
    (state) => state.setNotificationPreference,
  );

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const trackFalse = isDark ? "#3A3633" : "#D6D1CC";

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
