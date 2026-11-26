import { create } from "zustand";

import type { AuthUser } from "@/features/auth/types/auth.types";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  user: AuthUser | null;
}

interface AuthActions {
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  reset: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  needsOnboarding: false,
  user: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setAuthenticated: (value) => {
    set({ isAuthenticated: value });
  },

  setLoading: (value) => {
    set({ isLoading: value });
  },

  setNeedsOnboarding: (value) => {
    set({ needsOnboarding: value });
  },

  setUser: (user) => {
    set({ user });
  },

  reset: () => {
    set(initialState);
  },
}));
