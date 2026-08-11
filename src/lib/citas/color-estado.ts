import type { EstadoCita } from "@/lib/types/database";

export const COLOR_POR_ESTADO: Record<EstadoCita, string> = {
  agendada: "#94a3b8",
  confirmada: "#3b82f6",
  en_curso: "#f59e0b",
  completada: "#22c55e",
  cancelada: "#ef4444",
  no_show: "#78716c",
};

export const ESTADOS_CITA: { value: EstadoCita; label: string }[] = [
  { value: "agendada", label: "Agendada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "en_curso", label: "En curso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_show", label: "No se presentó" },
];
