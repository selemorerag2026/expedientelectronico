import * as z from "zod";

// Un "cobro" ahora solo representa el monto total adeudado. El pago
// (parcial o completo) se registra aparte, ver src/lib/validations/pago.ts.
export const CobroSchema = z.object({
  monto: z.number().min(0.01, { error: "El monto debe ser mayor a cero." }),
  notas: z.string().trim().optional(),
});

export type CobroFormValues = z.infer<typeof CobroSchema>;
