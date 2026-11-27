import axios from "axios";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Building2, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { useBilling } from "@/features/billing/hooks/use-billing";
import { getStoreProductId } from "@/features/billing/lib/revenuecat-client";
import { BillingCycleToggle } from "@/features/employer/components/BillingCycleToggle";
import { PlanCard } from "@/features/employer/components/PlanCard";
import { SubscriptionComplianceFooter } from "@/features/employer/components/SubscriptionComplianceFooter";
import { TrialHighlightBanner } from "@/features/employer/components/TrialHighlightBanner";
import {
  EMPLOYER_PLANS,
  type BillingCycle,
  type EmployerPlanId,
} from "@/features/employer/types/employer.types";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string } | undefined;
    if (data?.mensaje) return data.mensaje;
  }
  return fallback;
}

export default function EmployerPlansScreen() {
  const theme = useTheme();
  const draft = useEmployerStore((state) => state.draft);
  const existingProfile = useEmployerStore((state) => state.profile);
  const subscription = useEmployerStore((state) => state.subscription);
  const sandboxEnabled = useEmployerStore((state) => state.sandboxEnabled);
  const saveProfileToServer = useEmployerStore(
    (state) => state.saveProfileToServer,
  );
  const syncSubscriptionWithServer = useEmployerStore(
    (state) => state.syncSubscriptionWithServer,
  );
  const activateSandboxTrial = useEmployerStore(
    (state) => state.activateSandboxTrial,
  );

  const {
    packagesByProductId,
    purchasePlan,
    restorePurchases,
  } = useBilling();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle ?? "monthly",
  );
  const [selectedPlanId, setSelectedPlanId] = useState<EmployerPlanId>(
    subscription?.planId ?? "profesional",
  );
  const [processing, setProcessing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const selectedPlan =
    EMPLOYER_PLANS.find((p) => p.id === selectedPlanId) ?? EMPLOYER_PLANS[1];
  const displayPrice =
    billingCycle === "annual"
      ? selectedPlan.annualMonthlyPrice
      : selectedPlan.monthlyPrice;

  const companyName =
    existingProfile?.companyName || draft.companyName || "tu empresa";

  const exitToHome = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace("/(app)");
    }
  };

  const ensureCompanyProfileSaved = async () => {
    if (existingProfile?.id_empresa) return;
    await saveProfileToServer({
      selectedPlanId: selectedPlan.id,
      billingCycle,
    });
  };

  const runSandboxTrial = async () => {
    setProcessing(true);
    try {
      await ensureCompanyProfileSaved();
      await activateSandboxTrial(selectedPlan.id, billingCycle);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      router.replace("/(employer)/panel");
    } catch (error) {
      Alert.alert(
        "No se pudo activar la prueba",
        extractErrorMessage(
          error,
          "Verifica que la migración de base de datos esté aplicada.",
        ),
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleStartTrial = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      await ensureCompanyProfileSaved();
      const outcome = await purchasePlan(selectedPlan.id, billingCycle);

      if (outcome.cancelled) {
        return;
      }

      if (outcome.ok) {
        await syncSubscriptionWithServer({
          planId: selectedPlan.id,
          billingCycle,
          productId: outcome.productId,
          isTrial: outcome.isTrial,
          expirationDate: outcome.expirationDate,
          platform: Platform.OS === "ios" ? "ios" : "android",
        });

        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }

        router.replace("/(employer)/panel");
        return;
      }

      if (outcome.mode === "sandbox-required" && sandboxEnabled) {
        if (Platform.OS === "web") {
          await runSandboxTrial();
          return;
        }

        Alert.alert(
          "Modo prueba local (Expo Go)",
          `Las compras reales de App Store y Google Play se procesarán con RevenueCat al compilar tu Development Build.\n\n¿Deseas activar ahora la prueba gratis de 14 días en modo desarrollo para explorar el Panel de Empleador?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Activar 14 días (prueba)",
              onPress: () => {
                void runSandboxTrial();
              },
            },
          ],
        );
        return;
      }

      Alert.alert(
        "Suscripción no completada",
        outcome.message ||
          "No fue posible iniciar tu suscripción en este momento.",
      );
    } catch (error) {
      Alert.alert(
        "Error al activar plan",
        extractErrorMessage(
          error,
          "No pudimos completar la activación. Intenta de nuevo.",
        ),
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);

    try {
      const outcome = await restorePurchases();

      if (outcome.hasActiveEntitlement) {
        await syncSubscriptionWithServer({
          productId: outcome.productId,
          isTrial: outcome.isTrial,
          expirationDate: outcome.expirationDate,
          platform: Platform.OS === "ios" ? "ios" : "android",
        });
        Alert.alert("Compras restauradas", outcome.message, [
          {
            text: "Ir al panel",
            onPress: () => router.replace("/(employer)/panel"),
          },
        ]);
        return;
      }

      Alert.alert("Restaurar compras", outcome.message);
    } catch (error) {
      Alert.alert(
        "Error al restaurar",
        extractErrorMessage(error, "No fue posible restaurar tus compras."),
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleSaveForLater = async () => {
    setProcessing(true);
    try {
      await ensureCompanyProfileSaved();
      exitToHome();
    } catch {
      exitToHome();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AuthSheetLayout
      title="Activa Perso Empresas"
      subtitle={`Comienza con 14 días gratis para ${companyName}.`}
      showBackButton
      stepIndicator={{ current: 4, total: 4 }}
    >
      <View style={styles.container}>
        <TrialHighlightBanner trialDays={selectedPlan.trialDays} />

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
                existingProfile?.industry || draft.industry,
                existingProfile?.city || draft.city,
              ]
                .filter(Boolean)
                .join(" · ") || "Perfil de empleador listo"}
            </Text>
          </View>
          <ShieldCheck size={18} color={theme.success} />
        </View>

        <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />

        <View style={styles.plansList}>
          {EMPLOYER_PLANS.map((plan) => {
            const productId = getStoreProductId(plan.id, billingCycle);
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                selected={selectedPlanId === plan.id}
                storePackage={packagesByProductId[productId]}
                onSelect={() => setSelectedPlanId(plan.id)}
              />
            );
          })}
        </View>

        <View style={styles.actions}>
          <AppButton
            title={`Iniciar 14 días gratis · ${selectedPlan.name}`}
            loading={processing}
            onPress={handleStartTrial}
          />
          <Text style={[styles.afterTrialText, { color: theme.textSecondary }]}>
            Después de 14 días: ${displayPrice.toLocaleString("es-MX")} MXN/mes
            {billingCycle === "annual" ? " (facturado anualmente)" : ""}
          </Text>

          <SubscriptionComplianceFooter
            restoring={restoring}
            disabled={processing}
            trialDays={selectedPlan.trialDays}
            onRestore={handleRestore}
            onSaveForLater={handleSaveForLater}
          />
        </View>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 14,
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

  plansList: {
    gap: 11,
  },

  actions: {
    gap: 8,
    marginTop: 4,
  },

  afterTrialText: {
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
  },
});
