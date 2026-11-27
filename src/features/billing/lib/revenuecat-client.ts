import { isRunningInExpoGo } from "expo";
import { Linking, Platform } from "react-native";

import { env } from "@/config/env";
import {
  EMPLOYER_PLANS,
  type BillingCycle,
  type EmployerPlanId,
} from "@/features/employer/types/employer.types";

import { getRevenueCatSdk } from "./revenuecat-adapter";
import {
  EMPLOYER_ENTITLEMENT_ID,
  EMPLOYER_TRIAL_DAYS,
  type BillingEnvironment,
  type PurchasePlanOutcome,
  type RestorePurchasesOutcome,
  type RevenueCatCustomerInfo,
  type RevenueCatPackage,
  type StorePackageSummary,
} from "../types/billing.types";

const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const GOOGLE_PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions";

let configuredUserId: string | null = null;
let cachedPackagesByProductId = new Map<string, RevenueCatPackage>();

function getPlatformApiKey(): string {
  if (Platform.OS === "ios") return env.revenueCatIosKey;
  if (Platform.OS === "android") return env.revenueCatAndroidKey;
  return "";
}

export function getBillingEnvironment(): BillingEnvironment {
  if (Platform.OS === "web") return "web";
  if (isRunningInExpoGo()) return "expo-go";

  const sdk = getRevenueCatSdk();
  const apiKey = getPlatformApiKey();
  if (!sdk || !apiKey) {
    return "unconfigured";
  }

  return "native";
}

export function getStoreProductId(
  planId: EmployerPlanId,
  billingCycle: BillingCycle,
): string {
  const plan = EMPLOYER_PLANS.find((p) => p.id === planId);
  if (!plan) return `perso_${planId}_${billingCycle}`;
  return billingCycle === "annual"
    ? plan.storeProductIds.annual
    : plan.storeProductIds.monthly;
}

export async function initializeRevenueCat(appUserId?: string): Promise<boolean> {
  if (getBillingEnvironment() !== "native") return false;

  const sdk = getRevenueCatSdk();
  const apiKey = getPlatformApiKey();
  if (!sdk || !apiKey) return false;

  try {
    if (!configuredUserId) {
      sdk.configure({ apiKey, appUserID: appUserId });
      configuredUserId = appUserId ?? "anonymous";
      return true;
    }

    if (appUserId && configuredUserId !== appUserId) {
      await sdk.logIn(appUserId);
      configuredUserId = appUserId;
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn("Error inicializando RevenueCat:", error);
    }
    return false;
  }
}

export async function fetchStorePackages(
  appUserId?: string,
): Promise<Record<string, StorePackageSummary>> {
  const ready = await initializeRevenueCat(appUserId);
  if (!ready) return {};

  const sdk = getRevenueCatSdk();
  if (!sdk) return {};

  try {
    const offerings = await sdk.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const map: Record<string, StorePackageSummary> = {};
    const nextCache = new Map<string, RevenueCatPackage>();

    for (const pkg of packages) {
      const productId = pkg.product.identifier;
      nextCache.set(productId, pkg);

      const hasFreeTrial =
        pkg.product.introPrice !== null &&
        pkg.product.introPrice !== undefined &&
        pkg.product.introPrice.price === 0;

      map[productId] = {
        productId,
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode ?? "MXN",
        hasFreeTrial,
        trialDays:
          pkg.product.introPrice?.periodNumberOfUnits ?? EMPLOYER_TRIAL_DAYS,
        rawPackage: pkg,
      };
    }

    cachedPackagesByProductId = nextCache;
    return map;
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudieron cargar productos de RevenueCat:", error);
    }
    return {};
  }
}

function extractEntitlement(customerInfo: RevenueCatCustomerInfo) {
  return customerInfo.entitlements?.active?.[EMPLOYER_ENTITLEMENT_ID] ?? null;
}

export async function purchaseEmployerPlan(params: {
  planId: EmployerPlanId;
  billingCycle: BillingCycle;
  appUserId?: string;
}): Promise<PurchasePlanOutcome> {
  const { planId, billingCycle, appUserId } = params;
  const productId = getStoreProductId(planId, billingCycle);
  const environment = getBillingEnvironment();

  if (environment !== "native") {
    return {
      ok: false,
      mode: "sandbox-required",
      productId,
      planId,
      billingCycle,
      message:
        environment === "expo-go"
          ? "Las compras de App Store y Google Play requieren un Development Build."
          : "Configura las llaves de RevenueCat para procesar pagos reales en tienda.",
    };
  }

  const sdk = getRevenueCatSdk();
  if (!sdk) {
    return {
      ok: false,
      mode: "unavailable",
      productId,
      planId,
      billingCycle,
      message: "El módulo nativo de compras no está disponible.",
    };
  }

  await initializeRevenueCat(appUserId);

  if (!cachedPackagesByProductId.has(productId)) {
    await fetchStorePackages(appUserId);
  }

  const targetPkg = cachedPackagesByProductId.get(productId);
  if (!targetPkg) {
    return {
      ok: false,
      mode: "unavailable",
      productId,
      planId,
      billingCycle,
      message:
        "No encontramos este plan en la tienda. Verifica la configuración de Offerings en RevenueCat.",
    };
  }

  try {
    const { customerInfo } = await sdk.purchasePackage(targetPkg);
    const entitlement = extractEntitlement(customerInfo);

    if (!entitlement?.isActive) {
      return {
        ok: false,
        mode: "revenuecat",
        productId,
        planId,
        billingCycle,
        message:
          "La compra se procesó pero el acceso aún se está confirmando. Intenta restaurar compras en unos segundos.",
      };
    }

    return {
      ok: true,
      mode: "revenuecat",
      productId: entitlement.productIdentifier || productId,
      planId,
      billingCycle,
      isTrial: entitlement.periodType === "TRIAL",
      expirationDate: entitlement.expirationDate,
    };
  } catch (error) {
    const userCancelled = Boolean(
      (error as { userCancelled?: boolean } | null)?.userCancelled,
    );

    if (userCancelled) {
      return {
        ok: false,
        cancelled: true,
        mode: "revenuecat",
        productId,
        planId,
        billingCycle,
      };
    }

    return {
      ok: false,
      mode: "revenuecat",
      productId,
      planId,
      billingCycle,
      message:
        "No se pudo completar la suscripción en la tienda. Intenta de nuevo.",
    };
  }
}

export async function restoreEmployerPurchases(
  appUserId?: string,
): Promise<RestorePurchasesOutcome> {
  const environment = getBillingEnvironment();

  if (environment !== "native") {
    return {
      ok: false,
      hasActiveEntitlement: false,
      message:
        "La restauración de compras de App Store / Google Play funciona desde el Development Build o app instalada de la tienda.",
    };
  }

  const sdk = getRevenueCatSdk();
  if (!sdk) {
    return {
      ok: false,
      hasActiveEntitlement: false,
      message: "El módulo de compras no está inicializado.",
    };
  }

  try {
    await initializeRevenueCat(appUserId);
    const customerInfo = await sdk.restorePurchases();
    const entitlement = extractEntitlement(customerInfo);

    if (!entitlement?.isActive) {
      return {
        ok: true,
        hasActiveEntitlement: false,
        message:
          "No encontramos una suscripción activa de Perso Empresas asociada a tu cuenta de tienda.",
      };
    }

    return {
      ok: true,
      hasActiveEntitlement: true,
      productId: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate,
      isTrial: entitlement.periodType === "TRIAL",
      message: "Suscripción restaurada correctamente.",
    };
  } catch {
    return {
      ok: false,
      hasActiveEntitlement: false,
      message: "No fue posible restaurar tus compras en este momento.",
    };
  }
}

export async function openNativeSubscriptionManagement(): Promise<void> {
  const url =
    Platform.OS === "ios"
      ? APPLE_SUBSCRIPTIONS_URL
      : GOOGLE_PLAY_SUBSCRIPTIONS_URL;

  await Linking.openURL(url);
}
