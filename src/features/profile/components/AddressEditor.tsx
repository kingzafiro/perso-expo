import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LocateFixed, MapPin, Search, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { Skeleton, SuggestionListSkeleton } from "@/components/ui/Skeleton";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import {
  fetchPlaceDetails,
  forwardGeocodeAddress,
  reverseGeocodeCoords,
  searchAddressPredictions,
  type PlacePrediction,
  type ResolvedMapAddress,
} from "@/features/profile/api/maps.api";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import type { MapCoords } from "@/features/profile/components/InteractiveAddressMap.types";
import type { ProfileDireccion } from "@/features/profile/types/profile.types";
import { useTheme } from "@/hooks/use-theme";

const addressSchema = z.object({
  estado: z.string().trim().min(1, "El estado es obligatorio"),
  municipio: z.string().trim().min(1, "El municipio es obligatorio"),
  colonia: z.string().trim().min(1, "La colonia es obligatoria"),
  calle: z.string().trim().min(1, "La calle es obligatoria"),
  numero: z.string().trim().min(1, "El número es obligatorio"),
  cp: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
});

type AddressForm = z.infer<typeof addressSchema>;

function extractErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorResponse> | null;
  return axiosError?.response?.data?.mensaje ?? fallback;
}

function buildQueryFromDireccion(dir?: Partial<ProfileDireccion> | null) {
  if (!dir) return "";
  return [dir.calle, dir.numero, dir.colonia, dir.municipio, dir.estado, dir.cp]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getInitialCoords(dir?: ProfileDireccion | null): MapCoords | null {
  if (
    dir &&
    typeof dir.latitud === "number" &&
    typeof dir.longitud === "number" &&
    Number.isFinite(dir.latitud) &&
    Number.isFinite(dir.longitud)
  ) {
    return { lat: dir.latitud, lng: dir.longitud };
  }
  return null;
}

export function AddressEditor({
  initialValue,
  loading,
  error,
  onSave,
  onMapInteractionChange,
}: {
  initialValue?: ProfileDireccion | null;
  loading: boolean;
  error: unknown;
  onSave: (data: ProfileDireccion) => void;
  onMapInteractionChange?: (interacting: boolean) => void;
}) {
  const theme = useTheme();
  const { control, handleSubmit, setValue, getValues, watch } =
    useForm<AddressForm>({
      resolver: zodResolver(addressSchema),
      defaultValues: {
        estado: initialValue?.estado ?? "",
        municipio: initialValue?.municipio ?? "",
        colonia: initialValue?.colonia ?? "",
        calle: initialValue?.calle ?? "",
        numero: initialValue?.numero ?? "",
        cp: initialValue?.cp ?? "",
      },
    });

  const watchedValues = watch();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingBeforeSave, setIsGeocodingBeforeSave] = useState(false);
  const [coords, setCoords] = useState<MapCoords | null>(() =>
    getInitialCoords(initialValue),
  );
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const searchReqIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      searchReqIdRef.current += 1;
    };
  }, []);

  const cancelPendingSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    searchReqIdRef.current += 1;
  };

  const applyResolvedAddress = (
    resolved: ResolvedMapAddress,
    preserveExistingNumberIfSameStreet = false,
  ) => {
    const prevCalle = (getValues("calle") || "").trim().toLowerCase();
    const nextCalle = (resolved.calle || "").trim().toLowerCase();
    const prevNumero = (getValues("numero") || "").trim();

    if (resolved.estado || !preserveExistingNumberIfSameStreet) {
      setValue("estado", resolved.estado ?? "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (resolved.municipio || !preserveExistingNumberIfSameStreet) {
      setValue("municipio", resolved.municipio ?? "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (resolved.colonia || !preserveExistingNumberIfSameStreet) {
      setValue("colonia", resolved.colonia ?? "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (resolved.calle || !preserveExistingNumberIfSameStreet) {
      setValue("calle", resolved.calle ?? "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    const keepNumero =
      preserveExistingNumberIfSameStreet &&
      !resolved.numero &&
      prevNumero.length > 0 &&
      prevCalle.length > 0 &&
      prevCalle === nextCalle;

    if (!keepNumero) {
      setValue("numero", resolved.numero ?? "", {
        shouldValidate: Boolean(resolved.numero),
        shouldDirty: true,
      });
    }

    const cleanCp = (resolved.cp ?? "").replace(/\D/g, "").slice(0, 5);
    if (cleanCp || !preserveExistingNumberIfSameStreet) {
      setValue("cp", cleanCp, {
        shouldValidate: Boolean(cleanCp),
        shouldDirty: true,
      });
    }

    const finalNumero = keepNumero ? prevNumero : (resolved.numero ?? "");
    if (!finalNumero) {
      setMapNotice(
        "Pin fijado. Verifica o completa tu número exterior si hace falta.",
      );
    } else {
      setMapNotice(null);
    }
  };

  // Si hay dirección guardada sin coordenadas previas, geocodificar una vez para centrar el mapa
  useEffect(() => {
    if (getInitialCoords(initialValue)) return;

    const existingText = buildQueryFromDireccion(initialValue);
    if (!existingText) return;

    let cancelled = false;
    forwardGeocodeAddress(existingText)
      .then((result) => {
        if (
          !cancelled &&
          result &&
          typeof result.lat === "number" &&
          typeof result.lng === "number"
        ) {
          setCoords({
            lat: Number(result.lat.toFixed(8)),
            lng: Number(result.lng.toFixed(8)),
          });
        }
      })
      .catch(() => {
        // Silencioso: el usuario puede mover el mapa o buscar arriba
      });

    return () => {
      cancelled = true;
    };
  }, [initialValue]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    cancelPendingSearch();

    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    const reqId = searchReqIdRef.current;
    setIsSearching(true);
    setMapError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const list = await searchAddressPredictions(trimmed, coords);
        if (searchReqIdRef.current === reqId) {
          setPredictions(list);
        }
      } catch (err) {
        if (searchReqIdRef.current === reqId) {
          setPredictions([]);
          setMapError(
            extractErrorMessage(
              err,
              "No se pudieron cargar sugerencias de Google Maps.",
            ),
          );
        }
      } finally {
        if (searchReqIdRef.current === reqId) {
          setIsSearching(false);
        }
      }
    }, 350);
  };

  const resolveCoords = async (target: MapCoords, isPinAdjustment: boolean) => {
    setIsResolving(true);
    setMapError(null);
    setMapNotice(null);

    try {
      const resolved = await reverseGeocodeCoords(target.lat, target.lng);
      if (resolved) {
        applyResolvedAddress(resolved, isPinAdjustment);
        if (resolved.formattedAddress) {
          cancelPendingSearch();
          setIsSearching(false);
          setPredictions([]);
          setSearchQuery(resolved.formattedAddress);
        }
        return;
      }
    } catch {
      // Respaldo nativo del dispositivo si la Geocoding API falla
    } finally {
      setIsResolving(false);
    }

    if (Platform.OS !== "web") {
      try {
        const nativeResults = await Location.reverseGeocodeAsync({
          latitude: target.lat,
          longitude: target.lng,
        });
        const first = nativeResults[0];
        if (first) {
          applyResolvedAddress(
            {
              estado: first.region ?? "",
              municipio: first.city ?? first.subregion ?? "",
              colonia: first.district ?? "",
              calle: first.street ?? first.name ?? "",
              numero: first.streetNumber ?? "",
              cp: (first.postalCode ?? "").replace(/\D/g, "").slice(0, 5),
              formattedAddress: [first.street, first.district, first.city]
                .filter(Boolean)
                .join(", "),
              lat: target.lat,
              lng: target.lng,
            },
            isPinAdjustment,
          );
          return;
        }
      } catch {
        // Mostrar aviso abajo
      }
    }

    setMapError(
      "Coordenadas fijadas, pero no pudimos leer el nombre de la calle. Puedes completarla manualmente.",
    );
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    cancelPendingSearch();
    setIsSearching(false);
    setSearchQuery(prediction.description);
    setPredictions([]);
    setIsResolving(true);
    setMapError(null);
    Keyboard.dismiss();

    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }

    try {
      const resolved = await fetchPlaceDetails(prediction.placeId);
      if (typeof resolved.lat === "number" && typeof resolved.lng === "number") {
        setCoords({
          lat: Number(resolved.lat.toFixed(8)),
          lng: Number(resolved.lng.toFixed(8)),
        });
      }
      applyResolvedAddress(resolved, false);
    } catch (err) {
      setMapError(
        extractErrorMessage(
          err,
          "No se pudo obtener el detalle de esta dirección.",
        ),
      );
    } finally {
      setIsResolving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (Platform.OS === "web") {
      setMapNotice("La ubicación GPS está disponible en iOS y Android.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLocating(true);
    setMapError(null);
    setMapNotice(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMapNotice(
          "Activa el permiso de ubicación en Ajustes para ubicar tu pin automáticamente.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextCoords = {
        lat: Number(position.coords.latitude.toFixed(8)),
        lng: Number(position.coords.longitude.toFixed(8)),
      };
      setCoords(nextCoords);
      await resolveCoords(nextCoords, false);
    } catch {
      setMapError("No pudimos obtener tu ubicación actual. Intenta de nuevo.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapSelectCoords = (nextCoords: MapCoords) => {
    setCoords(nextCoords);
    setPredictions([]);
    void resolveCoords(nextCoords, true);
  };

  const handleSaveWithCoords = async (formData: AddressForm) => {
    let finalCoords = coords;

    if (!finalCoords) {
      setIsGeocodingBeforeSave(true);
      try {
        const text = buildQueryFromDireccion(formData);
        const geocoded = await forwardGeocodeAddress(text);
        if (
          geocoded &&
          typeof geocoded.lat === "number" &&
          typeof geocoded.lng === "number"
        ) {
          finalCoords = {
            lat: Number(geocoded.lat.toFixed(8)),
            lng: Number(geocoded.lng.toFixed(8)),
          };
          setCoords(finalCoords);
        }
      } catch {
        // Continuar guardando aunque no se haya podido geocodificar
      } finally {
        setIsGeocodingBeforeSave(false);
      }
    }

    onSave({
      ...formData,
      latitud: finalCoords ? Number(finalCoords.lat.toFixed(8)) : null,
      longitud: finalCoords ? Number(finalCoords.lng.toFixed(8)) : null,
    });
  };

  const initialCoords = getInitialCoords(initialValue);
  const coordsChanged =
    (coords?.lat != null ? Number(coords.lat.toFixed(6)) : null) !==
      (initialCoords?.lat != null
        ? Number(initialCoords.lat.toFixed(6))
        : null) ||
    (coords?.lng != null ? Number(coords.lng.toFixed(6)) : null) !==
      (initialCoords?.lng != null
        ? Number(initialCoords.lng.toFixed(6))
        : null);

  const fieldsChanged =
    (watchedValues.estado ?? "").trim() !== (initialValue?.estado ?? "").trim() ||
    (watchedValues.municipio ?? "").trim() !==
      (initialValue?.municipio ?? "").trim() ||
    (watchedValues.colonia ?? "").trim() !==
      (initialValue?.colonia ?? "").trim() ||
    (watchedValues.calle ?? "").trim() !== (initialValue?.calle ?? "").trim() ||
    (watchedValues.numero ?? "").trim() !== (initialValue?.numero ?? "").trim() ||
    (watchedValues.cp ?? "").trim() !== (initialValue?.cp ?? "").trim();

  const hasChanges = fieldsChanged || coordsChanged;

  const saveErrorMessage = error
    ? extractErrorMessage(error, "No se pudo guardar tu dirección.")
    : null;

  return (
    <View style={styles.form}>
      {/* Buscador conectado a Google Places API */}
      <View style={styles.searchSection}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Buscar en Google Maps
        </Text>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.inputBackground,
              borderColor: searchFocused ? theme.primary : theme.inputBorder,
              borderWidth: searchFocused ? 1.6 : 1,
            },
          ]}
        >
          <Search size={18} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Calle, colonia o código postal..."
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => {
                cancelPendingSearch();
                setIsSearching(false);
                setSearchQuery("");
                setPredictions([]);
              }}
              hitSlop={10}
            >
              <X size={17} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {isSearching && (
          <View
            style={[
              styles.predictionsCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <SuggestionListSkeleton rows={3} />
          </View>
        )}

        {!isSearching && predictions.length > 0 && (
          <View
            style={[
              styles.predictionsCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            {predictions.map((item, idx) => (
              <Pressable
                key={item.placeId}
                onPress={() => handleSelectPrediction(item)}
                style={({ pressed }) => [
                  styles.predictionRow,
                  idx < predictions.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.divider,
                  },
                  pressed && { backgroundColor: theme.primarySoft },
                ]}
              >
                <View
                  style={[
                    styles.predictionIcon,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <MapPin size={15} color={theme.primary} />
                </View>
                <View style={styles.flexOne}>
                  <Text
                    style={[styles.predictionMain, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      style={[
                        styles.predictionSecondary,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Mapa nativo interactivo con pin central de precisión */}
      <InteractiveAddressMap
        coords={coords}
        height={220}
        isResolving={isResolving}
        isLocating={isLocating}
        onSelectCoords={handleMapSelectCoords}
        onRequestCurrentLocation={handleUseCurrentLocation}
        onMapInteractionChange={onMapInteractionChange}
      />

      {/* Botón rápido de GPS */}
      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={isLocating || isResolving}
        style={({ pressed }) => [
          styles.gpsChip,
          {
            backgroundColor: theme.primarySoft,
            borderColor: theme.primaryBorder,
          },
          pressed && styles.pressed,
        ]}
      >
        {isLocating ? (
          <Skeleton width={14} height={14} borderRadius={7} />
        ) : (
          <LocateFixed size={15} color={theme.primary} />
        )}
        <Text style={[styles.gpsChipText, { color: theme.primary }]}>
          {isLocating ? "Obteniendo ubicación..." : "Usar mi ubicación exacta"}
        </Text>
      </Pressable>

      {mapNotice && (
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: theme.primarySoft,
              borderColor: theme.primaryBorder,
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: theme.text }]}>
            {mapNotice}
          </Text>
        </View>
      )}

      {mapError && (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {mapError}
          </Text>
        </View>
      )}

      {/* Campos detallados editables */}
      <View style={styles.rowTwo}>
        <View style={styles.flexOne}>
          <FormInput
            control={control}
            name="estado"
            label="Estado"
            placeholder="Ej. Nuevo León"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.flexOne}>
          <FormInput
            control={control}
            name="municipio"
            label="Municipio"
            placeholder="Ej. Monterrey"
            autoCapitalize="words"
          />
        </View>
      </View>

      <FormInput
        control={control}
        name="colonia"
        label="Colonia"
        placeholder="Nombre de tu colonia"
        autoCapitalize="words"
      />

      <FormInput
        control={control}
        name="calle"
        label="Calle"
        placeholder="Nombre de la calle"
        autoCapitalize="words"
      />

      <View style={styles.rowTwo}>
        <View style={styles.flexOne}>
          <FormInput
            control={control}
            name="numero"
            label="Número"
            placeholder="Ej. 412 B"
          />
        </View>
        <View style={styles.flexOne}>
          <FormInput
            control={control}
            name="cp"
            label="Código postal"
            placeholder="64000"
            keyboardType="number-pad"
            maxLength={5}
            transformText={(text) => text.replace(/\D/g, "").slice(0, 5)}
          />
        </View>
      </View>

      {saveErrorMessage && (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {saveErrorMessage}
          </Text>
        </View>
      )}

      <AppButton
        title="Guardar dirección"
        loading={loading || isGeocodingBeforeSave}
        disabled={!hasChanges}
        onPress={handleSubmit(handleSaveWithCoords)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 14,
  },

  searchSection: {
    gap: 7,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  searchBox: {
    minHeight: 50,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },

  predictionsCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginTop: 2,
  },

  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  predictionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  predictionMain: {
    fontSize: 14,
    fontWeight: "600",
  },

  predictionSecondary: {
    fontSize: 12,
    marginTop: 1,
  },

  gpsChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  gpsChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  noticeBox: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },

  noticeText: {
    fontSize: 12.5,
    fontWeight: "500",
    lineHeight: 17,
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

  rowTwo: {
    flexDirection: "row",
    gap: 12,
  },

  flexOne: {
    flex: 1,
  },

  pressed: {
    opacity: 0.72,
  },
});
