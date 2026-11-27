import * as Haptics from "expo-haptics";
import { Check, Sparkles } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { StorePackageSummary } from "@/features/billing/types/billing.types";
import { useTheme } from "@/hooks/use-theme";

import type { BillingCycle, EmployerPlan } from "../types/employer.types";

interface PlanCardProps {
  plan: EmployerPlan;
  billingCycle: BillingCycle;
  selected: boolean;
  storePackage?: StorePackageSummary;
  onSelect: () => void;
}

export function PlanCard({
  plan,
  billingCycle,
  selected,
  storePackage,
  onSelect,
}: PlanCardProps) {
  const theme = useTheme();
  const fallbackMonthly =
    billingCycle === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;

  const displayPrice = storePackage?.priceString
    ? storePackage.priceString
    : `$${fallbackMonthly.toLocaleString("es-MX")}`;

  const priceUnit = storePackage?.priceString
    ? billingCycle === "annual"
      ? "al año"
      : "al mes"
    : "MXN/mes";

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          void Haptics.selectionAsync();
        }
        onSelect();
      }}
      style={[
        styles.card,
        {
          backgroundColor: selected ? theme.primarySoft : theme.inputBackground,
          borderColor: selected ? theme.primary : theme.inputBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.flexOne}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>
              {plan.name}
            </Text>
            {plan.popular ? (
              <View
                style={[styles.popularBadge, { backgroundColor: theme.primary }]}
              >
                <Sparkles size={11} color="#FFFFFF" />
                <Text style={styles.popularText}>Más elegido</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            {plan.tagline}
          </Text>
        </View>

        <View style={styles.priceCol}>
          <Text style={[styles.priceValue, { color: theme.text }]}>
            {displayPrice}
          </Text>
          <Text style={[styles.priceUnit, { color: theme.textSecondary }]}>
            {priceUnit}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.trialPill,
          {
            backgroundColor: selected
              ? "rgba(240, 104, 8, 0.16)"
              : "rgba(52, 199, 89, 0.12)",
          },
        ]}
      >
        <Text
          style={[
            styles.trialPillText,
            { color: selected ? theme.primary : theme.success },
          ]}
        >
          Incluye {storePackage?.trialDays ?? plan.trialDays} días gratis
        </Text>
      </View>

      <View style={styles.featuresList}>
        {plan.features.map((feat) => (
          <View key={feat} style={styles.featureRow}>
            <Check size={14} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              {feat}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 15,
    gap: 11,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  popularText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
  },

  tagline: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },

  priceCol: {
    alignItems: "flex-end",
  },

  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  priceUnit: {
    fontSize: 11,
    fontWeight: "600",
  },

  trialPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  trialPillText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  featuresList: {
    gap: 7,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  featureText: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },
});
