import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Building2,
  Check,
  Crown,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import {
  EMPLOYER_PLANS,
  type BillingCycle,
  type EmployerPlanId,
} from "@/features/employer/types/employer.types";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

export default function EmployerPlansScreen() {
  const theme = useTheme();
  const draft = useEmployerStore((state) => state.draft);
  const existingProfile = useEmployerStore((state) => state.profile);
  const finalizeRegistration = useEmployerStore(
    (state) => state.finalizeRegistration,
  );

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    existingProfile?.billingCycle ?? "annual",
  );
  const [selectedPlanId, setSelectedPlanId] = useState<EmployerPlanId>(
    existingProfile?.selectedPlanId ?? "profesional",
  );
  const [saving, setSaving] = useState(false);

  const selectedPlan =
    EMPLOYER_PLANS.find((p) => p.id === selectedPlanId) ?? EMPLOYER_PLANS[1];
  const displayPrice =
    billingCycle === "annual"
      ? selectedPlan.annualMonthlyPrice
      : selectedPlan.monthlyPrice;

  const companyName =
    draft.companyName || existingProfile?.companyName || "tu empresa";

  const exitToHome = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace("/(app)");
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      await finalizeRegistration(selectedPlan.id, billingCycle);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      if (Platform.OS === "web") {
        exitToHome();
        return;
      }

      Alert.alert(
        "Perfil de empleador registrado",
        `Guardamos el perfil de ${companyName} con el Plan ${selectedPlan.name} ($${displayPrice.toLocaleString("es-MX")} MXN/mes).\n\nMuy pronto habilitaremos la pasarela de pago segura para activar tus publicaciones de inmediato.`,
        [
          {
            text: "Volver a Inicio",
            onPress: exitToHome,
          },
        ],
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveForLater = async () => {
    setSaving(true);
    try {
      await finalizeRegistration(null, billingCycle);
      exitToHome();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthSheetLayout
      title="Activa tu cuenta de empleador"
      subtitle={`¡Listo! El perfil de ${companyName} ya fue creado.`}
      showBackButton
      stepIndicator={{ current: 3, total: 3 }}
    >
      <View style={styles.container}>
        {/* Aviso transparente del costo de membresía */}
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.primarySoft,
              borderColor: theme.primaryBorder,
            },
          ]}
        >
          <View style={styles.noticeHeader}>
            <Crown size={16} color={theme.primary} />
            <Text style={[styles.noticeTitle, { color: theme.primary }]}>
              Membresía Perso Empresas
            </Text>
          </View>
          <Text style={[styles.noticeBody, { color: theme.text }]}>
            Para mantener vacantes reales, cero spam y candidatos con documentos
            verificados, el acceso como empleador tiene un costo mensual o anual.
          </Text>
        </View>

        {/* Resumen compacto de la empresa registrada */}
        <View
          style={[
            styles.companySummary,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View
            style={[
              styles.companyIcon,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <Building2 size={18} color={theme.primary} />
          </View>
          <View style={styles.flexOne}>
            <Text
              style={[styles.companyName, { color: theme.text }]}
              numberOfLines={1}
            >
              {companyName}
            </Text>
            <Text
              style={[styles.companyMeta, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {[
                draft.industry || existingProfile?.industry,
                draft.city || existingProfile?.city,
              ]
                .filter(Boolean)
                .join(" · ") || "Perfil de empleador listo"}
            </Text>
          </View>
          <ShieldCheck size={18} color={theme.success} />
        </View>

        {/* Selector Mensual / Anual */}
        <View
          style={[
            styles.cycleTrack,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") void Haptics.selectionAsync();
              setBillingCycle("monthly");
            }}
            style={[
              styles.cycleOption,
              billingCycle === "monthly" && {
                backgroundColor: theme.background,
              },
            ]}
          >
            <Text
              style={[
                styles.cycleText,
                {
                  color:
                    billingCycle === "monthly"
                      ? theme.text
                      : theme.textSecondary,
                },
              ]}
            >
              Mensual
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") void Haptics.selectionAsync();
              setBillingCycle("annual");
            }}
            style={[
              styles.cycleOption,
              billingCycle === "annual" && {
                backgroundColor: theme.background,
              },
            ]}
          >
            <Text
              style={[
                styles.cycleText,
                {
                  color:
                    billingCycle === "annual"
                      ? theme.text
                      : theme.textSecondary,
                },
              ]}
            >
              Anual
            </Text>
            <View
              style={[styles.savePill, { backgroundColor: theme.primarySoft }]}
            >
              <Text style={[styles.savePillText, { color: theme.primary }]}>
                -20%
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Tarjetas de planes */}
        <View style={styles.plansList}>
          {EMPLOYER_PLANS.map((plan) => {
            const active = selectedPlanId === plan.id;
            const price =
              billingCycle === "annual"
                ? plan.annualMonthlyPrice
                : plan.monthlyPrice;

            return (
              <Pressable
                key={plan.id}
                onPress={() => {
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                  setSelectedPlanId(plan.id);
                }}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: active
                      ? theme.primarySoft
                      : theme.inputBackground,
                    borderColor: active ? theme.primary : theme.inputBorder,
                  },
                ]}
              >
                <View style={styles.planTop}>
                  <View style={styles.flexOne}>
                    <View style={styles.planNameRow}>
                      <Text style={[styles.planName, { color: theme.text }]}>
                        {plan.name}
                      </Text>
                      {plan.popular && (
                        <View
                          style={[
                            styles.popularBadge,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Sparkles size={11} color="#FFFFFF" />
                          <Text style={styles.popularText}>Más elegido</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.planTagline,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {plan.tagline}
                    </Text>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={[styles.priceValue, { color: theme.text }]}>
                      ${price.toLocaleString("es-MX")}
                    </Text>
                    <Text
                      style={[styles.priceUnit, { color: theme.textSecondary }]}
                    >
                      MXN/mes
                    </Text>
                  </View>
                </View>

                <View style={styles.featuresList}>
                  {plan.features.map((feat) => (
                    <View key={feat} style={styles.featureRow}>
                      <Check size={14} color={theme.primary} />
                      <Text
                        style={[
                          styles.featureText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {feat}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <AppButton
            title={`Activar ${selectedPlan.name} · $${displayPrice.toLocaleString("es-MX")} MXN/mes`}
            loading={saving}
            onPress={handleActivate}
          />

          <Pressable
            onPress={handleSaveForLater}
            disabled={saving}
            style={({ pressed }) => [
              styles.laterBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.laterText, { color: theme.textSecondary }]}>
              Guardar mi perfil y activar después
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 15,
  },

  noticeCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 6,
  },

  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  noticeTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
  },

  companySummary: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  companyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  companyName: {
    fontSize: 15,
    fontWeight: "700",
  },

  companyMeta: {
    fontSize: 12.5,
  },

  cycleTrack: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },

  cycleOption: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  cycleText: {
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

  plansList: {
    gap: 11,
  },

  planCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 15,
    gap: 12,
  },

  planTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  planName: {
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

  planTagline: {
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

  actions: {
    gap: 10,
    marginTop: 4,
  },

  laterBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },

  laterText: {
    fontSize: 13.5,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.72,
  },
});
