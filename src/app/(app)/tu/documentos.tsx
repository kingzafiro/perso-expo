import * as Haptics from "expo-haptics";
import {
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  CreditCard,
  FileBadge2,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderCheck,
  Globe,
  Home,
  IdCard,
  Languages,
  Landmark,
  ShieldCheck,
  Upload,
} from "lucide-react-native";
import { type ReactNode, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";
import { DocumentActionSheet } from "@/features/documents/components/DocumentActionSheet";
import {
  useDocumentMutations,
  useUserDocuments,
} from "@/features/documents/hooks/use-documents";
import {
  DOCUMENT_META,
  DOCUMENT_SECTIONS,
  type DocumentType,
} from "@/features/documents/types/documents.types";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

function getDocumentIcon(tipo: DocumentType): ReactNode {
  switch (tipo) {
    case "cv":
      return <FileText size={18} color="#FFFFFF" />;
    case "ine":
    case "ine_atras":
      return <IdCard size={18} color="#FFFFFF" />;
    case "pasaporte":
      return <Globe size={18} color="#FFFFFF" />;
    case "visa":
      return <CreditCard size={18} color="#FFFFFF" />;
    case "curp":
      return <BadgeCheck size={18} color="#FFFFFF" />;
    case "rfc":
    case "constancia_fiscal":
      return <Landmark size={18} color="#FFFFFF" />;
    case "nss":
      return <ShieldCheck size={18} color="#FFFFFF" />;
    case "acta_nacimiento":
      return <FileBadge2 size={18} color="#FFFFFF" />;
    case "comprobante_domicilio":
      return <Home size={18} color="#FFFFFF" />;
    case "dc3":
      return <Award size={18} color="#FFFFFF" />;
    case "constancia_trabajos":
      return <Briefcase size={18} color="#FFFFFF" />;
    case "credenciales":
      return <FileSpreadsheet size={18} color="#FFFFFF" />;
    case "ingles":
      return <Languages size={18} color="#FFFFFF" />;
  }
}

export default function MisDocumentosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const docsQuery = useUserDocuments();
  const mutations = useDocumentMutations();

  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const docs = docsQuery.data;
  const cvDoc = docs?.cv ?? null;

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.06)";

  const { totalDocs, uploadedCount, percent } = useMemo(() => {
    const allTypes = Object.keys(DOCUMENT_META) as DocumentType[];
    const done = docs
      ? allTypes.filter((t) => Boolean(docs[t]?.subido)).length
      : 0;
    return {
      totalDocs: allTypes.length,
      uploadedCount: done,
      percent: Math.round((done / allTypes.length) * 100),
    };
  }, [docs]);

  const openDocumentSheet = async (tipo: DocumentType) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    mutations.upload.reset();
    mutations.remove.reset();
    setSelectedDoc(tipo);
  };

  const closeSheet = () => {
    setSelectedDoc(null);
  };

  const handleUpload = (
    tipo: DocumentType,
    file: { uri: string; name: string; mimeType: string },
  ) => {
    mutations.upload.mutate(
      { tipo, file },
      {
        onSuccess: (res) => {
          setBannerMessage(res.mensaje || `${res.documento.etiqueta} guardado.`);
          closeSheet();
        },
      },
    );
  };

  const handleDelete = (tipo: DocumentType) => {
    mutations.remove.mutate(tipo, {
      onSuccess: () => {
        setBannerMessage(`${DOCUMENT_META[tipo].titulo} eliminado.`);
        closeSheet();
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Mis documentos" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={docsQuery.isRefetching}
            onRefresh={() => {
              void docsQuery.refetch();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* Tarjeta de avance del expediente */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <FolderCheck size={17} color={theme.primary} />
              <Text style={[styles.progressTitle, { color: theme.text }]}>
                Expediente documental
              </Text>
            </View>
            <Text style={[styles.progressCount, { color: theme.primary }]}>
              {uploadedCount} / {totalDocs}
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
                { backgroundColor: theme.primary, width: `${percent}%` },
              ]}
            />
          </View>

          <Text
            style={[styles.progressCaption, { color: theme.textSecondary }]}
          >
            Sube tus documentos para completar tu expediente y acelerar tus
            postulaciones.
          </Text>
        </View>

        {bannerMessage && (
          <Pressable
            onPress={() => setBannerMessage(null)}
            style={[
              styles.banner,
              {
                backgroundColor: theme.successSoft,
                borderColor: theme.success,
              },
            ]}
          >
            <CheckCircle2 size={16} color={theme.success} />
            <Text style={[styles.bannerText, { color: theme.text }]}>
              {bannerMessage}
            </Text>
          </Pressable>
        )}

        {docsQuery.isLoading && !docs ? (
          <View style={styles.skeletonSections}>
            <View
              style={[
                styles.skeletonCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.skeletonRow}>
                <Skeleton width={46} height={46} borderRadius={14} />
                <View style={styles.skeletonTextCol}>
                  <Skeleton width="55%" height={15} borderRadius={7} />
                  <Skeleton width="82%" height={11} borderRadius={6} />
                </View>
              </View>
              <Skeleton width="100%" height={42} borderRadius={21} />
            </View>

            {[1, 2].map((group) => (
              <View
                key={group}
                style={[
                  styles.skeletonCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                {[1, 2, 3].map((row) => (
                  <View key={row} style={styles.skeletonRow}>
                    <Skeleton width={32} height={32} borderRadius={9} />
                    <View style={styles.skeletonTextCol}>
                      <Skeleton width="48%" height={14} borderRadius={7} />
                      <Skeleton width="72%" height={11} borderRadius={6} />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <>
            {/* 1. Sección destacada: Currículum (CV) */}
            <View style={styles.customSection}>
              <Text
                style={[
                  styles.customSectionTitle,
                  { color: theme.textSecondary },
                ]}
              >
                Currículum
              </Text>

              <Pressable
                onPress={() => openDocumentSheet("cv")}
                style={({ pressed }) => [
                  styles.cvCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cvDoc?.subido
                      ? theme.success
                      : theme.primaryBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cvTopRow}>
                  <View
                    style={[
                      styles.cvIconBox,
                      {
                        backgroundColor: cvDoc?.subido
                          ? theme.successSoft
                          : theme.primarySoft,
                      },
                    ]}
                  >
                    {cvDoc?.subido ? (
                      <FileCheck2 size={24} color={theme.success} />
                    ) : (
                      <FileText size={24} color={theme.primary} />
                    )}
                  </View>

                  <View style={styles.cvInfo}>
                    <Text style={[styles.cvTitle, { color: theme.text }]}>
                      Currículum Vitae (CV)
                    </Text>
                    <Text
                      style={[
                        styles.cvSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cvDoc?.subido
                        ? "PDF guardado · Toca para ver o actualizar"
                        : "Es lo primero que ven las empresas. Sube tu CV en PDF."}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.cvActionPill,
                    {
                      backgroundColor: cvDoc?.subido
                        ? theme.inputBackground
                        : theme.primary,
                    },
                  ]}
                >
                  <Upload
                    size={15}
                    color={cvDoc?.subido ? theme.text : "#FFFFFF"}
                  />
                  <Text
                    style={[
                      styles.cvActionText,
                      { color: cvDoc?.subido ? theme.text : "#FFFFFF" },
                    ]}
                  >
                    {cvDoc?.subido ? "Ver o reemplazar CV" : "Subir CV en PDF"}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* 2–5. Resto de documentos agrupados por categoría */}
            {DOCUMENT_SECTIONS.map((section) => (
              <SettingsGroup key={section.title} title={section.title}>
                {section.items.map((tipo, index) => {
                  const meta = DOCUMENT_META[tipo];
                  const itemStatus = docs?.[tipo];
                  const uploaded = Boolean(itemStatus?.subido);

                  return (
                    <SettingsRow
                      key={tipo}
                      title={meta.titulo}
                      subtitle={
                        uploaded
                          ? `${meta.formato === "pdf" ? "Documento PDF" : "Fotografía"} guardado`
                          : meta.descripcion
                      }
                      icon={getDocumentIcon(tipo)}
                      iconBgColor={meta.color}
                      showDivider={index < section.items.length - 1}
                      rightElement={
                        uploaded ? (
                          <View
                            style={[
                              styles.donePill,
                              { backgroundColor: theme.successSoft },
                            ]}
                          >
                            <CheckCircle2 size={14} color={theme.success} />
                            <Text
                              style={[
                                styles.donePillText,
                                { color: theme.success },
                              ]}
                            >
                              Listo
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.formatTag,
                              { color: theme.textMuted },
                            ]}
                          >
                            {meta.formato === "pdf" ? "PDF" : "Cámara"}
                          </Text>
                        )
                      }
                      onPress={() => openDocumentSheet(tipo)}
                    />
                  );
                })}
              </SettingsGroup>
            ))}
          </>
        )}
      </ScrollView>

      <DocumentActionSheet
        tipo={selectedDoc}
        status={selectedDoc ? docs?.[selectedDoc] : null}
        uploading={mutations.upload.isPending}
        deleting={mutations.remove.isPending}
        error={mutations.upload.error || mutations.remove.error}
        onClose={closeSheet}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />
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
    paddingBottom: 130,
    gap: 20,
  },

  progressCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  progressCount: {
    fontSize: 14.5,
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

  progressCaption: {
    fontSize: 13,
    lineHeight: 18,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  skeletonSections: {
    width: "100%",
    gap: 16,
  },

  skeletonCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 14,
  },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  skeletonTextCol: {
    flex: 1,
    gap: 7,
  },

  customSection: {
    width: "100%",
    gap: 8,
  },

  customSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 14,
  },

  cvCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 16,
    gap: 14,
  },

  cvTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  cvIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  cvInfo: {
    flex: 1,
    gap: 3,
  },

  cvTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  cvSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  cvActionPill: {
    minHeight: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  cvActionText: {
    fontSize: 14,
    fontWeight: "700",
  },

  donePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  donePillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  formatTag: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.78,
  },
});
