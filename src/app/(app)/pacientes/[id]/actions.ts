"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  HistoriaClinicaSchema,
  type HistoriaClinicaFormValues,
} from "@/lib/validations/historia-clinica";
import {
  NotaEvolucionSchema,
  type NotaEvolucionFormValues,
} from "@/lib/validations/nota-evolucion";

export type ClinicoActionState = { error?: string };

export async function guardarHistoriaClinica(
  pacienteId: string,
  data: HistoriaClinicaFormValues
): Promise<ClinicoActionState> {
  const validado = HistoriaClinicaSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos de la ficha clínica." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("historia_clinica").upsert(
    {
      paciente_id: pacienteId,
      ...validado.data,
      actualizado_por: user?.id,
    },
    { onConflict: "paciente_id" }
  );

  if (error) {
    return { error: "No se pudo guardar la ficha clínica. Intenta de nuevo." };
  }

  redirect(`/pacientes/${pacienteId}`);
}

export async function crearNotaEvolucion(
  pacienteId: string,
  citaId: string | null,
  data: NotaEvolucionFormValues
): Promise<ClinicoActionState> {
  const validado = NotaEvolucionSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos de la nota de evolución." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { proxima_cita_recomendada, ...resto } = validado.data;

  const { error } = await supabase.from("notas_evolucion").insert({
    paciente_id: pacienteId,
    cita_id: citaId,
    ...resto,
    proxima_cita_recomendada: proxima_cita_recomendada || null,
    creado_por: user?.id,
  });

  if (error) {
    return { error: "No se pudo guardar la nota de evolución. Intenta de nuevo." };
  }

  redirect(`/pacientes/${pacienteId}`);
}

const BUCKET_ADJUNTOS = "adjuntos-clinicos";

export async function subirArchivoAdjunto(
  pacienteId: string,
  notaId: string,
  formData: FormData
): Promise<ClinicoActionState> {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombreSanitizado = archivo.name.replace(/[^\w.\-]+/g, "_");
  const ruta = `${notaId}/${crypto.randomUUID()}-${nombreSanitizado}`;

  const { error: errorStorage } = await supabase.storage
    .from(BUCKET_ADJUNTOS)
    .upload(ruta, archivo, { contentType: archivo.type || undefined });

  if (errorStorage) {
    return { error: "No se pudo subir el archivo. Intenta de nuevo." };
  }

  const { error: errorFila } = await supabase.from("archivos_adjuntos").insert({
    nota_evolucion_id: notaId,
    nombre_archivo: archivo.name,
    ruta_storage: ruta,
    tipo_archivo: archivo.type || null,
    tamano_bytes: archivo.size,
    subido_por: user?.id,
  });

  if (errorFila) {
    await supabase.storage.from(BUCKET_ADJUNTOS).remove([ruta]);
    return { error: "No se pudo registrar el archivo. Intenta de nuevo." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return {};
}

// Wrapper de retorno "void": <form action> nativo no acepta que la acción
// devuelva un valor, así que este es el que se usa como action del form.
export async function subirArchivoAdjuntoForm(
  pacienteId: string,
  notaId: string,
  formData: FormData
): Promise<void> {
  await subirArchivoAdjunto(pacienteId, notaId, formData);
}

export async function eliminarArchivoAdjunto(
  pacienteId: string,
  archivoId: string,
  rutaStorage: string
) {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET_ADJUNTOS).remove([rutaStorage]);
  await supabase.from("archivos_adjuntos").delete().eq("id", archivoId);
  revalidatePath(`/pacientes/${pacienteId}`);
}

export async function buscarCie10(query: string) {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("cie10_catalogo")
    .select("codigo, descripcion")
    .or(`descripcion.ilike.%${query}%,codigo.ilike.%${query}%`)
    .order("codigo")
    .limit(8);

  return data ?? [];
}
