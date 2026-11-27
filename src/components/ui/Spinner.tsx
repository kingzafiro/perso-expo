import { useEffect, useId } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface SpinnerProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
}

/**
 * Loader circular moderno con trazo desvanecido (efecto cometa) animado a 60fps en UI thread.
 */
export function Spinner({
  size = 22,
  strokeWidth = 2.6,
  color = "#FFFFFF",
}: SpinnerProps) {
  const rotation = useSharedValue(0);
  const rawId = useId();
  const gradientId = `spinner-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 780,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.72;
  const gapLength = circumference - arcLength;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="55%" stopColor={color} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Pista ultra sutil */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeOpacity={0.16}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Arco desvanecido giratorio */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gapLength}`}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
