import { useLocalSearchParams } from "expo-router";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VerifyRecoveryForm } from "@/features/auth/components/VerifyRecoveryForm";

export default function VerificarRecuperacionScreen() {
  const { email } = useLocalSearchParams<{
    email?: string;
  }>();

  if (!email) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <VerifyRecoveryForm email={email} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
});
