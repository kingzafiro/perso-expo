import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface SettingsHeaderProps {
  title: string;
  showBack?: boolean;
}

export function SettingsHeader({
  title,
  showBack = true,
}: SettingsHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const useNativeGlass =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  const glassTint = isDark
    ? "rgba(38, 32, 28, 0.62)"
    : "rgba(255, 255, 255, 0.72)";

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 6, 16),
        },
      ]}
    >
      <View style={styles.sideSlot}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              !useNativeGlass && {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(23, 18, 14, 0.07)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.14)"
                  : "rgba(23, 18, 14, 0.08)",
                borderWidth: StyleSheet.hairlineWidth,
              },
              pressed &&
                (useNativeGlass ? styles.pressedScale : styles.pressed),
            ]}
          >
            {useNativeGlass ? (
              <GlassView
                key={`header-back-${colorScheme}`}
                glassEffectStyle="regular"
                colorScheme={colorScheme}
                tintColor={glassTint}
                isInteractive
                style={styles.backButtonGlass}
              >
                <ChevronLeft size={22} color={theme.text} />
              </GlassView>
            ) : (
              <ChevronLeft size={22} color={theme.text} />
            )}
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>

      <View style={styles.sideSlot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },

  sideSlot: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonGlass: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.95 }],
  },

  pressedScale: {
    transform: [{ scale: 0.95 }],
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});
