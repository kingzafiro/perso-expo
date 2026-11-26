import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useResendVerificationCode } from "@/features/auth/hooks/use-resend-verification-code";
import { useVerifyEmail } from "@/features/auth/hooks/use-verify-email";
import { useTheme } from "@/hooks/use-theme";

const verifyEmailSchema = z.object({
  codigo: z
    .string()
    .length(6, "El código debe tener 6 dígitos")
    .regex(/^\d{6}$/, "El código solo puede contener números"),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

interface ApiErrorResponse {
  ok: false;
  codigo?: string;
  mensaje: string;
  retryAfter?: number;
}

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const theme = useTheme();
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationCode();

  const [secondsLeft, setSecondsLeft] = useState(60);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),

    defaultValues: {
      codigo: "",
    },
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [secondsLeft]);

  const submitCode = (codigo: string) => {
    if (codigo.length !== 6 || verifyMutation.isPending) {
      return;
    }

    Keyboard.dismiss();

    verifyMutation.mutate(
      {
        email,
        codigo,
      },
      {
        onSuccess: () => {
          router.replace("/");
        },
      },
    );
  };

  const onSubmit = (data: VerifyEmailFormData) => {
    submitCode(data.codigo);
  };

  const handleResendCode = () => {
    if (secondsLeft > 0 || resendMutation.isPending) {
      return;
    }

    setResendMessage(null);

    resendMutation.mutate(
      {
        email,
      },
      {
        onSuccess: (data) => {
          setSecondsLeft(data.retryAfter ?? 60);
          setResendMessage(data.mensaje);
        },

        onError: (error) => {
          const apiError = error as AxiosError<ApiErrorResponse>;
          const retryAfter = apiError.response?.data?.retryAfter;

          if (retryAfter) {
            setSecondsLeft(retryAfter);
          }
        },
      },
    );
  };

  const verifyError = verifyMutation.error as AxiosError<ApiErrorResponse> | null;
  const verifyErrorMessage =
    verifyError?.response?.data?.mensaje ??
    "No fue posible verificar el correo.";

  const resendError = resendMutation.error as AxiosError<ApiErrorResponse> | null;
  const resendErrorMessage =
    resendError?.response?.data?.mensaje ??
    "No fue posible reenviar el código.";

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.emailBadge, { backgroundColor: theme.inputBackground }]}
      >
        <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>
          Código enviado a
        </Text>
        <Text style={[styles.email, { color: theme.text }]}>{email}</Text>
      </View>

      <Controller
        control={control}
        name="codigo"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Código de verificación"
            placeholder="000000"
            keyboardType="number-pad"
            autoCorrect={false}
            textContentType="oneTimeCode"
            value={value}
            onChangeText={(text) => {
              const codigo = text.replace(/\D/g, "").slice(0, 6);
              onChange(codigo);

              if (codigo.length === 6) {
                submitCode(codigo);
              }
            }}
            onBlur={onBlur}
            error={errors.codigo?.message}
            maxLength={6}
          />
        )}
      />

      <View style={styles.resendRow}>
        <Text style={[styles.resendText, { color: theme.textSecondary }]}>
          ¿No recibiste el código?
        </Text>

        {secondsLeft > 0 ? (
          <Text style={[styles.resendTimer, { color: theme.textSecondary }]}>
            Reenviar en {formatTime(secondsLeft)}
          </Text>
        ) : (
          <Pressable
            disabled={resendMutation.isPending}
            onPress={handleResendCode}
            hitSlop={10}
            style={({ pressed }) => [
              styles.resendButton,
              pressed && styles.pressed,
            ]}
          >
            {resendMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.resendButtonText, { color: theme.primary }]}>
                Reenviar código
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {verifyMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {verifyErrorMessage}
          </Text>
        </View>
      )}

      {resendMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {resendErrorMessage}
          </Text>
        </View>
      )}

      {resendMessage && !resendMutation.isError && (
        <View
          style={[styles.apiSuccess, { backgroundColor: theme.successSoft }]}
        >
          <Text style={[styles.apiSuccessText, { color: theme.success }]}>
            {resendMessage}
          </Text>
        </View>
      )}

      <AppButton
        title={verifyMutation.isPending ? "Verificando" : "Verificar correo"}
        loading={verifyMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 18,
  },

  emailBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 3,
  },

  emailLabel: {
    fontSize: 13,
  },

  email: {
    fontSize: 15,
    fontWeight: "600",
  },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  resendText: {
    fontSize: 14,
  },

  resendTimer: {
    fontSize: 14,
    fontWeight: "600",
  },

  resendButton: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  pressed: {
    opacity: 0.6,
  },

  resendButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  apiError: {
    padding: 14,
    borderRadius: 16,
  },

  apiErrorText: {
    fontSize: 14,
    fontWeight: "500",
  },

  apiSuccess: {
    padding: 14,
    borderRadius: 16,
  },

  apiSuccessText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
