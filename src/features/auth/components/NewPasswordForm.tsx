import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),

    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

interface ApiErrorResponse {
  ok: false;
  codigo?: string;
  mensaje: string;
}

interface NewPasswordFormProps {
  resetToken: string;
}

export function NewPasswordForm({ resetToken }: NewPasswordFormProps) {
  const resetPasswordMutation = useResetPassword();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),

    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: NewPasswordFormData) => {
    resetPasswordMutation.mutate(
      {
        resetToken,
        nuevaPassword: data.password,
      },
      {
        onSuccess: () => {
          router.replace("/login");
        },
      },
    );
  };

  const apiError = resetPasswordMutation.error as AxiosError<ApiErrorResponse>;

  const errorMessage =
    apiError?.response?.data?.mensaje ??
    "No fue posible actualizar la contraseña.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crea una nueva contraseña</Text>

        <Text style={styles.description}>
          Ingresa una nueva contraseña para recuperar el acceso a tu cuenta.
        </Text>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            rightElement={
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={10}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#737373" />
                ) : (
                  <Eye size={20} color="#737373" />
                )}
              </Pressable>
            }
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            rightElement={
              <Pressable
                onPress={() => setShowConfirmPassword((current) => !current)}
                hitSlop={10}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#737373" />
                ) : (
                  <Eye size={20} color="#737373" />
                )}
              </Pressable>
            }
          />
        )}
      />

      <View style={styles.feedbackContainer}>
        {resetPasswordMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      <AppButton
        title="Cambiar contraseña"
        loading={resetPasswordMutation.isPending}
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
