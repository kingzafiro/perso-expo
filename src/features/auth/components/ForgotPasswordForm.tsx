import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { useTheme } from "@/hooks/use-theme";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ApiErrorResponse {
  ok: false;
  codigo?: string;
  mensaje: string;
}

export function ForgotPasswordForm() {
  const theme = useTheme();
  const forgotPasswordMutation = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),

    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    const email = data.email.trim().toLowerCase();

    forgotPasswordMutation.mutate(
      {
        email,
      },
      {
        onSuccess: () => {
          router.push({
            pathname: "/verificar-recuperacion",
            params: {
              email,
            },
          });
        },
      },
    );
  };

  const apiError =
    forgotPasswordMutation.error as AxiosError<ApiErrorResponse> | null;

  const errorMessage =
    apiError?.response?.data?.mensaje ??
    "No fue posible continuar con la recuperación.";

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Correo electrónico"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      {forgotPasswordMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      )}

      <AppButton
        title="Enviar código"
        loading={forgotPasswordMutation.isPending}
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

  apiError: {
    padding: 14,
    borderRadius: 16,
  },

  apiErrorText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },
});
