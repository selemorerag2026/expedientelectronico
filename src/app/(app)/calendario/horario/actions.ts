"use server";

import { revalidatePath } from "next/cache";

import { getMedicoPorDefectoId } from "@/lib/citas/medico-por-defecto";
import { createClient } from "@/lib/supabase/server";
import {
  HorarioAtencionSchema,
  type HorarioAtencionFormValues,
} from "@/lib/validations/horario-atencion";

export type HorarioActionState = { error?: string };

export async function agregarHorario(
  data: HorarioAtencionFormValues
): Promise<HorarioActionState> {
  const validado = HorarioAtencionSchema.safeParse(data);
  if (!validado.success) {
    return { error: validado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const medicoId = await getMedicoPorDefectoId();
  if (!medicoId) {
    return { error: "No se encontró un usuario con rol médico." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("horarios_atencion").insert({
    medico_id: medicoId,
    ...validado.data,
  });

  if (error) {
    return { error: "No se pudo guardar el horario. Intenta de nuevo." };
  }

  revalidatePath("/calendario/horario");
  return {};
}

export async function eliminarHorario(id: string) {
  const supabase = await createClient();
  await supabase.from("horarios_atencion").delete().eq("id", id);
  revalidatePath("/calendario/horario");
}

export async function alternarActivoHorario(id: string, activo: boolean) {
  const supabase = await createClient();
  await supabase
    .from("horarios_atencion")
    .update({ activo: !activo })
    .eq("id", id);
  revalidatePath("/calendario/horario");
}
