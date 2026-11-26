import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

import { apiClient } from "@/lib/api/client";
import { secureStorage } from "@/lib/storage/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

const PUBLIC_AUTH_PATHS = [
  "/login",
  "/registro",
  "/google",
  "/apple",
  "/renew/token",
  "/verificar-email",
  "/reenviar-codigo",
  "/forgot-password",
  "/verificar-recuperacion",
  "/reset-password",
];

function isPublicAuthPath(url?: string) {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function setBearerHeader(
  config: InternalAxiosRequestConfig,
  accessToken: string,
) {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  if (config.headers instanceof AxiosHeaders) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${accessToken}`;
  }
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await secureStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const { data } = await apiClient.post<{
        ok: boolean;
        accessToken: string;
      }>("/renew/token", {
        refreshToken,
      });

      if (!data?.accessToken) {
        throw new Error("Invalid refresh token response");
      }

      await secureStorage.setAccessToken(data.accessToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  if (isPublicAuthPath(config.url)) {
    return config;
  }

  const accessToken = await secureStorage.getAccessToken();

  if (accessToken) {
    setBearerHeader(config, accessToken);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isPublicAuthPath(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      setBearerHeader(originalRequest, newAccessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      await secureStorage.clearTokens();
      useAuthStore.getState().setAuthenticated(false);

      return Promise.reject(refreshError);
    }
  },
);
