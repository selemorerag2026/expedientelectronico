import { notFound } from "next/navigation";

import { PacienteForm } from "@/components/pacientes/paciente-form";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/types/database";
import { actualizarPaciente } from "../../actions";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single<Paciente>();

  if (!paciente) {
    notFound();
  }

  const guardar = actualizarPaciente.bind(null, id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">
          Editar paciente
        </h1>
        <p className="text-sm text-muted-foreground">
          {paciente.nombre_completo}
        </p>
      </div>
      <PacienteForm
        defaultValues={{
          nombre_completo: paciente.nombre_completo,
          fecha_nacimiento: paciente.fecha_nacimiento,
          sexo: paciente.sexo ?? undefined,
          cedula: paciente.cedula ?? "",
          telefono: paciente.telefono ?? "",
          correo: paciente.correo ?? "",
          direccion: paciente.direccion ?? "",
          contacto_emergencia_nombre: paciente.contacto_emergencia_nombre ?? "",
          contacto_emergencia_telefono:
            paciente.contacto_emergencia_telefono ?? "",
          contacto_emergencia_parentesco:
            paciente.contacto_emergencia_parentesco ?? "",
          tipo_sangre: paciente.tipo_sangre ?? "",
          alergias: paciente.alergias ?? "",
          seguro_medico: paciente.seguro_medico ?? "",
        }}
        onSubmit={guardar}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
