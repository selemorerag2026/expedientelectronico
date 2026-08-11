"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMedicoPorDefectoId } from "@/lib/citas/medico-por-defecto";
import { combinarFechaHoraCR } from "@/lib/fecha";
import {
  actualizarEventoGoogleCalendar,
  crearEventoGoogleCalendar,
  eliminarEventoGoogleCalendar,
} from "@/lib/google-calendar/sincronizacion";
import { enviarCorreoCitaConfirmada } from "@/lib/notificaciones/correo-cita-confirmada";
import { registrarErrorIntegracion } from "@/lib/notificaciones/registrar-error-integracion";
import { createClient } from "@/lib/supabase/server";
import type { EstadoCita } from "@/lib/types/database";
import {
  CitaSchema,
  PacienteRapidoSchema,
  type CitaFormValues,
  type PacienteRapidoFormValues,
} from "@/lib/validations/cita";

export type CitaActionState = { error?: string };

const ERROR_HORARIO_OCUPADO = "Ese horario ya está ocupado. Elige otro.";

function calcularFin(inicio: string, duracionMinutos: number) {
  return new Date(
    new Date(inicio).getTime() + duracionMinutos * 60_000
  ).toISOString();
}

export async function buscarPacientesParaCita(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("pacientes")
    .select("id, nombre_completo, cedula")
    .or(`nombre_completo.ilike.%${query}%,cedula.ilike.%${query}%`)
    .order("nombre_completo")
    .limit(8);

  return data ?? [];
}

export async function crearPacienteRapido(data: PacienteRapidoFormValues) {
  const validado = PacienteRapidoSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del paciente." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .insert({
      nombre_completo: validado.data.nombre_completo,
      fecha_nacimiento: validado.data.fecha_nacimiento,
      telefono: validado.data.telefono || null,
      cedula: validado.data.cedula || null,
      creado_por: user?.id,
    })
    .select("id, nombre_completo")
    .single();

  if (error || !paciente) {
    if (error?.code === "23505") {
      return { error: "Ya existe un paciente con esa cédula." };
    }
    return { error: "No se pudo crear el paciente." };
  }

  return { paciente };
}

export async function crearCita(
  data: CitaFormValues
): Promise<CitaActionState> {
  const validado = CitaSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos de la cita." };
  }

  const medicoId = await getMedicoPorDefectoId();
  if (!medicoId) {
    return { error: "No se encontró un usuario con rol médico." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: servicio } = await supabase
    .from("servicios")
    .select("id")
    .eq("id", validado.data.servicio_id)
    .single();

  if (!servicio) {
    return { error: "El servicio seleccionado ya no existe." };
  }

  const inicio = combinarFechaHoraCR(validado.data.fecha, validado.data.hora);
  const fin = calcularFin(inicio, validado.data.duracion_minutos);

  const { data: cita, error } = await supabase
    .from("citas")
    .insert({
      paciente_id: validado.data.paciente_id,
      medico_id: medicoId,
      fecha_hora_inicio: inicio,
      fecha_hora_fin: fin,
      notas_administrativas: validado.data.notas_administrativas || null,
      creado_por: user?.id,
    })
    .select("id")
    .single();

  if (error || !cita) {
    if (error?.code === "23P01") {
      return { error: ERROR_HORARIO_OCUPADO };
    }
    return { error: "No se pudo crear la cita. Intenta de nuevo." };
  }

  await supabase.from("citas_servicios").insert({
    cita_id: cita.id,
    servicio_id: validado.data.servicio_id,
  });

  revalidatePath("/calendario");
  redirect(`/calendario/citas/${cita.id}`);
}

export async function reagendarCita(
  id: string,
  data: { fecha: string; hora: string; duracion_minutos: number }
): Promise<CitaActionState> {
  const inicio = combinarFechaHoraCR(data.fecha, data.hora);
  const fin = calcularFin(inicio, data.duracion_minutos);

  const supabase = await createClient();

  const { data: citaPrevia } = await supabase
    .from("citas")
    .select("google_event_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("citas")
    .update({ fecha_hora_inicio: inicio, fecha_hora_fin: fin })
    .eq("id", id);

  if (error) {
    if (error.code === "23P01") {
      return { error: ERROR_HORARIO_OCUPADO };
    }
    return { error: "No se pudo reagendar la cita." };
  }

  if (citaPrevia?.google_event_id) {
    const resultado = await actualizarEventoGoogleCalendar(
      citaPrevia.google_event_id,
      { fechaHoraInicio: inicio, fechaHoraFin: fin }
    );
    if (!resultado.ok) {
      await registrarErrorIntegracion({
        citaId: id,
        pacienteId: null,
        evento: "google_calendar_actualizar",
        error: resultado.error ?? "Error desconocido.",
      });
    }
  }

  revalidatePath(`/calendario/citas/${id}`);
  revalidatePath("/calendario");
  return {};
}

export async function cambiarEstadoCita(id: string, estado: EstadoCita) {
  const supabase = await createClient();

  const { data: citaPrevia } = await supabase
    .from("citas")
    .select(
      "estado, origen, paciente_id, fecha_hora_inicio, fecha_hora_fin, google_event_id"
    )
    .eq("id", id)
    .single();

  await supabase.from("citas").update({ estado }).eq("id", id);
  revalidatePath(`/calendario/citas/${id}`);
  revalidatePath("/calendario");
  revalidatePath("/dashboard");

  if (!citaPrevia) return;

  const seAcabaDeConfirmar =
    citaPrevia.estado !== "confirmada" && estado === "confirmada";
  const seAcabaDeCancelar =
    citaPrevia.estado !== "cancelada" && estado === "cancelada";

  if (seAcabaDeConfirmar) {
    // Google Calendar: cualquier cita confirmada, sin importar el origen.
    await sincronizarGoogleCalendarAlConfirmar(id, citaPrevia);
    // Correo al médico: solo citas que vinieron del portal público.
    if (citaPrevia.origen === "portal_publico") {
      await notificarCitaConfirmadaPorCorreo(id, citaPrevia);
    }
  }

  if (seAcabaDeCancelar && citaPrevia.google_event_id) {
    await eliminarEventoDeCitaCancelada(
      id,
      citaPrevia.google_event_id,
      citaPrevia.paciente_id
    );
  }
}

async function sincronizarGoogleCalendarAlConfirmar(
  citaId: string,
  citaPrevia: {
    paciente_id: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
  }
) {
  const supabase = await createClient();

  const [{ data: paciente }, { data: citaServicios }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("nombre_completo")
      .eq("id", citaPrevia.paciente_id)
      .single(),
    supabase
      .from("citas_servicios")
      .select("servicios(nombre)")
      .eq("cita_id", citaId),
  ]);

  const nombreServicio =
    (citaServicios?.[0]?.servicios as { nombre?: string } | null)?.nombre ??
    null;

  const resultado = await crearEventoGoogleCalendar({
    pacienteNombre: paciente?.nombre_completo ?? "Paciente",
    servicioNombre: nombreServicio,
    notas: null,
    fechaHoraInicio: citaPrevia.fecha_hora_inicio,
    fechaHoraFin: citaPrevia.fecha_hora_fin,
  });

  if (resultado.ok && resultado.eventId) {
    await supabase
      .from("citas")
      .update({ google_event_id: resultado.eventId })
      .eq("id", citaId);
  } else if (!resultado.ok) {
    await registrarErrorIntegracion({
      citaId,
      pacienteId: citaPrevia.paciente_id,
      evento: "google_calendar_crear",
      error: resultado.error ?? "Error desconocido.",
    });
  }
}

async function eliminarEventoDeCitaCancelada(
  citaId: string,
  googleEventId: string,
  pacienteId: string
) {
  const resultado = await eliminarEventoGoogleCalendar(googleEventId);
  if (resultado.ok) {
    const supabase = await createClient();
    await supabase
      .from("citas")
      .update({ google_event_id: null })
      .eq("id", citaId);
  } else {
    await registrarErrorIntegracion({
      citaId,
      pacienteId,
      evento: "google_calendar_eliminar",
      error: resultado.error ?? "Error desconocido.",
    });
  }
}

async function notificarCitaConfirmadaPorCorreo(
  citaId: string,
  citaPrevia: {
    paciente_id: string;
    fecha_hora_inicio: string;
  }
) {
  const supabase = await createClient();

  const [{ data: paciente }, { data: citaServicios }, { data: correoMedico }] =
    await Promise.all([
      supabase
        .from("pacientes")
        .select("nombre_completo, telefono, correo")
        .eq("id", citaPrevia.paciente_id)
        .single(),
      supabase
        .from("citas_servicios")
        .select("servicios(nombre)")
        .eq("cita_id", citaId),
      supabase.rpc("medico_correo_notificaciones"),
    ]);

  const nombreServicio =
    (citaServicios?.[0]?.servicios as { nombre?: string } | null)?.nombre ??
    null;

  const resultado = await enviarCorreoCitaConfirmada({
    correoDestino: (correoMedico as unknown as string) ?? "",
    pacienteNombre: paciente?.nombre_completo ?? "Paciente",
    pacienteTelefono: paciente?.telefono ?? null,
    pacienteCorreo: paciente?.correo ?? null,
    fechaHoraInicio: citaPrevia.fecha_hora_inicio,
    servicioNombre: nombreServicio,
  });

  if (!resultado.ok) {
    await registrarErrorIntegracion({
      citaId,
      pacienteId: citaPrevia.paciente_id,
      evento: "correo_cita_confirmada",
      error: resultado.error ?? "Error desconocido.",
    });
  }
}

export async function marcarConfirmadaPorPaciente(id: string) {
  const supabase = await createClient();
  await supabase
    .from("citas")
    .update({ confirmada_por_paciente: true })
    .eq("id", id);
  revalidatePath(`/calendario/citas/${id}`);
}
