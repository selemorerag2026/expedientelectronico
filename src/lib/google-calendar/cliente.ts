import { google } from "googleapis";

// Alcance mínimo necesario: crear/editar/borrar eventos, no leer ni
// administrar el resto del calendario del médico.
export const SCOPES_GOOGLE_CALENDAR = [
  "https://www.googleapis.com/auth/calendar.events",
];

export function crearOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function googleCalendarConfigurado() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}
