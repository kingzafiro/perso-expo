import * as Haptics from "expo-haptics";
import { Briefcase, Search, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  EmployerVacancy,
  VacancyModality,
} from "@/features/employer/types/employer.types";
import { JobDetailModal } from "@/features/jobs/components/JobDetailModal";
import { JobFeedCard } from "@/features/jobs/components/JobFeedCard";
import {
  usePublicVacancies,
  useToggleFavoriteVacancy,
} from "@/features/jobs/hooks/use-jobs";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const MODALITY_FILTERS: { id: VacancyModality | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "presencial", label: "Presencial" },
  { id: "hibrido", label: "Híbrido" },
  { id: "remoto", label: "Remoto" },
];

export default function EmpleosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState("");
  const [modalidad, setModalidad] = useState<VacancyModality | "all">("all");
  const [selectedVacancy, setSelectedVacancy] =
    useState<EmployerVacancy | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const {
    data: vacancies = [],
    isLoading,
    refetch,
  } = usePublicVacancies({ q: searchText, modalidad });
  const { toggleFavorite } = useToggleFavoriteVacancy();

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleToggleFavorite = (vacancy: EmployerVacancy) => {
    toggleFavorite(vacancy);
  };

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

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
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={() => void handleManualRefresh()}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            VACANTES EN PERSO
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Empleos</Text>
        </View>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Search size={17} color={theme.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Puesto, ciudad o palabra clave..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {searchText.length > 0 ? (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <X size={16} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {MODALITY_FILTERS.map((item) => {
            const active = modalidad === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                  setModalidad(item.id);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? theme.primary : cardBg,
                    borderColor: active ? theme.primary : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loaderBox}>
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
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Briefcase size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No encontramos vacantes por ahora
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {searchText || modalidad !== "all"
                ? "Prueba limpiar tus filtros de búsqueda para ver todas las oportunidades."
                : "En cuanto las empresas publiquen nuevas vacantes aparecerán aquí."}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {vacancies.map((vacancy) => (
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
    paddingBottom: 130,
    gap: 14,
  },

  header: {
    paddingHorizontal: 4,
    gap: 2,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  searchBox: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },

  filtersRow: {
    gap: 8,
    paddingVertical: 2,
  },

  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  filterText: {
    fontSize: 13,
    fontWeight: "700",
  },

  loaderBox: {
    paddingVertical: 48,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 9,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
  },

  list: {
    gap: 12,
  },
});
