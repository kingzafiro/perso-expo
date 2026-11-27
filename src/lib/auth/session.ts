import type { AuthUser } from "@/features/auth/types/auth.types";
import { unregisterCurrentDevicePushToken } from "@/features/notifications/lib/notifications-client";
import { apiClient } from "@/lib/api/client";
import { syncBiometricCredentialIfEnabled } from "@/lib/auth/biometrics";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";

interface RefreshTokenResponse {
  ok: boolean;
  accessToken: string;
  usuario?: AuthUser;
}

function getOnboardingKey(userId?: number) {
  return userId ? `perso_onboarding_done_${userId}` : "perso_onboarding_done";
}

async function resolveNeedsOnboarding(user?: AuthUser | null): Promise<boolean> {
  if (!user) return true;

  const hasName = Boolean(user.nombre && user.nombre.trim().length > 0);
  if (!hasName) {
    return true;
  }

  try {
    const done = await secureStorage.getItem(getOnboardingKey(user.id_usuario));
    return done !== "1";
  } catch {
    return false;
  }
}

export async function completeOnboarding() {
  const { user, setNeedsOnboarding } = useAuthStore.getState();

  try {
    await secureStorage.setItem(getOnboardingKey(user?.id_usuario), "1");
  } catch {
    // No bloquear acceso a la app
  }

  setNeedsOnboarding(false);
}

export async function saveSessionTokens(
  accessToken: string,
  refreshToken: string,
  user?: AuthUser | null,
) {
  await Promise.all([
    secureStorage.setAccessToken(accessToken),
    secureStorage.setRefreshToken(refreshToken),
  ]);

  const store = useAuthStore.getState();
  const resolvedUser = user !== undefined ? user : store.user;

  if (user !== undefined) {
    store.setUser(user);
  }

  await syncBiometricCredentialIfEnabled(refreshToken, resolvedUser);

  const needsOnboarding = await resolveNeedsOnboarding(resolvedUser);
  store.setNeedsOnboarding(needsOnboarding);
  store.setAuthenticated(true);
}

export async function clearSession() {
  await unregisterCurrentDevicePushToken();
  await Promise.all([
    secureStorage.clearTokens(),
    useEmployerStore.getState().clearEmployerProfile(),
  ]);
  const store = useAuthStore.getState();
  store.setUser(null);
  store.setNeedsOnboarding(false);
  store.setAuthenticated(false);
}

export async function restoreSession() {
  const { setAuthenticated, setLoading, setNeedsOnboarding, setUser } =
    useAuthStore.getState();

  try {
    const refreshToken = await secureStorage.getRefreshToken();

    if (!refreshToken) {
      setUser(null);
      setNeedsOnboarding(false);
      setAuthenticated(false);
      return;
    }

    const { data } = await apiClient.post<RefreshTokenResponse>(
      "/renew/token",
      {
        refreshToken,
      },
    );

    if (!data?.accessToken) {
      await clearSession();
      return;
    }

    await secureStorage.setAccessToken(data.accessToken);
    if (data.usuario) {
      setUser(data.usuario);
    }

    const needsOnboarding = await resolveNeedsOnboarding(data.usuario ?? null);
    setNeedsOnboarding(needsOnboarding);
    setAuthenticated(true);
  } catch {
    await clearSession();
  } finally {
    setLoading(false);
  }
}
