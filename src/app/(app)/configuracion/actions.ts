"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { createClient } from "@/lib/supabase/server";

export type ConfiguracionActionState = { error?: string };

const CorreoSchema = z.union([
  z.email({ error: "Ingresa un correo válido." }),
  z.literal(""),
]);

export async function actualizarCorreoNotificaciones(
  correo: string
): Promise<ConfiguracionActionState> {
  const validado = CorreoSchema.safeParse(correo.trim());
  if (!validado.success) {
    return { error: "Ingresa un correo válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa." };
  }

  const { error } = await supabase
    .from("perfiles")
    .update({ correo_notificaciones: validado.data || null })
    .eq("id", user.id);

  if (error) {
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/configuracion");
  return {};
}

export async function desconectarGoogleCalendar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("google_calendar_tokens").delete().eq("perfil_id", user.id);
  revalidatePath("/configuracion");
}
