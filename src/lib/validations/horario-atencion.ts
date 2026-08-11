import * as z from "zod";

export const HorarioAtencionSchema = z
  .object({
    dia_semana: z.number().int().min(0).max(6),
    hora_inicio: z.string().min(1, { error: "Ingresa la hora de inicio." }),
    hora_fin: z.string().min(1, { error: "Ingresa la hora de fin." }),
  })
  .refine((data) => data.hora_fin > data.hora_inicio, {
    error: "La hora de fin debe ser después de la hora de inicio.",
    path: ["hora_fin"],
  });

export type HorarioAtencionFormValues = z.infer<typeof HorarioAtencionSchema>;

export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;
