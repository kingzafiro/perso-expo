import { useMutation } from "@tanstack/react-query";

import {
  loginWithApple,
  loginWithGoogle,
} from "@/features/auth/api/social-login";
import { saveSessionTokens } from "@/lib/auth/session";

export function useGoogleLogin() {
  return useMutation({
    mutationFn: loginWithGoogle,

    onSuccess: async (data) => {
      await saveSessionTokens(
        data.accessToken,
        data.refreshToken,
        data.usuario,
      );
    },
  });
}

export function useAppleLogin() {
  return useMutation({
    mutationFn: loginWithApple,

    onSuccess: async (data) => {
      await saveSessionTokens(
        data.accessToken,
        data.refreshToken,
        data.usuario,
      );
    },
  });
}
