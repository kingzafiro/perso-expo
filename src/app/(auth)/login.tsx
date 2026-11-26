import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useTheme } from "@/hooks/use-theme";

export default function LoginScreen() {
  const theme = useTheme();

  return (
    <AuthSheetLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa con tu correo, Apple o Google para continuar."
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            ¿Aún no tienes cuenta?
          </Text>

          <Link href="/(auth)/registro" asChild>
            <Pressable hitSlop={8}>
              <Text style={[styles.registerText, { color: theme.primary }]}>
                Crear cuenta
              </Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <LoginForm />
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

  registerText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
