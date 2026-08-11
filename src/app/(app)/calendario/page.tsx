import Link from "next/link";

import { CalendarioClient } from "@/components/calendario/calendario-client";
import { LeyendaEstados } from "@/components/calendario/leyenda-estados";
import { Button } from "@/components/ui/button";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";

export default async function CalendarioPage() {
  const actual = await getUsuarioActual();
  const esMedico = actual?.perfil?.role === "medico";

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-medium">Calendario</h1>
        <div className="flex gap-2">
          {esMedico && (
            <Button variant="outline" render={<Link href="/calendario/horario" />}>
              Horario de atención
            </Button>
          )}
          <Button variant="outline" render={<Link href="/servicios" />}>
            Servicios
          </Button>
          <Button render={<Link href="/calendario/nueva" />}>
            Nueva cita
          </Button>
        </div>
      </div>
      <LeyendaEstados />
      <CalendarioClient />
    </div>
  );
}
