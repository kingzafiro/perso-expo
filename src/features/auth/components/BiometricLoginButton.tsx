import * as Haptics from "expo-haptics";
import { FingerprintPattern, ScanFace } from "lucide-react-native";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import type { BiometricKind } from "@/lib/auth/biometrics";

function BiometricIcon({
  kind,
  size = 20,
  color,
}: {
  kind: BiometricKind;
  size?: number;
  color: string;
}) {
  if (kind === "face-id") {
    return <ScanFace size={size} color={color} />;
  }
  return <FingerprintPattern size={size} color={color} />;
}

interface BiometricLoginButtonProps {
  kind: BiometricKind;
  label: string;
  accountEmail?: string | null;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function BiometricLoginButton({
  kind,
  label,
  accountEmail,
  loading = false,
  disabled = false,
  onPress,
}: BiometricLoginButtonProps) {
  const theme = useTheme();
  const isBusy = loading;

  const handlePress = () => {
    if (disabled || isBusy) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      disabled={disabled || isBusy}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Iniciar sesión con ${label}`}
      accessibilityState={{ disabled: disabled || isBusy, busy: isBusy }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.primarySoft,
          borderColor: theme.primaryBorder,
        },
        pressed && !disabled && !isBusy && styles.pressed,
        disabled && !isBusy && styles.disabled,
      ]}
    >
      {isBusy ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <View style={styles.contentRow}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.primary },
            ]}
          >
            <BiometricIcon kind={kind} size={19} color={theme.onPrimary} />
          </View>

          <View style={styles.textColumn}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: theme.primary }]}
            >
              Iniciar sesión con {label}
            </Text>
            {accountEmail ? (
              <Text
                numberOfLines={1}
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                {accountEmail}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  contentRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  textColumn: {
    flexShrink: 1,
    alignItems: "flex-start",
    gap: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  subtitle: {
    fontSize: 12,
    fontWeight: "500",
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  disabled: {
    opacity: 0.5,
  },
});
