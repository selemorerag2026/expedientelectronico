import * as z from "zod";

export const PacienteSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(2, { error: "Ingresa el nombre completo." }),
  fecha_nacimiento: z
    .string()
    .min(1, { error: "Ingresa la fecha de nacimiento." })
    .refine((valor) => new Date(valor) <= new Date(), {
      error: "La fecha de nacimiento no puede ser en el futuro.",
    }),
  sexo: z.enum(["masculino", "femenino", "otro"]).optional(),
  cedula: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  correo: z
    .union([z.email({ error: "Ingresa un correo válido." }), z.literal("")])
    .optional(),
  direccion: z.string().trim().optional(),
  contacto_emergencia_nombre: z.string().trim().optional(),
  contacto_emergencia_telefono: z.string().trim().optional(),
  contacto_emergencia_parentesco: z.string().trim().optional(),
  tipo_sangre: z.string().trim().optional(),
  alergias: z.string().trim().optional(),
  seguro_medico: z.string().trim().optional(),
});

export type PacienteFormValues = z.infer<typeof PacienteSchema>;
