import { notFound, redirect } from "next/navigation";

import { HistoriaClinicaForm } from "@/components/pacientes/historia-clinica-form";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";
import type { HistoriaClinica, Paciente } from "@/lib/types/database";
import { guardarHistoriaClinica } from "../actions";

export default async function HistoriaClinicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actual = await getUsuarioActual();

  if (actual?.perfil?.role !== "medico") {
    redirect(`/pacientes/${id}`);
  }

  const supabase = await createClient();

  const [{ data: paciente }, { data: historiaClinica }] = await Promise.all([
    supabase.from("pacientes").select("*").eq("id", id).single<Paciente>(),
    supabase
      .from("historia_clinica")
      .select("*")
      .eq("paciente_id", id)
      .maybeSingle<HistoriaClinica>(),
  ]);

  if (!paciente) {
    notFound();
  }

  const guardar = guardarHistoriaClinica.bind(null, id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">
          Ficha clínica inicial
        </h1>
        <p className="text-sm text-muted-foreground">
          {paciente.nombre_completo}
        </p>
      </div>
      <HistoriaClinicaForm
        mostrarGinecoobstetrico={paciente.sexo === "femenino"}
        defaultValues={
          historiaClinica
            ? {
                antecedentes_heredofamiliares:
                  historiaClinica.antecedentes_heredofamiliares ?? "",
                antecedentes_no_patologicos:
                  historiaClinica.antecedentes_no_patologicos,
                antecedentes_patologicos:
                  historiaClinica.antecedentes_patologicos,
                antecedentes_ginecoobstetricos:
                  historiaClinica.antecedentes_ginecoobstetricos ?? undefined,
                signos_vitales_iniciales:
                  historiaClinica.signos_vitales_iniciales,
              }
            : undefined
        }
        onSubmit={guardar}
      />
    </div>
  );
}
