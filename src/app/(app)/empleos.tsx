import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck2,
  FileText,
  IdCard,
  MapPin,
  Phone,
  QrCode,
  Send,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react-native";
import { type ReactNode, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useUserDocuments } from "@/features/documents/hooks/use-documents";
import {
  DOCUMENT_META,
  type DocumentType,
} from "@/features/documents/types/documents.types";
import { CompanyLogo } from "@/features/employer/components/CompanyLogo";
import { useMyInterviews } from "@/features/employer/hooks/use-interviews";
import {
  formatVacancyLocation,
  type ApplicationStatus,
  type EmployerVacancy,
} from "@/features/employer/types/employer.types";
import type { CandidateApplication } from "@/features/jobs/api/jobs.api";
import { JobDetailModal } from "@/features/jobs/components/JobDetailModal";
import {
  useFavoriteVacancies,
  useMyApplications,
  useMyDocumentRequests,
} from "@/features/jobs/hooks/use-jobs";
import { useFullProfile } from "@/features/profile/hooks/use-full-profile";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

type ApplicationFilter =
  | "all"
  | "in_progress"
  | "entrevista"
  | "contratado"
  | "descartada";

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatShortDate(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()] ?? ""}`;
}

interface PendingTaskItem {
  id: string;
  title: string;
  subtitle: string;
  required: boolean;
  icon: ReactNode;
  route:
    | "/(app)/tu/perfil"
    | "/(app)/tu/telefono"
    | "/(app)/tu/documentos";
}

export default function MisEmpleosScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const storeUser = useAuthStore((state) => state.user);

  const profileQuery = useFullProfile();
  const docsQuery = useUserDocuments();
  const applicationsQuery = useMyApplications();
  const favoritesQuery = useFavoriteVacancies();
  const interviewsQuery = useMyInterviews();
  const docRequestsQuery = useMyDocumentRequests();

  const [statusFilter, setStatusFilter] = useState<ApplicationFilter>("all");
  const [selectedVacancy, setSelectedVacancy] =
    useState<EmployerVacancy | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const profile = profileQuery.data;
  const profileUser = profile?.usuario ?? storeUser;
  const docs = docsQuery.data;
  const applications = applicationsQuery.data ?? [];
  const favorites = useMemo(
    () => (favoritesQuery.data ?? []).filter((v) => v.estado === "activa"),
    [favoritesQuery.data],
  );
  const interviews = interviewsQuery.data ?? [];
  const docRequests = docRequestsQuery.data ?? [];

  const totalDocs = Object.keys(DOCUMENT_META).length;
  const uploadedDocsCount = useMemo(() => {
    if (!docs) return 0;
    return (Object.keys(DOCUMENT_META) as DocumentType[]).filter((t) =>
      Boolean(docs[t]?.subido),
    ).length;
  }, [docs]);

  const activeInterviewsCount = interviews.filter(
    (i) => i.estado === "pendiente",
  ).length;
  const pendingDocRequestsCount = docRequests.filter(
    (r) => r.estado === "pendiente",
  ).length;

  const isPhoneVerified =
    (profileUser?.celular ?? "").replace(/\D/g, "").length >= 10 &&
    Boolean(profileUser?.celular_verificado);

  const { readinessPercent, pendingTasks, completedCount, totalTasks } =
    useMemo(() => {
      const checks: { done: boolean; task: PendingTaskItem }[] = [
        {
          done: Boolean(profileUser?.nombre?.trim()),
          task: {
            id: "name",
            title: "Agrega tu nombre completo",
            subtitle: "Requisito básico para postularte",
            required: true,
            icon: <UserCheck size={16} color={theme.primary} />,
            route: "/(app)/tu/perfil",
          },
        },
        {
          done: isPhoneVerified,
          task: {
            id: "phone",
            title: "Verifica tu número por SMS",
            subtitle: "Requisito para enviar postulaciones",
            required: true,
            icon: <Phone size={16} color={theme.primary} />,
            route: "/(app)/tu/telefono",
          },
        },
        {
          done: Boolean(docs?.cv?.subido),
          task: {
            id: "cv",
            title: "Sube tu Currículum (CV)",
            subtitle: "Es lo primero que revisan las empresas",
            required: true,
            icon: <FileText size={16} color={theme.primary} />,
            route: "/(app)/tu/documentos",
          },
        },
        {
          done: Boolean(docs?.ine?.subido),
          task: {
            id: "ine",
            title: "Carga tu INE (Frente)",
            subtitle: "Valida tu identidad al postularte",
            required: true,
            icon: <IdCard size={16} color={theme.primary} />,
            route: "/(app)/tu/documentos",
          },
        },
        {
          done: Boolean(profileUser?.foto_perfil),
          task: {
            id: "photo",
            title: "Agrega tu foto de perfil",
            subtitle: "Genera mayor confianza con reclutadores",
            required: false,
            icon: <Sparkles size={16} color={theme.primary} />,
            route: "/(app)/tu/perfil",
          },
        },
        {
          done: Boolean(profile?.direccion?.calle && profile?.direccion?.estado),
          task: {
            id: "address",
            title: "Agrega tu ubicación",
            subtitle: "Encuentra vacantes más cercanas a ti",
            required: false,
            icon: <MapPin size={16} color={theme.primary} />,
            route: "/(app)/tu/perfil",
          },
        },
        {
          done: Boolean(
            profile?.informacion?.universidad ||
              profile?.empleo?.empresa ||
              (profile?.experiencias?.length ?? 0) > 0,
          ),
          task: {
            id: "experience",
            title: "Completa tu experiencia o estudios",
            subtitle: "Aumenta tus probabilidades de entrevista",
            required: false,
            icon: <Briefcase size={16} color={theme.primary} />,
            route: "/(app)/tu/perfil",
          },
        },
      ];

      const doneCount = checks.filter((c) => c.done).length;
      const pending = checks.filter((c) => !c.done).map((c) => c.task);
      return {
        readinessPercent: Math.round((doneCount / checks.length) * 100),
        pendingTasks: pending,
        completedCount: doneCount,
        totalTasks: checks.length,
      };
    }, [
      profileUser?.nombre,
      profileUser?.foto_perfil,
      isPhoneVerified,
      docs?.cv?.subido,
      docs?.ine?.subido,
      profile?.direccion?.calle,
      profile?.direccion?.estado,
      profile?.informacion?.universidad,
      profile?.empleo?.empresa,
      profile?.experiencias?.length,
      theme.primary,
    ]);

  const filterCounts = useMemo(() => {
    const inProgress = applications.filter(
      (a) => a.estado === "enviada" || a.estado === "en_revision",
    ).length;
    const entrevista = applications.filter(
      (a) => a.estado === "entrevista",
    ).length;
    const contratado = applications.filter(
      (a) => a.estado === "contratado",
    ).length;
    const descartada = applications.filter(
      (a) => a.estado === "descartada",
    ).length;
    return {
      all: applications.length,
      in_progress: inProgress,
      entrevista,
      contratado,
      descartada,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    switch (statusFilter) {
      case "in_progress":
        return applications.filter(
          (a) => a.estado === "enviada" || a.estado === "en_revision",
        );
      case "entrevista":
        return applications.filter((a) => a.estado === "entrevista");
      case "contratado":
        return applications.filter((a) => a.estado === "contratado");
      case "descartada":
        return applications.filter((a) => a.estado === "descartada");
      default:
        return applications;
    }
  }, [applications, statusFilter]);

  const handleRefresh = async () => {
    setManualRefreshing(true);
    try {
      await Promise.all([
        profileQuery.refetch(),
        docsQuery.refetch(),
        applicationsQuery.refetch(),
        favoritesQuery.refetch(),
        interviewsQuery.refetch(),
        docRequestsQuery.refetch(),
      ]);
    } finally {
      setManualRefreshing(false);
    }
  };

  const triggerLightHaptic = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getStatusPresentation = (status: ApplicationStatus) => {
    switch (status) {
      case "en_revision":
        return {
          label: "En revisión",
          bg: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(10, 132, 255, 0.10)",
          color: "#0A84FF",
          icon: <Eye size={12.5} color="#0A84FF" />,
        };
      case "entrevista":
        return {
          label: "Entrevista",
          bg: theme.primarySoft,
          color: theme.primary,
          icon: <CalendarCheck2 size={12.5} color={theme.primary} />,
        };
      case "contratado":
        return {
          label: "Aprobado",
          bg: theme.successSoft,
          color: theme.success,
          icon: <CheckCircle2 size={12.5} color={theme.success} />,
        };
      case "descartada":
        return {
          label: "Rechazada",
          bg: theme.errorSoft,
          color: theme.error,
          icon: <XCircle size={12.5} color={theme.error} />,
        };
      default:
        return {
          label: "Enviada",
          bg: theme.inputBackground,
          color: theme.textSecondary,
          icon: <Send size={12} color={theme.textSecondary} />,
        };
    }
  };

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.07)";

  const FILTER_CHIPS: { id: ApplicationFilter; label: string; count: number }[] =
    [
      { id: "all", label: "Todas", count: filterCounts.all },
      { id: "in_progress", label: "En proceso", count: filterCounts.in_progress },
      { id: "entrevista", label: "Entrevista", count: filterCounts.entrevista },
      { id: "contratado", label: "Aprobadas", count: filterCounts.contratado },
      { id: "descartada", label: "Rechazadas", count: filterCounts.descartada },
    ];

  const renderApplicationCard = (item: CandidateApplication) => {
    const statusUI = getStatusPresentation(item.estado);
    const appliedDate = formatShortDate(item.createdAt);
    const locationText = formatVacancyLocation(item.vacante);

    return (
      <Pressable
        key={item.id_postulacion}
        onPress={() => {
          if (Platform.OS !== "web") void Haptics.selectionAsync();
          setSelectedVacancy(item.vacante);
        }}
        style={({ pressed }) => [
          styles.appCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.appTopRow}>
          <CompanyLogo
            uri={item.vacante.empresa?.logo_url}
            size={44}
            borderRadius={12}
          />

          <View style={styles.appInfoCol}>
            <Text
              style={[styles.appTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {item.vacante.titulo}
            </Text>

            <View style={styles.appCompanyRow}>
              <Text
                style={[styles.appCompany, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {item.vacante.empresa?.nombre_comercial || "Empresa en Perso"}
              </Text>
              {item.vacante.empresa?.verificada ? (
                <BadgeCheck size={13.5} color="#34C759" />
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.appStatusMetaRow}>
          <View style={[styles.statusPill, { backgroundColor: statusUI.bg }]}>
            {statusUI.icon}
            <Text style={[styles.statusPillText, { color: statusUI.color }]}>
              {statusUI.label}
            </Text>
          </View>

          <Text
            style={[styles.appMetaDate, { color: theme.textMuted }]}
            numberOfLines={1}
          >
            {[appliedDate ? `Postulado el ${appliedDate}` : null, locationText]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>

        {item.estado === "entrevista" ? (
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              router.push("/(app)/tu/entrevistas");
            }}
            style={({ pressed }) => [
              styles.appActionStrip,
              {
                backgroundColor: theme.primarySoft,
                borderColor: theme.primaryBorder,
              },
              pressed && styles.pressed,
            ]}
          >
            <QrCode size={14} color={theme.primary} />
            <Text style={[styles.appActionText, { color: theme.primary }]}>
              Ver pase QR en Mis entrevistas
            </Text>
            <ArrowRight size={14} color={theme.primary} />
          </Pressable>
        ) : item.estado === "contratado" ? (
          <View
            style={[
              styles.appNoteStrip,
              { backgroundColor: theme.successSoft },
            ]}
          >
            <CheckCircle2 size={14} color={theme.success} />
            <Text style={[styles.appNoteText, { color: theme.success }]}>
              ¡Felicidades! La empresa aprobó tu postulación.
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + 14, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.primary}
          />
        }
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            TU ACTIVIDAD
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Mis empleos</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {applications.length > 0
              ? `${applications.length} ${applications.length === 1 ? "postulación" : "postulaciones"}${activeInterviewsCount > 0 ? ` · ${activeInterviewsCount} ${activeInterviewsCount === 1 ? "entrevista activa" : "entrevistas activas"}` : ""}`
              : "Prepara tu perfil, guarda vacantes y sigue tus postulaciones"}
          </Text>
        </View>

        {/* 1. Avance y tareas pendientes del perfil */}
        <View
          style={[
            styles.readinessCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.readinessHeader}>
            <View style={styles.readinessTitleRow}>
              <View
                style={[
                  styles.readinessIconBox,
                  {
                    backgroundColor:
                      readinessPercent === 100
                        ? theme.successSoft
                        : theme.primarySoft,
                  },
                ]}
              >
                {readinessPercent === 100 ? (
                  <CheckCircle2 size={17} color={theme.success} />
                ) : (
                  <Sparkles size={17} color={theme.primary} />
                )}
              </View>
              <View style={styles.flexOne}>
                <Text style={[styles.readinessTitle, { color: theme.text }]}>
                  {readinessPercent === 100
                    ? "Tu perfil está listo al 100%"
                    : "Pendientes para destacar"}
                </Text>
                <Text
                  style={[styles.readinessSub, { color: theme.textSecondary }]}
                >
                  {readinessPercent === 100
                    ? "Tienes todo completo para postularte con un toque."
                    : `${completedCount} de ${totalTasks} pasos completados`}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.readinessPercent,
                {
                  color:
                    readinessPercent === 100 ? theme.success : theme.primary,
                },
              ]}
            >
              {readinessPercent}%
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
                  backgroundColor:
                    readinessPercent === 100 ? theme.success : theme.primary,
                  width: `${readinessPercent}%`,
                },
              ]}
            />
          </View>

          {pendingTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {pendingTasks.slice(0, 4).map((task, idx) => (
                <Pressable
                  key={task.id}
                  onPress={() => {
                    triggerLightHaptic();
                    router.push(task.route);
                  }}
                  style={({ pressed }) => [
                    styles.taskRow,
                    idx < Math.min(pendingTasks.length, 4) - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.divider,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.taskIconBox,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    {task.icon}
                  </View>
                  <View style={styles.flexOne}>
                    <View style={styles.taskTitleRow}>
                      <Text
                        style={[styles.taskTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      {task.required ? (
                        <View
                          style={[
                            styles.reqPill,
                            { backgroundColor: theme.primarySoft },
                          ]}
                        >
                          <Text
                            style={[styles.reqPillText, { color: theme.primary }]}
                          >
                            Requerido
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[styles.taskSub, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {task.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.textMuted} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {/* 2. Accesos rápidos en grid 2x2 */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoRow}>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                router.push("/(app)/tu/favoritos");
              }}
              style={({ pressed }) => [
                styles.bentoTile,
                { backgroundColor: cardBg, borderColor: cardBorder },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bentoTop}>
                <View style={[styles.bentoIcon, { backgroundColor: "#FF9500" }]}>
                  <Bookmark size={17} color="#FFFFFF" />
                </View>
                <ChevronRight size={15} color={theme.textMuted} />
              </View>
              <Text style={[styles.bentoTitle, { color: theme.text }]}>
                Favoritos
              </Text>
              <Text
                style={[styles.bentoMeta, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {favorites.length > 0
                  ? `${favorites.length} guardado${favorites.length === 1 ? "" : "s"}`
                  : "Sin guardados"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                router.push("/(app)/tu/entrevistas");
              }}
              style={({ pressed }) => [
                styles.bentoTile,
                { backgroundColor: cardBg, borderColor: cardBorder },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bentoTop}>
                <View style={[styles.bentoIcon, { backgroundColor: "#AF52DE" }]}>
                  <QrCode size={17} color="#FFFFFF" />
                </View>
                {activeInterviewsCount > 0 ? (
                  <View
                    style={[
                      styles.bentoBadge,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <Text
                      style={[styles.bentoBadgeText, { color: theme.primary }]}
                    >
                      {activeInterviewsCount}
                    </Text>
                  </View>
                ) : (
                  <ChevronRight size={15} color={theme.textMuted} />
                )}
              </View>
              <Text style={[styles.bentoTitle, { color: theme.text }]}>
                Entrevistas
              </Text>
              <Text
                style={[styles.bentoMeta, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {activeInterviewsCount > 0
                  ? `${activeInterviewsCount} pase${activeInterviewsCount === 1 ? "" : "s"} QR activo${activeInterviewsCount === 1 ? "" : "s"}`
                  : interviews.length > 0
                    ? `${interviews.length} en historial`
                    : "Sin citas aún"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.bentoRow}>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                router.push("/(app)/tu/solicitudes");
              }}
              style={({ pressed }) => [
                styles.bentoTile,
                { backgroundColor: cardBg, borderColor: cardBorder },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bentoTop}>
                <View style={[styles.bentoIcon, { backgroundColor: "#0A84FF" }]}>
                  <FileCheck2 size={17} color="#FFFFFF" />
                </View>
                {pendingDocRequestsCount > 0 ? (
                  <View
                    style={[
                      styles.bentoBadge,
                      { backgroundColor: theme.primarySoft },
                    ]}
                  >
                    <Text
                      style={[styles.bentoBadgeText, { color: theme.primary }]}
                    >
                      {pendingDocRequestsCount}
                    </Text>
                  </View>
                ) : (
                  <ChevronRight size={15} color={theme.textMuted} />
                )}
              </View>
              <Text style={[styles.bentoTitle, { color: theme.text }]}>
                Solicitudes
              </Text>
              <Text
                style={[styles.bentoMeta, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {pendingDocRequestsCount > 0
                  ? `${pendingDocRequestsCount} por responder`
                  : "Documentos al día"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                router.push("/(app)/tu/documentos");
              }}
              style={({ pressed }) => [
                styles.bentoTile,
                { backgroundColor: cardBg, borderColor: cardBorder },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bentoTop}>
                <View
                  style={[styles.bentoIcon, { backgroundColor: theme.primary }]}
                >
                  <FileText size={17} color="#FFFFFF" />
                </View>
                <ChevronRight size={15} color={theme.textMuted} />
              </View>
              <Text style={[styles.bentoTitle, { color: theme.text }]}>
                Documentos
              </Text>
              <Text
                style={[styles.bentoMeta, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {uploadedDocsCount} de {totalDocs} cargados
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Mis postulaciones */}
        <View style={styles.applicationsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Mis postulaciones
            </Text>
            {applications.length > 0 ? (
              <Text
                style={[styles.sectionCount, { color: theme.textSecondary }]}
              >
                {applications.length} total
              </Text>
            ) : null}
          </View>

          {applications.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTER_CHIPS.map((chip) => {
                const active = statusFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => {
                      if (Platform.OS !== "web") void Haptics.selectionAsync();
                      setStatusFilter(chip.id);
                    }}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: active ? theme.primary : cardBg,
                        borderColor: active ? theme.primary : cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: active ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {chip.label}
                      {chip.count > 0 ? ` (${chip.count})` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {applicationsQuery.isLoading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : applications.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <Briefcase size={24} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Aún no tienes postulaciones
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Cuando te postules a una vacante desde Inicio, aquí podrás ver
                si está en revisión, si te invitaron a entrevista, si fuiste
                aprobado o si el proceso concluyó.
              </Text>
              <View style={styles.emptyCta}>
                <AppButton
                  title="Explorar empleos"
                  onPress={() => router.navigate("/(app)")}
                />
              </View>
            </View>
          ) : filteredApplications.length === 0 ? (
            <View
              style={[
                styles.emptyFilterCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Text
                style={[styles.emptyFilterText, { color: theme.textSecondary }]}
              >
                No tienes postulaciones en esta categoría por ahora.
              </Text>
            </View>
          ) : (
            <View style={styles.appList}>
              {filteredApplications.map(renderApplicationCard)}
            </View>
          )}
        </View>
      </ScrollView>

      <JobDetailModal
        vacancy={selectedVacancy}
        onClose={() => setSelectedVacancy(null)}
        onFavoriteChanged={(id, isFavorite) =>
          setSelectedVacancy((prev) =>
            prev && prev.id_vacante === id
              ? { ...prev, es_favorito: isFavorite }
              : prev,
          )
        }
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
    paddingBottom: 130,
    gap: 18,
  },

  flexOne: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 4,
    gap: 2,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  subtitle: {
    fontSize: 13.5,
    marginTop: 2,
  },

  readinessCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },

  readinessHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  readinessTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  readinessIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  readinessTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  readinessSub: {
    fontSize: 12.5,
    marginTop: 1,
  },

  readinessPercent: {
    fontSize: 17,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
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

  tasksList: {
    marginTop: 2,
  },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
  },

  taskIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  taskTitle: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },

  reqPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },

  reqPillText: {
    fontSize: 10.5,
    fontWeight: "700",
  },

  taskSub: {
    fontSize: 12,
    marginTop: 1,
  },

  bentoGrid: {
    gap: 10,
  },

  bentoRow: {
    flexDirection: "row",
    gap: 10,
  },

  bentoTile: {
    flex: 1,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 4,
  },

  bentoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  bentoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  bentoBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  bentoBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  bentoTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  bentoMeta: {
    fontSize: 12.5,
  },

  applicationsSection: {
    gap: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
  },

  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },

  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  filterPillText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  loaderBox: {
    paddingVertical: 36,
    alignItems: "center",
  },

  appList: {
    gap: 11,
  },

  appCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    gap: 11,
  },

  appTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  appInfoCol: {
    flex: 1,
    gap: 3,
  },

  appTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  appCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  appCompany: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },

  appStatusMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  appMetaDate: {
    fontSize: 12,
    flex: 1,
  },

  appActionStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  appActionText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "700",
  },

  appNoteStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
  },

  appNoteText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "700",
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    gap: 9,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: "center",
  },

  emptyCta: {
    width: "100%",
    marginTop: 6,
  },

  emptyFilterCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    alignItems: "center",
  },

  emptyFilterText: {
    fontSize: 13.5,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.78,
  },
});
