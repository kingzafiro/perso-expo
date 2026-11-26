import { useEffect } from "react";
import {
  type DimensionValue,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 10,
  style,
}: SkeletonProps) {
  const isDark = useColorScheme() === "dark";
  const progress = useSharedValue(0.45);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.42, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const bgColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(23, 18, 14, 0.09)";

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SuggestionListSkeleton({ rows = 3 }: { rows?: number }) {
  const theme = useTheme();

  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            index < rows - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.divider,
            },
          ]}
        >
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={styles.textCol}>
            <Skeleton
              width={index === 1 ? "68%" : "82%"}
              height={13}
              borderRadius={7}
            />
            <Skeleton
              width={index === 0 ? "48%" : "56%"}
              height={10}
              borderRadius={6}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  textCol: {
    flex: 1,
    gap: 7,
  },
});
