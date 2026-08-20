import type { EstadoCobroCalculado } from "@/lib/types/database";

export const ETIQUETA_ESTADO_COBRO: Record<EstadoCobroCalculado, string> = {
  pendiente: "Pendiente",
  parcial: "Pago parcial",
  pagado: "Pagado",
};

export const BADGE_VARIANT_ESTADO_COBRO: Record<
  EstadoCobroCalculado,
  "default" | "secondary" | "outline"
> = {
  pendiente: "secondary",
  parcial: "outline",
  pagado: "default",
};

export const ESTADOS_COBRO: { value: EstadoCobroCalculado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Pago parcial" },
  { value: "pagado", label: "Pagado" },
];
