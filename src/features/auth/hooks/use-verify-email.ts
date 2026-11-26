import { useMutation } from "@tanstack/react-query";

import { verifyEmail } from "@/features/auth/api/verify-email";
import { saveSessionTokens } from "@/lib/auth/session";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: verifyEmail,

    onSuccess: async (data) => {
      await saveSessionTokens(
        data.accessToken,
        data.refreshToken,
        data.usuario,
      );
    },
  });
}
