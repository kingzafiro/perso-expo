import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { X } from "lucide-react-native";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface ProfileEditSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  scrollEnabled?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  overlay?: ReactNode;
  children: ReactNode;
}

export function ProfileEditSheet({
  visible,
  title,
  subtitle,
  scrollEnabled = true,
  onClose,
  onDismiss,
  overlay,
  children,
}: ProfileEditSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const topClearance = Math.max(insets.top + 28, 56);
  const maxSheetHeight = Math.max(360, Math.round(windowHeight - topClearance));
  const bottomRestPadding = Math.max(insets.bottom + 24, 34);
  const useNativeGlass =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  const [rendered, setRendered] = useState(visible);

  // Conservamos el último contenido mientras termina la animación de cierre
  const cachedRef = useRef<{
    title: string;
    subtitle?: string;
    children: ReactNode;
  }>({ title, subtitle, children });

  if (visible) {
    cachedRef.current = { title, subtitle, children };
  }

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const finishClose = () => {
    setRendered(false);
    onDismissRef.current?.();
  };

  const keyboard = useAnimatedKeyboard();
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(Math.min(windowHeight * 0.55, 520));

  useEffect(() => {
    const startOffset = Math.min(windowHeight * 0.55, 520);

    if (visible) {
      if (!rendered) {
        backdropOpacity.value = 0;
        translateY.value = startOffset;
        setRendered(true);
        return;
      }

      cancelAnimation(backdropOpacity);
      cancelAnimation(translateY);

      backdropOpacity.value = withTiming(1, {
        duration: 230,
        easing: Easing.out(Easing.cubic),
      });

      translateY.value = withSpring(0, {
        damping: 28,
        stiffness: 300,
        mass: 0.9,
      });
    } else if (rendered) {
      cancelAnimation(backdropOpacity);
      cancelAnimation(translateY);

      backdropOpacity.value = withTiming(0, {
        duration: 185,
        easing: Easing.in(Easing.cubic),
      });

      translateY.value = withTiming(
        windowHeight,
        {
          duration: 210,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(finishClose)();
          }
        },
      );
    }
  }, [visible, rendered, windowHeight, backdropOpacity, translateY]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Solo animamos translateY (nunca opacity sobre GlassView ni sus ancestros)
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Mantiene el card anclado hasta el borde inferior de la pantalla y empuja el
  // contenido por encima del teclado sin dejar jamás una grieta negra entre ambos.
  const keyboardSpacerStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    return {
      height: kb > 0 ? kb + 20 : bottomRestPadding,
    };
  });

  if (!rendered) return null;

  const displayTitle = visible ? title : cachedRef.current.title;
  const displaySubtitle = visible ? subtitle : cachedRef.current.subtitle;
  const displayChildren = visible ? children : cachedRef.current.children;

  const sheetTint = isDark
    ? "rgba(24, 18, 15, 0.72)"
    : "rgba(255, 255, 255, 0.80)";
  const innerVeil = isDark
    ? "rgba(20, 15, 12, 0.72)"
    : "rgba(255, 255, 255, 0.76)";
  const solidBg = isDark ? "#181412" : "#FFFFFF";
  const closeBg = isDark
    ? "rgba(255, 255, 255, 0.10)"
    : "rgba(23, 18, 14, 0.06)";

  const innerContent = (
    <View
      style={[
        styles.sheetInner,
        { maxHeight: maxSheetHeight },
        useNativeGlass && { backgroundColor: innerVeil },
      ]}
    >
      <View style={styles.grabberRow}>
        <View style={[styles.grabber, { backgroundColor: theme.grabber }]} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>
            {displayTitle}
          </Text>
          {displaySubtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {displaySubtitle}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: closeBg },
            pressed && styles.pressed,
          ]}
        >
          <X size={18} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {displayChildren}
        <Animated.View style={keyboardSpacerStyle} />
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Backdrop independiente: aparece con fade suave en su sitio */}
        <Animated.View
          style={[styles.backdrop, backdropAnimatedStyle]}
          pointerEvents="auto"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <View
          pointerEvents="box-none"
          style={[styles.sheetLayer, { paddingTop: topClearance }]}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              { maxHeight: maxSheetHeight },
              sheetAnimatedStyle,
            ]}
          >
            {useNativeGlass ? (
              <GlassView
                key={`edit-sheet-${colorScheme}`}
                glassEffectStyle="regular"
                colorScheme={colorScheme}
                tintColor={sheetTint}
                style={[
                  styles.sheetGlass,
                  {
                    borderColor: theme.surfaceBorder,
                    maxHeight: maxSheetHeight,
                  },
                ]}
              >
                {innerContent}
              </GlassView>
            ) : (
              <View
                style={[
                  styles.sheetSolid,
                  {
                    backgroundColor: solidBg,
                    borderColor: theme.surfaceBorder,
                    maxHeight: maxSheetHeight,
                  },
                ]}
              >
                {innerContent}
              </View>
            )}
          </Animated.View>
        </View>

        {overlay}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.46)",
  },

  sheetLayer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  sheetContainer: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    flexShrink: 1,
  },

  sheetGlass: {
    flexShrink: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },

  sheetSolid: {
    flexShrink: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  sheetInner: {
    flexShrink: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },

  grabberRow: {
    flexShrink: 0,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "center",
  },

  grabber: {
    width: 40,
    height: 5,
    borderRadius: 999,
  },

  header: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 14,
    gap: 12,
  },

  headerText: {
    flex: 1,
    gap: 4,
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
  },
});
