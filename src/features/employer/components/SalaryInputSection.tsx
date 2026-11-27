import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppSelectField } from "@/components/ui/AppSelectField";
import { useTheme } from "@/hooks/use-theme";

import {
  VACANCY_SALARY_PERIODS,
  type VacancySalaryPeriod,
} from "../types/employer.types";

export type SalaryMode = "none" | "single" | "range";

interface SalaryInputSectionProps {
  mode: SalaryMode;
  minValue: string;
  maxValue: string;
  period: VacancySalaryPeriod;
  error?: string;
  onModeChange: (mode: SalaryMode) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onPeriodChange: (period: VacancySalaryPeriod) => void;
}

const MODE_OPTIONS: { id: SalaryMode; label: string }[] = [
  { id: "single", label: "Sueldo único" },
  { id: "range", label: "Rango salarial" },
  { id: "none", label: "A convenir" },
];

export function SalaryInputSection({
  mode,
  minValue,
  maxValue,
  period,
  error,
  onModeChange,
  onMinChange,
  onMaxChange,
  onPeriodChange,
}: SalaryInputSectionProps) {
  const theme = useTheme();

  const periodOptions = VACANCY_SALARY_PERIODS.map((p) => ({
    value: p.id,
    label: p.label,
    description: `Se mostrará como "${p.suffix}"`,
  }));

  const sanitizeAmount = (raw: string) => raw.replace(/\D/g, "").slice(0, 7);

  return (
    <View style={styles.container}>
      <View style={styles.sectionBlock}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Esquema de sueldo (opcional)
        </Text>
        <View
          style={[
            styles.modeTrack,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          {MODE_OPTIONS.map((item) => {
            const active = mode === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                  onModeChange(item.id);
                }}
                style={[
                  styles.modeBtn,
                  active && { backgroundColor: theme.background },
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: active ? theme.text : theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode === "single" ? (
        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Sueldo ofrecido (MXN)
          </Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: theme.inputBackground,
                borderColor: error ? theme.error : theme.inputBorder,
              },
            ]}
          >
            <Text style={[styles.prefix, { color: theme.textSecondary }]}>
              $
            </Text>
            <TextInput
              value={minValue}
              onChangeText={(t) => onMinChange(sanitizeAmount(t))}
              placeholder="Ej. 16500"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              style={[styles.input, { color: theme.text }]}
            />
            <Text style={[styles.suffix, { color: theme.textMuted }]}>MXN</Text>
          </View>
        </View>
      ) : null}

      {mode === "range" ? (
        <View style={styles.rangeRow}>
          <View style={styles.flexOne}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Mínimo (MXN)
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: error ? theme.error : theme.inputBorder,
                },
              ]}
            >
              <Text style={[styles.prefix, { color: theme.textSecondary }]}>
                $
              </Text>
              <TextInput
                value={minValue}
                onChangeText={(t) => onMinChange(sanitizeAmount(t))}
                placeholder="16500"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </View>

          <View style={styles.flexOne}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Máximo (MXN)
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: error ? theme.error : theme.inputBorder,
                },
              ]}
            >
              <Text style={[styles.prefix, { color: theme.textSecondary }]}>
                $
              </Text>
              <TextInput
                value={maxValue}
                onChangeText={(t) => onMaxChange(sanitizeAmount(t))}
                placeholder="17500"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </View>
        </View>
      ) : null}

      {mode !== "none" ? (
        <AppSelectField
          label="Periodo de pago"
          value={period}
          options={periodOptions}
          onChange={onPeriodChange}
        />
      ) : null}

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 13,
  },

  sectionBlock: {
    gap: 8,
  },

  fieldBlock: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  modeTrack: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },

  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  modeText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  rangeRow: {
    flexDirection: "row",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 8,
  },

  inputBox: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  prefix: {
    fontSize: 15,
    fontWeight: "700",
  },

  suffix: {
    fontSize: 12,
    fontWeight: "700",
  },

  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
});
