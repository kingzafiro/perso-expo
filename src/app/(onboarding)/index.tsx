import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { FormInput } from "@/components/ui/FormInput";
import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useAvatarPicker } from "@/features/profile/hooks/use-avatar-picker";
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

const onboardingProfileSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Ingresa al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  apellido_paterno: z
    .string()
    .trim()
    .max(80, "El apellido es demasiado largo")
    .optional(),
});

type OnboardingProfileForm = z.infer<typeof onboardingProfileSchema>;

function getPreviewInitials(nombre: string, apellido?: string) {
  const full = [nombre, apellido].filter(Boolean).join(" ").trim();
  if (!full) return "P";
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function OnboardingPerfilScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const updateProfileMutation = useUpdateProfile();
  const { currentPhotoUri, isBusy, photoError, openPhotoOptions } =
    useAvatarPicker();

  const { control, handleSubmit, watch } = useForm<OnboardingProfileForm>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: {
      nombre: user?.nombre ?? "",
      apellido_paterno: user?.apellido_paterno ?? "",
    },
  });

  const watchedNombre = watch("nombre");
  const watchedApellido = watch("apellido_paterno");
  const initials = getPreviewInitials(watchedNombre, watchedApellido);

  const apiError =
    updateProfileMutation.error as AxiosError<ApiErrorResponse> | null;
  const errorMessage =
    apiError?.response?.data?.mensaje ??
    "No fue posible guardar tu información.";

  const onSubmit = (data: OnboardingProfileForm) => {
    updateProfileMutation.mutate(
      {
        nombre: data.nombre.trim(),
        apellido_paterno: data.apellido_paterno?.trim() || undefined,
      },
      {
        onSuccess: () => {
          router.push("/(onboarding)/notificaciones");
        },
      },
    );
  };

  return (
    <AuthSheetLayout
      title="Configura tu perfil"
      subtitle="Agrega tu foto y dinos cómo te llamas para personalizar tu experiencia."
      stepIndicator={{ current: 1, total: 2 }}
    >
      <View style={styles.container}>
        {/* Avatar interactivo con icono de cámara */}
        <View style={styles.avatarSection}>
          <ProfileAvatar
            uri={currentPhotoUri}
            initials={initials}
            size={102}
            editable
            isUploading={isBusy}
            onPress={openPhotoOptions}
          />

          {photoError && (
            <View
              style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}
            >
              <Text style={[styles.errorText, { color: theme.error }]}>
                {photoError}
              </Text>
            </View>
          )}
        </View>

        {/* Inputs compartidos (mismo estilo que Login) */}
        <View style={styles.inputsGroup}>
          <FormInput
            control={control}
            name="nombre"
            label="Nombre"
            placeholder="Ej. Isaac"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
          />

          <FormInput
            control={control}
            name="apellido_paterno"
            label="Apellido (opcional)"
            placeholder="Ej. Ramírez"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="done"
          />
        </View>

        {updateProfileMutation.isError && (
          <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        <AppButton
          title="Continuar"
          loading={updateProfileMutation.isPending}
          disabled={isBusy}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 20,
  },

  avatarSection: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },

  inputsGroup: {
    gap: 14,
  },

  errorBox: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
