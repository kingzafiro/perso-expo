export type EmployerPlanId = "basico" | "profesional" | "empresarial";
export type BillingCycle = "monthly" | "annual";
export type EmployerStatus = "draft" | "pending_payment" | "active";

export interface EmployerProfile {
  companyName: string;
  industry: string;
  companySize: string;
  city: string;
  contactName: string;
  contactRole: string;
  workEmail: string;
  phone: string;
  description: string;
  selectedPlanId: EmployerPlanId | null;
  billingCycle: BillingCycle;
  status: EmployerStatus;
  updatedAt: string;
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

export interface EmployerPlan {
  id: EmployerPlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  popular?: boolean;
  features: string[];
}

export const EMPLOYER_PLANS: EmployerPlan[] = [
  {
    id: "basico",
    name: "Básico",
    tagline: "Ideal para negocios y primeras contrataciones",
    monthlyPrice: 499,
    annualMonthlyPrice: 399,
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
    popular: true,
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
    features: [
      "Vacantes ilimitadas y múltiples reclutadores",
      "Máxima visibilidad en resultados locales",
      "Insignia de Empresa Verificada y soporte prioritario",
    ],
  },
];
