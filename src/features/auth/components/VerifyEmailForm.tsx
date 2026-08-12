import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
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
}

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const verifyMutation = useVerifyEmail();

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

  const onSubmit = (data: VerifyEmailFormData) => {
    verifyMutation.mutate(
      {
        email,
        codigo: data.codigo,
      },
      {
        onSuccess: () => {
          router.replace("/");
        },
      },
    );
  };

  const apiError = verifyMutation.error as AxiosError<ApiErrorResponse>;

  const errorMessage =
    apiError?.response?.data?.mensaje ?? "No fue posible verificar el correo.";

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
            }}
            onBlur={onBlur}
            error={errors.codigo?.message}
            maxLength={6}
          />
        )}
      />

      <View style={styles.errorContainer}>
        {verifyMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      <AppButton
        title="Verificar correo"
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
