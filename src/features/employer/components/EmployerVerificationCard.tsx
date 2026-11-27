import {
  CheckCircle2,
  FileCheck2,
  FileUp,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface EmployerVerificationCardProps {
  verified: boolean;
  rfc?: string;
  legalName?: string;
  uploading: boolean;
  selectedFileName?: string | null;
  onPickPdf: () => void;
}

export function EmployerVerificationCard({
  verified,
  rfc,
  legalName,
  uploading,
  selectedFileName,
  onPickPdf,
}: EmployerVerificationCardProps) {
  const theme = useTheme();

  if (verified && rfc) {
    return (
      <View
        style={[
          styles.verifiedCard,
          {
            backgroundColor: "rgba(52, 199, 89, 0.08)",
            borderColor: "rgba(52, 199, 89, 0.35)",
          },
        ]}
      >
        <View style={styles.verifiedHeader}>
          <View style={styles.verifiedIcon}>
            <ShieldCheck size={20} color="#34C759" />
          </View>
          <View style={styles.flexOne}>
            <Text style={[styles.verifiedTitle, { color: theme.text }]}>
              Empresa verificada con IA
            </Text>
            <Text
              style={[styles.verifiedSubtitle, { color: theme.textSecondary }]}
            >
              Datos extraídos y validados desde tu PDF fiscal
            </Text>
          </View>
          <CheckCircle2 size={20} color="#34C759" />
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

        <Pressable
          onPress={onPickPdf}
          disabled={uploading}
          style={({ pressed }) => [
            styles.replaceBtn,
            { borderColor: theme.inputBorder },
            pressed && styles.pressed,
          ]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <RefreshCw size={14} color={theme.textSecondary} />
          )}
          <Text style={[styles.replaceText, { color: theme.textSecondary }]}>
            {uploading ? "Analizando nuevo PDF..." : "Reemplazar documento PDF"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPickPdf}
      disabled={uploading}
      style={({ pressed }) => [
        styles.uploadCard,
        {
          backgroundColor: theme.inputBackground,
          borderColor: uploading ? theme.primary : theme.inputBorder,
        },
        pressed && !uploading && styles.pressed,
      ]}
    >
      <View
        style={[styles.uploadIconBox, { backgroundColor: theme.primarySoft }]}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <FileUp size={24} color={theme.primary} />
        )}
      </View>

      <View style={styles.uploadBody}>
        <Text style={[styles.uploadTitle, { color: theme.text }]}>
          {uploading
            ? "Analizando documento con IA..."
            : "Subir Constancia de Situación Fiscal (PDF)"}
        </Text>
        <Text style={[styles.uploadDesc, { color: theme.textSecondary }]}>
          {uploading
            ? selectedFileName
              ? `Extrayendo RFC y nombre de ${selectedFileName}`
              : "Validando autenticidad, RFC y razón social..."
            : "Sube tu PDF del SAT (máx. 8 MB). Nuestra IA validará tu RFC y extraerá el nombre fiscal automáticamente."}
        </Text>
      </View>

      <View style={[styles.aiPill, { backgroundColor: theme.primarySoft }]}>
        {uploading ? (
          <FileCheck2 size={13} color={theme.primary} />
        ) : (
          <Sparkles size={13} color={theme.primary} />
        )}
        <Text style={[styles.aiPillText, { color: theme.primary }]}>
          {uploading ? "Verificación en curso" : "Validación automática con IA"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 18,
    alignItems: "center",
    gap: 12,
  },

  uploadIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  uploadBody: {
    alignItems: "center",
    gap: 5,
  },

  uploadTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    textAlign: "center",
  },

  uploadDesc: {
    fontSize: 13,
    lineHeight: 18.5,
    textAlign: "center",
  },

  aiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  aiPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  verifiedCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 15,
    gap: 13,
  },

  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  verifiedIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(52, 199, 89, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  flexOne: {
    flex: 1,
    gap: 1,
  },

  verifiedTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  verifiedSubtitle: {
    fontSize: 12.5,
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

  replaceBtn: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  replaceText: {
    fontSize: 13,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.72,
  },
});
