"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import type { CobroActionState } from "@/app/(app)/cobros/actions";
import {
  CobroSchema,
  METODOS_PAGO,
  type CobroFormValues,
} from "@/lib/validations/cobro";

export function CobroForm({
  onSubmit,
}: {
  onSubmit: (data: CobroFormValues) => Promise<CobroActionState>;
}) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CobroFormValues>({
    resolver: zodResolver(CobroSchema),
    defaultValues: { monto: 0, estado: "pendiente", notas: "" },
  });

  async function alEnviar(data: CobroFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Cobro registrado.");
    reset({ monto: 0, estado: "pendiente", notas: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="flex flex-col gap-3">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="monto">Monto</FieldLabel>
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
          <Field>
            <FieldLabel htmlFor="metodo_pago">Método de pago</FieldLabel>
            <Controller
              control={control}
              name="metodo_pago"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="metodo_pago" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="estado">Estado</FieldLabel>
            <Controller
              control={control}
              name="estado"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="estado" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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
