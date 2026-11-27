import * as Brightness from "expo-brightness";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  BadgeCheck,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Maximize2,
  QrCode,
  ReceiptText,
  TicketCheck,
  X,
  XCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QrCodeView, type QrCodeViewHandle } from "@/components/ui/QrCodeView";
import { Spinner } from "@/components/ui/Spinner";
import { useMyInterviews } from "@/features/employer/hooks/use-interviews";
import type {
  InterviewPass,
  InterviewPassStatus,
} from "@/features/employer/types/interviews.types";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { saveQrPngToGallery } from "@/lib/qr/save-qr-image";

type InterviewTab = "vigentes" | "usados";

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

function getUsedStatusMeta(estado: InterviewPassStatus) {
  switch (estado) {
    case "aprobada":
      return {
        badge: "QR usado",
        detail: "Acceso verificado",
        footerLabel: "Acceso confirmado",
        stamp: "USADO",
      };
    case "rechazada":
      return {
        badge: "QR usado",
        detail: "Acceso rechazado",
        footerLabel: "Acceso rechazado",
        stamp: "USADO",
      };
    case "cancelada":
      return {
        badge: "Anulado",
        detail: "Pase reemplazado o cancelado",
        footerLabel: "Pase anulado",
        stamp: "ANULADO",
      };
    default:
      return {
        badge: "QR usado",
        detail: "Completada",
        footerLabel: "Pase redimido",
        stamp: "USADO",
      };
  }
}

function openMapsForInterview(item: InterviewPass) {
  if (Platform.OS !== "web") {
    void Haptics.selectionAsync();
  }
  const encodedAddr = encodeURIComponent(item.direccion_oficina);
  if (item.latitud !== null && item.longitud !== null) {
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${item.latitud},${item.longitud}&q=${encodedAddr}`
        : `https://www.google.com/maps/search/?api=1&query=${item.latitud},${item.longitud}`;
    void Linking.openURL(url);
    return;
  }

  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?q=${encodedAddr}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedAddr}`;
  void Linking.openURL(url);
}

async function exportAndSaveQr(
  qrRef: React.RefObject<QrCodeViewHandle | null>,
  shortCode: string,
): Promise<boolean> {
  if (!qrRef.current) {
    Alert.alert("No disponible", "El código QR aún no está listo para guardarse.");
    return false;
  }

  try {
    const base64 = await qrRef.current.toPngBase64();
    const res = await saveQrPngToGallery(base64, shortCode);

    if (res.ok) {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      Alert.alert(
        "QR guardado",
        Platform.OS === "web"
          ? "La imagen del Pase QR se descargó correctamente."
          : "Tu Pase QR se guardó en tu galería de fotos.",
      );
      return true;
    }

    if (res.permissionDenied) {
      Alert.alert("Permiso de fotos requerido", res.message, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Abrir ajustes",
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ]);
      return false;
    }

    Alert.alert("No se pudo guardar", res.message);
    return false;
  } catch {
    Alert.alert(
      "No se pudo guardar",
      "Ocurrió un problema al generar la imagen del código QR.",
    );
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  MODAL QR AMPLIADO (FONDO OSCURO, SOLO QR CON SU BORDE, BRILLO INTERNO)    */
/* -------------------------------------------------------------------------- */

interface QrFullscreenModalProps {
  item: InterviewPass | null;
  onClose: () => void;
}

function QrFullscreenModal({ item, onClose }: QrFullscreenModalProps) {
  const insets = useSafeAreaInsets();
  const previousBrightnessRef = useRef<number | null>(null);

  useEffect(() => {
    if (!item || Platform.OS === "web") return;

    let active = true;

    const boostBrightness = async () => {
      try {
        const current = await Brightness.getBrightnessAsync();
        if (!active) return;
        previousBrightnessRef.current = current;
        await Brightness.setBrightnessAsync(1);
      } catch {
        // Control interno de brillo: ignorar si no está soportado
      }
    };

    void boostBrightness();

    return () => {
      active = false;
      const previous = previousBrightnessRef.current;
      previousBrightnessRef.current = null;

      void (async () => {
        try {
          if (Platform.OS === "android") {
            await Brightness.restoreSystemBrightnessAsync();
          } else if (previous !== null) {
            await Brightness.setBrightnessAsync(previous);
          }
        } catch {
          // Ignorar fallo al restaurar brillo
        }
      })();
    };
  }, [item]);

  return (
    <Modal
      visible={item !== null}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.modalDarkBackdrop}>
        {/* Botón discreto de cierre arriba a la derecha */}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cerrar código QR"
          style={({ pressed }) => [
            styles.modalCloseBtn,
            { top: Math.max(insets.top + 12, 24) },
            pressed && styles.pressed,
          ]}
        >
          <X size={20} color="#FFFFFF" />
        </Pressable>

        {item ? (
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.modalCenterBlock}
          >
            {/* Solo el QR y su borde blanco iluminado */}
            <View style={styles.modalQrBorderFrame}>
              <QrCodeView
                value={item.qr_token}
                size={272}
                color="#000000"
                backgroundColor="#FFFFFF"
                quietZone={4}
              />
            </View>

            <Text style={styles.modalShortCode}>{item.codigo_corto}</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  TICKET VIGENTE (DISEÑO UNIFORME CON USADOS: ARRIBA SE MANTIENE AL ABRIR)  */
/* -------------------------------------------------------------------------- */

interface ActiveInterviewTicketProps {
  item: InterviewPass;
  isDark: boolean;
  screenBg: string;
  onExpandQr: (item: InterviewPass) => void;
}

function ActiveInterviewTicket({
  item,
  isDark,
  screenBg,
  onExpandQr,
}: ActiveInterviewTicketProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [savingQr, setSavingQr] = useState(false);
  const qrRef = useRef<QrCodeViewHandle>(null);

  const ticketBg = isDark ? "#181513" : "#FFFFFF";
  const innerSurface = isDark ? "#120F0D" : "#FAF7F4";
  const innerBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";
  const dashedLine = isDark
    ? "rgba(240, 104, 8, 0.36)"
    : "rgba(240, 104, 8, 0.28)";

  const handleToggleOpen = () => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setExpanded((prev) => !prev);
  };

  const handleOpenFullscreenQr = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onExpandQr(item);
  };

  const handleSaveQr = async () => {
    if (savingQr) return;
    setSavingQr(true);
    try {
      await exportAndSaveQr(qrRef, item.codigo_corto);
    } finally {
      setSavingQr(false);
    }
  };

  return (
    <View
      style={[
        styles.compactActiveCard,
        {
          backgroundColor: ticketBg,
          borderColor: theme.primaryBorder,
        },
      ]}
    >
      {/* Cabecera fija estilo boleto (idéntica en estructura a Usados, se mantiene al abrir) */}
      <Pressable
        onPress={handleToggleOpen}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [pressed && styles.cardPressed]}
      >
        <View style={styles.ticketMainRow}>
          {/* Miniatura QR nítida a color */}
          <View
            style={[
              styles.activeQrThumb,
              {
                backgroundColor: "#FFFFFF",
                borderColor: theme.primaryBorder,
              },
            ]}
          >
            <QrCodeView
              value={item.qr_token}
              size={54}
              color="#17120E"
              backgroundColor="#FFFFFF"
              quietZone={2}
            />
          </View>

          {/* Información principal */}
          <View style={styles.ticketInfoCol}>
            <View style={styles.ticketHeaderLine}>
              <View style={styles.ticketCompanyRow}>
                <Building2 size={12.5} color={theme.primary} />
                <Text
                  numberOfLines={1}
                  style={[styles.ticketCompanyName, { color: theme.text }]}
                >
                  {item.empresa?.nombre_comercial || "Empresa en Perso"}
                </Text>
                {item.empresa?.verificada ? (
                  <BadgeCheck size={12.5} color="#34C759" />
                ) : null}
              </View>

              <View
                style={[
                  styles.activeCompactBadge,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Text
                  style={[
                    styles.activeCompactBadgeText,
                    { color: theme.primary },
                  ]}
                >
                  Vigente
                </Text>
              </View>
            </View>

            <Text
              numberOfLines={expanded ? 2 : 1}
              style={[styles.ticketVacancyTitle, { color: theme.text }]}
            >
              {item.vacante?.titulo || "Entrevista presencial"}
            </Text>

            <View style={styles.ticketMetaRow}>
              <CalendarClock size={12} color={theme.primary} />
              <Text
                numberOfLines={1}
                style={[
                  styles.ticketMetaText,
                  { color: theme.textSecondary },
                ]}
              >
                {item.fecha_hora || "Pase listo para presentar en recepción"}
              </Text>
            </View>
          </View>
        </View>

        {/* Línea perforada estilo boleto */}
        <View style={styles.perforationWrap}>
          <View
            style={[
              styles.perforationNotchLeft,
              { backgroundColor: screenBg, borderColor: theme.primaryBorder },
            ]}
          />
          <View
            style={[styles.perforationLine, { borderColor: dashedLine }]}
          />
          <View
            style={[
              styles.perforationNotchRight,
              { backgroundColor: screenBg, borderColor: theme.primaryBorder },
            ]}
          />
        </View>

        {/* Pie del boleto (misma estructura que Usados) */}
        <View style={styles.ticketFooterRow}>
          <Text
            style={[styles.activeCodeCompact, { color: theme.primary }]}
            numberOfLines={1}
          >
            {item.codigo_corto}
          </Text>

          <View style={styles.openPassHint}>
            <Text style={[styles.openPassText, { color: theme.textSecondary }]}>
              {expanded ? "Ocultar pase" : "Ver pase completo"}
            </Text>
            {expanded ? (
              <ChevronUp size={15} color={theme.primary} />
            ) : (
              <ChevronDown size={15} color={theme.primary} />
            )}
          </View>
        </View>
      </Pressable>

      {/* Contenido completo desplegado debajo manteniendo la cabecera superior */}
      {expanded ? (
        <View
          style={[
            styles.activeExpandedDrawer,
            {
              backgroundColor: innerSurface,
              borderColor: innerBorder,
            },
          ]}
        >
          {/* Zona del Pase QR */}
          <View style={styles.activeQrSection}>
            <Text style={[styles.activeQrEyebrow, { color: theme.primary }]}>
              PASE QR DE ACCESO
            </Text>

            <Pressable
              onPress={handleOpenFullscreenQr}
              accessibilityRole="button"
              accessibilityLabel="Ampliar código QR"
              style={({ pressed }) => [
                styles.activeQrWell,
                { backgroundColor: ticketBg, borderColor: innerBorder },
                pressed && styles.qrWellPressed,
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.cornerBracket,
                  styles.cornerTL,
                  { borderColor: theme.primary },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.cornerBracket,
                  styles.cornerTR,
                  { borderColor: theme.primary },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.cornerBracket,
                  styles.cornerBL,
                  { borderColor: theme.primary },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.cornerBracket,
                  styles.cornerBR,
                  { borderColor: theme.primary },
                ]}
              />

              <View style={styles.qrFrameWhite}>
                <QrCodeView
                  ref={qrRef}
                  value={item.qr_token}
                  size={190}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  quietZone={3}
                />
              </View>
            </Pressable>

            <View
              style={[
                styles.activeCodePill,
                {
                  backgroundColor: theme.primarySoft,
                  borderColor: theme.primaryBorder,
                },
              ]}
            >
              <Text style={[styles.activeCodeText, { color: theme.primary }]}>
                {item.codigo_corto}
              </Text>
            </View>

            <Text style={[styles.activeQrHint, { color: theme.textSecondary }]}>
              Toca el QR para ampliarlo en pantalla completa al llegar a
              recepción.
            </Text>

            {/* Acciones del QR: Ampliar y Guardar imagen */}
            <View style={styles.qrActionsRow}>
              <Pressable
                onPress={handleOpenFullscreenQr}
                style={({ pressed }) => [
                  styles.qrActionBtn,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Maximize2 size={15} color="#FFFFFF" />
                <Text style={styles.qrActionPrimaryText}>Ampliar QR</Text>
              </Pressable>

              <Pressable
                onPress={() => void handleSaveQr()}
                disabled={savingQr}
                style={({ pressed }) => [
                  styles.qrActionBtn,
                  {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.primaryBorder,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                  pressed && styles.pressed,
                  savingQr && styles.disabledBtn,
                ]}
              >
                {savingQr ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Download size={15} color={theme.primary} />
                    <Text
                      style={[
                        styles.qrActionSecondaryText,
                        { color: theme.primary },
                      ]}
                    >
                      Guardar imagen
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View
            style={[styles.drawerDivider, { backgroundColor: innerBorder }]}
          />

          {/* Ubicación y referencia de oficina */}
          <View style={styles.activeStubSection}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.stubIconBadge,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <MapPin size={14} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Ubicación de la oficina
              </Text>
            </View>

            <Text style={[styles.addressText, { color: theme.textSecondary }]}>
              {item.direccion_oficina}
            </Text>

            {item.referencias ? (
              <Text
                style={[
                  styles.referencesBox,
                  {
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                  },
                ]}
              >
                Indicaciones: {item.referencias}
              </Text>
            ) : null}

            {item.latitud !== null && item.longitud !== null ? (
              <View style={styles.mapFrame}>
                <InteractiveAddressMap
                  coords={{ lat: item.latitud, lng: item.longitud }}
                  height={146}
                  readOnly
                />
              </View>
            ) : null}

            <Pressable
              onPress={() => openMapsForInterview(item)}
              style={({ pressed }) => [
                styles.mapsBtn,
                {
                  backgroundColor: theme.primarySoft,
                  borderColor: theme.primaryBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <ExternalLink size={15} color={theme.primary} />
              <Text style={[styles.mapsBtnText, { color: theme.primary }]}>
                Cómo llegar · Abrir en Mapas
              </Text>
            </Pressable>

            {item.foto_referencia_url ? (
              <View style={styles.officeImageWrap}>
                <Image
                  source={{ uri: item.foto_referencia_url }}
                  style={styles.officeImage}
                  contentFit="cover"
                />
                <View style={styles.officeImageBadge}>
                  <Text style={styles.officeImageBadgeText}>
                    Referencia de oficina
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  TICKET USADO (COMPACTO, BLANCO Y NEGRO, SIN DIRECCIÓN)                    */
/* -------------------------------------------------------------------------- */

interface UsedInterviewTicketProps {
  item: InterviewPass;
  isDark: boolean;
  screenBg: string;
}

function UsedInterviewTicket({
  item,
  isDark,
  screenBg,
}: UsedInterviewTicketProps) {
  const [expanded, setExpanded] = useState(false);

  const meta = getUsedStatusMeta(item.estado);
  const usedTimestamp = formatVerifiedDate(item.verificado_at);

  const mono = {
    surface: isDark ? "#141414" : "#F6F6F6",
    surfaceSubtle: isDark ? "#1D1D1D" : "#ECECEC",
    border: isDark ? "rgba(255, 255, 255, 0.11)" : "rgba(0, 0, 0, 0.11)",
    dashedBorder: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.14)",
    inkPrimary: isDark ? "#D4D4D4" : "#262626",
    inkSecondary: isDark ? "#8A8A8A" : "#6B6B6B",
    inkMuted: isDark ? "#666666" : "#8F8F8F",
    pillBg: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)",
    pillBorder: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)",
    qrFg: isDark ? "#737373" : "#7A7A7A",
    qrBg: isDark ? "#1C1C1C" : "#FFFFFF",
    stampBg: isDark ? "rgba(18, 18, 18, 0.88)" : "rgba(255, 255, 255, 0.92)",
    stampBorder: isDark ? "#A3A3A3" : "#262626",
    stampText: isDark ? "#E5E5E5" : "#171717",
  };

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setExpanded((prev) => !prev);
  };

  const StatusIcon =
    item.estado === "aprobada"
      ? CheckCircle2
      : item.estado === "rechazada"
        ? XCircle
        : Ban;

  return (
    <Pressable
      onPress={handleToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={({ pressed }) => [
        styles.usedCard,
        {
          backgroundColor: mono.surface,
          borderColor: mono.border,
        },
        pressed && styles.cardPressed,
      ]}
    >
      {/* Cuerpo principal compacto */}
      <View style={styles.ticketMainRow}>
        {/* Miniatura QR en blanco y negro con sello USADO */}
        <View
          style={[
            styles.usedQrThumb,
            {
              backgroundColor: mono.qrBg,
              borderColor: mono.border,
            },
          ]}
        >
          <View style={styles.usedQrFaded}>
            <QrCodeView
              value={item.qr_token}
              size={54}
              color={mono.qrFg}
              backgroundColor={mono.qrBg}
              quietZone={2}
            />
          </View>
          <View
            style={[
              styles.usedStampOverlay,
              {
                backgroundColor: mono.stampBg,
                borderColor: mono.stampBorder,
              },
            ]}
          >
            <Text style={[styles.usedStampText, { color: mono.stampText }]}>
              {meta.stamp}
            </Text>
          </View>
        </View>

        {/* Información condensada */}
        <View style={styles.ticketInfoCol}>
          <View style={styles.ticketHeaderLine}>
            <View style={styles.ticketCompanyRow}>
              <Building2 size={12.5} color={mono.inkSecondary} />
              <Text
                numberOfLines={1}
                style={[styles.ticketCompanyName, { color: mono.inkSecondary }]}
              >
                {item.empresa?.nombre_comercial || "Empresa en Perso"}
              </Text>
              {item.empresa?.verificada ? (
                <BadgeCheck size={12.5} color={mono.inkMuted} />
              ) : null}
            </View>

            <View
              style={[
                styles.usedBadge,
                {
                  backgroundColor: mono.pillBg,
                  borderColor: mono.pillBorder,
                },
              ]}
            >
              <StatusIcon size={11} color={mono.inkPrimary} />
              <Text style={[styles.usedBadgeText, { color: mono.inkPrimary }]}>
                {meta.badge}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[styles.ticketVacancyTitle, { color: mono.inkPrimary }]}
          >
            {item.vacante?.titulo || "Entrevista"}
          </Text>

          <View style={styles.ticketMetaRow}>
            <Clock size={12} color={mono.inkMuted} />
            <Text
              numberOfLines={1}
              style={[styles.ticketMetaText, { color: mono.inkSecondary }]}
            >
              {usedTimestamp
                ? `${meta.detail} · ${usedTimestamp}`
                : item.fecha_hora
                  ? `${meta.detail} · ${item.fecha_hora}`
                  : meta.detail}
            </Text>
          </View>
        </View>
      </View>

      {/* Línea perforada estilo boleto */}
      <View style={styles.perforationWrap}>
        <View
          style={[
            styles.perforationNotchLeft,
            { backgroundColor: screenBg, borderColor: mono.border },
          ]}
        />
        <View
          style={[styles.perforationLine, { borderColor: mono.dashedBorder }]}
        />
        <View
          style={[
            styles.perforationNotchRight,
            { backgroundColor: screenBg, borderColor: mono.border },
          ]}
        />
      </View>

      {/* Pie reducido sin dirección */}
      <View style={styles.ticketFooterRow}>
        <Text
          style={[styles.usedCodeStrike, { color: mono.inkMuted }]}
          numberOfLines={1}
        >
          {item.codigo_corto}
        </Text>

        <View style={styles.usedStatusSummary}>
          <ReceiptText size={12} color={mono.inkMuted} />
          <Text
            numberOfLines={1}
            style={[styles.usedFooterLabel, { color: mono.inkSecondary }]}
          >
            {meta.footerLabel}
          </Text>
        </View>

        <View style={styles.expandHint}>
          {expanded ? (
            <ChevronUp size={15} color={mono.inkMuted} />
          ) : (
            <ChevronDown size={15} color={mono.inkMuted} />
          )}
        </View>
      </View>

      {/* Comprobante monocromático desplegable (sin dirección ni mapas) */}
      {expanded ? (
        <View
          style={[
            styles.usedDetailDrawer,
            {
              backgroundColor: mono.surfaceSubtle,
              borderColor: mono.border,
            },
          ]}
        >
          <Text style={[styles.usedDetailNotice, { color: mono.inkSecondary }]}>
            Este pase QR ya fue utilizado y quedó archivado en tu historial.
          </Text>

          {item.fecha_hora ? (
            <View style={styles.usedDetailRow}>
              <Text style={[styles.usedDetailLabel, { color: mono.inkMuted }]}>
                Cita programada
              </Text>
              <Text
                style={[styles.usedDetailValue, { color: mono.inkPrimary }]}
              >
                {item.fecha_hora}
              </Text>
            </View>
          ) : null}

          {usedTimestamp ? (
            <View style={styles.usedDetailRow}>
              <Text style={[styles.usedDetailLabel, { color: mono.inkMuted }]}>
                Fecha de validación
              </Text>
              <Text
                style={[styles.usedDetailValue, { color: mono.inkPrimary }]}
              >
                {usedTimestamp}
              </Text>
            </View>
          ) : null}

          {item.notas_verificacion ? (
            <View style={styles.usedDetailRow}>
              <Text style={[styles.usedDetailLabel, { color: mono.inkMuted }]}>
                Nota de recepción
              </Text>
              <Text
                style={[styles.usedDetailValue, { color: mono.inkPrimary }]}
              >
                {item.notas_verificacion}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  PANTALLA PRINCIPAL                                                        */
/* -------------------------------------------------------------------------- */

export default function MisEntrevistasScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const { data: interviews = [], isLoading, refetch } = useMyInterviews();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<InterviewTab>("vigentes");
  const [fullscreenPass, setFullscreenPass] = useState<InterviewPass | null>(
    null,
  );

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";
  const segmentTrackBg = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.06)";
  const segmentActiveBg = isDark ? "#26211E" : "#FFFFFF";

  const { activeInterviews, usedInterviews } = useMemo(() => {
    const active: InterviewPass[] = [];
    const used: InterviewPass[] = [];

    for (const interview of interviews) {
      if (interview.estado === "pendiente") {
        active.push(interview);
      } else {
        used.push(interview);
      }
    }

    return { activeInterviews: active, usedInterviews: used };
  }, [interviews]);

  const handleSelectTab = (tab: InterviewTab) => {
    if (tab === activeTab) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setActiveTab(tab);
  };

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const currentList =
    activeTab === "vigentes" ? activeInterviews : usedInterviews;

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Mis entrevistas" />

      {/* Selector de secciones: Vigentes / Usados */}
      {!isLoading && interviews.length > 0 ? (
        <View style={styles.segmentOuter}>
          <View
            style={[
              styles.segmentTrack,
              { backgroundColor: segmentTrackBg, borderColor: cardBorder },
            ]}
          >
            <Pressable
              onPress={() => handleSelectTab("vigentes")}
              style={[
                styles.segmentOption,
                activeTab === "vigentes" && [
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
                      activeTab === "vigentes"
                        ? theme.text
                        : theme.textSecondary,
                  },
                ]}
              >
                Vigentes
              </Text>
              <View
                style={[
                  styles.segmentCountPill,
                  {
                    backgroundColor:
                      activeTab === "vigentes"
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
                        activeTab === "vigentes"
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {activeInterviews.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleSelectTab("usados")}
              style={[
                styles.segmentOption,
                activeTab === "usados" && [
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
                      activeTab === "usados" ? theme.text : theme.textSecondary,
                  },
                ]}
              >
                Usados
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
                        activeTab === "usados"
                          ? theme.text
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {usedInterviews.length}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
            <Spinner size={28} strokeWidth={2.8} color={theme.primary} />
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
              <QrCode size={25} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes entrevistas agendadas
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Cuando una empresa te invite a entrevista presencial, aquí
              recibirás la ubicación de la oficina, su foto de referencia y tu
              Pase QR personal de acceso.
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
                    activeTab === "vigentes"
                      ? theme.primarySoft
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              {activeTab === "vigentes" ? (
                <QrCode size={24} color={theme.primary} />
              ) : (
                <TicketCheck size={24} color={theme.textSecondary} />
              )}
            </View>

            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {activeTab === "vigentes"
                ? "No tienes pases vigentes"
                : "Aún no tienes pases usados"}
            </Text>

            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {activeTab === "vigentes"
                ? "Cuando una empresa agende una nueva entrevista presencial, tu boleto QR aparecerá aquí."
                : "Aquí aparecerán tus boletos en blanco y negro una vez que hayan sido escaneados en recepción."}
            </Text>

            {activeTab === "vigentes" && usedInterviews.length > 0 ? (
              <Pressable
                onPress={() => handleSelectTab("usados")}
                style={({ pressed }) => [
                  styles.emptyActionBtn,
                  {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.primaryBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.emptyActionText, { color: theme.primary }]}
                >
                  Ver pases usados ({usedInterviews.length})
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : activeTab === "vigentes" ? (
          activeInterviews.map((item) => (
            <ActiveInterviewTicket
              key={item.id_entrevista}
              item={item}
              isDark={isDark}
              screenBg={screenBg}
              onExpandQr={setFullscreenPass}
            />
          ))
        ) : (
          usedInterviews.map((item) => (
            <UsedInterviewTicket
              key={item.id_entrevista}
              item={item}
              isDark={isDark}
              screenBg={screenBg}
            />
          ))
        )}
      </ScrollView>

      <QrFullscreenModal
        item={fullscreenPass}
        onClose={() => setFullscreenPass(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  segmentOuter: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
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
    fontSize: 14,
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
    paddingBottom: 120,
    gap: 14,
  },

  loaderBox: {
    paddingVertical: 64,
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
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
  },

  emptyActionBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  emptyActionText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  /* ---- Estructura uniforme de boleto (Vigentes y Usados) ---- */
  compactActiveCard: {
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

  activeQrThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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

  ticketCompanyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ticketCompanyName: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },

  activeCompactBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },

  activeCompactBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  ticketVacancyTitle: {
    fontSize: 15.5,
    fontWeight: "700",
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

  ticketFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },

  activeCodeCompact: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  openPassHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  openPassText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ---- Panel expandido de Vigentes (mismo estilo de cajón que Usados) ---- */
  activeExpandedDrawer: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  activeQrSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
    gap: 12,
  },

  activeQrEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  activeQrWell: {
    padding: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  qrWellPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  cornerBracket: {
    position: "absolute",
    width: 18,
    height: 18,
  },

  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 8,
  },

  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 8,
  },

  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 8,
  },

  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 8,
  },

  qrFrameWhite: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  activeCodePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  activeCodeText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.6,
  },

  activeQrHint: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 6,
  },

  qrActionsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },

  qrActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
  },

  qrActionPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },

  qrActionSecondaryText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  drawerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  activeStubSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  stubIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
  },

  addressText: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  referencesBox: {
    fontSize: 13,
    lineHeight: 18,
    padding: 11,
    borderRadius: 12,
  },

  mapFrame: {
    borderRadius: 16,
    overflow: "hidden",
  },

  mapsBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  mapsBtnText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  officeImageWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 2,
  },

  officeImage: {
    width: "100%",
    height: 175,
  },

  officeImageBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },

  officeImageBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  /* ---- Línea perforada compartida por ambos boletos ---- */
  perforationWrap: {
    height: 16,
    justifyContent: "center",
    position: "relative",
  },

  perforationLine: {
    marginHorizontal: 16,
    borderTopWidth: 1.2,
    borderStyle: "dashed",
  },

  perforationNotchLeft: {
    position: "absolute",
    left: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  perforationNotchRight: {
    position: "absolute",
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  /* ---- Ticket Usado (compacto monocromático, sin dirección) ---- */
  usedCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  usedQrThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  usedQrFaded: {
    opacity: 0.34,
  },

  usedStampOverlay: {
    position: "absolute",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1.2,
    transform: [{ rotate: "-14deg" }],
  },

  usedStampText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  usedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  usedBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  usedCodeStrike: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.9,
    textDecorationLine: "line-through",
  },

  usedStatusSummary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },

  usedFooterLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  expandHint: {
    width: 20,
    alignItems: "flex-end",
  },

  usedDetailDrawer: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },

  usedDetailNotice: {
    fontSize: 12,
    lineHeight: 17,
  },

  usedDetailRow: {
    gap: 2,
  },

  usedDetailLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  usedDetailValue: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* ---- Modal pantalla completa QR (entorno oscuro, solo QR + borde blanco) ---- */
  modalDarkBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  modalCloseBtn: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCenterBlock: {
    alignItems: "center",
    gap: 18,
  },

  modalQrBorderFrame: {
    padding: 16,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },

  modalShortCode: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2.2,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.78,
  },
});
