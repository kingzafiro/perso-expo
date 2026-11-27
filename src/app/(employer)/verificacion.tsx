import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { BadgeCheck, FileText, Lock } from "lucide-react-native";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { EmployerVerificationCard } from "@/features/employer/components/EmployerVerificationCard";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string } | undefined;
    if (data?.mensaje) return data.mensaje;
  }
  return fallback;
}

const BENEFITS = [
  {
    icon: BadgeCheck,
    text: "Insignia de Empresa Verificada en tus vacantes",
  },
  {
    icon: FileText,
    text: "Extracción automática de RFC y razón social con IA",
  },
  {
    icon: Lock,
    text: "Documento privado, cifrado y usado solo para validar tu negocio",
  },
];

export default function EmployerVerificationStepScreen() {
  const theme = useTheme();
  const profile = useEmployerStore((state) => state.profile);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const uploadVerificationPdf = useEmployerStore(
    (state) => state.uploadVerificationPdf,
  );

  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const isVerified = Boolean(profile?.verified && profile?.rfc);

  const handlePickAndVerifyPdf = async () => {
    if (uploading) return;

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      const asset = picked.assets[0];
      const name = asset.name || "constancia-fiscal.pdf";
      setSelectedFileName(name);
      setUploading(true);

      const { extraccion } = await uploadVerificationPdf({
        uri: asset.uri,
        name,
        mimeType: asset.mimeType || "application/pdf",
      });

      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      Alert.alert(
        "Empresa verificada",
        `RFC detectado: ${extraccion.rfc}\nRazón social: ${extraccion.razonSocial}`,
      );
    } catch (error) {
      Alert.alert(
        "No se pudo verificar el PDF",
        extractErrorMessage(
          error,
          "Verifica que sea el PDF original de tu Constancia de Situación Fiscal del SAT.",
        ),
      );
    } finally {
      setUploading(false);
      setSelectedFileName(null);
    }
  };

  const handleContinue = () => {
    if (hasAccess) {
      router.replace("/(employer)/panel");
    } else {
      router.push("/(employer)/planes");
    }
  };

  return (
    <AuthSheetLayout
      title="Verificación empresarial"
      subtitle="Paso opcional. Sube tu Constancia de Situación Fiscal en PDF para validar tu empresa al instante."
      showBackButton
      stepIndicator={{ current: 3, total: 4 }}
    >
      <View style={styles.container}>
        <EmployerVerificationCard
          verified={isVerified}
          rfc={profile?.rfc}
          legalName={profile?.legalName}
          uploading={uploading}
          selectedFileName={selectedFileName}
          onPickPdf={() => void handlePickAndVerifyPdf()}
        />

        <View style={styles.benefitsList}>
          {BENEFITS.map(({ icon: Icon, text }) => (
            <View key={text} style={styles.benefitRow}>
              <View
                style={[
                  styles.benefitIcon,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Icon size={15} color={theme.primary} />
              </View>
              <Text
                style={[styles.benefitText, { color: theme.textSecondary }]}
              >
                {text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {isVerified ? (
            <AppButton
              title={hasAccess ? "Volver al panel" : "Continuar a planes"}
              disabled={uploading}
              onPress={handleContinue}
            />
          ) : (
            <>
              <AppButton
                title="Seleccionar PDF del SAT"
                loading={uploading}
                onPress={() => void handlePickAndVerifyPdf()}
              />
              <Pressable
                onPress={handleContinue}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.skipBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.skipText, { color: theme.textSecondary }]}
                >
                  Omitir por ahora
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 18,
  },

  benefitsList: {
    gap: 11,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  actions: {
    gap: 10,
    marginTop: 4,
  },

  skipBtn: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  skipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.68,
  },
});
