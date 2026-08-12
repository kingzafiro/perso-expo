import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { useLogin } from "@/features/auth/hooks/use-login";
import {
    loginSchema,
    type LoginFormData,
} from "@/features/auth/schemas/login.schema";

export function LoginForm() {
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
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
            placeholder="Tu contraseña"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
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

      <Pressable
        onPress={() => {
          // Aquí conectaremos recuperación de contraseña.
        }}
        style={({ pressed }) => [
          styles.forgotButton,
          pressed && styles.forgotButtonPressed,
        ]}
      >
        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      {loginMutation.isError && (
        <View style={styles.apiError}>
          <Text style={styles.apiErrorText}>
            Correo o contraseña incorrectos.
          </Text>
        </View>
      )}

      <AppButton
        title="Iniciar sesión"
        loading={loginMutation.isPending}
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

  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  eyeButtonPressed: {
    opacity: 0.5,
  },

  forgotButton: {
    alignSelf: "flex-start",
    marginTop: -6,
  },

  forgotButtonPressed: {
    opacity: 0.6,
  },

  forgotText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
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
