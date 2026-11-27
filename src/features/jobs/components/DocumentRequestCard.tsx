import { router } from "expo-router";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import type { DocumentAccessRequest } from "@/features/employer/types/applicant-profile.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface DocumentRequestCardProps {
  request: DocumentAccessRequest;
  loading?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
}

export function DocumentRequestCard({
  request,
  loading = false,
  onApprove,
  onReject,
  onRevoke,
}: DocumentRequestCardProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const missingCount = request.documentos_solicitados.filter(
    (d) => d.subido === false,
  ).length;

  const isPending = request.estado === "pendiente";
  const isApproved = request.estado === "aprobada";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.companyRow}>
          <View
            style={[
              styles.companyIcon,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <Building2 size={16} color={theme.primary} />
          </View>
          <View style={styles.flexOne}>
            <View style={styles.companyNameRow}>
              <Text
                style={[styles.companyName, { color: theme.text }]}
                numberOfLines={1}
              >
                {request.empresa?.nombre_comercial || "Empresa en Perso"}
              </Text>
              {request.empresa?.verificada ? (
                <BadgeCheck size={14} color="#34C759" />
              ) : null}
            </View>
            {request.vacante?.titulo ? (
              <Text
                style={[styles.vacancySub, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                Vacante: {request.vacante.titulo}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={[styles.headline, { color: theme.text }]}>
        Esta empresa quiere saber más sobre ti
      </Text>

      {request.mensaje ? (
        <Text
          style={[
            styles.messageBox,
            {
              color: theme.textSecondary,
              backgroundColor: theme.inputBackground,
            },
          ]}
        >
          “{request.mensaje}”
        </Text>
      ) : null}

      <View style={styles.docsBlock}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Documentos solicitados
        </Text>

        {request.documentos_solicitados.map((doc) => {
          const uploaded = doc.subido !== false;
          return (
            <View
              key={doc.tipo}
              style={[
                styles.docRow,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              {uploaded ? (
                <CheckCircle2 size={15} color="#34C759" />
              ) : (
                <UploadCloud size={15} color={theme.primary} />
              )}
              <View style={styles.flexOne}>
                <Text style={[styles.docTitle, { color: theme.text }]}>
                  {doc.etiqueta}
                </Text>
                <Text
                  style={[
                    styles.docStatus,
                    { color: uploaded ? "#34C759" : theme.primary },
                  ]}
                >
                  {uploaded ? "Listo en tu expediente" : "Aún no cargado"}
                </Text>
              </View>

              {!uploaded ? (
                <Pressable
                  onPress={() => router.push("/(app)/tu/documentos")}
                  style={[
                    styles.uploadLink,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Text
                    style={[styles.uploadLinkText, { color: theme.primary }]}
                  >
                    Subir
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      {missingCount > 0 && (isPending || isApproved) ? (
        <Text style={[styles.missingHint, { color: theme.textSecondary }]}>
          Te {missingCount === 1 ? "falta subir 1 documento" : `faltan subir ${missingCount} documentos`}. Puedes subirlos en Mis documentos y al autorizar quedarán visibles para esta empresa.
        </Text>
      ) : null}

      {isPending ? (
        <View style={styles.actions}>
          <AppButton
            title="Autorizar acceso a mis documentos"
            loading={loading}
            onPress={onApprove}
          />
          <Pressable
            disabled={loading}
            onPress={onReject}
            style={({ pressed }) => [
              styles.rejectBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.rejectText, { color: theme.textSecondary }]}>
              Rechazar solicitud
            </Text>
          </Pressable>
        </View>
      ) : isApproved ? (
        <View style={styles.approvedFooter}>
          <View style={styles.approvedBadge}>
            <ShieldCheck size={15} color="#34C759" />
            <Text style={styles.approvedText}>Acceso autorizado</Text>
          </View>
          <Pressable
            disabled={loading}
            onPress={onRevoke}
            style={({ pressed }) => [
              styles.revokeBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.revokeText}>Revocar acceso</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.closedBadge,
            { backgroundColor: theme.inputBackground },
          ]}
        >
          <ShieldAlert size={14} color={theme.textMuted} />
          <Text style={[styles.closedText, { color: theme.textMuted }]}>
            {request.estado === "rechazada"
              ? "Solicitud rechazada · Documentos privados"
              : "Acceso revocado · Documentos privados"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  companyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  companyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  flexOne: {
    flex: 1,
    gap: 1,
  },

  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  companyName: {
    fontSize: 15,
    fontWeight: "800",
    flexShrink: 1,
  },

  vacancySub: {
    fontSize: 12.5,
  },

  headline: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  messageBox: {
    fontSize: 13,
    lineHeight: 19,
    padding: 11,
    borderRadius: 13,
  },

  docsBlock: {
    gap: 7,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },

  docTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  docStatus: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  uploadLink: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },

  uploadLinkText: {
    fontSize: 12,
    fontWeight: "700",
  },

  missingHint: {
    fontSize: 12,
    lineHeight: 17,
  },

  actions: {
    gap: 8,
    marginTop: 2,
  },

  rejectBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },

  rejectText: {
    fontSize: 13.5,
    fontWeight: "600",
  },

  approvedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 2,
  },

  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },

  approvedText: {
    color: "#34C759",
    fontSize: 12.5,
    fontWeight: "700",
  },

  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  revokeText: {
    color: "#FF3B30",
    fontSize: 12.5,
    fontWeight: "700",
  },

  closedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 10,
    borderRadius: 12,
  },

  closedText: {
    fontSize: 12,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.7,
  },
});
