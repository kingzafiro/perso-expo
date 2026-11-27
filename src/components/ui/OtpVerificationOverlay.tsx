import * as Haptics from "expo-haptics";
import { Mail, MessageSquareCode, X } from "lucide-react-native";
import { type ComponentRef, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const CODE_LENGTH = 6;
const SLOTS = [0, 1, 2, 3, 4, 5] as const;

export interface OtpCodeCardProps {
  channel: "email" | "sms";
  targetLabel: string;
  title?: string;
  subtitlePrefix?: string;
  initialCooldown?: number;
  debugCode?: string | null;
  verifying: boolean;
  resending?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  showCloseButton?: boolean;
  elevated?: boolean;
  active?: boolean;
  onComplete: (code: string) => void;
  onResend?: () => Promise<number | void> | void;
  onClose?: () => void;
}

export function OtpCodeCard({
  channel,
  targetLabel,
  title,
  subtitlePrefix = "Ingresa o pega el código de 6 dígitos que enviamos a",
  initialCooldown = 45,
  debugCode,
  verifying,
  resending = false,
  errorMessage,
  successMessage,
  showCloseButton = false,
  elevated = false,
  active = true,
  onComplete,
  onResend,
  onClose,
}: OtpCodeCardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);

  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const lastSubmittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (active) {
      setCode("");
      setCooldown(initialCooldown);
      lastSubmittedRef.current = null;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [active, targetLabel, initialCooldown]);

  useEffect(() => {
    if (!active || cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [active, cooldown]);

  // Si hubo un error de verificación, permitir corregir/reintentar
  useEffect(() => {
    if (errorMessage) {
      lastSubmittedRef.current = null;
    }
  }, [errorMessage]);

  const handleChangeText = (raw: string) => {
    if (verifying) return;
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);

    if (digits.length < CODE_LENGTH) {
      lastSubmittedRef.current = null;
      return;
    }

    if (digits.length === CODE_LENGTH && lastSubmittedRef.current !== digits) {
      lastSubmittedRef.current = digits;
      Keyboard.dismiss();
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onComplete(digits);
    }
  };

  const handleResendPress = async () => {
    if (!onResend || cooldown > 0 || resending || verifying) return;
    setCode("");
    lastSubmittedRef.current = null;
    const nextCooldown = await onResend();
    setCooldown(typeof nextCooldown === "number" ? nextCooldown : 45);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const cardBg = isDark ? "#1C1816" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.10)"
    : "rgba(23, 18, 14, 0.08)";
  const closeBg = isDark
    ? "rgba(255, 255, 255, 0.09)"
    : "rgba(23, 18, 14, 0.06)";

  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);
  const resolvedTitle =
    title ??
    (channel === "email" ? "Verifica tu correo" : "Verifica tu teléfono");

  return (
    <View
      style={[
        styles.card,
        elevated && styles.cardElevated,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      {showCloseButton && onClose ? (
        <Pressable
          onPress={() => {
            if (!verifying) {
              Keyboard.dismiss();
              onClose();
            }
          }}
          hitSlop={10}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: closeBg },
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Cerrar verificación"
        >
          <X size={16} color={theme.text} />
        </Pressable>
      ) : null}

      <View
        style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}
      >
        {channel === "email" ? (
          <Mail size={24} color={theme.primary} />
        ) : (
          <MessageSquareCode size={24} color={theme.primary} />
        )}
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{resolvedTitle}</Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {subtitlePrefix}{" "}
        <Text style={[styles.targetText, { color: theme.text }]}>
          {targetLabel}
        </Text>
      </Text>

      {debugCode ? (
        <View
          style={[
            styles.debugPill,
            {
              backgroundColor: theme.primarySoft,
              borderColor: theme.primaryBorder,
            },
          ]}
        >
          <Text style={[styles.debugText, { color: theme.primary }]}>
            Código de prueba: {debugCode}
          </Text>
        </View>
      ) : null}

      {/* 6 casillas con TextInput transparente encima: soporta pegar, AutoFill y envío automático */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={styles.boxesWrap}
      >
        <View style={styles.boxesRow} pointerEvents="none">
          {SLOTS.map((index) => {
            const char = code[index] ?? "";
            const isActive =
              focused &&
              !verifying &&
              index === activeIndex &&
              code.length < CODE_LENGTH;
            const isFilled = char.length > 0;

            return (
              <View
                key={index}
                style={[
                  styles.box,
                  {
                    backgroundColor: isActive
                      ? theme.primarySoft
                      : theme.inputBackground,
                    borderColor: errorMessage
                      ? theme.error
                      : isActive
                        ? theme.primary
                        : isFilled
                          ? theme.primaryBorder
                          : theme.inputBorder,
                    borderWidth: isActive ? 1.8 : 1.2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.boxDigit,
                    { color: isFilled ? theme.text : theme.textMuted },
                  ]}
                >
                  {char}
                </Text>
              </View>
            );
          })}
        </View>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={CODE_LENGTH}
          editable={!verifying}
          caretHidden
          selectTextOnFocus={false}
          style={styles.hiddenInput}
          accessibilityLabel="Código de verificación de 6 dígitos"
        />
      </Pressable>

      {verifying ? (
        <View style={styles.verifyingRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.verifyingText, { color: theme.textSecondary }]}>
            Verificando código...
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {successMessage && !errorMessage ? (
        <View
          style={[styles.successBox, { backgroundColor: theme.successSoft }]}
        >
          <Text style={[styles.successText, { color: theme.success }]}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      {onResend ? (
        <View style={styles.footerRow}>
          {cooldown > 0 ? (
            <Text style={[styles.cooldownText, { color: theme.textMuted }]}>
              Reenviar código en {cooldown}s
            </Text>
          ) : (
            <Pressable
              onPress={() => void handleResendPress()}
              disabled={resending || verifying}
              hitSlop={10}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={[styles.resendText, { color: theme.primary }]}>
                {resending ? "Reenviando..." : "Reenviar código"}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

export interface OtpVerificationOverlayProps
  extends Omit<OtpCodeCardProps, "showCloseButton" | "elevated" | "active"> {
  visible: boolean;
  onClose: () => void;
}

export function OtpVerificationOverlay({
  visible,
  verifying,
  onClose,
  ...cardProps
}: OtpVerificationOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (!verifying) {
            Keyboard.dismiss();
            onClose();
          }
        }}
      />

      <KeyboardAvoidingView
        style={styles.centerWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <OtpCodeCard
          {...cardProps}
          verifying={verifying}
          active={visible}
          showCloseButton
          elevated
          onClose={onClose}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
  },

  centerWrap: {
    width: "100%",
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 390,
    alignSelf: "center",
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
    gap: 12,
  },

  cardElevated: {
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },

  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
    paddingHorizontal: 4,
  },

  targetText: {
    fontWeight: "700",
  },

  debugPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  debugText: {
    fontSize: 12,
    fontWeight: "700",
  },

  boxesWrap: {
    width: "100%",
    marginTop: 6,
    position: "relative",
  },

  boxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  box: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  boxDigit: {
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.015,
    color: "transparent",
    fontSize: 22,
  },

  verifyingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },

  verifyingText: {
    fontSize: 13,
    fontWeight: "600",
  },

  errorBox: {
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  errorText: {
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },

  successBox: {
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  successText: {
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },

  footerRow: {
    marginTop: 4,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  cooldownText: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  resendText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },
});
