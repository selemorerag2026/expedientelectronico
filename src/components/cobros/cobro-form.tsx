"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CobroActionState } from "@/app/(app)/cobros/actions";
import { CobroSchema, type CobroFormValues } from "@/lib/validations/cobro";

export function CobroForm({
  onSubmit,
}: {
  onSubmit: (data: CobroFormValues) => Promise<CobroActionState>;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CobroFormValues>({
    resolver: zodResolver(CobroSchema),
    defaultValues: { monto: 0, notas: "" },
  });

  async function alEnviar(data: CobroFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Cobro registrado.");
    reset({ monto: 0, notas: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="flex flex-col gap-3">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="monto">Monto total adeudado</FieldLabel>
            <Input
              id="monto"
              type="number"
              step="0.01"
              {...register("monto", { valueAsNumber: true })}
            />
            {errors.monto && (
              <p className="text-sm text-destructive">{errors.monto.message}</p>
            )}
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="notas_cobro">Notas</FieldLabel>
          <Textarea id="notas_cobro" {...register("notas")} />
        </Field>
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Registrar cobro"}
        </Button>
      </FieldGroup>
    </form>
  );
}
