"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { CobroSchema, type CobroFormValues } from "@/lib/validations/cobro";

export type CobroActionState = { error?: string };

export async function crearCobro(
  citaId: string,
  pacienteId: string,
  data: CobroFormValues
): Promise<CobroActionState> {
  const validado = CobroSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del cobro." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("cobros").insert({
    cita_id: citaId,
    paciente_id: pacienteId,
    monto: validado.data.monto,
    metodo_pago: validado.data.metodo_pago || null,
    estado: validado.data.estado,
    fecha_pago: validado.data.estado === "pagado" ? new Date().toISOString() : null,
    notas: validado.data.notas || null,
    registrado_por: user?.id,
  });

  if (error) {
    return { error: "No se pudo registrar el cobro. Intenta de nuevo." };
  }

  revalidatePath(`/calendario/citas/${citaId}`);
  revalidatePath("/cobros");
  return {};
}

export async function marcarCobroPagado(id: string, citaId: string | null) {
  const supabase = await createClient();
  await supabase
    .from("cobros")
    .update({ estado: "pagado", fecha_pago: new Date().toISOString() })
    .eq("id", id);

  if (citaId) revalidatePath(`/calendario/citas/${citaId}`);
  revalidatePath("/cobros");
}
