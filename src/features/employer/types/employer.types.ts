export type EmployerPlanId = "basico" | "profesional" | "empresarial";
export type BillingCycle = "monthly" | "annual";
export type EmployerSubscriptionStatus =
  | "draft"
  | "trialing"
  | "active"
  | "grace_period"
  | "past_due"
  | "canceled"
  | "expired";

export type VacancyModality = "presencial" | "hibrido" | "remoto";
export type VacancyContractType =
  | "tiempo_completo"
  | "medio_tiempo"
  | "tiempo_indeterminado"
  | "contrato_independiente"
  | "temporal"
  | "practicas";
export type VacancySalaryPeriod =
  | "mensual"
  | "quincenal"
  | "semanal"
  | "proyecto";
export type VacancyStatus = "activa" | "pausada" | "cerrada";
export type ApplicationStatus =
  | "enviada"
  | "en_revision"
  | "entrevista"
  | "descartada"
  | "contratado";
export type VacancyReportReason =
  | "fraude"
  | "informacion_falsa"
  | "salario_enganoso"
  | "discriminacion"
  | "duplicada"
  | "otro";

export interface EmployerProfile {
  id_empresa?: number;
  companyName: string;
  legalName: string;
  rfc: string;
  industry: string;
  companySize: string;
  city: string;
  contactName: string;
  contactRole: string;
  workEmail: string;
  phone: string;
  description: string;
  hasVerificationDocument?: boolean;
  verified?: boolean;
  updatedAt: string;
}

export interface EmployerPdfExtraction {
  rfc: string;
  razonSocial: string;
  tipoContribuyente: "persona_moral" | "persona_fisica" | "desconocido";
  documentoDetectado: string;
  confianza: number;
  proveedor: string;
}

export interface EmployerSubscription {
  id_suscripcion?: number;
  planId: EmployerPlanId | null;
  billingCycle: BillingCycle;
  status: EmployerSubscriptionStatus;
  provider:
    | "revenuecat_ios"
    | "revenuecat_android"
    | "revenuecat_web"
    | "sandbox";
  entitlementId: string;
  productId: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  willRenew: boolean;
  canceledAt: string | null;
  daysRemaining: number;
  hasAccess: boolean;
}

export interface EmployerLimits {
  maxActiveVacancies: number | null;
  activeVacancies: number;
  trialDays: number;
}

export interface EmployerStatusPayload {
  empresa: EmployerProfile | null;
  suscripcion: EmployerSubscription | null;
  hasAccess: boolean;
  isAdmin?: boolean;
  limits: EmployerLimits;
  sandboxEnabled: boolean;
  migrationPending?: boolean;
}

export interface VacancyCompanySummary {
  id_empresa: number;
  nombre_comercial: string;
  industria: string;
  ciudad: string;
  verificada: boolean;
  contacto_nombre?: string;
  contacto_cargo?: string;
}

export interface EmployerVacancy {
  id_vacante: number;
  id_empresa: number;
  titulo: string;
  modalidad: VacancyModality;
  tipo_contrato: VacancyContractType;
  ciudad: string;
  codigo_postal: string;
  zona_colonia: string;
  salario_min: number | null;
  salario_max: number | null;
  salario_periodo: VacancySalaryPeriod;
  horario: string;
  experiencia: string;
  escolaridad: string;
  beneficios: string[];
  descripcion: string;
  responsabilidades: string;
  requisitos: string;
  perfil_tecnico: string;
  ofrecemos: string;
  contacto_visible: string;
  estado: VacancyStatus;
  postulantes_count: number;
  ya_postulado?: boolean;
  estado_postulacion?: ApplicationStatus | null;
  empresa?: VacancyCompanySummary | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VacancyApplicant {
  id_postulacion: number;
  id_vacante: number;
  estado: ApplicationStatus;
  mensaje_presentacion: string;
  createdAt: string | null;
  candidato: {
    id_usuario: number;
    nombre: string;
    email: string;
    celular: string;
    foto_perfil: string | null;
  } | null;
}

export interface AdminOverview {
  empresas: number;
  vacantesActivas: number;
  postulaciones: number;
  reportesPendientes: number;
}

export interface AdminReport {
  id_reporte: number;
  motivo: VacancyReportReason;
  detalles: string;
  estado: "pendiente" | "revisado" | "descartado";
  createdAt: string | null;
  vacante: {
    id_vacante: number;
    titulo: string;
    estado: VacancyStatus;
    empresa: string;
  } | null;
  reportante: {
    nombre: string;
    email: string;
  } | null;
}

export const EMPLOYER_INDUSTRIES = [
  "Tecnología",
  "Manufactura",
  "Retail y Comercio",
  "Logística",
  "Servicios",
  "Salud",
  "Finanzas",
  "Gastronomía",
  "Construcción",
  "Educación",
  "Otro",
] as const;

export const EMPLOYER_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "500+",
] as const;

export const VACANCY_MODALITIES: { id: VacancyModality; label: string }[] = [
  { id: "presencial", label: "Empleo presencial" },
  { id: "hibrido", label: "Trabajo híbrido" },
  { id: "remoto", label: "Trabajo remoto" },
];

export const VACANCY_CONTRACTS: { id: VacancyContractType; label: string }[] = [
  { id: "tiempo_completo", label: "Tiempo completo" },
  { id: "tiempo_indeterminado", label: "Por tiempo indeterminado" },
  { id: "medio_tiempo", label: "Medio tiempo" },
  { id: "contrato_independiente", label: "Contrato independiente" },
  { id: "temporal", label: "Temporal" },
  { id: "practicas", label: "Prácticas" },
];

export const VACANCY_SALARY_PERIODS: {
  id: VacancySalaryPeriod;
  label: string;
  suffix: string;
}[] = [
  { id: "mensual", label: "Mensual", suffix: "por mes" },
  { id: "quincenal", label: "Quincenal", suffix: "por quincena" },
  { id: "semanal", label: "Semanal", suffix: "por semana" },
  { id: "proyecto", label: "Por proyecto", suffix: "por proyecto" },
];

export const VACANCY_BENEFITS_PRESETS = [
  "Prestaciones de ley",
  "Prestaciones superiores",
  "Vales de despensa",
  "Seguro de vida",
  "Seguro de gastos médicos",
  "Opción a contrato indefinido",
  "Oportunidades de crecimiento",
  "Horario flexible",
  "Home office",
  "Pagos quincenales",
  "Capacitación pagada",
  "Bono de productividad",
] as const;

export const VACANCY_REPORT_REASONS: {
  id: VacancyReportReason;
  label: string;
}[] = [
  { id: "fraude", label: "Posible fraude o estafa" },
  { id: "salario_enganoso", label: "Salario o condiciones engañosas" },
  { id: "informacion_falsa", label: "Información falsa de la empresa" },
  { id: "discriminacion", label: "Contenido discriminatorio" },
  { id: "duplicada", label: "Vacante duplicada o vencida" },
  { id: "otro", label: "Otro motivo" },
];

export interface EmployerPlan {
  id: EmployerPlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  trialDays: number;
  maxActiveVacancies: number | null;
  popular?: boolean;
  storeProductIds: {
    monthly: string;
    annual: string;
  };
  features: string[];
}

export const EMPLOYER_PLANS: EmployerPlan[] = [
  {
    id: "basico",
    name: "Básico",
    tagline: "Ideal para negocios y primeras contrataciones",
    monthlyPrice: 499,
    annualMonthlyPrice: 399,
    trialDays: 14,
    maxActiveVacancies: 3,
    storeProductIds: {
      monthly: "perso_basico_monthly",
      annual: "perso_basico_annual",
    },
    features: [
      "Hasta 3 vacantes activas simultáneas",
      "Perfil público de empresa en Perso",
      "Recepción de CVs y gestión de postulantes",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    tagline: "Para equipos en crecimiento que buscan talento verificado",
    monthlyPrice: 999,
    annualMonthlyPrice: 799,
    trialDays: 14,
    maxActiveVacancies: 15,
    popular: true,
    storeProductIds: {
      monthly: "perso_profesional_monthly",
      annual: "perso_profesional_annual",
    },
    features: [
      "Hasta 15 vacantes activas + posicionamiento destacado",
      "Acceso a candidatos con expediente documental validado",
      "Filtros avanzados por ubicación, inglés y experiencia",
    ],
  },
  {
    id: "empresarial",
    name: "Empresarial",
    tagline: "Reclutamiento continuo de alto volumen",
    monthlyPrice: 2499,
    annualMonthlyPrice: 1999,
    trialDays: 14,
    maxActiveVacancies: null,
    storeProductIds: {
      monthly: "perso_empresarial_monthly",
      annual: "perso_empresarial_annual",
    },
    features: [
      "Vacantes ilimitadas y múltiples reclutadores",
      "Máxima visibilidad en resultados locales",
      "Insignia de Empresa Verificada y soporte prioritario",
    ],
  },
];

export function getEmployerPlanById(
  planId?: EmployerPlanId | null,
): EmployerPlan | null {
  if (!planId) return null;
  return EMPLOYER_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function formatVacancySalary(
  min: number | null,
  max: number | null,
  periodo: VacancySalaryPeriod = "mensual",
) {
  const suffix =
    VACANCY_SALARY_PERIODS.find((p) => p.id === periodo)?.suffix ?? "por mes";
  if (min && max && min !== max) {
    return `$${min.toLocaleString("es-MX")} a $${max.toLocaleString("es-MX")} ${suffix}`;
  }
  if (min) return `$${min.toLocaleString("es-MX")} ${suffix}`;
  if (max) return `$${max.toLocaleString("es-MX")} ${suffix}`;
  return "Sueldo a convenir";
}

export function formatVacancyLocation(vacancy: {
  codigo_postal?: string;
  zona_colonia?: string;
  ciudad?: string;
}) {
  return [vacancy.codigo_postal, vacancy.zona_colonia, vacancy.ciudad]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}
