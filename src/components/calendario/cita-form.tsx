"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { PacienteCombobox } from "@/components/calendario/paciente-combobox";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Servicio } from "@/lib/types/database";
import { CitaSchema, type CitaFormValues } from "@/lib/validations/cita";
import type { CitaActionState } from "@/app/(app)/calendario/actions";

export function CitaForm({
  servicios,
  defaultFecha,
  defaultHora,
  pacienteInicial,
  onSubmit,
}: {
  servicios: Servicio[];
  defaultFecha?: string;
  defaultHora?: string;
  pacienteInicial?: { id: string; nombre: string };
  onSubmit: (data: CitaFormValues) => Promise<CitaActionState>;
}) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(CitaSchema),
    defaultValues: {
      paciente_id: pacienteInicial?.id ?? "",
      servicio_id: "",
      fecha: defaultFecha ?? "",
      hora: defaultHora ?? "",
      duracion_minutos: 30,
      notas_administrativas: "",
    },
  });

  async function alEnviar(data: CitaFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) toast.error(resultado.error);
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="max-w-lg">
      <FieldGroup>
        <Field>
          <FieldLabel>Paciente</FieldLabel>
          <Controller
            control={control}
            name="paciente_id"
            render={({ field }) => (
              <PacienteCombobox
                value={
                  field.value
                    ? {
                        value: field.value,
                        label:
                          field.value === pacienteInicial?.id
                            ? pacienteInicial.nombre
                            : "",
                      }
                    : null
                }
                onChange={(opcion) => field.onChange(opcion?.value ?? "")}
              />
            )}
          />
          {errors.paciente_id && (
            <p className="text-sm text-destructive">
              {errors.paciente_id.message}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="servicio_id">Servicio</FieldLabel>
          <Controller
            control={control}
            name="servicio_id"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  const servicio = servicios.find((s) => s.id === v);
                  if (servicio) {
                    setValue("duracion_minutos", servicio.duracion_minutos);
                  }
                }}
              >
                <SelectTrigger id="servicio_id" className="w-full">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.nombre} ({servicio.duracion_minutos} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.servicio_id && (
            <p className="text-sm text-destructive">
              {errors.servicio_id.message}
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
            <Input id="fecha" type="date" {...register("fecha")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="hora">Hora</FieldLabel>
            <Input id="hora" type="time" {...register("hora")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="duracion_minutos">Duración (min)</FieldLabel>
            <Input
              id="duracion_minutos"
              type="number"
              {...register("duracion_minutos", { valueAsNumber: true })}
            />
          </Field>
        </div>
        {(errors.fecha || errors.hora || errors.duracion_minutos) && (
          <p className="text-sm text-destructive">
            Revisa la fecha, hora y duración.
          </p>
        )}

        <Field>
          <FieldLabel htmlFor="notas_administrativas">
            Notas administrativas
          </FieldLabel>
          <Textarea
            id="notas_administrativas"
            {...register("notas_administrativas")}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Agendando..." : "Agendar cita"}
        </Button>
      </FieldGroup>
    </form>
  );
}
