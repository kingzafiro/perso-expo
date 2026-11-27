import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { BadgeCheck, FileText, Lock } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { EmployerVerificationCard } from "@/features/employer/components/EmployerVerificationCard";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
    text: "Insignia de Empresa Verificada visible en tus vacantes",
  },
  {
    icon: FileText,
    text: "Extracción automática de RFC y razón social desde tu PDF",
  },
  {
    icon: Lock,
    text: "Documento privado, cifrado y usado únicamente para validar tu negocio",
  },
];

export default function EmployerVerificationScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useEmployerStore((state) => state.profile);
  const draft = useEmployerStore((state) => state.draft);
  const uploadVerificationPdf = useEmployerStore(
    (state) => state.uploadVerificationPdf,
  );

  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const isPreRegistration = !profile?.id_empresa;
  const activeRfc = profile?.rfc || draft.rfc || "";
  const activeLegalName = profile?.legalName || draft.legalName || "";
  const isVerified = Boolean(
    (profile?.verified && profile?.rfc) || (draft.verifiedPdf && draft.rfc),
  );

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

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
        isPreRegistration
          ? [
              {
                text: "Continuar",
                onPress: () => {
                  if (router.canGoBack()) {
                    router.back();
                  }
                },
              },
            ]
          : undefined,
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

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Verificación de empresa" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 36, 56) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Sube tu Constancia de Situación Fiscal en PDF para validar tu negocio
          y mostrar la insignia de verificación a los candidatos.
        </Text>

        <EmployerVerificationCard
          verified={isVerified}
          rfc={activeRfc}
          legalName={activeLegalName}
          uploading={uploading}
          selectedFileName={selectedFileName}
        />

        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Qué incluye la verificación
          </Text>
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
        </View>

        <AppButton
          title={
            isVerified
              ? "Actualizar Constancia Fiscal (PDF)"
              : "Seleccionar PDF del SAT"
          }
          variant={isVerified ? "secondary" : "primary"}
          loading={uploading}
          onPress={() => void handlePickAndVerifyPdf()}
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
    paddingTop: 8,
    gap: 14,
  },

  introText: {
    fontSize: 13.5,
    lineHeight: 19.5,
    paddingHorizontal: 2,
  },

  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },

  cardTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.2,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18.5,
  },
});
