import * as z from "zod";

export const CobroSchema = z.object({
  monto: z.number().min(0, { error: "El monto no puede ser negativo." }),
  metodo_pago: z
    .enum(["efectivo", "tarjeta", "transferencia", "sinpe", "otro"])
    .optional(),
  estado: z.enum(["pagado", "pendiente"]),
  notas: z.string().trim().optional(),
});

export type CobroFormValues = z.infer<typeof CobroSchema>;

export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "sinpe", label: "SINPE" },
  { value: "otro", label: "Otro" },
] as const;
