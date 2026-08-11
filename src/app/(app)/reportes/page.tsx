import { redirect } from "next/navigation";

import { BarraSimple } from "@/components/reportes/barra-simple";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { combinarFechaHoraCR, partesEnCR } from "@/lib/fecha";
import {
  PRESETS_RANGO,
  calcularRango,
  mesesEnRango,
  type PresetRango,
} from "@/lib/reportes/rango-fechas";
import { createClient } from "@/lib/supabase/server";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    rango?: PresetRango;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    redirect("/dashboard");
  }

  const { rango: rangoParam, desde: desdeParam, hasta: hastaParam } =
    await searchParams;
  const { desde, hasta, preset } = calcularRango(
    rangoParam,
    desdeParam,
    hastaParam
  );

  const inicioRango = combinarFechaHoraCR(desde, "00:00");
  const finRango = combinarFechaHoraCR(hasta, "23:59");

  const supabase = await createClient();

  const [
    { data: pacientesNuevos },
    { data: notas },
    { data: cobrosPagados },
    { data: cobrosPendientes },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select("created_at")
      .gte("created_at", inicioRango)
      .lte("created_at", finRango),
    supabase
      .from("notas_evolucion")
      .select("diagnosticos")
      .gte("fecha", inicioRango)
      .lte("fecha", finRango),
    supabase
      .from("cobros")
      .select("monto")
      .eq("estado", "pagado")
      .gte("fecha_pago", inicioRango)
      .lte("fecha_pago", finRango),
    supabase
      .from("cobros")
      .select("monto")
      .eq("estado", "pendiente")
      .gte("created_at", inicioRango)
      .lte("created_at", finRango),
  ]);

  // Pacientes nuevos por mes
  const conteoPorMes = new Map<string, number>();
  for (const p of pacientesNuevos ?? []) {
    const { fecha } = partesEnCR(p.created_at);
    const clave = fecha.slice(0, 7);
    conteoPorMes.set(clave, (conteoPorMes.get(clave) ?? 0) + 1);
  }
  const datosPacientesPorMes = mesesEnRango(desde, hasta).map((m) => ({
    etiqueta: m.etiqueta,
    valor: conteoPorMes.get(m.clave) ?? 0,
  }));
  const totalPacientesNuevos = pacientesNuevos?.length ?? 0;

  // Diagnósticos más frecuentes
  const conteoDiagnosticos = new Map<string, number>();
  for (const nota of notas ?? []) {
    for (const d of nota.diagnosticos ?? []) {
      const clave = d.descripcion?.trim();
      if (!clave) continue;
      conteoDiagnosticos.set(clave, (conteoDiagnosticos.get(clave) ?? 0) + 1);
    }
  }
  const datosDiagnosticos = [...conteoDiagnosticos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([etiqueta, valor]) => ({ etiqueta, valor }));

  // Ingresos
  const totalIngresos = (cobrosPagados ?? []).reduce(
    (suma, c) => suma + c.monto,
    0
  );
  const totalPendiente = (cobrosPendientes ?? []).reduce(
    (suma, c) => suma + c.monto,
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Cifras del consultorio para el rango de fechas seleccionado.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="rango" className="text-xs text-muted-foreground">
            Rango
          </label>
          <select
            id="rango"
            name="rango"
            defaultValue={preset}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {PRESETS_RANGO.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className="text-xs text-muted-foreground">
            Desde
          </label>
          <Input id="desde" name="desde" type="date" defaultValue={desde} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasta" className="text-xs text-muted-foreground">
            Hasta
          </label>
          <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
        </div>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Ingresos del rango</CardDescription>
            <CardTitle className="text-3xl">
              ₡{totalIngresos.toLocaleString("es-CR")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pendiente de cobro en el rango</CardDescription>
            <CardTitle className="text-3xl">
              ₡{totalPendiente.toLocaleString("es-CR")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pacientes nuevos en el rango</CardDescription>
            <CardTitle className="text-3xl">{totalPacientesNuevos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes nuevos por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <BarraSimple datos={datosPacientesPorMes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos más frecuentes</CardTitle>
          <CardDescription>
            Según las notas de evolución del rango seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarraSimple datos={datosDiagnosticos} />
        </CardContent>
      </Card>
    </div>
  );
}
