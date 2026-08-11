"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  DIAS_SEMANA,
  HorarioAtencionSchema,
  type HorarioAtencionFormValues,
} from "@/lib/validations/horario-atencion";
import type { HorarioActionState } from "@/app/(app)/calendario/horario/actions";

export function HorarioForm({
  onSubmit,
}: {
  onSubmit: (data: HorarioAtencionFormValues) => Promise<HorarioActionState>;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HorarioAtencionFormValues>({
    resolver: zodResolver(HorarioAtencionSchema),
    defaultValues: { dia_semana: 1, hora_inicio: "08:00", hora_fin: "17:00" },
  });

  async function alEnviar(data: HorarioAtencionFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Bloque de horario agregado.");
    reset({ dia_semana: data.dia_semana, hora_inicio: "08:00", hora_fin: "17:00" });
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="flex flex-col gap-4">
      <FieldGroup>
        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-40">
            <FieldLabel htmlFor="dia_semana">Día</FieldLabel>
            <Controller
              control={control}
              name="dia_semana"
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger id="dia_semana" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia, index) => (
                      <SelectItem key={dia} value={String(index)}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field className="w-32">
            <FieldLabel htmlFor="hora_inicio">Desde</FieldLabel>
            <Input id="hora_inicio" type="time" {...register("hora_inicio")} />
          </Field>
          <Field className="w-32">
            <FieldLabel htmlFor="hora_fin">Hasta</FieldLabel>
            <Input id="hora_fin" type="time" {...register("hora_fin")} />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Agregando..." : "Agregar bloque"}
          </Button>
        </div>
        {errors.hora_fin && (
          <p role="alert" className="text-sm text-destructive">
            {errors.hora_fin.message}
          </p>
        )}
      </FieldGroup>
    </form>
  );
}
