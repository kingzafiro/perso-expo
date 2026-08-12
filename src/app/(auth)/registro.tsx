import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { StyleSheet, Text, View } from "react-native";

export default function RegistroScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>

          <Text style={styles.subtitle}>
            Regístrate para comenzar a usar Perso.
          </Text>
        </View>

        <RegisterForm />
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
