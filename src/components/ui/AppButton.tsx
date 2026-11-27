import * as Haptics from "expo-haptics";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

import { Spinner } from "@/components/ui/Spinner";
import { useTheme } from "@/hooks/use-theme";

interface AppButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
}

export function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  haptic = true,
  icon,
  variant = "primary",
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const [internalLoading, setInternalLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isBusy = loading || internalLoading;

  const handlePress = () => {
    if (disabled || isBusy) return;

    if (haptic && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = onPress();
      if (result && typeof (result as Promise<void>).then === "function") {
        setInternalLoading(true);
        void (result as Promise<void>).finally(() => {
          if (isMountedRef.current) {
            setInternalLoading(false);
          }
        });
      }
    } catch {
      if (isMountedRef.current) {
        setInternalLoading(false);
      }
    }
  };

  const backgroundColor =
    variant === "primary" ? theme.primary : theme.primarySoft;

  const borderColor =
    variant === "secondary" ? theme.primaryBorder : "transparent";

  const textColor =
    variant === "primary" ? theme.onPrimary : theme.primary;

  return (
    <Pressable
      disabled={disabled || isBusy}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            pressed && variant === "primary"
              ? theme.primaryPressed
              : backgroundColor,
          borderColor,
        },
        variant === "secondary" && styles.secondaryBorder,
        pressed && !disabled && !isBusy && styles.pressed,
        disabled && !isBusy && styles.disabled,
        isBusy && styles.loadingState,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isBusy, busy: isBusy }}
    >
      {isBusy ? (
        <Spinner size={22} strokeWidth={2.6} color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  secondaryBorder: {
    borderWidth: StyleSheet.hairlineWidth,
  },

  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  disabled: {
    opacity: 0.42,
  },

  loadingState: {
    opacity: 0.92,
  },

  text: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
