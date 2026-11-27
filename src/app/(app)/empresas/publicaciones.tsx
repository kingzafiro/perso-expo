import axios from "axios";
import * as Haptics from "expo-haptics";
import { Briefcase, Plus, X } from "lucide-react-native";
import { useState } from "react";
import {
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
import { Spinner } from "@/components/ui/Spinner";
import type { CreateVacancyInput } from "@/features/employer/api/employer.api";
import { CreateVacancyModal } from "@/features/employer/components/CreateVacancyModal";
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
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
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

export default function TusPublicacionesScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const profile = useEmployerStore((state) => state.profile);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);

  const canEnter = isAdmin || hasAccess;

  const {
    data: vacancies = [],
    isLoading,
    refetch,
  } = useEmployerVacancies(canEnter);
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
  const [deletingVacancyId, setDeletingVacancyId] = useState<number | null>(
    null,
  );
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await Promise.all([syncFromServer(), refetch()]);
    } finally {
      setManualRefreshing(false);
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
            setDeletingVacancyId(vacancy.id_vacante);
            try {
              await deleteVacancy.mutateAsync(vacancy.id_vacante);
            } catch (error) {
              Alert.alert(
                "Error",
                extractErrorMessage(error, "No se pudo eliminar la vacante."),
              );
            } finally {
              setDeletingVacancyId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader
        title="Tus publicaciones"
        rightElement={
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
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.newBtnText}>Publicar</Text>
          </Pressable>
        }
      />

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
              <Briefcase size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes vacantes publicadas
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Publica una vacante completa con sueldo, beneficios,
              responsabilidades y requisitos para comenzar a recibir candidatos.
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
          <View style={styles.list}>
            <Text style={[styles.countHint, { color: theme.textSecondary }]}>
              {vacancies.length}{" "}
              {vacancies.length === 1 ? "publicación" : "publicaciones"}
            </Text>

            {vacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id_vacante}
                vacancy={vacancy}
                updating={updatingVacancyId === vacancy.id_vacante}
                deleting={deletingVacancyId === vacancy.id_vacante}
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
              style={[
                styles.closeBtn,
                { backgroundColor: theme.inputBackground },
              ]}
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

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 12,
  },

  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },

  newBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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

  countHint: {
    fontSize: 12.5,
    fontWeight: "600",
    paddingHorizontal: 4,
  },

  list: {
    gap: 12,
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

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  previewContent: {
    padding: 16,
  },

  pressed: {
    opacity: 0.78,
  },
});
