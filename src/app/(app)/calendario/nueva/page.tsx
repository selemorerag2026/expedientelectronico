import { CitaForm } from "@/components/calendario/cita-form";
import { createClient } from "@/lib/supabase/server";
import type { Servicio } from "@/lib/types/database";
import { crearCita } from "../actions";

export default async function NuevaCitaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; hora?: string; pacienteId?: string }>;
}) {
  const { fecha, hora, pacienteId } = await searchParams;
  const supabase = await createClient();
  const [{ data: servicios }, { data: pacienteExistente }] = await Promise.all([
    supabase
      .from("servicios")
      .select("*")
      .eq("activo", true)
      .order("nombre")
      .returns<Servicio[]>(),
    pacienteId
      ? supabase
          .from("pacientes")
          .select("id, nombre_completo")
          .eq("id", pacienteId)
          .single<{ id: string; nombre_completo: string }>()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Nueva cita</h1>
        {(!servicios || servicios.length === 0) && (
          <p className="text-sm text-destructive">
            Todavía no hay servicios activos. Crea uno primero en{" "}
            <a href="/servicios/nuevo" className="underline">
              Servicios
            </a>
            .
          </p>
        )}
      </div>
      <CitaForm
        servicios={servicios ?? []}
        defaultFecha={fecha}
        defaultHora={hora}
        pacienteInicial={
          pacienteExistente
            ? { id: pacienteExistente.id, nombre: pacienteExistente.nombre_completo }
            : undefined
        }
        onSubmit={crearCita}
      />
    </div>
  );
}
