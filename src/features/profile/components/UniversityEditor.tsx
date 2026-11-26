import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import { Check, GraduationCap, Search, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { SuggestionListSkeleton } from "@/components/ui/Skeleton";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import {
  searchUniversities,
  type UniversitySuggestion,
} from "@/features/profile/api/universities.api";
import { useTheme } from "@/hooks/use-theme";

const POPULAR_UNIVERSITIES: UniversitySuggestion[] = [
  {
    id: "popular-unam",
    name: "Universidad Nacional Autónoma de México",
    acronym: "UNAM",
    city: "Ciudad de México",
    state: "CDMX",
    country: "Mexico",
    countryCode: "MX",
  },
  {
    id: "popular-ipn",
    name: "Instituto Politécnico Nacional",
    acronym: "IPN",
    city: "Ciudad de México",
    state: "CDMX",
    country: "Mexico",
    countryCode: "MX",
  },
  {
    id: "popular-itesm",
    name: "Tecnológico de Monterrey",
    acronym: "ITESM",
    city: "Monterrey",
    state: "Nuevo León",
    country: "Mexico",
    countryCode: "MX",
  },
  {
    id: "popular-uanl",
    name: "Universidad Autónoma de Nuevo León",
    acronym: "UANL",
    city: "San Nicolás de los Garza",
    state: "Nuevo León",
    country: "Mexico",
    countryCode: "MX",
  },
  {
    id: "popular-udg",
    name: "Universidad de Guadalajara",
    acronym: "UdeG",
    city: "Guadalajara",
    state: "Jalisco",
    country: "Mexico",
    countryCode: "MX",
  },
];

function extractErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorResponse> | null;
  return axiosError?.response?.data?.mensaje ?? fallback;
}

function formatLocation(item: UniversitySuggestion) {
  const parts = [
    item.city,
    item.state && item.state !== item.city ? item.state : "",
    item.countryCode && item.countryCode !== "MX" ? item.country : "",
  ].filter(Boolean);

  return parts.join(", ");
}

export function UniversityEditor({
  initialValue,
  loading,
  error,
  onSave,
}: {
  initialValue?: string;
  loading: boolean;
  error: unknown;
  onSave: (universidad: string) => void;
}) {
  const theme = useTheme();
  const initialClean = (initialValue ?? "").trim();

  const [value, setValue] = useState(initialValue ?? "");
  const [focused, setFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UniversitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const reqIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      reqIdRef.current += 1;
    };
  }, []);

  const cancelPendingSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    reqIdRef.current += 1;
  };

  const handleTextChange = (text: string) => {
    setValue(text);
    if (validationError) setValidationError(null);

    cancelPendingSearch();
    const trimmed = text.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const reqId = reqIdRef.current;
    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const list = await searchUniversities(trimmed);
        if (reqIdRef.current === reqId) {
          setSuggestions(list.slice(0, 5));
          setHasSearched(true);
        }
      } catch {
        if (reqIdRef.current === reqId) {
          setSuggestions([]);
          setHasSearched(true);
        }
      } finally {
        if (reqIdRef.current === reqId) {
          setIsSearching(false);
        }
      }
    }, 300);
  };

  const handleSelectSuggestion = (name: string) => {
    cancelPendingSearch();
    setIsSearching(false);
    setValue(name);
    setValidationError(null);
    Keyboard.dismiss();

    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
  };

  const handleClear = () => {
    cancelPendingSearch();
    setValue("");
    setSuggestions([]);
    setIsSearching(false);
    setHasSearched(false);
    setValidationError(null);
  };

  const cleanValue = value.trim();
  const hasChanges = cleanValue.length >= 2 && cleanValue !== initialClean;

  const handleSubmit = () => {
    if (cleanValue.length < 2) {
      setValidationError("Ingresa el nombre de tu universidad o institución.");
      return;
    }
    if (!hasChanges) return;
    setValidationError(null);
    onSave(cleanValue);
  };

  const serverError = error
    ? extractErrorMessage(error, "No se pudo guardar tu universidad.")
    : null;

  const showingLiveResults = hasSearched && cleanValue.length >= 2;
  const listItems = showingLiveResults ? suggestions : POPULAR_UNIVERSITIES;
  const listHeaderLabel = showingLiveResults
    ? suggestions.length > 0
      ? "Resultados"
      : "Sin coincidencias en catálogo"
    : "Populares en México";

  return (
    <View style={styles.form}>
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Universidad o institución
        </Text>

        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: theme.inputBackground,
              borderColor: validationError
                ? theme.errorBorder
                : focused
                  ? theme.primary
                  : theme.inputBorder,
              borderWidth: 1.5,
            },
          ]}
        >
          <Search size={18} color={theme.textMuted} />
          <TextInput
            value={value}
            onChangeText={handleTextChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Busca por nombre o siglas (UNAM, UANL, Tec...)"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            style={[styles.input, { color: theme.text }]}
          />
          {value.length > 0 ? (
            <Pressable onPress={handleClear} hitSlop={10}>
              <X size={17} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {validationError ? (
          <Text style={[styles.validationText, { color: theme.error }]}>
            {validationError}
          </Text>
        ) : (
          <Text style={[styles.helperText, { color: theme.textMuted }]}>
            Elige una institución o escribe el nombre manualmente si no aparece.
          </Text>
        )}
      </View>

      {/* Lista directa sin ScrollView anidado: responde siempre al primer toque */}
      <View
        style={[
          styles.resultsPanel,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        <View
          style={[styles.resultsHeader, { borderBottomColor: theme.divider }]}
        >
          <Text style={[styles.resultsHeaderText, { color: theme.textMuted }]}>
            {isSearching ? "Buscando instituciones..." : listHeaderLabel}
          </Text>
        </View>

        {isSearching ? (
          <SuggestionListSkeleton rows={3} />
        ) : listItems.length > 0 ? (
          <View>
            {listItems.map((item, idx) => {
              const locationText = formatLocation(item);
              const isSelected =
                cleanValue.toLowerCase() === item.name.toLowerCase();

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectSuggestion(item.name)}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    idx < listItems.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.divider,
                    },
                    (isSelected || pressed) && {
                      backgroundColor: theme.primarySoft,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.suggestionIcon,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.primarySoft,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <Check size={15} color="#FFFFFF" />
                    ) : (
                      <GraduationCap size={16} color={theme.primary} />
                    )}
                  </View>

                  <View style={styles.flexOne}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.suggestionName,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      {item.acronym ? (
                        <View
                          style={[
                            styles.acronymBadge,
                            { backgroundColor: theme.primarySoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.acronymText,
                              { color: theme.primary },
                            ]}
                          >
                            {item.acronym}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {locationText ? (
                      <Text
                        style={[
                          styles.suggestionSub,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {locationText}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyResults}>
            <GraduationCap size={20} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Puedes usar “{cleanValue}”
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Presiona Guardar universidad para registrarla tal como la
              escribiste.
            </Text>
          </View>
        )}
      </View>

      {serverError && (
        <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {serverError}
          </Text>
        </View>
      )}

      <AppButton
        title="Guardar universidad"
        loading={loading}
        disabled={!hasChanges}
        onPress={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 14,
  },

  fieldGroup: {
    gap: 7,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  inputBox: {
    minHeight: 52,
    borderRadius: 18,
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

  helperText: {
    fontSize: 12,
    marginLeft: 2,
  },

  validationText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },

  resultsPanel: {
    minHeight: 210,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  resultsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  resultsHeaderText: {
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  suggestionName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },

  acronymBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },

  acronymText: {
    fontSize: 11,
    fontWeight: "700",
  },

  suggestionSub: {
    fontSize: 12,
  },

  emptyResults: {
    minHeight: 165,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 6,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  emptySub: {
    fontSize: 12.5,
    textAlign: "center",
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
});
