import {
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  MapPin,
  Wallet,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatVacancyLocation,
  formatVacancySalary,
  VACANCY_CONTRACTS,
  VACANCY_MODALITIES,
  type EmployerVacancy,
} from "@/features/employer/types/employer.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { FavoriteButton } from "./FavoriteButton";

interface JobFeedCardProps {
  vacancy: EmployerVacancy;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export function JobFeedCard({
  vacancy,
  onPress,
  onToggleFavorite,
}: JobFeedCardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const modalityLabel =
    VACANCY_MODALITIES.find((m) => m.id === vacancy.modalidad)?.label ??
    vacancy.modalidad;
  const contractLabel =
    VACANCY_CONTRACTS.find((c) => c.id === vacancy.tipo_contrato)?.label ??
    vacancy.tipo_contrato;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#181513" : "#FFFFFF",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(23, 18, 14, 0.08)",
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardBody, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.topRow,
            onToggleFavorite ? styles.topRowWithFavorite : null,
          ]}
        >
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={2}
          >
            {vacancy.titulo}
          </Text>

          {vacancy.ya_postulado ? (
            <View style={styles.appliedPill}>
              <CheckCircle2 size={12} color="#34C759" />
              <Text style={styles.appliedPillText}>Postulado</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.companyRow}>
          <Building2 size={13} color={theme.primary} />
          <Text
            style={[styles.companyText, { color: theme.text }]}
            numberOfLines={1}
          >
            {vacancy.empresa?.nombre_comercial || "Empresa en Perso"}
          </Text>
          {vacancy.empresa?.verificada ? (
            <BadgeCheck size={14} color="#34C759" />
          ) : null}
        </View>

        <View style={styles.locationRow}>
          <MapPin size={13} color={theme.textSecondary} />
          <Text
            style={[styles.locationText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {formatVacancyLocation(vacancy)} · {modalityLabel}
          </Text>
        </View>

        <View
          style={[styles.salaryRow, { backgroundColor: theme.primarySoft }]}
        >
          <Wallet size={13} color={theme.primary} />
          <Text style={[styles.salaryText, { color: theme.primary }]}>
            {formatVacancySalary(
              vacancy.salario_min,
              vacancy.salario_max,
              vacancy.salario_periodo,
            )}
          </Text>
        </View>

        <View style={styles.chipsRow}>
          <View
            style={[styles.chip, { backgroundColor: theme.inputBackground }]}
          >
            <Briefcase size={11} color={theme.textSecondary} />
            <Text style={[styles.chipText, { color: theme.textSecondary }]}>
              {contractLabel}
            </Text>
          </View>

          {vacancy.beneficios.slice(0, 2).map((b) => (
            <View
              key={b}
              style={[styles.chip, { backgroundColor: theme.inputBackground }]}
            >
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>
                {b}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>

      {onToggleFavorite ? (
        <View style={styles.favOverlay}>
          <FavoriteButton
            isFavorite={Boolean(vacancy.es_favorito)}
            onPress={onToggleFavorite}
            variant="card"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  cardBody: {
    padding: 16,
    gap: 9,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  topRowWithFavorite: {
    paddingRight: 44,
  },

  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  favOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
  },

  appliedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },

  appliedPillText: {
    color: "#34C759",
    fontSize: 11,
    fontWeight: "700",
  },

  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  companyText: {
    fontSize: 13.5,
    fontWeight: "700",
    flexShrink: 1,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  locationText: {
    fontSize: 12.5,
    flex: 1,
  },

  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  salaryText: {
    fontSize: 13,
    fontWeight: "800",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },

  chipText: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  pressed: {
    transform: [{ scale: 0.988 }],
  },
});
