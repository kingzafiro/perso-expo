import { create } from "zustand";

import {
  activateSandboxTrialApi,
  getEmployerStatusApi,
  syncEmployerSubscriptionApi,
  uploadEmployerVerificationPdfApi,
  upsertEmployerProfileApi,
  type SyncSubscriptionInput,
} from "@/features/employer/api/employer.api";
import type {
  BillingCycle,
  EmployerLimits,
  EmployerPdfExtraction,
  EmployerPlanId,
  EmployerProfile,
  EmployerStatusPayload,
  EmployerSubscription,
} from "@/features/employer/types/employer.types";
import { secureStorage } from "@/lib/storage/secure-storage";

const EMPLOYER_STORAGE_KEY = "perso_employer_snapshot_v2";

interface CachedEmployerSnapshot {
  profile: EmployerProfile | null;
  subscription: EmployerSubscription | null;
  hasAccess: boolean;
  isAdmin: boolean;
  limits: EmployerLimits;
}

export interface EmployerDraft {
  companyName: string;
  legalName: string;
  rfc: string;
  industry: string;
  companySize: string;
  city: string;
  contactName: string;
  contactRole: string;
  workEmail: string;
  phone: string;
  description: string;
}

const EMPTY_DRAFT: EmployerDraft = {
  companyName: "",
  legalName: "",
  rfc: "",
  industry: "",
  companySize: "",
  city: "",
  contactName: "",
  contactRole: "",
  workEmail: "",
  phone: "",
  description: "",
};

const DEFAULT_LIMITS: EmployerLimits = {
  maxActiveVacancies: 0,
  activeVacancies: 0,
  trialDays: 14,
};

function profileToDraft(profile: EmployerProfile | null): EmployerDraft {
  if (!profile) return EMPTY_DRAFT;
  return {
    companyName: profile.companyName ?? "",
    legalName: profile.legalName ?? "",
    rfc: profile.rfc ?? "",
    industry: profile.industry ?? "",
    companySize: profile.companySize ?? "",
    city: profile.city ?? "",
    contactName: profile.contactName ?? "",
    contactRole: profile.contactRole ?? "",
    workEmail: profile.workEmail ?? "",
    phone: profile.phone ?? "",
    description: profile.description ?? "",
  };
}

async function readSnapshot(): Promise<CachedEmployerSnapshot | null> {
  try {
    const raw = await secureStorage.getItem(EMPLOYER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedEmployerSnapshot;
  } catch {
    return null;
  }
}

async function writeSnapshot(snapshot: CachedEmployerSnapshot | null) {
  try {
    if (!snapshot) {
      await secureStorage.removeItem(EMPLOYER_STORAGE_KEY);
      return;
    }
    await secureStorage.setItem(EMPLOYER_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // No bloquear UI si falla persistencia local
  }
}

interface EmployerState {
  profile: EmployerProfile | null;
  subscription: EmployerSubscription | null;
  hasAccess: boolean;
  isAdmin: boolean;
  limits: EmployerLimits;
  sandboxEnabled: boolean;
  draft: EmployerDraft;
  hydrated: boolean;
  syncing: boolean;
  hydrate: () => Promise<void>;
  syncFromServer: () => Promise<EmployerStatusPayload | null>;
  updateDraft: (patch: Partial<EmployerDraft>) => void;
  startEditFromProfile: () => void;
  saveProfileToServer: (options?: {
    selectedPlanId?: EmployerPlanId | null;
    billingCycle?: BillingCycle;
  }) => Promise<EmployerStatusPayload>;
  syncSubscriptionWithServer: (
    payload: SyncSubscriptionInput,
  ) => Promise<EmployerStatusPayload>;
  activateSandboxTrial: (
    planId: EmployerPlanId,
    billingCycle: BillingCycle,
  ) => Promise<EmployerStatusPayload>;
  uploadVerificationPdf: (file: {
    uri: string;
    name: string;
    mimeType: string;
  }) => Promise<{
    payload: EmployerStatusPayload;
    extraccion: EmployerPdfExtraction;
  }>;
  clearEmployerProfile: () => Promise<void>;
}

export const useEmployerStore = create<EmployerState>((set, get) => {
  const applyPayload = async (payload: EmployerStatusPayload) => {
    const nextSnapshot: CachedEmployerSnapshot = {
      profile: payload.empresa,
      subscription: payload.suscripcion,
      hasAccess: Boolean(payload.hasAccess || payload.isAdmin),
      isAdmin: Boolean(payload.isAdmin),
      limits: payload.limits ?? DEFAULT_LIMITS,
    };

    set({
      profile: nextSnapshot.profile,
      subscription: nextSnapshot.subscription,
      hasAccess: nextSnapshot.hasAccess,
      isAdmin: nextSnapshot.isAdmin,
      limits: nextSnapshot.limits,
      sandboxEnabled: Boolean(payload.sandboxEnabled),
      draft: nextSnapshot.profile
        ? profileToDraft(nextSnapshot.profile)
        : get().draft,
    });

    await writeSnapshot(nextSnapshot);
  };

  return {
    profile: null,
    subscription: null,
    hasAccess: false,
    isAdmin: false,
    limits: DEFAULT_LIMITS,
    sandboxEnabled: __DEV__,
    draft: EMPTY_DRAFT,
    hydrated: false,
    syncing: false,

    hydrate: async () => {
      const stored = await readSnapshot();
      set({
        profile: stored?.profile ?? null,
        subscription: stored?.subscription ?? null,
        hasAccess: Boolean(stored?.hasAccess || stored?.isAdmin),
        isAdmin: Boolean(stored?.isAdmin),
        limits: stored?.limits ?? DEFAULT_LIMITS,
        draft: profileToDraft(stored?.profile ?? null),
        hydrated: true,
      });
    },

    syncFromServer: async () => {
      set({ syncing: true });
      try {
        const accessToken = await secureStorage.getAccessToken();
        if (!accessToken) return null;

        const payload = await getEmployerStatusApi();
        await applyPayload(payload);
        return payload;
      } catch {
        return null;
      } finally {
        set({ syncing: false });
      }
    },

    updateDraft: (patch) =>
      set((state) => ({
        draft: { ...state.draft, ...patch },
      })),

    startEditFromProfile: () => {
      const existing = get().profile;
      if (!existing) return;
      set({ draft: profileToDraft(existing) });
    },

    saveProfileToServer: async (options) => {
      const { draft } = get();
      const payload = await upsertEmployerProfileApi({
        companyName: draft.companyName,
        legalName: draft.legalName || undefined,
        rfc: draft.rfc || undefined,
        industry: draft.industry,
        companySize: draft.companySize,
        city: draft.city,
        contactName: draft.contactName,
        contactRole: draft.contactRole,
        workEmail: draft.workEmail,
        phone: draft.phone,
        description: draft.description,
        selectedPlanId: options?.selectedPlanId ?? null,
        billingCycle: options?.billingCycle ?? "monthly",
      });
      await applyPayload(payload);
      return payload;
    },

    syncSubscriptionWithServer: async (input) => {
      const payload = await syncEmployerSubscriptionApi(input);
      await applyPayload(payload);
      return payload;
    },

    activateSandboxTrial: async (planId, billingCycle) => {
      const payload = await activateSandboxTrialApi({ planId, billingCycle });
      await applyPayload(payload);
      return payload;
    },

    uploadVerificationPdf: async (file) => {
      const result = await uploadEmployerVerificationPdfApi(file);
      await applyPayload(result);
      return {
        payload: result,
        extraccion: result.extraccion,
      };
    },

    clearEmployerProfile: async () => {
      set({
        profile: null,
        subscription: null,
        hasAccess: false,
        isAdmin: false,
        limits: DEFAULT_LIMITS,
        draft: EMPTY_DRAFT,
      });
      await writeSnapshot(null);
    },
  };
});
