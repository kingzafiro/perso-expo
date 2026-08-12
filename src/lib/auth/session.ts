import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

export async function restoreSession() {
  const { setAuthenticated, setLoading } = useAuthStore.getState();

  try {
    const accessToken = await secureStorage.getAccessToken();

    setAuthenticated(Boolean(accessToken));
  } catch {
    setAuthenticated(false);
  } finally {
    setLoading(false);
  }
}
