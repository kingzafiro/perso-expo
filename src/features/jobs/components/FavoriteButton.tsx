import { Bookmark } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onPress: () => void;
  size?: number;
  variant?: "card" | "header";
}

export function FavoriteButton({
  isFavorite,
  onPress,
  size = 16,
  variant = "card",
}: FavoriteButtonProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    scale.stopAnimation();
    Animated.sequence([
      Animated.spring(scale, {
        toValue: isFavorite ? 1.24 : 0.86,
        friction: 5,
        tension: 260,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFavorite, scale]);

  const isHeader = variant === "header";

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.btn,
        isHeader ? styles.headerBtn : styles.cardBtn,
        {
          backgroundColor: isFavorite
            ? theme.primarySoft
            : theme.inputBackground,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isFavorite }}
      accessibilityLabel={
        isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"
      }
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Bookmark
          size={size}
          color={isFavorite ? theme.primary : theme.textSecondary}
          fill={isFavorite ? theme.primary : "transparent"}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },

  cardBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },

  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  pressed: {
    opacity: 0.78,
  },
});
