import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { ArrowLeft, MapPin, X } from "lucide-react-native";
import { type ComponentRef, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import {
  AppSelectField,
  type SelectOption,
} from "@/components/ui/AppSelectField";
import { FormInput } from "@/components/ui/FormInput";
import { CityAutocompleteField } from "@/features/employer/components/CityAutocompleteField";
import {
  SalaryInputSection,
  type SalaryMode,
} from "@/features/employer/components/SalaryInputSection";
import { SchedulePickerField } from "@/features/employer/components/SchedulePickerField";
import { VacancyBenefitsSelector } from "@/features/employer/components/VacancyBenefitsSelector";
import { VacancyDetailView } from "@/features/employer/components/VacancyDetailView";
import { VacancyStepIndicator } from "@/features/employer/components/VacancyStepIndicator";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import type { CreateVacancyInput } from "../api/employer.api";
import {
  createVacancySchema,
  type CreateVacancyForm,
} from "../schemas/employer.schemas";
import {
  VACANCY_CONTRACTS,
  VACANCY_MODALITIES,
  type EmployerProfile,
  type EmployerVacancy,
  type VacancyContractType,
  type VacancyModality,
  type VacancySalaryPeriod,
} from "../types/employer.types";

const TOTAL_STEPS = 4;

const STEP_TITLES: Record<number, string> = {
  1: "Puesto y ubicación",
  2: "Sueldo, horario y beneficios",
  3: "Descripción y perfil",
  4: "Revisar y publicar",
};

const EDUCATION_OPTIONS: SelectOption[] = [
  { value: "", label: "Sin requisito específico" },
  { value: "Secundaria", label: "Secundaria" },
  { value: "Preparatoria / Bachillerato", label: "Preparatoria / Bachillerato" },
  { value: "Técnico / TSU", label: "Técnico / TSU" },
  { value: "Licenciatura / Ingeniería", label: "Licenciatura / Ingeniería" },
  { value: "Posgrado / Maestría", label: "Posgrado / Maestría" },
];

const EXPERIENCE_OPTIONS: SelectOption[] = [
  { value: "", label: "Sin requisito específico" },
  { value: "Sin experiencia", label: "Sin experiencia" },
  { value: "Menos de 1 año", label: "Menos de 1 año" },
  { value: "1 a 2 años", label: "1 a 2 años" },
  { value: "2 a 3 años", label: "2 a 3 años" },
  { value: "3 a 5 años", label: "3 a 5 años" },
  { value: "Más de 5 años", label: "Más de 5 años" },
];

const MODALITY_OPTIONS: SelectOption<VacancyModality>[] = VACANCY_MODALITIES.map(
  (m) => ({ value: m.id, label: m.label }),
);

const CONTRACT_OPTIONS: SelectOption<VacancyContractType>[] =
  VACANCY_CONTRACTS.map((c) => ({ value: c.id, label: c.label }));

function inferSalaryMode(vacancy?: EmployerVacancy | null): SalaryMode {
  if (!vacancy) return "single";
  if (!vacancy.salario_min && !vacancy.salario_max) return "none";
  if (
    vacancy.salario_min &&
    vacancy.salario_max &&
    vacancy.salario_min !== vacancy.salario_max
  ) {
    return "range";
  }
  return "single";
}

interface CreateVacancyModalProps {
  visible: boolean;
  profile: EmployerProfile | null;
  editingVacancy?: EmployerVacancy | null;
  isAdmin?: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateVacancyInput) => Promise<void>;
}

export function CreateVacancyModal({
  visible,
  profile,
  editingVacancy,
  isAdmin = false,
  submitting,
  onClose,
  onSubmit,
}: CreateVacancyModalProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [step, setStep] = useState(1);
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [salaryMode, setSalaryMode] = useState<SalaryMode>("single");
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateVacancyForm>({
    resolver: zodResolver(createVacancySchema),
    defaultValues: {
      titulo: "",
      modalidad: "presencial",
      tipo_contrato: "tiempo_completo",
      ciudad: profile?.city ?? "",
      codigo_postal: "",
      zona_colonia: "",
      salario_min: "",
      salario_max: "",
      salario_periodo: "mensual",
      horario: "",
      experiencia: "",
      escolaridad: "",
      descripcion: "",
      responsabilidades: "",
      requisitos: "",
      perfil_tecnico: "",
      ofrecemos: "",
    },
  });

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setSalaryError(null);
    setScheduleError(null);

    if (editingVacancy) {
      setBeneficios(editingVacancy.beneficios ?? []);
      setSalaryMode(inferSalaryMode(editingVacancy));
      reset({
        titulo: editingVacancy.titulo,
        modalidad: editingVacancy.modalidad,
        tipo_contrato: editingVacancy.tipo_contrato,
        ciudad: editingVacancy.ciudad,
        codigo_postal: editingVacancy.codigo_postal ?? "",
        zona_colonia: editingVacancy.zona_colonia ?? "",
        salario_min: editingVacancy.salario_min
          ? String(editingVacancy.salario_min)
          : "",
        salario_max: editingVacancy.salario_max
          ? String(editingVacancy.salario_max)
          : "",
        salario_periodo: editingVacancy.salario_periodo ?? "mensual",
        horario: editingVacancy.horario ?? "",
        experiencia: editingVacancy.experiencia ?? "",
        escolaridad: editingVacancy.escolaridad ?? "",
        descripcion: editingVacancy.descripcion,
        responsabilidades: editingVacancy.responsabilidades ?? "",
        requisitos: editingVacancy.requisitos ?? "",
        perfil_tecnico: editingVacancy.perfil_tecnico ?? "",
        ofrecemos: editingVacancy.ofrecemos ?? "",
      });
    } else {
      setBeneficios(["Prestaciones de ley"]);
      setSalaryMode("single");
      reset({
        titulo: "",
        modalidad: "presencial",
        tipo_contrato: "tiempo_completo",
        ciudad: profile?.city ?? "",
        codigo_postal: "",
        zona_colonia: "",
        salario_min: "",
        salario_max: "",
        salario_periodo: "mensual",
        horario: "",
        experiencia: "",
        escolaridad: "",
        descripcion: "",
        responsabilidades: "",
        requisitos: "",
        perfil_tecnico: "",
        ofrecemos: "",
      });
    }
  }, [editingVacancy, profile?.city, reset, visible]);

  const values = watch();

  const goToStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
  };

  const validateStepAndContinue = async () => {
    if (step === 1) {
      const ok = await trigger([
        "titulo",
        "ciudad",
        "modalidad",
        "tipo_contrato",
      ]);
      if (!ok) return;
      goToStep(2);
      return;
    }

    if (step === 2) {
      setSalaryError(null);

      if (salaryMode === "range") {
        const min = values.salario_min ? Number(values.salario_min) : null;
        const max = values.salario_max ? Number(values.salario_max) : null;
        if (min !== null && max !== null && max < min) {
          setSalaryError("El sueldo máximo debe ser mayor o igual al mínimo.");
          return;
        }
      }

      if (scheduleError) {
        return;
      }

      goToStep(3);
      return;
    }

    if (step === 3) {
      const ok = await trigger(["descripcion"]);
      if (!ok) return;
      goToStep(4);
    }
  };

  const buildFinalSalary = () => {
    if (salaryMode === "none") {
      return { min: null, max: null };
    }
    const min = values.salario_min ? Number(values.salario_min) : null;
    if (salaryMode === "single") {
      return { min, max: min };
    }
    const max = values.salario_max ? Number(values.salario_max) : null;
    return { min, max };
  };

  const handleFormSubmit = async (data: CreateVacancyForm) => {
    const { min, max } = buildFinalSalary();

    await onSubmit({
      titulo: data.titulo.trim(),
      modalidad: data.modalidad,
      tipo_contrato: data.tipo_contrato,
      ciudad: data.ciudad.trim(),
      codigo_postal: data.codigo_postal?.trim() || undefined,
      zona_colonia: data.zona_colonia?.trim() || undefined,
      salario_min: min,
      salario_max: max,
      salario_periodo: data.salario_periodo,
      horario: data.horario?.trim() || undefined,
      experiencia: data.experiencia?.trim() || undefined,
      escolaridad: data.escolaridad?.trim() || undefined,
      beneficios,
      descripcion: data.descripcion.trim(),
      responsabilidades: data.responsabilidades?.trim() || undefined,
      requisitos: data.requisitos?.trim() || undefined,
      perfil_tecnico: data.perfil_tecnico?.trim() || undefined,
      ofrecemos: data.ofrecemos?.trim() || undefined,
    });
  };

  const salaryForPreview = buildFinalSalary();
  const previewVacancy: EmployerVacancy = {
    id_vacante: editingVacancy?.id_vacante ?? 0,
    id_empresa: profile?.id_empresa ?? 0,
    titulo: values.titulo.trim() || "Título del puesto",
    modalidad: values.modalidad,
    tipo_contrato: values.tipo_contrato,
    ciudad: values.ciudad.trim() || profile?.city || "Ciudad, Estado",
    codigo_postal: values.codigo_postal?.trim() || "",
    zona_colonia: values.zona_colonia?.trim() || "",
    salario_min: salaryForPreview.min,
    salario_max: salaryForPreview.max,
    salario_periodo: values.salario_periodo,
    horario: values.horario?.trim() || "",
    experiencia: values.experiencia?.trim() || "",
    escolaridad: values.escolaridad?.trim() || "",
    beneficios,
    descripcion: values.descripcion.trim(),
    responsabilidades: values.responsabilidades?.trim() || "",
    requisitos: values.requisitos?.trim() || "",
    perfil_tecnico: values.perfil_tecnico?.trim() || "",
    ofrecemos: values.ofrecemos?.trim() || "",
    contacto_visible: [profile?.contactName, profile?.contactRole]
      .filter(Boolean)
      .join(" · "),
    estado: "activa",
    postulantes_count: 0,
    empresa: {
      id_empresa: profile?.id_empresa ?? 0,
      nombre_comercial: profile?.companyName || "Tu empresa",
      industria: profile?.industry || "",
      ciudad: profile?.city || "",
      verificada: Boolean(profile?.verified),
    },
    createdAt: null,
    updatedAt: null,
  };

  const sheetBg = isDark ? "#12100E" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.08)";

  const locationBadges = [values.zona_colonia, values.codigo_postal]
    .map((p) => (p || "").trim())
    .filter(Boolean);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.container, { backgroundColor: sheetBg }]}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16),
              borderBottomColor: theme.inputBorder,
            },
          ]}
        >
          {step > 1 ? (
            <Pressable
              onPress={() => goToStep(step - 1)}
              style={[
                styles.iconBtn,
                { backgroundColor: theme.inputBackground },
              ]}
              accessibilityLabel="Paso anterior"
            >
              <ArrowLeft size={18} color={theme.text} />
            </Pressable>
          ) : (
            <View style={styles.iconSpacer} />
          )}

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {editingVacancy ? "Editar vacante" : "Publicar vacante"}
          </Text>

          <Pressable
            onPress={onClose}
            style={[styles.iconBtn, { backgroundColor: theme.inputBackground }]}
            accessibilityLabel="Cerrar"
          >
            <X size={18} color={theme.text} />
          </Pressable>
        </View>

        <VacancyStepIndicator
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          stepTitle={STEP_TITLES[step]}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 24, 36) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            <View
              style={[
                styles.stepCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <FormInput
                control={control}
                name="titulo"
                label="Título del puesto"
                placeholder="Ej. Programador Jr / Auxiliar Contable"
                autoCapitalize="sentences"
              />

              <CityAutocompleteField
                label="Ubicación del empleo"
                placeholder="Busca ciudad, colonia o código postal..."
                searchMode="all"
                value={values.ciudad}
                error={errors.ciudad?.message}
                onSelectCity={(cityLabel) =>
                  setValue("ciudad", cityLabel, { shouldValidate: true })
                }
                onSelectLocationDetails={({ city, postalCode, neighborhood }) => {
                  setValue("ciudad", city, { shouldValidate: true });
                  setValue("codigo_postal", postalCode);
                  setValue("zona_colonia", neighborhood);
                }}
              />

              {locationBadges.length > 0 ? (
                <View
                  style={[
                    styles.detectedLocationBox,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}
                >
                  <MapPin size={14} color={theme.primary} />
                  <Text
                    style={[
                      styles.detectedLocationText,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    Zona detectada: {locationBadges.join(" · C.P. ")}
                  </Text>
                </View>
              ) : null}

              <AppSelectField
                label="Modalidad de trabajo"
                value={values.modalidad}
                options={MODALITY_OPTIONS}
                error={errors.modalidad?.message}
                onChange={(next) =>
                  setValue("modalidad", next, { shouldValidate: true })
                }
              />

              <AppSelectField
                label="Tipo de contrato"
                value={values.tipo_contrato}
                options={CONTRACT_OPTIONS}
                error={errors.tipo_contrato?.message}
                onChange={(next) =>
                  setValue("tipo_contrato", next, { shouldValidate: true })
                }
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View
              style={[
                styles.stepCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <SalaryInputSection
                mode={salaryMode}
                minValue={values.salario_min ?? ""}
                maxValue={values.salario_max ?? ""}
                period={values.salario_periodo as VacancySalaryPeriod}
                error={salaryError ?? errors.salario_max?.message}
                onModeChange={(nextMode) => {
                  setSalaryMode(nextMode);
                  setSalaryError(null);
                  if (nextMode === "none") {
                    setValue("salario_min", "");
                    setValue("salario_max", "");
                  } else if (nextMode === "single") {
                    setValue("salario_max", "");
                  }
                }}
                onMinChange={(val) => {
                  setSalaryError(null);
                  setValue("salario_min", val);
                }}
                onMaxChange={(val) => {
                  setSalaryError(null);
                  setValue("salario_max", val);
                }}
                onPeriodChange={(nextPeriod) =>
                  setValue("salario_periodo", nextPeriod)
                }
              />

              <SchedulePickerField
                value={values.horario ?? ""}
                onChange={(formatted) => setValue("horario", formatted)}
                onValidationChange={setScheduleError}
              />

              <VacancyBenefitsSelector
                value={beneficios}
                onChange={setBeneficios}
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View
              style={[
                styles.stepCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <FormInput
                control={control}
                name="descripcion"
                label="Descripción del puesto"
                placeholder="Explica el objetivo del puesto, el equipo al que se integrará y qué hace tu empresa..."
                multiline
                textAlignVertical="top"
                style={styles.multiline}
              />

              <FormInput
                control={control}
                name="responsabilidades"
                label="Principales responsabilidades (una por línea, opcional)"
                placeholder={"Desarrollar módulos y pantallas nuevas\nDar soporte técnico y mantenimiento\nDocumentar procesos"}
                multiline
                textAlignVertical="top"
                style={styles.multiline}
              />

              <AppSelectField
                label="Escolaridad requerida (opcional)"
                placeholder="Sin requisito específico"
                value={values.escolaridad ?? ""}
                options={EDUCATION_OPTIONS}
                onChange={(val) => setValue("escolaridad", val)}
              />

              <AppSelectField
                label="Experiencia requerida (opcional)"
                placeholder="Sin requisito específico"
                value={values.experiencia ?? ""}
                options={EXPERIENCE_OPTIONS}
                onChange={(val) => setValue("experiencia", val)}
              />

              <FormInput
                control={control}
                name="requisitos"
                label="Perfil del candidato y requisitos (opcional)"
                placeholder={"Licenciatura o carrera técnica afín\nDisponibilidad de horario\nTrabajo en equipo"}
                multiline
                textAlignVertical="top"
                style={styles.multilineSmall}
              />

              <FormInput
                control={control}
                name="perfil_tecnico"
                label="Conocimientos técnicos y herramientas (opcional)"
                placeholder={"JavaScript, SQL, Git, Excel avanzado..."}
                multiline
                textAlignVertical="top"
                style={styles.multilineSmall}
              />

              <FormInput
                control={control}
                name="ofrecemos"
                label="¿Qué ofrecemos? (opcional)"
                placeholder={"Pagos puntuales\nCapacitación continua y plan de carrera"}
                multiline
                textAlignVertical="top"
                style={styles.multilineSmall}
              />
            </View>
          ) : null}

          {step === 4 ? (
            <>
              <View
                style={[
                  styles.reviewNotice,
                  {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.primaryBorder,
                  },
                ]}
              >
                <Text style={[styles.reviewNoticeText, { color: theme.primary }]}>
                  Así verán tu publicación los candidatos en Perso. Revisa los
                  datos antes de publicar.
                </Text>
              </View>

              <VacancyDetailView
                vacancy={previewVacancy}
                mode="preview"
                showAdminMeta={isAdmin}
              />
            </>
          ) : null}
        </ScrollView>

        {/* Barra inferior fija de navegación por pasos */}
        <View
          style={[
            styles.footerBar,
            {
              backgroundColor: cardBg,
              borderTopColor: theme.inputBorder,
              paddingBottom: Math.max(insets.bottom + 10, 18),
            },
          ]}
        >
          {step < TOTAL_STEPS ? (
            <AppButton
              title={step === 3 ? "Revisar publicación" : "Continuar"}
              onPress={() => void validateStepAndContinue()}
            />
          ) : (
            <AppButton
              title={editingVacancy ? "Guardar cambios" : "Publicar vacante"}
              loading={submitting}
              onPress={handleSubmit(handleFormSubmit)}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  iconSpacer: {
    width: 36,
    height: 36,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 14,
  },

  stepCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 15,
  },

  detectedLocationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },

  detectedLocationText: {
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1,
  },

  multiline: {
    minHeight: 108,
    paddingTop: 12,
    paddingBottom: 12,
  },

  multilineSmall: {
    minHeight: 84,
    paddingTop: 12,
    paddingBottom: 12,
  },

  reviewNotice: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },

  reviewNoticeText: {
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },

  footerBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
