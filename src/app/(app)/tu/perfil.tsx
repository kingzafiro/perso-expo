import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  GraduationCap,
  Languages,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  User,
} from "lucide-react-native";
import { useMemo, useState } from "react";
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

import { forwardGeocodeAddress } from "@/features/profile/api/maps.api";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileEditSheet } from "@/features/profile/components/ProfileEditSheet";
import {
  AddressEditor,
  BioEditor,
  EnglishEditor,
  ExperienceYearEditor,
  JobInterestsEditor,
  LastJobEditor,
  PersonalInfoEditor,
  SingleFieldEditor,
  UniversityEditor,
} from "@/features/profile/components/ProfileSectionEditors";
import { useAvatarPicker } from "@/features/profile/hooks/use-avatar-picker";
import {
  useFullProfile,
  useProfileMutations,
} from "@/features/profile/hooks/use-full-profile";
import type { ProfileExperienciaYear } from "@/features/profile/types/profile.types";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsGroup";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

type ActiveEditor =
  | null
  | { type: "personal" }
  | { type: "bio" }
  | { type: "address" }
  | { type: "university" }
  | { type: "degree" }
  | { type: "english" }
  | { type: "jobInterests" }
  | { type: "lastJob" }
  | { type: "experience"; item?: ProfileExperienciaYear | null };

function getDisplayName(
  nombre?: string | null,
  apellidoPaterno?: string | null,
  apellidoMaterno?: string | null,
  email?: string,
) {
  const full = [nombre, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (full) return full;

  if (email) {
    const prefix = email.split("@")[0];
    if (prefix) {
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }

  return "Tu perfil";
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function PerfilScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const storeUser = useAuthStore((state) => state.user);

  const profileQuery = useFullProfile();
  const mutations = useProfileMutations();
  const { currentPhotoUri, isBusy, photoError, openPhotoOptions } =
    useAvatarPicker();

  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [sheetScrollEnabled, setSheetScrollEnabled] = useState(true);

  const perfil = profileQuery.data;
  const user = perfil?.usuario ?? storeUser;
  const direccion = perfil?.direccion ?? null;
  const info = perfil?.informacion ?? null;
  const empleo = perfil?.empleo ?? null;
  const experiencias = perfil?.experiencias ?? [];

  const displayName = getDisplayName(
    user?.nombre,
    user?.apellido_paterno,
    user?.apellido_materno,
    user?.email,
  );
  const initials = getInitials(displayName);
  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.06)";

  const jobTags = useMemo(
    () =>
      (empleo?.empleos ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [empleo?.empleos],
  );

  const completionPercent = useMemo(() => {
    const checks = [
      Boolean(user?.nombre),
      Boolean(currentPhotoUri),
      Boolean(info?.historia),
      Boolean(direccion?.estado && direccion?.calle),
      Boolean(info?.universidad),
      Boolean(info?.titulo),
      Boolean(info?.inglesNivel),
      jobTags.length > 0,
      Boolean(empleo?.empresa && empleo?.puesto),
      experiencias.length > 0,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [
    user?.nombre,
    currentPhotoUri,
    info?.historia,
    info?.universidad,
    info?.titulo,
    info?.inglesNivel,
    direccion?.estado,
    direccion?.calle,
    jobTags.length,
    empleo?.empresa,
    empleo?.puesto,
    experiencias.length,
  ]);

  const formattedAddress = direccion?.calle
    ? `${direccion.calle} ${direccion.numero}, ${direccion.colonia}, ${direccion.municipio}, ${direccion.estado} (${direccion.cp})`
    : null;

  const savedAddressCoords =
    typeof direccion?.latitud === "number" &&
    typeof direccion?.longitud === "number"
      ? { lat: direccion.latitud, lng: direccion.longitud }
      : null;

  const addressCoordsQuery = useQuery({
    queryKey: ["profile-address-coords", formattedAddress],
    queryFn: async () => {
      if (!formattedAddress) return null;
      const result = await forwardGeocodeAddress(formattedAddress);
      if (
        result &&
        typeof result.lat === "number" &&
        typeof result.lng === "number"
      ) {
        return { lat: result.lat, lng: result.lng };
      }
      return null;
    },
    enabled: Boolean(formattedAddress) && !savedAddressCoords,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const previewAddressCoords = savedAddressCoords ?? addressCoordsQuery.data ?? null;

  const openEditor = async (editor: ActiveEditor) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSheetScrollEnabled(true);
    setActiveEditor(editor);
  };

  const closeEditor = () => {
    setSheetScrollEnabled(true);
    setActiveEditor(null);
  };

  const sheetMeta = (() => {
    switch (activeEditor?.type) {
      case "personal":
        return {
          title: "Datos personales",
          subtitle: "Actualiza tu nombre, apellidos y celular de contacto.",
        };
      case "bio":
        return {
          title: "Sobre mí",
          subtitle: "Cuéntale a las empresas quién eres y qué buscas.",
        };
      case "address":
        return {
          title: "Dirección",
          subtitle: "Ayúdanos a mostrarte vacantes cerca de tu ubicación.",
        };
      case "university":
        return {
          title: "Universidad o institución",
          subtitle: "Dónde realizaste o realizas tus estudios.",
        };
      case "degree":
        return {
          title: "Título o carrera",
          subtitle: "Tu especialidad o grado académico.",
        };
      case "english":
        return {
          title: "Nivel de inglés",
          subtitle: "Selecciona tu dominio actual según el marco europeo.",
        };
      case "jobInterests":
        return {
          title: "Empleos de interés",
          subtitle: "Elige áreas sugeridas o escribe los puestos que buscas.",
        };
      case "lastJob":
        return {
          title: "Último empleo",
          subtitle: "Agrega los datos de tu experiencia laboral más reciente.",
        };
      case "experience":
        return {
          title: activeEditor.item
            ? "Editar experiencia"
            : "Agregar experiencia",
          subtitle: "Destaca tus etapas clave por rango de años.",
        };
      default:
        return { title: "", subtitle: "" };
    }
  })();

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title="Perfil" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching}
            onRefresh={() => {
              void profileQuery.refetch();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* Cabecera interactiva con avatar + cámara */}
        <View style={styles.hero}>
          <ProfileAvatar
            uri={currentPhotoUri}
            initials={initials}
            size={106}
            editable
            isUploading={isBusy}
            onPress={openPhotoOptions}
          />

          <Text style={[styles.name, { color: theme.text }]}>
            {displayName}
          </Text>

          {user?.email && (
            <Text style={[styles.email, { color: theme.textSecondary }]}>
              {user.email}
            </Text>
          )}

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

        {/* Tarjeta de progreso del perfil */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Sparkles size={16} color={theme.primary} />
              <Text style={[styles.progressTitle, { color: theme.text }]}>
                Perfil profesional
              </Text>
            </View>
            <Text style={[styles.progressPercent, { color: theme.primary }]}>
              {completionPercent}%
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
                  width: `${completionPercent}%`,
                },
              ]}
            />
          </View>

          <Text
            style={[styles.progressCaption, { color: theme.textSecondary }]}
          >
            {completionPercent === 100
              ? "Tu perfil está completo y listo para destacar."
              : "Toca cualquier sección para agregar o actualizar tu información."}
          </Text>
        </View>

        {profileQuery.isLoading && !perfil ? (
          <View style={styles.skeletonSections}>
            <View
              style={[
                styles.skeletonCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.skeletonRow}>
                <Skeleton width={32} height={32} borderRadius={9} />
                <View style={styles.skeletonTextCol}>
                  <Skeleton width="45%" height={14} borderRadius={7} />
                  <Skeleton width="72%" height={11} borderRadius={6} />
                </View>
              </View>
              <View style={styles.skeletonRow}>
                <Skeleton width={32} height={32} borderRadius={9} />
                <View style={styles.skeletonTextCol}>
                  <Skeleton width="35%" height={14} borderRadius={7} />
                  <Skeleton width="84%" height={11} borderRadius={6} />
                </View>
              </View>
            </View>

            <View
              style={[
                styles.skeletonCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Skeleton width="100%" height={124} borderRadius={16} />
              <Skeleton width="66%" height={13} borderRadius={7} />
              <Skeleton width="46%" height={11} borderRadius={6} />
            </View>

            <View
              style={[
                styles.skeletonCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.skeletonRow}>
                <Skeleton width={32} height={32} borderRadius={9} />
                <View style={styles.skeletonTextCol}>
                  <Skeleton width="42%" height={14} borderRadius={7} />
                  <Skeleton width="68%" height={11} borderRadius={6} />
                </View>
              </View>
              <View style={styles.skeletonRow}>
                <Skeleton width={32} height={32} borderRadius={9} />
                <View style={styles.skeletonTextCol}>
                  <Skeleton width="50%" height={14} borderRadius={7} />
                  <Skeleton width="60%" height={11} borderRadius={6} />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>

        {/* 1. Datos personales y Sobre mí */}
        <SettingsGroup title="Información personal">
          <SettingsRow
            title="Nombre y contacto"
            subtitle={
              [displayName, perfil?.usuario?.celular]
                .filter(Boolean)
                .join(" · ") || "Agregar datos personales"
            }
            icon={<User size={18} color="#FFFFFF" />}
            iconBgColor={theme.primary}
            showDivider
            onPress={() => openEditor({ type: "personal" })}
          />

          <SettingsRow
            title="Sobre mí"
            subtitle={info?.historia || "Agrega una breve historia sobre ti"}
            icon={<BookOpen size={18} color="#FFFFFF" />}
            iconBgColor="#FF9500"
            onPress={() => openEditor({ type: "bio" })}
          />
        </SettingsGroup>

        {/* Ubicación con vista previa en mapa nativo */}
        <View style={styles.customSection}>
          <View style={styles.customSectionHeader}>
            <Text
              style={[
                styles.customSectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              Ubicación
            </Text>
            <Pressable
              onPress={() => openEditor({ type: "address" })}
              hitSlop={10}
              style={styles.inlineAction}
            >
              <Pencil size={13} color={theme.primary} />
              <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                {formattedAddress ? "Editar" : "Agregar"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => openEditor({ type: "address" })}
            style={({ pressed }) => [
              styles.addressCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && styles.pressed,
            ]}
          >
            {formattedAddress ? (
              <View style={styles.addressContent}>
                {previewAddressCoords && (
                  <InteractiveAddressMap
                    coords={previewAddressCoords}
                    height={132}
                    readOnly
                  />
                )}
                <View style={styles.addressMetaRow}>
                  <View
                    style={[
                      styles.addressIconBox,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <MapPin size={17} color={theme.primary} />
                  </View>
                  <View style={styles.addressMetaText}>
                    <Text
                      style={[styles.addressStreet, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {direccion?.calle} {direccion?.numero}
                      {direccion?.colonia ? `, ${direccion.colonia}` : ""}
                    </Text>
                    <Text
                      style={[
                        styles.addressCity,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {[direccion?.municipio, direccion?.estado]
                        .filter(Boolean)
                        .join(", ")}
                      {direccion?.cp ? ` · C.P. ${direccion.cp}` : ""}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyInlineRow}>
                <MapPin size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.emptyInlineText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Toca para ubicar tu dirección en el mapa
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 2. Educación e idiomas */}
        <SettingsGroup title="Educación e idiomas">
          <SettingsRow
            title="Universidad"
            subtitle={info?.universidad || "Agregar institución educativa"}
            icon={<GraduationCap size={18} color="#FFFFFF" />}
            iconBgColor="#5856D6"
            showDivider
            onPress={() => openEditor({ type: "university" })}
          />

          <SettingsRow
            title="Título o carrera"
            subtitle={info?.titulo || "Agregar carrera o grado"}
            icon={<Award size={18} color="#FFFFFF" />}
            iconBgColor="#AF52DE"
            showDivider
            onPress={() => openEditor({ type: "degree" })}
          />

          <SettingsRow
            title="Nivel de inglés"
            subtitle={
              info?.inglesNivel
                ? `Nivel ${info.inglesNivel}${info.certificado ? " · Con certificado" : " · Sin certificado"}`
                : "Seleccionar nivel (A1 – C2)"
            }
            value={info?.inglesNivel ?? undefined}
            icon={<Languages size={18} color="#FFFFFF" />}
            iconBgColor="#0A84FF"
            onPress={() => openEditor({ type: "english" })}
          />
        </SettingsGroup>

        {/* 3. Empleos de interés (chips interactivos) */}
        <View style={styles.customSection}>
          <View style={styles.customSectionHeader}>
            <Text
              style={[
                styles.customSectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              Empleos de interés
            </Text>
            <Pressable
              onPress={() => openEditor({ type: "jobInterests" })}
              hitSlop={10}
              style={styles.inlineAction}
            >
              <Pencil size={13} color={theme.primary} />
              <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                {jobTags.length > 0 ? "Editar" : "Agregar"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => openEditor({ type: "jobInterests" })}
            style={({ pressed }) => [
              styles.customCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && styles.pressed,
            ]}
          >
            {jobTags.length > 0 ? (
              <View style={styles.chipsWrap}>
                {jobTags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.interestChip,
                      {
                        backgroundColor: theme.primarySoft,
                        borderColor: theme.primaryBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.interestChipText,
                        { color: theme.primary },
                      ]}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyInlineRow}>
                <Briefcase size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.emptyInlineText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Toca para elegir los puestos o áreas que te interesan
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 4. Último empleo */}
        <SettingsGroup title="Último empleo">
          <SettingsRow
            title={empleo?.puesto || "Agregar último empleo"}
            subtitle={
              empleo?.empresa
                ? `${empleo.empresa} · ${empleo.tiempo}${empleo.telefono ? ` · ${empleo.telefono}` : ""}`
                : "Empresa, puesto, tiempo y teléfono de referencia"
            }
            icon={<Building2 size={18} color="#FFFFFF" />}
            iconBgColor="#636366"
            onPress={() => openEditor({ type: "lastJob" })}
          />
        </SettingsGroup>

        {/* 5. Línea de experiencia por años */}
        <View style={styles.customSection}>
          <View style={styles.customSectionHeader}>
            <Text
              style={[
                styles.customSectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              Experiencia por años
            </Text>
            <Pressable
              onPress={() => openEditor({ type: "experience", item: null })}
              hitSlop={10}
              style={styles.inlineAction}
            >
              <Plus size={15} color={theme.primary} />
              <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                Agregar
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.customCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {experiencias.length > 0 ? (
              <View style={styles.timelineList}>
                {experiencias.map((exp, index) => (
                  <Pressable
                    key={exp.id}
                    onPress={() =>
                      openEditor({ type: "experience", item: exp })
                    }
                    style={({ pressed }) => [
                      styles.timelineRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                      {index < experiencias.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            { backgroundColor: theme.divider },
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineBody}>
                      <Text
                        style={[styles.timelineYears, { color: theme.primary }]}
                      >
                        {exp.year_one} – {exp.year_two}
                      </Text>
                      <Text
                        style={[styles.timelineText, { color: theme.text }]}
                      >
                        {exp.experiencia}
                      </Text>
                    </View>

                    <Pencil size={15} color={theme.textMuted} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable
                onPress={() => openEditor({ type: "experience", item: null })}
                style={styles.emptyInlineRow}
              >
                <CalendarClock size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.emptyInlineText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Agrega etapas de tu experiencia laboral por años
                </Text>
              </Pressable>
            )}
          </View>
        </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Sheet modal interactivo para editar cada sección */}
      <ProfileEditSheet
        visible={activeEditor !== null}
        title={sheetMeta.title}
        subtitle={sheetMeta.subtitle}
        scrollEnabled={sheetScrollEnabled}
        onClose={closeEditor}
      >
        {activeEditor?.type === "personal" && (
          <PersonalInfoEditor
            user={perfil?.usuario ?? storeUser}
            loading={mutations.personalInfo.isPending}
            error={mutations.personalInfo.error}
            onSave={(data) =>
              mutations.personalInfo.mutate(data, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "bio" && (
          <BioEditor
            initialValue={info?.historia}
            loading={mutations.bio.isPending}
            error={mutations.bio.error}
            onSave={(historia) =>
              mutations.bio.mutate(historia, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "address" && (
          <AddressEditor
            initialValue={direccion}
            loading={mutations.address.isPending}
            error={mutations.address.error}
            onMapInteractionChange={(interacting) =>
              setSheetScrollEnabled(!interacting)
            }
            onSave={(data) =>
              mutations.address.mutate(data, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "university" && (
          <UniversityEditor
            initialValue={info?.universidad}
            loading={mutations.university.isPending}
            error={mutations.university.error}
            onSave={(universidad) =>
              mutations.university.mutate(universidad, {
                onSuccess: closeEditor,
              })
            }
          />
        )}

        {activeEditor?.type === "degree" && (
          <SingleFieldEditor
            label="Título o carrera"
            placeholder="Ej. Ingeniería en Sistemas"
            buttonTitle="Guardar título"
            initialValue={info?.titulo}
            loading={mutations.degree.isPending}
            error={mutations.degree.error}
            onSave={(titulo) =>
              mutations.degree.mutate(titulo, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "english" && (
          <EnglishEditor
            initialValue={info}
            loading={mutations.english.isPending}
            error={mutations.english.error}
            onSave={(payload) =>
              mutations.english.mutate(payload, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "jobInterests" && (
          <JobInterestsEditor
            initialValue={empleo?.empleos}
            loading={mutations.jobInterests.isPending}
            error={mutations.jobInterests.error}
            onSave={(empleos) =>
              mutations.jobInterests.mutate(empleos, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "lastJob" && (
          <LastJobEditor
            initialValue={empleo}
            loading={mutations.lastJob.isPending}
            error={mutations.lastJob.error}
            onSave={(payload) =>
              mutations.lastJob.mutate(payload, { onSuccess: closeEditor })
            }
          />
        )}

        {activeEditor?.type === "experience" && (
          <ExperienceYearEditor
            initialValue={activeEditor.item}
            loading={
              mutations.createExperience.isPending ||
              mutations.updateExperience.isPending
            }
            deleting={mutations.removeExperience.isPending}
            error={
              mutations.createExperience.error ||
              mutations.updateExperience.error ||
              mutations.removeExperience.error
            }
            onSave={(payload) => {
              if (activeEditor.item) {
                mutations.updateExperience.mutate(
                  { id: activeEditor.item.id, payload },
                  { onSuccess: closeEditor },
                );
              } else {
                mutations.createExperience.mutate(payload, {
                  onSuccess: closeEditor,
                });
              }
            }}
            onDelete={
              activeEditor.item
                ? () =>
                    mutations.removeExperience.mutate(activeEditor.item!.id, {
                      onSuccess: closeEditor,
                    })
                : undefined
            }
          />
        )}
      </ProfileEditSheet>
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

  hero: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
    textAlign: "center",
  },

  email: {
    fontSize: 14,
  },

  errorBox: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    width: "100%",
  },

  errorText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
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

  progressPercent: {
    fontSize: 15,
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

  customSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  customSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  inlineActionText: {
    fontSize: 13,
    fontWeight: "700",
  },

  customCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },

  addressCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },

  addressContent: {
    gap: 12,
  },

  addressMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  addressIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  addressMetaText: {
    flex: 1,
    gap: 2,
  },

  addressStreet: {
    fontSize: 15,
    fontWeight: "600",
  },

  addressCity: {
    fontSize: 13,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  interestChipText: {
    fontSize: 13,
    fontWeight: "700",
  },

  emptyInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },

  emptyInlineText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  timelineList: {
    gap: 14,
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  timelineRail: {
    alignItems: "center",
    paddingTop: 5,
    width: 14,
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: 4,
    borderRadius: 1,
  },

  timelineBody: {
    flex: 1,
    gap: 3,
  },

  timelineYears: {
    fontSize: 13,
    fontWeight: "700",
  },

  timelineText: {
    fontSize: 15,
    lineHeight: 21,
  },

  pressed: {
    opacity: 0.78,
  },
});
