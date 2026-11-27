import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { OtpVerificationOverlay } from "@/components/ui/OtpVerificationOverlay";
import {
  sendEmployerEmailCodeApi,
  sendEmployerPhoneCodeApi,
  verifyEmployerEmailCodeApi,
  verifyEmployerPhoneCodeApi,
} from "@/features/employer/api/employer.api";
import { CompanyLogo } from "@/features/employer/components/CompanyLogo";
import {
  CompanyContactEditor,
  CompanyDetailsEditor,
  type CompanyContactForm,
  type CompanyDetailsForm,
  type EmployerOtpRequest,
} from "@/features/employer/components/EmployerSectionEditors";
import {
  EMPLOYER_VACANCIES_QUERY_KEY,
  PUBLIC_JOBS_QUERY_KEY,
} from "@/features/employer/hooks/use-employer-vacancies";
import { MY_FAVORITE_JOBS_QUERY_KEY } from "@/features/jobs/hooks/use-jobs";
import { forwardGeocodeAddress } from "@/features/profile/api/maps.api";
import { AddressEditor } from "@/features/profile/components/AddressEditor";
import { InteractiveAddressMap } from "@/features/profile/components/InteractiveAddressMap";
import { ProfileEditSheet } from "@/features/profile/components/ProfileEditSheet";
import type { ProfileDireccion } from "@/features/profile/types/profile.types";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployerStore } from "@/stores/employer.store";

type ActiveSection = null | "company" | "location" | "contact";

function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string } | undefined;
    if (data?.mensaje) return data.mensaje;
  }
  return "No pudimos guardar los datos de tu empresa. Verifica tu conexión e intenta de nuevo.";
}

function parseLegacyCityParts(city?: string | null) {
  const clean = (city ?? "").trim();
  if (!clean) return { municipio: "", estado: "" };
  const parts = clean
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { municipio: parts[0], estado: parts[1] };
  }
  return { municipio: parts[0] ?? "", estado: "" };
}

export default function EmployerProfileScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const existingProfile = useEmployerStore((state) => state.profile);
  const draft = useEmployerStore((state) => state.draft);
  const hasAccess = useEmployerStore((state) => state.hasAccess);
  const isAdmin = useEmployerStore((state) => state.isAdmin);
  const syncFromServer = useEmployerStore((state) => state.syncFromServer);
  const updateDraft = useEmployerStore((state) => state.updateDraft);
  const saveProfileToServer = useEmployerStore(
    (state) => state.saveProfileToServer,
  );
  const uploadLogo = useEmployerStore((state) => state.uploadLogo);
  const deleteLogo = useEmployerStore((state) => state.deleteLogo);

  const isEditing = Boolean(existingProfile?.id_empresa);

  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [sheetScrollEnabled, setSheetScrollEnabled] = useState(true);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [otpChallenge, setOtpChallenge] = useState<EmployerOtpRequest | null>(
    null,
  );
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const [logoBusy, setLogoBusy] = useState(false);
  const [optimisticLogoUri, setOptimisticLogoUri] = useState<string | null>(
    null,
  );
  const [pendingLogo, setPendingLogo] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);

  useEffect(() => {
    if (isEditing) {
      void syncFromServer();
    }
  }, [isEditing, syncFromServer]);

  const invalidateVacancyCaches = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PUBLIC_JOBS_QUERY_KEY });
    void queryClient.invalidateQueries({
      queryKey: EMPLOYER_VACANCIES_QUERY_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: MY_FAVORITE_JOBS_QUERY_KEY,
    });
  }, [queryClient]);

  const defaultFullName = [user?.nombre, user?.apellido_paterno]
    .filter(Boolean)
    .join(" ")
    .trim();
  const defaultPhone = (user?.celular ?? "").replace(/\D/g, "").slice(-10);

  // Fuente actual de datos: al editar usa el perfil sincronizado, al registrar usa el borrador
  const source = isEditing ? existingProfile : draft;
  const legacyCity = parseLegacyCityParts(source?.city);

  const currentCompany: CompanyDetailsForm = {
    companyName: source?.companyName ?? "",
    industry: source?.industry ?? "",
    companySize: source?.companySize ?? "",
    description: source?.description ?? "",
  };

  const currentLocation: ProfileDireccion = {
    estado: source?.estado || legacyCity.estado || "",
    municipio: source?.municipio || legacyCity.municipio || "",
    colonia: source?.colonia ?? "",
    calle: source?.calle ?? "",
    numero: source?.numero ?? "",
    cp: source?.cp ?? "",
    latitud: typeof source?.latitud === "number" ? source.latitud : null,
    longitud: typeof source?.longitud === "number" ? source.longitud : null,
  };

  const currentContact: CompanyContactForm = {
    contactName: source?.contactName || (!isEditing ? defaultFullName : ""),
    contactRole: source?.contactRole ?? "",
    workEmail: source?.workEmail || (!isEditing ? (user?.email ?? "") : ""),
    phone: source?.phone || (!isEditing ? defaultPhone : ""),
  };

  const currentEmailVerified = Boolean(source?.workEmailVerified);
  const currentPhoneVerified = Boolean(source?.phoneVerified);
  const currentPdfVerified = Boolean(
    isEditing
      ? existingProfile?.verified && existingProfile?.rfc
      : draft.verifiedPdf && draft.rfc,
  );
  const currentRfc = (isEditing ? existingProfile?.rfc : draft.rfc) || "";
  const currentLegalName =
    (isEditing ? existingProfile?.legalName : draft.legalName) || "";

  const hasCompanyDetails =
    currentCompany.companyName.trim().length >= 2 &&
    currentCompany.industry.trim().length > 0 &&
    currentCompany.companySize.trim().length > 0 &&
    currentCompany.description.trim().length >= 15;

  const hasFullAddress =
    currentLocation.estado.trim().length > 0 &&
    currentLocation.municipio.trim().length > 0 &&
    currentLocation.colonia.trim().length > 0 &&
    currentLocation.calle.trim().length > 0 &&
    currentLocation.numero.trim().length > 0 &&
    /^\d{5}$/.test(currentLocation.cp.trim());

  const hasAnyLocation = hasFullAddress || Boolean((source?.city ?? "").trim());

  const hasContactDetails =
    currentContact.contactName.trim().length >= 2 &&
    currentContact.contactRole.trim().length >= 2 &&
    currentContact.workEmail.trim().includes("@") &&
    /^\d{10}$/.test(currentContact.phone.trim());

  const missingCreationItems = useMemo(() => {
    if (isEditing) return [];
    const items: string[] = [];
    if (!hasCompanyDetails) items.push("Datos de la empresa");
    if (!hasFullAddress) items.push("Ubicación completa");
    if (!hasContactDetails) items.push("Contacto del responsable");
    if (!currentEmailVerified) items.push("Correo verificado");
    if (!currentPhoneVerified) items.push("Teléfono verificado por SMS");
    if (!currentPdfVerified) items.push("Verificación con PDF fiscal");
    return items;
  }, [
    isEditing,
    hasCompanyDetails,
    hasFullAddress,
    hasContactDetails,
    currentEmailVerified,
    currentPhoneVerified,
    currentPdfVerified,
  ]);

  const canCreateCompany = missingCreationItems.length === 0;

  const formattedAddressQuery = useMemo(() => {
    const full = [
      currentLocation.calle,
      currentLocation.numero,
      currentLocation.colonia,
      currentLocation.municipio,
      currentLocation.estado,
      currentLocation.cp,
    ]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(", ");
    return full || (source?.city ?? "").trim() || null;
  }, [
    currentLocation.calle,
    currentLocation.numero,
    currentLocation.colonia,
    currentLocation.municipio,
    currentLocation.estado,
    currentLocation.cp,
    source?.city,
  ]);

  const savedCoords =
    typeof currentLocation.latitud === "number" &&
    typeof currentLocation.longitud === "number"
      ? { lat: currentLocation.latitud, lng: currentLocation.longitud }
      : null;

  const geocodedCoordsQuery = useQuery({
    queryKey: ["employer-address-coords", formattedAddressQuery],
    queryFn: async () => {
      if (!formattedAddressQuery) return null;
      const res = await forwardGeocodeAddress(formattedAddressQuery);
      if (res && typeof res.lat === "number" && typeof res.lng === "number") {
        return { lat: res.lat, lng: res.lng };
      }
      return null;
    },
    enabled: Boolean(formattedAddressQuery) && !savedCoords,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const previewCoords = savedCoords ?? geocodedCoordsQuery.data ?? null;

  const openSection = async (section: Exclude<ActiveSection, null>) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSectionError(null);
    setSheetScrollEnabled(true);
    setActiveSection(section);
  };

  const closeSection = () => {
    setSectionError(null);
    setOtpChallenge(null);
    setOtpError(null);
    setSheetScrollEnabled(true);
    setActiveSection(null);
  };

  const handleOpenOtpChallenge = (request: EmployerOtpRequest) => {
    setOtpError(null);
    setOtpChallenge(request);
  };

  const handleCompleteOtp = async (code: string) => {
    if (!otpChallenge || otpVerifying) return;
    setOtpError(null);
    setOtpVerifying(true);
    try {
      if (otpChallenge.channel === "email") {
        await verifyEmployerEmailCodeApi({
          email: otpChallenge.targetValue,
          codigo: code,
        });
      } else {
        await verifyEmployerPhoneCodeApi({
          codigo_pais: otpChallenge.countryCode || "+52",
          numero: otpChallenge.targetValue,
          codigo: code,
        });
      }

      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      const confirmedValue = otpChallenge.targetValue;
      const notify = otpChallenge.onVerified;
      setOtpChallenge(null);
      setOtpError(null);
      notify(confirmedValue);
    } catch (err) {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setOtpError(
        extractErrorMessage(err) || "El código ingresado no es correcto.",
      );
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async (): Promise<number> => {
    if (!otpChallenge || otpResending) return 45;
    setOtpError(null);
    setOtpResending(true);
    try {
      if (otpChallenge.channel === "email") {
        const res = await sendEmployerEmailCodeApi({
          email: otpChallenge.targetValue,
          companyName: otpChallenge.companyName,
        });
        setOtpChallenge((prev) =>
          prev ? { ...prev, debugCode: res.debug_codigo ?? null } : prev,
        );
        return res.cooldown_segundos || 45;
      }

      const res = await sendEmployerPhoneCodeApi({
        codigo_pais: otpChallenge.countryCode || "+52",
        numero: otpChallenge.targetValue,
      });
      setOtpChallenge((prev) =>
        prev ? { ...prev, debugCode: res.debug_codigo ?? null } : prev,
      );
      return res.cooldown_segundos || 45;
    } catch (err) {
      setOtpError(extractErrorMessage(err) || "No se pudo reenviar el código.");
      return 15;
    } finally {
      setOtpResending(false);
    }
  };

  const handleRefresh = async () => {
    if (!isEditing) return;
    setManualRefreshing(true);
    try {
      await syncFromServer();
    } finally {
      setManualRefreshing(false);
    }
  };

  const persistSectionPatch = async (
    patch: Parameters<typeof updateDraft>[0],
    options?: { requireContactVerification?: boolean },
  ) => {
    setSectionError(null);

    if (!isEditing) {
      updateDraft(patch);
      if (Platform.OS !== "web") {
        void Haptics.selectionAsync();
      }
      closeSection();
      return;
    }

    setSectionSaving(true);
    try {
      const baseCity =
        [currentLocation.municipio.trim(), currentLocation.estado.trim()]
          .filter(Boolean)
          .join(", ") ||
        existingProfile?.city ||
        "";

      updateDraft({
        companyName: currentCompany.companyName,
        industry: currentCompany.industry,
        companySize: currentCompany.companySize,
        description: currentCompany.description,
        city: baseCity,
        estado: currentLocation.estado,
        municipio: currentLocation.municipio,
        colonia: currentLocation.colonia,
        calle: currentLocation.calle,
        numero: currentLocation.numero,
        cp: currentLocation.cp,
        latitud: currentLocation.latitud ?? null,
        longitud: currentLocation.longitud ?? null,
        contactName: currentContact.contactName,
        contactRole: currentContact.contactRole,
        workEmail: currentContact.workEmail,
        phone: currentContact.phone,
        ...patch,
      });

      await saveProfileToServer({
        requireContactVerification: options?.requireContactVerification,
      });
      invalidateVacancyCaches();

      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      closeSection();
    } catch (error) {
      setSectionError(extractErrorMessage(error));
    } finally {
      setSectionSaving(false);
    }
  };

  const handleSaveCompanyDetails = (data: CompanyDetailsForm) => {
    void persistSectionPatch({
      companyName: data.companyName.trim(),
      industry: data.industry.trim(),
      companySize: data.companySize.trim(),
      description: data.description.trim(),
    });
  };

  const handleSaveLocation = (data: ProfileDireccion) => {
    const derivedCity = [data.municipio.trim(), data.estado.trim()]
      .filter(Boolean)
      .join(", ");

    void persistSectionPatch({
      city: derivedCity,
      estado: data.estado.trim(),
      municipio: data.municipio.trim(),
      colonia: data.colonia.trim(),
      calle: data.calle.trim(),
      numero: data.numero.trim(),
      cp: data.cp.trim(),
      latitud: typeof data.latitud === "number" ? data.latitud : null,
      longitud: typeof data.longitud === "number" ? data.longitud : null,
    });
  };

  const handleSaveContact = (data: CompanyContactForm) => {
    void persistSectionPatch(
      {
        contactName: data.contactName.trim(),
        contactRole: data.contactRole.trim(),
        workEmail: data.workEmail.trim().toLowerCase(),
        workEmailVerified: true,
        phone: data.phone.trim(),
        phoneVerified: true,
      },
      { requireContactVerification: true },
    );
  };

  const handleCreateCompany = async () => {
    if (!canCreateCompany || creatingCompany) return;
    setCreatingCompany(true);
    try {
      const derivedCity = [
        currentLocation.municipio.trim(),
        currentLocation.estado.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      updateDraft({
        companyName: currentCompany.companyName.trim(),
        industry: currentCompany.industry.trim(),
        companySize: currentCompany.companySize.trim(),
        description: currentCompany.description.trim(),
        city: derivedCity,
        estado: currentLocation.estado.trim(),
        municipio: currentLocation.municipio.trim(),
        colonia: currentLocation.colonia.trim(),
        calle: currentLocation.calle.trim(),
        numero: currentLocation.numero.trim(),
        cp: currentLocation.cp.trim(),
        latitud: currentLocation.latitud ?? null,
        longitud: currentLocation.longitud ?? null,
        contactName: currentContact.contactName.trim(),
        contactRole: currentContact.contactRole.trim(),
        workEmail: currentContact.workEmail.trim().toLowerCase(),
        phone: currentContact.phone.trim(),
      });

      await saveProfileToServer({ requireContactVerification: true });

      if (pendingLogo) {
        try {
          await uploadLogo(pendingLogo);
          setPendingLogo(null);
        } catch {
          // No bloquear el registro principal si falló el logo
        }
      }

      invalidateVacancyCaches();

      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      if (hasAccess || isAdmin) {
        router.replace("/(app)/empresas");
      } else {
        router.replace("/(employer)/planes");
      }
    } catch (error) {
      Alert.alert("No se pudo registrar", extractErrorMessage(error));
    } finally {
      setCreatingCompany(false);
    }
  };

  /* ---- Logotipo interactivo ---- */
  const displayedLogoUri =
    optimisticLogoUri ?? pendingLogo?.uri ?? existingProfile?.logoUrl ?? null;

  const pickLogoFromSource = async (pickerSource: "library" | "camera") => {
    try {
      if (pickerSource === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permiso de cámara",
            "Activa el acceso a la cámara para tomar una foto de tu logotipo.",
          );
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permiso de fotos",
            "Activa el acceso a tu galería para elegir el logotipo de tu empresa.",
          );
          return;
        }
      }

      const result =
        pickerSource === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName || `logo-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      };

      if (isEditing) {
        setOptimisticLogoUri(asset.uri);
        setLogoBusy(true);
        try {
          await uploadLogo(file);
          setPendingLogo(null);
          invalidateVacancyCaches();
          if (Platform.OS !== "web") {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
        } catch (error) {
          Alert.alert("No se pudo subir el logotipo", extractErrorMessage(error));
        } finally {
          setOptimisticLogoUri(null);
          setLogoBusy(false);
        }
      } else {
        setPendingLogo(file);
        if (Platform.OS !== "web") {
          void Haptics.selectionAsync();
        }
      }
    } catch {
      Alert.alert("Error", "No fue posible seleccionar la imagen.");
    }
  };

  const handleRemoveLogo = () => {
    if (logoBusy) return;
    if (pendingLogo && !existingProfile?.logoUrl) {
      setPendingLogo(null);
      return;
    }

    const doDelete = async () => {
      setLogoBusy(true);
      try {
        await deleteLogo();
        setPendingLogo(null);
        setOptimisticLogoUri(null);
        invalidateVacancyCaches();
        if (Platform.OS !== "web") {
          void Haptics.selectionAsync();
        }
      } catch (error) {
        Alert.alert("No se pudo eliminar", extractErrorMessage(error));
      } finally {
        setLogoBusy(false);
      }
    };

    if (Platform.OS === "web") {
      void doDelete();
      return;
    }

    Alert.alert(
      "Quitar logotipo",
      "¿Deseas eliminar el logotipo actual de tu empresa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void doDelete(),
        },
      ],
    );
  };

  const handleOpenLogoPicker = () => {
    if (logoBusy) return;
    const hasLogo = Boolean(displayedLogoUri);

    if (Platform.OS === "web") {
      void pickLogoFromSource("library");
      return;
    }

    if (Platform.OS === "ios") {
      const options = hasLogo
        ? ["Tomar foto", "Elegir de la galería", "Eliminar logotipo", "Cancelar"]
        : ["Tomar foto", "Elegir de la galería", "Cancelar"];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: hasLogo ? 2 : undefined,
          title: "Logotipo de la empresa",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) void pickLogoFromSource("camera");
          if (buttonIndex === 1) void pickLogoFromSource("library");
          if (hasLogo && buttonIndex === 2) handleRemoveLogo();
        },
      );
      return;
    }

    Alert.alert(
      "Logotipo de la empresa",
      "Elige una opción para el logotipo de tu empresa.",
      [
        {
          text: "Elegir de la galería",
          onPress: () => void pickLogoFromSource("library"),
        },
        {
          text: "Tomar foto",
          onPress: () => void pickLogoFromSource("camera"),
        },
        ...(hasLogo
          ? [
              {
                text: "Eliminar logotipo",
                style: "destructive" as const,
                onPress: handleRemoveLogo,
              },
            ]
          : []),
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const sheetMeta = (() => {
    switch (activeSection) {
      case "company":
        return {
          title: "Datos de la empresa",
          subtitle: "Nombre comercial, sector, tamaño del equipo y descripción.",
        };
      case "location":
        return {
          title: "Ubicación de la empresa",
          subtitle: "Busca en el mapa o mueve el pin para guardar tu dirección exacta.",
        };
      case "contact":
        return {
          title: "Contacto del responsable",
          subtitle: "Quién gestiona las vacantes y los datos de contacto.",
        };
      default:
        return { title: "", subtitle: "" };
    }
  })();

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.06)";

  const citySummary =
    [currentLocation.municipio.trim(), currentLocation.estado.trim()]
      .filter(Boolean)
      .join(", ") || (source?.city ?? "").trim();

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SettingsHeader title={isEditing ? "Tu empresa" : "Registrar empresa"} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 40, 64) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isEditing ? (
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={theme.primary}
            />
          ) : undefined
        }
      >
        {/* Cabecera interactiva con el logotipo (igual que Tú → Perfil) */}
        <View style={styles.logoHero}>
          <CompanyLogo
            uri={displayedLogoUri}
            size={100}
            borderRadius={28}
            editable
            isUploading={logoBusy}
            onPress={handleOpenLogoPicker}
          />

          <View style={styles.heroTitleRow}>
            <Text
              style={[styles.heroCompanyName, { color: theme.text }]}
              numberOfLines={2}
            >
              {currentCompany.companyName.trim() ||
                (isEditing ? "Tu empresa" : "Nueva empresa")}
            </Text>
            {existingProfile?.verified ? (
              <BadgeCheck size={18} color="#34C759" />
            ) : null}
          </View>

          {currentCompany.industry || citySummary ? (
            <Text
              style={[styles.heroCompanyMeta, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {[currentCompany.industry, citySummary]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : (
            <Text
              style={[styles.heroCompanyMeta, { color: theme.textSecondary }]}
            >
              Toca cada tarjeta para completar o editar la información.
            </Text>
          )}
        </View>

        {/* 1. Card: Datos de la empresa */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}
            >
              Datos de la empresa
            </Text>
            <Pressable
              onPress={() => void openSection("company")}
              hitSlop={10}
              style={styles.inlineAction}
            >
              <Pencil size={13} color={theme.primary} />
              <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                {hasCompanyDetails ? "Editar" : "Agregar"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void openSection("company")}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && styles.pressed,
            ]}
          >
            {hasCompanyDetails ? (
              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <Building2 size={17} color={theme.primary} />
                  </View>
                  <View style={styles.flexOne}>
                    <Text
                      style={[styles.cardMainText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {currentCompany.companyName}
                    </Text>
                    <View style={styles.subTagsRow}>
                      <Text
                        style={[
                          styles.cardSubText,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {currentCompany.industry}
                      </Text>
                      <Text
                        style={[styles.dotSep, { color: theme.textMuted }]}
                      >
                        ·
                      </Text>
                      <Users size={12} color={theme.textSecondary} />
                      <Text
                        style={[
                          styles.cardSubText,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {currentCompany.companySize} colaboradores
                      </Text>
                    </View>
                  </View>
                </View>

                <Text
                  style={[styles.descPreview, { color: theme.textSecondary }]}
                  numberOfLines={3}
                >
                  {currentCompany.description}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyInlineRow}>
                <Building2 size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.emptyInlineText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Toca para agregar nombre, sector, tamaño y descripción
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 2. Card: Ubicación (con vista previa en mapa nativo igual que Tú → Perfil) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}
            >
              Ubicación
            </Text>
            <Pressable
              onPress={() => void openSection("location")}
              hitSlop={10}
              style={styles.inlineAction}
            >
              <Pencil size={13} color={theme.primary} />
              <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                {hasFullAddress ? "Editar" : "Completar"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void openSection("location")}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && styles.pressed,
            ]}
          >
            {hasAnyLocation ? (
              <View style={styles.cardBody}>
                {previewCoords ? (
                  <InteractiveAddressMap
                    coords={previewCoords}
                    height={136}
                    readOnly
                  />
                ) : null}

                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <MapPin size={17} color={theme.primary} />
                  </View>
                  <View style={styles.flexOne}>
                    <Text
                      style={[styles.cardMainText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {hasFullAddress
                        ? `${currentLocation.calle} ${currentLocation.numero}${currentLocation.colonia ? `, ${currentLocation.colonia}` : ""}`
                        : citySummary}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubText,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {hasFullAddress
                        ? `${[currentLocation.municipio, currentLocation.estado]
                            .filter(Boolean)
                            .join(", ")}${currentLocation.cp ? ` · C.P. ${currentLocation.cp}` : ""}`
                        : "Toca para agregar calle, colonia, C.P. y coordenadas exactas"}
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
                  Toca para ubicar la dirección de tu empresa en el mapa
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 3. Card: Contacto del responsable */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionHeaderTitle, { color: theme.textSecondary }]}
            >
              Contacto del responsable
            </Text>
            <Pressable
              onPress={() => void openSection("contact")}
              hitSlop={10}
              style={styles.inlineAction}
            >
              <Pencil size={13} color={theme.primary} />
              <Text style={[styles.inlineActionText, { color: theme.primary }]}>
                {hasContactDetails ? "Editar" : "Agregar"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void openSection("contact")}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && styles.pressed,
            ]}
          >
            {hasContactDetails ? (
              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <UserRound size={17} color={theme.primary} />
                  </View>
                  <View style={styles.flexOne}>
                    <Text
                      style={[styles.cardMainText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {currentContact.contactName}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubText,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {currentContact.contactRole}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.contactDivider,
                    { backgroundColor: theme.divider },
                  ]}
                />

                <View style={styles.contactFooterList}>
                  <View style={styles.contactMiniRow}>
                    <Mail size={13.5} color={theme.textMuted} />
                    <Text
                      style={[
                        styles.contactMiniText,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {currentContact.workEmail}
                    </Text>
                    {currentEmailVerified ? (
                      <CheckCircle2 size={14} color={theme.success} />
                    ) : (
                      <Text
                        style={[styles.unverifiedTag, { color: theme.primary }]}
                      >
                        Sin verificar
                      </Text>
                    )}
                  </View>
                  <View style={styles.contactMiniRow}>
                    <Phone size={13.5} color={theme.textMuted} />
                    <Text
                      style={[
                        styles.contactMiniText,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {currentContact.phone}
                    </Text>
                    {currentPhoneVerified ? (
                      <CheckCircle2 size={14} color={theme.success} />
                    ) : (
                      <Text
                        style={[styles.unverifiedTag, { color: theme.primary }]}
                      >
                        Sin verificar
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyInlineRow}>
                <UserRound size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.emptyInlineText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Toca para agregar responsable, cargo, correo y teléfono
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 4. Card de verificación fiscal obligatoria al registrar una empresa nueva */}
        {!isEditing ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  { color: theme.textSecondary },
                ]}
              >
                Verificación de empresa (PDF)
              </Text>
              <Pressable
                onPress={() => router.push("/(employer)/verificacion")}
                hitSlop={10}
                style={styles.inlineAction}
              >
                <Pencil size={13} color={theme.primary} />
                <Text
                  style={[styles.inlineActionText, { color: theme.primary }]}
                >
                  {currentPdfVerified ? "Actualizar" : "Verificar"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/(employer)/verificacion")}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
                pressed && styles.pressed,
              ]}
            >
              {currentPdfVerified ? (
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: theme.successSoft },
                    ]}
                  >
                    <ShieldCheck size={18} color={theme.success} />
                  </View>
                  <View style={styles.flexOne}>
                    <Text
                      style={[styles.cardMainText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      RFC {currentRfc} verificado
                    </Text>
                    {currentLegalName ? (
                      <Text
                        style={[
                          styles.cardSubText,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {currentLegalName}
                      </Text>
                    ) : null}
                  </View>
                  <CheckCircle2 size={18} color={theme.success} />
                </View>
              ) : (
                <View style={styles.emptyInlineRow}>
                  <FileCheck2 size={18} color={theme.primary} />
                  <Text
                    style={[
                      styles.emptyInlineText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Requerido · Sube tu Constancia de Situación Fiscal (PDF) para validar tu empresa
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Botón final solo al registrar una empresa nueva */}
        {!isEditing ? (
          <View style={styles.createCtaWrap}>
            {missingCreationItems.length > 0 ? (
              <Text
                style={[styles.missingHint, { color: theme.textSecondary }]}
              >
                Pendiente para crear tu empresa:{" "}
                {missingCreationItems.join(" · ")}
              </Text>
            ) : null}
            <AppButton
              title="Guardar y registrar empresa"
              loading={creatingCompany}
              disabled={!canCreateCompany}
              onPress={() => void handleCreateCompany()}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Sheet modal para editar cada card */}
      <ProfileEditSheet
        visible={activeSection !== null}
        title={sheetMeta.title}
        subtitle={sheetMeta.subtitle}
        scrollEnabled={sheetScrollEnabled}
        onClose={closeSection}
        overlay={
          otpChallenge ? (
            <OtpVerificationOverlay
              visible
              channel={otpChallenge.channel}
              targetLabel={otpChallenge.targetLabel}
              initialCooldown={otpChallenge.initialCooldown}
              debugCode={otpChallenge.debugCode}
              verifying={otpVerifying}
              resending={otpResending}
              errorMessage={otpError}
              onComplete={(code) => void handleCompleteOtp(code)}
              onResend={handleResendOtp}
              onClose={() => {
                setOtpChallenge(null);
                setOtpError(null);
              }}
            />
          ) : null
        }
      >
        {activeSection === "company" ? (
          <CompanyDetailsEditor
            initialValue={currentCompany}
            loading={sectionSaving}
            errorMessage={sectionError}
            submitLabel={isEditing ? "Guardar cambios" : "Guardar sección"}
            onSave={handleSaveCompanyDetails}
          />
        ) : null}

        {activeSection === "location" ? (
          <AddressEditor
            initialValue={currentLocation}
            loading={sectionSaving}
            error={
              sectionError
                ? { response: { data: { mensaje: sectionError } } }
                : null
            }
            onMapInteractionChange={(interacting) =>
              setSheetScrollEnabled(!interacting)
            }
            onSave={handleSaveLocation}
          />
        ) : null}

        {activeSection === "contact" ? (
          <CompanyContactEditor
            initialValue={currentContact}
            companyName={currentCompany.companyName}
            initialEmailVerified={currentEmailVerified}
            initialPhoneVerified={currentPhoneVerified}
            loading={sectionSaving}
            errorMessage={sectionError}
            submitLabel={isEditing ? "Guardar cambios" : "Guardar sección"}
            onOpenOtpChallenge={handleOpenOtpChallenge}
            onSave={handleSaveContact}
          />
        ) : null}
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
    gap: 20,
  },

  flexOne: {
    flex: 1,
  },

  logoHero: {
    alignItems: "center",
    paddingVertical: 6,
    gap: 6,
  },

  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 16,
  },

  heroCompanyName: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    flexShrink: 1,
  },

  heroCompanyMeta: {
    fontSize: 13.5,
    textAlign: "center",
    paddingHorizontal: 16,
  },

  sectionBlock: {
    gap: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },

  sectionHeaderTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  inlineActionText: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
  },

  cardBody: {
    gap: 11,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cardMainText: {
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  cardSubText: {
    fontSize: 13,
    marginTop: 1,
    flexShrink: 1,
  },

  subTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    flexWrap: "wrap",
  },

  dotSep: {
    fontSize: 13,
    fontWeight: "700",
  },

  descPreview: {
    fontSize: 13.5,
    lineHeight: 19.5,
  },

  contactDivider: {
    height: StyleSheet.hairlineWidth,
  },

  contactFooterList: {
    gap: 6,
  },

  contactMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  contactMiniText: {
    fontSize: 13,
    flex: 1,
  },

  unverifiedTag: {
    fontSize: 11.5,
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
    fontSize: 13.5,
    lineHeight: 19,
  },

  createCtaWrap: {
    marginTop: 4,
    gap: 10,
  },

  missingHint: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  pressed: {
    opacity: 0.78,
  },
});
