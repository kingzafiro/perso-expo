import { ChevronDown, ChevronUp, Flag, Shield } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAdminOverview, useAdminReports } from "../hooks/use-employer-vacancies";

export function AdminOverviewCard() {
  const { data: overview } = useAdminOverview(true);
  const { data: reports = [] } = useAdminReports(true);
  const [showReports, setShowReports] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.adminPill}>
          <Shield size={13} color="#FFA064" />
          <Text style={styles.adminPillText}>SUPER ADMINISTRADOR</Text>
        </View>
        <Text style={styles.unlimitedText}>Todo habilitado</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{overview?.empresas ?? 0}</Text>
          <Text style={styles.statLabel}>Empresas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{overview?.vacantesActivas ?? 0}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{overview?.postulaciones ?? 0}</Text>
          <Text style={styles.statLabel}>Postulaciones</Text>
        </View>
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statNumber,
              (overview?.reportesPendientes ?? 0) > 0 && { color: "#FF9F0A" },
            ]}
          >
            {overview?.reportesPendientes ?? 0}
          </Text>
          <Text style={styles.statLabel}>Reportes</Text>
        </View>
      </View>

      {reports.length > 0 ? (
        <View style={styles.reportsWrap}>
          <Pressable
            onPress={() => setShowReports((prev) => !prev)}
            style={styles.reportsToggle}
          >
            <View style={styles.reportsToggleLeft}>
              <Flag size={13} color="#FF9F0A" />
              <Text style={styles.reportsToggleText}>
                Ver reportes recientes ({reports.length})
              </Text>
            </View>
            {showReports ? (
              <ChevronUp size={15} color="#FFFFFF" />
            ) : (
              <ChevronDown size={15} color="#FFFFFF" />
            )}
          </Pressable>

          {showReports ? (
            <View style={styles.reportsList}>
              {reports.slice(0, 5).map((r) => (
                <View key={r.id_reporte} style={styles.reportItem}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    {r.vacante?.titulo || "Vacante"} · {r.motivo}
                  </Text>
                  {r.detalles ? (
                    <Text style={styles.reportDetails} numberOfLines={2}>
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(240, 104, 8, 0.34)",
    backgroundColor: "#17120E",
    padding: 12,
    gap: 10,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  adminPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(240, 104, 8, 0.2)",
  },

  adminPillText: {
    color: "#FFA064",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  unlimitedText: {
    color: "#4CD964",
    fontSize: 11.5,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    gap: 6,
  },

  statBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 11,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 1,
  },

  statNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  statLabel: {
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: 10,
    fontWeight: "600",
  },

  reportsWrap: {
    gap: 8,
  },

  reportsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },

  reportsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  reportsToggleText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },

  reportsList: {
    gap: 6,
  },

  reportItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 9,
    gap: 2,
  },

  reportTitle: {
    color: "#FFE5D1",
    fontSize: 12,
    fontWeight: "700",
  },

  reportDetails: {
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: 11.5,
  },
});
