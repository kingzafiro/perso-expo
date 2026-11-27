import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthUser } from "@/features/auth/types/auth.types";
import { secureStorage } from "@/lib/storage/secure-storage";

const BIOMETRIC_ENABLED_KEY = "perso_biometric_enabled";
const BIOMETRIC_CREDENTIAL_KEY = "perso_biometric_credential";
const BIOMETRIC_PROMPT_DISMISSED_PREFIX = "perso_biometric_dismissed_";

const BIOMETRIC_STORE_OPTIONS: SecureStore.SecureStoreOptions | undefined =
  Platform.OS === "ios"
    ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    : undefined;

export type BiometricKind = "face-id" | "touch-id" | "fingerprint" | "biometrics";

export interface BiometricCredentialPayload {
  refreshToken: string;
  userId: number;
  email: string;
  nombre?: string | null;
  savedAt: string;
}

export interface BiometricAccountSummary {
  userId: number;
  email: string;
  nombre?: string | null;
  savedAt: string;
}

export interface BiometricStatus {
  isSupported: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  kind: BiometricKind;
  label: string;
  isEnabled: boolean;
  hasStoredCredential: boolean;
  canLoginWithBiometrics: boolean;
  savedAccount: BiometricAccountSummary | null;
}

export type BiometricPromptResult =
  | { success: true }
  | {
      success: false;
      cancelled: boolean;
      error: LocalAuthentication.LocalAuthenticationError | "unsupported";
      message: string;
    };

function resolveBiometricMeta(
  types: LocalAuthentication.AuthenticationType[],
): { kind: BiometricKind; label: string } {
  const hasFace = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  );
  const hasFingerprint = types.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT,
  );

  if (Platform.OS === "ios") {
    if (hasFace) {
      return { kind: "face-id", label: "Face ID" };
    }
    if (hasFingerprint) {
      return { kind: "touch-id", label: "Touch ID" };
    }
    return { kind: "face-id", label: "Face ID" };
  }

  if (Platform.OS === "android") {
    if (hasFace && !hasFingerprint) {
      return { kind: "face-id", label: "Reconocimiento facial" };
    }
    if (hasFingerprint) {
      return { kind: "fingerprint", label: "Huella digital" };
    }
  }

  return { kind: "biometrics", label: "Biometría" };
}

function mapBiometricErrorMessage(
  error: LocalAuthentication.LocalAuthenticationError,
  label: string,
): { cancelled: boolean; message: string } {
  switch (error) {
    case "user_cancel":
    case "app_cancel":
    case "system_cancel":
      return { cancelled: true, message: "" };
    case "not_enrolled":
      return {
        cancelled: false,
        message: `No tienes ${label} configurado en este dispositivo. Actívalo en la configuración del sistema.`,
      };
    case "passcode_not_set":
      return {
        cancelled: false,
        message: `Configura un código de desbloqueo en tu dispositivo para usar ${label}.`,
      };
    case "lockout":
      return {
        cancelled: false,
        message: `${label} se bloqueó temporalmente por demasiados intentos. Desbloquea tu dispositivo e inténtalo de nuevo.`,
      };
    case "not_available":
      return {
        cancelled: false,
        message: `${label} no está disponible en este momento.`,
      };
    default:
      return {
        cancelled: false,
        message: `No se pudo verificar tu identidad con ${label}. Inténtalo de nuevo.`,
      };
  }
}

async function readStoredCredential(): Promise<BiometricCredentialPayload | null> {
  if (Platform.OS === "web") return null;

  try {
    const raw = await secureStorage.getItem(
      BIOMETRIC_CREDENTIAL_KEY,
      BIOMETRIC_STORE_OPTIONS,
    );
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BiometricCredentialPayload>;
    if (
      typeof parsed.refreshToken !== "string" ||
      !parsed.refreshToken ||
      typeof parsed.userId !== "number" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }

    return {
      refreshToken: parsed.refreshToken,
      userId: parsed.userId,
      email: parsed.email,
      nombre: parsed.nombre ?? null,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function writeStoredCredential(
  payload: BiometricCredentialPayload,
): Promise<void> {
  await Promise.all([
    secureStorage.setItem(
      BIOMETRIC_CREDENTIAL_KEY,
      JSON.stringify(payload),
      BIOMETRIC_STORE_OPTIONS,
    ),
    secureStorage.setItem(BIOMETRIC_ENABLED_KEY, "1"),
  ]);
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  if (Platform.OS === "web") {
    return {
      isSupported: false,
      hasHardware: false,
      isEnrolled: false,
      kind: "biometrics",
      label: "Biometría",
      isEnabled: false,
      hasStoredCredential: false,
      canLoginWithBiometrics: false,
      savedAccount: null,
    };
  }

  try {
    const [hasHardware, isEnrolled, types, enabledFlag, credential] =
      await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        secureStorage.getItem(BIOMETRIC_ENABLED_KEY),
        readStoredCredential(),
      ]);

    const { kind, label } = resolveBiometricMeta(types);
    const isEnabled = enabledFlag === "1";
    const hasStoredCredential = Boolean(credential?.refreshToken);
    const savedAccount: BiometricAccountSummary | null = credential
      ? {
          userId: credential.userId,
          email: credential.email,
          nombre: credential.nombre ?? null,
          savedAt: credential.savedAt,
        }
      : null;

    return {
      isSupported: hasHardware,
      hasHardware,
      isEnrolled,
      kind,
      label,
      isEnabled: isEnabled && hasStoredCredential,
      hasStoredCredential,
      canLoginWithBiometrics:
        hasHardware && isEnrolled && isEnabled && hasStoredCredential,
      savedAccount,
    };
  } catch {
    return {
      isSupported: false,
      hasHardware: false,
      isEnrolled: false,
      kind: "biometrics",
      label: Platform.OS === "ios" ? "Face ID" : "Biometría",
      isEnabled: false,
      hasStoredCredential: false,
      canLoginWithBiometrics: false,
      savedAccount: null,
    };
  }
}

export async function authenticateWithBiometrics(options?: {
  promptMessage?: string;
  label?: string;
}): Promise<BiometricPromptResult> {
  if (Platform.OS === "web") {
    return {
      success: false,
      cancelled: false,
      error: "unsupported",
      message: "La autenticación biométrica solo está disponible en la app móvil.",
    };
  }

  const label =
    options?.label ?? (Platform.OS === "ios" ? "Face ID" : "Biometría");

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: options?.promptMessage ?? `Inicia sesión con ${label}`,
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar código",
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { success: true };
  }

  const mapped = mapBiometricErrorMessage(result.error, label);
  return {
    success: false,
    cancelled: mapped.cancelled,
    error: result.error,
    message: mapped.message,
  };
}

export async function enableBiometricLogin(params: {
  refreshToken: string;
  user: AuthUser;
  requirePrompt?: boolean;
}): Promise<{ ok: true; label: string } | { ok: false; cancelled?: boolean; notEnrolled?: boolean; message: string }> {
  const status = await getBiometricStatus();

  if (!status.hasHardware) {
    return {
      ok: false,
      message: "Este dispositivo no cuenta con hardware biométrico compatible.",
    };
  }

  if (!status.isEnrolled) {
    return {
      ok: false,
      notEnrolled: true,
      message: `Configura ${status.label} en los ajustes de tu dispositivo para activar esta opción.`,
    };
  }

  if (params.requirePrompt !== false) {
    const auth = await authenticateWithBiometrics({
      label: status.label,
      promptMessage: `Confirma tu identidad para activar ${status.label}`,
    });

    if (!auth.success) {
      return {
        ok: false,
        cancelled: auth.cancelled,
        message: auth.message,
      };
    }
  }

  await writeStoredCredential({
    refreshToken: params.refreshToken,
    userId: params.user.id_usuario,
    email: params.user.email,
    nombre: params.user.nombre ?? null,
    savedAt: new Date().toISOString(),
  });

  return { ok: true, label: status.label };
}

export async function disableBiometricLogin(): Promise<void> {
  if (Platform.OS === "web") return;

  await Promise.all([
    secureStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY, BIOMETRIC_STORE_OPTIONS),
    secureStorage.removeItem(BIOMETRIC_ENABLED_KEY),
  ]);
}

export async function syncBiometricCredentialIfEnabled(
  refreshToken: string,
  user?: AuthUser | null,
): Promise<void> {
  if (Platform.OS === "web" || !user) return;

  try {
    const enabled = await secureStorage.getItem(BIOMETRIC_ENABLED_KEY);
    if (enabled !== "1") return;

    const existing = await readStoredCredential();
    if (!existing) {
      await disableBiometricLogin();
      return;
    }

    // Si inició sesión un usuario diferente en este dispositivo, limpiamos
    // las credenciales biométricas del usuario anterior por seguridad.
    if (existing.userId !== user.id_usuario) {
      await disableBiometricLogin();
      return;
    }

    await writeStoredCredential({
      refreshToken,
      userId: user.id_usuario,
      email: user.email,
      nombre: user.nombre ?? existing.nombre ?? null,
      savedAt: new Date().toISOString(),
    });
  } catch {
    // No bloquear el flujo principal de sesión
  }
}

export async function unlockBiometricCredential(): Promise<
  | { ok: true; credential: BiometricCredentialPayload; label: string }
  | { ok: false; cancelled?: boolean; missing?: boolean; message: string }
> {
  const status = await getBiometricStatus();

  if (!status.hasHardware) {
    return {
      ok: false,
      message: "Este dispositivo no admite autenticación biométrica.",
    };
  }

  if (!status.isEnrolled) {
    return {
      ok: false,
      message: `Configura ${status.label} en los ajustes de tu dispositivo para iniciar sesión.`,
    };
  }

  const credential = await readStoredCredential();
  if (!status.isEnabled || !credential) {
    await disableBiometricLogin();
    return {
      ok: false,
      missing: true,
      message: `Activa ${status.label} iniciando sesión primero con tu correo o proveedor.`,
    };
  }

  const auth = await authenticateWithBiometrics({
    label: status.label,
    promptMessage: `Inicia sesión en Perso con ${status.label}`,
  });

  if (!auth.success) {
    return {
      ok: false,
      cancelled: auth.cancelled,
      message: auth.message,
    };
  }

  return { ok: true, credential, label: status.label };
}

export async function hasDismissedBiometricPrompt(
  userId?: number,
): Promise<boolean> {
  if (!userId || Platform.OS === "web") return true;
  try {
    const val = await secureStorage.getItem(
      `${BIOMETRIC_PROMPT_DISMISSED_PREFIX}${userId}`,
    );
    return val === "1";
  } catch {
    return false;
  }
}

export async function markBiometricPromptDismissed(
  userId?: number,
): Promise<void> {
  if (!userId || Platform.OS === "web") return;
  try {
    await secureStorage.setItem(
      `${BIOMETRIC_PROMPT_DISMISSED_PREFIX}${userId}`,
      "1",
    );
  } catch {
    // Ignorar fallo de persistencia
  }
}
