import { router } from "expo-router";
import { Building2, Shield } from "lucide-react-native";

import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { useEmployerStore } from "@/stores/employer.store";

import { getEmployerPlanById } from "../types/employer.types";

export function EmployerSettingsGroup() {
  const profile = useEmployerStore((state) => state.profile);
  const subscription = useEmployerStore((state) => state.subscription);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const startEditFromProfile = useEmployerStore(
    (state) => state.startEditFromProfile,
  );

  const plan = getEmployerPlanById(subscription?.planId);
  const isTrial = subscription?.status === "trialing";

  const subtitle = isAdmin
    ? "Acceso total · Publicar vacantes y gestionar"
    : hasAccess
      ? `${profile?.companyName ?? "Mi empresa"} · Abrir panel`
      : profile
        ? `${profile.companyName} · Completar suscripción`
        : "Publica vacantes y gestiona candidatos";

  const value = isAdmin
    ? "Admin"
    : hasAccess
      ? isTrial
        ? `Prueba · ${subscription?.daysRemaining ?? 14}d`
        : plan?.name ?? "Activa"
      : profile
        ? "Pendiente"
        : undefined;

  const handlePress = () => {
    if (isAdmin || hasAccess) {
      router.push("/(employer)/panel");
      return;
    }

    if (profile) {
      startEditFromProfile();
      router.push("/(employer)/planes");
      return;
    }

    router.push("/(employer)");
  };

  return (
    <SettingsGroup title={isAdmin ? "Administración y empresas" : "Para empresas"}>
      <SettingsRow
        title="Perso Empresas"
        subtitle={subtitle}
        value={value}
        icon={
          isAdmin ? (
            <Shield size={18} color="#FFFFFF" />
          ) : (
            <Building2 size={18} color="#FFFFFF" />
          )
        }
        iconBgColor={isAdmin ? "#F06808" : hasAccess ? "#34C759" : "#2C2724"}
        onPress={handlePress}
      />
    </SettingsGroup>
  );
}
