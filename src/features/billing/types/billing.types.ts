import type {
  BillingCycle,
  EmployerPlanId,
} from "@/features/employer/types/employer.types";

export const EMPLOYER_ENTITLEMENT_ID = "perso_employer";
export const EMPLOYER_TRIAL_DAYS = 14;

export type BillingEnvironment =
  | "native"
  | "expo-go"
  | "web"
  | "unconfigured";

export interface StorePackageSummary {
  productId: string;
  priceString: string;
  currencyCode: string;
  hasFreeTrial: boolean;
  trialDays: number;
  rawPackage?: unknown;
}

export interface RevenueCatEntitlementInfo {
  identifier: string;
  isActive: boolean;
  productIdentifier: string;
  expirationDate: string | null;
  periodType?: "NORMAL" | "INTRO" | "TRIAL" | string;
  willRenew?: boolean;
}

export interface RevenueCatCustomerInfo {
  entitlements: {
    active: Record<string, RevenueCatEntitlementInfo | undefined>;
  };
}

export interface RevenueCatPackage {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
    currencyCode?: string;
    introPrice?: {
      price: number;
      periodNumberOfUnits?: number;
      periodUnit?: string;
    } | null;
  };
}

export interface RevenueCatOfferings {
  current: {
    availablePackages: RevenueCatPackage[];
  } | null;
}

export interface RevenueCatSdk {
  configure: (config: { apiKey: string; appUserID?: string }) => void;
  logIn: (
    appUserID: string,
  ) => Promise<{ customerInfo: RevenueCatCustomerInfo }>;
  logOut: () => Promise<RevenueCatCustomerInfo>;
  getOfferings: () => Promise<RevenueCatOfferings>;
  purchasePackage: (
    pkg: RevenueCatPackage,
  ) => Promise<{ customerInfo: RevenueCatCustomerInfo }>;
  restorePurchases: () => Promise<RevenueCatCustomerInfo>;
  getCustomerInfo: () => Promise<RevenueCatCustomerInfo>;
}

export interface PurchasePlanOutcome {
  ok: boolean;
  cancelled?: boolean;
  mode: "revenuecat" | "sandbox-required" | "unavailable";
  productId?: string;
  planId: EmployerPlanId;
  billingCycle: BillingCycle;
  isTrial?: boolean;
  expirationDate?: string | null;
  message?: string;
}

export interface RestorePurchasesOutcome {
  ok: boolean;
  hasActiveEntitlement: boolean;
  productId?: string;
  expirationDate?: string | null;
  isTrial?: boolean;
  message: string;
}
