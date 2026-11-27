import * as Haptics from "expo-haptics";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";

import { VACANCY_BENEFITS_PRESETS } from "../types/employer.types";

interface VacancyBenefitsSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export function VacancyBenefitsSelector({
  value,
  onChange,
}: VacancyBenefitsSelectorProps) {
  const theme = useTheme();
  const [customBenefit, setCustomBenefit] = useState("");

  const toggleBenefit = (benefit: string) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (value.includes(benefit)) {
      onChange(value.filter((item) => item !== benefit));
    } else if (value.length < 15) {
      onChange([...value, benefit]);
    }
  };

  const addCustom = () => {
    const clean = customBenefit.trim();
    if (clean.length < 2 || value.includes(clean) || value.length >= 15) return;
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    onChange([...value, clean]);
    setCustomBenefit("");
  };

  const customAdded = value.filter(
    (b) => !(VACANCY_BENEFITS_PRESETS as readonly string[]).includes(b),
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        Beneficios y prestaciones ({value.length}/15)
      </Text>

      <View style={styles.chipsWrap}>
        {VACANCY_BENEFITS_PRESETS.map((benefit) => {
          const active = value.includes(benefit);
          return (
            <Pressable
              key={benefit}
              onPress={() => toggleBenefit(benefit)}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? theme.primary
                    : theme.inputBackground,
                  borderColor: active ? theme.primary : theme.inputBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#FFFFFF" : theme.text },
                ]}
              >
                {benefit}
              </Text>
            </Pressable>
          );
        })}

        {customAdded.map((benefit) => (
          <Pressable
            key={benefit}
            onPress={() => toggleBenefit(benefit)}
            style={[
              styles.chip,
              styles.customChip,
              {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: "#FFFFFF" }]}>
              {benefit}
            </Text>
            <X size={12} color="#FFFFFF" />
          </Pressable>
        ))}
      </View>

      <View
        style={[
          styles.customRow,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        <TextInput
          value={customBenefit}
          onChangeText={setCustomBenefit}
          onSubmitEditing={addCustom}
          placeholder="Agregar otro beneficio (ej. Comedor subsidiado)"
          placeholderTextColor={theme.textMuted}
          style={[styles.customInput, { color: theme.text }]}
          returnKeyType="done"
          maxLength={60}
        />
        <Pressable
          onPress={addCustom}
          style={[styles.addBtn, { backgroundColor: theme.primarySoft }]}
        >
          <Plus size={15} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.2,
  },

  customChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 44,
    gap: 8,
  },

  customInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 8,
  },

  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
