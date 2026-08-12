import { ReactNode } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export function AppInput({
  label,
  error,
  rightElement,
  style,
  ...props
}: AppInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[styles.inputContainer, error && styles.inputContainerError]}
      >
        <TextInput
          {...props}
          style={[styles.input, style]}
          placeholderTextColor="#8B8B8B"
        />

        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#252525",
  },

  inputContainer: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },

  inputContainerError: {
    borderColor: "#D92D20",
  },

  input: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 18,
    fontSize: 17,
    color: "#111111",
  },

  rightElement: {
    paddingRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: "#D92D20",
    fontSize: 13,
    marginLeft: 4,
  },
});
