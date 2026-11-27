import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react-native";
import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { Spinner } from "@/components/ui/Spinner";
import { useUserDocuments } from "@/features/documents/hooks/use-documents";
import type { DocumentType } from "@/features/documents/types/documents.types";
import type { EmployerVacancy } from "@/features/employer/types/employer.types";
import { useFullProfile } from "@/features/profile/hooks/use-full-profile";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface ApplyVacancyModalProps {
  visible: boolean;
  vacancy: EmployerVacancy;
  coverMessage: string;
  onChangeCoverMessage: (text: string) => void;
  submitting: boolean;
  togglingFavorite?: boolean;
  onToggleFavorite: () => void;
  onConfirmApply: () => void;
  onClose: () => void;
  onNavigateAway: () => void;
}

interface RequirementItem {
  id: string;
  label: string;
  met: boolean;
  routeLabel: string;
  route: Href;
  ctaLabel: string;
}

const EXTRA_VISIBILITY_DOCS: DocumentType[] = [
  "ine_atras",
  "curp",
  "rfc",
  "constancia_fiscal",
  "nss",
  "comprobante_domicilio",
  "constancia_trabajos",
  "ingles",
];

export function ApplyVacancyModal({
  visible,
  vacancy,
  coverMessage,
  onChangeCoverMessage,
  submitting,
  togglingFavorite,
  onToggleFavorite,
  onConfirmApply,
  onClose,
  onNavigateAway,
}: ApplyVacancyModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { data: fullProfile, isLoading: loadingProfile } = useFullProfile();
  const { data: documents, isLoading: loadingDocs } = useUserDocuments();

  const isLoading = loadingProfile || loadingDocs;

  const {
    minimumRequirements,
    missingMinimumCount,
    recommendations,
    visibilityPercent,
  } = useMemo(() => {
    const user = fullProfile?.usuario;
    const address = fullProfile?.direccion;
    const info = fullProfile?.informacion;
    const job = fullProfile?.empleo;
    const experiences = fullProfile?.experiencias ?? [];

    const hasName = Boolean(user?.nombre?.trim());
    const phoneDigits = (user?.celular ?? "").replace(/\D/g, "");
    const hasPhone = phoneDigits.length >= 8;
    const hasCv = Boolean(documents?.cv?.subido);
    const hasIne = Boolean(documents?.ine?.subido);

    const minReqs: RequirementItem[] = [
      {
        id: "name",
        label: "Nombre completo",
        met: hasName,
        routeLabel: "Tú → Ver perfil",
        route: "/(app)/tu/perfil",
        ctaLabel: "Completar",
      },
      {
        id: "phone",
        label: "Número de teléfono",
        met: hasPhone,
        routeLabel: "Tú → Ver perfil",
        route: "/(app)/tu/perfil",
        ctaLabel: "Agregar",
      },
      {
        id: "cv",
        label: "Currículum Vitae (CV)",
        met: hasCv,
        routeLabel: "Tú → Mis documentos",
        route: "/(app)/tu/documentos",
        ctaLabel: "Subir CV",
      },
      {
        id: "ine",
        label: "INE (Frente)",
        met: hasIne,
        routeLabel: "Tú → Mis documentos",
        route: "/(app)/tu/documentos",
        ctaLabel: "Subir INE",
      },
    ];

    const hasPhoto = Boolean(user?.foto_perfil);
    const hasLocation = Boolean(address?.municipio?.trim() || address?.estado?.trim());
    const hasEducation = Boolean(
      info?.universidad?.trim() || info?.titulo?.trim() || info?.inglesNivel,
    );
    const hasExperience = Boolean(
      job?.puesto?.trim() || job?.empresa?.trim() || experiences.length > 0,
    );
    const extraDocsUploaded = EXTRA_VISIBILITY_DOCS.filter(
      (tipo) => documents?.[tipo]?.subido,
    ).length;
    const hasExtraDocs = extraDocsUploaded >= 2;

    const recs: RequirementItem[] = [
      {
        id: "photo",
        label: "Foto de perfil profesional",
        met: hasPhoto,
        routeLabel: "Tú → Ver perfil",
        route: "/(app)/tu/perfil",
        ctaLabel: "Subir foto",
      },
      {
        id: "location",
        label: "Ubicación y código postal",
        met: hasLocation,
        routeLabel: "Tú → Ver perfil",
        route: "/(app)/tu/perfil",
        ctaLabel: "Agregar",
      },
      {
        id: "education",
        label: "Formación académica y nivel de inglés",
        met: hasEducation,
        routeLabel: "Tú → Ver perfil",
        route: "/(app)/tu/perfil",
        ctaLabel: "Completar",
      },
      {
        id: "experience",
        label: "Último empleo y experiencia por años",
        met: hasExperience,
        routeLabel: "Tú → Ver perfil",
        route: "/(app)/tu/perfil",
        ctaLabel: "Añadir",
      },
      {
        id: "extra_docs",
        label:
          extraDocsUploaded > 0
            ? `Más documentos oficiales (${extraDocsUploaded} adicionales)`
            : "Documentos extra (INE reverso, CURP, CSF, NSS)",
        met: hasExtraDocs,
        routeLabel: "Tú → Mis documentos",
        route: "/(app)/tu/documentos",
        ctaLabel: "Ir a docs",
      },
    ];

    const allChecks = [...minReqs, ...recs];
    const completed = allChecks.filter((item) => item.met).length;
    const pct = Math.round((completed / allChecks.length) * 100);

    return {
      minimumRequirements: minReqs,
      missingMinimumCount: minReqs.filter((r) => !r.met).length,
      recommendations: recs.filter((r) => !r.met),
      visibilityPercent: pct,
    };
  }, [fullProfile, documents]);

  const sheetBg = isDark ? "#12100E" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const canApply = !isLoading && missingMinimumCount === 0;

  const handleGoToRoute = (route: Href) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    onClose();
    onNavigateAway();
    setTimeout(() => {
      router.push(route);
    }, 120);
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={[styles.overlay, { backgroundColor: sheetBg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
              Antes de postularte
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {vacancy.titulo}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
          >
            <X size={18} color={theme.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loaderBox}>
            <Spinner size={26} strokeWidth={2.6} color={theme.primary} />
            <Text style={[styles.loaderText, { color: theme.textSecondary }]}>
              Verificando tu perfil y documentos...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom + 24, 36) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Requisitos mínimos obligatorios */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.flexOne}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Requisitos mínimos
                  </Text>
                  <Text
                    style={[styles.sectionSub, { color: theme.textSecondary }]}
                  >
                    {missingMinimumCount === 0
                      ? "Cumples con todos los requisitos para postularte."
                      : `Te faltan ${missingMinimumCount} requisito${missingMinimumCount === 1 ? "" : "s"} para enviar tu postulación.`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        missingMinimumCount === 0
                          ? "rgba(52, 199, 89, 0.14)"
                          : "rgba(255, 159, 10, 0.16)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          missingMinimumCount === 0 ? "#34C759" : "#FF9F0A",
                      },
                    ]}
                  >
                    {minimumRequirements.length - missingMinimumCount}/
                    {minimumRequirements.length}
                  </Text>
                </View>
              </View>

              <View style={styles.checklist}>
                {minimumRequirements.map((req) => (
                  <View
                    key={req.id}
                    style={[
                      styles.reqRow,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: req.met
                          ? "rgba(52, 199, 89, 0.25)"
                          : theme.inputBorder,
                      },
                    ]}
                  >
                    {req.met ? (
                      <CheckCircle2 size={18} color="#34C759" />
                    ) : (
                      <AlertCircle size={18} color="#FF9F0A" />
                    )}

                    <View style={styles.flexOne}>
                      <Text style={[styles.reqLabel, { color: theme.text }]}>
                        {req.label}
                      </Text>
                      <Text
                        style={[
                          styles.reqRouteHint,
                          {
                            color: req.met ? "#34C759" : theme.textSecondary,
                          },
                        ]}
                      >
                        {req.met ? "Listo" : `Ruta: ${req.routeLabel}`}
                      </Text>
                    </View>

                    {!req.met ? (
                      <Pressable
                        onPress={() => handleGoToRoute(req.route)}
                        style={({ pressed }) => [
                          styles.actionChip,
                          { backgroundColor: theme.primarySoft },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionChipText,
                            { color: theme.primary },
                          ]}
                        >
                          {req.ctaLabel}
                        </Text>
                        <ChevronRight size={13} color={theme.primary} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>

              {missingMinimumCount > 0 ? (
                <Pressable
                  disabled={togglingFavorite}
                  onPress={onToggleFavorite}
                  style={({ pressed }) => [
                    styles.saveForLaterRow,
                    {
                      backgroundColor: vacancy.es_favorito
                        ? theme.primarySoft
                        : theme.inputBackground,
                      borderColor: vacancy.es_favorito
                        ? theme.primary
                        : theme.inputBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Bookmark
                    size={16}
                    color={theme.primary}
                    fill={vacancy.es_favorito ? theme.primary : "transparent"}
                  />
                  <View style={styles.flexOne}>
                    <Text
                      style={[
                        styles.saveForLaterTitle,
                        { color: theme.text },
                      ]}
                    >
                      {vacancy.es_favorito
                        ? "Guardado en Mis favoritos"
                        : "Guardar empleo en favoritos mientras completas"}
                    </Text>
                    <Text
                      style={[
                        styles.saveForLaterSub,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Lo encontrarás en Tú → Mis favoritos para postularte luego
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>

            {/* 2. Recomendaciones para ser más visible */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.visibilityHeader}>
                <View style={styles.inlineRow}>
                  <Sparkles size={16} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Sé más visible para reclutadores
                  </Text>
                </View>
                <Text style={[styles.pctText, { color: theme.primary }]}>
                  {visibilityPercent}%
                </Text>
              </View>

              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.inputBackground },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${visibilityPercent}%`,
                    },
                  ]}
                />
              </View>

              {recommendations.length === 0 ? (
                <Text
                  style={[styles.sectionSub, { color: theme.textSecondary }]}
                >
                  ¡Excelente! Tu perfil y expediente están completos para
                  destacar frente a las empresas.
                </Text>
              ) : (
                <>
                  <Text
                    style={[styles.sectionSub, { color: theme.textSecondary }]}
                  >
                    Opcional, pero los perfiles con más información y documentos
                    verificados reciben más entrevistas:
                  </Text>

                  <View style={styles.recList}>
                    {recommendations.map((rec) => (
                      <Pressable
                        key={rec.id}
                        onPress={() => handleGoToRoute(rec.route)}
                        style={({ pressed }) => [
                          styles.recRow,
                          {
                            backgroundColor: theme.inputBackground,
                            borderColor: theme.inputBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.flexOne}>
                          <Text
                            style={[styles.recLabel, { color: theme.text }]}
                          >
                            {rec.label}
                          </Text>
                          <Text
                            style={[
                              styles.reqRouteHint,
                              { color: theme.textMuted },
                            ]}
                          >
                            Ir a {rec.routeLabel}
                          </Text>
                        </View>
                        <View style={styles.inlineRow}>
                          <Text
                            style={[
                              styles.actionChipText,
                              { color: theme.primary },
                            ]}
                          >
                            {rec.ctaLabel}
                          </Text>
                          <ChevronRight size={13} color={theme.primary} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* 3. Mensaje de presentación opcional */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Mensaje de presentación (opcional)
              </Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                La empresa recibirá tu perfil y CV. Si quieres, agrega una nota
                breve:
              </Text>
              <TextInput
                value={coverMessage}
                onChangeText={onChangeCoverMessage}
                placeholder="Ej. Cuento con experiencia en el área y disponibilidad inmediata..."
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={600}
                editable={canApply}
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                    opacity: canApply ? 1 : 0.55,
                  },
                ]}
              />
            </View>

            <View style={styles.footerActions}>
              <AppButton
                title={
                  canApply
                    ? "Enviar postulación"
                    : `Completa ${missingMinimumCount} requisito${missingMinimumCount === 1 ? "" : "s"} para postularte`
                }
                disabled={!canApply}
                loading={submitting}
                onPress={onConfirmApply}
              />
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text
                  style={[styles.cancelText, { color: theme.textSecondary }]}
                >
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
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
    fontSize: 19,
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

  loaderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loaderText: {
    fontSize: 13.5,
  },

  content: {
    padding: 16,
    gap: 12,
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 11,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  sectionSub: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
  },

  checklist: {
    gap: 8,
  },

  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  reqLabel: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  reqRouteHint: {
    fontSize: 11.5,
    fontWeight: "500",
  },

  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  actionChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  saveForLaterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  saveForLaterTitle: {
    fontSize: 13,
    fontWeight: "700",
  },

  saveForLaterSub: {
    fontSize: 11.5,
  },

  visibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  pctText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  recList: {
    gap: 7,
  },

  recRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },

  recLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  messageInput: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },

  footerActions: {
    gap: 8,
    marginTop: 4,
  },

  cancelBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 13.5,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.75,
  },
});
