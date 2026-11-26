import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useTheme } from "@/hooks/use-theme";

export default function RegistroScreen() {
  const theme = useTheme();

  return (
    <AuthSheetLayout
      title="Crear cuenta"
      subtitle="Regístrate para comenzar a usar Perso."
      showBackButton
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            ¿Ya tienes una cuenta?
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
      <RegisterForm />
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
