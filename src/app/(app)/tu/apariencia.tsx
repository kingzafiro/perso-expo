import * as Haptics from "expo-haptics";
import { Check, Contrast, Moon, Sun } from "lucide-react-native";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  PERSO_APP_ICONS,
  PersoAppIconPreview,
} from "@/features/settings/components/PersoAppIconPreview";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import {
  usePreferencesStore,
  type ColorSchemePreference,
  type PersoAppIconId,
} from "@/stores/preferences.store";

const SCHEME_OPTIONS: {
  id: ColorSchemePreference;
  label: string;
  Icon: typeof Contrast;
}[] = [
  { id: "system", label: "Sistema", Icon: Contrast },
  { id: "light", label: "Claro", Icon: Sun },
  { id: "dark", label: "Oscuro", Icon: Moon },
];

export default function AparienciaScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const colorScheme = usePreferencesStore((state) => state.colorScheme);
  const setColorScheme = usePreferencesStore((state) => state.setColorScheme);
  const appIcon = usePreferencesStore((state) => state.appIcon);
  const setAppIcon = usePreferencesStore((state) => state.setAppIcon);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#141110" : "#FFFFFF";
  const idleBorder = isDark
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(23, 18, 14, 0.12)";

  const handleSelectScheme = async (option: ColorSchemePreference) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setColorScheme(option);
  };

  const handleSelectIcon = async (iconId: PersoAppIconId) => {
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }
    await setAppIcon(iconId);
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Apariencia" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Esquema de color */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Esquema de color
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            Activa el modo oscuro o permite que Perso se adapte visualmente a la
            configuración de tu dispositivo.
          </Text>

          <View style={styles.schemeGrid}>
            {SCHEME_OPTIONS.map(({ id, label, Icon }) => {
              const selected = colorScheme === id;

              return (
                <Pressable
                  key={id}
                  onPress={() => handleSelectScheme(id)}
                  style={({ pressed }) => [
                    styles.schemeCard,
                    {
                      backgroundColor: selected
                        ? isDark
                          ? "#1C1510"
                          : "#FFF8F2"
                        : cardBg,
                      borderColor: selected ? theme.primary : idleBorder,
                      borderWidth: selected ? 2 : 1,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    size={22}
                    color={selected ? theme.primary : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.schemeLabel,
                      {
                        color: selected ? theme.text : theme.textSecondary,
                        fontWeight: selected ? "700" : "500",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ícono de la app */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Ícono de la app
          </Text>

          <View style={styles.iconGrid}>
            {PERSO_APP_ICONS.map((option) => {
              const selected = appIcon === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelectIcon(option.id)}
                  style={({ pressed }) => [
                    styles.iconItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.iconFrame,
                      selected && {
                        borderColor: theme.primary,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <PersoAppIconPreview option={option} size={74} />
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.iconLabel,
                      {
                        color: selected ? theme.text : theme.textSecondary,
                        fontWeight: selected ? "700" : "500",
                      },
                    ]}
                  >
                    {option.label}
                  </Text>

                  <View style={styles.checkSlot}>
                    {selected && (
                      <View
                        style={[
                          styles.checkBadge,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 120,
    gap: 30,
  },

  section: {
    gap: 12,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: -4,
  },

  schemeGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },

  schemeCard: {
    flex: 1,
    minHeight: 102,
    borderRadius: 18,
    padding: 14,
    justifyContent: "space-between",
  },

  schemeLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    rowGap: 18,
    marginTop: 4,
  },

  iconItem: {
    width: "33.3333%",
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 8,
  },

  iconFrame: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
  },

  iconLabel: {
    fontSize: 13,
    textAlign: "center",
  },

  checkSlot: {
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});
