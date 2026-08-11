import { fechaHoyISO } from "@/lib/fecha";

export type PresetRango = "este_mes" | "mes_pasado" | "este_anio" | "personalizado";

export const PRESETS_RANGO: { value: PresetRango; label: string }[] = [
  { value: "este_mes", label: "Este mes" },
  { value: "mes_pasado", label: "Mes pasado" },
  { value: "este_anio", label: "Este año" },
  { value: "personalizado", label: "Personalizado" },
];

function formatearISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

// Los cálculos de "hoy/este mes/este año" usan la fecha de Costa Rica
// (fechaHoyISO), pero una vez que tenemos los límites como "YYYY-MM-DD" ya
// no importa la zona horaria del servidor para las operaciones de calendario.
export function calcularRango(
  preset: PresetRango | undefined,
  desdeParam?: string,
  hastaParam?: string
): { desde: string; hasta: string; preset: PresetRango } {
  const hoy = fechaHoyISO();
  const [anio, mes] = hoy.split("-").map(Number);

  if (preset === "personalizado" && desdeParam && hastaParam) {
    return { desde: desdeParam, hasta: hastaParam, preset };
  }

  if (preset === "mes_pasado") {
    const mesPasado = new Date(Date.UTC(anio, mes - 2, 1));
    const finMesPasado = new Date(Date.UTC(anio, mes - 1, 0));
    return {
      desde: formatearISO(mesPasado),
      hasta: formatearISO(finMesPasado),
      preset,
    };
  }

  if (preset === "este_anio") {
    return { desde: `${anio}-01-01`, hasta: hoy, preset };
  }

  // "este_mes" es el valor por defecto
  const inicioMes = new Date(Date.UTC(anio, mes - 1, 1));
  return { desde: formatearISO(inicioMes), hasta: hoy, preset: "este_mes" };
}

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// Genera los meses (clave "YYYY-MM") entre desde y hasta, inclusive, para
// poder mostrar en el reporte incluso los meses sin pacientes nuevos (barra
// en cero). Con un tope para no generar cientos de meses con un rango raro.
export function mesesEnRango(
  desde: string,
  hasta: string,
  tope = 24
): { clave: string; etiqueta: string }[] {
  const [anioDesde, mesDesde] = desde.split("-").map(Number);
  const [anioHasta, mesHasta] = hasta.split("-").map(Number);

  const meses: { clave: string; etiqueta: string }[] = [];
  let anio = anioDesde;
  let mes = mesDesde;

  while (
    (anio < anioHasta || (anio === anioHasta && mes <= mesHasta)) &&
    meses.length < tope
  ) {
    const mesStr = String(mes).padStart(2, "0");
    meses.push({
      clave: `${anio}-${mesStr}`,
      etiqueta: `${MESES_CORTOS[mes - 1]} ${anio}`,
    });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }

  return meses;
}
