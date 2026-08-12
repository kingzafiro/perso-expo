import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";

interface AppButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}

export function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  haptic = true,
  icon,
  style,
}: AppButtonProps) {
  const handlePress = async () => {
    if (disabled || loading) return;

    if (haptic && Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await onPress();
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {icon}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 62,
    borderRadius: 30,
    backgroundColor: "#111111",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },

  disabled: {
    opacity: 0.55,
  },

  text: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
