import { AxiosError } from "axios";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { env } from "@/config/env";
import {
  useAppleLogin,
  useGoogleLogin,
} from "@/features/auth/hooks/use-social-login";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

WebBrowser.maybeCompleteAuthSession();

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </Svg>
  );
}

function isGoogleOAuthConfigured() {
  if (Platform.OS === "ios") {
    return Boolean(env.googleIosClientId);
  }
  if (Platform.OS === "android") {
    return Boolean(env.googleAndroidClientId);
  }
  return Boolean(env.googleWebClientId);
}

interface GoogleButtonProps {
  disabled: boolean;
  isLoading: boolean;
  onPress: () => void;
}

function GoogleButtonView({
  disabled,
  isLoading,
  onPress,
}: GoogleButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled || isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.googleButton,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.inputBorder,
        },
        pressed && styles.pressed,
        (disabled || isLoading) && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <>
          <GoogleLogo />
          <Text style={[styles.googleText, { color: theme.text }]}>
            Continuar con Google
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface ConfiguredGoogleButtonProps {
  disabled: boolean;
  onErrorMessage: (message: string | null) => void;
}

function ConfiguredGoogleButton({
  disabled,
  onErrorMessage,
}: ConfiguredGoogleButtonProps) {
  const googleLoginMutation = useGoogleLogin();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: env.googleIosClientId || undefined,
    androidClientId: env.googleAndroidClientId || undefined,
    webClientId: env.googleWebClientId || undefined,
    selectAccount: true,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken =
        response.authentication?.idToken ?? response.params?.id_token;
      const accessToken =
        response.authentication?.accessToken ?? response.params?.access_token;

      if (!idToken && !accessToken) {
        onErrorMessage("Google no devolvió un token válido.");
        return;
      }

      onErrorMessage(null);
      googleLoginMutation.mutate(
        { idToken, accessToken },
        {
          onError: (error) => {
            const apiError = error as AxiosError<ApiErrorResponse>;
            onErrorMessage(
              apiError?.response?.data?.mensaje ??
                "No fue posible iniciar sesión con Google.",
            );
          },
        },
      );
    } else if (response.type === "error") {
      onErrorMessage("No fue posible completar el inicio con Google.");
    }
  }, [response]);

  const handlePress = async () => {
    onErrorMessage(null);
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await promptAsync();
  };

  return (
    <GoogleButtonView
      disabled={disabled || !request}
      isLoading={googleLoginMutation.isPending}
      onPress={handlePress}
    />
  );
}

interface SocialAuthButtonsProps {
  dividerText?: string;
}

export function SocialAuthButtons({
  dividerText = "o continúa con",
}: SocialAuthButtonsProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const appleLoginMutation = useAppleLogin();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  const googleConfigured = isGoogleOAuthConfigured();

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleApplePress = async () => {
    setSocialError(null);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setSocialError("Apple no devolvió un token de identidad.");
        return;
      }

      appleLoginMutation.mutate(
        {
          identityToken: credential.identityToken,
          fullName: {
            givenName: credential.fullName?.givenName ?? null,
            familyName: credential.fullName?.familyName ?? null,
          },
        },
        {
          onError: (error) => {
            const apiError = error as AxiosError<ApiErrorResponse>;
            setSocialError(
              apiError?.response?.data?.mensaje ??
                "No fue posible iniciar sesión con Apple.",
            );
          },
        },
      );
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      setSocialError("No fue posible completar el inicio con Apple.");
    }
  };

  const handleUnconfiguredGooglePress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    }
    setSocialError(
      "Google OAuth ya está cableado. Agrega tu Client ID en .env para activarlo.",
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.dividerRow}>
        <View
          style={[styles.dividerLine, { backgroundColor: theme.divider }]}
        />
        <Text style={[styles.dividerLabel, { color: theme.textSecondary }]}>
          {dividerText}
        </Text>
        <View
          style={[styles.dividerLine, { backgroundColor: theme.divider }]}
        />
      </View>

      <View style={styles.buttonsColumn}>
        {Platform.OS === "ios" && appleAvailable && (
          <View style={styles.appleContainer}>
            {appleLoginMutation.isPending ? (
              <View
                style={[
                  styles.appleLoadingPlaceholder,
                  { backgroundColor: isDark ? "#FFFFFF" : "#000000" },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#000000" : "#FFFFFF"}
                />
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  isDark
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={28}
                style={styles.appleButton}
                onPress={handleApplePress}
              />
            )}
          </View>
        )}

        {googleConfigured ? (
          <ConfiguredGoogleButton
            disabled={appleLoginMutation.isPending}
            onErrorMessage={setSocialError}
          />
        ) : (
          <GoogleButtonView
            disabled={appleLoginMutation.isPending}
            isLoading={false}
            onPress={handleUnconfiguredGooglePress}
          />
        )}
      </View>

      {socialError && (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {socialError}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 14,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },

  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },

  dividerLabel: {
    fontSize: 13,
    fontWeight: "500",
  },

  buttonsColumn: {
    gap: 12,
  },

  appleContainer: {
    width: "100%",
  },

  appleButton: {
    width: "100%",
    height: 54,
  },

  appleLoadingPlaceholder: {
    width: "100%",
    height: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  googleButton: {
    minHeight: 54,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  googleText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  disabled: {
    opacity: 0.55,
  },

  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
