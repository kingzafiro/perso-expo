import { apiClient } from "@/lib/api/client";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

interface RefreshTokenResponse {
  ok: boolean;
  accessToken: string;
}

export async function restoreSession() {
  const { setAuthenticated, setLoading } = useAuthStore.getState();

  try {
    const refreshToken = await secureStorage.getRefreshToken();

    if (!refreshToken) {
      setAuthenticated(false);
      return;
    }

    const { data } = await apiClient.post("/renew/token", {
      refreshToken,
    });

    await secureStorage.setAccessToken(data.accessToken);

    setAuthenticated(true);
  } catch (error: any) {
    await secureStorage.clearTokens();
    setAuthenticated(false);
  } finally {
    setLoading(false);
  }
}
