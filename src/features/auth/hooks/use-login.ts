import { useMutation } from "@tanstack/react-query";

import { login } from "@/features/auth/api/login";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

export function useLogin() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  return useMutation({
    mutationFn: login,

    onSuccess: async (data) => {
      await secureStorage.setAccessToken(data.token);

      setAuthenticated(true);
    },
  });
}
