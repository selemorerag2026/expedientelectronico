import { fechaHoyISO } from "@/lib/fecha";
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

// "Vencido" no es un estado_calculado aparte (eso sigue siendo
// pendiente/parcial/pagado, calculado en la base de datos) — es
// saldo pendiente + fecha_vencimiento ya pasada, calculado aquí porque
// depende de la fecha de HOY, no de una columna fija de la fila.
export function esVencido(cobro: {
  saldo: number;
  fecha_vencimiento: string | null;
}): boolean {
  if (cobro.saldo <= 0 || !cobro.fecha_vencimiento) return false;
  return cobro.fecha_vencimiento < fechaHoyISO();
}

export function estadoVisualCobro(cobro: {
  estado_calculado: EstadoCobroCalculado;
  saldo: number;
  fecha_vencimiento: string | null;
}): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  if (esVencido(cobro)) {
    return { label: "Vencido", variant: "destructive" };
  }
  return {
    label: ETIQUETA_ESTADO_COBRO[cobro.estado_calculado],
    variant: BADGE_VARIANT_ESTADO_COBRO[cobro.estado_calculado],
  };
}
