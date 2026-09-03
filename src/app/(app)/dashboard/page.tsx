import Link from "next/link";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  FilePlusIcon,
  FileWarningIcon,
  HistoryIcon,
  UserPlusIcon,
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
  formatearFechaLarga,
  formatearHora,
} from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { CitaConPaciente, EstadoCita } from "@/lib/types/database";

const COLOR_BADGE_ESTADO: Record<EstadoCita, "success" | "secondary"> = {
  agendada: "secondary",
  confirmada: "success",
  en_curso: "success",
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

function saludoSegunHora(hora: number) {
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

type NotaIncompleta = {
  cita_id: string;
  paciente_id: string;
  fecha_hora_inicio: string;
};

type ActividadItem = {
  id: string;
  tipo: "pago" | "documento";
  descripcion: string;
  pacienteNombre: string | null;
  created_at: string;
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
    { count: documentosNuevos },
    { data: pagosRecientes },
    { data: documentosRecientes },
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
    supabase
      .from("cobros_con_estado")
      .select("saldo")
      .neq("estado_calculado", "pagado"),
    supabase
      .from("citas")
      .select("*, pacientes(id, nombre_completo, telefono)")
      .eq("origen", "portal_publico")
      .eq("estado", "agendada")
      .order("fecha_hora_inicio")
      .returns<CitaConPaciente[]>(),
    supabase.rpc("citas_completadas_sin_nota"),
    // Adjuntos de hoy: RLS restringe archivos_adjuntos a médico, así que
    // para asistente este conteo naturalmente da 0 (no ve nada clínico),
    // igual que el resto del expediente.
    supabase
      .from("archivos_adjuntos")
      .select("id", { count: "exact", head: true })
      .gte("created_at", inicioHoy)
      .lte("created_at", finHoy),
    supabase
      .from("pagos")
      .select("id, monto, created_at, cobros(paciente_id)")
      .eq("anulado", false)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("archivos_adjuntos")
      .select(
        "id, nombre_archivo, created_at, paciente_id, notas_evolucion(paciente_id)"
      )
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const notasIncompletas = notasIncompletasRaw as NotaIncompleta[] | null;

  const totalCobrosPendientes = (cobros ?? []).reduce(
    (suma, c) => suma + c.saldo,
    0
  );

  const atendidosHoy =
    citasHoy?.filter((c) => c.estado === "completada").length ?? 0;
  const restantesHoy =
    citasHoy?.filter((c) =>
      ["agendada", "confirmada", "en_curso"].includes(c.estado)
    ).length ?? 0;

  // Actividad reciente: pagos + documentos, combinados y ordenados por
  // fecha. Se resuelven los nombres de paciente en una sola consulta.
  const idsPacientesActividad = new Set<string>();
  for (const pago of pagosRecientes ?? []) {
    const pacienteId = (pago.cobros as { paciente_id?: string } | null)
      ?.paciente_id;
    if (pacienteId) idsPacientesActividad.add(pacienteId);
  }
  for (const doc of documentosRecientes ?? []) {
    const pacienteId =
      doc.paciente_id ??
      (doc.notas_evolucion as { paciente_id?: string } | null)?.paciente_id;
    if (pacienteId) idsPacientesActividad.add(pacienteId);
  }

  let nombresPacientesActividad = new Map<string, string>();
  if (idsPacientesActividad.size > 0) {
    const { data: pacientesInfo } = await supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .in("id", [...idsPacientesActividad]);
    nombresPacientesActividad = new Map(
      (pacientesInfo ?? []).map((p) => [p.id, p.nombre_completo])
    );
  }

  const actividad: ActividadItem[] = [
    ...(pagosRecientes ?? []).map((pago): ActividadItem => {
      const pacienteId = (pago.cobros as { paciente_id?: string } | null)
        ?.paciente_id;
      return {
        id: `pago-${pago.id}`,
        tipo: "pago",
        descripcion: `Pago registrado · ₡${pago.monto.toLocaleString("es-CR")}`,
        pacienteNombre: pacienteId
          ? nombresPacientesActividad.get(pacienteId) ?? null
          : null,
        created_at: pago.created_at,
      };
    }),
    ...(documentosRecientes ?? []).map((doc): ActividadItem => {
      const pacienteId =
        doc.paciente_id ??
        (doc.notas_evolucion as { paciente_id?: string } | null)?.paciente_id;
      return {
        id: `doc-${doc.id}`,
        tipo: "documento",
        descripcion: `Documento subido · ${doc.nombre_archivo}`,
        pacienteNombre: pacienteId
          ? nombresPacientesActividad.get(pacienteId) ?? null
          : null,
        created_at: doc.created_at,
      };
    }),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

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

  const horaActual = Number(
    new Intl.DateTimeFormat("es-CR", {
      hour: "2-digit",
      hour12: false,
      timeZone: process.env.NEXT_PUBLIC_APP_TZ || "America/Costa_Rica",
    }).format(new Date())
  );
  const nombre = actual?.perfil?.nombre_completo?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {saludoSegunHora(horaActual)}
            {nombre ? `, ${nombre}` : ""}
          </h1>
          <p className="text-sm capitalize text-muted-foreground">
            {formatearFechaLarga(hoy)}
          </p>
        </div>
        <Button render={<Link href="/pacientes/nuevo" />}>
          <UserPlusIcon /> Nuevo paciente
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarClockIcon className="size-4" /> Citas de hoy
            </CardDescription>
            <CardTitle className="text-2xl">{citasHoy?.length ?? 0}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {atendidosHoy} atendidas · {restantesHoy} pendientes
            </p>
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
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <FilePlusIcon className="size-4" /> Documentos nuevos
            </CardDescription>
            <CardTitle className="text-2xl">{documentosNuevos ?? 0}</CardTitle>
            <p className="text-xs text-muted-foreground">Subidos hoy</p>
          </CardHeader>
        </Card>
      </div>

      {pendientesConfirmar && pendientesConfirmar.length > 0 && (
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
          </CardContent>
        </Card>
      )}

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Citas de hoy</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="size-4.5 text-primary" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actividad.length > 0 ? (
              <div className="flex flex-col gap-2">
                {actividad.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg p-2.5 text-sm ring-1 ring-black/5"
                  >
                    <div className="flex flex-col">
                      <span>{item.descripcion}</span>
                      {item.pacienteNombre && (
                        <span className="text-xs text-muted-foreground">
                          {item.pacienteNombre}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatearHora(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay actividad reciente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
