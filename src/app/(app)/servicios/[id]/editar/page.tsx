import { notFound } from "next/navigation";

import { ServicioForm } from "@/components/servicios/servicio-form";
import { createClient } from "@/lib/supabase/server";
import type { Servicio } from "@/lib/types/database";
import { actualizarServicio } from "../../actions";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: servicio } = await supabase
    .from("servicios")
    .select("*")
    .eq("id", id)
    .single<Servicio>();

  if (!servicio) {
    notFound();
  }

  const guardar = actualizarServicio.bind(null, id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="font-heading text-xl font-medium">Editar servicio</h1>
      <ServicioForm
        defaultValues={{
          nombre: servicio.nombre,
          descripcion: servicio.descripcion ?? "",
          duracion_minutos: servicio.duracion_minutos,
          visible_portal_publico: servicio.visible_portal_publico,
        }}
        onSubmit={guardar}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
