import * as z from "zod";

export const PagoSchema = z.object({
  monto: z.number().min(0.01, { error: "El monto debe ser mayor a cero." }),
  metodo_pago: z.enum(["efectivo", "tarjeta", "transferencia", "sinpe", "otro"], {
    error: "Selecciona un método de pago.",
  }),
  fecha_pago: z.string().min(1, { error: "Selecciona la fecha del pago." }),
  notas: z.string().trim().optional(),
});

export type PagoFormValues = z.infer<typeof PagoSchema>;

export const MotivoAnulacionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, { error: "Escribe el motivo de la anulación." }),
});

export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "sinpe", label: "SINPE" },
  { value: "otro", label: "Otro" },
] as const;
