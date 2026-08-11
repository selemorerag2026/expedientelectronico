"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { desconectarGoogleCalendar } from "@/app/(app)/configuracion/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function GoogleCalendarCard({ conectado }: { conectado: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {conectado ? (
          <Badge>Conectado</Badge>
        ) : (
          <Badge variant="secondary">No conectado</Badge>
        )}
      </div>
      {conectado ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await desconectarGoogleCalendar();
              toast.success("Google Calendar desconectado.");
            })
          }
        >
          {pending ? "Desconectando..." : "Desconectar"}
        </Button>
      ) : (
        <Button type="button" render={<a href="/api/integraciones/google/iniciar" />}>
          Conectar con Google
        </Button>
      )}
    </div>
  );
}
