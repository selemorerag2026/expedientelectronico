import Link from "next/link";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  FileWarningIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { cambiarEstadoCita } from "@/app/(app)/calendario/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import {
  combinarFechaHoraCR,
  fechaHoyISO,
  formatearFechaHora,
  formatearHora,
} from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { CitaConPaciente, EstadoCita } from "@/lib/types/database";

const COLOR_BADGE_ESTADO: Record<EstadoCita, "default" | "secondary"> = {
  agendada: "secondary",
  confirmada: "default",
  en_curso: "default",
  completada: "secondary",
  cancelada: "secondary",
  no_show: "secondary",
};

function etiquetaEstado(cita: CitaConPaciente) {
  if (cita.estado === "agendada" && cita.origen === "portal_publico") {
    return "Pendiente de confirmar";
  }
  const ETIQUETAS: Record<EstadoCita, string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    en_curso: "En curso",
    completada: "Completada",
    cancelada: "Cancelada",
    no_show: "No se presentó",
  };
  return ETIQUETAS[cita.estado];
}

type NotaIncompleta = {
  cita_id: string;
  paciente_id: string;
  fecha_hora_inicio: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const actual = await getUsuarioActual();
  const esMedico = actual?.perfil?.role === "medico";

  const hoy = fechaHoyISO();
  const inicioHoy = combinarFechaHoraCR(hoy, "00:00");
  const finHoy = combinarFechaHoraCR(hoy, "23:59");

  const [
    { data: citasHoy },
    { count: totalPacientes },
    { data: cobros },
    { data: pendientesConfirmar },
    { data: notasIncompletasRaw },
  ] = await Promise.all([
    supabase
      .from("citas")
      .select("*, pacientes(id, nombre_completo, telefono)")
      .gte("fecha_hora_inicio", inicioHoy)
      .lte("fecha_hora_inicio", finHoy)
      .neq("estado", "cancelada")
      .order("fecha_hora_inicio")
      .returns<CitaConPaciente[]>(),
    supabase
      .from("pacientes")
      .select("id", { count: "exact", head: true })
      .eq("estado", "activo"),
    supabase.from("cobros").select("monto").eq("estado", "pendiente"),
    supabase
      .from("citas")
      .select("*, pacientes(id, nombre_completo, telefono)")
      .eq("origen", "portal_publico")
      .eq("estado", "agendada")
      .order("fecha_hora_inicio")
      .returns<CitaConPaciente[]>(),
    supabase.rpc("citas_completadas_sin_nota"),
  ]);

  const notasIncompletas = notasIncompletasRaw as NotaIncompleta[] | null;

  const totalCobrosPendientes = (cobros ?? []).reduce(
    (suma, c) => suma + c.monto,
    0
  );

  const atendidosHoy =
    citasHoy?.filter((c) => c.estado === "completada").length ?? 0;
  const restantesHoy =
    citasHoy?.filter((c) =>
      ["agendada", "confirmada", "en_curso"].includes(c.estado)
    ).length ?? 0;

  let pacientesPorId = new Map<string, string>();
  if (esMedico && notasIncompletas && notasIncompletas.length > 0) {
    const { data: pacientesInfo } = await supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .in("id", notasIncompletas.map((n) => n.paciente_id));
    pacientesPorId = new Map(
      (pacientesInfo ?? []).map((p) => [p.id, p.nombre_completo])
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarClockIcon className="size-4" /> Atendidos hoy
            </CardDescription>
            <CardTitle className="text-2xl">{atendidosHoy}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarClockIcon className="size-4" /> Restantes hoy
            </CardDescription>
            <CardTitle className="text-2xl">{restantesHoy}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <UsersIcon className="size-4" /> Pacientes activos
            </CardDescription>
            <CardTitle className="text-2xl">{totalPacientes ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <WalletIcon className="size-4" /> Cobros pendientes
            </CardDescription>
            <CardTitle className="text-2xl">
              ₡{totalCobrosPendientes.toLocaleString("es-CR")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/pacientes" />}>Pacientes</Button>
        <Button variant="outline" render={<Link href="/calendario" />}>
          Calendario
        </Button>
        <Button variant="outline" render={<Link href="/cobros" />}>
          Cobros
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircleIcon className="size-4.5 text-primary" />
            Citas pendientes de confirmar
          </CardTitle>
          <CardDescription>
            Agendadas desde el portal público, todavía sin confirmar por el
            consultorio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendientesConfirmar && pendientesConfirmar.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pendientesConfirmar.map((cita) => (
                <div
                  key={cita.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-2.5 text-sm ring-1 ring-black/5"
                >
                  <Link
                    href={`/calendario/citas/${cita.id}`}
                    className="flex flex-wrap items-center gap-3 hover:underline"
                  >
                    <span className="font-medium">
                      {formatearFechaHora(cita.fecha_hora_inicio)}
                    </span>
                    <span>{cita.pacientes?.nombre_completo}</span>
                  </Link>
                  <form
                    action={cambiarEstadoCita.bind(null, cita.id, "confirmada")}
                  >
                    <Button type="submit" size="sm">
                      Confirmar
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay citas pendientes de confirmar.
            </p>
          )}
        </CardContent>
      </Card>

      {(notasIncompletas?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarningIcon className="size-4.5 text-primary" />
              Notas de evolución incompletas
            </CardTitle>
            <CardDescription>
              Citas completadas que todavía no tienen nota SOAP registrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {esMedico ? (
              <div className="flex flex-col gap-2">
                {notasIncompletas?.map((item) => (
                  <div
                    key={item.cita_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-2.5 text-sm ring-1 ring-black/5"
                  >
                    <span>
                      <span className="font-medium">
                        {formatearFechaHora(item.fecha_hora_inicio)}
                      </span>{" "}
                      — {pacientesPorId.get(item.paciente_id) ?? "Paciente"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link
                          href={`/pacientes/${item.paciente_id}/notas/nueva?citaId=${item.cita_id}`}
                        />
                      }
                    >
                      Completar nota
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hay {notasIncompletas?.length} cita
                {notasIncompletas?.length === 1 ? "" : "s"} completada
                {notasIncompletas?.length === 1 ? "" : "s"} sin nota de
                evolución. El detalle solo lo puede ver el médico.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agenda de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {citasHoy && citasHoy.length > 0 ? (
            <div className="flex flex-col gap-2">
              {citasHoy.map((cita) => (
                <Link
                  key={cita.id}
                  href={`/calendario/citas/${cita.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg p-2.5 text-sm ring-1 ring-black/5 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {formatearHora(cita.fecha_hora_inicio)}
                    </span>
                    <span>{cita.pacientes?.nombre_completo}</span>
                  </div>
                  <Badge variant={COLOR_BADGE_ESTADO[cita.estado]}>
                    {etiquetaEstado(cita)}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay citas agendadas para hoy.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
