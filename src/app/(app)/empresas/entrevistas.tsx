import axios from "axios";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Platform, StyleSheet, View } from "react-native";

import { ApplicantProfileModal } from "@/features/employer/components/ApplicantProfileModal";
import { EmployerInterviewRegistry } from "@/features/employer/components/EmployerInterviewRegistry";
import { ScheduleInterviewOverlay } from "@/features/employer/components/ScheduleInterviewOverlay";
import {
  useCancelEmployerInterview,
  useEmployerInterviews,
  useRescheduleEmployerInterview,
} from "@/features/employer/hooks/use-interviews";
import type {
  InterviewPass,
  ScheduleInterviewInput,
} from "@/features/employer/types/interviews.types";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEmployerStore } from "@/stores/employer.store";

function extractErr(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

export default function TusEntrevistasEmpresaScreen() {
  const isDark = useColorScheme() === "dark";
  const params = useLocalSearchParams<{ highlight?: string }>();

  const highlightInterviewId = useMemo(() => {
    const parsed = Number(params.highlight);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.highlight]);

  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const canEnter = isAdmin || hasAccess;

  const {
    data: interviews = [],
    isLoading,
    refetch,
  } = useEmployerInterviews(canEnter);
  const rescheduleInterview = useRescheduleEmployerInterview();
  const cancelInterview = useCancelEmployerInterview();

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [reschedulingPass, setReschedulingPass] =
    useState<InterviewPass | null>(null);
  const [viewingProfile, setViewingProfile] = useState<{
    idPostulacion: number;
    idVacante: number;
  } | null>(null);

  const screenBg = isDark ? "#000000" : "#F5F2EF";

  const handleRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleSubmitReschedule = async (input: ScheduleInterviewInput) => {
    if (!reschedulingPass) return;
    try {
      await rescheduleInterview.mutateAsync({
        idPostulacion: reschedulingPass.id_postulacion,
        idVacante: reschedulingPass.id_vacante,
        input,
      });
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setReschedulingPass(null);
      Alert.alert(
        "Entrevista reprogramada",
        "La entrevista anterior quedó deshabilitada y se envió un nuevo Pase QR al candidato.",
      );
    } catch (error) {
      Alert.alert(
        "No se pudo reprogramar",
        extractErr(error, "No fue posible reprogramar la entrevista."),
      );
    }
  };

  const executeCancelInterview = async (pass: InterviewPass) => {
    setCancelingId(pass.id_entrevista);
    try {
      const res = await cancelInterview.mutateAsync(pass.id_entrevista);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }
      Alert.alert("Entrevista cancelada", res.mensaje);
    } catch (error) {
      Alert.alert(
        "No se pudo cancelar",
        extractErr(error, "No fue posible cancelar la entrevista."),
      );
    } finally {
      setCancelingId(null);
    }
  };

  const handleConfirmCancel = (pass: InterviewPass) => {
    const candidate = pass.candidato?.nombre || "este candidato";
    const message = `¿Estás seguro de cancelar la entrevista de ${candidate}? El Pase QR quedará deshabilitado y se le notificará.`;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        void executeCancelInterview(pass);
      }
      return;
    }

    Alert.alert("¿Cancelar entrevista?", message, [
      { text: "Volver", style: "cancel" },
      {
        text: "Sí, cancelar",
        style: "destructive",
        onPress: () => {
          void executeCancelInterview(pass);
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Tus entrevistas" />

      {/* Registro con Reprogramar / Cancelar y Ver perfil (sin aprobar/rechazar QR) */}
      <EmployerInterviewRegistry
        interviews={interviews}
        isLoading={isLoading}
        refreshing={manualRefreshing}
        screenBg={screenBg}
        bottomPadding={120}
        highlightInterviewId={highlightInterviewId}
        allowResolve={false}
        allowManage
        cancelingId={cancelingId}
        onRefresh={() => void handleRefresh()}
        onReschedule={(pass) => setReschedulingPass(pass)}
        onCancelInterview={handleConfirmCancel}
        onOpenProfile={(idPostulacion, idVacante) =>
          setViewingProfile({ idPostulacion, idVacante })
        }
      />

      {/* Modal para reprogramar entrevista (deshabilita automáticamente la anterior) */}
      <Modal
        visible={reschedulingPass !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReschedulingPass(null)}
      >
        <View style={[styles.screen, { backgroundColor: screenBg }]}>
          <ScheduleInterviewOverlay
            visible={reschedulingPass !== null}
            mode="reschedule"
            candidateName={reschedulingPass?.candidato?.nombre || "Candidato"}
            vacancyTitle={reschedulingPass?.vacante?.titulo}
            initialAddress={reschedulingPass?.direccion_oficina || ""}
            initialReferencias={reschedulingPass?.referencias || ""}
            initialCoords={
              reschedulingPass?.latitud != null &&
              reschedulingPass?.longitud != null
                ? {
                    lat: reschedulingPass.latitud,
                    lng: reschedulingPass.longitud,
                  }
                : null
            }
            submitting={rescheduleInterview.isPending}
            onClose={() => setReschedulingPass(null)}
            onSubmit={handleSubmitReschedule}
          />
        </View>
      </Modal>

      <Modal
        visible={viewingProfile !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setViewingProfile(null)}
      >
        {viewingProfile ? (
          <ApplicantProfileModal
            idPostulacion={viewingProfile.idPostulacion}
            idVacante={viewingProfile.idVacante}
            onBack={() => setViewingProfile(null)}
            onClose={() => setViewingProfile(null)}
            onOpenRegistry={() => setViewingProfile(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
