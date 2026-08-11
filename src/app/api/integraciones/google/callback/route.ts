import { NextResponse, type NextRequest } from "next/server";

import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { crearOAuthClient } from "@/lib/google-calendar/cliente";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam || !code) {
    return NextResponse.redirect(
      new URL("/configuracion?google=error", request.url)
    );
  }

  try {
    const oauth2Client = crearOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      // Sin refresh_token no podemos mantener la conexión viva más allá de
      // esta sesión — pasa si Google ya había autorizado antes sin pedir
      // consentimiento de nuevo. Con prompt=consent en /iniciar no debería
      // pasar, pero lo cubrimos igual.
      return NextResponse.redirect(
        new URL("/configuracion?google=sin_refresh_token", request.url)
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("google_calendar_tokens").upsert(
      {
        perfil_id: actual.user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: new Date(tokens.expiry_date).toISOString(),
        calendar_id: "primary",
      },
      { onConflict: "perfil_id" }
    );

    if (error) {
      return NextResponse.redirect(
        new URL("/configuracion?google=error", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/configuracion?google=conectado", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/configuracion?google=error", request.url)
    );
  }
}
