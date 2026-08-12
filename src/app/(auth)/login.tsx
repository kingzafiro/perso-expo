import { LoginForm } from "@/features/auth/components/LoginForm";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>

            <Text style={styles.title}>Bienvenido de nuevo</Text>

            <Text style={styles.subtitle}>
              Ingresa a tu cuenta para continuar.
            </Text>
          </View>

          <LoginForm />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Aún no tienes cuenta?</Text>

            <Text style={styles.registerText}>Crear cuenta</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },

  header: {
    marginBottom: 42,
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#111111",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 24,
    color: "#707070",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 32,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  footerText: {
    fontSize: 15,
    color: "#777777",
  },

  registerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
});
