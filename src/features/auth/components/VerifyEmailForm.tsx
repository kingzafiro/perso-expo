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
      setSecondsLeft((current) => {
        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
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

  const verifyError = verifyMutation.error as AxiosError<ApiErrorResponse>;

  const verifyErrorMessage =
    verifyError?.response?.data?.mensaje ??
    "No fue posible verificar el correo.";

  const resendError = resendMutation.error as AxiosError<ApiErrorResponse>;

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
      <View style={styles.emailContainer}>
        <Text style={styles.emailLabel}>Código enviado a</Text>

        <Text style={styles.email}>{email}</Text>
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
        <Text style={styles.resendText}>¿No recibiste el código?</Text>

        {secondsLeft > 0 ? (
          <Text style={styles.resendTimer}>
            Reenviar en {formatTime(secondsLeft)}
          </Text>
        ) : (
          <Pressable
            disabled={resendMutation.isPending}
            onPress={handleResendCode}
            hitSlop={10}
            style={({ pressed }) => [
              styles.resendButton,

              pressed && styles.resendButtonPressed,
            ]}
          >
            {resendMutation.isPending ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.resendButtonText}>Reenviar código</Text>
            )}
          </Pressable>
        )}
      </View>

      <View style={styles.feedbackContainer}>
        {verifyMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{verifyErrorMessage}</Text>
          </View>
        )}

        {resendMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{resendErrorMessage}</Text>
          </View>
        )}

        {resendMessage && !resendMutation.isError && (
          <View style={styles.apiSuccess}>
            <Text style={styles.apiSuccessText}>{resendMessage}</Text>
          </View>
        )}
      </View>

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
    gap: 20,
  },

  emailContainer: {
    gap: 4,
  },

  emailLabel: {
    fontSize: 14,
    color: "#737373",
  },

  email: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
  },

  resendText: {
    fontSize: 14,
    color: "#737373",
  },

  resendTimer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9A9A9A",
  },

  resendButton: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  resendButtonPressed: {
    opacity: 0.6,
  },

  resendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#208AEF",
  },

  feedbackContainer: {
    minHeight: 48,
    justifyContent: "center",
  },

  apiError: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF1F0",
  },

  apiErrorText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "500",
  },

  apiSuccess: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ECFDF3",
  },

  apiSuccessText: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "500",
  },
});
