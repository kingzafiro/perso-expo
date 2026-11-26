import { Eye, EyeOff } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Pressable, StyleSheet, type TextInputProps } from "react-native";

import { AppInput } from "@/components/ui/AppInput";
import { useTheme } from "@/hooks/use-theme";

interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText" | "onBlur"> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  isPassword?: boolean;
  rightElement?: ReactNode;
  transformText?: (text: string) => string;
}

export function FormInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  isPassword = false,
  rightElement,
  transformText,
  secureTextEntry,
  ...inputProps
}: FormInputProps<TFieldValues>) {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const resolvedRightElement = isPassword ? (
    <Pressable
      hitSlop={12}
      onPress={() => setShowPassword((current) => !current)}
      style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
    >
      {showPassword ? (
        <EyeOff size={20} color={theme.icon} />
      ) : (
        <Eye size={20} color={theme.icon} />
      )}
    </Pressable>
  ) : (
    rightElement
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <AppInput
          {...inputProps}
          label={label}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          value={typeof value === "string" ? value : ""}
          onChangeText={(text) =>
            onChange(transformText ? transformText(text) : text)
          }
          onBlur={onBlur}
          error={error?.message}
          rightElement={resolvedRightElement}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.6,
  },
});
