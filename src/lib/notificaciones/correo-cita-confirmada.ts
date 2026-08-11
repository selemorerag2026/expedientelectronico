import { Resend } from "resend";

import { formatearFechaHora } from "@/lib/fecha";

export type DatosCorreoCitaConfirmada = {
  correoDestino: string;
  pacienteNombre: string;
  pacienteTelefono: string | null;
  pacienteCorreo: string | null;
  fechaHoraInicio: string;
  servicioNombre: string | null;
};

function plantillaHtml(datos: DatosCorreoCitaConfirmada): string {
  const fila = (etiqueta: string, valor: string) => `
    <tr>
      <td style="padding:6px 0;color:#6d6580;font-size:13px;width:140px;vertical-align:top;">${etiqueta}</td>
      <td style="padding:6px 0;color:#201c2e;font-size:14px;font-weight:600;">${valor}</td>
    </tr>`;

  return `
  <div style="background-color:#f2f0f9;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px -4px rgba(108,92,224,0.15);">
      <div style="background-color:#6c5ce0;padding:20px 24px;">
        <span style="color:#ffffff;font-size:15px;font-weight:600;">Expediente Clínico</span>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 4px;font-size:18px;color:#201c2e;">Cita confirmada</h1>
        <p style="margin:0 0 20px;font-size:14px;color:#6d6580;">
          Se confirmó una cita agendada desde el portal público.
        </p>
        <table style="width:100%;border-collapse:collapse;">
          ${fila("Paciente", datos.pacienteNombre)}
          ${fila("Fecha y hora", formatearFechaHora(datos.fechaHoraInicio))}
          ${datos.servicioNombre ? fila("Servicio", datos.servicioNombre) : ""}
          ${datos.pacienteTelefono ? fila("Teléfono", datos.pacienteTelefono) : ""}
          ${datos.pacienteCorreo ? fila("Correo", datos.pacienteCorreo) : ""}
        </table>
      </div>
      <div style="padding:14px 24px;background-color:#f2f0f9;">
        <span style="font-size:12px;color:#6d6580;">
          Notificación automática — no es necesario responder este correo.
        </span>
      </div>
    </div>
  </div>`;
}

export async function enviarCorreoCitaConfirmada(
  datos: DatosCorreoCitaConfirmada
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY no está configurada." };
  }
  if (!datos.correoDestino) {
    return {
      ok: false,
      error:
        "No hay correo de notificaciones configurado (ver /configuracion).",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: datos.correoDestino,
      subject: `Cita confirmada — ${datos.pacienteNombre}`,
      html: plantillaHtml(datos),
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido.",
    };
  }
}
