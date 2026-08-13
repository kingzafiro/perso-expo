import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useVerifyRecovery } from "@/features/auth/hooks/use-verify-recovery";

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

  const apiError = verifyRecoveryMutation.error as AxiosError<ApiErrorResponse>;

  const errorMessage =
    apiError?.response?.data?.mensaje ?? "No fue posible validar el código.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verifica tu código</Text>

        <Text style={styles.description}>
          Ingresa el código de 6 dígitos que enviamos a tu correo.
        </Text>
      </View>

      <View style={styles.emailContainer}>
        <Text style={styles.emailLabel}>Código enviado a</Text>

        <Text style={styles.email}>{email}</Text>
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

      <View style={styles.feedbackContainer}>
        {verifyRecoveryMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

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
});
