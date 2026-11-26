import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useVerifyRecovery } from "@/features/auth/hooks/use-verify-recovery";
import { useTheme } from "@/hooks/use-theme";

const verifyRecoverySchema = z.object({
  codigo: z
    .string()
    .length(6, "El código debe tener 6 dígitos")
    .regex(/^\d{6}$/, "El código solo puede contener números"),
});

type VerifyRecoveryFormData = z.infer<typeof verifyRecoverySchema>;

interface ApiErrorResponse {
  ok: false;
  codigo?: string;
  mensaje: string;
}

interface VerifyRecoveryFormProps {
  email: string;
}

export function VerifyRecoveryForm({ email }: VerifyRecoveryFormProps) {
  const theme = useTheme();
  const verifyRecoveryMutation = useVerifyRecovery();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyRecoveryFormData>({
    resolver: zodResolver(verifyRecoverySchema),

    defaultValues: {
      codigo: "",
    },
  });

  const submitCode = (codigo: string) => {
    if (codigo.length !== 6 || verifyRecoveryMutation.isPending) {
      return;
    }

    Keyboard.dismiss();

    verifyRecoveryMutation.mutate(
      {
        email,
        codigo,
      },
      {
        onSuccess: (data) => {
          router.push({
            pathname: "/nueva-password",
            params: {
              resetToken: data.resetToken,
            },
          });
        },
      },
    );
  };

  const onSubmit = (data: VerifyRecoveryFormData) => {
    submitCode(data.codigo);
  };

  const apiError =
    verifyRecoveryMutation.error as AxiosError<ApiErrorResponse> | null;

  const errorMessage =
    apiError?.response?.data?.mensaje ?? "No fue posible validar el código.";

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
            label="Código de recuperación"
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

      {verifyRecoveryMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      )}

      <AppButton
        title="Continuar"
        loading={verifyRecoveryMutation.isPending}
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

  apiError: {
    padding: 14,
    borderRadius: 16,
  },

  apiErrorText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
