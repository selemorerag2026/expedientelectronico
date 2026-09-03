import type { TipoCita } from "@/lib/types/database";

// Color del calendario por TIPO de cita (no por estado — para eso está
// color-estado.ts, que sigue usándose en el selector de estado de la cita).
export const COLOR_POR_TIPO: Record<TipoCita, string> = {
  consulta: "var(--seafoam)",
  primera_vez: "var(--teal-700)",
  procedimiento: "var(--mineral-500)",
};

export const TIPOS_CITA: { value: TipoCita; label: string }[] = [
  { value: "consulta", label: "Consulta / control" },
  { value: "primera_vez", label: "Primera vez" },
  { value: "procedimiento", label: "Procedimiento" },
];
