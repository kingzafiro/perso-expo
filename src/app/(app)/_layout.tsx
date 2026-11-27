import { NativeTabs } from "expo-router/native-tabs";
import { useEffect } from "react";
import { DynamicColorIOS, Platform } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";
import { brandPalette } from "@/theme";

const iosTintColor =
  Platform.OS === "ios"
    ? DynamicColorIOS({
        light: brandPalette[500],
        dark: brandPalette[400],
      })
    : undefined;

export default function AppLayout() {
  const theme = useTheme();
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);

  const hasEmployerTab = isAdmin || hasAccess;

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  return (
    <NativeTabs
      tintColor={Platform.OS === "ios" ? iosTintColor : theme.primary}
      blurEffect={Platform.OS === "ios" ? "systemChromeMaterial" : undefined}
      backgroundColor={Platform.OS === "ios" ? undefined : theme.background}
      indicatorColor={
        Platform.OS === "ios" ? undefined : theme.primarySoft
      }
      iconColor={
        Platform.OS === "ios"
          ? undefined
          : {
              default: theme.textSecondary,
              selected: theme.primary,
            }
      }
      labelStyle={
        Platform.OS === "ios"
          ? undefined
          : {
              default: { color: theme.textSecondary },
              selected: { color: theme.primary },
            }
      }
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="empleos">
        <NativeTabs.Trigger.Label>Empleos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "briefcase", selected: "briefcase.fill" }}
          md="work"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="empresas" hidden={!hasEmployerTab}>
        <NativeTabs.Trigger.Label>Empresas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "building.2", selected: "building.2.fill" }}
          md="business"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tu">
        <NativeTabs.Trigger.Label>Tú</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.circle", selected: "person.circle.fill" }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
