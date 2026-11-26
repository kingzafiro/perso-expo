import { AxiosError } from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Camera,
  Check,
  Image as ImageIcon,
  RotateCcw,
  X,
  Zap,
  ZapOff,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import { useDocumentMutations } from "@/features/documents/hooks/use-documents";
import {
  DOCUMENT_META,
  type DocumentFrameMode,
  type DocumentType,
} from "@/features/documents/types/documents.types";
import { useTheme } from "@/hooks/use-theme";

const FRAME_ASPECT: Record<DocumentFrameMode, number> = {
  id_card: 1.586,
  passport: 1.42,
  visa: 1.54,
};

async function optimizeDocumentPhoto(
  uri: string,
  width: number,
  height: number,
  frameMode: DocumentFrameMode,
  shouldCropToFrame: boolean,
) {
  const ctx = ImageManipulator.manipulate(uri);

  if (shouldCropToFrame && width > 0 && height > 0) {
    const targetRatio = FRAME_ASPECT[frameMode];
    const currentRatio = width / height;

    if (currentRatio < targetRatio) {
      const cropW = Math.round(width * 0.92);
      const cropH = Math.min(height, Math.round(cropW / targetRatio));
      const originX = Math.max(0, Math.round((width - cropW) / 2));
      const originY = Math.max(0, Math.round((height - cropH) / 2));
      ctx.crop({ originX, originY, width: cropW, height: cropH });
    }
  }

  ctx.resize({ width: 1400 });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    compress: 0.78,
    format: SaveFormat.JPEG,
  });

  return saved.uri;
}

function extractErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorResponse> | null;
  return axiosError?.response?.data?.mensaje ?? fallback;
}

export default function EscanearDocumentoScreen() {
  const params = useLocalSearchParams<{ tipo?: string }>();
  const tipo = (
    params.tipo && params.tipo in DOCUMENT_META ? params.tipo : "ine"
  ) as DocumentType;

  const meta = DOCUMENT_META[tipo];
  const frameMode: DocumentFrameMode = meta.frameMode || "id_card";
  const guideText =
    meta.guiaCamara || `Alinea ${meta.titulo} dentro del marco`;

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const { upload } = useDocumentMutations();

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCameraReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const frameWidth = Math.min(screenWidth - 40, 380);
  const frameHeight = Math.round(frameWidth / FRAME_ASPECT[frameMode]);

  const handleClose = () => {
    if (upload.isPending) return;
    router.back();
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !cameraReady || isCapturing) return;

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsCapturing(true);
    setCaptureError(null);
    upload.reset();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        const optimizedUri = await optimizeDocumentPhoto(
          photo.uri,
          photo.width,
          photo.height,
          frameMode,
          true,
        );
        setPreviewUri(optimizedUri);
      } else {
        setCaptureError("No se pudo capturar la foto. Intenta nuevamente.");
      }
    } catch {
      setCaptureError(
        "No se pudo capturar con la cámara. Prueba con galería o intenta de nuevo.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setCaptureError("Activa el permiso de fotos en Ajustes.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: frameMode === "passport" ? [14, 10] : [16, 10],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setIsCapturing(true);
      setCaptureError(null);
      upload.reset();

      try {
        const optimizedUri = await optimizeDocumentPhoto(
          asset.uri,
          asset.width,
          asset.height,
          frameMode,
          false,
        );
        setPreviewUri(optimizedUri);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleConfirmUpload = () => {
    if (!previewUri || upload.isPending) return;

    upload.mutate(
      {
        tipo,
        file: {
          uri: previewUri,
          name: `${tipo}-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        },
      },
      {
        onSuccess: () => {
          if (Platform.OS !== "web") {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          router.back();
        },
      },
    );
  };

  const uploadError = upload.error
    ? extractErrorMessage(upload.error, "No se pudo subir la fotografía.")
    : null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {!permission ? (
        <View style={styles.permissionCenter}>
          <Skeleton width={220} height={18} borderRadius={9} />
          <Skeleton width={160} height={14} borderRadius={7} />
        </View>
      ) : !permission.granted ? (
        <View style={styles.permissionCenter}>
          <View
            style={[
              styles.permissionIcon,
              { backgroundColor: "rgba(240, 104, 8, 0.18)" },
            ]}
          >
            <Camera size={30} color={theme.primary} />
          </View>
          <Text style={styles.permissionTitle}>Permiso de cámara</Text>
          <Text style={styles.permissionSub}>
            Necesitamos acceso a tu cámara para capturar{" "}
            {meta.titulo.toLowerCase()} con claridad.
          </Text>
          <View style={styles.permissionActions}>
            {permission.canAskAgain ? (
              <AppButton
                title="Permitir cámara"
                onPress={async () => {
                  await requestPermission();
                }}
              />
            ) : (
              <AppButton
                title="Abrir Ajustes"
                onPress={() => {
                  void Linking.openSettings();
                }}
              />
            )}
            <AppButton
              title="Elegir de galería"
              variant="secondary"
              onPress={handlePickFromGallery}
            />
            <Pressable onPress={handleClose} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : previewUri ? (
        <View style={styles.previewRoot}>
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top + 8, 18) },
            ]}
          >
            <Pressable
              onPress={handleClose}
              disabled={upload.isPending}
              style={styles.circleBtn}
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.topTitle}>{meta.titulo}</Text>
            <View style={styles.spacerBtn} />
          </View>

          <View style={styles.previewStage}>
            <View
              style={[
                styles.previewFrame,
                {
                  width: frameWidth,
                  height: frameHeight,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Image
                source={{ uri: previewUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>

            <Text style={styles.previewHint}>
              Verifica que el texto y la foto se lean con claridad
            </Text>

            {uploadError && (
              <View style={styles.errorPill}>
                <Text style={styles.errorPillText}>{uploadError}</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.previewFooter,
              { paddingBottom: Math.max(insets.bottom + 20, 28) },
            ]}
          >
            <Pressable
              onPress={() => {
                upload.reset();
                setPreviewUri(null);
              }}
              disabled={upload.isPending}
              style={styles.retakeBtn}
            >
              <RotateCcw size={18} color="#FFFFFF" />
              <Text style={styles.retakeText}>Repetir</Text>
            </Pressable>

            <View style={styles.confirmBtnWrap}>
              <AppButton
                title="Usar y guardar"
                icon={<Check size={18} color="#FFFFFF" />}
                loading={upload.isPending}
                onPress={handleConfirmUpload}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.cameraRoot}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
            enableTorch={flashOn}
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Máscara oscura con ventana adaptada al tipo de documento */}
          <View pointerEvents="none" style={styles.overlayLayer}>
            <View style={styles.maskBar} />
            <View style={styles.maskMiddleRow}>
              <View style={styles.maskSide} />
              <View
                style={[
                  styles.frameWindow,
                  { width: frameWidth, height: frameHeight },
                ]}
              >
                <View
                  style={[
                    styles.corner,
                    styles.cornerTL,
                    { borderColor: theme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.corner,
                    styles.cornerTR,
                    { borderColor: theme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.corner,
                    styles.cornerBL,
                    { borderColor: theme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.corner,
                    styles.cornerBR,
                    { borderColor: theme.primary },
                  ]}
                />

                {frameMode === "passport" && (
                  <View style={styles.mrzGuide}>
                    <Text style={styles.mrzText}>
                      {"<<<<<<<<<<<<<<<<<<<<<<<<<"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.maskSide} />
            </View>
            <View style={styles.maskBar}>
              <View style={styles.guidePill}>
                <Text style={styles.guidePillText}>
                  {captureError || guideText}
                </Text>
              </View>
            </View>
          </View>

          {/* Barra superior */}
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top + 8, 18) },
            ]}
          >
            <Pressable onPress={handleClose} style={styles.circleBtn}>
              <X size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.titlePill}>
              <Text style={styles.topTitle}>{meta.titulo}</Text>
            </View>

            <Pressable
              onPress={() => setFlashOn((prev) => !prev)}
              style={[
                styles.circleBtn,
                flashOn && { backgroundColor: theme.primary },
              ]}
            >
              {flashOn ? (
                <Zap size={18} color="#FFFFFF" />
              ) : (
                <ZapOff size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          {/* Controles inferiores */}
          <View
            style={[
              styles.bottomControls,
              { paddingBottom: Math.max(insets.bottom + 24, 34) },
            ]}
          >
            <Pressable
              onPress={handlePickFromGallery}
              style={styles.sideControlBtn}
            >
              <ImageIcon size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={handleTakePhoto}
              disabled={!cameraReady || isCapturing}
              style={({ pressed }) => [
                styles.shutterOuter,
                (pressed || isCapturing) && styles.shutterPressed,
              ]}
            >
              {isCapturing ? (
                <Skeleton width={56} height={56} borderRadius={28} />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>

            <View style={styles.spacerControl} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },

  cameraRoot: {
    flex: 1,
  },

  overlayLayer: {
    ...StyleSheet.absoluteFill,
  },

  maskBar: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    alignItems: "center",
    paddingTop: 22,
  },

  maskMiddleRow: {
    flexDirection: "row",
  },

  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
  },

  frameWindow: {
    borderRadius: 16,
    position: "relative",
    justifyContent: "flex-end",
  },

  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 3.5,
  },

  cornerTL: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },

  cornerTR: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },

  cornerBL: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },

  cornerBR: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },

  mrzGuide: {
    marginHorizontal: 14,
    marginBottom: 10,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.45)",
    alignItems: "center",
  },

  mrzText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
  },

  guidePill: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginHorizontal: 24,
  },

  guidePillText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "600",
    textAlign: "center",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    alignItems: "center",
    justifyContent: "center",
  },

  spacerBtn: {
    width: 42,
  },

  titlePill: {
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  topTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sideControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  spacerControl: {
    width: 48,
  },

  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },

  shutterPressed: {
    transform: [{ scale: 0.92 }],
  },

  permissionCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 14,
  },

  permissionIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  permissionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  permissionSub: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  permissionActions: {
    width: "100%",
    gap: 12,
    marginTop: 10,
  },

  cancelLink: {
    paddingVertical: 10,
    alignItems: "center",
  },

  cancelLinkText: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 15,
    fontWeight: "600",
  },

  previewRoot: {
    flex: 1,
    backgroundColor: "#0B0908",
    justifyContent: "space-between",
  },

  previewStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 18,
  },

  previewFrame: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: "hidden",
  },

  previewHint: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 14,
    textAlign: "center",
  },

  errorPill: {
    backgroundColor: "rgba(217, 45, 32, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  errorPillText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },

  retakeBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  retakeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  confirmBtnWrap: {
    flex: 1.5,
  },
});
