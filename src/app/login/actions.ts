"use server";

import { redirect } from "next/navigation";
import * as z from "zod";

import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  correo: z.email({ error: "Ingresa un correo válido." }),
  contrasena: z.string().min(1, { error: "Ingresa tu contraseña." }),
});

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validatedFields = LoginSchema.safeParse({
    correo: formData.get("correo"),
    contrasena: formData.get("contrasena"),
  });

  if (!validatedFields.success) {
    return { error: "Revisa el correo y la contraseña ingresados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.correo,
    password: validatedFields.data.contrasena,
  });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
