"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Cie10Buscador } from "@/components/pacientes/cie10-buscador";
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
  NotaEvolucionSchema,
  type NotaEvolucionFormValues,
} from "@/lib/validations/nota-evolucion";
import type { ClinicoActionState } from "@/app/(app)/pacientes/[id]/actions";

export function NotaEvolucionForm({
  onSubmit,
}: {
  onSubmit: (data: NotaEvolucionFormValues) => Promise<ClinicoActionState>;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NotaEvolucionFormValues>({
    resolver: zodResolver(NotaEvolucionSchema),
    defaultValues: {
      motivo_consulta: "",
      subjetivo: "",
      objetivo: {},
      analisis: "",
      diagnosticos: [],
      plan_tratamiento: "",
      medicamentos: [],
      indicaciones: "",
      estudios_solicitados: "",
      proxima_cita_recomendada: "",
    },
  });

  const diagnosticos = useFieldArray({ control, name: "diagnosticos" });
  const medicamentos = useFieldArray({ control, name: "medicamentos" });

  async function alEnviar(data: NotaEvolucionFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) toast.error(resultado.error);
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="max-w-2xl">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>S — Subjetivo</FieldLegend>
          <Field>
            <FieldLabel htmlFor="motivo_consulta">
              Motivo de consulta
            </FieldLabel>
            <Input id="motivo_consulta" {...register("motivo_consulta")} />
            {errors.motivo_consulta && (
              <p className="text-sm text-destructive">
                {errors.motivo_consulta.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="subjetivo">
              Historia de la enfermedad actual
            </FieldLabel>
            <Textarea id="subjetivo" {...register("subjetivo")} />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>O — Objetivo</FieldLegend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="obj_ta">T/A</FieldLabel>
              <Input id="obj_ta" {...register("objetivo.ta")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_fc">FC</FieldLabel>
              <Input id="obj_fc" {...register("objetivo.fc")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_fr">FR</FieldLabel>
              <Input id="obj_fr" {...register("objetivo.fr")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_temperatura">Temp.</FieldLabel>
              <Input
                id="obj_temperatura"
                {...register("objetivo.temperatura")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_spo2">SpO2</FieldLabel>
              <Input id="obj_spo2" {...register("objetivo.spo2")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_peso">Peso (kg)</FieldLabel>
              <Input id="obj_peso" {...register("objetivo.peso_kg")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_talla">Talla (cm)</FieldLabel>
              <Input id="obj_talla" {...register("objetivo.talla_cm")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="obj_imc">IMC</FieldLabel>
              <Input id="obj_imc" {...register("objetivo.imc")} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="hallazgos_exploracion">
              Hallazgos de la exploración física
            </FieldLabel>
            <Textarea
              id="hallazgos_exploracion"
              {...register("objetivo.hallazgos_exploracion")}
            />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>A — Análisis</FieldLegend>
          <Field>
            <FieldLabel htmlFor="analisis">Impresión diagnóstica</FieldLabel>
            <Textarea id="analisis" {...register("analisis")} />
          </Field>

          <Field>
            <FieldLabel>Diagnósticos</FieldLabel>
            <Cie10Buscador
              onSeleccionar={(item) => diagnosticos.append(item)}
            />
            <div className="flex flex-col gap-2">
              {diagnosticos.fields.map((campo, index) => (
                <div key={campo.id} className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Código CIE-10 (opcional)"
                    className="w-full sm:w-40"
                    {...register(`diagnosticos.${index}.codigo`)}
                  />
                  <Input
                    placeholder="Descripción del diagnóstico"
                    className="min-w-40 flex-1"
                    {...register(`diagnosticos.${index}.descripcion`)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => diagnosticos.remove(index)}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() =>
                  diagnosticos.append({ codigo: "", descripcion: "" })
                }
              >
                Agregar diagnóstico manual (sin buscar)
              </Button>
            </div>
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>P — Plan</FieldLegend>
          <Field>
            <FieldLabel htmlFor="plan_tratamiento">
              Tratamiento indicado
            </FieldLabel>
            <Textarea
              id="plan_tratamiento"
              {...register("plan_tratamiento")}
            />
          </Field>

          <Field>
            <FieldLabel>Medicamentos recetados</FieldLabel>
            <div className="flex flex-col gap-2">
              {medicamentos.fields.map((campo, index) => (
                <div
                  key={campo.id}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Nombre"
                    {...register(`medicamentos.${index}.nombre`)}
                  />
                  <Input
                    placeholder="Dosis"
                    {...register(`medicamentos.${index}.dosis`)}
                  />
                  <Input
                    placeholder="Frecuencia"
                    {...register(`medicamentos.${index}.frecuencia`)}
                  />
                  <Input
                    placeholder="Duración"
                    {...register(`medicamentos.${index}.duracion`)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => medicamentos.remove(index)}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() =>
                  medicamentos.append({
                    nombre: "",
                    dosis: "",
                    frecuencia: "",
                    duracion: "",
                  })
                }
              >
                Agregar medicamento
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="indicaciones">Indicaciones</FieldLabel>
            <Textarea id="indicaciones" {...register("indicaciones")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="estudios_solicitados">
              Estudios solicitados
            </FieldLabel>
            <Textarea
              id="estudios_solicitados"
              {...register("estudios_solicitados")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="proxima_cita_recomendada">
              Próxima cita recomendada
            </FieldLabel>
            <Input
              id="proxima_cita_recomendada"
              type="date"
              className="w-fit"
              {...register("proxima_cita_recomendada")}
            />
          </Field>
        </FieldSet>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar nota de evolución"}
        </Button>
      </FieldGroup>
    </form>
  );
}
