import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { SocialAuthButtons } from "@/features/auth/components/SocialAuthButtons";
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
    loginMutation.mutate({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
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

      <AppButton
        title="Iniciar sesión"
        loading={loginMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />

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
