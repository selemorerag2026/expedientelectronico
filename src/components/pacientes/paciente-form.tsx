"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PacienteSchema,
  type PacienteFormValues,
} from "@/lib/validations/paciente";
import type { PacienteActionState } from "@/app/(app)/pacientes/actions";

export function PacienteForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<PacienteFormValues>;
  onSubmit: (data: PacienteFormValues) => Promise<PacienteActionState>;
  submitLabel: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(PacienteSchema),
    defaultValues: {
      nombre_completo: "",
      fecha_nacimiento: "",
      cedula: "",
      telefono: "",
      correo: "",
      direccion: "",
      contacto_emergencia_nombre: "",
      contacto_emergencia_telefono: "",
      contacto_emergencia_parentesco: "",
      tipo_sangre: "",
      alergias: "",
      seguro_medico: "",
      ...defaultValues,
    },
  });

  async function alEnviar(data: PacienteFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) {
      toast.error(resultado.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="max-w-2xl">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Datos generales</FieldLegend>
          <Field>
            <FieldLabel htmlFor="nombre_completo">Nombre completo</FieldLabel>
            <Input id="nombre_completo" {...register("nombre_completo")} />
            {errors.nombre_completo && (
              <p className="text-sm text-destructive">
                {errors.nombre_completo.message}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fecha_nacimiento">
                Fecha de nacimiento
              </FieldLabel>
              <Input
                id="fecha_nacimiento"
                type="date"
                {...register("fecha_nacimiento")}
              />
              {errors.fecha_nacimiento && (
                <p className="text-sm text-destructive">
                  {errors.fecha_nacimiento.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="sexo">Sexo</FieldLabel>
              <Controller
                control={control}
                name="sexo"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="sexo" className="w-full">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="cedula">Cédula</FieldLabel>
              <Input id="cedula" {...register("cedula")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="tipo_sangre">Tipo de sangre</FieldLabel>
              <Input
                id="tipo_sangre"
                placeholder="Ej. O+"
                {...register("tipo_sangre")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
              <Input id="telefono" {...register("telefono")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="correo">Correo</FieldLabel>
              <Input id="correo" type="email" {...register("correo")} />
              {errors.correo && (
                <p className="text-sm text-destructive">
                  {errors.correo.message}
                </p>
              )}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
            <Input id="direccion" {...register("direccion")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="seguro_medico">Seguro médico</FieldLabel>
            <Input id="seguro_medico" {...register("seguro_medico")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="alergias">Alergias conocidas</FieldLabel>
            <Textarea id="alergias" {...register("alergias")} />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Contacto de emergencia</FieldLegend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="contacto_emergencia_nombre">
                Nombre
              </FieldLabel>
              <Input
                id="contacto_emergencia_nombre"
                {...register("contacto_emergencia_nombre")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contacto_emergencia_telefono">
                Teléfono
              </FieldLabel>
              <Input
                id="contacto_emergencia_telefono"
                {...register("contacto_emergencia_telefono")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contacto_emergencia_parentesco">
                Parentesco
              </FieldLabel>
              <Input
                id="contacto_emergencia_parentesco"
                {...register("contacto_emergencia_parentesco")}
              />
            </Field>
          </div>
        </FieldSet>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
