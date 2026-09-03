import Link from "next/link";
import { WalletIcon } from "lucide-react";

import { EstadoVacio } from "@/components/estado-vacio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ESTADOS_COBRO,
  esVencido,
  estadoVisualCobro,
} from "@/lib/cobros/color-estado-cobro";
import { combinarFechaHoraCR, formatearFechaHora } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { CobroConPaciente, EstadoCobroCalculado } from "@/lib/types/database";

type FiltroEstado = EstadoCobroCalculado | "vencido";

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    q?: string;
    estado?: FiltroEstado;
  }>;
}) {
  const { desde, hasta, q, estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cobros_con_estado")
    .select("*, pacientes(id, nombre_completo)")
    .order("created_at", { ascending: false });

  if (desde) query = query.gte("created_at", combinarFechaHoraCR(desde, "00:00"));
  if (hasta) query = query.lte("created_at", combinarFechaHoraCR(hasta, "23:59"));
  if (estado && estado !== "vencido") query = query.eq("estado_calculado", estado);

  if (q) {
    const { data: pacientesCoincidentes } = await supabase
      .from("pacientes")
      .select("id")
      .or(`nombre_completo.ilike.%${q}%,cedula.ilike.%${q}%`);
    const ids = (pacientesCoincidentes ?? []).map((p) => p.id);
    query = query.in("paciente_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: cobrosSinFiltroVencido } = await query.returns<CobroConPaciente[]>();

  // "Vencido" no es una columna de la base de datos (depende de la fecha de
  // hoy), así que ese filtro se aplica aquí en vez de en la consulta.
  const cobros =
    estado === "vencido"
      ? (cobrosSinFiltroVencido ?? []).filter((c) => esVencido(c))
      : cobrosSinFiltroVencido;

  const totalFacturado = (cobrosSinFiltroVencido ?? []).reduce(
    (suma, c) => suma + c.monto,
    0
  );
  const totalCobrado = (cobrosSinFiltroVencido ?? []).reduce(
    (suma, c) => suma + c.monto_pagado,
    0
  );
  const totalPendiente = (cobrosSinFiltroVencido ?? [])
    .filter((c) => c.estado_calculado !== "pagado")
    .reduce((suma, c) => suma + c.saldo, 0);
  const totalVencido = (cobrosSinFiltroVencido ?? [])
    .filter((c) => esVencido(c))
    .reduce((suma, c) => suma + c.saldo, 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="font-heading text-xl font-medium">Cobros</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Facturado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            ₡{totalFacturado.toLocaleString("es-CR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            ₡{totalCobrado.toLocaleString("es-CR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            ₡{totalPendiente.toLocaleString("es-CR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Vencido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium text-destructive">
            ₡{totalVencido.toLocaleString("es-CR")}
          </CardContent>
        </Card>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
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
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-muted-foreground">
            Paciente (nombre o cédula)
          </label>
          <Input id="q" name="q" defaultValue={q} className="w-64" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="estado" className="text-xs text-muted-foreground">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={estado ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Todos</option>
            {ESTADOS_COBRO.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
        {(desde || hasta || q || estado) && (
          <Button variant="ghost" render={<Link href="/cobros" />}>
            Limpiar
          </Button>
        )}
      </form>

      <div className="rounded-lg ring-1 ring-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cobros?.map((cobro) => {
              const visual = estadoVisualCobro(cobro);
              return (
                <TableRow key={cobro.id}>
                  <TableCell>{formatearFechaHora(cobro.created_at)}</TableCell>
                  <TableCell>
                    {cobro.pacientes ? (
                      <Link
                        href={`/pacientes/${cobro.pacientes.id}`}
                        className="hover:underline"
                      >
                        {cobro.pacientes.nombre_completo}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>₡{cobro.monto.toLocaleString("es-CR")}</TableCell>
                  <TableCell>₡{cobro.saldo.toLocaleString("es-CR")}</TableCell>
                  <TableCell>
                    <Badge variant={visual.variant}>{visual.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/cobros/${cobro.id}`} />}
                    >
                      {cobro.estado_calculado === "pagado" ? "Ver" : "Registrar pago"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {cobros?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EstadoVacio
                    icon={WalletIcon}
                    titulo="No hay cobros registrados"
                    descripcion="Prueba con otros filtros, o registra un cobro desde el detalle de una cita."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
