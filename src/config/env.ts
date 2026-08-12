export const env = {
  apiUrl: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/auth`,
} as const;
