import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";

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

  const apiError = forgotPasswordMutation.error as AxiosError<ApiErrorResponse>;

  const errorMessage =
    apiError?.response?.data?.mensaje ??
    "No fue posible continuar con la recuperación.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recupera tu contraseña</Text>

        <Text style={styles.description}>
          Ingresa el correo asociado a tu cuenta. Te enviaremos un código para
          continuar.
        </Text>
      </View>

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
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <View style={styles.errorContainer}>
        {forgotPasswordMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

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
    gap: 20,
  },

  header: {
    gap: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#737373",
  },

  errorContainer: {
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
});
