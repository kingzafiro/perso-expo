import { z } from "zod";

export const companyStepSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Ingresa el nombre comercial de tu empresa"),
  industry: z.string().trim().min(1, "Selecciona el sector de tu empresa"),
  companySize: z.string().trim().min(1, "Selecciona el tamaño del equipo"),
  city: z.string().trim().min(2, "Selecciona una ciudad desde el buscador"),
});

export type CompanyStepForm = z.infer<typeof companyStepSchema>;

export const contactStepSchema = z.object({
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

export type ContactStepForm = z.infer<typeof contactStepSchema>;

export const createVacancySchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(3, "Ingresa un título de puesto claro (mínimo 3 caracteres)")
      .max(140, "Máximo 140 caracteres"),
    modalidad: z.enum(["presencial", "hibrido", "remoto"]),
    tipo_contrato: z.enum([
      "tiempo_completo",
      "medio_tiempo",
      "tiempo_indeterminado",
      "contrato_independiente",
      "temporal",
      "practicas",
    ]),
    ciudad: z.string().trim().min(2, "Selecciona la ciudad desde Google Maps"),
    codigo_postal: z.string().trim().max(10).optional(),
    zona_colonia: z.string().trim().max(120).optional(),
    salario_min: z.string().trim().optional(),
    salario_max: z.string().trim().optional(),
    salario_periodo: z.enum(["mensual", "quincenal", "semanal", "proyecto"]),
    horario: z.string().trim().max(120).optional(),
    experiencia: z.string().trim().max(100).optional(),
    escolaridad: z.string().trim().max(120).optional(),
    descripcion: z
      .string()
      .trim()
      .min(20, "Describe el puesto (mínimo 20 caracteres)")
      .max(6000, "Máximo 6000 caracteres"),
    responsabilidades: z.string().trim().max(6000).optional(),
    requisitos: z.string().trim().max(6000).optional(),
    perfil_tecnico: z.string().trim().max(6000).optional(),
    ofrecemos: z.string().trim().max(4000).optional(),
    contacto_visible: z.string().trim().max(160).optional(),
  })
  .refine(
    (data) => {
      const min = data.salario_min ? Number(data.salario_min) : null;
      const max = data.salario_max ? Number(data.salario_max) : null;
      if (
        min !== null &&
        max !== null &&
        Number.isFinite(min) &&
        Number.isFinite(max)
      ) {
        return max >= min;
      }
      return true;
    },
    {
      message: "El salario máximo debe ser mayor o igual al mínimo",
      path: ["salario_max"],
    },
  );

export type CreateVacancyForm = z.infer<typeof createVacancySchema>;
