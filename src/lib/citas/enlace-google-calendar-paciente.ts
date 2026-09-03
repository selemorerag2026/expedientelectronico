// Enlace público "Agregar a Google Calendar" para que el PACIENTE guarde su
// cita con un clic — sin OAuth, sin que el paciente conecte ninguna cuenta.
// Distinto de src/lib/google-calendar/ (esa es la integración del MÉDICO,
// que sí requiere conectar su cuenta vía OAuth para crear eventos reales).
const BASE_URL = "https://calendar.google.com/calendar/render";

// Google espera "YYYYMMDDTHHMMSSZ" en UTC en el parámetro "dates". Las
// fechas de citas ya son instantes absolutos (timestamptz de Postgres), así
// que basta convertirlas a UTC con Date — no hay que sumar/restar el offset
// de Costa Rica a mano (ese cálculo manual es la fuente más común de bugs
// de zona horaria en este tipo de enlace).
function formatoUTCGoogle(fechaHoraISO: string): string {
  return (
    new Date(fechaHoraISO).toISOString().replace(/[-:]/g, "").split(".")[0] +
    "Z"
  );
}

export function generarEnlaceGoogleCalendarPaciente(datos: {
  medicoNombre: string;
  servicioNombre: string | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  ubicacion?: string | null;
}): string {
  const detalles = [
    datos.servicioNombre ? `Servicio: ${datos.servicioNombre}` : null,
    "Llegar 10 minutos antes de la hora de la cita.",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Cita médica - Dr(a). ${datos.medicoNombre}`,
    dates: `${formatoUTCGoogle(datos.fechaHoraInicio)}/${formatoUTCGoogle(datos.fechaHoraFin)}`,
    details: detalles,
  });

  if (datos.ubicacion) {
    params.set("location", datos.ubicacion);
  }

  return `${BASE_URL}?${params.toString()}`;
}
