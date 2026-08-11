import { notFound, redirect } from "next/navigation";

import { BotonImprimir } from "@/components/imprimir/boton-imprimir";
import { Dato } from "@/components/dato";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { formatearFechaHora } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type { NotaEvolucion, Paciente } from "@/lib/types/database";

export default async function ImprimirNotaPage({
  params,
}: {
  params: Promise<{ notaId: string }>;
}) {
  const { notaId } = await params;
  const actual = await getUsuarioActual();

  const supabase = await createClient();
  const { data: nota } = await supabase
    .from("notas_evolucion")
    .select("*")
    .eq("id", notaId)
    .single<NotaEvolucion>();

  if (!nota) {
    notFound();
  }

  if (actual?.perfil?.role !== "medico") {
    redirect(`/pacientes/${nota.paciente_id}`);
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", nota.paciente_id)
    .single<Paciente>();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium">
            Nota de evolución
          </h1>
          <p className="text-sm text-muted-foreground">
            {paciente?.nombre_completo} · {formatearFechaHora(nota.fecha)}
          </p>
        </div>
        <BotonImprimir />
      </div>

      <dl className="grid grid-cols-1 gap-4">
        <Dato etiqueta="Motivo de consulta" valor={nota.motivo_consulta} />
        <Dato etiqueta="S — Subjetivo" valor={nota.subjetivo} />
        <Dato
          etiqueta="O — Objetivo (hallazgos)"
          valor={nota.objetivo.hallazgos_exploracion}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          <Dato etiqueta="T/A" valor={nota.objetivo.ta} />
          <Dato etiqueta="FC" valor={nota.objetivo.fc} />
          <Dato etiqueta="FR" valor={nota.objetivo.fr} />
          <Dato etiqueta="Temp." valor={nota.objetivo.temperatura} />
        </div>
        <Dato etiqueta="A — Análisis" valor={nota.analisis} />
        <Dato
          etiqueta="Diagnósticos"
          valor={nota.diagnosticos
            .map((d) => (d.codigo ? `${d.codigo} — ${d.descripcion}` : d.descripcion))
            .join(", ")}
        />
        <Dato etiqueta="P — Plan de tratamiento" valor={nota.plan_tratamiento} />
        {nota.medicamentos.length > 0 && (
          <div>
            <dt className="text-xs text-muted-foreground">Medicamentos</dt>
            <ul className="list-inside list-disc text-sm">
              {nota.medicamentos.map((med, i) => (
                <li key={i}>
                  {med.nombre} — {med.dosis} {med.frecuencia} {med.duracion}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Dato etiqueta="Indicaciones" valor={nota.indicaciones} />
        <Dato etiqueta="Estudios solicitados" valor={nota.estudios_solicitados} />
      </dl>
    </div>
  );
}
