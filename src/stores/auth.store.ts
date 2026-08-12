import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  reset: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setAuthenticated: (value) => {
    set({ isAuthenticated: value });
  },

  setLoading: (value) => {
    set({ isLoading: value });
  },

  reset: () => {
    set(initialState);
  },
}));
