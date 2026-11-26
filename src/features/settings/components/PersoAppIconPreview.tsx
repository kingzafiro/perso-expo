import { StyleSheet, Text, View } from "react-native";

import type { PersoAppIconId } from "@/stores/preferences.store";
import { brandPalette } from "@/theme";

export interface PersoAppIconOption {
  id: PersoAppIconId;
  label: string;
  bg: string;
  glowBg?: string;
  letterColor: string;
  dotColor?: string;
  borderColor?: string;
}

export const PERSO_APP_ICONS: PersoAppIconOption[] = [
  {
    id: "default",
    label: "Predeterminado",
    bg: brandPalette[500],
    glowBg: brandPalette[400],
    letterColor: "#FFFFFF",
  },
  {
    id: "obsidian",
    label: "Obsidiana",
    bg: "#120E0C",
    glowBg: "rgba(240, 104, 8, 0.35)",
    letterColor: brandPalette[500],
    borderColor: "rgba(240, 104, 8, 0.35)",
  },
  {
    id: "sunset",
    label: "Atardecer",
    bg: "#D45504",
    glowBg: "#FFA064",
    letterColor: "#FFFFFF",
  },
  {
    id: "glass",
    label: "Cristal",
    bg: "#FFF4EC",
    glowBg: "#FFD7BA",
    letterColor: brandPalette[500],
    borderColor: "rgba(240, 104, 8, 0.25)",
  },
  {
    id: "minimal",
    label: "Minimal",
    bg: "#FFFFFF",
    letterColor: "#17120E",
    dotColor: brandPalette[500],
    borderColor: "rgba(23, 18, 14, 0.12)",
  },
  {
    id: "ember",
    label: "Fuego",
    bg: "#8D350D",
    glowBg: brandPalette[500],
    letterColor: "#FFF4EC",
  },
  {
    id: "midnight",
    label: "Medianoche",
    bg: "#171622",
    glowBg: "rgba(251, 125, 46, 0.30)",
    letterColor: "#FFFFFF",
    dotColor: brandPalette[400],
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  {
    id: "amber",
    label: "Ámbar",
    bg: "#F59E0B",
    glowBg: "#FDE68A",
    letterColor: "#FFFFFF",
  },
  {
    id: "graphite",
    label: "Grafito",
    bg: "#2B2521",
    glowBg: "rgba(255, 255, 255, 0.12)",
    letterColor: "#FFFFFF",
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
];

interface PersoAppIconPreviewProps {
  option: PersoAppIconOption;
  size?: number;
}

export function PersoAppIconPreview({
  option,
  size = 76,
}: PersoAppIconPreviewProps) {
  const radius = Math.round(size * 0.24);
  const fontSize = Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: option.bg,
          borderColor: option.borderColor ?? "rgba(255, 255, 255, 0.12)",
        },
      ]}
    >
      {option.glowBg && (
        <View
          style={[
            styles.glowOrb,
            {
              width: size * 0.95,
              height: size * 0.95,
              borderRadius: size * 0.475,
              top: -size * 0.42,
              right: -size * 0.32,
              backgroundColor: option.glowBg,
            },
          ]}
        />
      )}

      <View style={styles.letterRow}>
        <Text
          style={[
            styles.letter,
            { color: option.letterColor, fontSize, lineHeight: fontSize + 4 },
          ]}
        >
          P
        </Text>
        {option.dotColor && (
          <View
            style={[
              styles.accentDot,
              {
                backgroundColor: option.dotColor,
                width: Math.max(6, Math.round(size * 0.11)),
                height: Math.max(6, Math.round(size * 0.11)),
                borderRadius: 999,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  glowOrb: {
    position: "absolute",
    opacity: 0.48,
  },

  letterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  letter: {
    fontWeight: "800",
    letterSpacing: -1,
  },

  accentDot: {
    marginBottom: 6,
    marginLeft: 1,
  },
});
