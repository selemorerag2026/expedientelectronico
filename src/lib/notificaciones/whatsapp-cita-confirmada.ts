import twilio from "twilio";

import { generarEnlaceGoogleCalendarPaciente } from "@/lib/citas/enlace-google-calendar-paciente";
import { formatearFechaHora } from "@/lib/fecha";

export type DatosWhatsAppCitaConfirmada = {
  pacienteTelefono: string | null;
  pacienteNombre: string;
  medicoNombre: string;
  servicioNombre: string | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
};

// Los teléfonos se guardan como los escribe el personal (ej. "8888-8888"),
// sin código de país. WhatsApp/Twilio necesitan formato E.164. Costa Rica
// no tiene códigos de área: un número local son 8 dígitos.
export function normalizarTelefonoCR(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, "");
  if (soloDigitos.length === 8) {
    return `+506${soloDigitos}`;
  }
  if (soloDigitos.startsWith("506") && soloDigitos.length === 11) {
    return `+${soloDigitos}`;
  }
  // Formato inesperado (ya trae otro código de país, o algo mal escrito):
  // se manda tal cual con un "+" y que sea Twilio quien reporte el error,
  // en vez de adivinar un país incorrecto.
  return `+${soloDigitos}`;
}

function plantillaMensaje(datos: DatosWhatsAppCitaConfirmada): string {
  const enlaceCalendario = generarEnlaceGoogleCalendarPaciente({
    medicoNombre: datos.medicoNombre,
    servicioNombre: datos.servicioNombre,
    fechaHoraInicio: datos.fechaHoraInicio,
    fechaHoraFin: datos.fechaHoraFin,
  });

  const lineas = [
    `Hola ${datos.pacienteNombre}, tu cita quedó confirmada.`,
    "",
    `📅 ${formatearFechaHora(datos.fechaHoraInicio)}`,
    datos.servicioNombre ? `Servicio: ${datos.servicioNombre}` : null,
    "",
    `Agrégala a tu Google Calendar: ${enlaceCalendario}`,
  ].filter((linea) => linea !== null);

  return lineas.join("\n");
}

export async function enviarWhatsAppCitaConfirmada(
  datos: DatosWhatsAppCitaConfirmada
): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const numeroWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !numeroWhatsApp) {
    return {
      ok: false,
      error:
        "Faltan variables de entorno de Twilio (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_NUMBER).",
    };
  }
  if (!datos.pacienteTelefono) {
    return { ok: false, error: "El paciente no tiene teléfono registrado." };
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: `whatsapp:${numeroWhatsApp}`,
      to: `whatsapp:${normalizarTelefonoCR(datos.pacienteTelefono)}`,
      body: plantillaMensaje(datos),
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido.",
    };
  }
}
