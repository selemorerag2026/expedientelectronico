import Link from "next/link";
import { notFound } from "next/navigation";
import { FileTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  eliminarArchivoAdjunto,
  subirArchivoAdjuntoForm,
} from "@/app/(app)/pacientes/[id]/actions";
import { ConfirmarAccion } from "@/components/confirmar-accion";
import { Dato } from "@/components/dato";
import { EstadoVacio } from "@/components/estado-vacio";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { calcularEdad, formatearFecha, formatearFechaHora } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import type {
  ArchivoAdjunto,
  HistoriaClinica,
  NotaEvolucion,
  Paciente,
} from "@/lib/types/database";

const BUCKET_ADJUNTOS = "adjuntos-clinicos";

export default async function PacienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actual = await getUsuarioActual();
  const esMedico = actual?.perfil?.role === "medico";

  const supabase = await createClient();
  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single<Paciente>();

  if (!paciente) {
    notFound();
  }

  let historiaClinica: HistoriaClinica | null = null;
  let notas: NotaEvolucion[] = [];
  const adjuntosPorNota = new Map<
    string,
    (ArchivoAdjunto & { url: string | null })[]
  >();

  if (esMedico) {
    const [{ data: hc }, { data: notasData }] = await Promise.all([
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
    historiaClinica = hc;
    notas = notasData ?? [];

    if (notas.length > 0) {
      const { data: adjuntos } = await supabase
        .from("archivos_adjuntos")
        .select("*")
        .in("nota_evolucion_id", notas.map((n) => n.id))
        .order("created_at", { ascending: false })
        .returns<ArchivoAdjunto[]>();

      if (adjuntos && adjuntos.length > 0) {
        const { data: firmadas } = await supabase.storage
          .from(BUCKET_ADJUNTOS)
          .createSignedUrls(
            adjuntos.map((a) => a.ruta_storage),
            300
          );

        for (const adjunto of adjuntos) {
          const firmada = firmadas?.find((f) => f.path === adjunto.ruta_storage);
          const lista = adjuntosPorNota.get(adjunto.nota_evolucion_id) ?? [];
          lista.push({ ...adjunto, url: firmada?.signedUrl ?? null });
          adjuntosPorNota.set(adjunto.nota_evolucion_id, lista);
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-medium">
              {paciente.nombre_completo}
            </h1>
            <Badge variant={paciente.estado === "activo" ? "default" : "secondary"}>
              {paciente.estado}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {calcularEdad(paciente.fecha_nacimiento)} años ·{" "}
            {formatearFecha(paciente.fecha_nacimiento)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href={`/pacientes/${id}/editar`} />}
          >
            Editar datos generales
          </Button>
          {esMedico && (
            <Button
              variant="outline"
              render={<Link href={`/imprimir/pacientes/${id}`} target="_blank" />}
            >
              Imprimir expediente
            </Button>
          )}
          <Button render={<Link href={`/calendario/nueva?pacienteId=${id}`} />}>
            Agendar cita
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Dato etiqueta="Sexo" valor={paciente.sexo} />
            <Dato etiqueta="Cédula" valor={paciente.cedula} />
            <Dato etiqueta="Tipo de sangre" valor={paciente.tipo_sangre} />
            <Dato etiqueta="Teléfono" valor={paciente.telefono} />
            <Dato etiqueta="Correo" valor={paciente.correo} />
            <Dato etiqueta="Seguro médico" valor={paciente.seguro_medico} />
            <Dato etiqueta="Dirección" valor={paciente.direccion} />
            <Dato
              etiqueta="Contacto de emergencia"
              valor={
                paciente.contacto_emergencia_nombre
                  ? `${paciente.contacto_emergencia_nombre} (${paciente.contacto_emergencia_parentesco ?? "—"}) · ${paciente.contacto_emergencia_telefono ?? "—"}`
                  : null
              }
            />
            <Dato etiqueta="Alergias" valor={paciente.alergias} />
          </dl>
        </CardContent>
      </Card>

      {esMedico && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Historia clínica</CardTitle>
            </CardHeader>
            <CardContent>
              {historiaClinica ? (
                <div className="flex flex-col gap-3">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Dato
                      etiqueta="Antecedentes heredofamiliares"
                      valor={historiaClinica.antecedentes_heredofamiliares}
                    />
                    <Dato
                      etiqueta="Enfermedades crónicas"
                      valor={
                        historiaClinica.antecedentes_patologicos
                          .enfermedades_cronicas
                      }
                    />
                    <Dato
                      etiqueta="Alergias"
                      valor={historiaClinica.antecedentes_patologicos.alergias}
                    />
                  </dl>
                  <Button
                    variant="outline"
                    className="w-fit"
                    render={<Link href={`/pacientes/${id}/historia-clinica`} />}
                  >
                    Editar ficha clínica
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-sm text-muted-foreground">
                    Este paciente todavía no tiene ficha clínica inicial.
                  </p>
                  <Button render={<Link href={`/pacientes/${id}/historia-clinica`} />}>
                    Completar ficha clínica inicial
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-medium">
                Notas de evolución
              </h2>
              <Button render={<Link href={`/pacientes/${id}/notas/nueva`} />}>
                Nueva nota de evolución
              </Button>
            </div>

            {notas.length === 0 && (
              <EstadoVacio
                icon={FileTextIcon}
                titulo="Aún no hay notas de evolución"
                descripcion="Se crea una por cada consulta del paciente."
              />
            )}

            <div className="flex flex-col gap-2">
              {notas.map((nota) => {
                const resumenDiagnosticos = nota.diagnosticos
                  .map((d) => d.descripcion)
                  .join(", ");
                return (
                  <details
                    key={nota.id}
                    className="rounded-lg p-3 ring-1 ring-black/5"
                  >
                    <summary className="cursor-pointer text-sm">
                      <span className="font-medium">
                        {formatearFechaHora(nota.fecha)}
                      </span>{" "}
                      — {nota.motivo_consulta}
                      {resumenDiagnosticos && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {resumenDiagnosticos}
                        </span>
                      )}
                    </summary>
                    <div className="mt-3 flex flex-col gap-3 text-sm">
                      <Link
                        href={`/imprimir/notas/${nota.id}`}
                        target="_blank"
                        className="w-fit text-xs text-primary underline underline-offset-2"
                      >
                        Imprimir esta nota
                      </Link>
                      <Dato etiqueta="S — Subjetivo" valor={nota.subjetivo} />
                      <Dato
                        etiqueta="O — Objetivo"
                        valor={nota.objetivo.hallazgos_exploracion}
                      />
                      <Dato etiqueta="A — Análisis" valor={nota.analisis} />
                      <Dato
                        etiqueta="P — Plan de tratamiento"
                        valor={nota.plan_tratamiento}
                      />
                      {nota.medicamentos.length > 0 && (
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Medicamentos
                          </dt>
                          <ul className="list-inside list-disc text-sm">
                            {nota.medicamentos.map((med, i) => (
                              <li key={i}>
                                {med.nombre} — {med.dosis} {med.frecuencia}{" "}
                                {med.duracion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Dato
                        etiqueta="Indicaciones"
                        valor={nota.indicaciones}
                      />
                      <Dato
                        etiqueta="Estudios solicitados"
                        valor={nota.estudios_solicitados}
                      />

                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Archivos adjuntos
                        </dt>
                        <div className="mt-1 flex flex-col gap-1.5">
                          {(adjuntosPorNota.get(nota.id) ?? []).map((adjunto) => (
                            <div
                              key={adjunto.id}
                              className="flex items-center justify-between gap-2"
                            >
                              {adjunto.url ? (
                                <a
                                  href={adjunto.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline underline-offset-2"
                                >
                                  {adjunto.nombre_archivo}
                                </a>
                              ) : (
                                <span>{adjunto.nombre_archivo}</span>
                              )}
                              <ConfirmarAccion
                                titulo="¿Eliminar este archivo?"
                                descripcion={`"${adjunto.nombre_archivo}" se borrará de forma permanente.`}
                                variantBoton="ghost"
                                onConfirmar={() =>
                                  eliminarArchivoAdjunto(
                                    id,
                                    adjunto.id,
                                    adjunto.ruta_storage
                                  )
                                }
                              />
                            </div>
                          ))}
                          {(adjuntosPorNota.get(nota.id) ?? []).length === 0 && (
                            <span className="text-muted-foreground">
                              Sin archivos adjuntos.
                            </span>
                          )}
                        </div>
                        <form
                          action={subirArchivoAdjuntoForm.bind(null, id, nota.id)}
                          className="mt-2 flex items-center gap-2"
                        >
                          <input
                            type="file"
                            name="archivo"
                            required
                            className="text-sm"
                          />
                          <Button type="submit" variant="outline" size="sm">
                            Subir archivo
                          </Button>
                        </form>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
