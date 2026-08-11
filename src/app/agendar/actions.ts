"use server";

import { getMedicoPorDefectoId } from "@/lib/citas/medico-por-defecto";
import { combinarFechaHoraCR } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import {
  AgendarPublicoSchema,
  type AgendarPublicoFormValues,
} from "@/lib/validations/agendar-publico";

export type ConfirmarCitaState = { error?: string; citaId?: string };

function diaSemanaDeFecha(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia).getDay();
}

function seSolapan(
  inicioA: number,
  finA: number,
  inicioB: number,
  finB: number
) {
  return inicioA < finB && finA > inicioB;
}

export async function obtenerHorariosDisponibles(
  servicioId: string,
  fecha: string
): Promise<string[]> {
  if (!servicioId || !fecha) return [];

  const supabase = await createClient();
  const medicoId = await getMedicoPorDefectoId();
  if (!medicoId) return [];

  const { data: servicio } = await supabase
    .from("servicios")
    .select("duracion_minutos")
    .eq("id", servicioId)
    .eq("activo", true)
    .eq("visible_portal_publico", true)
    .single<{ duracion_minutos: number }>();
  if (!servicio) return [];

  const diaSemana = diaSemanaDeFecha(fecha);

  const { data: bloques } = await supabase
    .from("horarios_atencion")
    .select("hora_inicio, hora_fin")
    .eq("medico_id", medicoId)
    .eq("dia_semana", diaSemana)
    .eq("activo", true)
    .returns<{ hora_inicio: string; hora_fin: string }[]>();

  if (!bloques || bloques.length === 0) return [];

  const inicioDelDia = combinarFechaHoraCR(fecha, "00:00");
  const finDelDia = combinarFechaHoraCR(fecha, "23:59");

  const { data: ocupadas } = await supabase
    .from("citas_ocupadas_publico")
    .select("fecha_hora_inicio, fecha_hora_fin")
    .eq("medico_id", medicoId)
    .lt("fecha_hora_inicio", finDelDia)
    .gt("fecha_hora_fin", inicioDelDia)
    .returns<{ fecha_hora_inicio: string; fecha_hora_fin: string }[]>();

  const ocupadosMs = (ocupadas ?? []).map((o) => ({
    inicio: new Date(o.fecha_hora_inicio).getTime(),
    fin: new Date(o.fecha_hora_fin).getTime(),
  }));

  const duracionMs = servicio.duracion_minutos * 60_000;
  const ahoraMs = Date.now();
  const disponibles: string[] = [];

  for (const bloque of bloques) {
    let cursor = new Date(
      combinarFechaHoraCR(fecha, bloque.hora_inicio.slice(0, 5))
    ).getTime();
    const finBloque = new Date(
      combinarFechaHoraCR(fecha, bloque.hora_fin.slice(0, 5))
    ).getTime();

    while (cursor + duracionMs <= finBloque) {
      const finSlot = cursor + duracionMs;
      const ocupado = ocupadosMs.some((o) =>
        seSolapan(cursor, finSlot, o.inicio, o.fin)
      );
      if (!ocupado && cursor > ahoraMs) {
        const horaLocal = new Intl.DateTimeFormat("en-GB", {
          timeZone: process.env.NEXT_PUBLIC_APP_TZ || "America/Costa_Rica",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(cursor));
        disponibles.push(horaLocal);
      }
      cursor += duracionMs;
    }
  }

  return disponibles;
}

export async function confirmarCitaPublica(
  servicioId: string,
  fecha: string,
  hora: string,
  data: AgendarPublicoFormValues
): Promise<ConfirmarCitaState> {
  const validado = AgendarPublicoSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos ingresados." };
  }

  const medicoId = await getMedicoPorDefectoId();
  if (!medicoId) {
    return { error: "No se pudo agendar la cita. Intenta más tarde." };
  }

  const supabase = await createClient();
  const { data: citaId, error } = await supabase.rpc("agendar_cita_publica", {
    p_paciente_nombre: validado.data.nombre_completo,
    p_paciente_telefono: validado.data.telefono,
    p_paciente_correo: validado.data.correo || null,
    p_paciente_cedula: validado.data.cedula || null,
    p_paciente_fecha_nacimiento: validado.data.fecha_nacimiento,
    p_medico_id: medicoId,
    p_servicio_id: servicioId,
    p_fecha_hora_inicio: combinarFechaHoraCR(fecha, hora),
  });

  if (error || !citaId) {
    if (error?.code === "23P01") {
      return {
        error: "Ese horario se acaba de ocupar. Elige otro, por favor.",
      };
    }
    return { error: "No se pudo agendar la cita. Intenta de nuevo." };
  }

  return { citaId };
}
