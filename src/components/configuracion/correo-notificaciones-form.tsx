"use client";

import { useState } from "react";
import { toast } from "sonner";

import { actualizarCorreoNotificaciones } from "@/app/(app)/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CorreoNotificacionesForm({
  valorInicial,
}: {
  valorInicial: string;
}) {
  const [correo, setCorreo] = useState(valorInicial);
  const [guardando, setGuardando] = useState(false);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const resultado = await actualizarCorreoNotificaciones(correo);
    setGuardando(false);
    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success("Correo de notificaciones actualizado.");
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-3">
      <FieldGroup>
        <Field className="max-w-sm">
          <FieldLabel htmlFor="correo_notificaciones">
            Correo para avisos de citas confirmadas
          </FieldLabel>
          <Input
            id="correo_notificaciones"
            type="email"
            placeholder="tu-correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={guardando} className="w-fit">
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
