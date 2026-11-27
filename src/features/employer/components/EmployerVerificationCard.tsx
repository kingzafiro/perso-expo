import {
  CheckCircle2,
  FileCheck2,
  FileText,
  ShieldCheck,
} from "lucide-react-native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface EmployerVerificationCardProps {
  verified: boolean;
  rfc?: string;
  legalName?: string;
  uploading: boolean;
  selectedFileName?: string | null;
}

export function EmployerVerificationCard({
  verified,
  rfc,
  legalName,
  uploading,
  selectedFileName,
}: EmployerVerificationCardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  if (verified && rfc) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.successSoft },
            ]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <ShieldCheck size={20} color={theme.success} />
            )}
          </View>
          <View style={styles.flexOne}>
            <Text style={[styles.title, { color: theme.text }]}>
              {uploading ? "Verificando nuevo PDF..." : "Empresa verificada"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {uploading && selectedFileName
                ? `Validando ${selectedFileName}`
                : "Datos extraídos y validados desde tu PDF fiscal"}
            </Text>
          </View>
          {!uploading ? (
            <CheckCircle2 size={20} color={theme.success} />
          ) : null}
        </View>

        <View
          style={[
            styles.extractedBox,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View style={styles.extractedRow}>
            <Text style={[styles.extractedLabel, { color: theme.textMuted }]}>
              RFC VALIDADO
            </Text>
            <Text style={[styles.extractedRfc, { color: theme.text }]}>
              {rfc}
            </Text>
          </View>

          {legalName ? (
            <View
              style={[
                styles.extractedRow,
                styles.extractedDivider,
                { borderTopColor: theme.inputBorder },
              ]}
            >
              <Text style={[styles.extractedLabel, { color: theme.textMuted }]}>
                RAZÓN SOCIAL / NOMBRE
              </Text>
              <Text style={[styles.extractedName, { color: theme.text }]}>
                {legalName}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: uploading ? theme.primaryBorder : cardBorder,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <FileText size={20} color={theme.primary} />
          )}
        </View>

        <View style={styles.flexOne}>
          <Text style={[styles.title, { color: theme.text }]}>
            {uploading
              ? "Verificando documento..."
              : "Constancia de Situación Fiscal (PDF)"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {uploading
              ? selectedFileName
                ? `Extrayendo RFC y nombre de ${selectedFileName}`
                : "Validando autenticidad, RFC y razón social..."
              : "PDF original descargado del SAT (máx. 8 MB)"}
          </Text>
        </View>
      </View>

      <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
        Validaremos tu RFC y extraeremos tu razón social automáticamente para
        activar la insignia de Empresa Verificada.
      </Text>

      <View style={[styles.statusPill, { backgroundColor: theme.primarySoft }]}>
        {uploading ? (
          <FileCheck2 size={13} color={theme.primary} />
        ) : (
          <ShieldCheck size={13} color={theme.primary} />
        )}
        <Text style={[styles.statusPillText, { color: theme.primary }]}>
          {uploading ? "Verificación en curso" : "Validación automática"}
        </Text>
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
    alignItems: "center",
    gap: 11,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  title: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  subtitle: {
    fontSize: 12.5,
    lineHeight: 17.5,
  },

  bodyText: {
    fontSize: 13,
    lineHeight: 19,
  },

  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  extractedBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  extractedRow: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 3,
  },

  extractedDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  extractedLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  extractedRfc: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  extractedName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
});
