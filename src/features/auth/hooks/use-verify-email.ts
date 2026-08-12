import { useMutation } from "@tanstack/react-query";

import { verifyEmail } from "@/features/auth/api/verify-email";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

export function useVerifyEmail() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  return useMutation({
    mutationFn: verifyEmail,

    onSuccess: async (data) => {
      await Promise.all([
        secureStorage.setAccessToken(data.accessToken),
        secureStorage.setRefreshToken(data.refreshToken),
      ]);

      setAuthenticated(true);
    },
  });
}
