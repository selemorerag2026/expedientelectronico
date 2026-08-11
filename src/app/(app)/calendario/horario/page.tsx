import { redirect } from "next/navigation";

import { HorarioForm } from "@/components/calendario/horario-form";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";
import type { HorarioAtencion } from "@/lib/types/database";
import { DIAS_SEMANA } from "@/lib/validations/horario-atencion";
import {
  agregarHorario,
  alternarActivoHorario,
  eliminarHorario,
} from "./actions";

export default async function HorarioAtencionPage() {
  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    redirect("/calendario");
  }

  const supabase = await createClient();
  const { data: horarios } = await supabase
    .from("horarios_atencion")
    .select("*")
    .order("dia_semana")
    .order("hora_inicio")
    .returns<HorarioAtencion[]>();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">
          Horario de atención
        </h1>
        <p className="text-sm text-muted-foreground">
          Estos bloques determinan qué horarios se ofrecen en el calendario y
          en el portal público de auto-agendamiento.
        </p>
      </div>

      <HorarioForm onSubmit={agregarHorario} />

      <div className="flex flex-col gap-2">
        {horarios?.map((horario) => (
          <div
            key={horario.id}
            className="flex items-center justify-between rounded-lg p-3 ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">
                {DIAS_SEMANA[horario.dia_semana]}
              </span>
              <span className="text-muted-foreground">
                {horario.hora_inicio.slice(0, 5)} –{" "}
                {horario.hora_fin.slice(0, 5)}
              </span>
              <Badge variant={horario.activo ? "default" : "secondary"}>
                {horario.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <form
                action={alternarActivoHorario.bind(
                  null,
                  horario.id,
                  horario.activo
                )}
              >
                <Button type="submit" variant="outline" size="sm">
                  {horario.activo ? "Desactivar" : "Activar"}
                </Button>
              </form>
              <ConfirmarAccion
                titulo="¿Eliminar este bloque de horario?"
                descripcion={`${DIAS_SEMANA[horario.dia_semana]} ${horario.hora_inicio.slice(0, 5)}–${horario.hora_fin.slice(0, 5)} dejará de ofrecerse para agendar citas.`}
                onConfirmar={() => eliminarHorario(horario.id)}
              />
            </div>
          </div>
        ))}
        {horarios?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no has configurado bloques de horario.
          </p>
        )}
      </div>
    </div>
  );
}
