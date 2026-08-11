"use client";

import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cambiarEstadoCita } from "@/app/(app)/calendario/actions";
import { ESTADOS_CITA } from "@/lib/citas/color-estado";
import type { EstadoCita } from "@/lib/types/database";

export function EstadoCitaSelect({
  citaId,
  estadoActual,
}: {
  citaId: string;
  estadoActual: EstadoCita;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={estadoActual}
      onValueChange={(valor) =>
        startTransition(() => cambiarEstadoCita(citaId, valor as EstadoCita))
      }
      disabled={pending}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ESTADOS_CITA.map((estado) => (
          <SelectItem key={estado.value} value={estado.value}>
            {estado.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
