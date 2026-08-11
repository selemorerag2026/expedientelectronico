import * as z from "zod";

const textoOpcional = z.string().trim().optional();

export const HistoriaClinicaSchema = z.object({
  antecedentes_heredofamiliares: textoOpcional,
  antecedentes_no_patologicos: z.object({
    alimentacion: textoOpcional,
    actividad_fisica: textoOpcional,
    tabaquismo: textoOpcional,
    alcohol: textoOpcional,
    otras_sustancias: textoOpcional,
    ocupacion: textoOpcional,
    vacunas: textoOpcional,
  }),
  antecedentes_patologicos: z.object({
    enfermedades_cronicas: textoOpcional,
    cirugias_previas: textoOpcional,
    hospitalizaciones: textoOpcional,
    transfusiones: textoOpcional,
    alergias: textoOpcional,
    medicamentos_actuales: textoOpcional,
  }),
  antecedentes_ginecoobstetricos: z
    .object({
      menarca: textoOpcional,
      gestas: textoOpcional,
      partos: textoOpcional,
      abortos: textoOpcional,
      cesareas: textoOpcional,
      fum: textoOpcional,
      metodo_anticonceptivo: textoOpcional,
    })
    .optional(),
  signos_vitales_iniciales: z.object({
    ta: textoOpcional,
    fc: textoOpcional,
    fr: textoOpcional,
    temperatura: textoOpcional,
    spo2: textoOpcional,
    peso_kg: textoOpcional,
    talla_cm: textoOpcional,
    imc: textoOpcional,
  }),
});

export type HistoriaClinicaFormValues = z.infer<typeof HistoriaClinicaSchema>;
