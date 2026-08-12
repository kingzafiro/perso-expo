import { apiClient } from "@/lib/api/client";
import { secureStorage } from "@/lib/storage/secure-storage";

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await secureStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
