import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { SocialAuthButtons } from "@/features/auth/components/SocialAuthButtons";
import { useRegister } from "@/features/auth/hooks/use-register";
import {
  registerSchema,
  type RegisterFormData,
} from "@/features/auth/schemas/register.schema";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import { useTheme } from "@/hooks/use-theme";

export function RegisterForm() {
  const theme = useTheme();
  const registerMutation = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerError = registerMutation.error as AxiosError<ApiErrorResponse> | null;

  const errorMessage =
    registerError?.response?.data?.mensaje ?? "No fue posible crear la cuenta.";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      {
        email: data.email.trim().toLowerCase(),
        pass: data.password,
      },
      {
        onSuccess: (response) => {
          router.push({
            pathname: "/(auth)/verificar-email",
            params: {
              email: response.email,
            },
          });
        },
      },
    );
  };

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

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Contraseña"
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
                hitSlop={12}
                onPress={() => setShowPassword((current) => !current)}
                style={({ pressed }) => [
                  styles.eyeButton,
                  pressed && styles.pressed,
                ]}
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
                hitSlop={12}
                onPress={() => setShowConfirmPassword((current) => !current)}
                style={({ pressed }) => [
                  styles.eyeButton,
                  pressed && styles.pressed,
                ]}
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

      {registerMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      )}

      <AppButton
        title="Crear cuenta"
        loading={registerMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />

      <SocialAuthButtons dividerText="o regístrate con" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },

  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.6,
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
