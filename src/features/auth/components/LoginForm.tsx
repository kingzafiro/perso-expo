import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { BiometricLoginButton } from "@/features/auth/components/BiometricLoginButton";
import { SocialAuthButtons } from "@/features/auth/components/SocialAuthButtons";
import {
  useBiometricLogin,
  useBiometricStatus,
} from "@/features/auth/hooks/use-biometric-login";
import { useLogin } from "@/features/auth/hooks/use-login";
import {
  loginSchema,
  type LoginFormData,
} from "@/features/auth/schemas/login.schema";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import { useTheme } from "@/hooks/use-theme";

export function LoginForm() {
  const theme = useTheme();
  const loginMutation = useLogin();
  const { status: biometricStatus, refresh: refreshBiometrics } =
    useBiometricStatus();
  const biometricLoginMutation = useBiometricLogin(refreshBiometrics);

  const [biometricError, setBiometricError] = useState<string | null>(null);

  const loginError = loginMutation.error as AxiosError<ApiErrorResponse> | null;

  const errorMessage =
    loginError?.response?.data?.mensaje ?? "No fue posible iniciar sesión.";

  const errorCode = loginError?.response?.data?.codigo;

  const { control, handleSubmit, getValues } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setBiometricError(null);
    loginMutation.mutate({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
  };

  const handleBiometricLogin = async () => {
    setBiometricError(null);
    const result = await biometricLoginMutation.mutateAsync();

    if (!result.ok && !result.cancelled && result.message) {
      setBiometricError(result.message);
    }
  };

  return (
    <View style={styles.container}>
      <FormInput
        control={control}
        name="email"
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />

      <FormInput
        control={control}
        name="password"
        label="Contraseña"
        placeholder="Tu contraseña"
        isPassword
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
      />

      <Pressable
        onPress={() => {
          router.push("/(auth)/forgot-password");
        }}
        style={({ pressed }) => [
          styles.forgotButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.forgotText, { color: theme.primary }]}>
          ¿Olvidaste tu contraseña?
        </Text>
      </Pressable>

      {loginMutation.isError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {errorMessage}
          </Text>

          {errorCode === "EMAIL_NO_VERIFICADO" && (
            <Pressable
              onPress={() => {
                const email = getValues("email").trim().toLowerCase();
                if (!email) return;
                router.push({
                  pathname: "/(auth)/verificar-email",
                  params: { email },
                });
              }}
              style={({ pressed }) => [
                styles.verifyLinkButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.verifyLinkText, { color: theme.primary }]}>
                Verificar mi correo
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {biometricError && (
        <View style={[styles.apiError, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.apiErrorText, { color: theme.error }]}>
            {biometricError}
          </Text>
        </View>
      )}

      <AppButton
        title="Iniciar sesión"
        loading={loginMutation.isPending}
        disabled={biometricLoginMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />

      {biometricStatus.canLoginWithBiometrics && (
        <BiometricLoginButton
          kind={biometricStatus.kind}
          label={biometricStatus.label}
          accountEmail={biometricStatus.savedAccount?.email}
          loading={biometricLoginMutation.isPending}
          disabled={loginMutation.isPending}
          onPress={handleBiometricLogin}
        />
      )}

      <SocialAuthButtons dividerText="o continúa con" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },

  pressed: {
    opacity: 0.6,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -6,
  },

  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },

  apiError: {
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },

  apiErrorText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },

  verifyLinkButton: {
    alignSelf: "flex-start",
  },

  verifyLinkText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
