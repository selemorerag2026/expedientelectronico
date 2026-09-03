import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { Suspense } from "react";

import { BuscadorPacientes } from "@/components/pacientes/buscador-pacientes";
import { EstadoVacio } from "@/components/estado-vacio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcularEdad, formatearFecha, partesEnCR } from "@/lib/fecha";
import { iniciales } from "@/lib/texto/iniciales";
import { createClient } from "@/lib/supabase/server";
import type { Paciente, PacienteConCitas } from "@/lib/types/database";

type Filtro = "todos" | "activos" | "con_cita_proxima" | "inactivos";

const CHIPS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "con_cita_proxima", label: "Con cita próxima" },
  { value: "inactivos", label: "Inactivos" },
];

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: Filtro }>;
}) {
  const { q, filtro = "todos" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("pacientes")
    .select("*")
    .order("nombre_completo")
    .limit(100);

  if (q) {
    query = query.or(`nombre_completo.ilike.%${q}%,cedula.ilike.%${q}%`);
  }
  if (filtro === "activos") query = query.eq("estado", "activo");
  if (filtro === "inactivos") query = query.eq("estado", "inactivo");

  if (filtro === "con_cita_proxima") {
    const { data: conCita } = await supabase
      .from("pacientes_con_citas")
      .select("paciente_id")
      .not("proxima_cita", "is", null);
    const ids = (conCita ?? []).map((c) => c.paciente_id);
    query = query.in(
      "id",
      ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]
    );
  }

  const { data: pacientes } = await query.returns<Paciente[]>();

  const citasPorPaciente = new Map<string, PacienteConCitas>();
  if (pacientes && pacientes.length > 0) {
    const { data: citasInfo } = await supabase
      .from("pacientes_con_citas")
      .select("*")
      .in("paciente_id", pacientes.map((p) => p.id))
      .returns<PacienteConCitas[]>();
    for (const info of citasInfo ?? []) {
      citasPorPaciente.set(info.paciente_id, info);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-medium">Pacientes</h1>
        <Button render={<Link href="/pacientes/nuevo" />}>
          Nuevo paciente
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense>
          <BuscadorPacientes />
        </Suspense>
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((chip) => (
            <Button
              key={chip.value}
              size="sm"
              variant={filtro === chip.value ? "default" : "secondary"}
              render={
                <Link
                  href={
                    chip.value === "todos"
                      ? "/pacientes"
                      : `/pacientes?filtro=${chip.value}`
                  }
                />
              }
              className="rounded-full"
            >
              {chip.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg ring-1 ring-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Última visita</TableHead>
              <TableHead>Próxima cita</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes?.map((paciente) => {
              const infoCitas = citasPorPaciente.get(paciente.id);
              return (
                <TableRow key={paciente.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/pacientes/${paciente.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <Avatar size="sm">
                        <AvatarFallback className="bg-secondary text-accent-foreground">
                          {iniciales(paciente.nombre_completo)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {paciente.nombre_completo}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {calcularEdad(paciente.fecha_nacimiento)} años
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{paciente.cedula ?? "—"}</TableCell>
                  <TableCell>
                    {infoCitas?.ultima_visita
                      ? formatearFecha(partesEnCR(infoCitas.ultima_visita).fecha)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {infoCitas?.proxima_cita
                      ? formatearFecha(partesEnCR(infoCitas.proxima_cita).fecha)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        paciente.estado === "activo" ? "success" : "secondary"
                      }
                      className="capitalize"
                    >
                      {paciente.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/pacientes/${paciente.id}`} />}
                    >
                      Ver expediente
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {pacientes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EstadoVacio
                    icon={UsersIcon}
                    titulo={
                      q
                        ? "No se encontraron pacientes"
                        : "Todavía no hay pacientes registrados"
                    }
                    descripcion={
                      q
                        ? "Prueba con otro nombre o cédula."
                        : "Crea el primero para empezar a usar el expediente."
                    }
                    accion={
                      !q && (
                        <Button
                          size="sm"
                          render={<Link href="/pacientes/nuevo" />}
                        >
                          Nuevo paciente
                        </Button>
                      )
                    }
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
