import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  TicketCheck,
  XCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Spinner } from "@/components/ui/Spinner";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import type {
  InterviewPass,
  InterviewPassStatus,
} from "../types/interviews.types";

type RegistryTab = "pendientes" | "historial";

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatVerifiedDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()] ?? "";
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "p. m." : "a. m.";
  const hours12 = hours24 % 12 || 12;

  return `${day} ${month} · ${hours12}:${minutes} ${period}`;
}

export function getInterviewStatusColors(
  estado: InterviewPassStatus,
  theme: ReturnType<typeof useTheme>,
) {
  switch (estado) {
    case "pendiente":
      return {
        label: "Pendiente",
        color: theme.primary,
        bg: theme.primarySoft,
        border: theme.primaryBorder,
      };
    case "aprobada":
      return {
        label: "Aprobada",
        color: theme.success,
        bg: theme.successSoft,
        border: theme.successSoft,
      };
    case "rechazada":
      return {
        label: "Rechazada",
        color: theme.error,
        bg: theme.errorSoft,
        border: theme.errorSoft,
      };
    case "cancelada":
      return {
        label: "Deshabilitada",
        color: theme.textSecondary,
        bg: theme.inputBackground,
        border: theme.inputBorder,
      };
  }
}

interface EmployerInterviewTicketProps {
  item: InterviewPass;
  isDark: boolean;
  screenBg: string;
  initiallyExpanded?: boolean;
  allowResolve: boolean;
  allowManage: boolean;
  isBusy: boolean;
  isCanceling: boolean;
  resolvingAction: "aprobar" | "rechazar" | null;
  onResolve?: (
    pass: InterviewPass,
    accion: "aprobar" | "rechazar",
    openProfileOnApprove: boolean,
  ) => void;
  onReschedule?: (pass: InterviewPass) => void;
  onCancelInterview?: (pass: InterviewPass) => void;
  onOpenProfile: (idPostulacion: number, idVacante: number) => void;
}

function EmployerInterviewTicket({
  item,
  isDark,
  screenBg,
  initiallyExpanded = false,
  allowResolve,
  allowManage,
  isBusy,
  isCanceling,
  resolvingAction,
  onResolve,
  onReschedule,
  onCancelInterview,
  onOpenProfile,
}: EmployerInterviewTicketProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    if (initiallyExpanded) {
      setExpanded(true);
    }
  }, [initiallyExpanded]);

  const isPending = item.estado === "pendiente";
  const statusMeta = getInterviewStatusColors(item.estado, theme);
  const verifiedText = formatVerifiedDate(item.verificado_at);
  const candidateName = item.candidato?.nombre || "Candidato";
  const initials = candidateName.slice(0, 2).toUpperCase();

  const ticketBg = isPending
    ? isDark
      ? "#181513"
      : "#FFFFFF"
    : isDark
      ? "#141210"
      : "#FAF8F6";
  const ticketBorder = isPending
    ? theme.primaryBorder
    : isDark
      ? "rgba(255, 255, 255, 0.09)"
      : "rgba(23, 18, 14, 0.09)";
  const dashedColor = isPending
    ? isDark
      ? "rgba(240, 104, 8, 0.34)"
      : "rgba(240, 104, 8, 0.26)"
    : isDark
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(23, 18, 14, 0.14)";
  const drawerBg = isDark ? "#120F0D" : "#F6F2EE";
  const drawerBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const rejectBorderColor = isDark
    ? "rgba(252, 165, 165, 0.28)"
    : "rgba(180, 35, 24, 0.22)";

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const footerSummary = isPending
    ? "Pase activo para recepción"
    : item.estado === "cancelada"
      ? verifiedText
        ? `Deshabilitada · ${verifiedText}`
        : "Entrevista deshabilitada"
      : verifiedText
        ? `${statusMeta.label} · ${verifiedText}`
        : statusMeta.label;

  return (
    <View
      style={[
        styles.ticketCard,
        {
          backgroundColor: ticketBg,
          borderColor: ticketBorder,
        },
      ]}
    >
      {/* Cabecera fija estilo boleto (se mantiene arriba al abrir) */}
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [pressed && styles.cardPressed]}
      >
        <View style={styles.ticketMainRow}>
          <View style={!isPending && styles.historyAvatarDim}>
            <ProfileAvatar
              uri={item.candidato?.foto_perfil}
              initials={initials}
              size={52}
            />
          </View>

          <View style={styles.ticketInfoCol}>
            <View style={styles.ticketHeaderLine}>
              <Text
                numberOfLines={1}
                style={[styles.ticketVacancyEyebrow, { color: theme.textSecondary }]}
              >
                {item.vacante?.titulo || "Entrevista presencial"}
              </Text>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusMeta.bg },
                ]}
              >
                <Text
                  style={[styles.statusPillText, { color: statusMeta.color }]}
                >
                  {statusMeta.label}
                </Text>
              </View>
            </View>

            <Text
              numberOfLines={expanded ? 2 : 1}
              style={[styles.ticketCandidateName, { color: theme.text }]}
            >
              {candidateName}
            </Text>

            <View style={styles.ticketMetaRow}>
              <CalendarClock
                size={12.5}
                color={isPending ? theme.primary : theme.textMuted}
              />
              <Text
                numberOfLines={1}
                style={[styles.ticketMetaText, { color: theme.textSecondary }]}
              >
                {item.fecha_hora || "Cita presencial programada"}
              </Text>
            </View>
          </View>
        </View>

        {/* Línea perforada de boleto */}
        <View style={styles.perforationWrap}>
          <View
            style={[
              styles.perforationNotchLeft,
              { backgroundColor: screenBg, borderColor: ticketBorder },
            ]}
          />
          <View
            style={[styles.perforationLine, { borderColor: dashedColor }]}
          />
          <View
            style={[
              styles.perforationNotchRight,
              { backgroundColor: screenBg, borderColor: ticketBorder },
            ]}
          />
        </View>

        {/* Pie compacto del boleto (sin prefijo QR: PRS) */}
        <View style={styles.ticketFooterRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.ticketFooterMeta,
              { color: isPending ? theme.primary : theme.textSecondary },
            ]}
          >
            {footerSummary}
          </Text>

          <View style={styles.openHint}>
            <Text style={[styles.openHintText, { color: theme.textSecondary }]}>
              {expanded ? "Ocultar" : "Ver más"}
            </Text>
            {expanded ? (
              <ChevronUp
                size={15}
                color={isPending ? theme.primary : theme.textSecondary}
              />
            ) : (
              <ChevronDown
                size={15}
                color={isPending ? theme.primary : theme.textSecondary}
              />
            )}
          </View>
        </View>
      </Pressable>

      {/* Cajón desplegable con detalle completo y acciones */}
      {expanded ? (
        <View
          style={[
            styles.expandedDrawer,
            { backgroundColor: drawerBg, borderColor: drawerBorder },
          ]}
        >
          {/* Datos de la entrevista y contacto */}
          <View style={styles.drawerSection}>
            {item.direccion_oficina ? (
              <View style={styles.detailRow}>
                <MapPin size={14} color={theme.primary} />
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {item.direccion_oficina}
                </Text>
              </View>
            ) : null}

            {item.referencias ? (
              <Text
                style={[
                  styles.referencesBox,
                  {
                    color: theme.textSecondary,
                    backgroundColor: theme.inputBackground,
                  },
                ]}
              >
                Indicaciones: {item.referencias}
              </Text>
            ) : null}

            {item.candidato?.email ? (
              <View style={styles.detailRow}>
                <Mail size={14} color={theme.textSecondary} />
                <Text
                  numberOfLines={1}
                  style={[styles.detailText, { color: theme.textSecondary }]}
                >
                  {item.candidato.email}
                </Text>
              </View>
            ) : null}

            {item.candidato?.celular ? (
              <View style={styles.detailRow}>
                <Phone size={14} color={theme.textSecondary} />
                <Text
                  style={[styles.detailText, { color: theme.textSecondary }]}
                >
                  {item.candidato.celular}
                </Text>
              </View>
            ) : null}

            {verifiedText ? (
              <View style={styles.detailRow}>
                <Clock size={14} color={theme.textMuted} />
                <Text style={[styles.detailText, { color: theme.textMuted }]}>
                  Registrado el {verifiedText}
                </Text>
              </View>
            ) : null}

            {item.candidato_resumen ? (
              <View style={styles.detailRow}>
                <FileText
                  size={14}
                  color={
                    item.candidato_resumen.cv_subido
                      ? theme.success
                      : theme.textMuted
                  }
                />
                <Text
                  style={[
                    styles.detailText,
                    {
                      color: item.candidato_resumen.cv_subido
                        ? theme.success
                        : theme.textSecondary,
                      fontWeight: item.candidato_resumen.cv_subido
                        ? "700"
                        : "500",
                    },
                  ]}
                >
                  {item.candidato_resumen.cv_subido
                    ? "CV disponible en su perfil"
                    : "Sin CV cargado"}
                </Text>
              </View>
            ) : null}

            {item.foto_referencia_url ? (
              <Image
                source={{ uri: item.foto_referencia_url }}
                style={styles.officeThumb}
                contentFit="cover"
              />
            ) : null}
          </View>

          <View
            style={[styles.drawerDivider, { backgroundColor: drawerBorder }]}
          />

          {/* Acciones con colores armónicos del tema */}
          <View style={styles.drawerActions}>
            {isPending && allowResolve && onResolve ? (
              <>
                <View style={styles.decisionRow}>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => onResolve(item, "aprobar", true)}
                    style={({ pressed }) => [
                      styles.approveThemeBtn,
                      { backgroundColor: theme.primary },
                      pressed && styles.pressed,
                      isBusy && styles.disabledBtn,
                    ]}
                  >
                    {isBusy && resolvingAction === "aprobar" ? (
                      <Spinner size={16} strokeWidth={2.2} color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={15} color="#FFFFFF" />
                        <Text style={styles.approveThemeText}>
                          Aprobar y ver
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    disabled={isBusy}
                    onPress={() => onResolve(item, "rechazar", false)}
                    style={({ pressed }) => [
                      styles.rejectThemeBtn,
                      {
                        backgroundColor: theme.errorSoft,
                        borderColor: rejectBorderColor,
                      },
                      pressed && styles.pressed,
                      isBusy && styles.disabledBtn,
                    ]}
                  >
                    {isBusy && resolvingAction === "rechazar" ? (
                      <Spinner
                        size={16}
                        strokeWidth={2.2}
                        color={theme.error}
                      />
                    ) : (
                      <>
                        <XCircle size={15} color={theme.error} />
                        <Text
                          style={[
                            styles.rejectThemeText,
                            { color: theme.error },
                          ]}
                        >
                          Rechazar
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <Pressable
                  onPress={() =>
                    onOpenProfile(item.id_postulacion, item.id_vacante)
                  }
                  style={({ pressed }) => [
                    styles.profileLinkBtn,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: drawerBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.profileLinkText, { color: theme.text }]}>
                    Ver perfil del candidato
                  </Text>
                  <ChevronRight size={15} color={theme.textSecondary} />
                </Pressable>
              </>
            ) : isPending && allowManage && (onReschedule || onCancelInterview) ? (
              <>
                <View style={styles.decisionRow}>
                  {onReschedule ? (
                    <Pressable
                      disabled={isCanceling}
                      onPress={() => onReschedule(item)}
                      style={({ pressed }) => [
                        styles.approveThemeBtn,
                        { backgroundColor: theme.primary },
                        pressed && styles.pressed,
                        isCanceling && styles.disabledBtn,
                      ]}
                    >
                      <CalendarClock size={15} color="#FFFFFF" />
                      <Text style={styles.approveThemeText}>Reprogramar</Text>
                    </Pressable>
                  ) : null}

                  {onCancelInterview ? (
                    <Pressable
                      disabled={isCanceling}
                      onPress={() => onCancelInterview(item)}
                      style={({ pressed }) => [
                        styles.rejectThemeBtn,
                        {
                          backgroundColor: theme.errorSoft,
                          borderColor: rejectBorderColor,
                        },
                        pressed && styles.pressed,
                        isCanceling && styles.disabledBtn,
                      ]}
                    >
                      {isCanceling ? (
                        <Spinner
                          size={16}
                          strokeWidth={2.2}
                          color={theme.error}
                        />
                      ) : (
                        <>
                          <Ban size={15} color={theme.error} />
                          <Text
                            style={[
                              styles.rejectThemeText,
                              { color: theme.error },
                            ]}
                          >
                            Cancelar
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  onPress={() =>
                    onOpenProfile(item.id_postulacion, item.id_vacante)
                  }
                  style={({ pressed }) => [
                    styles.profileLinkBtn,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: drawerBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.profileLinkText, { color: theme.text }]}>
                    Ver perfil completo y CV
                  </Text>
                  <ChevronRight size={15} color={theme.textSecondary} />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() =>
                  onOpenProfile(item.id_postulacion, item.id_vacante)
                }
                style={({ pressed }) => [
                  styles.profileLinkBtn,
                  {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.primaryBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.profileLinkText, { color: theme.primary }]}
                >
                  Ver perfil completo y CV
                </Text>
                <ChevronRight size={15} color={theme.primary} />
              </Pressable>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export interface EmployerInterviewRegistryProps {
  interviews: InterviewPass[];
  isLoading: boolean;
  refreshing: boolean;
  screenBg: string;
  bottomPadding?: number;
  highlightInterviewId?: number | null;
  allowResolve?: boolean;
  allowManage?: boolean;
  resolvingId?: number | null;
  cancelingId?: number | null;
  resolvingAction?: "aprobar" | "rechazar" | null;
  onRefresh: () => void;
  onResolve?: (
    pass: InterviewPass,
    accion: "aprobar" | "rechazar",
    openProfileOnApprove: boolean,
  ) => void;
  onReschedule?: (pass: InterviewPass) => void;
  onCancelInterview?: (pass: InterviewPass) => void;
  onOpenProfile: (idPostulacion: number, idVacante: number) => void;
}

export function EmployerInterviewRegistry({
  interviews,
  isLoading,
  refreshing,
  screenBg,
  bottomPadding = 40,
  highlightInterviewId = null,
  allowResolve = true,
  allowManage = false,
  resolvingId = null,
  cancelingId = null,
  resolvingAction = null,
  onRefresh,
  onResolve,
  onReschedule,
  onCancelInterview,
  onOpenProfile,
}: EmployerInterviewRegistryProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const pendingInterviews = useMemo(
    () => interviews.filter((item) => item.estado === "pendiente"),
    [interviews],
  );
  const historyInterviews = useMemo(
    () => interviews.filter((item) => item.estado !== "pendiente"),
    [interviews],
  );

  const [activeTab, setActiveTab] = useState<RegistryTab>("pendientes");
  const [hasAutoPickedTab, setHasAutoPickedTab] = useState(false);

  useEffect(() => {
    if (highlightInterviewId) {
      const target = interviews.find(
        (item) => item.id_entrevista === highlightInterviewId,
      );
      if (target) {
        setActiveTab(target.estado === "pendiente" ? "pendientes" : "historial");
        setHasAutoPickedTab(true);
        return;
      }
    }

    if (!isLoading && !hasAutoPickedTab && interviews.length > 0) {
      if (pendingInterviews.length === 0 && historyInterviews.length > 0) {
        setActiveTab("historial");
      }
      setHasAutoPickedTab(true);
    }
  }, [
    highlightInterviewId,
    interviews,
    isLoading,
    hasAutoPickedTab,
    pendingInterviews.length,
    historyInterviews.length,
  ]);

  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";
  const segmentBg = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(23, 18, 14, 0.055)";
  const segmentActiveBg = isDark ? "#241F1C" : "#FFFFFF";

  const currentList =
    activeTab === "pendientes" ? pendingInterviews : historyInterviews;

  const handleSelectTab = (tab: RegistryTab) => {
    if (tab === activeTab) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setActiveTab(tab);
  };

  return (
    <View style={styles.root}>
      {!isLoading && interviews.length > 0 ? (
        <View style={styles.segmentOuter}>
          <View
            style={[
              styles.segmentTrack,
              { backgroundColor: segmentBg, borderColor: cardBorder },
            ]}
          >
            <Pressable
              onPress={() => handleSelectTab("pendientes")}
              style={[
                styles.segmentOption,
                activeTab === "pendientes" && [
                  styles.segmentOptionActive,
                  { backgroundColor: segmentActiveBg },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color:
                      activeTab === "pendientes"
                        ? theme.text
                        : theme.textSecondary,
                  },
                ]}
              >
                Pendientes
              </Text>
              <View
                style={[
                  styles.segmentCountPill,
                  {
                    backgroundColor:
                      activeTab === "pendientes"
                        ? theme.primarySoft
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(23,18,14,0.07)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountText,
                    {
                      color:
                        activeTab === "pendientes"
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {pendingInterviews.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleSelectTab("historial")}
              style={[
                styles.segmentOption,
                activeTab === "historial" && [
                  styles.segmentOptionActive,
                  { backgroundColor: segmentActiveBg },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color:
                      activeTab === "historial"
                        ? theme.text
                        : theme.textSecondary,
                  },
                ]}
              >
                Historial
              </Text>
              <View
                style={[
                  styles.segmentCountPill,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(23,18,14,0.08)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountText,
                    {
                      color:
                        activeTab === "historial"
                          ? theme.text
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {historyInterviews.length}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}
            >
              <TicketCheck size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes entrevistas registradas
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Coloca a un candidato en estado Entrevista dentro de su perfil y
              genera su pase para que aparezca aquí.
            </Text>
          </View>
        ) : currentList.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor:
                    activeTab === "pendientes"
                      ? theme.primarySoft
                      : theme.inputBackground,
                },
              ]}
            >
              <TicketCheck
                size={23}
                color={
                  activeTab === "pendientes"
                    ? theme.primary
                    : theme.textSecondary
                }
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {activeTab === "pendientes"
                ? "No hay entrevistas pendientes"
                : "Sin registros en el historial"}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {activeTab === "pendientes"
                ? allowResolve
                  ? "Las entrevistas con pase activo aparecerán aquí listas para aprobar o rechazar."
                  : "Las entrevistas agendadas aparecerán aquí. Para aprobar o rechazar accesos usa Registrar QR."
                : "Aquí aparecerán las entrevistas aprobadas, rechazadas o canceladas."}
            </Text>
          </View>
        ) : (
          currentList.map((item) => (
            <EmployerInterviewTicket
              key={item.id_entrevista}
              item={item}
              isDark={isDark}
              screenBg={screenBg}
              initiallyExpanded={highlightInterviewId === item.id_entrevista}
              allowResolve={allowResolve}
              allowManage={allowManage}
              isBusy={resolvingId === item.id_entrevista}
              isCanceling={cancelingId === item.id_entrevista}
              resolvingAction={
                resolvingId === item.id_entrevista ? resolvingAction : null
              }
              onResolve={onResolve}
              onReschedule={onReschedule}
              onCancelInterview={onCancelInterview}
              onOpenProfile={onOpenProfile}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  segmentOuter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },

  segmentTrack: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },

  segmentOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  segmentOptionActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  segmentLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  segmentCountPill: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentCountText: {
    fontSize: 11.5,
    fontWeight: "800",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 13,
  },

  loaderBox: {
    paddingVertical: 56,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
  },

  /* ---- Boleto / Ticket ---- */
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },

  cardPressed: {
    opacity: 0.9,
  },

  ticketMainRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },

  historyAvatarDim: {
    opacity: 0.85,
  },

  ticketInfoCol: {
    flex: 1,
    gap: 4,
  },

  ticketHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  ticketVacancyEyebrow: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  ticketCandidateName: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  ticketMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  ticketMetaText: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },

  perforationWrap: {
    height: 18,
    justifyContent: "center",
    position: "relative",
  },

  perforationLine: {
    borderBottomWidth: 1.2,
    borderStyle: "dashed",
    marginHorizontal: 14,
  },

  perforationNotchLeft: {
    position: "absolute",
    left: -10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },

  perforationNotchRight: {
    position: "absolute",
    right: -10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },

  ticketFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 12,
    gap: 10,
  },

  ticketFooterMeta: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },

  openHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  openHintText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ---- Cajón expandido ---- */
  expandedDrawer: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  drawerSection: {
    padding: 13,
    gap: 9,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },

  referencesBox: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  officeThumb: {
    width: "100%",
    height: 128,
    borderRadius: 12,
    marginTop: 2,
  },

  drawerDivider: {
    height: StyleSheet.hairlineWidth,
  },

  drawerActions: {
    padding: 12,
    gap: 8,
  },

  decisionRow: {
    flexDirection: "row",
    gap: 8,
  },

  approveThemeBtn: {
    flex: 1.25,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },

  approveThemeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  rejectThemeBtn: {
    flex: 0.95,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },

  rejectThemeText: {
    fontSize: 13,
    fontWeight: "700",
  },

  profileLinkBtn: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  profileLinkText: {
    fontSize: 13,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.78,
  },

  disabledBtn: {
    opacity: 0.55,
  },
});
