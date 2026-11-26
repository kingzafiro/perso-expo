import { useMutation } from "@tanstack/react-query";

import { login } from "@/features/auth/api/login";
import { saveSessionTokens } from "@/lib/auth/session";

export function useLogin() {
  return useMutation({
    mutationFn: login,

    onSuccess: async (data) => {
      await saveSessionTokens(
        data.accessToken,
        data.refreshToken,
        data.usuario,
      );
    },
  });
}
