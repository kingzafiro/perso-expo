import "@/lib/api/interceptors";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { usePushNotifications } from "@/features/notifications/hooks/use-push-notifications";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { restoreSession } from "@/lib/auth/session";
import { queryClient } from "@/lib/query/client";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";
import { usePreferencesStore } from "@/stores/preferences.store";

import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const hydrateEmployer = useEmployerStore((state) => state.hydrate);

  useEffect(() => {
    hydratePreferences();
    hydrateEmployer();
    restoreSession();
  }, [hydratePreferences, hydrateEmployer]);

  usePushNotifications(isAuthenticated && !needsOnboarding);

  if (isLoading) {
    return <AnimatedSplashOverlay />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          <Stack.Protected guard={isAuthenticated && needsOnboarding}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>

          <Stack.Protected guard={isAuthenticated && !needsOnboarding}>
            <Stack.Screen name="(app)" />
            <Stack.Screen
              name="(employer)"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
