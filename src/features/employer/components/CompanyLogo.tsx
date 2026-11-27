import { Image } from "expo-image";
import { Building2, Camera } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Spinner } from "@/components/ui/Spinner";
import { useTheme } from "@/hooks/use-theme";

interface CompanyLogoProps {
  uri?: string | null;
  size?: number;
  borderRadius?: number;
  editable?: boolean;
  isUploading?: boolean;
  onPress?: () => void;
}

export function CompanyLogo({
  uri,
  size = 48,
  borderRadius,
  editable = false,
  isUploading = false,
  onPress,
}: CompanyLogoProps) {
  const theme = useTheme();
  const radius = borderRadius ?? Math.round(size * 0.28);
  const iconSize = Math.max(14, Math.round(size * 0.44));

  const content = (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: uri ? "#FFFFFF" : theme.primarySoft,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <Building2 size={iconSize} color={theme.primary} />
        )}

        {isUploading ? (
          <View style={styles.loadingVeil}>
            <Spinner size={Math.round(size * 0.34)} strokeWidth={2.4} color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {editable ? (
        <View
          style={[
            styles.cameraBadge,
            {
              backgroundColor: theme.primary,
              borderColor: theme.background,
            },
          ]}
        >
          <Camera size={13} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isUploading}
        accessibilityRole="button"
        accessibilityLabel="Subir o cambiar logotipo de la empresa"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },

  loadingVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.82,
  },
});
