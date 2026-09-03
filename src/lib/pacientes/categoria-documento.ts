import {
  FileIcon,
  FileSignatureIcon,
  FlaskConicalIcon,
  ImageIcon,
  PillIcon,
  type LucideIcon,
} from "lucide-react";

import type { CategoriaDocumento } from "@/lib/types/database";

export const ETIQUETA_CATEGORIA: Record<CategoriaDocumento, string> = {
  laboratorio: "Laboratorio",
  imagen: "Imagen",
  receta: "Receta",
  consentimiento: "Consentimiento",
  otro: "Otro",
};

export const ICONO_CATEGORIA: Record<CategoriaDocumento, LucideIcon> = {
  laboratorio: FlaskConicalIcon,
  imagen: ImageIcon,
  receta: PillIcon,
  consentimiento: FileSignatureIcon,
  otro: FileIcon,
};

export const CATEGORIAS_DOCUMENTO: {
  value: CategoriaDocumento;
  label: string;
}[] = [
  { value: "laboratorio", label: "Laboratorios" },
  { value: "imagen", label: "Imágenes" },
  { value: "receta", label: "Recetas" },
  { value: "consentimiento", label: "Consentimientos" },
  { value: "otro", label: "Otros" },
];
