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
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();
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

  const apiError =
    resetPasswordMutation.error as AxiosError<ApiErrorResponse> | null;

  const errorMessage =
    apiError?.response?.data?.mensaje ??
    "No fue posible actualizar la contraseña.";

  return (
    <View style={styles.container}>
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
            autoComplete="new-password"
            textContentType="newPassword"
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
                  <EyeOff size={20} color={theme.icon} />
                ) : (
                  <Eye size={20} color={theme.icon} />
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
            autoComplete="new-password"
            textContentType="newPassword"
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
                  <EyeOff size={20} color={theme.icon} />
                ) : (
                  <Eye size={20} color={theme.icon} />
                )}
              </Pressable>
            }
          />
        )}
      />

      {resetPasswordMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      )}

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
    gap: 18,
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
