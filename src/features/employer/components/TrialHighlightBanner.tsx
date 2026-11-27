import { CalendarCheck2, ShieldCheck } from "lucide-react-native";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface TrialHighlightBannerProps {
  trialDays?: number;
}

export function TrialHighlightBanner({
  trialDays = 14,
}: TrialHighlightBannerProps) {
  const theme = useTheme();
  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.primarySoft,
          borderColor: theme.primaryBorder,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary }]}>
          <CalendarCheck2 size={15} color="#FFFFFF" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.primary }]}>
            {trialDays} días de prueba gratis · $0 hoy
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Acceso completo inmediato para publicar vacantes
          </Text>
        </View>
      </View>

      <View style={styles.trustRow}>
        <ShieldCheck size={14} color={theme.success} />
        <Text style={[styles.trustText, { color: theme.text }]}>
          Cobro gestionado por {storeName}. Cancela cuando quieras antes del día{" "}
          {trialDays} sin cargo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    gap: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  subtitle: {
    fontSize: 12.5,
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  trustText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
