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
import type { PagoActionState } from "@/app/(app)/cobros/actions";
import { fechaHoyISO } from "@/lib/fecha";
import { METODOS_PAGO, PagoSchema, type PagoFormValues } from "@/lib/validations/pago";

export function PagoForm({
  saldoPendiente,
  onSubmit,
}: {
  saldoPendiente: number;
  onSubmit: (data: PagoFormValues) => Promise<PagoActionState>;
}) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PagoFormValues>({
    resolver: zodResolver(PagoSchema),
    defaultValues: {
      monto: saldoPendiente,
      fecha_pago: fechaHoyISO(),
      notas: "",
    },
  });

  async function alEnviar(data: PagoFormValues) {
    const resultado = await onSubmit(data);
    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Pago registrado.");
    reset({ monto: saldoPendiente, fecha_pago: fechaHoyISO(), notas: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="flex flex-col gap-3">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="pago_monto">Monto a pagar</FieldLabel>
            <Input
              id="pago_monto"
              type="number"
              step="0.01"
              {...register("monto", { valueAsNumber: true })}
            />
            {errors.monto && (
              <p className="text-sm text-destructive">{errors.monto.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="pago_metodo">Método de pago</FieldLabel>
            <Controller
              control={control}
              name="metodo_pago"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="pago_metodo" className="w-full">
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
            {errors.metodo_pago && (
              <p className="text-sm text-destructive">
                {errors.metodo_pago.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="pago_fecha">Fecha del pago</FieldLabel>
            <Input id="pago_fecha" type="date" {...register("fecha_pago")} />
            {errors.fecha_pago && (
              <p className="text-sm text-destructive">
                {errors.fecha_pago.message}
              </p>
            )}
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="pago_notas">
            Nota (opcional, ej. referencia SINPE)
          </FieldLabel>
          <Textarea id="pago_notas" {...register("notas")} />
        </Field>
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Registrar pago"}
        </Button>
      </FieldGroup>
    </form>
  );
}
