import { NextResponse, type NextRequest } from "next/server";

import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import {
  crearOAuthClient,
  googleCalendarConfigurado,
  SCOPES_GOOGLE_CALENDAR,
} from "@/lib/google-calendar/cliente";
import { origenPublico } from "@/lib/http/origen-publico";

export async function GET(request: NextRequest) {
  const origen = origenPublico(request);
  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    return NextResponse.redirect(new URL("/dashboard", origen));
  }

  if (!googleCalendarConfigurado()) {
    return NextResponse.redirect(
      new URL("/configuracion?google=no_configurado", origen)
    );
  }

  const oauth2Client = crearOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES_GOOGLE_CALENDAR,
  });

  return NextResponse.redirect(url);
}
