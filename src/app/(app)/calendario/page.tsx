import Link from "next/link";

import { CalendarioClient } from "@/components/calendario/calendario-client";
import { LeyendaTipos } from "@/components/calendario/leyenda-tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatearFechaHora } from "@/lib/fecha";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";
import type { CitaConPaciente } from "@/lib/types/database";

export default async function CalendarioPage() {
  const actual = await getUsuarioActual();
  const esMedico = actual?.perfil?.role === "medico";

  const supabase = await createClient();
  const { data: proximasCitas } = await supabase
    .from("citas")
    .select("*, pacientes(id, nombre_completo, telefono)")
    .gt("fecha_hora_inicio", new Date().toISOString())
    .not("estado", "in", "(cancelada,no_show)")
    .order("fecha_hora_inicio")
    .limit(6)
    .returns<CitaConPaciente[]>();

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tipo de cita</CardTitle>
            </CardHeader>
            <CardContent>
              <LeyendaTipos />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Próximas citas</CardTitle>
            </CardHeader>
            <CardContent>
              {proximasCitas && proximasCitas.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {proximasCitas.map((cita) => (
                    <Link
                      key={cita.id}
                      href={`/calendario/citas/${cita.id}`}
                      className="flex flex-col gap-0.5 rounded-lg p-2 text-sm ring-1 ring-black/5 hover:bg-muted/40"
                    >
                      <span className="font-medium">
                        {formatearFechaHora(cita.fecha_hora_inicio)}
                      </span>
                      <span className="text-muted-foreground">
                        {cita.pacientes?.nombre_completo}
                      </span>
                      <Badge variant="outline" className="mt-1 w-fit capitalize">
                        {(cita.tipo_cita ?? "consulta").replace("_", " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay próximas citas agendadas.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">
          <CalendarioClient />
        </div>
      </div>
    </div>
  );
}
