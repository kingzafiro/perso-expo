export const env = {
  apiUrl: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/auth`,
  mapsApiUrl: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/maps`,
  employerApiUrl: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/employer`,
  vacanciesApiUrl: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/vacantes`,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "",
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "",
} as const;
