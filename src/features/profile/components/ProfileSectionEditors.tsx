import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import { Calendar, ChevronDown, Clock, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import {
  ENGLISH_LEVELS,
  SUGGESTED_JOB_INTERESTS,
  type ProfileEmpleo,
  type ProfileExperienciaYear,
  type ProfileInformacion,
  type ProfileUser,
} from "@/features/profile/types/profile.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

function extractErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorResponse> | null;
  return axiosError?.response?.data?.mensaje ?? fallback;
}

function ErrorBanner({ message }: { message: string | null }) {
  const theme = useTheme();
  if (!message) return null;

  return (
    <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
      <Text style={[styles.errorText, { color: theme.error }]}>{message}</Text>
    </View>
  );
}

/* ===========================
   1. Datos personales
   =========================== */
const personalSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa al menos 2 caracteres"),
  apellido_paterno: z.string().trim().optional(),
  apellido_materno: z.string().trim().optional(),
  celular: z
    .string()
    .trim()
    .refine(
      (v) => v.length === 0 || /^\d{10,15}$/.test(v),
      "Ingresa un número válido (10 a 15 dígitos)",
    )
    .optional(),
});

type PersonalForm = z.infer<typeof personalSchema>;

export function PersonalInfoEditor({
  user,
  loading,
  error,
  onSave,
}: {
  user?: ProfileUser | null;
  loading: boolean;
  error: unknown;
  onSave: (data: PersonalForm) => void;
}) {
  const initialNombre = (user?.nombre ?? "").trim();
  const initialApellidoP = (user?.apellido_paterno ?? "").trim();
  const initialApellidoM = (user?.apellido_materno ?? "").trim();
  const initialCelular = (user?.celular ?? "").trim();

  const { control, handleSubmit, watch } = useForm<PersonalForm>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      nombre: user?.nombre ?? "",
      apellido_paterno: user?.apellido_paterno ?? "",
      apellido_materno: user?.apellido_materno ?? "",
      celular: user?.celular ?? "",
    },
  });

  const values = watch();
  const hasChanges =
    (values.nombre ?? "").trim() !== initialNombre ||
    (values.apellido_paterno ?? "").trim() !== initialApellidoP ||
    (values.apellido_materno ?? "").trim() !== initialApellidoM ||
    (values.celular ?? "").trim() !== initialCelular;

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="nombre"
        label="Nombre"
        placeholder="Tu nombre"
        autoCapitalize="words"
      />
      <FormInput
        control={control}
        name="apellido_paterno"
        label="Apellido paterno"
        placeholder="Ej. Ramírez"
        autoCapitalize="words"
      />
      <FormInput
        control={control}
        name="apellido_materno"
        label="Apellido materno"
        placeholder="Ej. López"
        autoCapitalize="words"
      />
      <FormInput
        control={control}
        name="celular"
        label="Celular (opcional)"
        placeholder="10 dígitos"
        keyboardType="phone-pad"
        maxLength={15}
        transformText={(text) => text.replace(/\D/g, "")}
      />

      <ErrorBanner
        message={
          error
            ? extractErrorMessage(error, "No se pudieron guardar tus datos.")
            : null
        }
      />

      <AppButton
        title="Guardar datos"
        loading={loading}
        disabled={!hasChanges}
        onPress={handleSubmit(onSave)}
      />
    </View>
  );
}

/* ===========================
   2. Sobre mí / Historia
   =========================== */
const bioSchema = z.object({
  historia: z
    .string()
    .trim()
    .min(1, "Cuéntanos brevemente sobre ti")
    .max(500, "Máximo 500 caracteres"),
});

type BioForm = z.infer<typeof bioSchema>;

export function BioEditor({
  initialValue,
  loading,
  error,
  onSave,
}: {
  initialValue?: string;
  loading: boolean;
  error: unknown;
  onSave: (historia: string) => void;
}) {
  const theme = useTheme();
  const initialClean = (initialValue ?? "").trim();

  const { control, handleSubmit, watch } = useForm<BioForm>({
    resolver: zodResolver(bioSchema),
    defaultValues: { historia: initialValue ?? "" },
  });

  const currentValue = watch("historia") ?? "";
  const currentLength = currentValue.length;
  const hasChanges =
    currentValue.trim().length > 0 && currentValue.trim() !== initialClean;

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="historia"
        label="Tu historia"
        placeholder="Resume tu trayectoria, fortalezas y lo que buscas profesionalmente..."
        multiline
        maxLength={500}
        textAlignVertical="top"
        style={styles.multilineInput}
      />

      <Text style={[styles.counter, { color: theme.textMuted }]}>
        {currentLength} / 500 caracteres
      </Text>

      <ErrorBanner
        message={
          error
            ? extractErrorMessage(error, "No se pudo guardar tu historia.")
            : null
        }
      />

      <AppButton
        title="Guardar historia"
        loading={loading}
        disabled={!hasChanges}
        onPress={handleSubmit((data) => onSave(data.historia))}
      />
    </View>
  );
}

/* ===========================
   3. Dirección (con Mapa + Google Places) y Universidad (ROR)
   =========================== */
export { AddressEditor } from "@/features/profile/components/AddressEditor";
export { UniversityEditor } from "@/features/profile/components/UniversityEditor";

/* ===========================
   4. Título / Campo simple
   =========================== */
const singleFieldSchema = z.object({
  valor: z.string().trim().min(1, "Este campo es obligatorio"),
});

type SingleFieldForm = z.infer<typeof singleFieldSchema>;

export function SingleFieldEditor({
  label,
  placeholder,
  buttonTitle,
  initialValue,
  loading,
  error,
  onSave,
}: {
  label: string;
  placeholder: string;
  buttonTitle: string;
  initialValue?: string;
  loading: boolean;
  error: unknown;
  onSave: (valor: string) => void;
}) {
  const initialClean = (initialValue ?? "").trim();

  const { control, handleSubmit, watch } = useForm<SingleFieldForm>({
    resolver: zodResolver(singleFieldSchema),
    defaultValues: { valor: initialValue ?? "" },
  });

  const currentValue = (watch("valor") ?? "").trim();
  const hasChanges = currentValue.length > 0 && currentValue !== initialClean;

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="valor"
        label={label}
        placeholder={placeholder}
        autoCapitalize="words"
      />

      <ErrorBanner
        message={
          error ? extractErrorMessage(error, "No se pudo guardar el dato.") : null
        }
      />

      <AppButton
        title={buttonTitle}
        loading={loading}
        disabled={!hasChanges}
        onPress={handleSubmit((data) => onSave(data.valor))}
      />
    </View>
  );
}

/* ===========================
   5. Nivel de Inglés (grid fijo 3x2 sin saltos de tamaño)
   =========================== */
export function EnglishEditor({
  initialValue,
  loading,
  error,
  onSave,
}: {
  initialValue?: ProfileInformacion | null;
  loading: boolean;
  error: unknown;
  onSave: (payload: { ingles: string; certificado: boolean }) => void;
}) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const initialCode = initialValue?.inglesCodigo || "";
  const initialCert = Boolean(initialValue?.certificado);

  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [certificado, setCertificado] = useState(initialCert);

  const trackFalse = isDark ? "#3A3633" : "#D6D1CC";
  const hasChanges =
    selectedCode.length > 0 &&
    (selectedCode !== initialCode || certificado !== initialCert);

  const rows = [ENGLISH_LEVELS.slice(0, 3), ENGLISH_LEVELS.slice(3, 6)];

  return (
    <View style={styles.form}>
      <View style={styles.englishRows}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.englishRow}>
            {row.map((level) => {
              const active = selectedCode === level.code;
              return (
                <Pressable
                  key={level.code}
                  onPress={async () => {
                    if (Platform.OS !== "web") {
                      await Haptics.selectionAsync();
                    }
                    setSelectedCode(level.code);
                  }}
                  style={[
                    styles.englishChip,
                    {
                      backgroundColor: active
                        ? theme.primarySoft
                        : theme.inputBackground,
                      borderColor: active ? theme.primary : theme.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.englishCode,
                      { color: active ? theme.primary : theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {level.label}
                  </Text>
                  <Text
                    style={[styles.englishDesc, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {level.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View
        style={[
          styles.switchRow,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        <View style={styles.flexOne}>
          <Text style={[styles.switchTitle, { color: theme.text }]}>
            ¿Cuentas con certificado?
          </Text>
          <Text style={[styles.switchSub, { color: theme.textSecondary }]}>
            TOEFL, IELTS, Cambridge u otro aval oficial
          </Text>
        </View>
        <Switch
          value={certificado}
          onValueChange={setCertificado}
          trackColor={{ false: trackFalse, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <ErrorBanner
        message={
          error
            ? extractErrorMessage(error, "No se pudo guardar tu nivel de inglés.")
            : null
        }
      />

      <AppButton
        title="Guardar nivel de inglés"
        loading={loading}
        disabled={!hasChanges}
        onPress={() => onSave({ ingles: selectedCode, certificado })}
      />
    </View>
  );
}

/* ===========================
   6. Empleos de interés
   =========================== */
const jobInterestsSchema = z.object({
  empleos: z.string().trim().min(1, "Ingresa al menos un empleo o área"),
});

type JobInterestsForm = z.infer<typeof jobInterestsSchema>;

function normalizeTagsString(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(", ");
}

export function JobInterestsEditor({
  initialValue,
  loading,
  error,
  onSave,
}: {
  initialValue?: string;
  loading: boolean;
  error: unknown;
  onSave: (empleos: string) => void;
}) {
  const theme = useTheme();
  const initialNormalized = normalizeTagsString(initialValue);

  const { control, handleSubmit, watch, setValue } = useForm<JobInterestsForm>({
    resolver: zodResolver(jobInterestsSchema),
    defaultValues: { empleos: initialValue ?? "" },
  });

  const currentText = watch("empleos") ?? "";
  const currentNormalized = normalizeTagsString(currentText);
  const currentTags = currentNormalized ? currentNormalized.split(", ") : [];
  const hasChanges =
    currentNormalized.length > 0 && currentNormalized !== initialNormalized;

  const toggleTag = async (tag: string) => {
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }

    const exists = currentTags.some(
      (item) => item.toLowerCase() === tag.toLowerCase(),
    );
    const nextTags = exists
      ? currentTags.filter((item) => item.toLowerCase() !== tag.toLowerCase())
      : [...currentTags, tag];

    setValue("empleos", nextTags.join(", "), { shouldValidate: true });
  };

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="empleos"
        label="Áreas o puestos que te interesan"
        placeholder="Ej. Tecnología, Diseño, Ventas"
      />

      <View style={styles.tagCloud}>
        {SUGGESTED_JOB_INTERESTS.map((tag) => {
          const selected = currentTags.some(
            (item) => item.toLowerCase() === tag.toLowerCase(),
          );
          return (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[
                styles.selectableTag,
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
                  styles.selectableTagText,
                  { color: selected ? "#FFFFFF" : theme.text },
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ErrorBanner
        message={
          error
            ? extractErrorMessage(error, "No se pudieron guardar tus intereses.")
            : null
        }
      />

      <AppButton
        title="Guardar intereses"
        loading={loading}
        disabled={!hasChanges}
        onPress={handleSubmit((data) => onSave(data.empleos))}
      />
    </View>
  );
}

/* ===========================
   7. Último empleo
   =========================== */
const JOB_TENURE_OPTIONS = [
  "1 año",
  "2 años",
  "3 años",
  "4 años",
  "5 años",
  "6 años",
  "7 años",
  "8 años",
  "9 años",
  "10 años",
  "11 años",
  "12 años",
  "13 años",
  "14 años",
  "15+ años",
] as const;

const lastJobSchema = z.object({
  empresa: z.string().trim().min(1, "La empresa es obligatoria"),
  puesto: z.string().trim().min(1, "El puesto es obligatorio"),
  tiempo: z.string().trim().min(1, "Selecciona el tiempo laborado"),
  telefono: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "El teléfono debe tener 10 dígitos"),
});

type LastJobForm = z.infer<typeof lastJobSchema>;

export function LastJobEditor({
  initialValue,
  loading,
  error,
  onSave,
}: {
  initialValue?: ProfileEmpleo | null;
  loading: boolean;
  error: unknown;
  onSave: (data: LastJobForm) => void;
}) {
  const theme = useTheme();
  const [tenureOpen, setTenureOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LastJobForm>({
    resolver: zodResolver(lastJobSchema),
    defaultValues: {
      empresa: initialValue?.empresa ?? "",
      puesto: initialValue?.puesto ?? "",
      tiempo: initialValue?.tiempo ?? "",
      telefono: initialValue?.telefono ?? "",
    },
  });

  const values = watch();
  const selectedTenure = (values.tiempo ?? "").trim();
  const hasChanges =
    (values.empresa ?? "").trim() !== (initialValue?.empresa ?? "").trim() ||
    (values.puesto ?? "").trim() !== (initialValue?.puesto ?? "").trim() ||
    selectedTenure !== (initialValue?.tiempo ?? "").trim() ||
    (values.telefono ?? "").trim() !== (initialValue?.telefono ?? "").trim();

  const handleToggleTenure = () => {
    Keyboard.dismiss();
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setTenureOpen((prev) => !prev);
  };

  const handleSelectTenure = (option: string) => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setValue("tiempo", option, { shouldValidate: true, shouldDirty: true });
    setTenureOpen(false);
  };

  const tenureRows = [
    JOB_TENURE_OPTIONS.slice(0, 3),
    JOB_TENURE_OPTIONS.slice(3, 6),
    JOB_TENURE_OPTIONS.slice(6, 9),
    JOB_TENURE_OPTIONS.slice(9, 12),
    JOB_TENURE_OPTIONS.slice(12, 15),
  ];

  return (
    <View style={styles.form}>
      <FormInput
        control={control}
        name="empresa"
        label="Empresa"
        placeholder="Nombre de la empresa"
        autoCapitalize="words"
      />
      <FormInput
        control={control}
        name="puesto"
        label="Puesto desempeñado"
        placeholder="Ej. Analista de operaciones"
        autoCapitalize="sentences"
      />

      <View>
        <Text style={[styles.selectLabel, { color: theme.textSecondary }]}>
          Tiempo laborado
        </Text>
        <Pressable
          onPress={handleToggleTenure}
          style={[
            styles.selectTrigger,
            {
              backgroundColor: theme.inputBackground,
              borderColor: errors.tiempo
                ? theme.errorBorder
                : tenureOpen
                  ? theme.primary
                  : theme.inputBorder,
            },
          ]}
        >
          <Clock
            size={16}
            color={selectedTenure ? theme.primary : theme.textMuted}
          />
          <Text
            style={[
              styles.selectValue,
              { color: selectedTenure ? theme.text : theme.textMuted },
            ]}
          >
            {selectedTenure || "Seleccionar años"}
          </Text>
          <ChevronDown
            size={16}
            color={theme.textMuted}
            style={tenureOpen ? styles.chevronRotated : undefined}
          />
        </Pressable>
        {errors.tiempo?.message && (
          <Text style={[styles.fieldError, { color: theme.error }]}>
            {errors.tiempo.message}
          </Text>
        )}
      </View>

      {tenureOpen && (
        <View
          style={[
            styles.yearPickerCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View
            style={[
              styles.yearPickerHeader,
              { borderBottomColor: theme.divider },
            ]}
          >
            <Text style={[styles.yearPickerTitle, { color: theme.textMuted }]}>
              Elige los años laborados
            </Text>
          </View>
          <View style={styles.tenureGrid}>
            {tenureRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tenureRow}>
                {row.map((option) => {
                  const active = selectedTenure === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => handleSelectTenure(option)}
                      style={[
                        styles.tenureCell,
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
                          styles.tenureCellText,
                          { color: active ? "#FFFFFF" : theme.text },
                        ]}
                        numberOfLines={1}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      )}

      <FormInput
        control={control}
        name="telefono"
        label="Teléfono de referencia"
        placeholder="10 dígitos"
        keyboardType="phone-pad"
        maxLength={10}
        transformText={(text) => text.replace(/\D/g, "").slice(0, 10)}
      />

      <ErrorBanner
        message={
          error
            ? extractErrorMessage(error, "No se pudo guardar tu último empleo.")
            : null
        }
      />

      <AppButton
        title="Guardar empleo"
        loading={loading}
        disabled={!hasChanges}
        onPress={handleSubmit(onSave)}
      />
    </View>
  );
}

/* ===========================
   8. Experiencia por años (Selector de años sin años futuros)
   =========================== */
const CURRENT_YEAR = new Date().getFullYear();
const MIN_EXPERIENCE_YEAR = CURRENT_YEAR - 60;

const experienceSchema = z
  .object({
    year_one: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Selecciona el año de inicio")
      .refine(
        (v) => Number(v) >= MIN_EXPERIENCE_YEAR && Number(v) <= CURRENT_YEAR,
        `El año no puede ser mayor a ${CURRENT_YEAR}`,
      ),
    year_two: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Selecciona el año de fin")
      .refine(
        (v) => Number(v) >= MIN_EXPERIENCE_YEAR && Number(v) <= CURRENT_YEAR,
        `El año no puede ser mayor a ${CURRENT_YEAR}`,
      ),
    experiencia: z
      .string()
      .trim()
      .min(1, "Describe tu experiencia")
      .max(200, "Máximo 200 caracteres"),
  })
  .refine((data) => Number(data.year_two) >= Number(data.year_one), {
    message: "El año final no puede ser menor al inicial",
    path: ["year_two"],
  });

type ExperienceForm = z.infer<typeof experienceSchema>;

export function ExperienceYearEditor({
  initialValue,
  loading,
  deleting,
  error,
  onSave,
  onDelete,
}: {
  initialValue?: ProfileExperienciaYear | null;
  loading: boolean;
  deleting?: boolean;
  error: unknown;
  onSave: (data: ExperienceForm) => void;
  onDelete?: () => void;
}) {
  const theme = useTheme();
  const [openPicker, setOpenPicker] = useState<"year_one" | "year_two" | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExperienceForm>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      year_one: initialValue?.year_one ?? "",
      year_two: initialValue?.year_two ?? "",
      experiencia: initialValue?.experiencia ?? "",
    },
  });

  const yearOne = watch("year_one") ?? "";
  const yearTwo = watch("year_two") ?? "";
  const experiencia = watch("experiencia") ?? "";

  const availableYears = useMemo(() => {
    const startYear =
      openPicker === "year_two" && /^\d{4}$/.test(yearOne)
        ? Math.max(MIN_EXPERIENCE_YEAR, Number(yearOne))
        : MIN_EXPERIENCE_YEAR;

    const list: string[] = [];
    for (let y = CURRENT_YEAR; y >= startYear; y -= 1) {
      list.push(String(y));
    }
    return list;
  }, [openPicker, yearOne]);

  const hasChanges = initialValue
    ? yearOne !== (initialValue.year_one ?? "") ||
      yearTwo !== (initialValue.year_two ?? "") ||
      experiencia.trim() !== (initialValue.experiencia ?? "").trim()
    : yearOne.length === 4 &&
      yearTwo.length === 4 &&
      experiencia.trim().length > 0;

  const togglePicker = async (field: "year_one" | "year_two") => {
    Keyboard.dismiss();
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }
    setOpenPicker((prev) => (prev === field ? null : field));
  };

  const handleSelectYear = async (year: string) => {
    if (!openPicker) return;
    if (Platform.OS !== "web") {
      await Haptics.selectionAsync();
    }

    setValue(openPicker, year, { shouldValidate: true, shouldDirty: true });

    if (
      openPicker === "year_one" &&
      yearTwo &&
      Number(yearTwo) < Number(year)
    ) {
      setValue("year_two", year, { shouldValidate: true, shouldDirty: true });
    }

    setOpenPicker(null);
  };

  const confirmDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      "Eliminar experiencia",
      "¿Seguro que quieres quitar esta experiencia de tu perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <View style={styles.form}>
      <View style={styles.rowTwo}>
        <View style={styles.flexOne}>
          <Text style={[styles.selectLabel, { color: theme.textSecondary }]}>
            Año inicio
          </Text>
          <Pressable
            onPress={() => togglePicker("year_one")}
            style={[
              styles.selectTrigger,
              {
                backgroundColor: theme.inputBackground,
                borderColor: errors.year_one
                  ? theme.errorBorder
                  : openPicker === "year_one"
                    ? theme.primary
                    : theme.inputBorder,
              },
            ]}
          >
            <Calendar
              size={16}
              color={yearOne ? theme.primary : theme.textMuted}
            />
            <Text
              style={[
                styles.selectValue,
                { color: yearOne ? theme.text : theme.textMuted },
              ]}
            >
              {yearOne || "Elegir"}
            </Text>
            <ChevronDown
              size={16}
              color={theme.textMuted}
              style={
                openPicker === "year_one" ? styles.chevronRotated : undefined
              }
            />
          </Pressable>
          {errors.year_one?.message && (
            <Text style={[styles.fieldError, { color: theme.error }]}>
              {errors.year_one.message}
            </Text>
          )}
        </View>

        <View style={styles.flexOne}>
          <Text style={[styles.selectLabel, { color: theme.textSecondary }]}>
            Año fin
          </Text>
          <Pressable
            onPress={() => togglePicker("year_two")}
            style={[
              styles.selectTrigger,
              {
                backgroundColor: theme.inputBackground,
                borderColor: errors.year_two
                  ? theme.errorBorder
                  : openPicker === "year_two"
                    ? theme.primary
                    : theme.inputBorder,
              },
            ]}
          >
            <Calendar
              size={16}
              color={yearTwo ? theme.primary : theme.textMuted}
            />
            <Text
              style={[
                styles.selectValue,
                { color: yearTwo ? theme.text : theme.textMuted },
              ]}
            >
              {yearTwo || "Elegir"}
            </Text>
            <ChevronDown
              size={16}
              color={theme.textMuted}
              style={
                openPicker === "year_two" ? styles.chevronRotated : undefined
              }
            />
          </Pressable>
          {errors.year_two?.message && (
            <Text style={[styles.fieldError, { color: theme.error }]}>
              {errors.year_two.message}
            </Text>
          )}
        </View>
      </View>

      {openPicker && (
        <View
          style={[
            styles.yearPickerCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View
            style={[
              styles.yearPickerHeader,
              { borderBottomColor: theme.divider },
            ]}
          >
            <Text style={[styles.yearPickerTitle, { color: theme.textMuted }]}>
              {openPicker === "year_one"
                ? `Selecciona año de inicio (hasta ${CURRENT_YEAR})`
                : `Selecciona año de fin (hasta ${CURRENT_YEAR})`}
            </Text>
          </View>
          <ScrollView
            style={styles.yearPickerScroll}
            contentContainerStyle={styles.yearGrid}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {availableYears.map((yr) => {
              const selected =
                (openPicker === "year_one" ? yearOne : yearTwo) === yr;
              return (
                <Pressable
                  key={yr}
                  onPress={() => handleSelectYear(yr)}
                  style={[
                    styles.yearCell,
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
                      styles.yearCellText,
                      { color: selected ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {yr}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FormInput
        control={control}
        name="experiencia"
        label="Descripción"
        placeholder="Ej. Desarrollador móvil en proyectos fintech"
        multiline
        maxLength={200}
        textAlignVertical="top"
        style={styles.multilineSmall}
      />

      <ErrorBanner
        message={
          error
            ? extractErrorMessage(error, "No se pudo guardar la experiencia.")
            : null
        }
      />

      <AppButton
        title={initialValue ? "Actualizar experiencia" : "Agregar experiencia"}
        loading={loading}
        disabled={deleting || !hasChanges}
        onPress={handleSubmit(onSave)}
      />

      {initialValue && onDelete && (
        <Pressable
          onPress={confirmDelete}
          disabled={deleting || loading}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: theme.errorSoft },
            pressed && styles.pressed,
          ]}
        >
          <Trash2 size={16} color={theme.error} />
          <Text style={[styles.deleteText, { color: theme.error }]}>
            {deleting ? "Eliminando..." : "Eliminar experiencia"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 15,
  },

  rowTwo: {
    flexDirection: "row",
    gap: 12,
  },

  flexOne: {
    flex: 1,
  },

  multilineInput: {
    minHeight: 128,
    paddingTop: 14,
    paddingBottom: 14,
  },

  multilineSmall: {
    minHeight: 96,
    paddingTop: 14,
    paddingBottom: 14,
  },

  counter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: -8,
  },

  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  englishRows: {
    gap: 10,
  },

  englishRow: {
    flexDirection: "row",
    gap: 10,
  },

  englishChip: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  englishCode: {
    fontSize: 18,
    fontWeight: "800",
  },

  englishDesc: {
    fontSize: 11,
    fontWeight: "500",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
  },

  switchTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  switchSub: {
    fontSize: 12,
    marginTop: 2,
  },

  tagCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  selectableTag: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  selectableTagText: {
    fontSize: 13,
    fontWeight: "600",
  },

  selectLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
    marginBottom: 7,
  },

  selectTrigger: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  selectValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  chevronRotated: {
    transform: [{ rotate: "180deg" }],
  },

  fieldError: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
    marginLeft: 2,
  },

  yearPickerCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  yearPickerHeader: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  yearPickerTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  yearPickerScroll: {
    maxHeight: 190,
  },

  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 8,
  },

  yearCell: {
    width: "22.5%",
    flexGrow: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  yearCellText: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  tenureGrid: {
    padding: 10,
    gap: 8,
  },

  tenureRow: {
    flexDirection: "row",
    gap: 8,
  },

  tenureCell: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  tenureCellText: {
    fontSize: 13,
    fontWeight: "700",
  },

  deleteButton: {
    minHeight: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  deleteText: {
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },
});
