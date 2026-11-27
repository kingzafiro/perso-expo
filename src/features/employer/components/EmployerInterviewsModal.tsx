import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Globe,
  GraduationCap,
  Keyboard,
  Mail,
  MapPin,
  Maximize2,
  Minimize2,
  Phone,
  QrCode,
  RotateCcw,
  ScanLine,
  Search,
  UserCheck,
  X,
  XCircle,
  Zap,
  ZapOff,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

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
import type { InterviewPass } from "../types/interviews.types";
import { ApplicantProfileModal } from "./ApplicantProfileModal";
import {
  EmployerInterviewRegistry,
  getInterviewStatusColors,
} from "./EmployerInterviewRegistry";

interface EmployerInterviewsModalProps {
  visible: boolean;
  initialTab?: "scan" | "registry";
  onClose: () => void;
}

type ScannerMode = "fullscreen" | "simple";

function extractErr(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { mensaje?: string } | undefined)
      ?.mensaje;
    if (msg) return msg;
  }
  return fallback;
}

interface QrViewfinderOverlayProps {
  width: number;
  height: number;
  frameSize: number;
  centerYOffset?: number;
  primaryColor: string;
  active: boolean;
  isVerifying: boolean;
  hintText: string;
  compact?: boolean;
}

/**
 * Máscara SVG con recorte redondeado real alrededor del recuadro central,
 * esquinas vectoriales naranjas redondeadas y haz de escaneo animado.
 */
function QrViewfinderOverlay({
  width,
  height,
  frameSize,
  centerYOffset = 0,
  primaryColor,
  active,
  isVerifying,
  hintText,
  compact = false,
}: QrViewfinderOverlayProps) {
  const laserProgress = useSharedValue(0);
  const cornerPulse = useSharedValue(1);

  useEffect(() => {
    if (active && !isVerifying) {
      laserProgress.value = 0;
      laserProgress.value = withRepeat(
        withTiming(1, {
          duration: 2100,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      );
      cornerPulse.value = withRepeat(
        withTiming(0.76, {
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    } else {
      cancelAnimation(laserProgress);
      cancelAnimation(cornerPulse);
      cornerPulse.value = 1;
    }

    return () => {
      cancelAnimation(laserProgress);
      cancelAnimation(cornerPulse);
    };
  }, [active, isVerifying, laserProgress, cornerPulse]);

  const radius = compact ? 20 : 26;
  const x = Math.round((width - frameSize) / 2);
  const y = Math.round((height - frameSize) / 2 + centerYOffset);
  const travelDistance = Math.max(frameSize - 32, 60);

  const laserAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserProgress.value * travelDistance }],
  }));

  const bracketAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cornerPulse.value,
  }));

  // Esquinas vectoriales siguiendo exactamente el radio del recorte
  const arm = compact ? 26 : 34;
  const r = radius;
  const stroke = compact ? 3.5 : 4.2;
  const inset = stroke / 2;

  const cornersPath = [
    // Superior izquierda
    `M ${inset} ${arm} L ${inset} ${r} Q ${inset} ${inset} ${r} ${inset} L ${arm} ${inset}`,
    // Superior derecha
    `M ${frameSize - arm} ${inset} L ${frameSize - r} ${inset} Q ${frameSize - inset} ${inset} ${frameSize - inset} ${r} L ${frameSize - inset} ${arm}`,
    // Inferior izquierda
    `M ${inset} ${frameSize - arm} L ${inset} ${frameSize - r} Q ${inset} ${frameSize - inset} ${r} ${frameSize - inset} L ${arm} ${frameSize - inset}`,
    // Inferior derecha
    `M ${frameSize - arm} ${frameSize - inset} L ${frameSize - r} ${frameSize - inset} Q ${frameSize - inset} ${frameSize - inset} ${frameSize - inset} ${frameSize - r} L ${frameSize - inset} ${frameSize - arm}`,
  ].join(" ");

  if (width <= 0 || height <= 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Máscara oscura con recorte redondeado perfecto */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="qrCutoutMask">
            <Rect width={width} height={height} fill="#FFFFFF" />
            <Rect
              x={x}
              y={y}
              width={frameSize}
              height={frameSize}
              rx={radius}
              ry={radius}
              fill="#000000"
            />
          </Mask>
        </Defs>
        <Rect
          width={width}
          height={height}
          fill={compact ? "rgba(10, 8, 7, 0.62)" : "rgba(8, 6, 5, 0.72)"}
          mask="url(#qrCutoutMask)"
        />
        {/* Borde sutil interior del recorte */}
        <Rect
          x={x}
          y={y}
          width={frameSize}
          height={frameSize}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth={1}
        />
      </Svg>

      {/* Esquinas naranjas vectoriales con pulso suave */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: x,
            top: y,
            width: frameSize,
            height: frameSize,
          },
          bracketAnimatedStyle,
        ]}
      >
        <Svg width={frameSize} height={frameSize}>
          <Path
            d={cornersPath}
            fill="none"
            stroke={primaryColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Haz de escaneo naranja deslizándose dentro del recorte */}
      {active && !isVerifying ? (
        <View
          style={{
            position: "absolute",
            left: x + 12,
            top: y + 14,
            width: frameSize - 24,
            height: frameSize - 28,
            overflow: "hidden",
          }}
        >
          <Animated.View style={[styles.laserBeamWrap, laserAnimatedStyle]}>
            <Svg width={frameSize - 24} height={26}>
              <Defs>
                <LinearGradient id="laserGlow" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={primaryColor} stopOpacity="0" />
                  <Stop
                    offset="50%"
                    stopColor={primaryColor}
                    stopOpacity="0.34"
                  />
                  <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id="laserLine" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={primaryColor} stopOpacity="0" />
                  <Stop
                    offset="18%"
                    stopColor={primaryColor}
                    stopOpacity="0.95"
                  />
                  <Stop offset="50%" stopColor="#FFB073" stopOpacity="1" />
                  <Stop
                    offset="82%"
                    stopColor={primaryColor}
                    stopOpacity="0.95"
                  />
                  <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={frameSize - 24}
                height={26}
                fill="url(#laserGlow)"
              />
              <Rect
                x={0}
                y={12}
                width={frameSize - 24}
                height={2.2}
                rx={1.1}
                fill="url(#laserLine)"
              />
            </Svg>
          </Animated.View>
        </View>
      ) : null}

      {/* Estado de verificación dentro del recuadro */}
      {isVerifying ? (
        <View
          style={[
            styles.verifyingBox,
            {
              left: x,
              top: y,
              width: frameSize,
              height: frameSize,
              borderRadius: radius,
            },
          ]}
        >
          <Spinner size={28} strokeWidth={2.8} color="#FFFFFF" />
          <Text style={styles.verifyingLabel}>Verificando pase...</Text>
        </View>
      ) : null}

      {/* Indicador discreto debajo del recuadro */}
      <View
        style={[
          styles.hintAnchor,
          {
            top: y + frameSize + (compact ? 12 : 20),
          },
        ]}
      >
        <View
          style={[
            styles.scanHintPill,
            compact && styles.scanHintPillCompact,
          ]}
        >
          <Text
            style={[
              styles.scanHintText,
              compact && styles.scanHintTextCompact,
            ]}
          >
            {hintText}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function EmployerInterviewsModal({
  visible,
  initialTab = "scan",
  onClose,
}: EmployerInterviewsModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [tab, setTab] = useState<"scan" | "registry">(initialTab);
  const [scannerMode, setScannerMode] = useState<ScannerMode>("simple");
  const [flashOn, setFlashOn] = useState(false);
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false);
  const [compactCameraSize, setCompactCameraSize] = useState({
    width: Math.max(screenWidth - 32, 280),
    height: 256,
  });
  const [highlightId, setHighlightId] = useState<number | null>(null);
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
      setHighlightId(null);
      setManualCode("");
      setFlashOn(false);
      setManualDrawerOpen(false);
      setScannerMode("simple");
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
  const segmentBg = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(23, 18, 14, 0.055)";
  const segmentActiveBg = isDark ? "#241F1C" : "#FFFFFF";
  const rejectBorderColor = isDark
    ? "rgba(252, 165, 165, 0.28)"
    : "rgba(180, 35, 24, 0.22)";

  const pendingCount = interviews.filter(
    (item) => item.estado === "pendiente",
  ).length;

  const fullFrameSize = Math.min(Math.round(screenWidth * 0.68), 264);
  const compactFrameSize = Math.min(
    Math.round(compactCameraSize.height * 0.62),
    164,
  );

  const canUseCamera = Platform.OS !== "web" && Boolean(permission?.granted);
  const isImmersiveFullScreen =
    tab === "scan" &&
    scannerMode === "fullscreen" &&
    !verifiedPass &&
    canUseCamera;

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleSwitchMode = (nextMode: ScannerMode) => {
    if (nextMode === scannerMode) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setManualDrawerOpen(false);
    setScannerMode(nextMode);
  };

  const handleSwitchTab = (nextTab: "scan" | "registry") => {
    if (nextTab === tab) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    if (nextTab === "registry") {
      setFlashOn(false);
      setManualDrawerOpen(false);
    }
    setTab(nextTab);
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
      setManualDrawerOpen(false);
      setFlashOn(false);
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

  const resumen = verifiedPass?.candidato_resumen ?? null;
  const verifiedStatusMeta = verifiedPass
    ? getInterviewStatusColors(verifiedPass.estado, theme)
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {
        if (viewingProfile) {
          setViewingProfile(null);
        } else if (manualDrawerOpen) {
          setManualDrawerOpen(false);
        } else {
          handleCloseAll();
        }
      }}
    >
      <StatusBar
        style={isImmersiveFullScreen ? "light" : isDark ? "light" : "dark"}
      />

      {viewingProfile ? (
        <ApplicantProfileModal
          idPostulacion={viewingProfile.idPostulacion}
          idVacante={viewingProfile.idVacante}
          onBack={() => setViewingProfile(null)}
          onClose={handleCloseAll}
          onOpenRegistry={(idEntrevista) => {
            setViewingProfile(null);
            setHighlightId(idEntrevista);
            setTab("registry");
          }}
        />
      ) : isImmersiveFullScreen ? (
        /* ================================================================
           MODO PANTALLA COMPLETA INMERSIVO (ESTILO APPLE / EVENTBRITE)
           - 1 sola barra superior minimalista (sin apilar 2 barras arriba)
           - Recorte SVG redondeado real con esquinas naranjas y láser animado
           - Dock inferior flotante al alcance del pulgar
           ================================================================ */
        <View style={styles.fullCameraRoot}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashOn}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              scannerLocked || manualDrawerOpen
                ? undefined
                : (event) => {
                    if (event.data) {
                      void handleLookupCode(event.data);
                    }
                  }
            }
          />

          <QrViewfinderOverlay
            width={screenWidth}
            height={screenHeight}
            frameSize={fullFrameSize}
            centerYOffset={-32}
            primaryColor={theme.primary}
            active={!scannerLocked && !manualDrawerOpen}
            isVerifying={lookupQr.isPending}
            hintText="Apunta al pase QR del candidato"
          />

          {/* Barra superior única y despejada */}
          <View
            style={[
              styles.hudTopBar,
              { paddingTop: Math.max(insets.top + 8, 20) },
            ]}
          >
            <Pressable
              onPress={handleCloseAll}
              accessibilityLabel="Cerrar escáner QR"
              style={({ pressed }) => [
                styles.hudIconBtn,
                pressed && styles.pressed,
              ]}
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.hudTitle}>Registrar QR</Text>

            <View style={styles.hudRightActions}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                  setFlashOn((prev) => !prev);
                }}
                accessibilityLabel={
                  flashOn ? "Apagar linterna" : "Encender linterna"
                }
                style={({ pressed }) => [
                  styles.hudIconBtn,
                  flashOn && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                  pressed && styles.pressed,
                ]}
              >
                {flashOn ? (
                  <Zap size={18} color="#FFFFFF" />
                ) : (
                  <ZapOff size={18} color="#FFFFFF" />
                )}
              </Pressable>

              <Pressable
                onPress={() => handleSwitchMode("simple")}
                accessibilityLabel="Volver a vista compacta"
                style={({ pressed }) => [
                  styles.hudIconBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Minimize2 size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Dock inferior flotante (zona natural del pulgar) */}
          {!manualDrawerOpen ? (
            <View
              style={[
                styles.hudBottomDock,
                { paddingBottom: Math.max(insets.bottom + 16, 26) },
              ]}
            >
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") void Haptics.selectionAsync();
                  setManualDrawerOpen(true);
                }}
                style={({ pressed }) => [
                  styles.hudManualChip,
                  pressed && styles.pressed,
                ]}
              >
                <Keyboard size={15} color="#FFFFFF" />
                <Text style={styles.hudManualChipText}>Código manual</Text>
              </Pressable>

              <View style={styles.hudSegmentTrack}>
                <Pressable
                  onPress={() => handleSwitchTab("scan")}
                  style={[
                    styles.hudSegmentOption,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <ScanLine size={15} color="#FFFFFF" />
                  <Text style={styles.hudSegmentTextActive}>Escanear</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSwitchTab("registry")}
                  style={styles.hudSegmentOption}
                >
                  <ClipboardList size={15} color="rgba(255,255,255,0.84)" />
                  <Text style={styles.hudSegmentText}>Registro</Text>
                  {pendingCount > 0 ? (
                    <View
                      style={[
                        styles.hudPendingBadge,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.hudPendingBadgeText}>
                        {pendingCount}
                      </Text>
                    </View>
                  ) : interviews.length > 0 ? (
                    <Text style={styles.hudTotalMuted}>
                      ({interviews.length})
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            </View>
          ) : (
            /* Drawer limpio para ingresar código manual sobre el teclado */
            <KeyboardAvoidingView
              style={styles.manualOverlay}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setManualDrawerOpen(false)}
              />
              <View
                style={[
                  styles.manualSheet,
                  { paddingBottom: Math.max(insets.bottom + 18, 26) },
                ]}
              >
                <View style={styles.manualSheetGrabber} />
                <View style={styles.manualSheetHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.manualSheetTitle}>
                      Validar por código manual
                    </Text>
                    <Text style={styles.manualSheetSub}>
                      Escribe el código que aparece debajo del QR del candidato
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setManualDrawerOpen(false)}
                    style={styles.hudIconBtnSmall}
                  >
                    <X size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={styles.manualRow}>
                  <View style={styles.camManualInputWrap}>
                    <Search size={16} color="rgba(255,255,255,0.58)" />
                    <TextInput
                      value={manualCode}
                      onChangeText={setManualCode}
                      placeholder="Código del pase"
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      autoFocus
                      style={styles.camManualInput}
                      onSubmitEditing={() => void handleLookupCode(manualCode)}
                    />
                    {manualCode.length > 0 ? (
                      <Pressable
                        onPress={() => setManualCode("")}
                        hitSlop={8}
                      >
                        <X size={15} color="rgba(255,255,255,0.55)" />
                      </Pressable>
                    ) : null}
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
                      <Spinner size={18} strokeWidth={2.4} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.verifyManualText}>Validar</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      ) : (
        /* ================================================================
           MODO SENCILLO, FICHA VERIFICADA O PESTAÑA DE REGISTRO
           - Cabecera única limpia con botón directo a Pantalla completa
           - Control segmentado uniforme con Mis entrevistas / Tus entrevistas
           ================================================================ */
        <View style={[styles.container, { backgroundColor: sheetBg }]}>
          <View
            style={[
              styles.header,
              {
                paddingTop: Math.max(insets.top + 8, 18),
                borderBottomColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.flexOne}>
              <Text style={[styles.title, { color: theme.text }]}>
                Registrar QR
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {tab === "scan"
                  ? verifiedPass
                    ? "Confirma la identidad antes de aprobar"
                    : "Escanea el pase o ingresa el código manual"
                  : "Aprueba o rechaza accesos desde el registro"}
              </Text>
            </View>

            <Pressable
              onPress={handleCloseAll}
              accessibilityLabel="Cerrar"
              style={[
                styles.closeBtn,
                { backgroundColor: theme.inputBackground },
              ]}
            >
              <X size={18} color={theme.text} />
            </Pressable>
          </View>

          {/* Selector segmentado uniforme con el resto de la app */}
          <View style={styles.segmentOuter}>
            <View
              style={[
                styles.segmentTrack,
                { backgroundColor: segmentBg, borderColor: cardBorder },
              ]}
            >
              <Pressable
                onPress={() => handleSwitchTab("scan")}
                style={[
                  styles.segmentOption,
                  tab === "scan" && [
                    styles.segmentOptionActive,
                    { backgroundColor: segmentActiveBg },
                  ],
                ]}
              >
                <ScanLine
                  size={15}
                  color={tab === "scan" ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: tab === "scan" ? theme.text : theme.textSecondary,
                    },
                  ]}
                >
                  Escanear QR
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSwitchTab("registry")}
                style={[
                  styles.segmentOption,
                  tab === "registry" && [
                    styles.segmentOptionActive,
                    { backgroundColor: segmentActiveBg },
                  ],
                ]}
              >
                <ClipboardList
                  size={15}
                  color={
                    tab === "registry" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color:
                        tab === "registry" ? theme.text : theme.textSecondary,
                    },
                  ]}
                >
                  Registro
                </Text>
                <View
                  style={[
                    styles.segmentCountPill,
                    {
                      backgroundColor:
                        tab === "registry" || pendingCount > 0
                          ? theme.primarySoft
                          : theme.inputBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentCountText,
                      {
                        color:
                          tab === "registry" || pendingCount > 0
                            ? theme.primary
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {interviews.length}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {tab === "scan" ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom + 26, 38) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {verifiedPass && verifiedStatusMeta ? (
                /* Ficha VIP de verificación de identidad */
                <View
                  style={[
                    styles.verifiedCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  {/* Banda superior de estado acorde al tema */}
                  <View
                    style={[
                      styles.verdictBar,
                      { backgroundColor: verifiedStatusMeta.bg },
                    ]}
                  >
                    <UserCheck size={15} color={verifiedStatusMeta.color} />
                    <Text
                      style={[
                        styles.verdictText,
                        { color: verifiedStatusMeta.color },
                      ]}
                    >
                      {verifiedPass.estado === "pendiente"
                        ? "Pase válido · Verifica la identidad"
                        : verifiedStatusMeta.label}
                    </Text>
                  </View>

                  <View style={styles.verifiedBody}>
                    {/* Avatar limpio sin borde + nombre + vacante + cita */}
                    <View style={styles.identityHero}>
                      <ProfileAvatar
                        uri={verifiedPass.candidato?.foto_perfil}
                        initials={(verifiedPass.candidato?.nombre || "C")
                          .slice(0, 2)
                          .toUpperCase()}
                        size={84}
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
                        {verifiedPass.vacante?.titulo || "Entrevista presencial"}
                      </Text>

                      {verifiedPass.fecha_hora ? (
                        <View
                          style={[
                            styles.appointmentPill,
                            {
                              backgroundColor: theme.inputBackground,
                              borderColor: theme.inputBorder,
                            },
                          ]}
                        >
                          <CalendarClock size={13} color={theme.primary} />
                          <Text
                            style={[
                              styles.appointmentPillText,
                              { color: theme.text },
                            ]}
                          >
                            {verifiedPass.fecha_hora}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Datos de validación rápida */}
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
                            resumen?.cv_subido ? theme.success : theme.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.detailText,
                            {
                              color: resumen?.cv_subido
                                ? theme.success
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

                    {/* Acciones ergonómicas con colores armónicos del tema */}
                    {verifiedPass.estado === "pendiente" ? (
                      <View style={styles.actionsStack}>
                        <Pressable
                          disabled={resolvingId === verifiedPass.id_entrevista}
                          onPress={() =>
                            void handleResolve(verifiedPass, "aprobar", true)
                          }
                          style={({ pressed }) => [
                            styles.approvePrimaryBtn,
                            { backgroundColor: theme.primary },
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

                        <View style={styles.secondaryActionsRow}>
                          <Pressable
                            disabled={resolvingId === verifiedPass.id_entrevista}
                            onPress={() =>
                              void handleResolve(verifiedPass, "rechazar", false)
                            }
                            style={({ pressed }) => [
                              styles.rejectHalfBtn,
                              {
                                backgroundColor: theme.errorSoft,
                                borderColor: rejectBorderColor,
                              },
                              pressed && styles.pressed,
                            ]}
                          >
                            {resolvingId === verifiedPass.id_entrevista &&
                            resolvingAction === "rechazar" ? (
                              <Spinner
                                size={17}
                                strokeWidth={2.4}
                                color={theme.error}
                              />
                            ) : (
                              <>
                                <XCircle size={16} color={theme.error} />
                                <Text
                                  style={[
                                    styles.rejectHalfText,
                                    { color: theme.error },
                                  ]}
                                >
                                  Rechazar
                                </Text>
                              </>
                            )}
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setVerifiedPass(null);
                              setScannerLocked(false);
                            }}
                            style={({ pressed }) => [
                              styles.rescanHalfBtn,
                              {
                                backgroundColor: theme.inputBackground,
                                borderColor: theme.inputBorder,
                              },
                              pressed && styles.pressed,
                            ]}
                          >
                            <RotateCcw size={15} color={theme.text} />
                            <Text
                              style={[
                                styles.rescanHalfText,
                                { color: theme.text },
                              ]}
                            >
                              Escanear otro
                            </Text>
                          </Pressable>
                        </View>
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
                        <AppButton
                          title="Escanear otro QR"
                          variant="secondary"
                          onPress={() => {
                            setVerifiedPass(null);
                            setScannerLocked(false);
                          }}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <>
                  {/* Cámara compacta en modo Sencillo con máscara SVG y láser */}
                  <View
                    style={[
                      styles.scannerCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    {Platform.OS === "web" ? (
                      <View style={styles.permBox}>
                        <View
                          style={[
                            styles.permIconCircle,
                            { backgroundColor: theme.primarySoft },
                          ]}
                        >
                          <QrCode size={26} color={theme.primary} />
                        </View>
                        <Text style={[styles.permTitle, { color: theme.text }]}>
                          Usa la app móvil para escanear con cámara
                        </Text>
                        <Text
                          style={[
                            styles.permDesc,
                            { color: theme.textSecondary },
                          ]}
                        >
                          También puedes validar el código del pase debajo.
                        </Text>
                      </View>
                    ) : !permission?.granted ? (
                      <View style={styles.permBox}>
                        <View
                          style={[
                            styles.permIconCircle,
                            { backgroundColor: theme.primarySoft },
                          ]}
                        >
                          <QrCode size={26} color={theme.primary} />
                        </View>
                        <Text style={[styles.permTitle, { color: theme.text }]}>
                          Activa tu cámara para escanear QR
                        </Text>
                        <Text
                          style={[
                            styles.permDesc,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Apunta al pase QR del candidato para confirmar su
                          identidad en segundos.
                        </Text>
                        <View style={styles.permBtnWrap}>
                          <AppButton
                            title="Permitir cámara"
                            onPress={async () => {
                              await requestPermission();
                            }}
                          />
                        </View>
                      </View>
                    ) : (
                      <View
                        style={styles.compactCameraWrap}
                        onLayout={(event) => {
                          const { width, height } = event.nativeEvent.layout;
                          if (width > 0 && height > 0) {
                            setCompactCameraSize({ width, height });
                          }
                        }}
                      >
                        <CameraView
                          style={StyleSheet.absoluteFill}
                          facing="back"
                          enableTorch={flashOn}
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

                        <QrViewfinderOverlay
                          width={compactCameraSize.width}
                          height={compactCameraSize.height}
                          frameSize={compactFrameSize}
                          centerYOffset={-12}
                          primaryColor={theme.primary}
                          active={!scannerLocked}
                          isVerifying={lookupQr.isPending}
                          hintText="Encuadra el pase QR"
                          compact
                        />

                        {/* Controles limpios en esquina superior derecha */}
                        <View style={styles.compactCamControls}>
                          <Pressable
                            onPress={() => {
                              if (Platform.OS !== "web") {
                                void Haptics.selectionAsync();
                              }
                              setFlashOn((prev) => !prev);
                            }}
                            accessibilityLabel={
                              flashOn ? "Apagar linterna" : "Encender linterna"
                            }
                            style={({ pressed }) => [
                              styles.compactCamBtn,
                              flashOn && {
                                backgroundColor: theme.primary,
                                borderColor: theme.primary,
                              },
                              pressed && styles.pressed,
                            ]}
                          >
                            {flashOn ? (
                              <Zap size={16} color="#FFFFFF" />
                            ) : (
                              <ZapOff size={16} color="#FFFFFF" />
                            )}
                          </Pressable>

                          <Pressable
                            onPress={() => handleSwitchMode("fullscreen")}
                            accessibilityLabel="Abrir en pantalla completa"
                            style={({ pressed }) => [
                              styles.compactCamBtn,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Maximize2 size={16} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Tarjeta limpia para código manual */}
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    <View style={styles.manualHeaderRow}>
                      <Keyboard size={16} color={theme.primary} />
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Validar por código manual
                      </Text>
                    </View>

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
                          placeholder="Código del pase"
                          placeholderTextColor={theme.textMuted}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          style={[styles.manualInput, { color: theme.text }]}
                          onSubmitEditing={() =>
                            void handleLookupCode(manualCode)
                          }
                        />
                        {manualCode.length > 0 ? (
                          <Pressable
                            onPress={() => setManualCode("")}
                            hitSlop={8}
                          >
                            <X size={15} color={theme.textMuted} />
                          </Pressable>
                        ) : null}
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

                  {/* Acceso rápido a pendientes si existen */}
                  {pendingCount > 0 ? (
                    <Pressable
                      onPress={() => handleSwitchTab("registry")}
                      style={({ pressed }) => [
                        styles.pendingJumpCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: theme.primaryBorder,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.pendingJumpBadge,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pendingJumpCount,
                            { color: theme.primary },
                          ]}
                        >
                          {pendingCount}
                        </Text>
                      </View>
                      <View style={styles.flexOne}>
                        <Text
                          style={[
                            styles.pendingJumpTitle,
                            { color: theme.text },
                          ]}
                        >
                          {pendingCount === 1
                            ? "1 entrevista pendiente por confirmar"
                            : `${pendingCount} entrevistas pendientes por confirmar`}
                        </Text>
                        <Text
                          style={[
                            styles.pendingJumpSub,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Toca para abrir el registro
                        </Text>
                      </View>
                      <ChevronRight size={17} color={theme.primary} />
                    </Pressable>
                  ) : null}
                </>
              )}
            </ScrollView>
          ) : (
            /* Pestaña 2: Registro tipo boleto (con Aprobar y ver / Rechazar) */
            <EmployerInterviewRegistry
              interviews={interviews}
              isLoading={isLoading}
              refreshing={manualRefreshing}
              screenBg={sheetBg}
              bottomPadding={Math.max(insets.bottom + 24, 36)}
              highlightInterviewId={highlightId}
              allowResolve
              resolvingId={resolvingId}
              resolvingAction={resolvingAction}
              onRefresh={() => void handleManualRefresh()}
              onResolve={(pass, accion, openProfile) =>
                void handleResolve(pass, accion, openProfile)
              }
              onOpenProfile={(idPostulacion, idVacante) =>
                setViewingProfile({ idPostulacion, idVacante })
              }
            />
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

  flexOne: {
    flex: 1,
    gap: 2,
  },

  /* ---- Visor SVG y haz láser ---- */
  fullCameraRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },

  laserBeamWrap: {
    width: "100%",
  },

  verifyingBox: {
    position: "absolute",
    backgroundColor: "rgba(10, 8, 7, 0.76)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  verifyingLabel: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },

  hintAnchor: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },

  scanHintPill: {
    backgroundColor: "rgba(14, 11, 9, 0.72)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },

  scanHintPillCompact: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  scanHintText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  scanHintTextCompact: {
    fontSize: 12,
  },

  /* ---- HUD Pantalla completa (minimalista y ergonómico) ---- */
  hudTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  hudTitle: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.25,
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  hudRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  hudIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(16, 13, 11, 0.62)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  hudIconBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  hudModePill: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 13,
    backgroundColor: "rgba(16, 13, 11, 0.62)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.20)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  hudModePillText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },

  hudBottomDock: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    alignItems: "center",
    gap: 12,
  },

  hudManualChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(16, 13, 11, 0.68)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },

  hudManualChipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  hudSegmentTrack: {
    width: "100%",
    flexDirection: "row",
    padding: 4,
    borderRadius: 18,
    backgroundColor: "rgba(16, 13, 11, 0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.18)",
    gap: 4,
  },

  hudSegmentOption: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  hudSegmentTextActive: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },

  hudSegmentText: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 13.5,
    fontWeight: "700",
  },

  hudPendingBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  hudPendingBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  hudTotalMuted: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ---- Sheet de código manual en modo pantalla completa ---- */
  manualOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.48)",
  },

  manualSheet: {
    backgroundColor: "#171310",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 14,
  },

  manualSheetGrabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    alignSelf: "center",
  },

  manualSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  manualSheetTitle: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontWeight: "800",
  },

  manualSheetSub: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12.5,
    marginTop: 2,
  },

  camManualInputWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  camManualInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  /* ---- Modo sencillo / Registro ---- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 12.5,
  },

  headerModeBtn: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  headerModeBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentOuter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
    minHeight: 42,
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

  content: {
    padding: 16,
    gap: 13,
  },

  scannerCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  compactCameraWrap: {
    height: 256,
    position: "relative",
    backgroundColor: "#000000",
  },

  compactCamControls: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },

  compactCamBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 13, 11, 0.66)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  permBox: {
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  permIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  permTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    textAlign: "center",
  },

  permDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  permBtnWrap: {
    width: "100%",
    marginTop: 6,
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 12,
  },

  manualHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
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
    minHeight: 48,
    borderRadius: 14,
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
    letterSpacing: 1,
  },

  verifyManualBtn: {
    minWidth: 88,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  verifyManualText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },

  pendingJumpCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },

  pendingJumpBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  pendingJumpCount: {
    fontSize: 15,
    fontWeight: "800",
  },

  pendingJumpTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  pendingJumpSub: {
    fontSize: 12,
  },

  /* ---- Ficha de identidad verificada ---- */
  verifiedCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  verdictBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },

  verdictText: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  verifiedBody: {
    padding: 16,
    gap: 14,
  },

  identityHero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },

  heroName: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.35,
    marginTop: 4,
  },

  heroVacancy: {
    fontSize: 13.5,
    fontWeight: "600",
    textAlign: "center",
  },

  appointmentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },

  appointmentPillText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  detailsBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    gap: 9,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  detailText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  actionsStack: {
    gap: 10,
    marginTop: 2,
  },

  approvePrimaryBtn: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },

  decisionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryActionsRow: {
    flexDirection: "row",
    gap: 9,
  },

  rejectHalfBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  rejectHalfText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  rescanHalfBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  rescanHalfText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.76,
  },
});
