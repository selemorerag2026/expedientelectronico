import * as z from "zod";

export const AgendarPublicoSchema = z.object({
  nombre_completo: z.string().trim().min(2, { error: "Ingresa tu nombre completo." }),
  fecha_nacimiento: z
    .string()
    .min(1, { error: "Ingresa tu fecha de nacimiento." }),
  telefono: z
    .string()
    .trim()
    .min(1, { error: "Ingresa un teléfono de contacto." }),
  correo: z
    .union([z.email({ error: "Ingresa un correo válido." }), z.literal("")])
    .optional(),
  cedula: z.string().trim().optional(),
});

export type AgendarPublicoFormValues = z.infer<typeof AgendarPublicoSchema>;
