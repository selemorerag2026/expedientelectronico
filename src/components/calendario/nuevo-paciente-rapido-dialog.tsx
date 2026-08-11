"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { crearPacienteRapido } from "@/app/(app)/calendario/actions";
import {
  PacienteRapidoSchema,
  type PacienteRapidoFormValues,
} from "@/lib/validations/cita";

export function NuevoPacienteRapidoDialog({
  onCreado,
}: {
  onCreado: (paciente: { id: string; nombre_completo: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PacienteRapidoFormValues>({
    resolver: zodResolver(PacienteRapidoSchema),
    defaultValues: {
      nombre_completo: "",
      fecha_nacimiento: "",
      telefono: "",
      cedula: "",
    },
  });

  async function alEnviar(data: PacienteRapidoFormValues) {
    const resultado = await crearPacienteRapido(data);
    if (resultado.error || !resultado.paciente) {
      toast.error(resultado.error ?? "No se pudo crear el paciente.");
      return;
    }
    toast.success("Paciente creado.");
    onCreado(resultado.paciente);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Paciente nuevo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registro rápido de paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(alEnviar)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nr_nombre">Nombre completo</FieldLabel>
              <Input id="nr_nombre" {...register("nombre_completo")} />
              {errors.nombre_completo && (
                <p className="text-sm text-destructive">
                  {errors.nombre_completo.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="nr_nacimiento">
                Fecha de nacimiento
              </FieldLabel>
              <Input
                id="nr_nacimiento"
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
              <FieldLabel htmlFor="nr_telefono">Teléfono</FieldLabel>
              <Input id="nr_telefono" {...register("telefono")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="nr_cedula">Cédula</FieldLabel>
              <Input id="nr_cedula" {...register("cedula")} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear y seleccionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
