import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import * as Haptics from "expo-haptics";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Mail,
  MessageSquareCode,
} from "lucide-react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import {
  AppSelectField,
  type SelectOption,
} from "@/components/ui/AppSelectField";
import { FormInput } from "@/components/ui/FormInput";
import {
  sendEmployerEmailCodeApi,
  sendEmployerPhoneCodeApi,
} from "@/features/employer/api/employer.api";
import {
  EMPLOYER_CONTACT_ROLES,
  EMPLOYER_INDUSTRIES,
  EMPLOYER_SIZES,
} from "@/features/employer/types/employer.types";
import { useTheme } from "@/hooks/use-theme";

const OTHER_ROLE_VALUE = "__otro__";

const INDUSTRY_OPTIONS: SelectOption<string>[] = EMPLOYER_INDUSTRIES.map(
  (sector) => ({
    value: sector,
    label: sector,
  }),
);

const CONTACT_ROLE_OPTIONS: SelectOption<string>[] = [
  ...EMPLOYER_CONTACT_ROLES.map((role) => ({
    value: role,
    label: role,
  })),
  {
    value: OTHER_ROLE_VALUE,
    label: "Otro (especificar)",
    description: "Escribe tu puesto o cargo personalizado",
  },
];

const COUNTRY_CODE_OPTIONS: SelectOption<string>[] = [
  { value: "+52", label: "México (+52)" },
  { value: "+1", label: "Estados Unidos / Canadá (+1)" },
  { value: "+57", label: "Colombia (+57)" },
  { value: "+34", label: "España (+34)" },
  { value: "+54", label: "Argentina (+54)" },
  { value: "+56", label: "Chile (+56)" },
  { value: "+51", label: "Perú (+51)" },
];

function isPresetContactRole(role?: string | null) {
  const clean = (role ?? "").trim();
  return (EMPLOYER_CONTACT_ROLES as readonly string[]).includes(clean);
}

function extractApiError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

export interface EmployerOtpRequest {
  channel: "email" | "sms";
  targetValue: string;
  targetLabel: string;
  countryCode?: string;
  companyName?: string;
  initialCooldown: number;
  debugCode?: string | null;
  onVerified: (verifiedValue: string) => void;
}

/* ===========================
   1. Datos de la empresa
   =========================== */
const companyDetailsSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Ingresa el nombre comercial de tu empresa"),
  industry: z.string().trim().min(1, "Selecciona el sector de tu empresa"),
  companySize: z.string().trim().min(1, "Selecciona el tamaño del equipo"),
  description: z
    .string()
    .trim()
    .min(15, "Describe brevemente tu empresa (mínimo 15 caracteres)")
    .max(300, "Máximo 300 caracteres"),
});

export type CompanyDetailsForm = z.infer<typeof companyDetailsSchema>;

export function CompanyDetailsEditor({
  initialValue,
  loading,
  errorMessage,
  submitLabel,
  onSave,
}: {
  initialValue: CompanyDetailsForm;
  loading: boolean;
  errorMessage?: string | null;
  submitLabel: string;
  onSave: (data: CompanyDetailsForm) => void;
}) {
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyDetailsForm>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: initialValue,
  });

  const values = watch();
  const descLength = values.description?.length ?? 0;

  const isValid =
    values.companyName.trim().length >= 2 &&
    values.industry.trim().length > 0 &&
    values.companySize.trim().length > 0 &&
    values.description.trim().length >= 15;

  const hasChanges =
    values.companyName.trim() !== initialValue.companyName.trim() ||
    values.industry.trim() !== initialValue.industry.trim() ||
    values.companySize.trim() !== initialValue.companySize.trim() ||
    values.description.trim() !== initialValue.description.trim();

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="companyName"
        label="Nombre comercial"
        placeholder="Ej. Grupo Nova Tecnología"
        autoCapitalize="words"
      />

      <AppSelectField
        label="Sector o industria"
        placeholder="Selecciona un sector"
        value={values.industry}
        options={INDUSTRY_OPTIONS}
        error={errors.industry?.message}
        inline
        onChange={(sector) =>
          setValue("industry", sector, { shouldValidate: true })
        }
      />

      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          Tamaño del equipo (colaboradores)
        </Text>
        <View style={styles.sizeRow}>
          {EMPLOYER_SIZES.map((size) => {
            const selected = values.companySize === size;
            return (
              <Pressable
                key={size}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    void Haptics.selectionAsync();
                  }
                  setValue("companySize", size, { shouldValidate: true });
                }}
                style={[
                  styles.sizeChip,
                  {
                    backgroundColor: selected
                      ? theme.primarySoft
                      : theme.inputBackground,
                    borderColor: selected ? theme.primary : theme.inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sizeChipText,
                    { color: selected ? theme.primary : theme.text },
                  ]}
                  numberOfLines={1}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.companySize?.message ? (
          <Text style={[styles.fieldError, { color: theme.error }]}>
            {errors.companySize.message}
          </Text>
        ) : null}
      </View>

      <View style={styles.fieldBlock}>
        <FormInput
          control={control}
          name="description"
          label="Sobre la empresa"
          placeholder="Cuéntale a los candidatos a qué se dedican y qué ofrecen..."
          multiline
          maxLength={300}
          textAlignVertical="top"
          style={styles.multiline}
        />
        <Text style={[styles.counter, { color: theme.textMuted }]}>
          {descLength} / 300 caracteres
        </Text>
      </View>

      {errorMessage ? (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorBoxText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <AppButton
        title={submitLabel}
        loading={loading}
        disabled={!isValid || !hasChanges}
        onPress={handleSubmit(onSave)}
      />
    </View>
  );
}

/* ===========================
   2. Contacto del responsable
      - Puesto con select + Otro
      - Verificación obligatoria de Email y Teléfono en card central de 6 casillas
   =========================== */
const companyContactSchema = z.object({
  contactName: z.string().trim().min(2, "Ingresa el nombre del responsable"),
  contactRole: z.string().trim().min(2, "Indica tu puesto o cargo"),
  workEmail: z.string().trim().email("Ingresa un correo electrónico válido"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "El teléfono debe contener 10 dígitos"),
});

export type CompanyContactForm = z.infer<typeof companyContactSchema>;

export function CompanyContactEditor({
  initialValue,
  companyName,
  initialEmailVerified = false,
  initialPhoneVerified = false,
  loading,
  errorMessage,
  submitLabel,
  onOpenOtpChallenge,
  onSave,
}: {
  initialValue: CompanyContactForm;
  companyName?: string;
  initialEmailVerified?: boolean;
  initialPhoneVerified?: boolean;
  loading: boolean;
  errorMessage?: string | null;
  submitLabel: string;
  onOpenOtpChallenge: (request: EmployerOtpRequest) => void;
  onSave: (data: CompanyContactForm) => void;
}) {
  const theme = useTheme();

  const [roleSelection, setRoleSelection] = useState<string>(() => {
    const clean = initialValue.contactRole.trim();
    if (!clean) return "";
    return isPresetContactRole(clean) ? clean : OTHER_ROLE_VALUE;
  });

  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(() =>
    initialEmailVerified && initialValue.workEmail.trim()
      ? initialValue.workEmail.trim().toLowerCase()
      : null,
  );
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [countryCode, setCountryCode] = useState("+52");
  const [ladaOpen, setLadaOpen] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(() =>
    initialPhoneVerified && /^\d{10}$/.test(initialValue.phone.trim())
      ? initialValue.phone.trim()
      : null,
  );
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyContactForm>({
    resolver: zodResolver(companyContactSchema),
    defaultValues: initialValue,
  });

  const values = watch();
  const normalizedEmail = values.workEmail.trim().toLowerCase();
  const normalizedPhone = values.phone.replace(/\D/g, "").slice(0, 10);

  const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const isPhoneFormatValid = /^\d{10}$/.test(normalizedPhone);

  const isEmailVerified = Boolean(
    verifiedEmail && normalizedEmail === verifiedEmail,
  );
  const isPhoneVerified = Boolean(
    verifiedPhone && normalizedPhone === verifiedPhone,
  );

  const isValid =
    values.contactName.trim().length >= 2 &&
    values.contactRole.trim().length >= 2 &&
    isEmailFormatValid &&
    isPhoneFormatValid;

  const fieldsChanged =
    values.contactName.trim() !== initialValue.contactName.trim() ||
    values.contactRole.trim() !== initialValue.contactRole.trim() ||
    normalizedEmail !== initialValue.workEmail.trim().toLowerCase() ||
    normalizedPhone !== initialValue.phone.trim();

  const verificationStatusChanged =
    (isEmailVerified && !initialEmailVerified) ||
    (isPhoneVerified && !initialPhoneVerified);

  const hasChanges = fieldsChanged || verificationStatusChanged;
  const canSave = isValid && isEmailVerified && isPhoneVerified && hasChanges;

  const handleSelectRole = (nextValue: string) => {
    setRoleSelection(nextValue);
    if (nextValue === OTHER_ROLE_VALUE) {
      if (isPresetContactRole(values.contactRole)) {
        setValue("contactRole", "", {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
      return;
    }
    setValue("contactRole", nextValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleRequestEmailVerification = async () => {
    if (!isEmailFormatValid || emailSending) return;
    setEmailError(null);
    setEmailSending(true);
    try {
      const res = await sendEmployerEmailCodeApi({
        email: normalizedEmail,
        companyName,
      });
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onOpenOtpChallenge({
        channel: "email",
        targetValue: normalizedEmail,
        targetLabel: normalizedEmail,
        companyName,
        initialCooldown: res.cooldown_segundos || 45,
        debugCode: res.debug_codigo ?? null,
        onVerified: (confirmedEmail) => {
          setVerifiedEmail(confirmedEmail.trim().toLowerCase());
          setEmailError(null);
        },
      });
    } catch (err) {
      setEmailError(
        extractApiError(
          err,
          "No se pudo enviar el código al correo electrónico.",
        ),
      );
    } finally {
      setEmailSending(false);
    }
  };

  const handleRequestPhoneVerification = async () => {
    if (!isPhoneFormatValid || phoneSending) return;
    setPhoneError(null);
    setPhoneSending(true);
    try {
      const res = await sendEmployerPhoneCodeApi({
        codigo_pais: countryCode,
        numero: normalizedPhone,
      });
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onOpenOtpChallenge({
        channel: "sms",
        targetValue: normalizedPhone,
        targetLabel: `${countryCode} ${normalizedPhone}`,
        countryCode,
        initialCooldown: res.cooldown_segundos || 45,
        debugCode: res.debug_codigo ?? null,
        onVerified: (confirmedDigits) => {
          setVerifiedPhone(confirmedDigits.replace(/\D/g, "").slice(-10));
          setPhoneError(null);
        },
      });
    } catch (err) {
      setPhoneError(
        extractApiError(err, "No se pudo enviar el SMS de verificación."),
      );
    } finally {
      setPhoneSending(false);
    }
  };

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="contactName"
        label="Nombre del responsable"
        placeholder="Ej. Ana Martínez"
        autoCapitalize="words"
      />

      <AppSelectField
        label="Puesto o cargo"
        placeholder="Selecciona tu puesto o cargo"
        value={roleSelection}
        options={CONTACT_ROLE_OPTIONS}
        error={
          roleSelection !== OTHER_ROLE_VALUE
            ? errors.contactRole?.message
            : undefined
        }
        inline
        onChange={handleSelectRole}
      />

      {roleSelection === OTHER_ROLE_VALUE ? (
        <FormInput
          control={control}
          name="contactRole"
          label="Especifica tu puesto o cargo"
          placeholder="Ej. Encargado de sucursal"
          autoCapitalize="sentences"
        />
      ) : null}

      {/* Bloque: Correo corporativo + verificación */}
      <View
        style={[
          styles.verifyCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isEmailVerified
              ? theme.successSoft
              : theme.inputBorder,
          },
        ]}
      >
        <View style={styles.verifyCardHeader}>
          <Text style={[styles.verifyCardLabel, { color: theme.text }]}>
            Correo corporativo
          </Text>
          {isEmailVerified ? (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.successSoft },
              ]}
            >
              <CheckCircle2 size={13} color={theme.success} />
              <Text
                style={[styles.statusBadgeText, { color: theme.success }]}
              >
                Verificado
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Text
                style={[styles.statusBadgeText, { color: theme.primary }]}
              >
                Pendiente
              </Text>
            </View>
          )}
        </View>

        <FormInput
          control={control}
          name="workEmail"
          placeholder="talento@tuempresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!isEmailVerified ? (
          <Pressable
            onPress={() => void handleRequestEmailVerification()}
            disabled={!isEmailFormatValid || emailSending}
            style={({ pressed }) => [
              styles.verifyFullBtn,
              {
                backgroundColor: isEmailFormatValid
                  ? theme.primarySoft
                  : theme.inputBackground,
                borderColor: isEmailFormatValid
                  ? theme.primaryBorder
                  : theme.inputBorder,
                opacity: isEmailFormatValid ? 1 : 0.55,
              },
              pressed && styles.pressed,
            ]}
          >
            {emailSending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Mail
                size={16}
                color={isEmailFormatValid ? theme.primary : theme.textMuted}
              />
            )}
            <Text
              style={[
                styles.verifyFullBtnText,
                {
                  color: isEmailFormatValid ? theme.primary : theme.textMuted,
                },
              ]}
            >
              {emailSending
                ? "Enviando código..."
                : "Enviar código de verificación"}
            </Text>
          </Pressable>
        ) : null}

        {emailError ? (
          <Text style={[styles.fieldError, { color: theme.error }]}>
            {emailError}
          </Text>
        ) : null}
      </View>

      {/* Bloque: Teléfono de contacto (Lada + 10 dígitos en una sola fila) + verificación SMS */}
      <View
        style={[
          styles.verifyCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isPhoneVerified
              ? theme.successSoft
              : theme.inputBorder,
          },
        ]}
      >
        <View style={styles.verifyCardHeader}>
          <Text style={[styles.verifyCardLabel, { color: theme.text }]}>
            Teléfono de contacto
          </Text>
          {isPhoneVerified ? (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.successSoft },
              ]}
            >
              <CheckCircle2 size={13} color={theme.success} />
              <Text
                style={[styles.statusBadgeText, { color: theme.success }]}
              >
                Verificado
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Text
                style={[styles.statusBadgeText, { color: theme.primary }]}
              >
                Pendiente
              </Text>
            </View>
          )}
        </View>

        <View style={styles.phoneInputRow}>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              if (Platform.OS !== "web") void Haptics.selectionAsync();
              setLadaOpen((prev) => !prev);
            }}
            style={({ pressed }) => [
              styles.ladaTrigger,
              {
                backgroundColor: theme.inputBackground,
                borderColor: ladaOpen
                  ? theme.inputBorderFocused
                  : theme.inputBorder,
              },
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Seleccionar código de país"
          >
            <Text style={[styles.ladaCodeText, { color: theme.text }]}>
              {countryCode}
            </Text>
            <ChevronDown
              size={15}
              color={theme.textSecondary}
              style={ladaOpen ? styles.chevronRotated : undefined}
            />
          </Pressable>

          <View style={styles.phoneInputFlex}>
            <FormInput
              control={control}
              name="phone"
              placeholder="10 dígitos"
              keyboardType="phone-pad"
              maxLength={10}
              transformText={(text) => text.replace(/\D/g, "").slice(0, 10)}
            />
          </View>
        </View>

        {ladaOpen ? (
          <View
            style={[
              styles.ladaDropdown,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={styles.ladaList}
              showsVerticalScrollIndicator={false}
            >
              {COUNTRY_CODE_OPTIONS.map((opt, idx) => {
                const active = opt.value === countryCode;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      if (Platform.OS !== "web") void Haptics.selectionAsync();
                      setCountryCode(opt.value);
                      setLadaOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.ladaOptionRow,
                      idx < COUNTRY_CODE_OPTIONS.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.divider,
                      },
                      active && { backgroundColor: theme.primarySoft },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ladaOptionText,
                        { color: active ? theme.primary : theme.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {active ? <Check size={15} color={theme.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {!isPhoneVerified ? (
          <Pressable
            onPress={() => void handleRequestPhoneVerification()}
            disabled={!isPhoneFormatValid || phoneSending}
            style={({ pressed }) => [
              styles.verifyFullBtn,
              {
                backgroundColor: isPhoneFormatValid
                  ? theme.primarySoft
                  : theme.inputBackground,
                borderColor: isPhoneFormatValid
                  ? theme.primaryBorder
                  : theme.inputBorder,
                opacity: isPhoneFormatValid ? 1 : 0.55,
              },
              pressed && styles.pressed,
            ]}
          >
            {phoneSending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <MessageSquareCode
                size={16}
                color={isPhoneFormatValid ? theme.primary : theme.textMuted}
              />
            )}
            <Text
              style={[
                styles.verifyFullBtnText,
                {
                  color: isPhoneFormatValid ? theme.primary : theme.textMuted,
                },
              ]}
            >
              {phoneSending ? "Enviando SMS..." : "Enviar código por SMS"}
            </Text>
          </Pressable>
        ) : null}

        {phoneError ? (
          <Text style={[styles.fieldError, { color: theme.error }]}>
            {phoneError}
          </Text>
        ) : null}
      </View>

      {errorMessage ? (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorBoxText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <AppButton
        title={submitLabel}
        loading={loading}
        disabled={!canSave}
        onPress={handleSubmit(onSave)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 14,
  },

  fieldBlock: {
    gap: 7,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  sizeRow: {
    flexDirection: "row",
    gap: 7,
  },

  sizeChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.4,
    alignItems: "center",
    justifyContent: "center",
  },

  sizeChipText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  multiline: {
    minHeight: 108,
    paddingTop: 14,
    paddingBottom: 14,
  },

  counter: {
    fontSize: 12,
    textAlign: "right",
  },

  fieldError: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },

  verifyCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    gap: 10,
  },

  verifyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  verifyCardLabel: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  phoneInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  ladaTrigger: {
    height: 56,
    minHeight: 56,
    width: 92,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ladaCodeText: {
    fontSize: 16,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },

  chevronRotated: {
    transform: [{ rotate: "180deg" }],
  },

  phoneInputFlex: {
    flex: 1,
  },

  ladaDropdown: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  ladaList: {
    maxHeight: 190,
  },

  ladaOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  ladaOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },

  verifyFullBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },

  verifyFullBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },

  errorBoxText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  pressed: {
    opacity: 0.78,
  },
});
