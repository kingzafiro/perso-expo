import axios from "axios";
import * as Haptics from "expo-haptics";
import { ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Spinner } from "@/components/ui/Spinner";
import { DocumentRequestCard } from "@/features/jobs/components/DocumentRequestCard";
import {
  useMyDocumentRequests,
  useRespondDocumentRequest,
} from "@/features/jobs/hooks/use-jobs";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

function extractErr(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

export default function SolicitudesDocumentosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const {
    data: requests = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMyDocumentRequests();
  const respondMutation = useRespondDocumentRequest();
  const [busyId, setBusyId] = useState<number | null>(null);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const handleAction = async (
    idSolicitud: number,
    accion: "aprobar" | "rechazar" | "revocar",
  ) => {
    setBusyId(idSolicitud);
    try {
      const res = await respondMutation.mutateAsync({ idSolicitud, accion });
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      Alert.alert("Actualizado", res.mensaje);
    } catch (error) {
      Alert.alert(
        "No se pudo completar",
        extractErr(error, "Intenta nuevamente."),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Solicitudes de documentos" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loaderBox}>
            <Spinner size={26} strokeWidth={2.6} color={theme.primary} />
          </View>
        ) : requests.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}
            >
              <ShieldCheck size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Tus documentos están protegidos
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Cuando una empresa a la que te postulaste quiera revisar tus
              documentos oficiales, recibirás una solicitud aquí para decidir si
              autorizas el acceso.
            </Text>
          </View>
        ) : (
          requests.map((req) => (
            <DocumentRequestCard
              key={req.id_solicitud}
              request={req}
              loading={busyId === req.id_solicitud}
              onApprove={() => void handleAction(req.id_solicitud, "aprobar")}
              onReject={() =>
                Alert.alert(
                  "Rechazar solicitud",
                  "La empresa no podrá ver tus documentos oficiales.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Rechazar",
                      style: "destructive",
                      onPress: () =>
                        void handleAction(req.id_solicitud, "rechazar"),
                    },
                  ],
                )
              }
              onRevoke={() =>
                Alert.alert(
                  "Revocar acceso",
                  "La empresa dejará de tener acceso inmediato a tus documentos.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Revocar",
                      style: "destructive",
                      onPress: () =>
                        void handleAction(req.id_solicitud, "revocar"),
                    },
                  ],
                )
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 120,
    gap: 14,
  },

  loaderBox: {
    paddingVertical: 48,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 9,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
  },
});
