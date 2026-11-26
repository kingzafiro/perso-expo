import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";

const contactStepSchema = z.object({
  contactName: z.string().trim().min(2, "Ingresa el nombre del responsable"),
  contactRole: z.string().trim().min(2, "Indica tu puesto o cargo"),
  workEmail: z.string().trim().email("Ingresa un correo electrónico válido"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "El teléfono debe contener 10 dígitos"),
  description: z
    .string()
    .trim()
    .min(15, "Describe brevemente tu empresa (mínimo 15 caracteres)")
    .max(300, "Máximo 300 caracteres"),
});

type ContactStepForm = z.infer<typeof contactStepSchema>;

export default function EmployerContactStepScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const draft = useEmployerStore((state) => state.draft);
  const updateDraft = useEmployerStore((state) => state.updateDraft);

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

  const onSubmit = (data: ContactStepForm) => {
    updateDraft(data);
    router.push("/(employer)/planes");
  };

  return (
    <AuthSheetLayout
      title="Perfil de reclutador"
      subtitle={`Datos de contacto para representar a ${draft.companyName || "tu empresa"}.`}
      showBackButton
      stepIndicator={{ current: 2, total: 3 }}
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
            title="Finalizar registro"
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
