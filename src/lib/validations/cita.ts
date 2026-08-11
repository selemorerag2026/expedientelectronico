import * as z from "zod";

export const CitaSchema = z.object({
  paciente_id: z.uuid({ error: "Selecciona un paciente." }),
  servicio_id: z.uuid({ error: "Selecciona un servicio." }),
  fecha: z.string().min(1, { error: "Ingresa la fecha." }),
  hora: z.string().min(1, { error: "Ingresa la hora." }),
  duracion_minutos: z
    .number()
    .int()
    .positive({ error: "La duración debe ser mayor a cero." }),
  notas_administrativas: z.string().trim().optional(),
});

export type CitaFormValues = z.infer<typeof CitaSchema>;

export const PacienteRapidoSchema = z.object({
  nombre_completo: z.string().trim().min(2, { error: "Ingresa el nombre." }),
  fecha_nacimiento: z
    .string()
    .min(1, { error: "Ingresa la fecha de nacimiento." }),
  telefono: z.string().trim().optional(),
  cedula: z.string().trim().optional(),
});

export type PacienteRapidoFormValues = z.infer<typeof PacienteRapidoSchema>;
