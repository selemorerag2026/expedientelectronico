"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ServicioSchema, type ServicioFormValues } from "@/lib/validations/servicio";

export type ServicioActionState = { error?: string };

export async function crearServicio(
  data: ServicioFormValues
): Promise<ServicioActionState> {
  const validado = ServicioSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del servicio." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").insert(validado.data);

  if (error) {
    return { error: "No se pudo crear el servicio. Intenta de nuevo." };
  }

  redirect("/servicios");
}

export async function actualizarServicio(
  id: string,
  data: ServicioFormValues
): Promise<ServicioActionState> {
  const validado = ServicioSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del servicio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("servicios")
    .update(validado.data)
    .eq("id", id);

  if (error) {
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  redirect("/servicios");
}

export async function alternarActivoServicio(id: string, activo: boolean) {
  const supabase = await createClient();
  await supabase.from("servicios").update({ activo: !activo }).eq("id", id);
  revalidatePath("/servicios");
}
