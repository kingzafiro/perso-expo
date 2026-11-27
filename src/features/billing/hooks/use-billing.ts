import { useCallback, useEffect, useState } from "react";

import type {
  BillingCycle,
  EmployerPlanId,
} from "@/features/employer/types/employer.types";
import { useAuthStore } from "@/stores/auth.store";

import {
  fetchStorePackages,
  getBillingEnvironment,
  openNativeSubscriptionManagement,
  purchaseEmployerPlan,
  restoreEmployerPurchases,
} from "../lib/revenuecat-client";
import type {
  BillingEnvironment,
  StorePackageSummary,
} from "../types/billing.types";

export function useBilling() {
  const userId = useAuthStore((state) => state.user?.id_usuario);
  const appUserId = userId ? String(userId) : undefined;

  const [environment] = useState<BillingEnvironment>(() =>
    getBillingEnvironment(),
  );
  const [packagesByProductId, setPackagesByProductId] = useState<
    Record<string, StorePackageSummary>
  >({});
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    if (environment !== "native") return;

    let mounted = true;
    setLoadingPackages(true);

    void fetchStorePackages(appUserId)
      .then((pkgs) => {
        if (mounted) setPackagesByProductId(pkgs);
      })
      .finally(() => {
        if (mounted) setLoadingPackages(false);
      });

    return () => {
      mounted = false;
    };
  }, [appUserId, environment]);

  const purchasePlan = useCallback(
    (planId: EmployerPlanId, billingCycle: BillingCycle) =>
      purchaseEmployerPlan({ planId, billingCycle, appUserId }),
    [appUserId],
  );

  const restorePurchases = useCallback(
    () => restoreEmployerPurchases(appUserId),
    [appUserId],
  );

  const openManageSubscriptions = useCallback(
    () => openNativeSubscriptionManagement(),
    [],
  );

  return {
    environment,
    isNativeStoreReady: environment === "native",
    packagesByProductId,
    loadingPackages,
    purchasePlan,
    restorePurchases,
    openManageSubscriptions,
  };
}
