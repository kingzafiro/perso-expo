import { RotateCcw } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface SubscriptionComplianceFooterProps {
  restoring: boolean;
  onRestore: () => void;
  onSaveForLater?: () => void;
  disabled?: boolean;
  trialDays?: number;
}

export function SubscriptionComplianceFooter({
  restoring,
  onRestore,
  onSaveForLater,
  disabled,
  trialDays = 14,
}: SubscriptionComplianceFooterProps) {
  const theme = useTheme();
  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";

  return (
    <View style={styles.container}>
      <View style={styles.linksRow}>
        <Pressable
          onPress={onRestore}
          disabled={disabled || restoring}
          style={({ pressed }) => [
            styles.restoreBtn,
            pressed && styles.pressed,
          ]}
        >
          <RotateCcw size={13} color={theme.primary} />
          <Text style={[styles.restoreText, { color: theme.primary }]}>
            {restoring ? "Restaurando..." : "Restaurar compras"}
          </Text>
        </Pressable>

        {onSaveForLater ? (
          <>
            <Text style={[styles.dot, { color: theme.textMuted }]}>·</Text>
            <Pressable
              onPress={onSaveForLater}
              disabled={disabled}
              style={({ pressed }) => [
                styles.laterBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.laterText, { color: theme.textSecondary }]}>
                Activar después
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <Text style={[styles.legalText, { color: theme.textMuted }]}>
        La prueba gratis de {trialDays} días se renueva automáticamente al
        finalizar el periodo a menos que canceles al menos 24 horas antes desde
        la configuración de suscripciones de {storeName}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 2,
  },

  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  restoreText: {
    fontSize: 13,
    fontWeight: "700",
  },

  dot: {
    fontSize: 14,
    fontWeight: "700",
  },

  laterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  laterText: {
    fontSize: 13,
    fontWeight: "600",
  },

  legalText: {
    fontSize: 11.5,
    lineHeight: 16.5,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.68,
  },
});
