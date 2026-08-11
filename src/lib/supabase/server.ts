import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para usar en Server Components, Server Actions y Route Handlers.
// Lee/escribe la sesión desde las cookies de la petición actual.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar: puede pasar si setAll se llama desde un Server Component.
            // La sesión igual se refresca en proxy.ts en cada petición.
          }
        },
      },
    }
  );
}
