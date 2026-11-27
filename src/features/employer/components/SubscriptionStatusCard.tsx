import {
  Crown,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  getEmployerPlanById,
  type EmployerLimits,
  type EmployerSubscription,
} from "../types/employer.types";

interface SubscriptionStatusCardProps {
  subscription: EmployerSubscription;
  limits: EmployerLimits;
  onManageStore: () => void;
  onChangePlan: () => void;
}

function formatDateEsMx(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function SubscriptionStatusCard({
  subscription,
  limits,
  onManageStore,
  onChangePlan,
}: SubscriptionStatusCardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const plan = getEmployerPlanById(subscription.planId);
  const endDate = formatDateEsMx(subscription.currentPeriodEnd);

  const isTrial = subscription.status === "trialing";
  const isSandbox = subscription.provider === "sandbox";
  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";

  const vacancyUsageLabel =
    limits.maxActiveVacancies === null
      ? `${limits.activeVacancies} activas · Ilimitadas`
      : `${limits.activeVacancies} de ${limits.maxActiveVacancies} vacantes activas`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1A130F" : "#17120E",
          borderColor: "rgba(240, 104, 8, 0.34)",
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.planPill}>
          <Crown size={13} color="#FFA064" />
          <Text style={styles.planPillText}>
            PLAN {(plan?.name ?? "EMPRESAS").toUpperCase()}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isTrial
                ? "rgba(240, 104, 8, 0.22)"
                : "rgba(52, 199, 89, 0.2)",
            },
          ]}
        >
          {isTrial ? (
            <Sparkles size={11} color="#FFA064" />
          ) : (
            <ShieldCheck size={11} color="#4CD964" />
          )}
          <Text
            style={[
              styles.statusBadgeText,
              { color: isTrial ? "#FFA064" : "#4CD964" },
            ]}
          >
            {isTrial
              ? `Prueba · ${subscription.daysRemaining}d restantes`
              : "Suscripción activa"}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Capacidad del plan</Text>
          <Text style={styles.metricValue}>{vacancyUsageLabel}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>
            {isTrial
              ? "Fin de prueba"
              : subscription.willRenew
                ? "Próxima renovación"
                : "Vigente hasta"}
          </Text>
          <Text style={styles.metricValue}>{endDate ?? "Activa"}</Text>
        </View>
      </View>

      {isSandbox ? (
        <Text style={styles.sandboxHint}>
          Modo prueba local activo. Al publicar con RevenueCat se sincronizará
          automáticamente con {storeName}.
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onChangePlan}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
        >
          <RefreshCw size={14} color="#FFFFFF" />
          <Text style={styles.secondaryBtnText}>Cambiar plan</Text>
        </Pressable>

        <Pressable
          onPress={onManageStore}
          style={({ pressed }) => [
            styles.ghostBtn,
            { borderColor: theme.primaryBorder },
            pressed && styles.pressed,
          ]}
        >
          <ExternalLink size={14} color="#FFA064" />
          <Text style={styles.ghostBtnText}>Gestionar en {storeName}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },

  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(240, 104, 8, 0.18)",
  },

  planPillText: {
    color: "#FFA064",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },

  metricBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 11,
    gap: 3,
  },

  metricLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11.5,
    fontWeight: "600",
  },

  metricValue: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },

  sandboxHint: {
    color: "rgba(255, 229, 209, 0.72)",
    fontSize: 11.5,
    lineHeight: 16,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  secondaryBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },

  secondaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },

  ghostBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },

  ghostBtnText: {
    color: "#FFA064",
    fontSize: 12.5,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },
});
