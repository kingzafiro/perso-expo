import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { type ReactNode, useEffect } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface AuthSheetLayoutProps {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  showBrand?: boolean;
  stepIndicator?: {
    current: number;
    total: number;
  };
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthSheetLayout({
  title,
  subtitle,
  showBackButton = false,
  showBrand = true,
  stepIndicator,
  children,
  footer,
}: AuthSheetLayoutProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const useNativeGlass =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  const keyboard = useAnimatedKeyboard();
  const mountProgress = useSharedValue(0);

  useEffect(() => {
    mountProgress.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [mountProgress]);

  // Importante en iOS 26+: nunca animar `opacity` sobre GlassView ni sus padres
  // porque rompe el compositor nativo de Liquid Glass y lo vuelve transparente.
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(mountProgress.value, [0, 1], [18, 0]),
      },
    ],
  }));

  const heroTextAnimatedStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    const progress = interpolate(kb, [0, 180], [1, 0], Extrapolation.CLAMP);

    return {
      opacity: progress,
      maxHeight: interpolate(progress, [0, 1], [0, 140]),
      marginTop: interpolate(progress, [0, 1], [0, 18]),
      transform: [
        {
          translateY: interpolate(progress, [0, 1], [-10, 0]),
        },
      ],
    };
  });

  const orbsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -keyboard.height.value * 0.14,
      },
    ],
  }));

  const bottomRestPadding = Math.max(insets.bottom + 20, 28);
  const keyboardSpacerStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    return {
      height: kb > 0 ? kb + 18 : bottomRestPadding,
    };
  });

  const sheetGlassTint = isDark
    ? "rgba(24, 18, 15, 0.56)"
    : "rgba(255, 255, 255, 0.66)";
  const sheetInnerVeil = isDark
    ? "rgba(22, 16, 13, 0.42)"
    : "rgba(255, 255, 255, 0.42)";
  const backButtonGlassTint = isDark
    ? "rgba(32, 25, 20, 0.58)"
    : "rgba(255, 255, 255, 0.68)";

  const cardInner = (
    <View
      style={[
        styles.cardFlex,
        useNativeGlass && { backgroundColor: sheetInnerVeil },
      ]}
    >
      <View style={styles.grabberWrapper}>
        <View style={[styles.grabber, { backgroundColor: theme.grabber }]} />
      </View>

      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={styles.cardScrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bounces
      >
        {children}
        {footer && <View style={styles.footer}>{footer}</View>}
        <Animated.View style={keyboardSpacerStyle} />
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.authBackdrop }]}>
      {/* Esferas ambientales con el color principal #F06808 detrás del Liquid Glass */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, orbsAnimatedStyle]}
      >
        <View
          style={[styles.orbPrimary, { backgroundColor: theme.orbPrimary }]}
        />
        <View
          style={[styles.orbSecondary, { backgroundColor: theme.orbSecondary }]}
        />
        <View
          style={[styles.orbBottom, { backgroundColor: theme.orbBottom }]}
        />
      </Animated.View>

      <View
        style={[
          styles.layoutContainer,
          { paddingTop: Math.max(insets.top + 12, 22) },
        ]}
      >
        <Pressable onPress={Keyboard.dismiss} style={styles.heroWrapper}>
          <View style={styles.topBar}>
            {showBackButton ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.backButton,
                  !useNativeGlass && {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.surfaceBorder,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                  pressed &&
                    (useNativeGlass ? styles.pressedScale : styles.pressed),
                ]}
              >
                {useNativeGlass ? (
                  <GlassView
                    key={`back-${colorScheme}`}
                    glassEffectStyle="regular"
                    colorScheme={colorScheme}
                    tintColor={backButtonGlassTint}
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

            {showBrand && (
              <View style={styles.brandRow}>
                <View
                  style={[
                    styles.logo,
                    {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                    },
                  ]}
                >
                  <Text style={[styles.logoText, { color: theme.onPrimary }]}>
                    P
                  </Text>
                </View>
                <Text style={[styles.brandName, { color: theme.text }]}>
                  Perso
                </Text>
              </View>
            )}

            {stepIndicator && (
              <View style={styles.stepWrapper}>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                  Paso {stepIndicator.current} de {stepIndicator.total}
                </Text>
                <View style={styles.stepDotsRow}>
                  {Array.from({ length: stepIndicator.total }).map((_, idx) => {
                    const active = idx + 1 <= stepIndicator.current;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.stepBar,
                          {
                            backgroundColor: active
                              ? theme.primary
                              : theme.divider,
                            width: active ? 22 : 10,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <Animated.View
            style={[styles.heroTextGroup, heroTextAnimatedStyle]}
          >
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          </Animated.View>
        </Pressable>

        {/* Tarjeta Liquid Glass anclada abajo sin opacidad animada */}
        <Animated.View style={[styles.sheetOuter, sheetAnimatedStyle]}>
          {useNativeGlass ? (
            <GlassView
              key={`sheet-${colorScheme}`}
              glassEffectStyle="regular"
              colorScheme={colorScheme}
              tintColor={sheetGlassTint}
              style={[
                styles.sheetCardGlass,
                { borderColor: theme.surfaceBorder },
              ]}
            >
              {cardInner}
            </GlassView>
          ) : (
            <View
              style={[
                styles.sheetCard,
                {
                  backgroundColor: theme.surfaceGlass,
                  borderColor: theme.surfaceBorder,
                },
              ]}
            >
              {cardInner}
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  layoutContainer: {
    flex: 1,
    justifyContent: "space-between",
  },

  orbPrimary: {
    position: "absolute",
    top: -85,
    right: -65,
    width: 300,
    height: 300,
    borderRadius: 150,
  },

  orbSecondary: {
    position: "absolute",
    top: 130,
    left: -115,
    width: 280,
    height: 280,
    borderRadius: 140,
  },

  orbBottom: {
    position: "absolute",
    bottom: 65,
    right: -85,
    width: 320,
    height: 320,
    borderRadius: 160,
  },

  heroWrapper: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    transform: [{ scale: 0.96 }],
  },

  pressedScale: {
    transform: [{ scale: 0.95 }],
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  logoText: {
    fontSize: 22,
    fontWeight: "800",
  },

  brandName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  stepWrapper: {
    marginLeft: "auto",
    alignItems: "flex-end",
    gap: 6,
  },

  stepText: {
    fontSize: 12,
    fontWeight: "600",
  },

  stepDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  stepBar: {
    height: 4,
    borderRadius: 999,
  },

  heroTextGroup: {
    gap: 8,
    overflow: "hidden",
  },

  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.9,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },

  sheetOuter: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    flexShrink: 1,
    marginTop: "auto",
  },

  sheetCardGlass: {
    flexShrink: 1,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },

  sheetCard: {
    flexShrink: 1,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  cardFlex: {
    flexShrink: 1,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },

  grabberWrapper: {
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: "center",
  },

  grabber: {
    width: 40,
    height: 5,
    borderRadius: 999,
  },

  cardScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },

  cardScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  footer: {
    marginTop: 22,
    alignItems: "center",
  },
});
