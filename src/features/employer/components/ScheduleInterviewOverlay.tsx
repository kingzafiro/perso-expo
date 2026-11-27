import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  CalendarClock,
  Camera,
  ImagePlus,
  MapPin,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { Spinner } from "@/components/ui/Spinner";
import {
  fetchPlaceDetails,
  reverseGeocodeCoords,
  searchAddressPredictions,
  type PlacePrediction,
} from "@/features/profile/api/maps.api";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import type { MapCoords } from "@/features/profile/components/InteractiveAddressMap.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import type { ScheduleInterviewInput } from "../types/interviews.types";

interface ScheduleInterviewOverlayProps {
  visible: boolean;
  candidateName: string;
  vacancyTitle?: string;
  initialAddress?: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: ScheduleInterviewInput) => Promise<void>;
}

export function ScheduleInterviewOverlay({
  visible,
  candidateName,
  vacancyTitle,
  initialAddress = "",
  submitting,
  onClose,
  onSubmit,
}: ScheduleInterviewOverlayProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [fechaHora, setFechaHora] = useState("");
  const [direccion, setDireccion] = useState(initialAddress);
  const [referencias, setReferencias] = useState("");
  const [coords, setCoords] = useState<MapCoords | null>(null);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [resolvingMap, setResolvingMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapInteracting, setMapInteracting] = useState(false);
  const [photo, setPhoto] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPredictions([]);
    if (!direccion && initialAddress) {
      setDireccion(initialAddress);
    }
  }, [visible, initialAddress, direccion]);

  useEffect(() => {
    if (!visible) return;
    const trimmed = direccion.trim();
    if (trimmed.length < 3) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const res = await searchAddressPredictions(trimmed, coords, "all");
        setPredictions(res.slice(0, 4));
      } catch {
        setPredictions([]);
      } finally {
        setSearchingAddress(false);
      }
    }, 360);

    return () => clearTimeout(timer);
  }, [direccion, coords, visible]);

  if (!visible) return null;

  const sheetBg = isDark ? "#0D0B0A" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const handleSelectPrediction = async (pred: PlacePrediction) => {
    setPredictions([]);
    setDireccion(pred.description);
    setResolvingMap(true);
    try {
      const details = await fetchPlaceDetails(pred.placeId);
      if (details.formattedAddress) {
        setDireccion(details.formattedAddress);
      }
      if (details.lat !== null && details.lng !== null) {
        setCoords({ lat: details.lat, lng: details.lng });
      }
    } catch {
      // Keep typed address
    } finally {
      setResolvingMap(false);
    }
  };

  const handleSelectMapCoords = async (nextCoords: MapCoords) => {
    setCoords(nextCoords);
    setResolvingMap(true);
    try {
      const resolved = await reverseGeocodeCoords(
        nextCoords.lat,
        nextCoords.lng,
      );
      if (resolved?.formattedAddress) {
        setDireccion(resolved.formattedAddress);
      }
    } catch {
      // Keep coordinates even if reverse geocode fails
    } finally {
      setResolvingMap(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso de ubicación",
          "Activa el permiso de ubicación para centrar el mapa en tu oficina.",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await handleSelectMapCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch {
      Alert.alert(
        "Ubicación no disponible",
        "No fue posible obtener tu ubicación actual.",
      );
    } finally {
      setLocating(false);
    }
  };

  const processSelectedAsset = async (uri: string) => {
    try {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: 1400 });
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.78,
        format: SaveFormat.JPEG,
      });
      setPhoto({
        uri: saved.uri,
        name: `oficina-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });
    } catch {
      setPhoto({
        uri,
        name: `oficina-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });
    }
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Permite acceso a tus fotos para elegir una imagen.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await processSelectedAsset(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Permite acceso a la cámara para tomar la foto de tu oficina.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await processSelectedAsset(result.assets[0].uri);
    }
  };

  const handleSubmitForm = async () => {
    if (direccion.trim().length < 5) {
      Alert.alert(
        "Dirección requerida",
        "Ingresa la ubicación de la oficina donde será la entrevista.",
      );
      return;
    }
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await onSubmit({
      direccion_oficina: direccion.trim(),
      fecha_hora: fechaHora.trim() || undefined,
      referencias: referencias.trim() || undefined,
      latitud: coords?.lat ?? null,
      longitud: coords?.lng ?? null,
      foto: photo,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.overlay, { backgroundColor: sheetBg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            borderBottomColor: theme.inputBorder,
          },
        ]}
      >
        <View style={styles.flexOne}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Agendar entrevista y QR
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {candidateName}
            {vacancyTitle ? ` · ${vacancyTitle}` : ""}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
        >
          <X size={18} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        scrollEnabled={!mapInteracting}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 28, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fecha y hora */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <CalendarClock size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Fecha y hora de la entrevista
            </Text>
          </View>
          <TextInput
            value={fechaHora}
            onChangeText={setFechaHora}
            placeholder="Ej. Viernes 29 de nov · 11:00 AM"
            placeholderTextColor={theme.textMuted}
            maxLength={100}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
          />
        </View>

        {/* Ubicación de la oficina + mapa */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MapPin size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Ubicación de la oficina *
            </Text>
          </View>

          <View
            style={[
              styles.searchRow,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Search size={15} color={theme.textMuted} />
            <TextInput
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Busca calle, número, colonia o plaza..."
              placeholderTextColor={theme.textMuted}
              maxLength={255}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchingAddress ? (
              <Spinner size={16} strokeWidth={2.2} color={theme.primary} />
            ) : null}
          </View>

          {predictions.length > 0 ? (
            <View
              style={[
                styles.predictionsBox,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              {predictions.map((pred) => (
                <Pressable
                  key={pred.placeId}
                  onPress={() => void handleSelectPrediction(pred)}
                  style={({ pressed }) => [
                    styles.predictionRow,
                    { borderBottomColor: theme.inputBorder },
                    pressed && styles.pressed,
                  ]}
                >
                  <MapPin size={14} color={theme.primary} />
                  <View style={styles.flexOne}>
                    <Text
                      style={[styles.predMain, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {pred.mainText}
                    </Text>
                    <Text
                      style={[styles.predSub, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {pred.secondaryText}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          <InteractiveAddressMap
            coords={coords}
            height={170}
            isResolving={resolvingMap}
            isLocating={locating}
            onSelectCoords={(next) => void handleSelectMapCoords(next)}
            onRequestCurrentLocation={() => void handleUseCurrentLocation()}
            onMapInteractionChange={setMapInteracting}
          />

          <TextInput
            value={referencias}
            onChangeText={setReferencias}
            placeholder="Referencias de llegada (ej. Torre Norte, piso 4, recepción, traer INE)"
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={300}
            style={[
              styles.textArea,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
          />
        </View>

        {/* Foto de referencia de la oficina */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Camera size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Foto de referencia de la oficina
            </Text>
          </View>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Ayuda al candidato a ubicar fácilmente la fachada, entrada o
            recepción.
          </Text>

          {photo ? (
            <View style={styles.photoPreviewWrap}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoPreview}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setPhoto(null)}
                style={styles.removePhotoBtn}
                accessibilityLabel="Quitar foto"
              >
                <Trash2 size={15} color="#FFFFFF" />
                <Text style={styles.removePhotoText}>Quitar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoButtonsRow}>
              <Pressable
                onPress={() => void handlePickFromGallery()}
                style={({ pressed }) => [
                  styles.photoOptionBtn,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <ImagePlus size={18} color={theme.primary} />
                <Text style={[styles.photoOptionText, { color: theme.text }]}>
                  Elegir de galería
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleTakePhoto()}
                style={({ pressed }) => [
                  styles.photoOptionBtn,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Camera size={18} color={theme.primary} />
                <Text style={[styles.photoOptionText, { color: theme.text }]}>
                  Tomar foto
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footerWrap}>
          <AppButton
            title="Enviar ubicación y generar Pase QR"
            loading={submitting}
            disabled={direccion.trim().length < 5}
            onPress={handleSubmitForm}
          />
          <Text style={[styles.qrNote, { color: theme.textMuted }]}>
            El candidato recibirá una notificación con la ubicación, la foto y
            su código QR único. Podrás escanearlo desde tu Panel para aprobar o
            rechazar su acceso.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 45,
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

  content: {
    padding: 16,
    gap: 12,
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
  },

  helperText: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  input: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    fontSize: 14.5,
  },

  searchRow: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 10,
  },

  predictionsBox: {
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  predMain: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  predSub: {
    fontSize: 11.5,
  },

  textArea: {
    minHeight: 74,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 13.5,
    textAlignVertical: "top",
  },

  photoButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },

  photoOptionBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },

  photoOptionText: {
    fontSize: 13,
    fontWeight: "700",
  },

  photoPreviewWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },

  photoPreview: {
    width: "100%",
    height: 175,
    borderRadius: 16,
  },

  removePhotoBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  removePhotoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  footerWrap: {
    gap: 10,
    marginTop: 4,
  },

  qrNote: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  pressed: {
    opacity: 0.75,
  },
});
