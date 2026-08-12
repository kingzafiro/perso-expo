import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "perso_access_token";
const REFRESH_TOKEN_KEY = "perso_refresh_token";

async function getItem(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  getAccessToken() {
    return getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string) {
    return setItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken() {
    return removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string) {
    return setItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken() {
    return removeItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens() {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
