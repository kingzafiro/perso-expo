import * as Haptics from "expo-haptics";
import { type ReactNode, useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

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
  const shimmer = useSharedValue(0.45);

  useEffect(() => {
    if (loading) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.38, {
            duration: 650,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(shimmer);
      shimmer.value = 1;
    }
  }, [loading, shimmer]);

  const skeletonBarStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  const handlePress = async () => {
    if (disabled || loading) return;

    if (haptic && Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await onPress();
  };

  const backgroundColor =
    variant === "primary" ? theme.primary : theme.primarySoft;

  const borderColor =
    variant === "secondary" ? theme.primaryBorder : "transparent";

  const textColor =
    variant === "primary" ? theme.onPrimary : theme.primary;

  const skeletonFill =
    variant === "primary"
      ? "rgba(255, 255, 255, 0.55)"
      : "rgba(240, 104, 8, 0.35)";

  return (
    <Pressable
      disabled={disabled || loading}
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
        pressed && !disabled && !loading && styles.pressed,
        disabled && !loading && styles.disabled,
        loading && styles.loadingState,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.skeletonRow}>
          <Animated.View
            style={[
              styles.skeletonBar,
              { backgroundColor: skeletonFill },
              skeletonBarStyle,
            ]}
          />
        </View>
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
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
    opacity: 0.88,
  },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  skeletonBar: {
    width: 112,
    height: 12,
    borderRadius: 999,
  },

  text: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
