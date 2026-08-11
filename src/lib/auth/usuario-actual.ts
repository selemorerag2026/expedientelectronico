import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types/database";

// Memoizado por petición: layout, páginas y componentes pueden llamarlo
// varias veces sin repetir la consulta a Supabase.
export const getUsuarioActual = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single<Perfil>();

  return { user, perfil };
});
