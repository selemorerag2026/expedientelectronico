import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { Suspense } from "react";

import { BuscadorPacientes } from "@/components/pacientes/buscador-pacientes";
import { EstadoVacio } from "@/components/estado-vacio";
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
import { calcularEdad } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/types/database";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("pacientes")
    .select("*")
    .order("nombre_completo")
    .limit(100);

  if (q) {
    query = query.or(`nombre_completo.ilike.%${q}%,cedula.ilike.%${q}%`);
  }

  const { data: pacientes } = await query.returns<Paciente[]>();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-medium">Pacientes</h1>
        <Button render={<Link href="/pacientes/nuevo" />}>
          Nuevo paciente
        </Button>
      </div>

      <Suspense>
        <BuscadorPacientes />
      </Suspense>

      <div className="rounded-lg ring-1 ring-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes?.map((paciente) => (
              <TableRow key={paciente.id} className="relative">
                <TableCell className="font-medium">
                  <Link
                    href={`/pacientes/${paciente.id}`}
                    className="after:absolute after:inset-0"
                  >
                    {paciente.nombre_completo}
                  </Link>
                </TableCell>
                <TableCell>{paciente.cedula ?? "—"}</TableCell>
                <TableCell>
                  {calcularEdad(paciente.fecha_nacimiento)} años
                </TableCell>
                <TableCell>{paciente.telefono ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      paciente.estado === "activo" ? "default" : "secondary"
                    }
                  >
                    {paciente.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {pacientes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
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
