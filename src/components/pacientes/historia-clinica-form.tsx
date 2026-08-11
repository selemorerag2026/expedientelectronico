"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HistoriaClinicaSchema,
  type HistoriaClinicaFormValues,
} from "@/lib/validations/historia-clinica";
import type { ClinicoActionState } from "@/app/(app)/pacientes/[id]/actions";

export function HistoriaClinicaForm({
  defaultValues,
  mostrarGinecoobstetrico,
  onSubmit,
}: {
  defaultValues?: Partial<HistoriaClinicaFormValues>;
  mostrarGinecoobstetrico: boolean;
  onSubmit: (data: HistoriaClinicaFormValues) => Promise<ClinicoActionState>;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<HistoriaClinicaFormValues>({
    resolver: zodResolver(HistoriaClinicaSchema),
    defaultValues: {
      antecedentes_heredofamiliares: "",
      antecedentes_no_patologicos: {},
      antecedentes_patologicos: {},
      antecedentes_ginecoobstetricos: mostrarGinecoobstetrico ? {} : undefined,
      signos_vitales_iniciales: {},
      ...defaultValues,
    },
  });

  async function alEnviar(data: HistoriaClinicaFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) toast.error(resultado.error);
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="max-w-2xl">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Antecedentes heredofamiliares</FieldLegend>
          <Field>
            <FieldLabel htmlFor="heredofamiliares">
              Enfermedades relevantes por línea materna/paterna
            </FieldLabel>
            <Textarea
              id="heredofamiliares"
              {...register("antecedentes_heredofamiliares")}
            />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Antecedentes personales no patológicos</FieldLegend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="alimentacion">Alimentación</FieldLabel>
              <Input
                id="alimentacion"
                {...register("antecedentes_no_patologicos.alimentacion")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="actividad_fisica">
                Actividad física
              </FieldLabel>
              <Input
                id="actividad_fisica"
                {...register("antecedentes_no_patologicos.actividad_fisica")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tabaquismo">Tabaquismo</FieldLabel>
              <Input
                id="tabaquismo"
                {...register("antecedentes_no_patologicos.tabaquismo")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="alcohol">Alcohol</FieldLabel>
              <Input
                id="alcohol"
                {...register("antecedentes_no_patologicos.alcohol")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="otras_sustancias">
                Otras sustancias
              </FieldLabel>
              <Input
                id="otras_sustancias"
                {...register("antecedentes_no_patologicos.otras_sustancias")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ocupacion">Ocupación</FieldLabel>
              <Input
                id="ocupacion"
                {...register("antecedentes_no_patologicos.ocupacion")}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="vacunas">Esquema de vacunación</FieldLabel>
            <Textarea
              id="vacunas"
              {...register("antecedentes_no_patologicos.vacunas")}
            />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Antecedentes personales patológicos</FieldLegend>
          <Field>
            <FieldLabel htmlFor="enfermedades_cronicas">
              Enfermedades crónicas
            </FieldLabel>
            <Textarea
              id="enfermedades_cronicas"
              {...register("antecedentes_patologicos.enfermedades_cronicas")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cirugias_previas">
              Cirugías previas
            </FieldLabel>
            <Textarea
              id="cirugias_previas"
              {...register("antecedentes_patologicos.cirugias_previas")}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="hospitalizaciones">
                Hospitalizaciones
              </FieldLabel>
              <Input
                id="hospitalizaciones"
                {...register("antecedentes_patologicos.hospitalizaciones")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="transfusiones">Transfusiones</FieldLabel>
              <Input
                id="transfusiones"
                {...register("antecedentes_patologicos.transfusiones")}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="alergias_hc">Alergias</FieldLabel>
            <Textarea
              id="alergias_hc"
              {...register("antecedentes_patologicos.alergias")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="medicamentos_actuales">
              Medicamentos actuales
            </FieldLabel>
            <Textarea
              id="medicamentos_actuales"
              {...register("antecedentes_patologicos.medicamentos_actuales")}
            />
          </Field>
        </FieldSet>

        {mostrarGinecoobstetrico && (
          <FieldSet>
            <FieldLegend>Antecedentes gineco-obstétricos</FieldLegend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="menarca">Menarca</FieldLabel>
                <Input
                  id="menarca"
                  {...register("antecedentes_ginecoobstetricos.menarca")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="gestas">Gestas</FieldLabel>
                <Input
                  id="gestas"
                  {...register("antecedentes_ginecoobstetricos.gestas")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="partos">Partos</FieldLabel>
                <Input
                  id="partos"
                  {...register("antecedentes_ginecoobstetricos.partos")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="abortos">Abortos</FieldLabel>
                <Input
                  id="abortos"
                  {...register("antecedentes_ginecoobstetricos.abortos")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cesareas">Cesáreas</FieldLabel>
                <Input
                  id="cesareas"
                  {...register("antecedentes_ginecoobstetricos.cesareas")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fum">
                  Fecha de última menstruación
                </FieldLabel>
                <Input
                  id="fum"
                  {...register("antecedentes_ginecoobstetricos.fum")}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="metodo_anticonceptivo">
                Método anticonceptivo
              </FieldLabel>
              <Input
                id="metodo_anticonceptivo"
                {...register(
                  "antecedentes_ginecoobstetricos.metodo_anticonceptivo"
                )}
              />
            </Field>
          </FieldSet>
        )}

        <FieldSet>
          <FieldLegend>Exploración física inicial</FieldLegend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="ta">T/A</FieldLabel>
              <Input
                id="ta"
                placeholder="120/80"
                {...register("signos_vitales_iniciales.ta")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fc">FC</FieldLabel>
              <Input id="fc" {...register("signos_vitales_iniciales.fc")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fr">FR</FieldLabel>
              <Input id="fr" {...register("signos_vitales_iniciales.fr")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="temperatura">Temp.</FieldLabel>
              <Input
                id="temperatura"
                {...register("signos_vitales_iniciales.temperatura")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="spo2">SpO2</FieldLabel>
              <Input
                id="spo2"
                {...register("signos_vitales_iniciales.spo2")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="peso_kg">Peso (kg)</FieldLabel>
              <Input
                id="peso_kg"
                {...register("signos_vitales_iniciales.peso_kg")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="talla_cm">Talla (cm)</FieldLabel>
              <Input
                id="talla_cm"
                {...register("signos_vitales_iniciales.talla_cm")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="imc">IMC</FieldLabel>
              <Input id="imc" {...register("signos_vitales_iniciales.imc")} />
            </Field>
          </div>
        </FieldSet>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar ficha clínica"}
        </Button>
      </FieldGroup>
    </form>
  );
}
