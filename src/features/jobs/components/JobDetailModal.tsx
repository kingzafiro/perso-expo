import axios from "axios";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { VacancyDetailView } from "@/features/employer/components/VacancyDetailView";
import {
  VACANCY_REPORT_REASONS,
  type EmployerVacancy,
  type VacancyReportReason,
} from "@/features/employer/types/employer.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { useApplyToVacancy, useReportVacancy } from "../hooks/use-jobs";

interface JobDetailModalProps {
  vacancy: EmployerVacancy | null;
  onClose: () => void;
  onApplied?: (idVacante: number) => void;
}

function getErr(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

export function JobDetailModal({
  vacancy,
  onClose,
  onApplied,
}: JobDetailModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const applyMutation = useApplyToVacancy();
  const reportMutation = useReportVacancy();

  const [showApplyPrompt, setShowApplyPrompt] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [reportReason, setReportReason] =
    useState<VacancyReportReason>("fraude");
  const [reportDetails, setReportDetails] = useState("");

  if (!vacancy) return null;

  const sheetBg = isDark ? "#0D0B0A" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";

  const handleConfirmApply = async () => {
    try {
      const res = await applyMutation.mutateAsync({
        idVacante: vacancy.id_vacante,
        mensaje: coverMessage,
      });
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setShowApplyPrompt(false);
      setCoverMessage("");
      onApplied?.(vacancy.id_vacante);
      Alert.alert("¡Listo!", res.mensaje);
    } catch (error) {
      Alert.alert(
        "No se pudo postular",
        getErr(error, "Intenta nuevamente en unos segundos."),
      );
    }
  };

  const handleConfirmReport = async () => {
    try {
      const res = await reportMutation.mutateAsync({
        idVacante: vacancy.id_vacante,
        motivo: reportReason,
        detalles: reportDetails,
      });
      setShowReportPrompt(false);
      setReportDetails("");
      Alert.alert("Reporte enviado", res.mensaje);
    } catch (error) {
      Alert.alert(
        "No se pudo enviar",
        getErr(error, "No fue posible registrar tu reporte."),
      );
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: sheetBg }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16),
              borderBottomColor: theme.inputBorder,
            },
          ]}
        >
          <Text
            style={[styles.headerTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            Detalle de vacante
          </Text>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
          >
            <X size={18} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 28, 40) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <VacancyDetailView
            vacancy={vacancy}
            mode="candidate"
            applying={applyMutation.isPending}
            onApply={() => setShowApplyPrompt(true)}
            onReport={() => setShowReportPrompt(true)}
          />
        </ScrollView>

        {/* Sub-modal: Postularse con nota opcional */}
        <Modal
          visible={showApplyPrompt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowApplyPrompt(false)}
        >
          <View style={styles.backdrop}>
            <View style={[styles.dialog, { backgroundColor: cardBg }]}>
              <Text style={[styles.dialogTitle, { color: theme.text }]}>
                Postularse a {vacancy.titulo}
              </Text>
              <Text style={[styles.dialogSub, { color: theme.textSecondary }]}>
                La empresa recibirá tu perfil de Perso. Puedes añadir un mensaje
                breve opcional:
              </Text>
              <TextInput
                value={coverMessage}
                onChangeText={setCoverMessage}
                placeholder="Ej. Cuento con 2 años de experiencia y disponibilidad inmediata..."
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={600}
                style={[
                  styles.dialogInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
              />
              <View style={styles.dialogActions}>
                <AppButton
                  title="Enviar postulación"
                  loading={applyMutation.isPending}
                  onPress={() => void handleConfirmApply()}
                />
                <Pressable
                  onPress={() => setShowApplyPrompt(false)}
                  style={styles.cancelBtn}
                >
                  <Text
                    style={[styles.cancelText, { color: theme.textSecondary }]}
                  >
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sub-modal: Reportar empleo */}
        <Modal
          visible={showReportPrompt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReportPrompt(false)}
        >
          <View style={styles.backdrop}>
            <View style={[styles.dialog, { backgroundColor: cardBg }]}>
              <Text style={[styles.dialogTitle, { color: theme.text }]}>
                Reportar empleo
              </Text>
              <View style={styles.reasonsWrap}>
                {VACANCY_REPORT_REASONS.map((r) => {
                  const active = reportReason === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setReportReason(r.id)}
                      style={[
                        styles.reasonChip,
                        {
                          backgroundColor: active
                            ? theme.primarySoft
                            : theme.inputBackground,
                          borderColor: active
                            ? theme.primary
                            : theme.inputBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reasonText,
                          { color: active ? theme.primary : theme.text },
                        ]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={reportDetails}
                onChangeText={setReportDetails}
                placeholder="Detalles adicionales (opcional)"
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={500}
                style={[
                  styles.dialogInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
              />
              <View style={styles.dialogActions}>
                <AppButton
                  title="Enviar reporte"
                  loading={reportMutation.isPending}
                  onPress={() => void handleConfirmReport()}
                />
                <Pressable
                  onPress={() => setShowReportPrompt(false)}
                  style={styles.cancelBtn}
                >
                  <Text
                    style={[styles.cancelText, { color: theme.textSecondary }]}
                  >
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 16,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  dialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },

  dialogTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  dialogSub: {
    fontSize: 13,
    lineHeight: 19,
  },

  dialogInput: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },

  reasonsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1.2,
  },

  reasonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  dialogActions: {
    gap: 8,
    marginTop: 4,
  },

  cancelBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
});
