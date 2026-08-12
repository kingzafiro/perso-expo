import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useRegister } from "@/features/auth/hooks/use-register";
import {
    registerSchema,
    type RegisterFormData,
} from "@/features/auth/schemas/register.schema";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { ApiErrorResponse } from "../types/auth.types";

export function RegisterForm() {
  const registerMutation = useRegister();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerError = registerMutation.error as AxiosError<ApiErrorResponse>;

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
                  pressed && styles.eyeButtonPressed,
                ]}
              >
                {showPassword ? (
                  <EyeOff size={22} color="#5F5F5F" />
                ) : (
                  <Eye size={22} color="#5F5F5F" />
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
                  pressed && styles.eyeButtonPressed,
                ]}
              >
                {showConfirmPassword ? (
                  <EyeOff size={22} color="#5F5F5F" />
                ) : (
                  <Eye size={22} color="#5F5F5F" />
                )}
              </Pressable>
            }
          />
        )}
      />

      <View style={styles.errorContainer}>
        {registerMutation.isError && (
          <View style={styles.apiError}>
            <Text style={styles.apiErrorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      <AppButton
        title="Crear cuenta"
        loading={registerMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>

        <Link href="/(auth)/login" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
            ]}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 20,
  },

  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  eyeButtonPressed: {
    opacity: 0.5,
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

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  loginText: {
    fontSize: 15,
    color: "#666666",
  },

  loginButton: {
    paddingVertical: 4,
  },

  loginButtonPressed: {
    opacity: 0.6,
  },

  loginButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
});
