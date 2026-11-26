import { Bell, Camera, FolderOpen, Image as ImageIcon } from "lucide-react-native";
import { Linking, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export default function PermisosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const screenBg = isDark ? "#000000" : "#F5F2EF";

  const openSystemSettings = async () => {
    await Linking.openSettings();
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Permisos" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsGroup
          title="Permisos del dispositivo"
          footer="Los permisos del sistema se administran directamente desde la configuración de tu dispositivo."
        >
          <SettingsRow
            title="Notificaciones"
            subtitle="Recibir avisos en tiempo real"
            icon={<Bell size={18} color="#FFFFFF" />}
            iconBgColor="#FF3B30"
            showDivider
            onPress={openSystemSettings}
          />

          <SettingsRow
            title="Cámara"
            subtitle="Tomar foto de perfil y documentos"
            icon={<Camera size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            showDivider
            onPress={openSystemSettings}
          />

          <SettingsRow
            title="Fotos y galería"
            subtitle="Seleccionar imágenes guardadas"
            icon={<ImageIcon size={18} color="#FFFFFF" />}
            iconBgColor="#34C759"
            showDivider
            onPress={openSystemSettings}
          />

          <SettingsRow
            title="Archivos"
            subtitle="Adjuntar CV y comprobantes en PDF"
            icon={<FolderOpen size={18} color="#FFFFFF" />}
            iconBgColor="#0A84FF"
            onPress={openSystemSettings}
          />
        </SettingsGroup>

        <AppButton
          title="Abrir configuración del dispositivo"
          onPress={openSystemSettings}
        />
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 24,
  },
});
