import axios from "axios";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Briefcase,
  Building2,
  FileCheck2,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { useBilling } from "@/features/billing/hooks/use-billing";
import type { CreateVacancyInput } from "@/features/employer/api/employer.api";
import { AdminOverviewCard } from "@/features/employer/components/AdminOverviewCard";
import { CreateVacancyModal } from "@/features/employer/components/CreateVacancyModal";
import { SubscriptionStatusCard } from "@/features/employer/components/SubscriptionStatusCard";
import { VacancyApplicantsModal } from "@/features/employer/components/VacancyApplicantsModal";
import { VacancyCard } from "@/features/employer/components/VacancyCard";
import { VacancyDetailView } from "@/features/employer/components/VacancyDetailView";
import {
  useCreateEmployerVacancy,
  useDeleteEmployerVacancy,
  useEmployerVacancies,
  useUpdateEmployerVacancy,
  useUpdateEmployerVacancyStatus,
} from "@/features/employer/hooks/use-employer-vacancies";
import type {
  EmployerVacancy,
  VacancyStatus,
} from "@/features/employer/types/employer.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string } | undefined;
    if (data?.mensaje) return data.mensaje;
  }
  return fallback;
}

export default function EmployerPanelScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const profile = useEmployerStore((state) => state.profile);
  const subscription = useEmployerStore((state) => state.subscription);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const limits = useEmployerStore((state) => state.limits);
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);
  const startEditFromProfile = useEmployerStore(
    (state) => state.startEditFromProfile,
  );

  const canEnterPanel = isAdmin || hasAccess;

  const { openManageSubscriptions } = useBilling();
  const {
    data: vacancies = [],
    isLoading: loadingVacancies,
    isRefetching,
    refetch,
  } = useEmployerVacancies(canEnterPanel);
  const createVacancy = useCreateEmployerVacancy();
  const updateVacancy = useUpdateEmployerVacancy();
  const deleteVacancy = useDeleteEmployerVacancy();
  const updateVacancyStatus = useUpdateEmployerVacancyStatus();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<EmployerVacancy | null>(
    null,
  );
  const [previewVacancy, setPreviewVacancy] = useState<EmployerVacancy | null>(
    null,
  );
  const [applicantsVacancy, setApplicantsVacancy] =
    useState<EmployerVacancy | null>(null);
  const [updatingVacancyId, setUpdatingVacancyId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const closePanel = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace("/(app)");
    }
  };

  const handleSaveVacancy = async (payload: CreateVacancyInput) => {
    try {
      if (editingVacancy) {
        await updateVacancy.mutateAsync({
          idVacante: editingVacancy.id_vacante,
          input: payload,
        });
      } else {
        await createVacancy.mutateAsync(payload);
      }

      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setComposerOpen(false);
      setEditingVacancy(null);
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        extractErrorMessage(error, "Intenta guardar la vacante nuevamente."),
      );
    }
  };

  const handleToggleStatus = async (
    idVacante: number,
    nextStatus: VacancyStatus,
  ) => {
    setUpdatingVacancyId(idVacante);
    try {
      await updateVacancyStatus.mutateAsync({ idVacante, estado: nextStatus });
      if (Platform.OS !== "web") void Haptics.selectionAsync();
    } catch (error) {
      Alert.alert(
        "No se pudo actualizar",
        extractErrorMessage(
          error,
          "No fue posible cambiar el estado de la vacante.",
        ),
      );
    } finally {
      setUpdatingVacancyId(null);
    }
  };

  const handleDeleteVacancy = (vacancy: EmployerVacancy) => {
    Alert.alert(
      "Eliminar vacante",
      `¿Seguro que deseas eliminar "${vacancy.titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVacancy.mutateAsync(vacancy.id_vacante);
            } catch (error) {
              Alert.alert(
                "Error",
                extractErrorMessage(error, "No se pudo eliminar la vacante."),
              );
            }
          },
        },
      ],
    );
  };

  const handleRefresh = async () => {
    await Promise.all([syncFromServer(), refetch()]);
  };

  if (!canEnterPanel) {
    return (
      <View
        style={[
          styles.lockedScreen,
          {
            backgroundColor: screenBg,
            paddingTop: Math.max(insets.top + 16, 28),
          },
        ]}
      >
        <View style={styles.lockedHeader}>
          <Pressable
            onPress={closePanel}
            style={[styles.iconBtn, { backgroundColor: theme.inputBackground }]}
          >
            <X size={18} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.lockedBody}>
          <View
            style={[styles.lockCircle, { backgroundColor: theme.primarySoft }]}
          >
            <Lock size={28} color={theme.primary} />
          </View>
          <Text style={[styles.lockedTitle, { color: theme.text }]}>
            Panel exclusivo para empleadores
          </Text>
          <Text style={[styles.lockedDesc, { color: theme.textSecondary }]}>
            Activa tu prueba gratis de 14 días en Perso Empresas para publicar
            vacantes y gestionar candidatos verificados.
          </Text>
          <View style={styles.lockedCta}>
            <AppButton
              title="Ver planes y activar 14 días gratis"
              onPress={() => router.replace("/(employer)/planes")}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <View
        style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 20) }]}
      >
        <View style={styles.companyHeader}>
          <View
            style={[
              styles.companyAvatar,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <Building2 size={20} color={theme.primary} />
          </View>
          <View style={styles.flexOne}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>
              {isAdmin ? "PANEL ADMIN Y EMPLEADOR" : "PANEL DE EMPLEADOR"}
            </Text>
            <Text
              style={[styles.companyTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {profile?.companyName ?? "Perso Empresas"}
            </Text>
          </View>
        </View>

        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => {
              startEditFromProfile();
              router.push("/(employer)");
            }}
            style={[styles.iconBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel="Editar empresa"
          >
            <Pencil size={17} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={closePanel}
            style={[styles.iconBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel="Cerrar panel"
          >
            <X size={18} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.primary}
          />
        }
      >
        {isAdmin ? (
          <AdminOverviewCard />
        ) : subscription ? (
          <SubscriptionStatusCard
            subscription={subscription}
            limits={limits}
            onChangePlan={() => router.push("/(employer)/planes")}
            onManageStore={() => void openManageSubscriptions()}
          />
        ) : null}

        {profile?.verified ? (
          <View
            style={[
              styles.verifiedStrip,
              {
                backgroundColor: "rgba(52, 199, 89, 0.1)",
                borderColor: "rgba(52, 199, 89, 0.28)",
              },
            ]}
          >
            <ShieldCheck size={16} color="#34C759" />
            <Text style={[styles.verifiedStripText, { color: theme.text }]}>
              {profile.rfc
                ? `Empresa verificada · RFC ${profile.rfc}`
                : "Cuenta verificada"}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push("/(employer)/verificacion")}
            style={({ pressed }) => [
              styles.verifyPrompt,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.verifyPromptIcon,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <FileCheck2 size={17} color={theme.primary} />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.verifyPromptTitle, { color: theme.text }]}>
                Verifica tu empresa con PDF
              </Text>
              <Text
                style={[styles.verifyPromptSub, { color: theme.textSecondary }]}
              >
                Opcional · Sube tu Constancia Fiscal y obtén la insignia
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.flexOne}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {isAdmin ? "Todas las publicaciones" : "Tus vacantes"}
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
            >
              {vacancies.length === 0
                ? "Publica tu primera vacante estilo Indeed"
                : `${vacancies.length} ${vacancies.length === 1 ? "publicación" : "publicaciones"}`}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setEditingVacancy(null);
              setComposerOpen(true);
            }}
            style={({ pressed }) => [
              styles.newBtn,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.newBtnText}>Publicar</Text>
          </Pressable>
        </View>

        {loadingVacancies ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : vacancies.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}
            >
              <Briefcase size={22} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes vacantes publicadas
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Publica una vacante completa con sueldo, beneficios,
              responsabilidades y requisitos para recibir candidatos de Perso.
            </Text>
            <View style={styles.emptyCta}>
              <AppButton
                title="Publicar primera vacante"
                onPress={() => {
                  setEditingVacancy(null);
                  setComposerOpen(true);
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.vacanciesList}>
            {vacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id_vacante}
                vacancy={vacancy}
                updating={updatingVacancyId === vacancy.id_vacante}
                onPreview={() => setPreviewVacancy(vacancy)}
                onEdit={() => {
                  setEditingVacancy(vacancy);
                  setComposerOpen(true);
                }}
                onViewApplicants={() => setApplicantsVacancy(vacancy)}
                onDelete={() => handleDeleteVacancy(vacancy)}
                onChangeStatus={(next) =>
                  void handleToggleStatus(vacancy.id_vacante, next)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateVacancyModal
        visible={composerOpen}
        profile={profile}
        editingVacancy={editingVacancy}
        isAdmin={isAdmin}
        submitting={createVacancy.isPending || updateVacancy.isPending}
        onClose={() => {
          setComposerOpen(false);
          setEditingVacancy(null);
        }}
        onSubmit={handleSaveVacancy}
      />

      <VacancyApplicantsModal
        vacancy={applicantsVacancy}
        onClose={() => setApplicantsVacancy(null)}
      />

      <Modal
        visible={Boolean(previewVacancy)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewVacancy(null)}
      >
        <View style={[styles.screen, { backgroundColor: screenBg }]}>
          <View
            style={[
              styles.previewHeader,
              {
                paddingTop: Math.max(insets.top, 16),
                borderBottomColor: theme.inputBorder,
              },
            ]}
          >
            <Text style={[styles.previewTitle, { color: theme.text }]}>
              Vista previa de la publicación
            </Text>
            <Pressable
              onPress={() => setPreviewVacancy(null)}
              style={[styles.iconBtn, { backgroundColor: theme.inputBackground }]}
            >
              <X size={18} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.previewContent,
              { paddingBottom: Math.max(insets.bottom + 24, 36) },
            ]}
          >
            {previewVacancy ? (
              <VacancyDetailView
                vacancy={previewVacancy}
                mode="preview"
                showAdminMeta={isAdmin}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },

  companyHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  companyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  flexOne: {
    flex: 1,
    gap: 1,
  },

  eyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1,
  },

  companyTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 2,
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  sectionSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },

  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  newBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },

  loaderWrap: {
    paddingVertical: 36,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    alignItems: "center",
    gap: 10,
  },

  emptyIcon: {
    width: 52,
    height: 52,
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

  vacanciesList: {
    gap: 12,
  },

  verifiedStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  verifiedStripText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  verifyPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },

  verifyPromptIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  verifyPromptTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  verifyPromptSub: {
    fontSize: 12,
    marginTop: 1,
  },

  lockedScreen: {
    flex: 1,
    paddingHorizontal: 20,
  },

  lockedHeader: {
    alignItems: "flex-end",
  },

  lockedBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
  },

  lockCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  lockedTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
  },

  lockedDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
  },

  lockedCta: {
    width: "100%",
    marginTop: 10,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  previewTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  previewContent: {
    padding: 16,
  },

  pressed: {
    opacity: 0.78,
  },
});
