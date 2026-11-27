import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import {
  contactStepSchema,
  type ContactStepForm,
} from "@/features/employer/schemas/employer.schemas";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";

function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string } | undefined;
    if (data?.mensaje) return data.mensaje;
  }
  return "No pudimos guardar tu perfil de empresa. Verifica tu conexión e intenta de nuevo.";
}

export default function EmployerContactStepScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const draft = useEmployerStore((state) => state.draft);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const updateDraft = useEmployerStore((state) => state.updateDraft);
  const saveProfileToServer = useEmployerStore(
    (state) => state.saveProfileToServer,
  );
  const [saving, setSaving] = useState(false);

  const defaultFullName = [user?.nombre, user?.apellido_paterno]
    .filter(Boolean)
    .join(" ")
    .trim();

  const { control, handleSubmit, watch } = useForm<ContactStepForm>({
    resolver: zodResolver(contactStepSchema),
    defaultValues: {
      contactName: draft.contactName || defaultFullName,
      contactRole: draft.contactRole,
      workEmail: draft.workEmail || user?.email || "",
      phone: draft.phone,
      description: draft.description,
    },
  });

  const values = watch();
  const descLength = values.description?.length ?? 0;
  const canSubmit =
    values.contactName.trim().length >= 2 &&
    values.contactRole.trim().length >= 2 &&
    values.workEmail.trim().includes("@") &&
    values.phone.trim().length === 10 &&
    values.description.trim().length >= 15;

  const onSubmit = async (data: ContactStepForm) => {
    setSaving(true);
    try {
      updateDraft(data);
      await saveProfileToServer();
      if (hasAccess) {
        router.replace("/(employer)/panel");
      } else {
        router.push("/(employer)/verificacion");
      }
    } catch (error) {
      Alert.alert("No se pudo guardar", extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthSheetLayout
      title="Perfil de reclutador"
      subtitle={`Datos de contacto para representar a ${draft.companyName || "tu empresa"}.`}
      showBackButton
      stepIndicator={{ current: 2, total: 4 }}
    >
      <View style={styles.form}>
        <FormInput
          control={control}
          name="contactName"
          label="Nombre del responsable"
          placeholder="Ej. Ana Martínez"
          autoCapitalize="words"
        />

        <FormInput
          control={control}
          name="contactRole"
          label="Puesto o cargo"
          placeholder="Ej. Gerente de Recursos Humanos"
          autoCapitalize="sentences"
        />

        <FormInput
          control={control}
          name="workEmail"
          label="Correo corporativo o de contacto"
          placeholder="talento@tuempresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormInput
          control={control}
          name="phone"
          label="Teléfono de contacto"
          placeholder="10 dígitos"
          keyboardType="phone-pad"
          maxLength={10}
          transformText={(text) => text.replace(/\D/g, "").slice(0, 10)}
        />

        <FormInput
          control={control}
          name="description"
          label="Sobre la empresa"
          placeholder="Cuéntale a los candidatos a qué se dedican y qué ofrecen..."
          multiline
          maxLength={300}
          textAlignVertical="top"
          style={styles.multiline}
        />
        <Text style={[styles.counter, { color: theme.textMuted }]}>
          {descLength} / 300 caracteres
        </Text>

        <View style={styles.ctaWrap}>
          <AppButton
            title={hasAccess ? "Guardar cambios" : "Continuar"}
            loading={saving}
            disabled={!canSubmit}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 15,
  },

  multiline: {
    minHeight: 108,
    paddingTop: 14,
    paddingBottom: 14,
  },

  counter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: -9,
  },

  ctaWrap: {
    marginTop: 6,
  },
});
