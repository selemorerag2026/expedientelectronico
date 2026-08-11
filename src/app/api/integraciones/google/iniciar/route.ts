import { NextResponse, type NextRequest } from "next/server";

import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import {
  crearOAuthClient,
  googleCalendarConfigurado,
  SCOPES_GOOGLE_CALENDAR,
} from "@/lib/google-calendar/cliente";

export async function GET(request: NextRequest) {
  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!googleCalendarConfigurado()) {
    return NextResponse.redirect(
      new URL("/configuracion?google=no_configurado", request.url)
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
