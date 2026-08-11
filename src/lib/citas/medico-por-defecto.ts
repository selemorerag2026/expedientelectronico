import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

// Hoy solo hay un médico en el consultorio. Cuando se agregue más de uno,
// aquí es donde habría que dejar que el usuario elija a cuál médico
// pertenece la cita/horario, en vez de tomar siempre el primero.
export const getMedicoPorDefectoId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  // RPC en vez de "select ... from perfiles": la tabla perfiles tiene RLS
  // que solo deja leer la fila propia (o cualquiera si ya eres médico), así
  // que una asistente o un visitante anónimo (portal público) no podrían
  // leerla directo. La función es security definer y solo expone el id.
  const { data } = await supabase.rpc("medico_por_defecto_id");
  return data ?? null;
});
