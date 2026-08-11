"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ServicioSchema,
  type ServicioFormValues,
} from "@/lib/validations/servicio";
import type { ServicioActionState } from "@/app/(app)/servicios/actions";

export function ServicioForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<ServicioFormValues>;
  onSubmit: (data: ServicioFormValues) => Promise<ServicioActionState>;
  submitLabel: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServicioFormValues>({
    resolver: zodResolver(ServicioSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      duracion_minutos: 30,
      visible_portal_publico: true,
      ...defaultValues,
    },
  });

  async function alEnviar(data: ServicioFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) toast.error(resultado.error);
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="max-w-md">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
          <Input id="nombre" {...register("nombre")} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
          <Textarea id="descripcion" {...register("descripcion")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="duracion_minutos">Duración (minutos)</FieldLabel>
          <Input
            id="duracion_minutos"
            type="number"
            className="max-w-40"
            {...register("duracion_minutos", { valueAsNumber: true })}
          />
          {errors.duracion_minutos && (
            <p className="text-sm text-destructive">
              {errors.duracion_minutos.message}
            </p>
          )}
        </Field>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="visible_portal_publico">
            Visible en el portal público de auto-agendamiento
          </FieldLabel>
          <Controller
            control={control}
            name="visible_portal_publico"
            render={({ field }) => (
              <Switch
                id="visible_portal_publico"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
