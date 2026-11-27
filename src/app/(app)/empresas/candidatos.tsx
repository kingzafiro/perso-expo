import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ChevronRight, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Spinner } from "@/components/ui/Spinner";
import { VacancyApplicantsModal } from "@/features/employer/components/VacancyApplicantsModal";
import { useEmployerVacancies } from "@/features/employer/hooks/use-employer-vacancies";
import type { EmployerVacancy } from "@/features/employer/types/employer.types";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

const MAX_VISIBLE_AVATARS = 4;

export default function TusCandidatosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const canEnter = isAdmin || hasAccess;

  const {
    data: vacancies = [],
    isLoading,
    refetch,
  } = useEmployerVacancies(canEnter);

  const [selectedVacancy, setSelectedVacancy] =
    useState<EmployerVacancy | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const sortedVacancies = useMemo(
    () =>
      [...vacancies].sort(
        (a, b) => (b.postulantes_count ?? 0) - (a.postulantes_count ?? 0),
      ),
    [vacancies],
  );

  const totalApplicants = useMemo(
    () => vacancies.reduce((sum, v) => sum + (v.postulantes_count ?? 0), 0),
    [vacancies],
  );

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";
  const avatarRingColor = isDark ? "#181513" : "#FFFFFF";

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Tus candidatos" />

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
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <Spinner size={28} strokeWidth={2.8} color={theme.primary} />
          </View>
        ) : sortedVacancies.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}
            >
              <Users size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes vacantes con candidatos
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Publica una vacante para recibir postulantes, revisar su CV,
              solicitar documentos y agendar entrevistas con QR.
            </Text>
            <View style={styles.emptyCta}>
              <AppButton
                title="Ir a Tus publicaciones"
                onPress={() => router.push("/(app)/empresas/publicaciones")}
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.summaryHint, { color: theme.textSecondary }]}>
              {totalApplicants}{" "}
              {totalApplicants === 1 ? "postulante" : "postulantes"} en{" "}
              {sortedVacancies.length}{" "}
              {sortedVacancies.length === 1 ? "vacante" : "vacantes"}
            </Text>

            {sortedVacancies.map((vacancy) => {
              const count = vacancy.postulantes_count ?? 0;
              const preview = (vacancy.postulantes_preview ?? []).slice(
                0,
                MAX_VISIBLE_AVATARS,
              );
              const overflow = Math.max(count - preview.length, 0);

              return (
                <Pressable
                  key={vacancy.id_vacante}
                  onPress={() => {
                    if (Platform.OS !== "web") void Haptics.selectionAsync();
                    setSelectedVacancy(vacancy);
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.flexOne}>
                      <Text
                        style={[styles.vacancyTitle, { color: theme.text }]}
                        numberOfLines={2}
                      >
                        {vacancy.titulo}
                      </Text>
                      <Text
                        style={[
                          styles.vacancySub,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {vacancy.ciudad} ·{" "}
                        {vacancy.estado === "activa"
                          ? "Activa"
                          : vacancy.estado === "pausada"
                            ? "Pausada"
                            : "Cerrada"}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={theme.primary} />
                  </View>

                  <View
                    style={[
                      styles.stackRow,
                      {
                        borderTopColor: isDark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(23,18,14,0.06)",
                      },
                    ]}
                  >
                    {count > 0 ? (
                      <View style={styles.avatarStack}>
                        {preview.map((cand, idx) => (
                          <View
                            key={`${cand.id_usuario}-${idx}`}
                            style={[
                              styles.avatarRing,
                              {
                                borderColor: avatarRingColor,
                                marginLeft: idx === 0 ? 0 : -11,
                                zIndex: MAX_VISIBLE_AVATARS - idx,
                              },
                            ]}
                          >
                            <ProfileAvatar
                              uri={cand.foto_perfil}
                              initials={(cand.nombre || "C")
                                .slice(0, 2)
                                .toUpperCase()}
                              size={34}
                            />
                          </View>
                        ))}
                        {overflow > 0 ? (
                          <View
                            style={[
                              styles.overflowBadge,
                              {
                                backgroundColor: theme.primary,
                                borderColor: avatarRingColor,
                                marginLeft: preview.length > 0 ? -11 : 0,
                              },
                            ]}
                          >
                            <Text style={styles.overflowText}>+{overflow}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.emptyBadgeIcon,
                          { backgroundColor: theme.inputBackground },
                        ]}
                      >
                        <Users size={15} color={theme.textMuted} />
                      </View>
                    )}

                    <View style={styles.flexOne}>
                      <Text style={[styles.countText, { color: theme.text }]}>
                        {count > 0
                          ? `${count} postulante${count === 1 ? "" : "s"}`
                          : "Sin postulantes aún"}
                      </Text>
                      <Text
                        style={[
                          styles.countSub,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {count > 0
                          ? "Toca para revisar perfiles y CVs"
                          : "Aún nadie se ha postulado"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <VacancyApplicantsModal
        vacancy={selectedVacancy}
        onClose={() => setSelectedVacancy(null)}
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
    gap: 12,
  },

  loaderWrap: {
    paddingVertical: 56,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
  },

  emptyCta: {
    width: "100%",
    marginTop: 8,
  },

  summaryHint: {
    fontSize: 12.5,
    fontWeight: "600",
    paddingHorizontal: 4,
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 12,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  vacancyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  vacancySub: {
    fontSize: 12.5,
  },

  stackRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarRing: {
    borderWidth: 2,
    borderRadius: 999,
    overflow: "hidden",
  },

  overflowBadge: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  overflowText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },

  emptyBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  countSub: {
    fontSize: 11.5,
  },

  pressed: {
    opacity: 0.78,
  },
});
