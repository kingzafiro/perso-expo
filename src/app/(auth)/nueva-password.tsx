import { useLocalSearchParams } from "expo-router";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NewPasswordForm } from "@/features/auth/components/NewPasswordForm";

export default function NuevaPasswordScreen() {
  const params = useLocalSearchParams<{
    resetToken?: string | string[];
  }>();

  const resetToken = Array.isArray(params.resetToken)
    ? params.resetToken[0]
    : params.resetToken;

  if (!resetToken) {
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
          <View style={styles.form}>
            <NewPasswordForm resetToken={resetToken} />
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

  form: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
});
