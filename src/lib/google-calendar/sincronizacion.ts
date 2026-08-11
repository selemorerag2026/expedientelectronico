import { google, type calendar_v3 } from "googleapis";

import { crearOAuthClient } from "@/lib/google-calendar/cliente";
import { createClient } from "@/lib/supabase/server";

const ZONA_HORARIA = process.env.NEXT_PUBLIC_APP_TZ || "America/Costa_Rica";

type TokenGoogle = {
  access_token: string;
  refresh_token: string;
  expiry_date: string;
  calendar_id: string;
};

type ResultadoSync = { ok: boolean; error?: string };

async function obtenerClienteCalendario(): Promise<{
  calendar: calendar_v3.Calendar;
  calendarId: string;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("obtener_token_google_medico");
  const filas = data as unknown as TokenGoogle[] | null;
  const token = filas?.[0];
  if (!token) return null;

  const oauth2Client = crearOAuthClient();
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: new Date(token.expiry_date).getTime(),
  });

  // Si el SDK refresca el access_token durante esta sincronización, lo
  // dejamos guardado — si no, la próxima sincronización vuelve a fallar y
  // a refrescar en cada intento innecesariamente.
  oauth2Client.on("tokens", (tokens) => {
    if (!tokens.access_token || !tokens.expiry_date) return;
    createClient()
      .then((supabaseInterno) =>
        supabaseInterno.rpc("actualizar_token_google_medico", {
          p_access_token: tokens.access_token,
          p_expiry_date: new Date(tokens.expiry_date as number).toISOString(),
        })
      )
      .catch(() => {
        // Best-effort: si esto falla, el próximo refresh lo vuelve a intentar.
      });
  });

  return {
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    calendarId: token.calendar_id || "primary",
  };
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido.";
}

export async function crearEventoGoogleCalendar(datos: {
  pacienteNombre: string;
  servicioNombre: string | null;
  notas: string | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
}): Promise<ResultadoSync & { eventId?: string }> {
  try {
    const cliente = await obtenerClienteCalendario();
    if (!cliente) {
      return { ok: false, error: "Google Calendar no está conectado." };
    }

    const descripcion = [datos.servicioNombre, datos.notas]
      .filter(Boolean)
      .join("\n\n");

    const evento = await cliente.calendar.events.insert({
      calendarId: cliente.calendarId,
      requestBody: {
        summary: datos.pacienteNombre,
        description: descripcion || undefined,
        start: { dateTime: datos.fechaHoraInicio, timeZone: ZONA_HORARIA },
        end: { dateTime: datos.fechaHoraFin, timeZone: ZONA_HORARIA },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 30 }],
        },
      },
    });

    return { ok: true, eventId: evento.data.id ?? undefined };
  } catch (error) {
    return { ok: false, error: mensajeError(error) };
  }
}

export async function actualizarEventoGoogleCalendar(
  eventId: string,
  datos: { fechaHoraInicio: string; fechaHoraFin: string }
): Promise<ResultadoSync> {
  try {
    const cliente = await obtenerClienteCalendario();
    if (!cliente) {
      return { ok: false, error: "Google Calendar no está conectado." };
    }

    await cliente.calendar.events.patch({
      calendarId: cliente.calendarId,
      eventId,
      requestBody: {
        start: { dateTime: datos.fechaHoraInicio, timeZone: ZONA_HORARIA },
        end: { dateTime: datos.fechaHoraFin, timeZone: ZONA_HORARIA },
      },
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: mensajeError(error) };
  }
}

export async function eliminarEventoGoogleCalendar(
  eventId: string
): Promise<ResultadoSync> {
  try {
    const cliente = await obtenerClienteCalendario();
    if (!cliente) {
      return { ok: false, error: "Google Calendar no está conectado." };
    }

    await cliente.calendar.events.delete({
      calendarId: cliente.calendarId,
      eventId,
    });

    return { ok: true };
  } catch (error) {
    const status = (error as { code?: number; status?: number })?.code ??
      (error as { code?: number; status?: number })?.status;
    // El evento ya no existe en Google: el estado deseado (sin evento) ya
    // se cumple, así que no es un error real para nuestro flujo.
    if (status === 404 || status === 410) {
      return { ok: true };
    }
    return { ok: false, error: mensajeError(error) };
  }
}
