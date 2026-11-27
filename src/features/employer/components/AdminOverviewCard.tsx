import * as Haptics from "expo-haptics";
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Flag,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  useAdminOverview,
  useAdminReports,
} from "../hooks/use-employer-vacancies";
import { VACANCY_REPORT_REASONS } from "../types/employer.types";

const REASON_LABELS: Record<string, string> = Object.fromEntries(
  VACANCY_REPORT_REASONS.map((item) => [item.id, item.label]),
);

export function AdminOverviewCard() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const { data: overview } = useAdminOverview(true);
  const { data: reports = [] } = useAdminReports(true);
  const [showReports, setShowReports] = useState(false);

  const pendingReports = overview?.reportesPendientes ?? 0;
  const hasAlerts = pendingReports > 0;

  const borderColor = isDark
    ? "rgba(255, 160, 100, 0.22)"
    : "rgba(240, 104, 8, 0.2)";
  const tileBg = isDark
    ? "rgba(255, 255, 255, 0.045)"
    : "rgba(255, 255, 255, 0.82)";
  const tileBorder = isDark
    ? "rgba(255, 255, 255, 0.075)"
    : "rgba(23, 18, 14, 0.06)";
  const dividerColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.07)";

  const metrics = [
    {
      key: "empresas",
      label: "Empresas",
      caption: "Registradas",
      value: overview?.empresas ?? 0,
      icon: Building2,
      tint: "#F06808",
      tintBg: isDark ? "rgba(240, 104, 8, 0.16)" : "rgba(240, 104, 8, 0.11)",
    },
    {
      key: "activas",
      label: "Vacantes",
      caption: "Activas hoy",
      value: overview?.vacantesActivas ?? 0,
      icon: Briefcase,
      tint: "#0A84FF",
      tintBg: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(10, 132, 255, 0.1)",
    },
    {
      key: "postulaciones",
      label: "Postulaciones",
      caption: "Recibidas",
      value: overview?.postulaciones ?? 0,
      icon: Users,
      tint: "#AF52DE",
      tintBg: isDark ? "rgba(175, 82, 222, 0.16)" : "rgba(175, 82, 222, 0.1)",
    },
    {
      key: "reportes",
      label: "Reportes",
      caption: hasAlerts ? "Por revisar" : "Todo al día",
      value: pendingReports,
      icon: Flag,
      tint: hasAlerts ? "#FF9F0A" : "#34C759",
      tintBg: hasAlerts
        ? "rgba(255, 159, 10, 0.16)"
        : "rgba(52, 199, 89, 0.14)",
    },
  ];

  return (
    <View style={[styles.card, { borderColor }]}>
      {/* Fondo vectorial sutil con degradado y halo de luz cálida */}
      <View pointerEvents="none" style={styles.bgLayer}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="adminBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop
                offset="0%"
                stopColor={isDark ? "#201914" : "#FFFFFF"}
                stopOpacity="1"
              />
              <Stop
                offset="100%"
                stopColor={isDark ? "#14100E" : "#FFF8F2"}
                stopOpacity="1"
              />
            </LinearGradient>
            <RadialGradient id="adminHalo" cx="92%" cy="6%" r="58%">
              <Stop
                offset="0%"
                stopColor="#F06808"
                stopOpacity={isDark ? "0.24" : "0.14"}
              />
              <Stop offset="100%" stopColor="#F06808" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#adminBaseGrad)" />
          <Circle cx="92%" cy="8%" r="160" fill="url(#adminHalo)" />
        </Svg>
      </View>

      {/* Cabecera ejecutiva */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.shieldMedallion,
              {
                backgroundColor: isDark
                  ? "rgba(240, 104, 8, 0.2)"
                  : "rgba(240, 104, 8, 0.12)",
                borderColor: isDark
                  ? "rgba(255, 160, 100, 0.3)"
                  : "rgba(240, 104, 8, 0.22)",
              },
            ]}
          >
            <ShieldCheck size={20} strokeWidth={2.1} color={theme.primary} />
          </View>

          <View style={styles.flexOne}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>
              SUPER ADMINISTRADOR
            </Text>
            <Text style={[styles.headline, { color: theme.text }]}>
              Centro de control
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.livePill,
            {
              backgroundColor: isDark
                ? "rgba(52, 199, 89, 0.14)"
                : "rgba(52, 199, 89, 0.12)",
            },
          ]}
        >
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Acceso total</Text>
        </View>
      </View>

      {/* Cuadrícula Bento 2×2 con jerarquía tipográfica clara */}
      <View style={styles.bentoGrid}>
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          const highlightAlert = metric.key === "reportes" && hasAlerts;

          return (
            <View
              key={metric.key}
              style={[
                styles.bentoTile,
                {
                  backgroundColor: tileBg,
                  borderColor: highlightAlert
                    ? "rgba(255, 159, 10, 0.35)"
                    : tileBorder,
                },
              ]}
            >
              <View style={styles.tileTop}>
                <View
                  style={[
                    styles.tileIconBadge,
                    { backgroundColor: metric.tintBg },
                  ]}
                >
                  <IconComponent size={14} strokeWidth={2.1} color={metric.tint} />
                </View>
                <Text
                  style={[styles.tileLabel, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {metric.label}
                </Text>
              </View>

              <Text
                style={[
                  styles.tileValue,
                  {
                    color: highlightAlert ? "#FF9F0A" : theme.text,
                  },
                ]}
              >
                {metric.value.toLocaleString("es-MX")}
              </Text>

              <Text
                style={[
                  styles.tileCaption,
                  {
                    color: highlightAlert ? "#FF9F0A" : theme.textMuted,
                  },
                ]}
              >
                {metric.caption}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Sección desplegable de reportes recientes */}
      {reports.length > 0 ? (
        <View
          style={[styles.reportsSection, { borderTopColor: dividerColor }]}
        >
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") void Haptics.selectionAsync();
              setShowReports((prev) => !prev);
            }}
            style={({ pressed }) => [
              styles.reportsToggle,
              {
                backgroundColor: isDark
                  ? "rgba(255, 159, 10, 0.1)"
                  : "rgba(255, 159, 10, 0.09)",
                borderColor: "rgba(255, 159, 10, 0.22)",
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.reportsToggleLeft}>
              <Flag size={14} color="#FF9F0A" />
              <Text style={[styles.reportsToggleText, { color: theme.text }]}>
                Reportes de vacantes
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{reports.length}</Text>
              </View>
            </View>
            {showReports ? (
              <ChevronUp size={16} color={theme.textSecondary} />
            ) : (
              <ChevronDown size={16} color={theme.textSecondary} />
            )}
          </Pressable>

          {showReports ? (
            <View style={styles.reportsList}>
              {reports.slice(0, 5).map((r) => (
                <View
                  key={r.id_reporte}
                  style={[
                    styles.reportItem,
                    { backgroundColor: tileBg, borderColor: tileBorder },
                  ]}
                >
                  <View style={styles.reportTopRow}>
                    <Text
                      style={[styles.reportTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {r.vacante?.titulo || "Vacante"}
                    </Text>
                    <View style={styles.reasonPill}>
                      <Text style={styles.reasonPillText} numberOfLines={1}>
                        {REASON_LABELS[r.motivo] ?? r.motivo}
                      </Text>
                    </View>
                  </View>
                  {r.vacante?.empresa ? (
                    <Text
                      style={[styles.reportMeta, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
                      {r.vacante.empresa}
                    </Text>
                  ) : null}
                  {r.detalles ? (
                    <Text
                      style={[
                        styles.reportDetails,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {r.detalles}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    overflow: "hidden",
    position: "relative",
  },

  bgLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  flexOne: {
    flex: 1,
    gap: 1,
  },

  shieldMedallion: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
  },

  headline: {
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
  },

  liveText: {
    color: "#34C759",
    fontSize: 11,
    fontWeight: "700",
  },

  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  bentoTile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 5,
  },

  tileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  tileIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  tileLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },

  tileValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },

  tileCaption: {
    fontSize: 11,
    fontWeight: "600",
  },

  reportsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 9,
  },

  reportsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },

  reportsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  reportsToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },

  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#FF9F0A",
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  reportsList: {
    gap: 7,
  },

  reportItem: {
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    gap: 4,
  },

  reportTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  reportTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },

  reasonPill: {
    backgroundColor: "rgba(255, 159, 10, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 140,
  },

  reasonPillText: {
    color: "#FF9F0A",
    fontSize: 10.5,
    fontWeight: "700",
  },

  reportMeta: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  reportDetails: {
    fontSize: 12,
    lineHeight: 17,
  },

  pressed: {
    opacity: 0.78,
  },
});
