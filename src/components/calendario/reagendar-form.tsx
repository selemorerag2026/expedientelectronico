"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { reagendarCita } from "@/app/(app)/calendario/actions";

type Valores = { fecha: string; hora: string; duracion_minutos: number };

export function ReagendarForm({
  citaId,
  fechaInicial,
  horaInicial,
  duracionInicial,
}: {
  citaId: string;
  fechaInicial: string;
  horaInicial: string;
  duracionInicial: number;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Valores>({
    defaultValues: {
      fecha: fechaInicial,
      hora: horaInicial,
      duracion_minutos: duracionInicial,
    },
  });

  async function alEnviar(data: Valores) {
    const resultado = await reagendarCita(citaId, {
      ...data,
      duracion_minutos: Number(data.duracion_minutos),
    });
    if (resultado?.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Cita reagendada.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="flex flex-col gap-3">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="re_fecha">Fecha</FieldLabel>
            <Input id="re_fecha" type="date" {...register("fecha")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="re_hora">Hora</FieldLabel>
            <Input id="re_hora" type="time" {...register("hora")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="re_duracion">Duración (min)</FieldLabel>
            <Input
              id="re_duracion"
              type="number"
              {...register("duracion_minutos")}
            />
          </Field>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Reagendar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
