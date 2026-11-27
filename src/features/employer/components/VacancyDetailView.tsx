import {
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  Flag,
  GraduationCap,
  MapPin,
  Shield,
  Wallet,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { CompanyLogo } from "./CompanyLogo";
import {
  formatVacancyLocation,
  formatVacancySalary,
  formatVacancySchedule,
  VACANCY_CONTRACTS,
  VACANCY_MODALITIES,
  type EmployerVacancy,
} from "../types/employer.types";

interface VacancyDetailViewProps {
  vacancy: EmployerVacancy;
  mode?: "candidate" | "preview";
  showAdminMeta?: boolean;
  applying?: boolean;
  onApply?: () => void;
  onReport?: () => void;
}

function splitCleanLines(text?: string) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•●\-*]\s*/, "").trim())
    .filter(Boolean);
}

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  enviada: "Postulación enviada",
  en_revision: "En revisión por la empresa",
  entrevista: "Seleccionado para entrevista",
  descartada: "Proceso finalizado",
  contratado: "¡Contratado!",
};

export function VacancyDetailView({
  vacancy,
  mode = "candidate",
  showAdminMeta = false,
  applying = false,
  onApply,
  onReport,
}: VacancyDetailViewProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const modalityLabel =
    VACANCY_MODALITIES.find((m) => m.id === vacancy.modalidad)?.label ??
    vacancy.modalidad;
  const contractLabel =
    VACANCY_CONTRACTS.find((c) => c.id === vacancy.tipo_contrato)?.label ??
    vacancy.tipo_contrato;
  const salaryText = formatVacancySalary(
    vacancy.salario_min,
    vacancy.salario_max,
    vacancy.salario_periodo,
  );
  const locationText = formatVacancyLocation(vacancy) || vacancy.ciudad;
  const companyName = vacancy.empresa?.nombre_comercial || "Empresa en Perso";

  const responsibilities = splitCleanLines(vacancy.responsabilidades);
  const requirements = splitCleanLines(vacancy.requisitos);
  const techProfile = splitCleanLines(vacancy.perfil_tecnico);
  const offers = splitCleanLines(vacancy.ofrecemos);

  return (
    <View style={styles.container}>
      {/* Cabecera estilo Indeed */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <Text style={[styles.jobTitle, { color: theme.text }]}>
          {vacancy.titulo}
        </Text>

        <View style={styles.companyHeaderRow}>
          <CompanyLogo
            uri={vacancy.empresa?.logo_url}
            size={50}
            borderRadius={14}
          />
          <View style={styles.companyHeaderInfo}>
            <View style={styles.companyRow}>
              <Text
                style={[styles.companyName, { color: theme.text }]}
                numberOfLines={1}
              >
                {companyName}
              </Text>
              {vacancy.empresa?.verificada ? (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck size={14} color="#34C759" />
                  <Text style={styles.verifiedText}>Verificada</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.metaSummary, { color: theme.textSecondary }]}>
              {locationText} · {modalityLabel}
            </Text>
          </View>
        </View>

        <View
          style={[styles.salaryBanner, { backgroundColor: theme.primarySoft }]}
        >
          <Wallet size={15} color={theme.primary} />
          <Text style={[styles.salaryBannerText, { color: theme.primary }]}>
            {salaryText}
          </Text>
        </View>

        {mode === "candidate" ? (
          vacancy.ya_postulado ? (
            <View style={styles.appliedBanner}>
              <CheckCircle2 size={17} color="#34C759" />
              <Text style={styles.appliedBannerText}>
                {APPLICATION_STATUS_LABELS[vacancy.estado_postulacion || "enviada"] ??
                  "Postulación enviada"}
              </Text>
            </View>
          ) : onApply ? (
            <AppButton
              title="Postularse ahora"
              loading={applying}
              onPress={onApply}
            />
          ) : null
        ) : null}
      </View>

      {/* Detalles del empleo */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Detalles del empleo
        </Text>

        <View style={styles.detailItem}>
          <Wallet size={16} color={theme.textSecondary} />
          <View style={styles.detailBody}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Sueldo
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {salaryText}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Briefcase size={16} color={theme.textSecondary} />
          <View style={styles.detailBody}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Tipo de empleo
            </Text>
            <View style={styles.pillsRow}>
              <View
                style={[styles.pill, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.pillText, { color: theme.text }]}>
                  {contractLabel}
                </Text>
              </View>
              <View
                style={[styles.pill, { backgroundColor: theme.inputBackground }]}
              >
                <Text style={[styles.pillText, { color: theme.text }]}>
                  {modalityLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {vacancy.horario ? (
          <View style={styles.detailItem}>
            <Clock size={16} color={theme.textSecondary} />
            <View style={styles.detailBody}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Horario
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatVacancySchedule(vacancy.horario)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.detailItem}>
          <MapPin size={16} color={theme.textSecondary} />
          <View style={styles.detailBody}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Lugar de trabajo
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {locationText}
            </Text>
          </View>
        </View>

        {vacancy.experiencia || vacancy.escolaridad ? (
          <View style={styles.detailItem}>
            <GraduationCap size={16} color={theme.textSecondary} />
            <View style={styles.detailBody}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Perfil solicitado
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {[vacancy.escolaridad, vacancy.experiencia]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          </View>
        ) : null}

        {vacancy.beneficios.length > 0 ? (
          <View style={styles.detailItem}>
            <Award size={16} color={theme.primary} />
            <View style={styles.detailBody}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Beneficios y prestaciones
              </Text>
              <View style={styles.pillsRow}>
                {vacancy.beneficios.map((benefit) => (
                  <View
                    key={benefit}
                    style={[
                      styles.benefitPill,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <Text
                      style={[styles.benefitPillText, { color: theme.primary }]}
                    >
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* Descripción completa del empleo */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Descripción completa del empleo
        </Text>

        <Text style={[styles.paragraph, { color: theme.text }]}>
          {vacancy.descripcion}
        </Text>

        {responsibilities.length > 0 ? (
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>
              Principales responsabilidades
            </Text>
            {responsibilities.map((line, idx) => (
              <View key={`${idx}-${line.slice(0, 12)}`} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: theme.primary }]}>
                  •
                </Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {requirements.length > 0 ? (
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>
              Perfil del candidato y requisitos
            </Text>
            {requirements.map((line, idx) => (
              <View key={`${idx}-${line.slice(0, 12)}`} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: theme.primary }]}>
                  •
                </Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {techProfile.length > 0 ? (
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>
              Conocimientos técnicos y competencias
            </Text>
            {techProfile.map((line, idx) => (
              <View key={`${idx}-${line.slice(0, 12)}`} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: theme.primary }]}>
                  •
                </Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {offers.length > 0 ? (
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>
              ¿Qué ofrecemos?
            </Text>
            {offers.map((line, idx) => (
              <View key={`${idx}-${line.slice(0, 12)}`} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: "#34C759" }]}>✓</Text>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {showAdminMeta && vacancy.contacto_visible ? (
          <View
            style={[
              styles.recruiterBox,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Shield size={15} color={theme.primary} />
            <Text style={[styles.recruiterText, { color: theme.textSecondary }]}>
              Solo admin · Reclutador: {vacancy.contacto_visible}
            </Text>
          </View>
        ) : null}
      </View>

      {mode === "candidate" && onReport ? (
        <Pressable
          onPress={onReport}
          style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]}
        >
          <Flag size={14} color={theme.textMuted} />
          <Text style={[styles.reportText, { color: theme.textMuted }]}>
            Reportar empleo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  heroCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
  },

  jobTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.45,
  },

  companyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  companyHeaderInfo: {
    flex: 1,
    gap: 3,
  },

  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  companyName: {
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },

  verifiedText: {
    color: "#34C759",
    fontSize: 11.5,
    fontWeight: "700",
  },

  metaSummary: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  salaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    alignSelf: "flex-start",
  },

  salaryBannerText: {
    fontSize: 14,
    fontWeight: "800",
  },

  appliedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },

  appliedBannerText: {
    color: "#34C759",
    fontSize: 14.5,
    fontWeight: "700",
  },

  sectionCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  detailBody: {
    flex: 1,
    gap: 4,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  pillText: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  benefitPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  benefitPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  paragraph: {
    fontSize: 14,
    lineHeight: 21,
  },

  subSection: {
    gap: 7,
    paddingTop: 4,
  },

  subSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  bulletDot: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },

  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
  },

  recruiterBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },

  recruiterText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
  },

  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
  },

  reportText: {
    fontSize: 13,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.7,
  },
});
