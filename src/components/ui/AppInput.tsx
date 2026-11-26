import { type ReactNode, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";

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
  onFocus,
  onBlur,
  ...props
}: AppInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.errorBorder
    : isFocused
      ? theme.inputBorderFocused
      : theme.inputBorder;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.inputBackground, borderColor },
        ]}
      >
        <TextInput
          {...props}
          selectionColor={theme.primary}
          cursorColor={theme.primary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textMuted}
        />

        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 2,
  },

  inputContainer: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  rightElement: {
    paddingRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
});
