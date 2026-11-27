import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

import type { BillingCycle } from "../types/employer.types";

interface BillingCycleToggleProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}

export function BillingCycleToggle({
  value,
  onChange,
}: BillingCycleToggleProps) {
  const theme = useTheme();

  const select = (next: BillingCycle) => {
    if (next === value) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    onChange(next);
  };

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        },
      ]}
    >
      <Pressable
        onPress={() => select("monthly")}
        style={[
          styles.option,
          value === "monthly" && { backgroundColor: theme.background },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: value === "monthly" ? theme.text : theme.textSecondary,
            },
          ]}
        >
          Mensual
        </Text>
      </Pressable>

      <Pressable
        onPress={() => select("annual")}
        style={[
          styles.option,
          value === "annual" && { backgroundColor: theme.background },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: value === "annual" ? theme.text : theme.textSecondary,
            },
          ]}
        >
          Anual
        </Text>
        <View style={[styles.savePill, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.savePillText, { color: theme.primary }]}>
            -20%
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },

  option: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  optionText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  savePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },

  savePillText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
