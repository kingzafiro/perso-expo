import * as Haptics from "expo-haptics";
import { Check, Lock, UploadCloud, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import type { ApplicantDocumentItem } from "../types/applicant-profile.types";

interface RequestDocumentsModalProps {
  visible: boolean;
  candidateName: string;
  cvUploaded: boolean;
  documents: ApplicantDocumentItem[];
  preselectedDoc?: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { documentos: string[]; mensaje?: string }) => Promise<void>;
}

export function RequestDocumentsModal({
  visible,
  candidateName,
  cvUploaded,
  documents,
  preselectedDoc,
  submitting,
  onClose,
  onSubmit,
}: RequestDocumentsModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const [selected, setSelected] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!visible) return;
    setSelected(preselectedDoc ? [preselectedDoc] : []);
    setMensaje(
      "Hola, nos gustaría conocer más sobre tu perfil para continuar con tu proceso de selección. ¿Nos autorizas el acceso a estos documentos?",
    );
  }, [preselectedDoc, visible]);

  const selectableItems = [
    ...(!cvUploaded
      ? [
          {
            tipo: "cv",
            etiqueta: "Currículum (CV)",
            subido: false,
            autorizado: false,
          },
        ]
      : []),
    ...documents.filter((d) => !d.autorizado),
  ];

  const toggleDoc = (tipo: string) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setSelected((prev) =>
      prev.includes(tipo) ? prev.filter((item) => item !== tipo) : [...prev, tipo],
    );
  };

  const cardBg = isDark ? "#181513" : "#FFFFFF";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            { backgroundColor: cardBg, borderColor: theme.inputBorder },
          ]}
        >
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.inputBorder },
            ]}
          >
            <View style={styles.flexOne}>
              <Text style={[styles.title, { color: theme.text }]}>
                Solicitar documentos
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {candidateName} recibirá una notificación para autorizar o subir
                los archivos faltantes.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.inputBackground }]}
            >
              <X size={16} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Selecciona los documentos ({selected.length} seleccionados)
            </Text>

            {selectableItems.map((doc) => {
              const active = selected.includes(doc.tipo);
              return (
                <Pressable
                  key={doc.tipo}
                  onPress={() => toggleDoc(doc.tipo)}
                  style={[
                    styles.docRow,
                    {
                      backgroundColor: active
                        ? theme.primarySoft
                        : theme.inputBackground,
                      borderColor: active ? theme.primary : theme.inputBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: active ? theme.primary : "transparent",
                        borderColor: active ? theme.primary : theme.textMuted,
                      },
                    ]}
                  >
                    {active ? <Check size={12} color="#FFFFFF" /> : null}
                  </View>

                  <View style={styles.flexOne}>
                    <Text style={[styles.docLabel, { color: theme.text }]}>
                      {doc.etiqueta}
                    </Text>
                    <View style={styles.docMetaRow}>
                      {doc.subido ? (
                        <>
                          <Lock size={11} color="#34C759" />
                          <Text style={[styles.docMeta, { color: "#34C759" }]}>
                            Cargado · Pedir permiso de acceso
                          </Text>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={11} color={theme.primary} />
                          <Text
                            style={[styles.docMeta, { color: theme.primary }]}
                          >
                            Aún no cargado · Pedir que lo suba
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.messageBlock}>
              <Text
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                Mensaje para el candidato (opcional)
              </Text>
              <TextInput
                value={mensaje}
                onChangeText={setMensaje}
                multiline
                maxLength={500}
                placeholder="Explica brevemente para qué necesitas estos documentos..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
              />
            </View>
          </ScrollView>

          <View
            style={[styles.footer, { borderTopColor: theme.inputBorder }]}
          >
            <AppButton
              title={
                selected.length > 0
                  ? `Enviar solicitud (${selected.length})`
                  : "Selecciona al menos 1 documento"
              }
              disabled={selected.length === 0}
              loading={submitting}
              onPress={() =>
                void onSubmit({
                  documentos: selected,
                  mensaje: mensaje.trim() || undefined,
                })
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },

  dialog: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: "84%",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  listScroll: {
    maxHeight: 420,
  },

  listContent: {
    padding: 16,
    gap: 9,
  },

  sectionLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 2,
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  docLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  docMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },

  docMeta: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  messageBlock: {
    marginTop: 8,
    gap: 6,
  },

  messageInput: {
    minHeight: 84,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 13.5,
    textAlignVertical: "top",
  },

  footer: {
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
