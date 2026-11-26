import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Camera } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface ProfileAvatarProps {
  uri?: string | null;
  initials: string;
  size?: number;
  editable?: boolean;
  isUploading?: boolean;
  onPress?: () => void;
}

export function ProfileAvatar({
  uri,
  initials,
  size = 50,
  editable = false,
  isUploading = false,
  onPress,
}: ProfileAvatarProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const prevUriRef = useRef<string | null | undefined>(uri);

  const scale = useSharedValue(1);
  const auraScale = useSharedValue(1);
  const auraOpacity = useSharedValue(0);
  const uploadPulse = useSharedValue(0);

  // Animación fluida al cambiar la foto (spring + onda de color #F06808)
  useEffect(() => {
    if (prevUriRef.current === uri) return;
    prevUriRef.current = uri;

    scale.value = withSequence(
      withTiming(0.88, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 220, mass: 0.75 }),
    );

    auraScale.value = 1;
    auraOpacity.value = 0.6;
    auraScale.value = withTiming(1.34, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    auraOpacity.value = withTiming(0, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [uri, scale, auraScale, auraOpacity]);

  // Pulso continuo mientras sube a la nube
  useEffect(() => {
    if (isUploading) {
      uploadPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(uploadPulse);
      uploadPulse.value = withTiming(0, { duration: 200 });
    }
  }, [isUploading, uploadPulse]);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    opacity: auraOpacity.value,
    transform: [{ scale: auraScale.value }],
  }));

  const uploadRingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isUploading ? 0.35 + uploadPulse.value * 0.55 : 0,
    transform: [{ scale: 1 + uploadPulse.value * 0.08 }],
  }));

  const uploadOverlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isUploading ? 0.25 + uploadPulse.value * 0.35 : 0,
  }));

  const badgeSize = Math.max(28, Math.round(size * 0.31));
  const radius = size / 2;
  const fontSize = Math.round(size * 0.35);

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.94, { damping: 16, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  const handlePress = async () => {
    if (!onPress || isUploading) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const avatarVisual = (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Onda expansiva al cambiar la foto */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.auraRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: theme.primary,
          },
          auraAnimatedStyle,
        ]}
      />

      {/* Aro pulsante durante subida */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.uploadRing,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            borderColor: theme.primary,
          },
          uploadRingAnimatedStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
          },
          avatarAnimatedStyle,
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            transition={260}
            cachePolicy="memory-disk"
          />
        ) : (
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        )}

        {isUploading && (
          <Animated.View
            style={[styles.loadingOverlay, uploadOverlayAnimatedStyle]}
          />
        )}
      </Animated.View>

      {editable && (
        <View
          style={[
            styles.cameraBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: theme.primary,
              borderColor: isDark ? "#000000" : "#F5F2EF",
            },
          ]}
        >
          <Camera size={Math.round(badgeSize * 0.5)} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  if (!onPress) {
    return avatarVisual;
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isUploading}
      accessibilityRole="button"
      accessibilityLabel="Cambiar foto de perfil"
    >
      {avatarVisual}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  auraRing: {
    position: "absolute",
    borderWidth: 2.5,
  },

  uploadRing: {
    position: "absolute",
    borderWidth: 2.5,
  },

  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  initials: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
