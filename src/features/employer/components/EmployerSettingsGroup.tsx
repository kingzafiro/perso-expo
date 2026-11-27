import { router } from "expo-router";
import { Building2 } from "lucide-react-native";

import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { useEmployerStore } from "@/stores/employer.store";

/**
 * En la pestaña "Tú" solo aparece Perso Empresas cuando el usuario aún NO tiene
 * acceso/plan activo (para adquirir el plan o completar su suscripción).
 * En cuanto tiene el plan habilitado (o es admin), se activa la pestaña propia "Empresas".
 */
export function EmployerSettingsGroup() {
  const profile = useEmployerStore((state) => state.profile);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const startEditFromProfile = useEmployerStore(
    (state) => state.startEditFromProfile,
  );

  if (isAdmin || hasAccess) {
    return null;
  }

  const subtitle = profile
    ? `${profile.companyName} · Elige un plan para activar`
    : "Publica vacantes y gestiona candidatos";

  const value = profile ? "Activar plan" : "Ver planes";

  const handlePress = () => {
    if (profile) {
      startEditFromProfile();
      router.push("/(employer)/planes");
      return;
    }

    router.push("/(employer)");
  };

  return (
    <SettingsGroup title="Para empresas">
      <SettingsRow
        title="Perso Empresas"
        subtitle={subtitle}
        value={value}
        icon={<Building2 size={18} color="#FFFFFF" />}
        iconBgColor="#2C2724"
        onPress={handlePress}
      />
    </SettingsGroup>
  );
}
