import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface VacancyStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

export function VacancyStepIndicator({
  currentStep,
  totalSteps,
  stepTitle,
}: VacancyStepIndicatorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          {stepTitle}
        </Text>
        <Text style={[styles.stepCount, { color: theme.textSecondary }]}>
          Paso {currentStep} de {totalSteps}
        </Text>
      </View>

      <View style={styles.barsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const completedOrActive = idx + 1 <= currentStep;
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  backgroundColor: completedOrActive
                    ? theme.primary
                    : theme.inputBorder,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  stepTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  stepCount: {
    fontSize: 12,
    fontWeight: "700",
  },

  barsRow: {
    flexDirection: "row",
    gap: 6,
  },

  bar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
});
