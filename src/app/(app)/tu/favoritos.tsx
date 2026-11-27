import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { Bookmark } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import type { EmployerVacancy } from "@/features/employer/types/employer.types";
import { JobDetailModal } from "@/features/jobs/components/JobDetailModal";
import { JobFeedCard } from "@/features/jobs/components/JobFeedCard";
import {
  useFavoriteVacancies,
  useToggleFavoriteVacancy,
} from "@/features/jobs/hooks/use-jobs";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export default function MisFavoritosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const {
    data: rawFavorites = [],
    isLoading,
    refetch,
  } = useFavoriteVacancies();
  const { toggleFavorite } = useToggleFavoriteVacancy();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const favorites = useMemo(
    () => rawFavorites.filter((v) => v.estado === "activa"),
    [rawFavorites],
  );

  const [selectedVacancy, setSelectedVacancy] =
    useState<EmployerVacancy | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const handleToggleFavorite = (vacancy: EmployerVacancy) => {
    toggleFavorite(vacancy);
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Mis favoritos" />

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
          <View style={styles.loaderBox}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : favorites.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}
            >
              <Bookmark size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes empleos guardados
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Guarda las vacantes que te interesen desde Empleos para revisarlas
              o postularte después de completar tu perfil y documentos.
            </Text>
            <View style={styles.emptyCta}>
              <AppButton
                title="Explorar empleos"
                onPress={() => router.navigate("/(app)")}
              />
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={[styles.countHint, { color: theme.textSecondary }]}>
              {favorites.length}{" "}
              {favorites.length === 1
                ? "empleo guardado"
                : "empleos guardados"}
            </Text>
            {favorites.map((vacancy) => (
              <JobFeedCard
                key={vacancy.id_vacante}
                vacancy={vacancy}
                onToggleFavorite={() => handleToggleFavorite(vacancy)}
                onPress={() => {
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                  setSelectedVacancy(vacancy);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <JobDetailModal
        vacancy={selectedVacancy}
        onClose={() => setSelectedVacancy(null)}
        onApplied={(id) =>
          setSelectedVacancy((prev) =>
            prev && prev.id_vacante === id
              ? { ...prev, ya_postulado: true, estado_postulacion: "enviada" }
              : prev,
          )
        }
        onFavoriteChanged={(id, isFavorite) =>
          setSelectedVacancy((prev) =>
            prev && prev.id_vacante === id
              ? { ...prev, es_favorito: isFavorite }
              : prev,
          )
        }
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

  loaderBox: {
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
});
