import { AxiosError } from "axios";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react-native";
import { useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import {
  DOCUMENT_META,
  type DocumentItemStatus,
  type DocumentType,
} from "@/features/documents/types/documents.types";
import { ProfileEditSheet } from "@/features/profile/components/ProfileEditSheet";
import { useTheme } from "@/hooks/use-theme";

interface DocumentActionSheetProps {
  tipo: DocumentType | null;
  status?: DocumentItemStatus | null;
  uploading: boolean;
  deleting: boolean;
  error: unknown;
  onClose: () => void;
  onUpload: (
    tipo: DocumentType,
    file: { uri: string; name: string; mimeType: string },
  ) => void;
  onDelete: (tipo: DocumentType) => void;
}

function extractErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorResponse> | null;
  return axiosError?.response?.data?.mensaje ?? fallback;
}

export function DocumentActionSheet({
  tipo,
  status,
  uploading,
  deleting,
  error,
  onClose,
  onUpload,
  onDelete,
}: DocumentActionSheetProps) {
  const theme = useTheme();
  const [localError, setLocalError] = useState<string | null>(null);
  const pendingScanTipoRef = useRef<DocumentType | null>(null);

  const meta = tipo ? DOCUMENT_META[tipo] : null;
  const isUploaded = Boolean(status?.subido);

  const handleClose = () => {
    setLocalError(null);
    pendingScanTipoRef.current = null;
    onClose();
  };

  const handleOpenCameraScreen = () => {
    if (!tipo) return;
    setLocalError(null);
    pendingScanTipoRef.current = tipo;
    onClose();
  };

  const handleSheetDismiss = () => {
    const scanTipo = pendingScanTipoRef.current;
    if (scanTipo) {
      pendingScanTipoRef.current = null;
      router.push({
        pathname: "/(app)/tu/escanear",
        params: { tipo: scanTipo },
      });
    }
  };

  const handlePickPdf = async () => {
    if (!tipo || uploading) return;
    setLocalError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 8 * 1024 * 1024) {
        setLocalError("El PDF supera 8 MB. Elige una versión más ligera.");
        return;
      }

      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onUpload(tipo, {
        uri: asset.uri,
        name: asset.name || `${tipo}.pdf`,
        mimeType: asset.mimeType || "application/pdf",
      });
    } catch {
      setLocalError("No se pudo abrir el selector de archivos.");
    }
  };

  const handlePickGalleryImage = async () => {
    if (!tipo || !meta || uploading) return;
    setLocalError(null);

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setLocalError(
          "Activa el permiso de fotos en Ajustes para seleccionar una imagen.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: meta.frameMode === "passport" ? [14, 10] : [16, 10],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const ctx = ImageManipulator.manipulate(asset.uri);
      ctx.resize({ width: 1400 });
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.78,
        format: SaveFormat.JPEG,
      });

      onUpload(tipo, {
        uri: saved.uri,
        name: `${tipo}-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });
    } catch {
      setLocalError("No se pudo procesar la imagen seleccionada.");
    }
  };

  const handleOpenPreview = async () => {
    if (!status?.url) return;
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    await WebBrowser.openBrowserAsync(status.url);
  };

  const confirmDelete = () => {
    if (!tipo || !meta) return;

    if (Platform.OS === "web") {
      onDelete(tipo);
      return;
    }

    Alert.alert(
      `Eliminar ${meta.titulo}`,
      "Se eliminará el archivo guardado en tu expediente. Podrás volver a subirlo cuando quieras.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDelete(tipo),
        },
      ],
    );
  };

  const errorMessage =
    localError ||
    (error
      ? extractErrorMessage(error, "No se pudo procesar el documento.")
      : null);

  return (
    <ProfileEditSheet
      visible={tipo !== null}
      title={meta?.titulo ?? ""}
      subtitle={meta?.descripcion}
      onClose={handleClose}
      onDismiss={handleSheetDismiss}
    >
      {meta && (
        <View style={styles.content}>
          {/* Badges de estado y validación */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isUploaded
                    ? theme.successSoft
                    : theme.primarySoft,
                },
              ]}
            >
              <CheckCircle2
                size={14}
                color={isUploaded ? theme.success : theme.primary}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isUploaded ? theme.success : theme.primary },
                ]}
              >
                {isUploaded ? "Archivo guardado" : "Pendiente"}
              </Text>
            </View>

            <View
              style={[
                styles.formatBadge,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <Text
                style={[styles.formatBadgeText, { color: theme.textSecondary }]}
              >
                {meta.formato === "pdf" ? "Formato PDF" : "Fotografía"}
              </Text>
            </View>

            {meta.oficial && (
              <View
                style={[
                  styles.formatBadge,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <ShieldCheck size={13} color={theme.primary} />
                <Text
                  style={[
                    styles.formatBadgeText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Oficial
                </Text>
              </View>
            )}
          </View>

          {/* Vista previa si ya existe archivo */}
          {isUploaded && status?.url && (
            <Pressable
              onPress={handleOpenPreview}
              style={({ pressed }) => [
                styles.previewCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.inputBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              {meta.formato === "image" ? (
                <View style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: status.url }}
                    style={styles.imagePreview}
                    contentFit="cover"
                    transition={220}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.pdfIconBox,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <FileText size={22} color={theme.primary} />
                </View>
              )}

              <View style={styles.previewFooterRow}>
                <View style={styles.flexOne}>
                  <Text
                    style={[styles.previewTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {meta.formato === "pdf"
                      ? "Documento PDF cargado"
                      : "Imagen capturada"}
                  </Text>
                  <Text
                    style={[styles.previewSub, { color: theme.textSecondary }]}
                  >
                    Toca para abrir y revisar tu archivo
                  </Text>
                </View>
                <ExternalLink size={17} color={theme.primary} />
              </View>
            </Pressable>
          )}

          {errorMessage && (
            <View
              style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}
            >
              <Text style={[styles.errorText, { color: theme.error }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Acciones principales según formato */}
          {meta.formato === "pdf" ? (
            <AppButton
              title={isUploaded ? "Reemplazar archivo PDF" : "Seleccionar PDF"}
              icon={<Upload size={18} color="#FFFFFF" />}
              loading={uploading}
              disabled={deleting}
              onPress={handlePickPdf}
            />
          ) : (
            <View style={styles.actionStack}>
              <AppButton
                title={
                  isUploaded
                    ? "Volver a escanear con cámara"
                    : "Escanear con cámara"
                }
                icon={<Camera size={18} color="#FFFFFF" />}
                loading={uploading}
                disabled={deleting}
                onPress={handleOpenCameraScreen}
              />
              <AppButton
                title="Elegir desde galería"
                variant="secondary"
                icon={<ImageIcon size={18} color={theme.primary} />}
                disabled={uploading || deleting}
                onPress={handlePickGalleryImage}
              />
            </View>
          )}

          {isUploaded && (
            <Pressable
              onPress={confirmDelete}
              disabled={uploading || deleting}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: theme.errorSoft },
                pressed && styles.pressed,
              ]}
            >
              <Trash2 size={16} color={theme.error} />
              <Text style={[styles.deleteText, { color: theme.error }]}>
                {deleting ? "Eliminando..." : "Eliminar documento"}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </ProfileEditSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    gap: 15,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  formatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  formatBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  previewCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 12,
  },

  imagePreviewWrap: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    overflow: "hidden",
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },

  pdfIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  previewFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  previewTitle: {
    fontSize: 14.5,
    fontWeight: "700",
  },

  previewSub: {
    fontSize: 12.5,
  },

  actionStack: {
    gap: 10,
  },

  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  deleteButton: {
    minHeight: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  deleteText: {
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.74,
  },
});
