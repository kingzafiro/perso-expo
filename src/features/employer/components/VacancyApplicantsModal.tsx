import { ChevronRight, Mail, Phone, Users, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spinner } from "@/components/ui/Spinner";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { useVacancyApplicants } from "../hooks/use-employer-vacancies";
import type {
  ApplicationStatus,
  EmployerVacancy,
} from "../types/employer.types";
import { ApplicantProfileModal } from "./ApplicantProfileModal";

interface VacancyApplicantsModalProps {
  vacancy: EmployerVacancy | null;
  onClose: () => void;
}

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = {
  enviada: {
    label: "Nueva",
    color: "#F06808",
    bg: "rgba(240, 104, 8, 0.14)",
  },
  en_revision: {
    label: "En revisión",
    color: "#0A84FF",
    bg: "rgba(10, 132, 255, 0.14)",
  },
  entrevista: {
    label: "Entrevista",
    color: "#AF52DE",
    bg: "rgba(175, 82, 222, 0.14)",
  },
  contratado: {
    label: "Contratado",
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.14)",
  },
  descartada: {
    label: "Descartada",
    color: "#8E8E93",
    bg: "rgba(142, 142, 147, 0.16)",
  },
};

export function VacancyApplicantsModal({
  vacancy,
  onClose,
}: VacancyApplicantsModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedPostulacionId, setSelectedPostulacionId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!vacancy) {
      setSelectedPostulacionId(null);
    }
  }, [vacancy]);

  const { data: applicants = [], isLoading } = useVacancyApplicants(
    vacancy?.id_vacante ?? null,
  );

  const handleCloseAll = () => {
    setSelectedPostulacionId(null);
    onClose();
  };

  const sheetBg = isDark ? "#12100E" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  return (
    <Modal
      visible={Boolean(vacancy)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (selectedPostulacionId) {
          setSelectedPostulacionId(null);
        } else {
          handleCloseAll();
        }
      }}
    >
      {selectedPostulacionId ? (
        <ApplicantProfileModal
          idPostulacion={selectedPostulacionId}
          idVacante={vacancy?.id_vacante ?? null}
          onBack={() => setSelectedPostulacionId(null)}
          onClose={handleCloseAll}
        />
      ) : (
        <View style={[styles.container, { backgroundColor: sheetBg }]}>
          <View
            style={[
              styles.header,
              {
                paddingTop: Math.max(insets.top, 18),
                borderBottomColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.flexOne}>
              <Text style={[styles.title, { color: theme.text }]}>
                Postulantes
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {vacancy?.titulo}
              </Text>
            </View>

            <Pressable
              onPress={handleCloseAll}
              style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
            >
              <X size={18} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom + 24, 36) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.centerBox}>
                <Spinner size={26} strokeWidth={2.6} color={theme.primary} />
              </View>
            ) : applicants.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <Users size={26} color={theme.primary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Aún no hay postulantes
                </Text>
                <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                  Cuando los candidatos se postulen desde Empleos aparecerán aquí
                  y podrás consultar su perfil completo y solicitar documentos.
                </Text>
              </View>
            ) : (
              applicants.map((item) => {
                const name = item.candidato?.nombre || "Candidato";
                const initials = name.slice(0, 2).toUpperCase();
                const statusMeta =
                  STATUS_META[item.estado] ?? STATUS_META.enviada;

                return (
                  <Pressable
                    key={item.id_postulacion}
                    onPress={() =>
                      setSelectedPostulacionId(item.id_postulacion)
                    }
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.personRow}>
                      <ProfileAvatar
                        uri={item.candidato?.foto_perfil}
                        initials={initials}
                        size={48}
                      />
                      <View style={styles.flexOne}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[styles.personName, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {name}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusMeta.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: statusMeta.color },
                              ]}
                            >
                              {statusMeta.label}
                            </Text>
                          </View>
                        </View>
                        {item.candidato?.email ? (
                          <View style={styles.contactRow}>
                            <Mail size={12} color={theme.textSecondary} />
                            <Text
                              style={[
                                styles.contactText,
                                { color: theme.textSecondary },
                              ]}
                              numberOfLines={1}
                            >
                              {item.candidato.email}
                            </Text>
                          </View>
                        ) : null}
                        {item.candidato?.celular ? (
                          <View style={styles.contactRow}>
                            <Phone size={12} color={theme.textSecondary} />
                            <Text
                              style={[
                                styles.contactText,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {item.candidato.celular}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {item.mensaje_presentacion ? (
                      <Text
                        style={[
                          styles.coverNote,
                          {
                            color: theme.textSecondary,
                            backgroundColor: theme.inputBackground,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        “{item.mensaje_presentacion}”
                      </Text>
                    ) : null}

                    <View
                      style={[
                        styles.cardFooter,
                        {
                          borderTopColor: isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(23,18,14,0.06)",
                        },
                      ]}
                    >
                      <Text
                        style={[styles.footerHint, { color: theme.textMuted }]}
                      >
                        {item.estado === "enviada"
                          ? "Al abrir el perfil pasará a En revisión"
                          : "Ver experiencia, CV y gestionar proceso"}
                      </Text>
                      <View
                        style={[
                          styles.viewProfilePill,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.viewProfileText,
                            { color: theme.primary },
                          ]}
                        >
                          Ver perfil
                        </Text>
                        <ChevronRight size={13} color={theme.primary} />
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 16,
    gap: 12,
  },

  centerBox: {
    paddingVertical: 40,
    alignItems: "center",
  },

  emptyCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 11,
  },

  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  personName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  contactText: {
    fontSize: 12,
    flex: 1,
  },

  coverNote: {
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    borderRadius: 12,
  },

  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  footerHint: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "500",
  },

  viewProfilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  viewProfileText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  pressed: {
    transform: [{ scale: 0.988 }],
  },
});
