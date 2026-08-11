import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";

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
import { createClient } from "@/lib/supabase/server";
import type { Servicio } from "@/lib/types/database";
import { alternarActivoServicio } from "./actions";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("servicios")
    .select("*")
    .order("nombre")
    .returns<Servicio[]>();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">Servicios</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de consultas y procedimientos que se pueden agendar.
          </p>
        </div>
        <Button render={<Link href="/servicios/nuevo" />}>
          Nuevo servicio
        </Button>
      </div>

      <div className="rounded-lg ring-1 ring-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Portal público</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicios?.map((servicio) => (
              <TableRow key={servicio.id}>
                <TableCell className="font-medium">
                  <Link href={`/servicios/${servicio.id}/editar`}>
                    {servicio.nombre}
                  </Link>
                </TableCell>
                <TableCell>{servicio.duracion_minutos} min</TableCell>
                <TableCell>
                  {servicio.visible_portal_publico ? "Sí" : "No"}
                </TableCell>
                <TableCell>
                  <Badge variant={servicio.activo ? "default" : "secondary"}>
                    {servicio.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <form
                    action={alternarActivoServicio.bind(
                      null,
                      servicio.id,
                      servicio.activo
                    )}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      {servicio.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {servicios?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EstadoVacio
                    icon={ClipboardListIcon}
                    titulo="Todavía no hay servicios creados"
                    descripcion="Crea al menos uno para poder agendar citas."
                    accion={
                      <Button size="sm" render={<Link href="/servicios/nuevo" />}>
                        Nuevo servicio
                      </Button>
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
