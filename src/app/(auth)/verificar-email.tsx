import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";

export default function VerificarEmailScreen() {
  const { email } = useLocalSearchParams<{
    email?: string;
  }>();

  if (!email) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.title}>No encontramos el correo</Text>

          <Text style={styles.subtitle}>
            Regresa al registro e intenta nuevamente.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verifica tu correo</Text>

          <Text style={styles.subtitle}>
            Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
          </Text>
        </View>

        <VerifyEmailForm email={email} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  content: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },

  header: {
    marginBottom: 32,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111111",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 23,
    color: "#666666",
  },
});
