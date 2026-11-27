import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  MapPin,
  QrCode,
  XCircle,
} from "lucide-react-native";
import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { QrCodeView } from "@/components/ui/QrCodeView";
import { Spinner } from "@/components/ui/Spinner";
import { useMyInterviews } from "@/features/employer/hooks/use-interviews";
import type {
  InterviewPass,
  InterviewPassStatus,
} from "@/features/employer/types/interviews.types";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const PASS_STATUS_META: Record<
  InterviewPassStatus,
  { label: string; color: string; bg: string }
> = {
  pendiente: {
    label: "Pase QR activo",
    color: "#F06808",
    bg: "rgba(240, 104, 8, 0.14)",
  },
  aprobada: {
    label: "Acceso verificado",
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.14)",
  },
  rechazada: {
    label: "Acceso rechazado",
    color: "#FF3B30",
    bg: "rgba(255, 59, 48, 0.14)",
  },
  cancelada: {
    label: "Cancelada",
    color: "#8E8E93",
    bg: "rgba(142, 142, 147, 0.16)",
  },
};

function openMapsForInterview(item: InterviewPass) {
  if (Platform.OS !== "web") {
    void Haptics.selectionAsync();
  }
  const encodedAddr = encodeURIComponent(item.direccion_oficina);
  if (item.latitud !== null && item.longitud !== null) {
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${item.latitud},${item.longitud}&q=${encodedAddr}`
        : `https://www.google.com/maps/search/?api=1&query=${item.latitud},${item.longitud}`;
    void Linking.openURL(url);
    return;
  }

  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?q=${encodedAddr}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedAddr}`;
  void Linking.openURL(url);
}

export default function MisEntrevistasScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const { data: interviews = [], isLoading, refetch } = useMyInterviews();
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Mis entrevistas" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={() => void handleManualRefresh()}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loaderBox}>
            <Spinner size={28} strokeWidth={2.8} color={theme.primary} />
          </View>
        ) : interviews.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View
              style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}
            >
              <QrCode size={25} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes entrevistas agendadas
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Cuando una empresa te invite a entrevista presencial, aquí
              recibirás la ubicación de la oficina, su foto de referencia y tu
              Pase QR personal de acceso.
            </Text>
          </View>
        ) : (
          interviews.map((item) => {
            const meta =
              PASS_STATUS_META[item.estado] ?? PASS_STATUS_META.pendiente;

            return (
              <View
                key={item.id_entrevista}
                style={[
                  styles.card,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                {/* Encabezado empresa + estado */}
                <View style={styles.topRow}>
                  <View style={styles.flexOne}>
                    <View style={styles.companyRow}>
                      <Building2 size={14} color={theme.primary} />
                      <Text
                        style={[styles.companyName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {item.empresa?.nombre_comercial || "Empresa en Perso"}
                      </Text>
                      {item.empresa?.verificada ? (
                        <BadgeCheck size={14} color="#34C759" />
                      ) : null}
                    </View>
                    <Text
                      style={[styles.vacancyTitle, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {item.vacante?.titulo || "Entrevista"}
                    </Text>
                  </View>

                  <View
                    style={[styles.statusPill, { backgroundColor: meta.bg }]}
                  >
                    {item.estado === "aprobada" ? (
                      <CheckCircle2 size={12} color={meta.color} />
                    ) : item.estado === "rechazada" ? (
                      <XCircle size={12} color={meta.color} />
                    ) : null}
                    <Text
                      style={[styles.statusPillText, { color: meta.color }]}
                    >
                      {meta.label}
                    </Text>
                  </View>
                </View>

                {item.fecha_hora ? (
                  <View
                    style={[
                      styles.dateBanner,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <CalendarClock size={15} color={theme.primary} />
                    <Text
                      style={[styles.dateBannerText, { color: theme.primary }]}
                    >
                      {item.fecha_hora}
                    </Text>
                  </View>
                ) : null}

                {/* Pase QR de acceso */}
                <View
                  style={[
                    styles.qrCard,
                    {
                      backgroundColor: isDark ? "#110F0E" : "#FAF8F5",
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[styles.qrEyebrow, { color: theme.textSecondary }]}
                  >
                    PASE QR DE ACCESO A ENTREVISTA
                  </Text>
                  <View style={styles.qrFrameShadow}>
                    <QrCodeView value={item.qr_token} size={196} />
                  </View>
                  <Text style={[styles.qrCodeText, { color: theme.text }]}>
                    {item.codigo_corto}
                  </Text>
                  <Text style={[styles.qrHint, { color: theme.textSecondary }]}>
                    Muestra este QR al llegar a recepción para que la empresa
                    confirme tu identidad y apruebe tu acceso.
                  </Text>
                </View>

                {/* Ubicación de la oficina */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionTitleRow}>
                    <MapPin size={15} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Ubicación de la oficina
                    </Text>
                  </View>
                  <Text
                    style={[styles.addressText, { color: theme.textSecondary }]}
                  >
                    {item.direccion_oficina}
                  </Text>
                  {item.referencias ? (
                    <Text
                      style={[
                        styles.referencesBox,
                        {
                          color: theme.text,
                          backgroundColor: theme.inputBackground,
                        },
                      ]}
                    >
                      Indicaciones: {item.referencias}
                    </Text>
                  ) : null}

                  {item.latitud !== null && item.longitud !== null ? (
                    <InteractiveAddressMap
                      coords={{ lat: item.latitud, lng: item.longitud }}
                      height={150}
                      readOnly
                    />
                  ) : null}

                  <Pressable
                    onPress={() => openMapsForInterview(item)}
                    style={({ pressed }) => [
                      styles.mapsBtn,
                      { backgroundColor: theme.primarySoft },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ExternalLink size={15} color={theme.primary} />
                    <Text
                      style={[styles.mapsBtnText, { color: theme.primary }]}
                    >
                      Abrir ubicación en Mapas
                    </Text>
                  </Pressable>
                </View>

                {/* Foto de referencia de la oficina */}
                {item.foto_referencia_url ? (
                  <View style={styles.sectionBlock}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Foto de referencia de la oficina
                    </Text>
                    <Image
                      source={{ uri: item.foto_referencia_url }}
                      style={styles.officeImage}
                      contentFit="cover"
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
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
    paddingTop: 14,
    paddingBottom: 120,
    gap: 14,
  },

  loaderBox: {
    paddingVertical: 64,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
  },

  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 3,
  },

  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  companyName: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },

  vacancyTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  dateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },

  dateBannerText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  qrCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },

  qrEyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1,
  },

  qrFrameShadow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  qrCodeText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  qrHint: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },

  sectionBlock: {
    gap: 8,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
  },

  addressText: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  referencesBox: {
    fontSize: 13,
    lineHeight: 18,
    padding: 11,
    borderRadius: 12,
  },

  mapsBtn: {
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  mapsBtnText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  officeImage: {
    width: "100%",
    height: 185,
    borderRadius: 16,
  },

  pressed: {
    opacity: 0.78,
  },
});
