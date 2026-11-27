import axios from "axios";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Bus,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Motorbike,
  Phone,
  QrCode,
  Route,
  Send,
  ShieldCheck,
  TicketCheck,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import {
  AppSelectField,
  type SelectOption,
} from "@/components/ui/AppSelectField";
import { Spinner } from "@/components/ui/Spinner";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  useApplicantFullProfile,
  useRequestApplicantDocuments,
} from "../hooks/use-applicant-profile";
import { useUpdateApplicantStatus } from "../hooks/use-employer-vacancies";
import { useScheduleApplicantInterview } from "../hooks/use-interviews";
import type { ApplicationStatus } from "../types/employer.types";
import type { ScheduleInterviewInput } from "../types/interviews.types";
import { getInterviewStatusColors } from "./EmployerInterviewRegistry";
import { RequestDocumentsModal } from "./RequestDocumentsModal";
import { ScheduleInterviewOverlay } from "./ScheduleInterviewOverlay";

interface ApplicantProfileModalProps {
  idPostulacion: number | null;
  idVacante: number | null;
  onBack?: () => void;
  onClose: () => void;
  onOpenRegistry?: (idEntrevista: number) => void;
}

const STATUS_SELECT_OPTIONS: SelectOption<ApplicationStatus>[] = [
  {
    value: "en_revision",
    label: "En revisión",
    description: "El perfil está siendo evaluado por tu equipo.",
  },
  {
    value: "entrevista",
    label: "Entrevista",
    description: "El candidato avanza a etapa de entrevista.",
  },
  {
    value: "contratado",
    label: "Contratado",
    description: "El candidato fue seleccionado para la vacante.",
  },
  {
    value: "descartada",
    label: "Descartada",
    description: "Finalizar el proceso para esta postulación.",
  },
];

const REQUEST_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pendiente: {
    label: "Pendiente de respuesta",
    color: "#FF9F0A",
    bg: "rgba(255, 159, 10, 0.14)",
  },
  aprobada: {
    label: "Acceso autorizado",
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.14)",
  },
  rechazada: {
    label: "Rechazada",
    color: "#FF3B30",
    bg: "rgba(255, 59, 48, 0.14)",
  },
  revocada: {
    label: "Acceso revocado",
    color: "#8E8E93",
    bg: "rgba(142, 142, 147, 0.16)",
  },
};

function extractErr(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

export function ApplicantProfileModal({
  idPostulacion,
  idVacante,
  onBack,
  onClose,
  onOpenRegistry,
}: ApplicantProfileModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useApplicantFullProfile(idPostulacion, idVacante);
  const updateStatus = useUpdateApplicantStatus(idVacante);
  const requestDocs = useRequestApplicantDocuments(idPostulacion);
  const scheduleInterview = useScheduleApplicantInterview(
    idPostulacion,
    idVacante,
  );

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [preselectedDoc, setPreselectedDoc] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] =
    useState<ApplicationStatus | null>(null);

  if (!idPostulacion) return null;

  const sheetBg = isDark ? "#0D0B0A" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const usuario = data?.perfil.usuario;
  const fullName = usuario
    ? [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
        .filter(Boolean)
        .join(" ")
        .trim() || usuario.email
    : "Postulante";
  const initials = fullName.slice(0, 2).toUpperCase();

  const direccion = data?.perfil.direccion;
  const ubicacionLabel = direccion
    ? [direccion.colonia, direccion.municipio, direccion.estado, direccion.cp]
        .filter(Boolean)
        .join(", ")
    : "";

  const commute = data?.ubicacion_traslado ?? null;
  const candidateCoords =
    commute?.candidato
      ? { lat: commute.candidato.lat, lng: commute.candidato.lng }
      : direccion?.latitud != null && direccion?.longitud != null
        ? { lat: direccion.latitud, lng: direccion.longitud }
        : null;
  const companyCoords = commute?.empresa
    ? { lat: commute.empresa.lat, lng: commute.empresa.lng }
    : null;

  const info = data?.perfil.informacion;
  const empleo = data?.perfil.empleo;
  const experiencias = data?.perfil.experiencias ?? [];
  const documentos = data?.documentos ?? [];
  const solicitudes = data?.solicitudes ?? [];
  const cv = data?.cv;
  const entrevistaActiva = data?.entrevista_activa ?? null;
  const isInterviewStage = data?.postulacion.estado === "entrevista";
  const entrevistaStatusMeta = entrevistaActiva
    ? getInterviewStatusColors(entrevistaActiva.estado, theme)
    : null;

  const handleOpenInterviewRegistry = () => {
    if (!entrevistaActiva) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    if (onOpenRegistry) {
      onOpenRegistry(entrevistaActiva.id_entrevista);
      return;
    }
    const highlight = String(entrevistaActiva.id_entrevista);
    onClose();
    setTimeout(() => {
      router.push({
        pathname: "/(app)/empresas/entrevistas",
        params: { highlight },
      });
    }, 140);
  };

  const handleScheduleInterviewSubmit = async (
    input: ScheduleInterviewInput,
  ) => {
    try {
      const res = await scheduleInterview.mutateAsync(input);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setInterviewModalOpen(false);
      await refetch();
      Alert.alert(
        "Entrevista agendada",
        res.mensaje || "El pase fue generado y enviado al candidato.",
      );
    } catch (err) {
      Alert.alert(
        "No se pudo agendar",
        extractErr(err, "No fue posible programar la entrevista."),
      );
    }
  };

  const uploadedDocsCount = documentos.filter((d) => d.subido).length;
  const authorizedDocsCount = documentos.filter((d) => d.autorizado).length;

  const openDocumentUrl = async (url?: string | null) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url);
    }
  };

  const handleRequestSubmit = async (payload: {
    documentos: string[];
    mensaje?: string;
  }) => {
    try {
      const res = await requestDocs.mutateAsync(payload);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setRequestModalOpen(false);
      setPreselectedDoc(null);
      Alert.alert("Solicitud enviada", res.mensaje);
    } catch (err) {
      Alert.alert(
        "No se pudo enviar",
        extractErr(err, "Intenta enviar la solicitud nuevamente."),
      );
    }
  };

  const handleStatusChange = async (estado: ApplicationStatus) => {
    if (updatingStatus) return;
    setUpdatingStatus(estado);
    try {
      await updateStatus.mutateAsync({ idPostulacion, estado });
      await refetch();
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (err) {
      Alert.alert("Error", extractErr(err, "No se pudo actualizar el estado."));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const confirmStatusChange = (nextStatus: ApplicationStatus) => {
    if (!data || updatingStatus || nextStatus === data.postulacion.estado) {
      return;
    }

    const nextOption = STATUS_SELECT_OPTIONS.find(
      (opt) => opt.value === nextStatus,
    );
    const label = nextOption?.label ?? nextStatus;
    const message = `¿Estás seguro de cambiar el estado de ${fullName} a "${label}"?`;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        void handleStatusChange(nextStatus);
      }
      return;
    }

    Alert.alert("¿Estás seguro?", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, cambiar",
        style: nextStatus === "descartada" ? "destructive" : "default",
        onPress: () => {
          void handleStatusChange(nextStatus);
        },
      },
    ]);
  };

  return (
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
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel="Volver a postulantes"
          >
            <ArrowLeft size={18} color={theme.text} />
          </Pressable>
        ) : null}

        <View style={styles.flexOne}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Perfil del candidato
          </Text>
          {data?.vacante?.titulo ? (
            <Text
              style={[styles.headerSub, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {data.vacante.titulo}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
        >
          <X size={18} color={theme.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loaderBox}>
          <Spinner size={28} strokeWidth={2.8} color={theme.primary} />
        </View>
      ) : !data ? (
        <View style={styles.loaderBox}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            {extractErr(
              error,
              "No se pudo cargar el perfil del postulante.",
            )}
          </Text>
          <View style={styles.retryWrap}>
            <AppButton title="Reintentar" onPress={() => void refetch()} />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 30, 44) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={theme.primary}
            />
          }
        >
          {/* 0. Card superior (arriba del nombre) solo cuando la entrevista/QR ya está activa */}
          {entrevistaActiva && entrevistaStatusMeta ? (
            <Pressable
              onPress={handleOpenInterviewRegistry}
              accessibilityRole="button"
              accessibilityLabel="Ver entrevista activa en registros"
              style={({ pressed }) => [
                styles.activeInterviewBanner,
                {
                  backgroundColor: cardBg,
                  borderColor: theme.primaryBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.activeInterviewBannerIcon,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <TicketCheck size={18} color={theme.primary} />
              </View>

              <View style={styles.flexOne}>
                <View style={styles.activeBannerTopLine}>
                  <Text
                    style={[
                      styles.activeBannerTitle,
                      { color: theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    Entrevista activa
                  </Text>
                  <View
                    style={[
                      styles.interviewStatusPill,
                      { backgroundColor: entrevistaStatusMeta.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.interviewStatusText,
                        { color: entrevistaStatusMeta.color },
                      ]}
                    >
                      {entrevistaStatusMeta.label}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.activeBannerSub,
                    { color: theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {entrevistaActiva.fecha_hora
                    ? `${entrevistaActiva.fecha_hora} · Ir a registros`
                    : "Toca para abrir en registros"}
                </Text>
              </View>

              <ChevronRight size={17} color={theme.primary} />
            </Pressable>
          ) : null}

          {/* 1. Cabecera: Nombre, contacto, presentación y selector de estado */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.heroRow}>
              <ProfileAvatar
                uri={usuario?.foto_perfil}
                initials={initials}
                size={60}
              />
              <View style={styles.flexOne}>
                <Text style={[styles.candidateName, { color: theme.text }]}>
                  {fullName}
                </Text>
                {ubicacionLabel ? (
                  <View style={styles.inlineMeta}>
                    <MapPin size={13} color={theme.textSecondary} />
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {ubicacionLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.contactButtons}>
              {usuario?.email ? (
                <Pressable
                  onPress={() => void Linking.openURL(`mailto:${usuario.email}`)}
                  style={[
                    styles.contactChip,
                    { backgroundColor: theme.inputBackground },
                  ]}
                >
                  <Mail size={14} color={theme.primary} />
                  <Text
                    style={[styles.contactChipText, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {usuario.email}
                  </Text>
                </Pressable>
              ) : null}

              {usuario?.celular ? (
                <Pressable
                  onPress={() => void Linking.openURL(`tel:${usuario.celular}`)}
                  style={[
                    styles.contactChip,
                    { backgroundColor: theme.inputBackground },
                  ]}
                >
                  <Phone size={14} color={theme.primary} />
                  <Text
                    style={[styles.contactChipText, { color: theme.text }]}
                  >
                    {usuario.celular}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {data.postulacion.mensaje_presentacion ? (
              <View
                style={[
                  styles.quoteBox,
                  { backgroundColor: theme.inputBackground },
                ]}
              >
                <Text
                  style={[styles.quoteLabel, { color: theme.textMuted }]}
                >
                  MENSAJE DE PRESENTACIÓN
                </Text>
                <Text style={[styles.quoteText, { color: theme.text }]}>
                  “{data.postulacion.mensaje_presentacion}”
                </Text>
              </View>
            ) : null}

            {/* Estado del proceso en formato Select con confirmación previa */}
            <View style={styles.statusSelectWrap}>
              <AppSelectField
                label="Estado del proceso"
                modalTitle="Estado del proceso"
                placeholder="Selecciona un estado"
                value={data.postulacion.estado}
                options={STATUS_SELECT_OPTIONS}
                onChange={confirmStatusChange}
              />
              {updatingStatus ? (
                <View style={styles.updatingRow}>
                  <Spinner size={14} strokeWidth={2.2} color={theme.primary} />
                  <Text
                    style={[
                      styles.updatingText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Actualizando estado...
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* 1.2 Sobre mí del candidato */}
          {info?.historia?.trim() ? (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <BookOpen size={17} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Sobre mí
                </Text>
              </View>
              <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                {info.historia.trim()}
              </Text>
            </View>
          ) : null}

          {/* 1.5 Ubicación del candidato con mapa, distancia y tiempos de traslado */}
          {direccion ? (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.locationHeaderRow}>
                <View style={styles.sectionHeaderRow}>
                  <MapPin size={17} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Ubicación y traslado
                  </Text>
                </View>

                {commute ? (
                  <View
                    style={[
                      styles.distanceChip,
                      {
                        backgroundColor: theme.primarySoft,
                        borderColor: theme.primaryBorder,
                      },
                    ]}
                  >
                    <Route size={13} color={theme.primary} />
                    <Text
                      style={[
                        styles.distanceChipText,
                        { color: theme.primary },
                      ]}
                    >
                      {commute.distancia_texto}
                    </Text>
                  </View>
                ) : null}
              </View>

              {candidateCoords ? (
                <InteractiveAddressMap
                  coords={candidateCoords}
                  secondaryCoords={companyCoords}
                  primaryLabel="Candidato"
                  secondaryLabel="Tu empresa"
                  distanceBadge={
                    commute ? `${commute.distancia_texto} de tu empresa` : undefined
                  }
                  showRouteLine
                  height={162}
                  readOnly
                />
              ) : null}

              <View style={styles.addressMetaRow}>
                <View
                  style={[
                    styles.addressIconBox,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <MapPin size={16} color={theme.primary} />
                </View>
                <View style={styles.flexOne}>
                  <Text
                    style={[styles.addressPrimary, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {[direccion.colonia, direccion.municipio]
                      .filter(Boolean)
                      .join(", ") || direccion.estado}
                  </Text>
                  <Text
                    style={[
                      styles.addressSecondary,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {[direccion.estado, direccion.cp ? `C.P. ${direccion.cp}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              </View>

              {commute ? (
                <>
                  <View style={styles.commuteGrid}>
                    <View
                      style={[
                        styles.commuteTile,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.commuteIconBox,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <Car size={16} color={theme.primary} />
                      </View>
                      <Text
                        style={[styles.commuteTime, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {commute.tiempos.carro.texto}
                      </Text>
                      <Text
                        style={[
                          styles.commuteLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Carro
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.commuteTile,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.commuteIconBox,
                          { backgroundColor: "rgba(52, 199, 89, 0.14)" },
                        ]}
                      >
                        <Motorbike size={16} color="#34C759" />
                      </View>
                      <Text
                        style={[styles.commuteTime, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {commute.tiempos.moto.texto}
                      </Text>
                      <Text
                        style={[
                          styles.commuteLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Moto
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.commuteTile,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.commuteIconBox,
                          { backgroundColor: "rgba(10, 132, 255, 0.14)" },
                        ]}
                      >
                        <Bus size={16} color="#0A84FF" />
                      </View>
                      <Text
                        style={[styles.commuteTime, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {commute.tiempos.transporte_publico.texto}
                      </Text>
                      <Text
                        style={[
                          styles.commuteLabel,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        Transporte
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mapLegendRow}>
                    <Text
                      style={[styles.mapLegendText, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
                      Destino: {commute.empresa.etiqueta}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {/* 2. Agendar entrevista: solo aparece cuando el estado es Entrevista y aún no existe QR activo */}
          {isInterviewStage && !entrevistaActiva ? (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <QrCode size={17} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Agendar entrevista
                </Text>
              </View>

              <Text
                style={[styles.privacyNotice, { color: theme.textSecondary }]}
              >
                Envía la ubicación de tu oficina, fecha, hora y genera un pase
                QR único para confirmar la llegada del candidato.
              </Text>
              <AppButton
                title="Agendar entrevista y enviar QR"
                onPress={() => setInterviewModalOpen(true)}
              />
            </View>
          ) : null}

          {/* 3. Currículum Vitae (CV) */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <FileText size={17} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Currículum (CV)
              </Text>
            </View>

            {cv?.subido && cv.url ? (
              <Pressable
                onPress={() => void openDocumentUrl(cv.url)}
                style={({ pressed }) => [
                  styles.cvActionRow,
                  { backgroundColor: theme.primarySoft },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.flexOne}>
                  <Text style={[styles.cvTitle, { color: theme.primary }]}>
                    Abrir Currículum Vitae (PDF)
                  </Text>
                  <Text
                    style={[styles.cvSub, { color: theme.textSecondary }]}
                  >
                    Disponible automáticamente al postularse
                  </Text>
                </View>
                <ExternalLink size={17} color={theme.primary} />
              </Pressable>
            ) : (
              <View style={styles.missingRow}>
                <Text
                  style={[styles.emptyLine, { color: theme.textSecondary }]}
                >
                  El candidato aún no ha cargado su CV en Perso.
                </Text>
                <Pressable
                  onPress={() => {
                    setPreselectedDoc("cv");
                    setRequestModalOpen(true);
                  }}
                  style={[
                    styles.smallCta,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Text
                    style={[styles.smallCtaText, { color: theme.primary }]}
                  >
                    Pedirle que suba su CV
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 4. Formación académica, inglés e historia */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <GraduationCap size={17} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Formación e idiomas
              </Text>
            </View>

            {info?.universidad || info?.titulo || info?.inglesNivel ? (
              <View style={styles.kvList}>
                {info.universidad ? (
                  <View style={styles.kvItem}>
                    <Text
                      style={[styles.kvLabel, { color: theme.textSecondary }]}
                    >
                      Universidad / Institución
                    </Text>
                    <Text style={[styles.kvValue, { color: theme.text }]}>
                      {info.universidad}
                    </Text>
                  </View>
                ) : null}

                {info.titulo ? (
                  <View style={styles.kvItem}>
                    <Text
                      style={[styles.kvLabel, { color: theme.textSecondary }]}
                    >
                      Título o carrera
                    </Text>
                    <Text style={[styles.kvValue, { color: theme.text }]}>
                      {info.titulo}
                    </Text>
                  </View>
                ) : null}

                {info.inglesNivel ? (
                  <View style={styles.kvItem}>
                    <Text
                      style={[styles.kvLabel, { color: theme.textSecondary }]}
                    >
                      Nivel de inglés
                    </Text>
                    <View style={styles.englishRow}>
                      <Globe size={14} color={theme.primary} />
                      <Text style={[styles.kvValue, { color: theme.text }]}>
                        Nivel {info.inglesNivel}
                      </Text>
                      {info.certificado ? (
                        <View style={styles.certPill}>
                          <Award size={12} color="#34C759" />
                          <Text style={styles.certPillText}>Certificado</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text
                style={[styles.emptyLine, { color: theme.textSecondary }]}
              >
                Sin información académica registrada todavía.
              </Text>
            )}
          </View>

          {/* 5. Último empleo y experiencia por años */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Briefcase size={17} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Trayectoria y experiencia
              </Text>
            </View>

            {empleo?.empresa || empleo?.puesto ? (
              <View
                style={[
                  styles.lastJobBox,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.quoteLabel, { color: theme.textMuted }]}>
                  ÚLTIMO EMPLEO
                </Text>
                <Text style={[styles.kvValue, { color: theme.text }]}>
                  {[empleo.puesto, empleo.empresa].filter(Boolean).join(" · ")}
                </Text>
                {empleo.tiempo ? (
                  <Text
                    style={[styles.metaText, { color: theme.textSecondary }]}
                  >
                    Duración: {empleo.tiempo}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {empleo?.empleos ? (
              <View style={styles.kvItem}>
                <Text
                  style={[styles.kvLabel, { color: theme.textSecondary }]}
                >
                  Áreas de interés
                </Text>
                <Text style={[styles.kvValue, { color: theme.text }]}>
                  {empleo.empleos}
                </Text>
              </View>
            ) : null}

            {experiencias.length > 0 ? (
              <View style={styles.timeline}>
                <Text
                  style={[styles.kvLabel, { color: theme.textSecondary }]}
                >
                  Experiencia por años
                </Text>
                {experiencias.map((exp) => (
                  <View
                    key={exp.id}
                    style={[
                      styles.timelineItem,
                      { borderLeftColor: theme.primary },
                    ]}
                  >
                    <View style={styles.inlineMeta}>
                      <Calendar size={12} color={theme.primary} />
                      <Text
                        style={[
                          styles.timelineYears,
                          { color: theme.primary },
                        ]}
                      >
                        {[exp.year_one, exp.year_two]
                          .filter(Boolean)
                          .join(" – ") || "Periodo"}
                      </Text>
                    </View>
                    <Text
                      style={[styles.timelineDesc, { color: theme.text }]}
                    >
                      {exp.experiencia}
                    </Text>
                  </View>
                ))}
              </View>
            ) : !empleo?.empresa && !empleo?.puesto ? (
              <Text
                style={[styles.emptyLine, { color: theme.textSecondary }]}
              >
                El candidato aún no ha agregado historial de experiencia.
              </Text>
            ) : null}
          </View>

          {/* 6. Documentos importantes protegidos (acceso bajo consentimiento) */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <ShieldCheck size={17} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Documentos oficiales
              </Text>
            </View>

            <Text
              style={[styles.privacyNotice, { color: theme.textSecondary }]}
            >
              Por privacidad, los documentos oficiales solo son visibles cuando
              el candidato autoriza tu solicitud. Actualmente tiene{" "}
              {uploadedDocsCount} cargados y {authorizedDocsCount} autorizados
              para tu empresa.
            </Text>

            <View style={styles.docsList}>
              {documentos.map((doc) => (
                <View
                  key={doc.tipo}
                  style={[
                    styles.docItemRow,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}
                >
                  <View style={styles.flexOne}>
                    <Text style={[styles.docItemName, { color: theme.text }]}>
                      {doc.etiqueta}
                    </Text>
                    <Text
                      style={[
                        styles.docItemState,
                        {
                          color: doc.autorizado
                            ? "#34C759"
                            : doc.subido
                              ? theme.textSecondary
                              : theme.textMuted,
                        },
                      ]}
                    >
                      {doc.autorizado && doc.subido
                        ? "Autorizado para tu empresa"
                        : doc.autorizado && !doc.subido
                          ? "Autorizado · Falta que lo suba"
                          : doc.subido
                            ? "Cargado · Requiere autorización"
                            : "No cargado aún"}
                    </Text>
                  </View>

                  {doc.autorizado && doc.url ? (
                    <Pressable
                      onPress={() => void openDocumentUrl(doc.url)}
                      style={[
                        styles.openDocBtn,
                        { backgroundColor: theme.primarySoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.openDocBtnText,
                          { color: theme.primary },
                        ]}
                      >
                        Ver
                      </Text>
                      <ExternalLink size={12} color={theme.primary} />
                    </Pressable>
                  ) : (
                    <Lock size={15} color={theme.textMuted} />
                  )}
                </View>
              ))}
            </View>

            <AppButton
              title="Solicitar acceso o pedir documentos"
              onPress={() => {
                setPreselectedDoc(null);
                setRequestModalOpen(true);
              }}
            />

            {solicitudes.length > 0 ? (
              <View style={styles.requestsHistory}>
                <Text
                  style={[styles.smallLabel, { color: theme.textSecondary }]}
                >
                  Solicitudes enviadas
                </Text>
                {solicitudes.map((sol) => {
                  const meta =
                    REQUEST_STATUS_META[sol.estado] ??
                    REQUEST_STATUS_META.pendiente;
                  return (
                    <View
                      key={sol.id_solicitud}
                      style={[
                        styles.requestRow,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      <View style={styles.requestTopRow}>
                        <View style={styles.inlineMeta}>
                          {sol.estado === "aprobada" ? (
                            <CheckCircle2 size={13} color={meta.color} />
                          ) : (
                            <Send size={12} color={meta.color} />
                          )}
                          <Text
                            style={[
                              styles.requestStateText,
                              { color: meta.color },
                            ]}
                          >
                            {meta.label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.requestCount,
                            { color: theme.textMuted },
                          ]}
                        >
                          {sol.documentos_solicitados.length} doc(s)
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.requestDocsList,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {sol.documentos_solicitados
                          .map((d) => d.etiqueta)
                          .join(" · ")}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}

      <ScheduleInterviewOverlay
        visible={interviewModalOpen}
        candidateName={fullName}
        vacancyTitle={data?.vacante?.titulo}
        submitting={scheduleInterview.isPending}
        onClose={() => setInterviewModalOpen(false)}
        onSubmit={handleScheduleInterviewSubmit}
      />

      <RequestDocumentsModal
        visible={requestModalOpen}
        candidateName={fullName}
        cvUploaded={Boolean(cv?.subido)}
        documents={documentos}
        preselectedDoc={preselectedDoc}
        submitting={requestDocs.isPending}
        onClose={() => {
          setRequestModalOpen(false);
          setPreselectedDoc(null);
        }}
        onSubmit={handleRequestSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  headerSub: {
    fontSize: 12.5,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },

  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  retryWrap: {
    width: "100%",
    maxWidth: 220,
  },

  content: {
    padding: 16,
    gap: 14,
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 13,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  candidateName: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  inlineMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    fontSize: 12.5,
    flexShrink: 1,
  },

  contactButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: "100%",
  },

  contactChipText: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },

  quoteBox: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },

  quoteLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  quoteText: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  statusSelectWrap: {
    gap: 8,
  },

  updatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingLeft: 2,
  },

  updatingText: {
    fontSize: 12,
    fontWeight: "600",
  },

  smallLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  distanceChipText: {
    fontSize: 12,
    fontWeight: "800",
  },

  addressMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  addressPrimary: {
    fontSize: 14.5,
    fontWeight: "700",
  },

  addressSecondary: {
    fontSize: 12.5,
  },

  commuteGrid: {
    flexDirection: "row",
    gap: 9,
  },

  commuteTile: {
    flex: 1,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 5,
  },

  commuteIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  commuteTime: {
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  commuteLabel: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  mapLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mapLegendText: {
    fontSize: 11.5,
    fontWeight: "500",
    flex: 1,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  cvActionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    gap: 10,
  },

  cvTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  cvSub: {
    fontSize: 12,
  },

  missingRow: {
    gap: 9,
  },

  emptyLine: {
    fontSize: 13,
    lineHeight: 18,
  },

  smallCta: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },

  smallCtaText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  kvList: {
    gap: 11,
  },

  kvItem: {
    gap: 3,
  },

  kvLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  kvValue: {
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 20,
  },

  englishRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  certPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },

  certPillText: {
    color: "#34C759",
    fontSize: 11,
    fontWeight: "700",
  },

  paragraph: {
    fontSize: 13.5,
    lineHeight: 20,
  },

  lastJobBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 3,
  },

  timeline: {
    gap: 10,
  },

  timelineItem: {
    borderLeftWidth: 2,
    paddingLeft: 11,
    gap: 3,
  },

  timelineYears: {
    fontSize: 12,
    fontWeight: "800",
  },

  timelineDesc: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  privacyNotice: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  docsList: {
    gap: 8,
  },

  docItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },

  docItemName: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  docItemState: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  openDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  openDocBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  requestsHistory: {
    gap: 8,
    marginTop: 4,
  },

  requestRow: {
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    gap: 4,
  },

  requestTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  requestStateText: {
    fontSize: 12,
    fontWeight: "700",
  },

  requestCount: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  requestDocsList: {
    fontSize: 12,
    lineHeight: 17,
  },

  pressed: {
    opacity: 0.72,
  },

  interviewBox: {
    gap: 9,
  },

  activeInterviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },

  activeInterviewBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  activeBannerTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  activeBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  activeBannerSub: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  interviewStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  interviewStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
