import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Crown,
  FileText,
  Pencil,
  Sparkles,
  UserCheck,
} from "lucide-react-native";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EMPLOYER_PLANS } from "@/features/employer/types/employer.types";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";

function getFirstName(nombre?: string | null, email?: string) {
  const clean = (nombre ?? "").trim();
  if (clean) return clean.split(/\s+/)[0];
  if (email) {
    const prefix = email.split("@")[0];
    if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return "hola";
}

function getInitials(nombre?: string | null, email?: string) {
  const clean = (nombre ?? "").trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (email?.[0] || "P").toUpperCase();
}

export default function InicioScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const employerProfile = useEmployerStore((state) => state.profile);
  const startEditFromProfile = useEmployerStore(
    (state) => state.startEditFromProfile,
  );

  const firstName = getFirstName(user?.nombre, user?.email);
  const initials = getInitials(user?.nombre, user?.email);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.07)";

  const employerCardBg = isDark ? "#1A130F" : "#17120E";
  const employerCardBorder = isDark
    ? "rgba(240, 104, 8, 0.34)"
    : "rgba(240, 104, 8, 0.25)";

  const selectedPlan = employerProfile?.selectedPlanId
    ? EMPLOYER_PLANS.find((p) => p.id === employerProfile.selectedPlanId)
    : null;

  const selectedPrice = selectedPlan
    ? employerProfile?.billingCycle === "annual"
      ? selectedPlan.annualMonthlyPrice
      : selectedPlan.monthlyPrice
    : null;

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + 14, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera de bienvenida */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>PERSO</Text>
            <Text style={[styles.greeting, { color: theme.text }]}>
              Hola, {firstName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Elige cómo quieres usar Perso hoy
            </Text>
          </View>

          <ProfileAvatar
            uri={user?.foto_perfil}
            initials={initials}
            size={48}
            onPress={() => router.push("/(app)/tu/perfil")}
          />
        </View>

        {/* Tarjeta 1: Buscar empleo (Candidato) */}
        <View
          style={[
            styles.candidateCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.rolePill,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Briefcase size={13} color={theme.primary} />
              <Text style={[styles.rolePillText, { color: theme.primary }]}>
                Buscar empleo
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Encuentra tu próxima oportunidad
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: theme.textSecondary }]}
            >
              Descubre vacantes cerca de tu ubicación y postúlate rápido con tu
              perfil y expediente listo.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push("/(app)/empleos");
            }}
            style={({ pressed }) => [
              styles.primaryCta,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryCtaText}>Explorar empleos</Text>
            <ArrowRight size={17} color="#FFFFFF" />
          </Pressable>

          <View style={styles.quickShortcuts}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push("/(app)/tu/perfil");
              }}
              style={({ pressed }) => [
                styles.shortcutTile,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <UserCheck size={16} color={theme.primary} />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Mi perfil
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push("/(app)/tu/documentos");
              }}
              style={({ pressed }) => [
                styles.shortcutTile,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <FileText size={16} color={theme.primary} />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Mis documentos
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tarjeta 2: Contratar talento (Perso Empresas - Empleador) */}
        <View
          style={[
            styles.employerCard,
            {
              backgroundColor: employerCardBg,
              borderColor: employerCardBorder,
            },
          ]}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.employerPill}>
              <Building2 size={13} color="#FFA064" />
              <Text style={styles.employerPillText}>PERSO EMPRESAS</Text>
            </View>

            <View style={styles.proBadge}>
              <Crown size={12} color="#F06808" />
              <Text style={styles.proBadgeText}>Membresía</Text>
            </View>
          </View>

          {employerProfile ? (
            <>
              <View style={styles.cardBody}>
                <Text style={styles.employerTitle}>
                  {employerProfile.companyName}
                </Text>
                <Text style={styles.employerSubtitle}>
                  {[employerProfile.industry, employerProfile.city]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>

              <View style={styles.employerStatusBox}>
                <View style={styles.employerStatusRow}>
                  <Sparkles size={15} color="#FFA064" />
                  <Text style={styles.employerStatusTitle}>
                    Perfil creado · Pendiente de activación
                  </Text>
                </View>
                <Text style={styles.employerStatusDesc}>
                  {selectedPlan && selectedPrice
                    ? `Plan ${selectedPlan.name} seleccionado ($${selectedPrice.toLocaleString("es-MX")} MXN/mes). Activa tu suscripción para empezar a publicar vacantes.`
                    : "Elige un plan de empleador para publicar vacantes y revisar candidatos."}
                </Text>
              </View>

              <View style={styles.employerActions}>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    startEditFromProfile();
                    router.push("/(employer)/planes");
                  }}
                  style={({ pressed }) => [
                    styles.primaryCta,
                    { backgroundColor: theme.primary, flex: 1 },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryCtaText}>Ver planes y activar</Text>
                  <ArrowRight size={17} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    startEditFromProfile();
                    router.push("/(employer)/index");
                  }}
                  style={({ pressed }) => [
                    styles.editIconBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Editar perfil de empleador"
                >
                  <Pencil size={17} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardBody}>
                <Text style={styles.employerTitle}>
                  ¿Quieres contratar talento?
                </Text>
                <Text style={styles.employerSubtitle}>
                  Crea tu perfil de empleador independiente, publica vacantes y
                  conecta con candidatos listos para integrarse.
                </Text>
              </View>

              <View style={styles.benefitsList}>
                {[
                  "Perfil profesional verificado de tu empresa",
                  "Candidatos con CV y documentos validados",
                  "Gestión centralizada de vacantes y postulantes",
                ].map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <CheckCircle2 size={15} color="#F06808" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push("/(employer)/index");
                }}
                style={({ pressed }) => [
                  styles.primaryCta,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryCtaText}>
                  Crear perfil de empleador
                </Text>
                <ArrowRight size={17} color="#FFFFFF" />
              </Pressable>

              <Text style={styles.employerFootnote}>
                Las cuentas de empleador requieren una suscripción activa al
                finalizar el registro.
              </Text>
            </>
          )}
        </View>
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
    paddingBottom: 130,
    gap: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 12,
  },

  headerText: {
    flex: 1,
    gap: 2,
  },

  eyebrow: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  greeting: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  subtitle: {
    fontSize: 14.5,
    marginTop: 1,
  },

  candidateCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 15,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  rolePillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  cardBody: {
    gap: 5,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  primaryCta: {
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  quickShortcuts: {
    flexDirection: "row",
    gap: 10,
  },

  shortcutTile: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  shortcutText: {
    fontSize: 13.5,
    fontWeight: "600",
  },

  employerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 15,
  },

  employerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(240, 104, 8, 0.18)",
  },

  employerPillText: {
    color: "#FFA064",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  proBadgeText: {
    color: "#FFE5D1",
    fontSize: 11.5,
    fontWeight: "700",
  },

  employerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  employerSubtitle: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 14,
    lineHeight: 20,
  },

  benefitsList: {
    gap: 9,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  benefitText: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 13.5,
    fontWeight: "500",
    flex: 1,
  },

  employerStatusBox: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 16,
    padding: 13,
    gap: 5,
  },

  employerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  employerStatusTitle: {
    color: "#FFA064",
    fontSize: 13,
    fontWeight: "700",
  },

  employerStatusDesc: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 12.5,
    lineHeight: 18,
  },

  employerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  editIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  employerFootnote: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
