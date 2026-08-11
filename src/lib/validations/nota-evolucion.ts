import * as z from "zod";

const textoOpcional = z.string().trim().optional();

export const NotaEvolucionSchema = z.object({
  motivo_consulta: z
    .string()
    .trim()
    .min(1, { error: "Ingresa el motivo de consulta." }),
  subjetivo: textoOpcional,
  objetivo: z.object({
    ta: textoOpcional,
    fc: textoOpcional,
    fr: textoOpcional,
    temperatura: textoOpcional,
    spo2: textoOpcional,
    peso_kg: textoOpcional,
    talla_cm: textoOpcional,
    imc: textoOpcional,
    hallazgos_exploracion: textoOpcional,
  }),
  analisis: textoOpcional,
  diagnosticos: z.array(
    z.object({
      codigo: textoOpcional,
      descripcion: z
        .string()
        .trim()
        .min(1, { error: "Ingresa la descripción del diagnóstico." }),
    })
  ),
  plan_tratamiento: textoOpcional,
  medicamentos: z.array(
    z.object({
      nombre: z
        .string()
        .trim()
        .min(1, { error: "Ingresa el nombre del medicamento." }),
      dosis: textoOpcional,
      frecuencia: textoOpcional,
      duracion: textoOpcional,
    })
  ),
  indicaciones: textoOpcional,
  estudios_solicitados: textoOpcional,
  proxima_cita_recomendada: textoOpcional,
});

export type NotaEvolucionFormValues = z.infer<typeof NotaEvolucionSchema>;
