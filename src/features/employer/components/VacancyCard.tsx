import {
  Briefcase,
  Eye,
  MapPin,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
  Users,
  Wallet,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  formatVacancyLocation,
  formatVacancySalary,
  VACANCY_CONTRACTS,
  VACANCY_MODALITIES,
  type EmployerVacancy,
  type VacancyStatus,
} from "../types/employer.types";

interface VacancyCardProps {
  vacancy: EmployerVacancy;
  updating?: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onViewApplicants: () => void;
  onDelete: () => void;
  onChangeStatus: (nextStatus: VacancyStatus) => void;
}

export function VacancyCard({
  vacancy,
  updating,
  onPreview,
  onEdit,
  onViewApplicants,
  onDelete,
  onChangeStatus,
}: VacancyCardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const modalityLabel =
    VACANCY_MODALITIES.find((m) => m.id === vacancy.modalidad)?.label ??
    vacancy.modalidad;
  const contractLabel =
    VACANCY_CONTRACTS.find((c) => c.id === vacancy.tipo_contrato)?.label ??
    vacancy.tipo_contrato;

  const isActive = vacancy.estado === "activa";
  const badgeBg = isActive
    ? "rgba(52, 199, 89, 0.14)"
    : "rgba(142, 142, 147, 0.16)";
  const badgeText = isActive ? theme.success : theme.textSecondary;

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
      <View style={styles.headerRow}>
        <View style={styles.flexOne}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={2}
          >
            {vacancy.titulo}
          </Text>
          {vacancy.empresa?.nombre_comercial ? (
            <Text style={[styles.companySub, { color: theme.textSecondary }]}>
              {vacancy.empresa.nombre_comercial}
            </Text>
          ) : null}
        </View>

        <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
          <Text style={[styles.statusText, { color: badgeText }]}>
            {isActive
              ? "Activa"
              : vacancy.estado === "pausada"
                ? "Pausada"
                : "Cerrada"}
          </Text>
        </View>
      </View>

      <View style={styles.metaList}>
        <View style={styles.metaItem}>
          <MapPin size={13} color={theme.textSecondary} />
          <Text
            style={[styles.metaText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {formatVacancyLocation(vacancy)} · {modalityLabel}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Briefcase size={13} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {contractLabel}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Wallet size={13} color={theme.primary} />
          <Text style={[styles.salaryText, { color: theme.text }]}>
            {formatVacancySalary(
              vacancy.salario_min,
              vacancy.salario_max,
              vacancy.salario_periodo,
            )}
          </Text>
        </View>
      </View>

      {vacancy.beneficios.length > 0 ? (
        <View style={styles.benefitsRow}>
          {vacancy.beneficios.slice(0, 3).map((b) => (
            <View
              key={b}
              style={[
                styles.benefitPill,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Text style={[styles.benefitText, { color: theme.primary }]}>
                {b}
              </Text>
            </View>
          ))}
          {vacancy.beneficios.length > 3 ? (
            <Text style={[styles.moreBenefits, { color: theme.textMuted }]}>
              +{vacancy.beneficios.length - 3}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.footerRow,
          {
            borderTopColor: isDark
              ? "rgba(255,255,255,0.07)"
              : "rgba(23,18,14,0.06)",
          },
        ]}
      >
        <Pressable
          onPress={onViewApplicants}
          style={({ pressed }) => [
            styles.applicantsBtn,
            { backgroundColor: theme.primarySoft },
            pressed && styles.pressed,
          ]}
        >
          <Users size={14} color={theme.primary} />
          <Text style={[styles.applicantsText, { color: theme.primary }]}>
            {vacancy.postulantes_count} postulante
            {vacancy.postulantes_count === 1 ? "" : "s"}
          </Text>
        </Pressable>

        <View style={styles.iconActions}>
          <Pressable
            onPress={onPreview}
            style={[styles.miniBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel="Vista previa"
          >
            <Eye size={14} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={onEdit}
            style={[styles.miniBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel="Editar vacante"
          >
            <Pencil size={14} color={theme.text} />
          </Pressable>

          <Pressable
            disabled={updating}
            onPress={() => onChangeStatus(isActive ? "pausada" : "activa")}
            style={[styles.miniBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel={isActive ? "Pausar" : "Reactivar"}
          >
            {isActive ? (
              <PauseCircle size={15} color={theme.textSecondary} />
            ) : (
              <PlayCircle size={15} color={theme.primary} />
            )}
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={[
              styles.miniBtn,
              { backgroundColor: "rgba(255, 59, 48, 0.12)" },
            ]}
            accessibilityLabel="Eliminar vacante"
          >
            <Trash2 size={14} color="#FF3B30" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 11,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  companySub: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  metaList: {
    gap: 5,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: {
    fontSize: 12.5,
    fontWeight: "500",
    flex: 1,
  },

  salaryText: {
    fontSize: 13,
    fontWeight: "700",
  },

  benefitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  benefitPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  benefitText: {
    fontSize: 11,
    fontWeight: "700",
  },

  moreBenefits: {
    fontSize: 11,
    fontWeight: "700",
  },

  footerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  applicantsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
  },

  applicantsText: {
    fontSize: 12,
    fontWeight: "700",
  },

  iconActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  miniBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.72,
  },
});
