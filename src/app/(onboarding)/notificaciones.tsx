import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Bell, Briefcase, ShieldCheck, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppButton } from "@/components/ui/AppButton";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { useBiometricStatus } from "@/features/auth/hooks/use-biometric-login";
import { registerDeviceForPushNotifications } from "@/features/notifications/lib/notifications-client";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { completeOnboarding } from "@/lib/auth/session";
import { usePreferencesStore } from "@/stores/preferences.store";

const BENEFITS = [
  {
    icon: Briefcase,
    title: "Vacantes al instante",
    subtitle: "Entérate primero de nuevos empleos ideales para ti.",
  },
  {
    icon: Sparkles,
    title: "Avances de tus procesos",
    subtitle: "Recibe avisos cuando haya novedades importantes.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad de tu cuenta",
    subtitle: "Protección inmediata ante cambios o nuevos accesos.",
  },
];

export default function OnboardingNotificacionesScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const setNotificationsBulk = usePreferencesStore(
    (state) => state.setNotificationsBulk,
  );
  const { status: biometricStatus } = useBiometricStatus();
  const hasBiometricStep =
    biometricStatus.isSupported && !biometricStatus.isEnabled;
  const totalSteps = hasBiometricStep ? 3 : 2;
  const [requesting, setRequesting] = useState(false);

  const proceedNext = async () => {
    if (hasBiometricStep) {
      router.push("/(onboarding)/biometria");
      return;
    }
    await completeOnboarding();
  };

  const bellTilt = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    bellTilt.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 180, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 180, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 140, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 140, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 2200 }),
      ),
      -1,
      false,
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 1500, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [bellTilt, pulse]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellTilt.value}deg` }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + pulse.value * 0.24,
    transform: [{ scale: 1 + pulse.value * 0.14 }],
  }));

  const handleEnableNotifications = async () => {
    if (requesting) return;
    setRequesting(true);

    try {
      if (Platform.OS === "web") {
        await proceedNext();
        return;
      }

      const result = await registerDeviceForPushNotifications({
        promptIfNeeded: true,
      });

      if (result.environment === "expo-go") {
        await setNotificationsBulk({
          empleos: true,
          postulaciones: true,
          seguridad: true,
        });
        await proceedNext();
        return;
      }

      if (result.status !== "granted" && !result.canAskAgain) {
        Alert.alert(
          "Notificaciones desactivadas",
          "Activa las notificaciones para Perso desde la configuración de tu dispositivo.",
          [
            {
              text: "Continuar sin activar",
              style: "cancel",
              onPress: () => {
                void proceedNext();
              },
            },
            {
              text: "Abrir configuración",
              onPress: async () => {
                await Linking.openSettings();
                await proceedNext();
              },
            },
          ],
        );
        return;
      }

      const granted = result.status === "granted";
      await setNotificationsBulk({
        empleos: granted,
        postulaciones: granted,
        seguridad: granted,
      });

      if (granted) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      await proceedNext();
    } catch {
      await proceedNext();
    } finally {
      setRequesting(false);
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await proceedNext();
  };

  const previewCardBg = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.045)";

  return (
    <AuthSheetLayout
      title="Mantente al día"
      subtitle="Activa las notificaciones para no perderte ninguna oportunidad en Perso."
      showBackButton
      stepIndicator={{ current: 2, total: totalSteps }}
    >
      <View style={styles.container}>
        {/* Emblema animado de campana + vista previa de notificación */}
        <View style={styles.visualBlock}>
          <View style={styles.bellContainer}>
            <Animated.View
              style={[
                styles.bellHalo,
                { backgroundColor: theme.primary },
                haloStyle,
              ]}
            />
            <View
              style={[styles.bellCircle, { backgroundColor: theme.primary }]}
            >
              <Animated.View style={bellStyle}>
                <Bell size={30} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>

          <View
            style={[
              styles.previewNotification,
              {
                backgroundColor: previewCardBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View
              style={[styles.previewBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.previewBadgeText}>P</Text>
            </View>
            <View style={styles.previewText}>
              <View style={styles.previewTopRow}>
                <Text style={[styles.previewApp, { color: theme.text }]}>
                  Perso
                </Text>
                <Text style={[styles.previewTime, { color: theme.textMuted }]}>
                  Ahora
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={[styles.previewBody, { color: theme.textSecondary }]}
              >
                Encontramos nuevas vacantes que coinciden con tu perfil.
              </Text>
            </View>
          </View>
        </View>

        {/* Lista de beneficios */}
        <View style={styles.benefitsList}>
          {BENEFITS.map(({ icon: Icon, title, subtitle }) => (
            <View key={title} style={styles.benefitRow}>
              <View
                style={[
                  styles.benefitIconBox,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Icon size={18} color={theme.primary} />
              </View>
              <View style={styles.benefitText}>
                <Text style={[styles.benefitTitle, { color: theme.text }]}>
                  {title}
                </Text>
                <Text
                  style={[
                    styles.benefitSubtitle,
                    { color: theme.textSecondary },
                  ]}
                >
                  {subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <AppButton
            title="Activar notificaciones"
            loading={requesting}
            onPress={handleEnableNotifications}
          />

          <Pressable
            onPress={handleSkip}
            disabled={requesting}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              Omitir por ahora
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 22,
  },

  visualBlock: {
    alignItems: "center",
    gap: 16,
  },

  bellContainer: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },

  bellHalo: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  bellCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F06808",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  previewNotification: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },

  previewBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  previewBadgeText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  previewText: {
    flex: 1,
    gap: 2,
  },

  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewApp: {
    fontSize: 14,
    fontWeight: "700",
  },

  previewTime: {
    fontSize: 12,
  },

  previewBody: {
    fontSize: 13,
    lineHeight: 18,
  },

  benefitsList: {
    gap: 14,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitText: {
    flex: 1,
    gap: 2,
  },

  benefitTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  benefitSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  actions: {
    gap: 10,
  },

  skipButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.65,
  },
});
