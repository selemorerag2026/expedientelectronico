const TZ = process.env.NEXT_PUBLIC_APP_TZ || "America/Costa_Rica";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function partesFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return { anio, mes, dia };
}

// "Hoy" según la zona horaria de la aplicación, no la del servidor donde
// corre Node (importante una vez desplegado en Render, que corre en UTC).
export function fechaHoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

function hoyEnCR() {
  return partesFecha(fechaHoyISO());
}

// fechaNacimiento es una columna DATE ("YYYY-MM-DD", sin hora ni zona).
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = hoyEnCR();
  const nacimiento = partesFecha(fechaNacimiento);
  let edad = hoy.anio - nacimiento.anio;
  const noHaCumplidoAnios =
    hoy.mes < nacimiento.mes ||
    (hoy.mes === nacimiento.mes && hoy.dia < nacimiento.dia);
  if (noHaCumplidoAnios) edad -= 1;
  return edad;
}

// Para fechas "solo calendario" (DATE de Postgres). No usa Date/Intl con
// timeZone porque un string "YYYY-MM-DD" se interpreta como medianoche UTC,
// lo que corre el día mostrado al convertir a America/Costa_Rica (UTC-6).
export function formatearFecha(fecha: string): string {
  const { anio, mes, dia } = partesFecha(fecha);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

// Para timestamptz de Postgres (traen offset, ej. "2026-08-02T20:30:00+00:00").
export function formatearFechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: TZ,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

export function formatearHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

// Combina una fecha y hora que el usuario escribió (asumiendo hora local del
// consultorio) en un instante UTC correcto. Costa Rica no observa horario de
// verano, así que el offset -06:00 es fijo todo el año.
export function combinarFechaHoraCR(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00-06:00`;
}

// Inverso de combinarFechaHoraCR: separa un timestamptz en fecha y hora
// locales de Costa Rica, para precargar formularios (ej. reagendar).
export function partesEnCR(fechaHoraISO: string): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(fechaHoraISO));

  const obtener = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "00";

  return {
    fecha: `${obtener("year")}-${obtener("month")}-${obtener("day")}`,
    hora: `${obtener("hour")}:${obtener("minute")}`,
  };
}
