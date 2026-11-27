import * as Haptics from "expo-haptics";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface AppSelectFieldProps<T extends string = string> {
  label: string;
  placeholder?: string;
  value: T | "";
  options: SelectOption<T>[];
  error?: string;
  onChange: (value: T) => void;
  modalTitle?: string;
}

export function AppSelectField<T extends string = string>({
  label,
  placeholder = "Selecciona una opción",
  value,
  options,
  error,
  onChange,
  modalTitle,
}: AppSelectFieldProps<T>) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const sheetBg = isDark ? "#181513" : "#FFFFFF";

  const handleSelect = (next: T) => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    onChange(next);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>

      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            void Haptics.selectionAsync();
          }
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.error : theme.inputBorder,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selectedOption ? theme.text : theme.textMuted },
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={17} color={theme.textSecondary} />
      </Pressable>

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            onPress={() => {}}
            style={[
              styles.sheet,
              {
                backgroundColor: sheetBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View
              style={[
                styles.sheetHeader,
                { borderBottomColor: theme.inputBorder },
              ]}
            >
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {modalTitle ?? label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.inputBackground },
                ]}
              >
                <X size={16} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleSelect(opt.value)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      idx < options.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.inputBorder,
                      },
                      isSelected && { backgroundColor: theme.primarySoft },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {opt.description ? (
                        <Text
                          style={[
                            styles.optionDesc,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {opt.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Check size={17} color={theme.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  trigger: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.52)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  sheet: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: "70%",
    overflow: "hidden",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  optionsList: {
    maxHeight: 380,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },

  optionTextWrap: {
    flex: 1,
    gap: 2,
  },

  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },

  optionDesc: {
    fontSize: 12.5,
  },

  pressed: {
    opacity: 0.72,
  },
});
