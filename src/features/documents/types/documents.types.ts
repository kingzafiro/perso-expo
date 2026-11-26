export type DocumentType =
  | "cv"
  | "ine"
  | "ine_atras"
  | "pasaporte"
  | "visa"
  | "curp"
  | "rfc"
  | "constancia_fiscal"
  | "nss"
  | "acta_nacimiento"
  | "comprobante_domicilio"
  | "dc3"
  | "constancia_trabajos"
  | "credenciales"
  | "ingles";

export type DocumentFormat = "pdf" | "image";
export type DocumentFrameMode = "id_card" | "passport" | "visa";

export interface DocumentItemStatus {
  tipo: DocumentType;
  etiqueta: string;
  formato: DocumentFormat;
  oficial: boolean;
  subido: boolean;
  archivo: string | null;
  url: string | null;
}

export type DocumentsMap = Record<DocumentType, DocumentItemStatus>;

export interface UserDocumentsResponse {
  ok: boolean;
  documentos: DocumentsMap;
}

export interface UploadDocumentResponse {
  ok: boolean;
  mensaje: string;
  documento: DocumentItemStatus & {
    verificacion?: {
      estado: string;
      proveedor: string;
      confianza?: number;
      documentoDetectado?: string;
    };
  };
}

export interface DocumentMeta {
  tipo: DocumentType;
  titulo: string;
  descripcion: string;
  formato: DocumentFormat;
  endpoint: string;
  oficial: boolean;
  frameMode?: DocumentFrameMode;
  guiaCamara?: string;
  color: string;
}

export const DOCUMENT_META: Record<DocumentType, DocumentMeta> = {
  cv: {
    tipo: "cv",
    titulo: "Currículum Vitae (CV)",
    descripcion: "Sube tu CV actualizado en PDF (máx. 6 páginas).",
    formato: "pdf",
    endpoint: "/upload/cv",
    oficial: false,
    color: "#F06808",
  },
  ine: {
    tipo: "ine",
    titulo: "INE (Frente)",
    descripcion: "Foto clara de la parte frontal de tu credencial vigente.",
    formato: "image",
    endpoint: "/upload/ine",
    oficial: true,
    frameMode: "id_card",
    guiaCamara: "Alinea el frente de tu INE dentro del marco",
    color: "#0A84FF",
  },
  ine_atras: {
    tipo: "ine_atras",
    titulo: "INE (Reverso)",
    descripcion: "Foto clara del reverso con código QR y firma visibles.",
    formato: "image",
    endpoint: "/upload/ine/atras",
    oficial: true,
    frameMode: "id_card",
    guiaCamara: "Alinea el reverso de tu INE dentro del marco",
    color: "#0A84FF",
  },
  pasaporte: {
    tipo: "pasaporte",
    titulo: "Pasaporte",
    descripcion: "Página principal con tu fotografía y datos legibles.",
    formato: "image",
    endpoint: "/upload/pasaporte",
    oficial: true,
    frameMode: "passport",
    guiaCamara: "Encuadra la página de datos de tu pasaporte",
    color: "#5856D6",
  },
  visa: {
    tipo: "visa",
    titulo: "Visa",
    descripcion: "Fotografía nítida de tu visa vigente.",
    formato: "image",
    endpoint: "/upload/visa",
    oficial: true,
    frameMode: "visa",
    guiaCamara: "Alinea tu visa dentro del marco",
    color: "#AF52DE",
  },
  curp: {
    tipo: "curp",
    titulo: "CURP",
    descripcion: "Descarga oficial en PDF desde gob.mx/curp.",
    formato: "pdf",
    endpoint: "/upload/curp",
    oficial: true,
    color: "#34C759",
  },
  rfc: {
    tipo: "rfc",
    titulo: "RFC",
    descripcion: "Documento oficial del SAT en formato PDF.",
    formato: "pdf",
    endpoint: "/upload/rfc",
    oficial: true,
    color: "#30B0C7",
  },
  constancia_fiscal: {
    tipo: "constancia_fiscal",
    titulo: "Constancia de Situación Fiscal",
    descripcion: "PDF vigente emitido por el SAT con código QR.",
    formato: "pdf",
    endpoint: "/upload/fiscal",
    oficial: true,
    color: "#007AFF",
  },
  nss: {
    tipo: "nss",
    titulo: "Número de Seguridad Social (NSS)",
    descripcion: "Constancia oficial del IMSS en PDF.",
    formato: "pdf",
    endpoint: "/upload/nss",
    oficial: true,
    color: "#28A745",
  },
  acta_nacimiento: {
    tipo: "acta_nacimiento",
    titulo: "Acta de nacimiento",
    descripcion: "Copia certificada en formato PDF.",
    formato: "pdf",
    endpoint: "/upload/acta",
    oficial: true,
    color: "#FF9500",
  },
  comprobante_domicilio: {
    tipo: "comprobante_domicilio",
    titulo: "Comprobante de domicilio",
    descripcion: "Recibo de luz, agua, teléfono o estado de cuenta (PDF).",
    formato: "pdf",
    endpoint: "/upload/domicilio",
    oficial: false,
    color: "#FF6B35",
  },
  dc3: {
    tipo: "dc3",
    titulo: "Constancia DC-3",
    descripcion: "Constancia de competencias o habilidades laborales (PDF).",
    formato: "pdf",
    endpoint: "/upload/dc3",
    oficial: false,
    color: "#8E8E93",
  },
  constancia_trabajos: {
    tipo: "constancia_trabajos",
    titulo: "Constancias laborales",
    descripcion: "Cartas de recomendación o constancias de empleos anteriores.",
    formato: "pdf",
    endpoint: "/upload/trabajos",
    oficial: false,
    color: "#636366",
  },
  credenciales: {
    tipo: "credenciales",
    titulo: "Credenciales o licencias",
    descripcion: "Licencia de conducir, cédula o certificaciones técnicas (PDF).",
    formato: "pdf",
    endpoint: "/upload/credenciales",
    oficial: false,
    color: "#5E5CE6",
  },
  ingles: {
    tipo: "ingles",
    titulo: "Certificado de inglés",
    descripcion: "TOEFL, IELTS, Cambridge u otro aval oficial (PDF).",
    formato: "pdf",
    endpoint: "/upload/ingles",
    oficial: false,
    color: "#0A84FF",
  },
};

export interface DocumentSectionGroup {
  title: string;
  items: DocumentType[];
}

export const DOCUMENT_SECTIONS: DocumentSectionGroup[] = [
  {
    title: "Identificación oficial",
    items: ["ine", "ine_atras", "pasaporte", "visa"],
  },
  {
    title: "Fiscales y seguridad social",
    items: ["curp", "rfc", "constancia_fiscal", "nss"],
  },
  {
    title: "Personales y domicilio",
    items: ["acta_nacimiento", "comprobante_domicilio"],
  },
  {
    title: "Certificados y constancias",
    items: ["dc3", "constancia_trabajos", "credenciales", "ingles"],
  },
];
