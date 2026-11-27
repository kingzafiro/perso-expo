import axios from "axios";
import * as Haptics from "expo-haptics";
import { CheckCircle2, Phone, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import {
  AppSelectField,
  type SelectOption,
} from "@/components/ui/AppSelectField";
import { OtpVerificationOverlay } from "@/components/ui/OtpVerificationOverlay";
import {
  useFullProfile,
  useProfileMutations,
} from "@/features/profile/hooks/use-full-profile";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

const COUNTRY_CODE_OPTIONS: SelectOption<string>[] = [
  { value: "+52", label: "México (+52)", description: "Lada +52" },
  { value: "+1", label: "Estados Unidos / Canadá (+1)", description: "Lada +1" },
  { value: "+57", label: "Colombia (+57)", description: "Lada +57" },
  { value: "+34", label: "España (+34)", description: "Lada +34" },
  { value: "+54", label: "Argentina (+54)", description: "Lada +54" },
  { value: "+56", label: "Chile (+56)", description: "Lada +56" },
  { value: "+51", label: "Perú (+51)", description: "Lada +51" },
];

function extractErr(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

function formatReadablePhone(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) {
    const local = digits.slice(2);
    return `+52 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
  }
  if (digits.length === 10) {
    return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return cleaned;
}

function splitPhoneParts(raw?: string | null): {
  countryCode: string;
  localDigits: string;
} {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) {
    return { countryCode: "+52", localDigits: digits.slice(2) };
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return { countryCode: "+1", localDigits: digits.slice(1) };
  }
  if (digits.length === 10) {
    return { countryCode: "+52", localDigits: digits };
  }
  return { countryCode: "+52", localDigits: digits.slice(-10) };
}

export default function TelefonoScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const storeUser = useAuthStore((state) => state.user);
  const { data: fullProfile } = useFullProfile();
  const { sendPhoneCode, verifyPhoneCode } = useProfileMutations();

  const user = fullProfile?.usuario ?? storeUser;
  const savedPhone = (user?.celular ?? "").trim();
  const isAlreadyVerified =
    savedPhone.replace(/\D/g, "").length >= 10 &&
    Boolean(user?.celular_verificado);

  const initialParts = splitPhoneParts(savedPhone);
  const [countryCode, setCountryCode] = useState(initialParts.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialParts.localDigits);
  const [editingVerified, setEditingVerified] = useState(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [sentPhoneLabel, setSentPhoneLabel] = useState("");
  const [initialCooldown, setInitialCooldown] = useState(45);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [inputErrorMsg, setInputErrorMsg] = useState<string | null>(null);
  const [otpErrorMsg, setOtpErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!savedPhone || otpOpen || editingVerified) return;
    const parts = splitPhoneParts(savedPhone);
    setCountryCode(parts.countryCode);
    setPhoneNumber((prev) => (prev ? prev : parts.localDigits));
  }, [savedPhone, otpOpen, editingVerified]);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const digitsOnly = phoneNumber.replace(/\D/g, "");
  const canSendSms = digitsOnly.length >= 10 && digitsOnly.length <= 12;

  const handleSendSms = async (): Promise<number | void> => {
    if (!canSendSms || sendPhoneCode.isPending) return;
    setInputErrorMsg(null);
    setOtpErrorMsg(null);
    try {
      const res = await sendPhoneCode.mutateAsync({
        codigo_pais: countryCode,
        numero: digitsOnly,
      });
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const nextCooldown = res.cooldown_segundos || 45;
      setSentPhoneLabel(formatReadablePhone(res.telefono));
      setInitialCooldown(nextCooldown);
      setDebugCode(res.debug_codigo ?? null);
      setOtpOpen(true);
      return nextCooldown;
    } catch (err) {
      const msg = extractErr(err, "No fue posible enviar el código por SMS.");
      if (otpOpen) {
        setOtpErrorMsg(msg);
      } else {
        setInputErrorMsg(msg);
      }
      return 15;
    }
  };

  const handleCompleteOtp = async (cleanCode: string) => {
    if (cleanCode.length !== 6 || verifyPhoneCode.isPending) return;
    setOtpErrorMsg(null);
    try {
      const res = await verifyPhoneCode.mutateAsync({ codigo: cleanCode });
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setOtpOpen(false);
      setEditingVerified(false);
      setDebugCode(null);
      Alert.alert("Teléfono verificado", res.mensaje);
    } catch (err) {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setOtpErrorMsg(
        extractErr(err, "El código SMS no es correcto. Intenta de nuevo."),
      );
    }
  };

  const showVerifiedSummary = isAlreadyVerified && !editingVerified;

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Número de teléfono" />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta informativa principal */}
          <View
            style={[
              styles.heroCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor: isAlreadyVerified
                    ? theme.successSoft
                    : theme.primarySoft,
                },
              ]}
            >
              {isAlreadyVerified ? (
                <ShieldCheck size={24} color={theme.success} />
              ) : (
                <Phone size={22} color={theme.primary} />
              )}
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              {showVerifiedSummary
                ? "Tu teléfono está verificado"
                : "Verifica tu número de teléfono"}
            </Text>

            <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
              {showVerifiedSummary
                ? "Las empresas podrán contactarte directamente y ya cumples con este requisito para postularte."
                : "Verificamos tu número mediante SMS para proteger tu cuenta. Es un requisito obligatorio para postularte a vacantes."}
            </Text>
          </View>

          {showVerifiedSummary ? (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.verifiedRow}>
                <View style={styles.flexOne}>
                  <Text
                    style={[styles.fieldLabel, { color: theme.textSecondary }]}
                  >
                    Teléfono verificado
                  </Text>
                  <Text style={[styles.verifiedPhone, { color: theme.text }]}>
                    {formatReadablePhone(savedPhone)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.verifiedPill,
                    { backgroundColor: theme.successSoft },
                  ]}
                >
                  <CheckCircle2 size={13} color={theme.success} />
                  <Text
                    style={[styles.verifiedPillText, { color: theme.success }]}
                  >
                    Verificado
                  </Text>
                </View>
              </View>

              <AppButton
                title="Cambiar número de teléfono"
                variant="secondary"
                onPress={() => {
                  setInputErrorMsg(null);
                  setEditingVerified(true);
                }}
              />
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <AppSelectField
                label="País / Lada"
                modalTitle="Selecciona tu país"
                value={countryCode}
                options={COUNTRY_CODE_OPTIONS}
                onChange={setCountryCode}
              />

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSecondary }]}
                >
                  Número celular (10 dígitos)
                </Text>
                <View
                  style={[
                    styles.phoneInputWrap,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}
                >
                  <Text style={[styles.prefixText, { color: theme.text }]}>
                    {countryCode}
                  </Text>
                  <View
                    style={[
                      styles.prefixDivider,
                      { backgroundColor: theme.divider },
                    ]}
                  />
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setInputErrorMsg(null);
                      setPhoneNumber(text.replace(/\D/g, "").slice(0, 12));
                    }}
                    placeholder="55 1234 5678"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    maxLength={12}
                    style={[styles.phoneInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {inputErrorMsg ? (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: theme.errorSoft },
                  ]}
                >
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {inputErrorMsg}
                  </Text>
                </View>
              ) : null}

              <AppButton
                title="Enviar código por SMS"
                loading={sendPhoneCode.isPending && !otpOpen}
                disabled={!canSendSms}
                onPress={() => void handleSendSms()}
              />

              {editingVerified ? (
                <Pressable
                  onPress={() => {
                    setEditingVerified(false);
                    setInputErrorMsg(null);
                  }}
                  style={styles.secondaryLink}
                >
                  <Text
                    style={[
                      styles.secondaryLinkText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Cancelar cambio
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Card flotante centrado de 6 casillas con pegado y envío automático */}
      <OtpVerificationOverlay
        visible={otpOpen}
        channel="sms"
        targetLabel={sentPhoneLabel}
        initialCooldown={initialCooldown}
        debugCode={debugCode}
        verifying={verifyPhoneCode.isPending}
        resending={sendPhoneCode.isPending}
        errorMessage={otpErrorMsg}
        onComplete={(code) => void handleCompleteOtp(code)}
        onResend={handleSendSms}
        onClose={() => {
          setOtpOpen(false);
          setOtpErrorMsg(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  flexOne: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
    gap: 16,
  },

  heroCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: "center",
    gap: 9,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },

  heroDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
  },

  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 14,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  verifiedPhone: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },

  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  verifiedPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  inputGroup: {
    gap: 7,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  phoneInputWrap: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  prefixText: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  prefixDivider: {
    width: 1,
    height: 22,
  },

  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },

  errorBox: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  secondaryLink: {
    alignItems: "center",
    paddingVertical: 6,
  },

  secondaryLinkText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
});
