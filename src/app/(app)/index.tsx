import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

export default function HomeScreen() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const handleLogout = async () => {
    await secureStorage.clearTokens();
    setAuthenticated(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Perso</Text>

        <Text style={styles.subtitle}>Sesión iniciada correctamente.</Text>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111111",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#777777",
  },

  logoutButton: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#111111",
  },

  logoutButtonPressed: {
    opacity: 0.7,
  },

  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
