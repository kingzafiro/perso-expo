import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

import type {
  BillingCycle,
  EmployerPlanId,
  EmployerProfile,
} from "@/features/employer/types/employer.types";

const EMPLOYER_STORAGE_KEY = "perso_employer_profile_v1";

async function readStoredProfile(): Promise<EmployerProfile | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? typeof window !== "undefined"
          ? window.localStorage.getItem(EMPLOYER_STORAGE_KEY)
          : null
        : await SecureStore.getItemAsync(EMPLOYER_STORAGE_KEY);

    if (!raw) return null;
    return JSON.parse(raw) as EmployerProfile;
  } catch {
    return null;
  }
}

async function writeStoredProfile(profile: EmployerProfile | null) {
  try {
    if (!profile) {
      if (Platform.OS === "web") {
        window.localStorage.removeItem(EMPLOYER_STORAGE_KEY);
      } else {
        await SecureStore.deleteItemAsync(EMPLOYER_STORAGE_KEY);
      }
      return;
    }

    const serialized = JSON.stringify(profile);
    if (Platform.OS === "web") {
      window.localStorage.setItem(EMPLOYER_STORAGE_KEY, serialized);
    } else {
      await SecureStore.setItemAsync(EMPLOYER_STORAGE_KEY, serialized);
    }
  } catch {
    // Silencioso en caso de restricción de almacenamiento
  }
}

interface EmployerDraft {
  companyName: string;
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
  industry: "",
  companySize: "",
  city: "",
  contactName: "",
  contactRole: "",
  workEmail: "",
  phone: "",
  description: "",
};

interface EmployerState {
  profile: EmployerProfile | null;
  draft: EmployerDraft;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateDraft: (patch: Partial<EmployerDraft>) => void;
  startEditFromProfile: () => void;
  finalizeRegistration: (
    planId: EmployerPlanId | null,
    billingCycle: BillingCycle,
  ) => Promise<void>;
  clearEmployerProfile: () => Promise<void>;
}

export const useEmployerStore = create<EmployerState>((set, get) => ({
  profile: null,
  draft: EMPTY_DRAFT,
  hydrated: false,

  hydrate: async () => {
    const stored = await readStoredProfile();
    set({
      profile: stored,
      draft: stored
        ? {
            companyName: stored.companyName,
            industry: stored.industry,
            companySize: stored.companySize,
            city: stored.city,
            contactName: stored.contactName,
            contactRole: stored.contactRole,
            workEmail: stored.workEmail,
            phone: stored.phone,
            description: stored.description,
          }
        : EMPTY_DRAFT,
      hydrated: true,
    });
  },

  updateDraft: (patch) =>
    set((state) => ({
      draft: { ...state.draft, ...patch },
    })),

  startEditFromProfile: () => {
    const existing = get().profile;
    if (!existing) return;
    set({
      draft: {
        companyName: existing.companyName,
        industry: existing.industry,
        companySize: existing.companySize,
        city: existing.city,
        contactName: existing.contactName,
        contactRole: existing.contactRole,
        workEmail: existing.workEmail,
        phone: existing.phone,
        description: existing.description,
      },
    });
  },

  finalizeRegistration: async (planId, billingCycle) => {
    const { draft } = get();
    const nextProfile: EmployerProfile = {
      ...draft,
      selectedPlanId: planId,
      billingCycle,
      status: planId ? "pending_payment" : "draft",
      updatedAt: new Date().toISOString(),
    };
    set({ profile: nextProfile });
    await writeStoredProfile(nextProfile);
  },

  clearEmployerProfile: async () => {
    set({ profile: null, draft: EMPTY_DRAFT });
    await writeStoredProfile(null);
  },
}));
