import * as Haptics from "expo-haptics";
import {
  FingerprintPattern,
  Lock,
  ScanFace,
  SlidersHorizontal,
  Zap,
} from "lucide-react-native";
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
import {
  notifyBiometricStatusChanged,
  useBiometricStatus,
} from "@/features/auth/hooks/use-biometric-login";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { enableBiometricLogin } from "@/lib/auth/biometrics";
import { completeOnboarding } from "@/lib/auth/session";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

const BENEFITS = [
  {
    icon: Zap,
    title: "Entrada instantánea",
    subtitle: "Inicia sesión en segundos sin escribir tu correo ni contraseña.",
  },
  {
    icon: Lock,
    title: "Protegido en tu dispositivo",
    subtitle: "Tus credenciales se cifran en el llavero seguro de tu teléfono.",
  },
  {
    icon: SlidersHorizontal,
    title: "Control en todo momento",
    subtitle: "Puedes activarlo o desactivarlo cuando quieras desde Tú.",
  },
];

export default function OnboardingBiometriaScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { status: biometricStatus } = useBiometricStatus();
  const [activating, setActivating] = useState(false);

  const iconScale = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400 }),
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
  }, [iconScale, pulse]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + pulse.value * 0.24,
    transform: [{ scale: 1 + pulse.value * 0.14 }],
  }));

  const handleEnableBiometrics = async () => {
    if (activating) return;
    setActivating(true);

    try {
      if (!biometricStatus.isEnrolled) {
        Alert.alert(
          `${biometricStatus.label} no configurado`,
          `Configura ${biometricStatus.label} en los ajustes de tu dispositivo para usarlo en Perso. También podrás activarlo más adelante en la sección Tú.`,
          [
            {
              text: "Continuar sin activar",
              style: "cancel",
              onPress: () => {
                void completeOnboarding();
              },
            },
            {
              text: "Abrir configuración",
              onPress: async () => {
                await Linking.openSettings();
              },
            },
          ],
        );
        return;
      }

      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken || !user) {
        await completeOnboarding();
        return;
      }

      const result = await enableBiometricLogin({
        refreshToken,
        user,
        requirePrompt: true,
      });

      if (result.ok) {
        notifyBiometricStatusChanged();
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
        await completeOnboarding();
        return;
      }

      if (!result.cancelled && result.message) {
        Alert.alert(`No se pudo activar ${biometricStatus.label}`, result.message);
      }
    } catch {
      await completeOnboarding();
    } finally {
      setActivating(false);
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await completeOnboarding();
  };

  const previewCardBg = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.045)";

  const BiometricIcon =
    biometricStatus.kind === "face-id" ? ScanFace : FingerprintPattern;

  return (
    <AuthSheetLayout
      title={`Accede con ${biometricStatus.label}`}
      subtitle={`Activa ${biometricStatus.label} para iniciar sesión en Perso más rápido y sin escribir tu contraseña.`}
      showBackButton
      stepIndicator={{ current: 3, total: 3 }}
    >
      <View style={styles.container}>
        {/* Emblema animado de biometría + vista previa de acceso */}
        <View style={styles.visualBlock}>
          <View style={styles.badgeContainer}>
            <Animated.View
              style={[
                styles.badgeHalo,
                { backgroundColor: theme.primary },
                haloStyle,
              ]}
            />
            <View
              style={[styles.badgeCircle, { backgroundColor: theme.primary }]}
            >
              <Animated.View style={iconAnimatedStyle}>
                <BiometricIcon size={30} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: previewCardBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View
              style={[styles.previewBadge, { backgroundColor: theme.primary }]}
            >
              <BiometricIcon size={18} color="#FFFFFF" />
            </View>
            <View style={styles.previewText}>
              <View style={styles.previewTopRow}>
                <Text style={[styles.previewTitle, { color: theme.text }]}>
                  Inicio con {biometricStatus.label}
                </Text>
                <Text style={[styles.previewTag, { color: theme.primary }]}>
                  Seguro
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={[styles.previewBody, { color: theme.textSecondary }]}
              >
                {user?.email
                  ? `Vinculado únicamente a ${user.email} en este dispositivo.`
                  : "Vinculado únicamente a tu cuenta en este dispositivo."}
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
            title={`Activar ${biometricStatus.label}`}
            loading={activating}
            onPress={handleEnableBiometrics}
          />

          <Pressable
            onPress={handleSkip}
            disabled={activating}
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

  badgeContainer: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeHalo: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  badgeCircle: {
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

  previewCard: {
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

  previewText: {
    flex: 1,
    gap: 2,
  },

  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  previewTag: {
    fontSize: 12,
    fontWeight: "600",
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
