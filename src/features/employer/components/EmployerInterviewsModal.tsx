import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ScanLine,
  Search,
  UserCheck,
  X,
  XCircle,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  useEmployerInterviews,
  useLookupInterviewQr,
  useResolveInterviewQr,
} from "../hooks/use-interviews";
import type {
  InterviewPass,
  InterviewPassStatus,
} from "../types/interviews.types";
import { ApplicantProfileModal } from "./ApplicantProfileModal";

interface EmployerInterviewsModalProps {
  visible: boolean;
  initialTab?: "scan" | "registry";
  onClose: () => void;
}

const STATUS_META: Record<
  InterviewPassStatus,
  { label: string; color: string; bg: string }
> = {
  pendiente: {
    label: "Pendiente de acceso",
    color: "#FF9F0A",
    bg: "rgba(255, 159, 10, 0.14)",
  },
  aprobada: {
    label: "Acceso aprobado",
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.14)",
  },
  rechazada: {
    label: "Acceso rechazado",
    color: "#FF3B30",
    bg: "rgba(255, 59, 48, 0.14)",
  },
  cancelada: {
    label: "Cancelada",
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

export function EmployerInterviewsModal({
  visible,
  initialTab = "scan",
  onClose,
}: EmployerInterviewsModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<"scan" | "registry">(initialTab);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerLocked, setScannerLocked] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [verifiedPass, setVerifiedPass] = useState<InterviewPass | null>(null);
  const [viewingProfile, setViewingProfile] = useState<{
    idPostulacion: number;
    idVacante: number;
  } | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolvingAction, setResolvingAction] = useState<
    "aprobar" | "rechazar" | null
  >(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const {
    data: interviews = [],
    isLoading,
    refetch,
  } = useEmployerInterviews(visible);
  const lookupQr = useLookupInterviewQr();
  const resolveQr = useResolveInterviewQr();

  useEffect(() => {
    if (visible) {
      setTab(initialTab);
    } else {
      setScannerLocked(false);
      setVerifiedPass(null);
      setViewingProfile(null);
      setManualCode("");
    }
  }, [visible, initialTab]);

  const handleCloseAll = () => {
    setViewingProfile(null);
    onClose();
  };

  const sheetBg = isDark ? "#0D0B0A" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleLookupCode = async (raw: string) => {
    const code = raw.trim();
    if (!code || lookupQr.isPending) return;
    setScannerLocked(true);
    try {
      const found = await lookupQr.mutateAsync(code);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      setVerifiedPass(found);
      setManualCode("");
    } catch (error) {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        "QR no válido",
        extractErr(error, "No se encontró ninguna entrevista con este código."),
        [{ text: "Intentar de nuevo", onPress: () => setScannerLocked(false) }],
      );
    }
  };

  const handleResolve = async (
    pass: InterviewPass,
    accion: "aprobar" | "rechazar",
    openProfileOnApprove = false,
  ) => {
    setResolvingId(pass.id_entrevista);
    setResolvingAction(accion);
    try {
      const res = await resolveQr.mutateAsync({
        idEntrevista: pass.id_entrevista,
        accion,
      });
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          accion === "aprobar"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
      }
      if (verifiedPass?.id_entrevista === pass.id_entrevista) {
        setVerifiedPass(res.entrevista);
      }
      if (accion === "aprobar" && openProfileOnApprove) {
        setViewingProfile({
          idPostulacion: pass.id_postulacion,
          idVacante: pass.id_vacante,
        });
      } else {
        Alert.alert(
          accion === "aprobar" ? "Acceso aprobado" : "Acceso rechazado",
          res.mensaje,
        );
      }
    } catch (error) {
      Alert.alert(
        "No se pudo actualizar",
        extractErr(error, "Intenta nuevamente."),
      );
    } finally {
      setResolvingId(null);
      setResolvingAction(null);
    }
  };

  const pendingCount = interviews.filter(
    (item) => item.estado === "pendiente",
  ).length;

  const resumen = verifiedPass?.candidato_resumen ?? null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (viewingProfile) {
          setViewingProfile(null);
        } else {
          handleCloseAll();
        }
      }}
    >
      {viewingProfile ? (
        <ApplicantProfileModal
          idPostulacion={viewingProfile.idPostulacion}
          idVacante={viewingProfile.idVacante}
          onBack={() => setViewingProfile(null)}
          onClose={handleCloseAll}
        />
      ) : (
        <View style={[styles.container, { backgroundColor: sheetBg }]}>
          <View
            style={[
              styles.header,
              {
                paddingTop: Math.max(insets.top, 18),
                borderBottomColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.flexOne}>
              <Text style={[styles.title, { color: theme.text }]}>
                Entrevistas y Pase QR
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Verifica la identidad del candidato y abre su perfil y CV
              </Text>
            </View>
            <Pressable
              onPress={handleCloseAll}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.inputBackground },
              ]}
            >
              <X size={18} color={theme.text} />
            </Pressable>
          </View>

          {/* Selector de pestañas */}
          <View style={styles.tabsWrap}>
            <View
              style={[
                styles.tabsBar,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  setTab("scan");
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                }}
                style={[
                  styles.tabBtn,
                  tab === "scan" && { backgroundColor: theme.primary },
                ]}
              >
                <ScanLine
                  size={15}
                  color={tab === "scan" ? "#FFFFFF" : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: tab === "scan" ? "#FFFFFF" : theme.text },
                  ]}
                >
                  Escanear QR
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setTab("registry");
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                }}
                style={[
                  styles.tabBtn,
                  tab === "registry" && { backgroundColor: theme.primary },
                ]}
              >
                <ClipboardList
                  size={15}
                  color={tab === "registry" ? "#FFFFFF" : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: tab === "registry" ? "#FFFFFF" : theme.text },
                  ]}
                >
                  Registro ({interviews.length})
                </Text>
              </Pressable>
            </View>
          </View>

          {tab === "scan" ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom + 24, 36) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {verifiedPass ? (
                /* Ficha de verificación de identidad del candidato escaneado */
                <View style={styles.verifiedStack}>
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    <View style={styles.verifiedTopRow}>
                      <View style={styles.inlineRow}>
                        <UserCheck size={14} color={theme.primary} />
                        <Text
                          style={[
                            styles.verifiedEyebrow,
                            { color: theme.primary },
                          ]}
                        >
                          VERIFICAR IDENTIDAD
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: (
                              STATUS_META[verifiedPass.estado] ??
                              STATUS_META.pendiente
                            ).bg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: (
                                STATUS_META[verifiedPass.estado] ??
                                STATUS_META.pendiente
                              ).color,
                            },
                          ]}
                        >
                          {
                            (
                              STATUS_META[verifiedPass.estado] ??
                              STATUS_META.pendiente
                            ).label
                          }
                        </Text>
                      </View>
                    </View>

                    {/* Foto grande y nombre para confirmar visualmente al candidato */}
                    <View style={styles.identityHero}>
                      <ProfileAvatar
                        uri={verifiedPass.candidato?.foto_perfil}
                        initials={(verifiedPass.candidato?.nombre || "C")
                          .slice(0, 2)
                          .toUpperCase()}
                        size={76}
                      />
                      <Text
                        style={[styles.heroName, { color: theme.text }]}
                        numberOfLines={2}
                      >
                        {verifiedPass.candidato?.nombre || "Candidato"}
                      </Text>
                      <Text
                        style={[
                          styles.heroVacancy,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        Postulado a{" "}
                        <Text style={{ color: theme.text, fontWeight: "700" }}>
                          {verifiedPass.vacante?.titulo || "Vacante"}
                        </Text>
                      </Text>
                      <View
                        style={[
                          styles.codePill,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <QrCode size={13} color={theme.primary} />
                        <Text
                          style={[styles.codeTag, { color: theme.primary }]}
                        >
                          {verifiedPass.codigo_corto}
                        </Text>
                      </View>
                    </View>

                    {/* Datos clave de contacto y perfil para validar que sí es el postulado */}
                    <View
                      style={[
                        styles.detailsBox,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      {verifiedPass.candidato?.email ? (
                        <View style={styles.infoLine}>
                          <Mail size={14} color={theme.primary} />
                          <Text
                            style={[styles.detailText, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {verifiedPass.candidato.email}
                          </Text>
                        </View>
                      ) : null}

                      {verifiedPass.candidato?.celular ? (
                        <View style={styles.infoLine}>
                          <Phone size={14} color={theme.primary} />
                          <Text
                            style={[styles.detailText, { color: theme.text }]}
                          >
                            {verifiedPass.candidato.celular}
                          </Text>
                        </View>
                      ) : null}

                      {resumen?.ubicacion ? (
                        <View style={styles.infoLine}>
                          <MapPin size={14} color={theme.textSecondary} />
                          <Text
                            style={[
                              styles.detailText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {resumen.ubicacion}
                          </Text>
                        </View>
                      ) : null}

                      {resumen?.titulo || resumen?.universidad ? (
                        <View style={styles.infoLine}>
                          <GraduationCap
                            size={14}
                            color={theme.textSecondary}
                          />
                          <Text
                            style={[
                              styles.detailText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {[resumen.titulo, resumen.universidad]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        </View>
                      ) : null}

                      {resumen?.ultimo_empleo ? (
                        <View style={styles.infoLine}>
                          <Briefcase size={14} color={theme.textSecondary} />
                          <Text
                            style={[
                              styles.detailText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Último empleo: {resumen.ultimo_empleo}
                          </Text>
                        </View>
                      ) : null}

                      {resumen?.ingles_nivel ? (
                        <View style={styles.infoLine}>
                          <Globe size={14} color={theme.textSecondary} />
                          <Text
                            style={[
                              styles.detailText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Inglés nivel {resumen.ingles_nivel}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.infoLine}>
                        <FileText
                          size={14}
                          color={
                            resumen?.cv_subido ? "#34C759" : theme.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.detailText,
                            {
                              color: resumen?.cv_subido
                                ? "#34C759"
                                : theme.textSecondary,
                              fontWeight: resumen?.cv_subido ? "700" : "500",
                            },
                          ]}
                        >
                          {resumen?.cv_subido
                            ? "CV disponible en su perfil"
                            : "Sin CV cargado todavía"}
                        </Text>
                      </View>
                    </View>

                    {verifiedPass.fecha_hora ? (
                      <View style={styles.infoLine}>
                        <CalendarClock size={14} color={theme.textSecondary} />
                        <Text
                          style={[
                            styles.infoText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Cita: {verifiedPass.fecha_hora}
                        </Text>
                      </View>
                    ) : null}

                    {/* Acciones según estado */}
                    {verifiedPass.estado === "pendiente" ? (
                      <View style={styles.actionsStack}>
                        <Pressable
                          disabled={resolvingId === verifiedPass.id_entrevista}
                          onPress={() =>
                            void handleResolve(verifiedPass, "aprobar", true)
                          }
                          style={({ pressed }) => [
                            styles.approvePrimaryBtn,
                            pressed && styles.pressed,
                          ]}
                        >
                          {resolvingId === verifiedPass.id_entrevista &&
                          resolvingAction === "aprobar" ? (
                            <Spinner
                              size={20}
                              strokeWidth={2.4}
                              color="#FFFFFF"
                            />
                          ) : (
                            <>
                              <CheckCircle2 size={18} color="#FFFFFF" />
                              <Text style={styles.decisionBtnText}>
                                Aprobar acceso y ver perfil
                              </Text>
                            </>
                          )}
                        </Pressable>

                        <Pressable
                          disabled={resolvingId === verifiedPass.id_entrevista}
                          onPress={() =>
                            void handleResolve(verifiedPass, "rechazar", false)
                          }
                          style={({ pressed }) => [
                            styles.rejectOutlineBtn,
                            pressed && styles.pressed,
                          ]}
                        >
                          {resolvingId === verifiedPass.id_entrevista &&
                          resolvingAction === "rechazar" ? (
                            <Spinner
                              size={18}
                              strokeWidth={2.4}
                              color="#FF3B30"
                            />
                          ) : (
                            <>
                              <XCircle size={17} color="#FF3B30" />
                              <Text style={styles.rejectOutlineText}>
                                Rechazar acceso
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.actionsStack}>
                        <AppButton
                          title="Abrir perfil completo y CV"
                          onPress={() =>
                            setViewingProfile({
                              idPostulacion: verifiedPass.id_postulacion,
                              idVacante: verifiedPass.id_vacante,
                            })
                          }
                        />
                      </View>
                    )}

                    <AppButton
                      title="Escanear otro QR"
                      variant="secondary"
                      onPress={() => {
                        setVerifiedPass(null);
                        setScannerLocked(false);
                      }}
                    />
                  </View>
                </View>
              ) : (
                <>
                  {/* Cámara escáner QR */}
                  <View
                    style={[
                      styles.scannerCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    {Platform.OS === "web" ? (
                      <View style={styles.permBox}>
                        <QrCode size={28} color={theme.primary} />
                        <Text style={[styles.permTitle, { color: theme.text }]}>
                          Usa la app móvil para escanear con cámara
                        </Text>
                        <Text
                          style={[
                            styles.permDesc,
                            { color: theme.textSecondary },
                          ]}
                        >
                          También puedes ingresar el código corto debajo (ej.
                          PRS-8A4C1F).
                        </Text>
                      </View>
                    ) : !permission?.granted ? (
                      <View style={styles.permBox}>
                        <QrCode size={28} color={theme.primary} />
                        <Text style={[styles.permTitle, { color: theme.text }]}>
                          Activa la cámara para escanear pases QR
                        </Text>
                        <Text
                          style={[
                            styles.permDesc,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Apunta al código QR que presenta el candidato para
                          validar su identidad y ver su perfil y CV.
                        </Text>
                        <AppButton
                          title="Permitir cámara"
                          onPress={async () => {
                            await requestPermission();
                          }}
                        />
                      </View>
                    ) : (
                      <View style={styles.cameraWrap}>
                        <CameraView
                          style={styles.camera}
                          facing="back"
                          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                          onBarcodeScanned={
                            scannerLocked
                              ? undefined
                              : (event) => {
                                  if (event.data) {
                                    void handleLookupCode(event.data);
                                  }
                                }
                          }
                        />
                        <View pointerEvents="none" style={styles.cameraOverlay}>
                          <View
                            style={[
                              styles.scanFrame,
                              { borderColor: theme.primary },
                            ]}
                          />
                          <Text style={styles.scanHint}>
                            Encuadra el Pase QR del postulante
                          </Text>
                        </View>
                        {lookupQr.isPending ? (
                          <View style={styles.scanningOverlay}>
                            <Spinner
                              size={28}
                              strokeWidth={2.8}
                              color="#FFFFFF"
                            />
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>

                  {/* Entrada manual de código */}
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Validar por código manual
                    </Text>
                    <View style={styles.manualRow}>
                      <View
                        style={[
                          styles.manualInputWrap,
                          {
                            backgroundColor: theme.inputBackground,
                            borderColor: theme.inputBorder,
                          },
                        ]}
                      >
                        <Search size={15} color={theme.textMuted} />
                        <TextInput
                          value={manualCode}
                          onChangeText={setManualCode}
                          placeholder="Ej. PRS-8A4C1F"
                          placeholderTextColor={theme.textMuted}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          style={[styles.manualInput, { color: theme.text }]}
                          onSubmitEditing={() =>
                            void handleLookupCode(manualCode)
                          }
                        />
                      </View>
                      <Pressable
                        disabled={
                          manualCode.trim().length < 4 || lookupQr.isPending
                        }
                        onPress={() => void handleLookupCode(manualCode)}
                        style={({ pressed }) => [
                          styles.verifyManualBtn,
                          {
                            backgroundColor: theme.primary,
                            opacity: manualCode.trim().length < 4 ? 0.45 : 1,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        {lookupQr.isPending ? (
                          <Spinner
                            size={18}
                            strokeWidth={2.4}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text style={styles.verifyManualText}>Validar</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          ) : (
            /* Pestaña 2: Registro completo de QRs de entrevistas */
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom + 24, 36) },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={manualRefreshing}
                  onRefresh={() => void handleManualRefresh()}
                  tintColor={theme.primary}
                />
              }
            >
              {isLoading ? (
                <View style={styles.loaderBox}>
                  <Spinner size={26} strokeWidth={2.6} color={theme.primary} />
                </View>
              ) : interviews.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  <QrCode size={26} color={theme.primary} />
                  <Text style={[styles.permTitle, { color: theme.text }]}>
                    Aún no has generado pases QR
                  </Text>
                  <Text
                    style={[styles.permDesc, { color: theme.textSecondary }]}
                  >
                    Entra al perfil de un postulante y toca “Agendar entrevista
                    y enviar QR” para enviarle la ubicación y foto de tu
                    oficina.
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.registryHint,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {pendingCount} pendiente{pendingCount === 1 ? "" : "s"} de
                    verificación · {interviews.length} en total
                  </Text>

                  {interviews.map((item) => {
                    const meta =
                      STATUS_META[item.estado] ?? STATUS_META.pendiente;
                    const isBusy = resolvingId === item.id_entrevista;

                    return (
                      <View
                        key={item.id_entrevista}
                        style={[
                          styles.card,
                          { backgroundColor: cardBg, borderColor: cardBorder },
                        ]}
                      >
                        <Pressable
                          onPress={() =>
                            setViewingProfile({
                              idPostulacion: item.id_postulacion,
                              idVacante: item.id_vacante,
                            })
                          }
                          style={({ pressed }) => [
                            styles.candidateRow,
                            pressed && styles.pressed,
                          ]}
                        >
                          <ProfileAvatar
                            uri={item.candidato?.foto_perfil}
                            initials={(item.candidato?.nombre || "C")
                              .slice(0, 2)
                              .toUpperCase()}
                            size={44}
                          />
                          <View style={styles.flexOne}>
                            <Text
                              style={[
                                styles.regCandidateName,
                                { color: theme.text },
                              ]}
                              numberOfLines={1}
                            >
                              {item.candidato?.nombre || "Candidato"}
                            </Text>
                            <Text
                              style={[
                                styles.candidateSub,
                                { color: theme.textSecondary },
                              ]}
                              numberOfLines={1}
                            >
                              {item.vacante?.titulo || "Vacante"}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: meta.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: meta.color },
                              ]}
                            >
                              {meta.label}
                            </Text>
                          </View>
                        </Pressable>

                        <View style={styles.regMetaRow}>
                          <Text
                            style={[styles.codeTag, { color: theme.primary }]}
                          >
                            QR: {item.codigo_corto}
                          </Text>
                          {item.fecha_hora ? (
                            <Text
                              style={[
                                styles.infoText,
                                { color: theme.textSecondary },
                              ]}
                              numberOfLines={1}
                            >
                              · {item.fecha_hora}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.infoLine}>
                          <MapPin size={13} color={theme.textSecondary} />
                          <Text
                            style={[
                              styles.infoText,
                              { color: theme.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {item.direccion_oficina}
                          </Text>
                        </View>

                        <View style={styles.regFooterRow}>
                          {item.estado === "pendiente" ? (
                            <View style={styles.decisionRow}>
                              <Pressable
                                disabled={isBusy}
                                onPress={() =>
                                  void handleResolve(item, "aprobar", true)
                                }
                                style={({ pressed }) => [
                                  styles.approveBtnSmall,
                                  pressed && styles.pressed,
                                ]}
                              >
                                {isBusy && resolvingAction === "aprobar" ? (
                                  <Spinner
                                    size={16}
                                    strokeWidth={2.2}
                                    color="#FFFFFF"
                                  />
                                ) : (
                                  <>
                                    <CheckCircle2 size={15} color="#FFFFFF" />
                                    <Text style={styles.decisionSmallText}>
                                      Aprobar y ver
                                    </Text>
                                  </>
                                )}
                              </Pressable>

                              <Pressable
                                disabled={isBusy}
                                onPress={() =>
                                  void handleResolve(item, "rechazar", false)
                                }
                                style={({ pressed }) => [
                                  styles.rejectBtnSmall,
                                  pressed && styles.pressed,
                                ]}
                              >
                                {isBusy && resolvingAction === "rechazar" ? (
                                  <Spinner
                                    size={16}
                                    strokeWidth={2.2}
                                    color="#FFFFFF"
                                  />
                                ) : (
                                  <>
                                    <XCircle size={15} color="#FFFFFF" />
                                    <Text style={styles.decisionSmallText}>
                                      Rechazar
                                    </Text>
                                  </>
                                )}
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable
                              onPress={() =>
                                setViewingProfile({
                                  idPostulacion: item.id_postulacion,
                                  idVacante: item.id_vacante,
                                })
                              }
                              style={({ pressed }) => [
                                styles.openProfileRowBtn,
                                { backgroundColor: theme.primarySoft },
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.openProfileRowText,
                                  { color: theme.primary },
                                ]}
                              >
                                Ver perfil completo y CV
                              </Text>
                              <ChevronRight size={15} color={theme.primary} />
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
          )}
        </View>
      )}
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
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 12.5,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  tabsWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  tabsBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },

  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    padding: 16,
    gap: 12,
  },

  verifiedStack: {
    gap: 12,
  },

  scannerCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  cameraWrap: {
    height: 300,
    position: "relative",
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  scanFrame: {
    width: 190,
    height: 190,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: "transparent",
  },

  scanHint: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },

  scanningOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  permBox: {
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  permTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  permDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 12,
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
  },

  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  manualInputWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  manualInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "700",
  },

  verifyManualBtn: {
    minWidth: 86,
    minHeight: 46,
    borderRadius: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  verifyManualText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },

  verifiedTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  verifiedEyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  identityHero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },

  heroName: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginTop: 2,
  },

  heroVacancy: {
    fontSize: 13,
    textAlign: "center",
  },

  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 2,
  },

  detailsBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },

  detailText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  candidateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  regCandidateName: {
    fontSize: 15,
    fontWeight: "800",
  },

  candidateSub: {
    fontSize: 12.5,
  },

  codeTag: {
    fontSize: 12.5,
    fontWeight: "800",
  },

  regMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },

  actionsStack: {
    gap: 8,
    marginTop: 2,
  },

  approvePrimaryBtn: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: "#34C759",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },

  rejectOutlineBtn: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 59, 48, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  rejectOutlineText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "700",
  },

  decisionRow: {
    flexDirection: "row",
    gap: 8,
  },

  decisionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  approveBtnSmall: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#34C759",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  rejectBtnSmall: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  decisionSmallText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  regFooterRow: {
    marginTop: 2,
  },

  openProfileRowBtn: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  openProfileRowText: {
    fontSize: 13.5,
    fontWeight: "800",
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
    gap: 10,
  },

  registryHint: {
    fontSize: 12.5,
    fontWeight: "600",
    paddingHorizontal: 4,
  },

  pressed: {
    opacity: 0.78,
  },
});
