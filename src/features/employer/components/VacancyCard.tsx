import * as Haptics from "expo-haptics";
import {
  Briefcase,
  ChevronRight,
  Eye,
  MapPin,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
  Users,
  Wallet,
} from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Spinner } from "@/components/ui/Spinner";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { CompanyLogo } from "./CompanyLogo";

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
  deleting?: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onViewApplicants: () => void;
  onDelete: () => void;
  onChangeStatus: (nextStatus: VacancyStatus) => void;
}

const MAX_VISIBLE_AVATARS = 3;

export function VacancyCard({
  vacancy,
  updating = false,
  deleting = false,
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

  const stripBg = isDark
    ? "rgba(255, 255, 255, 0.045)"
    : "rgba(240, 104, 8, 0.055)";
  const stripBorder = isDark
    ? "rgba(255, 255, 255, 0.09)"
    : "rgba(240, 104, 8, 0.16)";
  const avatarRingColor = isDark ? "#201C19" : "#FFF8F3";

  const dockBg = isDark ? "rgba(255, 255, 255, 0.045)" : "#F7F4F0";
  const dockBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.06)";
  const dividerColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";
  const pressBg = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.05)";
  const destructiveColor = isDark ? "#FF5A52" : "#D93830";
  const destructivePressBg = "rgba(255, 59, 48, 0.1)";

  const previewList = (vacancy.postulantes_preview ?? []).slice(
    0,
    MAX_VISIBLE_AVATARS,
  );
  const totalApplicants = vacancy.postulantes_count ?? 0;
  const overflowCount = Math.max(totalApplicants - previewList.length, 0);

  const triggerTap = (action: () => void) => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    action();
  };

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
        <CompanyLogo
          uri={vacancy.empresa?.logo_url}
          size={42}
          borderRadius={12}
        />
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
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isActive ? "#34C759" : theme.textMuted },
            ]}
          />
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

      {/* Sección dedicada de postulantes con fotos apiladas + contador (+3, +10, etc.) */}
      <Pressable
        onPress={() => triggerTap(onViewApplicants)}
        style={({ pressed }) => [
          styles.applicantsSection,
          { backgroundColor: stripBg, borderColor: stripBorder },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${totalApplicants} postulantes`}
      >
        {totalApplicants > 0 ? (
          <View style={styles.avatarStack}>
            {previewList.map((candidate, index) => {
              const initials = (candidate.nombre || "C")
                .slice(0, 2)
                .toUpperCase();
              return (
                <View
                  key={`${candidate.id_usuario}-${index}`}
                  style={[
                    styles.avatarRing,
                    {
                      borderColor: avatarRingColor,
                      marginLeft: index === 0 ? 0 : -11,
                      zIndex: MAX_VISIBLE_AVATARS - index,
                    },
                  ]}
                >
                  <ProfileAvatar
                    uri={candidate.foto_perfil}
                    initials={initials}
                    size={32}
                  />
                </View>
              );
            })}

            {overflowCount > 0 ? (
              <View
                style={[
                  styles.overflowBadge,
                  {
                    backgroundColor: theme.primary,
                    borderColor: avatarRingColor,
                    marginLeft: previewList.length > 0 ? -11 : 0,
                  },
                ]}
              >
                <Text style={styles.overflowBadgeText}>+{overflowCount}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View
            style={[
              styles.emptyApplicantsIcon,
              { backgroundColor: theme.inputBackground },
            ]}
          >
            <Users size={15} color={theme.textSecondary} />
          </View>
        )}

        <View style={styles.flexOne}>
          <Text style={[styles.applicantsTitle, { color: theme.text }]}>
            {totalApplicants > 0
              ? `${totalApplicants} postulante${totalApplicants === 1 ? "" : "s"}`
              : "Sin postulantes aún"}
          </Text>
          <Text
            style={[styles.applicantsSub, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {totalApplicants > 0
              ? "Toca para ver los perfiles postulados"
              : "Aquí aparecerán quienes se postulen"}
          </Text>
        </View>

        <ChevronRight size={16} color={theme.primary} />
      </Pressable>

      {/* Dock unificado de acciones estilo iOS (ícono arriba + texto nítido) */}
      <View
        style={[
          styles.actionDock,
          { backgroundColor: dockBg, borderColor: dockBorder },
        ]}
      >
        <Pressable
          onPress={() => triggerTap(onPreview)}
          style={({ pressed }) => [
            styles.dockItem,
            pressed && { backgroundColor: pressBg },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ver publicación"
        >
          <Eye size={18} strokeWidth={1.9} color={theme.text} />
          <Text style={[styles.dockLabel, { color: theme.text }]}>Ver</Text>
        </Pressable>

        <View
          style={[styles.dockDivider, { backgroundColor: dividerColor }]}
        />

        <Pressable
          onPress={() => triggerTap(onEdit)}
          style={({ pressed }) => [
            styles.dockItem,
            pressed && { backgroundColor: pressBg },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Editar vacante"
        >
          <Pencil size={17} strokeWidth={1.9} color={theme.text} />
          <Text style={[styles.dockLabel, { color: theme.text }]}>Editar</Text>
        </Pressable>

        <View
          style={[styles.dockDivider, { backgroundColor: dividerColor }]}
        />

        <Pressable
          disabled={updating || deleting}
          onPress={() =>
            triggerTap(() => onChangeStatus(isActive ? "pausada" : "activa"))
          }
          style={({ pressed }) => [
            styles.dockItem,
            { opacity: deleting ? 0.45 : 1 },
            pressed && { backgroundColor: pressBg },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isActive ? "Pausar vacante" : "Activar vacante"}
        >
          {updating ? (
            <Spinner
              size={20}
              strokeWidth={2.4}
              color={isActive ? theme.textSecondary : theme.primary}
            />
          ) : (
            <>
              {isActive ? (
                <PauseCircle
                  size={18}
                  strokeWidth={1.9}
                  color={theme.textSecondary}
                />
              ) : (
                <PlayCircle size={18} strokeWidth={1.9} color={theme.primary} />
              )}
              <Text
                style={[
                  styles.dockLabel,
                  { color: isActive ? theme.text : theme.primary },
                ]}
              >
                {isActive ? "Pausar" : "Activar"}
              </Text>
            </>
          )}
        </Pressable>

        <View
          style={[styles.dockDivider, { backgroundColor: dividerColor }]}
        />

        <Pressable
          disabled={deleting || updating}
          onPress={() => triggerTap(onDelete)}
          style={({ pressed }) => [
            styles.dockItem,
            { opacity: updating ? 0.45 : 1 },
            pressed && { backgroundColor: destructivePressBg },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Eliminar vacante"
        >
          {deleting ? (
            <Spinner size={20} strokeWidth={2.4} color={destructiveColor} />
          ) : (
            <>
              <Trash2 size={17} strokeWidth={1.9} color={destructiveColor} />
              <Text style={[styles.dockLabel, { color: destructiveColor }]}>
                Eliminar
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
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
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  companySub: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    fontSize: 13.5,
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

  applicantsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
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
    minWidth: 34,
    height: 34,
    paddingHorizontal: 6,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  overflowBadgeText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },

  emptyApplicantsIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  applicantsTitle: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  applicantsSub: {
    fontSize: 11.5,
    fontWeight: "500",
  },

  actionDock: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  dockItem: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  dockDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
  },

  dockLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  pressed: {
    opacity: 0.74,
  },
});
