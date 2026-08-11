import { notFound, redirect } from "next/navigation";

import { BotonImprimir } from "@/components/imprimir/boton-imprimir";
import { Dato } from "@/components/dato";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { calcularEdad, formatearFecha, formatearFechaHora } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type {
  HistoriaClinica,
  NotaEvolucion,
  Paciente,
} from "@/lib/types/database";

export default async function ImprimirExpedientePage({
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
  const [{ data: paciente }, { data: historiaClinica }, { data: notas }] =
    await Promise.all([
      supabase.from("pacientes").select("*").eq("id", id).single<Paciente>(),
      supabase
        .from("historia_clinica")
        .select("*")
        .eq("paciente_id", id)
        .maybeSingle<HistoriaClinica>(),
      supabase
        .from("notas_evolucion")
        .select("*")
        .eq("paciente_id", id)
        .order("fecha", { ascending: false })
        .returns<NotaEvolucion[]>(),
    ]);

  if (!paciente) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium">
            Resumen de expediente clínico
          </h1>
          <p className="text-sm text-muted-foreground">
            Generado el {formatearFechaHora(new Date().toISOString())}
          </p>
        </div>
        <BotonImprimir />
      </div>

      <section className="border-b pb-4">
        <h2 className="mb-2 font-heading text-base font-medium">
          {paciente.nombre_completo}
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
          <Dato
            etiqueta="Fecha de nacimiento"
            valor={`${formatearFecha(paciente.fecha_nacimiento)} (${calcularEdad(paciente.fecha_nacimiento)} años)`}
          />
          <Dato etiqueta="Sexo" valor={paciente.sexo} />
          <Dato etiqueta="Cédula" valor={paciente.cedula} />
          <Dato etiqueta="Tipo de sangre" valor={paciente.tipo_sangre} />
          <Dato etiqueta="Teléfono" valor={paciente.telefono} />
          <Dato etiqueta="Alergias" valor={paciente.alergias} />
        </dl>
      </section>

      {historiaClinica && (
        <section className="border-b pb-4">
          <h2 className="mb-2 font-heading text-base font-medium">
            Historia clínica
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
            <Dato
              etiqueta="Antecedentes heredofamiliares"
              valor={historiaClinica.antecedentes_heredofamiliares}
            />
            <Dato
              etiqueta="Enfermedades crónicas"
              valor={historiaClinica.antecedentes_patologicos.enfermedades_cronicas}
            />
            <Dato
              etiqueta="Cirugías previas"
              valor={historiaClinica.antecedentes_patologicos.cirugias_previas}
            />
            <Dato
              etiqueta="Alergias"
              valor={historiaClinica.antecedentes_patologicos.alergias}
            />
            <Dato
              etiqueta="Medicamentos actuales"
              valor={historiaClinica.antecedentes_patologicos.medicamentos_actuales}
            />
            <Dato
              etiqueta="Tabaquismo / alcohol"
              valor={[
                historiaClinica.antecedentes_no_patologicos.tabaquismo,
                historiaClinica.antecedentes_no_patologicos.alcohol,
              ]
                .filter(Boolean)
                .join(" / ")}
            />
          </dl>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-heading text-base font-medium">
          Notas de evolución
        </h2>
        <div className="flex flex-col gap-4">
          {notas?.map((nota) => (
            <div key={nota.id} className="break-inside-avoid border-b pb-3">
              <p className="text-sm font-medium">
                {formatearFechaHora(nota.fecha)} — {nota.motivo_consulta}
              </p>
              <dl className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
                <Dato etiqueta="Subjetivo" valor={nota.subjetivo} />
                <Dato etiqueta="Análisis" valor={nota.analisis} />
                <Dato
                  etiqueta="Diagnósticos"
                  valor={nota.diagnosticos.map((d) => d.descripcion).join(", ")}
                />
                <Dato etiqueta="Plan" valor={nota.plan_tratamiento} />
              </dl>
            </div>
          ))}
          {(!notas || notas.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Sin notas de evolución registradas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
