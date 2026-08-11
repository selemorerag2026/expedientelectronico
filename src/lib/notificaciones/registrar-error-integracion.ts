import { createClient } from "@/lib/supabase/server";

// Registra en log_auditoria un fallo de una integración externa (correo,
// Google Calendar) ligada a una cita. Nunca debe hacer fallar el flujo que
// la llama — el punto es justamente no bloquear nada, solo dejar rastro.
export async function registrarErrorIntegracion(params: {
  citaId: string;
  pacienteId: string | null;
  evento: string;
  error: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("log_auditoria").insert({
      tabla_afectada: "citas",
      registro_id: params.citaId,
      paciente_id: params.pacienteId,
      accion: "actualizar",
      detalle: { evento: params.evento, error: params.error },
    });
  } catch {
    // Si ni siquiera se pudo registrar el error, no hay nada más que hacer
    // aquí sin arriesgar romper el flujo que llamó a esta función.
  }
}
