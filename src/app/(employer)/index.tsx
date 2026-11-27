import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { CityAutocompleteField } from "@/features/employer/components/CityAutocompleteField";
import {
  companyStepSchema,
  type CompanyStepForm,
} from "@/features/employer/schemas/employer.schemas";
import {
  EMPLOYER_INDUSTRIES,
  EMPLOYER_SIZES,
} from "@/features/employer/types/employer.types";
import { useTheme } from "@/hooks/use-theme";
import { useEmployerStore } from "@/stores/employer.store";

export default function EmployerCompanyStepScreen() {
  const theme = useTheme();
  const draft = useEmployerStore((state) => state.draft);
  const updateDraft = useEmployerStore((state) => state.updateDraft);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyStepForm>({
    resolver: zodResolver(companyStepSchema),
    defaultValues: {
      companyName: draft.companyName,
      industry: draft.industry,
      companySize: draft.companySize,
      city: draft.city,
    },
  });

  const values = watch();
  const canContinue =
    values.companyName.trim().length >= 2 &&
    values.industry.trim().length > 0 &&
    values.companySize.trim().length > 0 &&
    values.city.trim().length >= 2;

  const onSubmit = (data: CompanyStepForm) => {
    updateDraft({
      companyName: data.companyName,
      industry: data.industry,
      companySize: data.companySize,
      city: data.city,
    });
    router.push("/(employer)/contacto");
  };

  return (
    <AuthSheetLayout
      title="Crea tu perfil de empleador"
      subtitle="Presenta tu empresa de forma profesional ante los candidatos de Perso."
      showBackButton
      stepIndicator={{ current: 1, total: 4 }}
    >
      <View style={styles.form}>
        <FormInput
          control={control}
          name="companyName"
          label="Nombre comercial de la empresa"
          placeholder="Ej. Grupo Nova Tecnología"
          autoCapitalize="words"
        />

        <View style={styles.sectionBlock}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Sector o industria
          </Text>
          <View style={styles.chipsWrap}>
            {EMPLOYER_INDUSTRIES.map((sector) => {
              const selected = values.industry === sector;
              return (
                <Pressable
                  key={sector}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      void Haptics.selectionAsync();
                    }
                    setValue("industry", sector, { shouldValidate: true });
                  }}
                  style={[
                    styles.industryChip,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : theme.inputBackground,
                      borderColor: selected ? theme.primary : theme.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.industryChipText,
                      { color: selected ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {sector}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.industry?.message ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.industry.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Tamaño del equipo (colaboradores)
          </Text>
          <View style={styles.sizeRow}>
            {EMPLOYER_SIZES.map((size) => {
              const selected = values.companySize === size;
              return (
                <Pressable
                  key={size}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      void Haptics.selectionAsync();
                    }
                    setValue("companySize", size, { shouldValidate: true });
                  }}
                  style={[
                    styles.sizeChip,
                    {
                      backgroundColor: selected
                        ? theme.primarySoft
                        : theme.inputBackground,
                      borderColor: selected ? theme.primary : theme.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeChipText,
                      { color: selected ? theme.primary : theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.companySize?.message ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.companySize.message}
            </Text>
          ) : null}
        </View>

        <CityAutocompleteField
          label="Ciudad y estado principal"
          value={values.city}
          error={errors.city?.message}
          onSelectCity={(cityLabel) =>
            setValue("city", cityLabel, { shouldValidate: true })
          }
        />

        <View style={styles.ctaWrap}>
          <AppButton
            title="Continuar"
            disabled={!canContinue}
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
    gap: 16,
  },

  sectionBlock: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  industryChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },

  industryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  sizeRow: {
    flexDirection: "row",
    gap: 7,
  },

  sizeChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  sizeChipText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },

  ctaWrap: {
    marginTop: 6,
  },
});
