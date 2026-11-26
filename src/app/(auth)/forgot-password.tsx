import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { useTheme } from "@/hooks/use-theme";

export default function ForgotPasswordScreen() {
  const theme = useTheme();

  return (
    <AuthSheetLayout
      title="Recupera tu acceso"
      subtitle="Ingresa tu correo y te enviaremos un código de 6 dígitos para continuar."
      showBackButton
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            ¿Recordaste tu contraseña?
          </Text>

          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={8}>
              <Text style={[styles.loginText, { color: theme.primary }]}>
                Iniciar sesión
              </Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <ForgotPasswordForm />
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  footerText: {
    fontSize: 15,
  },

  loginText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
