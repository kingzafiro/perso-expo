import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  ChevronRight,
  CreditCard,
  FileCheck2,
  QrCode,
  ScanLine,
  Shield,
  Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useBilling } from "@/features/billing/hooks/use-billing";
import { CompanyLogo } from "@/features/employer/components/CompanyLogo";
import { EmployerInterviewsModal } from "@/features/employer/components/EmployerInterviewsModal";
import { useEmployerVacancies } from "@/features/employer/hooks/use-employer-vacancies";
import { useEmployerInterviews } from "@/features/employer/hooks/use-interviews";
import { getEmployerPlanById } from "@/features/employer/types/employer.types";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

export default function EmpresasHubScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const profile = useEmployerStore((state) => state.profile);
  const subscription = useEmployerStore((state) => state.subscription);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);
  const startEditFromProfile = useEmployerStore(
    (state) => state.startEditFromProfile,
  );

  const canEnter = isAdmin || hasAccess;
  const { openManageSubscriptions } = useBilling();

  const { data: vacancies = [], refetch: refetchVacancies } =
    useEmployerVacancies(canEnter);
  const { data: interviews = [], refetch: refetchInterviews } =
    useEmployerInterviews(canEnter);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  const groupedBg = isDark ? "#000000" : "#F5F2EF";
  const plan = getEmployerPlanById(subscription?.planId);
  const isTrial = subscription?.status === "trialing";

  const totalApplicants = vacancies.reduce(
    (sum, v) => sum + (v.postulantes_count ?? 0),
    0,
  );
  const pendingInterviewsCount = interviews.filter(
    (item) => item.estado === "pendiente",
  ).length;

  const planValue = isAdmin
    ? "Admin"
    : isTrial
      ? `Prueba · ${subscription?.daysRemaining ?? 14}d`
      : plan?.name ?? "Activa";

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await Promise.all([
        syncFromServer(),
        refetchVacancies(),
        refetchInterviews(),
      ]);
    } finally {
      setManualRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: groupedBg }]}>
      <SettingsHeader title="Empresas" showBack={false} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={() => void handleManualRefresh()}
            tintColor={theme.primary}
          />
        }
      >
        {/* 1. Hasta arriba: Tu empresa (igual que la tarjeta de perfil en Tú) */}
        <SettingsGroup>
          <Pressable
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              startEditFromProfile();
              router.push("/(employer)");
            }}
            style={({ pressed }) => [
              styles.companyRow,
              pressed && {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(23, 18, 14, 0.04)",
              },
            ]}
          >
            <CompanyLogo uri={profile?.logoUrl} size={50} borderRadius={16} />

            <View style={styles.companyTextGroup}>
              <View style={styles.companyNameRow}>
                <Text
                  numberOfLines={1}
                  style={[styles.companyName, { color: theme.text }]}
                >
                  {profile?.companyName ?? "Tu empresa"}
                </Text>
                {profile?.verified ? (
                  <BadgeCheck size={16} color="#34C759" />
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.companyHint, { color: theme.textSecondary }]}
              >
                {profile?.industry
                  ? `${profile.industry}${profile.city ? ` · ${profile.city}` : ""}`
                  : "Ver y editar datos de tu empresa"}
              </Text>
            </View>

            <ChevronRight size={19} color={theme.textMuted} />
          </Pressable>
        </SettingsGroup>

        {/* 2. Gestión principal: Tus candidatos, Tus publicaciones, Registrar QR, Tus entrevistas */}
        <SettingsGroup title="Reclutamiento">
          <SettingsRow
            title="Tus candidatos"
            subtitle="Perfiles, CVs y solicitudes de documentos"
            value={
              totalApplicants > 0
                ? `${totalApplicants}`
                : undefined
            }
            icon={<Users size={18} color="#FFFFFF" />}
            iconBgColor="#0A84FF"
            showDivider
            onPress={() => router.push("/(app)/empresas/candidatos")}
          />

          <SettingsRow
            title="Tus publicaciones"
            subtitle="Crear, editar, pausar y ver tus vacantes"
            value={
              vacancies.length > 0 ? `${vacancies.length}` : undefined
            }
            icon={<Briefcase size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            showDivider
            onPress={() => router.push("/(app)/empresas/publicaciones")}
          />

          <SettingsRow
            title="Registrar QR"
            subtitle="Escanea el pase del candidato y consulta el registro"
            icon={<ScanLine size={18} color="#FFFFFF" />}
            iconBgColor="#34C759"
            showDivider
            onPress={() => setQrModalOpen(true)}
          />

          <SettingsRow
            title="Tus entrevistas"
            subtitle="Registro de entrevistas, accesos aprobados y pendientes"
            value={
              pendingInterviewsCount > 0
                ? `${pendingInterviewsCount} pendiente${pendingInterviewsCount === 1 ? "" : "s"}`
                : interviews.length > 0
                  ? `${interviews.length}`
                  : undefined
            }
            icon={<QrCode size={18} color="#FFFFFF" />}
            iconBgColor="#AF52DE"
            onPress={() => router.push("/(app)/empresas/entrevistas")}
          />
        </SettingsGroup>

        {/* 3. Configuración empresarial y suscripción */}
        <SettingsGroup title="Cuenta empresarial">
          <SettingsRow
            title="Verificación de empresa"
            subtitle={
              profile?.verified
                ? profile.rfc
                  ? `RFC ${profile.rfc} verificado`
                  : "Empresa verificada en Perso"
                : "Sube tu Constancia de Situación Fiscal (PDF)"
            }
            value={profile?.verified ? "Verificada" : "Pendiente"}
            icon={<FileCheck2 size={18} color="#FFFFFF" />}
            iconBgColor={profile?.verified ? "#34C759" : "#FF9500"}
            showDivider
            onPress={() => router.push("/(employer)/verificacion")}
          />

          <SettingsRow
            title="Plan y suscripción"
            subtitle={
              isAdmin
                ? "Acceso de administrador sin límites"
                : "Cambiar de plan o gestionar renovación"
            }
            value={planValue}
            icon={<CreditCard size={18} color="#FFFFFF" />}
            iconBgColor="#636366"
            onPress={() => {
              if (isAdmin) {
                router.push("/(employer)/planes");
              } else {
                router.push("/(employer)/planes");
              }
            }}
          />
        </SettingsGroup>

        {!isAdmin && subscription ? (
          <SettingsGroup>
            <SettingsRow
              title="Gestionar suscripción en tienda"
              subtitle="Facturación, renovación o cancelación"
              icon={<Building2 size={18} color="#FFFFFF" />}
              iconBgColor="#2C2724"
              onPress={() => void openManageSubscriptions()}
            />
          </SettingsGroup>
        ) : null}
      </ScrollView>

      <EmployerInterviewsModal
        visible={qrModalOpen}
        initialTab="scan"
        onClose={() => setQrModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 22,
  },

  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },

  companyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  companyTextGroup: {
    flex: 1,
    gap: 2,
  },

  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  companyName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
    flexShrink: 1,
  },

  companyHint: {
    fontSize: 13.5,
  },
});
