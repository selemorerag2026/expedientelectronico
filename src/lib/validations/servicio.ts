import * as z from "zod";

export const ServicioSchema = z.object({
  nombre: z.string().trim().min(2, { error: "Ingresa el nombre del servicio." }),
  descripcion: z.string().trim().optional(),
  duracion_minutos: z
    .number()
    .int()
    .positive({ error: "La duración debe ser mayor a cero." }),
  visible_portal_publico: z.boolean(),
});

export type ServicioFormValues = z.infer<typeof ServicioSchema>;
