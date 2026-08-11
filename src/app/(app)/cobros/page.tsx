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
import { combinarFechaHoraCR, formatearFechaHora } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { CobroConPaciente } from "@/lib/types/database";

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; q?: string }>;
}) {
  const { desde, hasta, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cobros")
    .select("*, pacientes(id, nombre_completo)")
    .order("created_at", { ascending: false });

  if (desde) query = query.gte("created_at", combinarFechaHoraCR(desde, "00:00"));
  if (hasta) query = query.lte("created_at", combinarFechaHoraCR(hasta, "23:59"));

  if (q) {
    const { data: pacientesCoincidentes } = await supabase
      .from("pacientes")
      .select("id")
      .or(`nombre_completo.ilike.%${q}%,cedula.ilike.%${q}%`);
    const ids = (pacientesCoincidentes ?? []).map((p) => p.id);
    query = query.in("paciente_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: cobros } = await query.returns<CobroConPaciente[]>();

  const totalCobrado = (cobros ?? [])
    .filter((c) => c.estado === "pagado")
    .reduce((suma, c) => suma + c.monto, 0);
  const totalPendiente = (cobros ?? [])
    .filter((c) => c.estado === "pendiente")
    .reduce((suma, c) => suma + c.monto, 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="font-heading text-xl font-medium">Cobros</h1>

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
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
        {(desde || hasta || q) && (
          <Button variant="ghost" render={<Link href="/cobros" />}>
            Limpiar
          </Button>
        )}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total cobrado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            ₡{totalCobrado.toLocaleString("es-CR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total pendiente</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            ₡{totalPendiente.toLocaleString("es-CR")}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg ring-1 ring-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cobros?.map((cobro) => (
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
                <TableCell>{cobro.metodo_pago ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={cobro.estado === "pagado" ? "default" : "secondary"}>
                    {cobro.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {cobros?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
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
