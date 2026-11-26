import { MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { InteractiveAddressMapProps } from "@/features/profile/components/InteractiveAddressMap.types";
import { useTheme } from "@/hooks/use-theme";

export function InteractiveAddressMap({
  coords,
  height = 170,
}: InteractiveAddressMapProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        },
      ]}
    >
      <MapPin size={22} color={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>
        Vista de mapa interactivo
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {coords
          ? `Ubicación: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
          : "Disponible con Apple Maps en iOS y Google Maps en Android"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 6,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 12,
    textAlign: "center",
  },
});
