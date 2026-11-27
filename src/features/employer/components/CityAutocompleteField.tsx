import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import {
  CheckCircle2,
  LocateFixed,
  MapPin,
  Search,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SuggestionListSkeleton } from "@/components/ui/Skeleton";
import {
  fetchPlaceDetails,
  reverseGeocodeCoords,
  searchAddressPredictions,
  type PlacePrediction,
} from "@/features/profile/api/maps.api";
import { useTheme } from "@/hooks/use-theme";

export interface ResolvedCitySelection {
  city: string;
  postalCode: string;
  neighborhood: string;
  lat?: number | null;
  lng?: number | null;
}

interface CityAutocompleteFieldProps {
  label?: string;
  placeholder?: string;
  searchMode?: "cities" | "all";
  value: string;
  error?: string;
  onSelectCity: (cityLabel: string) => void;
  onSelectLocationDetails?: (details: ResolvedCitySelection) => void;
}

function formatCityLabel(municipio?: string, estado?: string, fallback = "") {
  const parts = [municipio, estado]
    .map((p) => (p || "").trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return Array.from(new Set(parts)).join(", ");
  }
  return fallback.trim();
}

export function CityAutocompleteField({
  label = "Ciudad y estado principal",
  placeholder = "Busca tu ciudad (ej. Monterrey, Guadalajara...)",
  searchMode = "cities",
  value,
  error,
  onSelectCity,
  onSelectLocationDetails,
}: CityAutocompleteFieldProps) {
  const theme = useTheme();
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      reqIdRef.current += 1;
    };
  }, []);

  const cancelPending = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    reqIdRef.current += 1;
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setSearchError(null);

    if (value && text.trim() !== value.trim()) {
      onSelectCity("");
    }

    cancelPending();
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const reqId = reqIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchAddressPredictions(trimmed, null, searchMode);
        if (reqId !== reqIdRef.current) return;
        setPredictions(items);
      } catch {
        if (reqId !== reqIdRef.current) return;
        setPredictions([]);
        setSearchError("No pudimos buscar ubicaciones. Verifica tu conexión.");
      } finally {
        if (reqId === reqIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 300);
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    cancelPending();
    setPredictions([]);
    setFocused(false);
    setSearchError(null);
    Keyboard.dismiss();

    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }

    const fallbackLabel = [
      prediction.mainText,
      prediction.secondaryText.replace(/,?\s*M[ée]xico$/i, "").trim(),
    ]
      .filter(Boolean)
      .join(", ");

    setQuery(fallbackLabel);
    setIsResolving(true);

    try {
      const details = await fetchPlaceDetails(prediction.placeId);
      const formatted = formatCityLabel(
        details.municipio,
        details.estado,
        fallbackLabel,
      );
      setQuery(formatted);
      onSelectCity(formatted);
      onSelectLocationDetails?.({
        city: formatted,
        postalCode: details.cp || "",
        neighborhood: details.colonia || "",
        lat: details.lat,
        lng: details.lng,
      });
    } catch {
      onSelectCity(fallbackLabel);
      onSelectLocationDetails?.({
        city: fallbackLabel,
        postalCode: "",
        neighborhood: "",
        lat: null,
        lng: null,
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;
    cancelPending();
    setPredictions([]);
    setSearchError(null);
    setIsLocating(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setSearchError(
          "Activa el permiso de ubicación o busca tu ciudad escribiendo arriba.",
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const resolved = await reverseGeocodeCoords(
        pos.coords.latitude,
        pos.coords.longitude,
      );

      if (!resolved) {
        setSearchError("No pudimos detectar tu ciudad actual.");
        return;
      }

      const formatted = formatCityLabel(
        resolved.municipio,
        resolved.estado,
        resolved.formattedAddress,
      );

      if (formatted) {
        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
        setQuery(formatted);
        onSelectCity(formatted);
        onSelectLocationDetails?.({
          city: formatted,
          postalCode: resolved.cp || "",
          neighborhood: resolved.colonia || "",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      }
    } catch {
      setSearchError("No fue posible obtener tu ubicación actual.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleClear = () => {
    cancelPending();
    setQuery("");
    setPredictions([]);
    setSearchError(null);
    onSelectCity("");
    onSelectLocationDetails?.({ city: "", postalCode: "", neighborhood: "" });
  };

  const isConfirmed = Boolean(value && value.trim().length >= 2);
  const showDropdown =
    focused && (isSearching || predictions.length > 0 || Boolean(searchError));

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>

        {Platform.OS !== "web" ? (
          <Pressable
            onPress={() => void handleUseCurrentLocation()}
            disabled={isLocating}
            style={({ pressed }) => [
              styles.gpsPill,
              { backgroundColor: theme.primarySoft },
              pressed && styles.pressed,
            ]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <LocateFixed size={12} color={theme.primary} />
            )}
            <Text style={[styles.gpsText, { color: theme.primary }]}>
              {isLocating ? "Ubicando..." : "Mi ubicación"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error
              ? theme.error
              : focused
                ? theme.primary
                : theme.inputBorder,
          },
        ]}
      >
        <Search size={17} color={focused ? theme.primary : theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          returnKeyType="search"
        />

        {isResolving ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : isConfirmed ? (
          <CheckCircle2 size={17} color={theme.success} />
        ) : null}

        {query.length > 0 ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityLabel="Limpiar ciudad"
          >
            <X size={16} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {showDropdown ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          {isSearching ? (
            <View style={styles.skeletonPad}>
              <SuggestionListSkeleton rows={3} />
            </View>
          ) : searchError ? (
            <Text style={[styles.dropdownHint, { color: theme.error }]}>
              {searchError}
            </Text>
          ) : (
            predictions.map((item, idx) => (
              <Pressable
                key={item.placeId}
                onPress={() => void handleSelectPrediction(item)}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  idx < predictions.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.inputBorder,
                  },
                  pressed && { backgroundColor: theme.primarySoft },
                ]}
              >
                <MapPin size={15} color={theme.primary} />
                <View style={styles.suggestionText}>
                  <Text
                    style={[styles.suggestionMain, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      style={[
                        styles.suggestionSub,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      ) : !isConfirmed && query.trim().length > 0 && !focused ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>
          Selecciona una ciudad de las sugerencias de Google Maps.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  label: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  gpsPill: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  gpsText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  inputBox: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },

  dropdown: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  skeletonPad: {
    padding: 12,
  },

  dropdownHint: {
    fontSize: 12.5,
    padding: 12,
  },

  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  suggestionText: {
    flex: 1,
    gap: 1,
  },

  suggestionMain: {
    fontSize: 14,
    fontWeight: "700",
  },

  suggestionSub: {
    fontSize: 12,
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },

  helperText: {
    fontSize: 12,
    marginLeft: 2,
  },

  pressed: {
    opacity: 0.72,
  },
});
