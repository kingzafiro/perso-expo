import { apiClient } from "@/lib/api/client";
import { secureStorage } from "@/lib/storage/secure-storage";

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await secureStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = await secureStorage.getRefreshToken();

      if (!refreshToken) {
        await secureStorage.clearTokens();

        return Promise.reject(error);
      }

      const { data } = await apiClient.post("/renew/token", {
        refreshToken,
      });

      await secureStorage.setAccessToken(data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      await secureStorage.clearTokens();

      return Promise.reject(refreshError);
    }
  },
);
