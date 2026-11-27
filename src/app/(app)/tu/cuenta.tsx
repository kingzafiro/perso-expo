import {
  FingerprintPattern,
  KeyRound,
  Mail,
  ScanFace,
  ShieldAlert,
  Trash2,
} from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";

import { forgotPassword } from "@/features/auth/api/forgot-password";
import { useBiometricToggle } from "@/features/auth/hooks/use-biometric-login";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

export default function CuentaScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const {
    status: biometricStatus,
    isToggling: togglingBiometrics,
    toggleBiometrics,
  } = useBiometricToggle();

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const trackFalse = isDark ? "#3A3633" : "#D6D1CC";

  const handleChangeEmail = () => {
    Alert.alert(
      "Cambiar correo electrónico",
      "Próximamente podrás actualizar tu correo con verificación en dos pasos directamente desde aquí.",
    );
  };

  const handleChangePassword = () => {
    const email = user?.email;

    if (!email) {
      Alert.alert(
        "Cambiar contraseña",
        "No encontramos un correo asociado a tu sesión actual.",
      );
      return;
    }

    Alert.alert(
      "Cambiar contraseña",
      `Enviaremos un código de seguridad a ${email} para que puedas actualizar tu contraseña.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar código",
          onPress: async () => {
            try {
              await forgotPassword({ email });
              Alert.alert(
                "Código enviado",
                `Revisa tu bandeja en ${email} para continuar con el cambio de contraseña.`,
              );
            } catch {
              Alert.alert(
                "Error",
                "No fue posible enviar el código en este momento.",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción es permanente y eliminará tu perfil y datos asociados. ¿Deseas solicitar la eliminación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Solicitud registrada",
              "Para proteger tu cuenta, confirmaremos esta solicitud por correo electrónico.",
            );
          },
        },
      ],
    );
  };

  const biometricSubtitle = biometricStatus.isEnabled
    ? `Activo para ${biometricStatus.savedAccount?.email ?? user?.email ?? "tu cuenta"}`
    : biometricStatus.isEnrolled
      ? "Inicia sesión sin escribir tu contraseña"
      : `Configura ${biometricStatus.label} en los ajustes del dispositivo`;

  const biometricIcon =
    biometricStatus.kind === "face-id" ? (
      <ScanFace size={18} color="#FFFFFF" />
    ) : (
      <FingerprintPattern size={18} color="#FFFFFF" />
    );

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Configuración de la cuenta" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsGroup
          title="Acceso y credenciales"
          footer="Esta sección protege los datos sensibles de inicio de sesión y seguridad de tu cuenta."
        >
          <SettingsRow
            title="Correo electrónico"
            subtitle={user?.email ?? "No disponible"}
            icon={<Mail size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            showDivider
            onPress={handleChangeEmail}
          />

          <SettingsRow
            title="Contraseña"
            subtitle="Cambiar o restablecer contraseña"
            icon={<KeyRound size={18} color="#FFFFFF" />}
            iconBgColor="#636366"
            showDivider
            onPress={handleChangePassword}
          />

          {biometricStatus.isSupported && (
            <SettingsRow
              title={`Inicio con ${biometricStatus.label}`}
              subtitle={biometricSubtitle}
              icon={biometricIcon}
              iconBgColor="#5856D6"
              showDivider
              showChevron={false}
              rightElement={
                <Switch
                  value={biometricStatus.isEnabled}
                  disabled={togglingBiometrics}
                  onValueChange={toggleBiometrics}
                  trackColor={{ false: trackFalse, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          )}

          <SettingsRow
            title="Seguridad y accesos"
            subtitle={
              biometricStatus.isSupported
                ? `Correo, ${biometricStatus.label}, Apple y Google`
                : "Correo, Apple y Google"
            }
            icon={<ShieldAlert size={18} color="#FFFFFF" />}
            iconBgColor="#0A84FF"
            onPress={() =>
              Alert.alert(
                "Métodos de acceso",
                biometricStatus.isSupported
                  ? `Tu cuenta admite acceso mediante correo electrónico, ${biometricStatus.label}, Apple y Google.`
                  : "Tu cuenta admite acceso mediante correo electrónico, Apple y Google vinculados al mismo correo.",
              )
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Zona sensible">
          <SettingsRow
            title="Eliminar cuenta"
            subtitle="Acción permanente e irreversible"
            icon={<Trash2 size={18} color="#FFFFFF" />}
            iconBgColor="#FF3B30"
            destructive
            onPress={handleDeleteAccount}
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
    gap: 24,
  },
});
