import Link from "next/link";
import { notFound } from "next/navigation";

import { CobroForm } from "@/components/cobros/cobro-form";
import { EstadoCitaSelect } from "@/components/calendario/estado-cita-select";
import { ReagendarForm } from "@/components/calendario/reagendar-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { crearCobro, marcarCobroPagado } from "@/app/(app)/cobros/actions";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { formatearFechaHora, partesEnCR } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type {
  Cobro,
  CitaConPaciente,
  CitaServicio,
  Servicio,
} from "@/lib/types/database";
import { marcarConfirmadaPorPaciente } from "../../actions";

export default async function CitaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actual = await getUsuarioActual();
  const esMedico = actual?.perfil?.role === "medico";

  const supabase = await createClient();
  const { data: cita } = await supabase
    .from("citas")
    .select("*, pacientes(id, nombre_completo, telefono)")
    .eq("id", id)
    .single<CitaConPaciente>();

  if (!cita) {
    notFound();
  }

  const { data: citaServicios } = await supabase
    .from("citas_servicios")
    .select("*, servicios(nombre)")
    .eq("cita_id", id)
    .returns<(CitaServicio & { servicios: Pick<Servicio, "nombre"> | null })[]>();

  const { data: cobros } = await supabase
    .from("cobros")
    .select("*")
    .eq("cita_id", id)
    .order("created_at", { ascending: false })
    .returns<Cobro[]>();

  const guardarCobro = crearCobro.bind(null, id, cita.paciente_id);

  const { fecha, hora } = partesEnCR(cita.fecha_hora_inicio);
  const duracionMinutos = Math.round(
    (new Date(cita.fecha_hora_fin).getTime() -
      new Date(cita.fecha_hora_inicio).getTime()) /
      60000
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium">
            <Link href={`/pacientes/${cita.paciente_id}`} className="hover:underline">
              {cita.pacientes?.nombre_completo}
            </Link>
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatearFechaHora(cita.fecha_hora_inicio)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cita.confirmada_por_paciente ? (
            <Badge>Confirmada por el paciente</Badge>
          ) : (
            <form action={marcarConfirmadaPorPaciente.bind(null, id)}>
              <Button type="submit" variant="outline" size="sm">
                Marcar confirmada por el paciente
              </Button>
            </form>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de la cita</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EstadoCitaSelect citaId={id} estadoActual={cita.estado} />
          {citaServicios && citaServicios.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Servicio: </span>
              {citaServicios.map((cs) => cs.servicios?.nombre).join(", ")}
            </div>
          )}
          {cita.notas_administrativas && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notas: </span>
              {cita.notas_administrativas}
            </div>
          )}
          {esMedico && (
            <Button
              className="w-fit"
              render={
                <Link
                  href={`/pacientes/${cita.paciente_id}/notas/nueva?citaId=${id}`}
                />
              }
            >
              Abrir nota de evolución
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cobros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cobros && cobros.length > 0 && (
            <div className="flex flex-col gap-2">
              {cobros.map((cobro) => (
                <div
                  key={cobro.id}
                  className="flex items-center justify-between rounded-lg p-2.5 text-sm ring-1 ring-black/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      ₡{cobro.monto.toLocaleString("es-CR")}
                    </span>
                    {cobro.metodo_pago && (
                      <span className="text-muted-foreground">
                        · {cobro.metodo_pago}
                      </span>
                    )}
                    <Badge variant={cobro.estado === "pagado" ? "default" : "secondary"}>
                      {cobro.estado}
                    </Badge>
                  </div>
                  {cobro.estado === "pendiente" && (
                    <form action={marcarCobroPagado.bind(null, cobro.id, id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Marcar pagado
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
          <CobroForm onSubmit={guardarCobro} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reagendar</CardTitle>
        </CardHeader>
        <CardContent>
          <ReagendarForm
            citaId={id}
            fechaInicial={fecha}
            horaInicial={hora}
            duracionInicial={duracionMinutos}
          />
        </CardContent>
      </Card>
    </div>
  );
}
