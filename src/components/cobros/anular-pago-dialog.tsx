"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { PagoActionState } from "@/app/(app)/cobros/actions";

export function AnularPagoDialog({
  onConfirmar,
}: {
  onConfirmar: (motivo: string) => Promise<PagoActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pending, setPending] = useState(false);

  async function alConfirmar() {
    if (!motivo.trim()) {
      toast.error("Escribe el motivo de la anulación.");
      return;
    }
    setPending(true);
    const resultado = await onConfirmar(motivo);
    setPending(false);
    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Pago anulado.");
    setMotivo("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
        Anular
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular pago</DialogTitle>
          <DialogDescription>
            El pago queda marcado como anulado y deja de contar para el
            saldo del cobro, pero se mantiene visible en el historial junto
            con el motivo. Si fue un error, registra después el pago
            correcto por separado.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="motivo_anulacion">Motivo</FieldLabel>
          <Textarea
            id="motivo_anulacion"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. monto digitado por error, método de pago incorrecto..."
          />
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={alConfirmar}
          >
            {pending ? "Anulando..." : "Sí, anular pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
