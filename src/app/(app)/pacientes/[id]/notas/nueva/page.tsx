import { notFound, redirect } from "next/navigation";

import { NotaEvolucionForm } from "@/components/pacientes/nota-evolucion-form";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/types/database";
import { crearNotaEvolucion } from "../../actions";

export default async function NuevaNotaEvolucionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ citaId?: string }>;
}) {
  const { id } = await params;
  const { citaId } = await searchParams;
  const actual = await getUsuarioActual();

  if (actual?.perfil?.role !== "medico") {
    redirect(`/pacientes/${id}`);
  }

  const supabase = await createClient();
  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single<Paciente>();

  if (!paciente) {
    notFound();
  }

  const guardar = crearNotaEvolucion.bind(null, id, citaId ?? null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">
          Nueva nota de evolución
        </h1>
        <p className="text-sm text-muted-foreground">
          {paciente.nombre_completo}
        </p>
      </div>
      <NotaEvolucionForm onSubmit={guardar} />
    </div>
  );
}
