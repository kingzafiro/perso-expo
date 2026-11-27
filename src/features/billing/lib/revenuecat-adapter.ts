import type { RevenueCatSdk } from "../types/billing.types";

/**
 * Adaptador desacoplado del SDK nativo de RevenueCat (`react-native-purchases`).
 *
 * Mientras el proyecto se ejecuta en Expo Go (sin compilar el Development Build
 * ni instalar `react-native-purchases`), devuelve `null` de forma segura para
 * que Metro no falle al resolver módulos nativos ausentes.
 *
 * Cuando actives tu cuenta de Apple Developer / Google Play e instales
 * `npx expo install react-native-purchases`, registra el SDK al iniciar la app:
 *
 *   import Purchases from "react-native-purchases";
 *   import { registerRevenueCatSdk } from "@/features/billing/lib/revenuecat-adapter";
 *   registerRevenueCatSdk(Purchases);
 */
let registeredSdk: RevenueCatSdk | null = null;

export function registerRevenueCatSdk(sdk: RevenueCatSdk | null) {
  registeredSdk = sdk;
}

export function getRevenueCatSdk(): RevenueCatSdk | null {
  return registeredSdk;
}
