import { ChevronRight, Mail, Phone, Users, X } from "lucide-react-native";
import { useState } from "react";
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

import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import {
  useUpdateApplicantStatus,
  useVacancyApplicants,
} from "../hooks/use-employer-vacancies";
import type { ApplicationStatus, EmployerVacancy } from "../types/employer.types";
import { ApplicantProfileModal } from "./ApplicantProfileModal";

interface VacancyApplicantsModalProps {
  vacancy: EmployerVacancy | null;
  onClose: () => void;
}

const STATUS_ACTIONS: { id: ApplicationStatus; label: string }[] = [
  { id: "en_revision", label: "En revisión" },
  { id: "entrevista", label: "Entrevista" },
  { id: "contratado", label: "Contratado" },
  { id: "descartada", label: "Descartar" },
];

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

  const { data: applicants = [], isLoading } = useVacancyApplicants(
    vacancy?.id_vacante ?? null,
  );
  const updateStatus = useUpdateApplicantStatus(vacancy?.id_vacante ?? null);

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
      onRequestClose={onClose}
    >
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
            onPress={onClose}
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
              <ActivityIndicator color={theme.primary} />
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

              return (
                <View
                  key={item.id_postulacion}
                  style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  <Pressable
                    onPress={() => setSelectedPostulacionId(item.id_postulacion)}
                    style={({ pressed }) => [
                      styles.personRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ProfileAvatar
                      uri={item.candidato?.foto_perfil}
                      initials={initials}
                      size={46}
                    />
                    <View style={styles.flexOne}>
                      <Text style={[styles.personName, { color: theme.text }]}>
                        {name}
                      </Text>
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
                  </Pressable>

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

                  <View style={styles.statusRow}>
                    {STATUS_ACTIONS.map((action) => {
                      const active = item.estado === action.id;
                      return (
                        <Pressable
                          key={action.id}
                          onPress={() =>
                            updateStatus.mutate({
                              idPostulacion: item.id_postulacion,
                              estado: action.id,
                            })
                          }
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor: active
                                ? theme.primary
                                : theme.inputBackground,
                              borderColor: active
                                ? theme.primary
                                : theme.inputBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChipText,
                              { color: active ? "#FFFFFF" : theme.text },
                            ]}
                          >
                            {action.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <ApplicantProfileModal
          idPostulacion={selectedPostulacionId}
          idVacante={vacancy?.id_vacante ?? null}
          onClose={() => setSelectedPostulacionId(null)}
        />
      </View>
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
    gap: 11,
  },

  personName: {
    fontSize: 15,
    fontWeight: "700",
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  contactText: {
    fontSize: 12,
  },

  viewProfilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  viewProfileText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  coverNote: {
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    borderRadius: 12,
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusChipText: {
    fontSize: 11.5,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.75,
  },
});
