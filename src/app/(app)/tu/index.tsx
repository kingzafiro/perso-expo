import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Bell,
  Bookmark,
  ChevronRight,
  FileCheck2,
  FileText,
  LogOut,
  Palette,
  Phone,
  QrCode,
  ShieldCheck,
  UserCog,
} from "lucide-react-native";
import { useEffect } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EmployerSettingsGroup } from "@/features/employer/components/EmployerSettingsGroup";
import { useMyInterviews } from "@/features/employer/hooks/use-interviews";
import {
  useFavoriteVacancies,
  useMyDocumentRequests,
} from "@/features/jobs/hooks/use-jobs";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useFullProfile } from "@/features/profile/hooks/use-full-profile";
import { SettingsGroup, SettingsRow } from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { clearSession } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";
import { usePreferencesStore } from "@/stores/preferences.store";

function getDisplayName(
  nombre?: string | null,
  apellidoPaterno?: string | null,
  email?: string,
) {
  const full = [nombre, apellidoPaterno].filter(Boolean).join(" ").trim();
  if (full) return full;

  if (email) {
    const prefix = email.split("@")[0];
    if (prefix) {
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }

  return "Tu perfil";
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function TuScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { data: fullProfile } = useFullProfile();
  const colorSchemePref = usePreferencesStore((state) => state.colorScheme);
  const syncEmployerFromServer = useEmployerStore(
    (state) => state.syncFromServer,
  );
  const { data: docRequests = [] } = useMyDocumentRequests();
  const { data: favoriteVacancies = [] } = useFavoriteVacancies();
  const { data: myInterviews = [] } = useMyInterviews();
  const pendingDocRequestsCount = docRequests.filter(
    (r) => r.estado === "pendiente",
  ).length;
  const activeInterviewsCount = myInterviews.filter(
    (i) => i.estado === "pendiente",
  ).length;

  useEffect(() => {
    void syncEmployerFromServer();
  }, [syncEmployerFromServer]);

  const profileUser = fullProfile?.usuario ?? user;
  const phoneValue = (profileUser?.celular ?? "").trim();
  const isPhoneVerified =
    phoneValue.replace(/\D/g, "").length >= 10 &&
    Boolean(profileUser?.celular_verificado);

  const displayName = getDisplayName(
    profileUser?.nombre,
    profileUser?.apellido_paterno,
    profileUser?.email,
  );
  const initials = getInitials(displayName);

  const groupedBg = isDark ? "#000000" : "#F5F2EF";
  const appearanceLabel =
    colorSchemePref === "system"
      ? "Sistema"
      : colorSchemePref === "dark"
        ? "Oscuro"
        : "Claro";

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (Platform.OS === "web") {
      await clearSession();
      return;
    }

    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres salir de tu cuenta en Perso?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            clearSession();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: groupedBg }]}>
      <SettingsHeader title="Tú" showBack={false} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de perfil (tocar entra directo a ver y editar perfil) */}
        <SettingsGroup>
          <Pressable
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push("/(app)/tu/perfil");
            }}
            style={({ pressed }) => [
              styles.profileRow,
              pressed && {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(23, 18, 14, 0.04)",
              },
            ]}
          >
            <ProfileAvatar
              uri={user?.foto_perfil}
              initials={initials}
              size={50}
            />

            <View style={styles.profileTextGroup}>
              <Text
                numberOfLines={1}
                style={[styles.profileName, { color: theme.text }]}
              >
                {displayName}
              </Text>
              <Text
                style={[styles.profileHint, { color: theme.textSecondary }]}
              >
                Ver perfil
              </Text>
            </View>

            <ChevronRight size={19} color={theme.textMuted} />
          </Pressable>
        </SettingsGroup>

        {/* Expediente y configuración de la cuenta */}
        <SettingsGroup>
          <SettingsRow
            title="Mis documentos"
            subtitle="CV, INE, comprobantes y certificados"
            icon={<FileText size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            showDivider
            onPress={() => router.push("/(app)/tu/documentos")}
          />

          <SettingsRow
            title="Mis favoritos"
            subtitle="Empleos guardados para postularte después"
            value={
              favoriteVacancies.length > 0
                ? `${favoriteVacancies.length}`
                : undefined
            }
            icon={<Bookmark size={18} color="#FFFFFF" />}
            iconBgColor="#FF9500"
            showDivider
            onPress={() => router.push("/(app)/tu/favoritos")}
          />

          <SettingsRow
            title="Mis entrevistas"
            subtitle="Ubicación de oficinas y pases QR de acceso"
            value={
              activeInterviewsCount > 0
                ? `${activeInterviewsCount} activa${activeInterviewsCount === 1 ? "" : "s"}`
                : undefined
            }
            icon={<QrCode size={18} color="#FFFFFF" />}
            iconBgColor="#AF52DE"
            showDivider
            onPress={() => router.push("/(app)/tu/entrevistas")}
          />

          <SettingsRow
            title="Solicitudes de documentos"
            subtitle="Permisos de acceso para empresas"
            value={
              pendingDocRequestsCount > 0
                ? `${pendingDocRequestsCount} pendiente${pendingDocRequestsCount === 1 ? "" : "s"}`
                : undefined
            }
            icon={<FileCheck2 size={18} color="#FFFFFF" />}
            iconBgColor="#0A84FF"
            showDivider
            onPress={() => router.push("/(app)/tu/solicitudes")}
          />

          <SettingsRow
            title="Número de teléfono"
            subtitle={
              isPhoneVerified
                ? phoneValue
                : "Verifica tu número por SMS para postularte"
            }
            value={isPhoneVerified ? "Verificado" : "Sin verificar"}
            icon={<Phone size={18} color="#FFFFFF" />}
            iconBgColor={isPhoneVerified ? "#34C759" : theme.primary}
            showDivider
            onPress={() => router.push("/(app)/tu/telefono")}
          />

          <SettingsRow
            title="Configuración de la cuenta"
            icon={<UserCog size={18} color="#FFFFFF" />}
            iconBgColor="#636366"
            onPress={() => router.push("/(app)/tu/cuenta")}
          />
        </SettingsGroup>

        {/* Preferencias */}
        <SettingsGroup title="Preferencias">
          <SettingsRow
            title="Notificaciones"
            icon={<Bell size={18} color="#FFFFFF" />}
            iconBgColor="#FF3B30"
            showDivider
            onPress={() => router.push("/(app)/tu/notificaciones")}
          />

          <SettingsRow
            title="Permisos"
            icon={<ShieldCheck size={18} color="#FFFFFF" />}
            iconBgColor="#34C759"
            showDivider
            onPress={() => router.push("/(app)/tu/permisos")}
          />

          <SettingsRow
            title="Apariencia"
            value={appearanceLabel}
            icon={<Palette size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            onPress={() => router.push("/(app)/tu/apariencia")}
          />
        </SettingsGroup>

        {/* Perso Empresas (acceso discreto) */}
        <EmployerSettingsGroup />

        {/* Cerrar sesión */}
        <SettingsGroup>
          <SettingsRow
            title="Cerrar sesión"
            icon={<LogOut size={18} color="#FFFFFF" />}
            iconBgColor="#FF3B30"
            showChevron={false}
            destructive
            onPress={handleLogout}
          />
        </SettingsGroup>
      </ScrollView>
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
    paddingTop: 4,
    paddingBottom: 120,
    gap: 20,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  profileTextGroup: {
    flex: 1,
    gap: 2,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  profileHint: {
    fontSize: 14,
  },
});
