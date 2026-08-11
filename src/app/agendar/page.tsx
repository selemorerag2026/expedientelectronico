import { AgendarWizard } from "@/components/agendar/agendar-wizard";
import { createClient } from "@/lib/supabase/server";
import type { Servicio } from "@/lib/types/database";

export default async function AgendarPage() {
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("servicios")
    .select("*")
    .eq("activo", true)
    .eq("visible_portal_publico", true)
    .order("nombre")
    .returns<Servicio[]>();

  return (
    <div className="app-gradient-bg flex min-h-full flex-1 flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h1 className="font-heading text-xl font-medium">Agendar una cita</h1>
        <p className="text-sm text-muted-foreground">
          Elige un servicio, una fecha y un horario disponible.
        </p>
      </div>
      <AgendarWizard servicios={servicios ?? []} />
    </div>
  );
}
