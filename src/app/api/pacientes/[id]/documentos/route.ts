import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaDocumento } from "@/lib/types/database";

const BUCKET_ADJUNTOS = "adjuntos-clinicos";
const CATEGORIAS_VALIDAS: CategoriaDocumento[] = [
  "laboratorio",
  "imagen",
  "receta",
  "consentimiento",
  "otro",
];

// Subida de documentos directo al expediente del paciente (pestaña
// "Documentos"), sin pasar por una nota de evolución. Va por un Route
// Handler (no un Server Action) a propósito: el cliente sube el archivo
// con XMLHttpRequest para tener una barra de progreso real
// (xhr.upload.onprogress) — los Server Actions no exponen eso.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pacienteId } = await params;

  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    return NextResponse.json(
      { error: "Solo el médico puede subir documentos clínicos." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const archivo = formData.get("archivo");
  const categoriaRaw = formData.get("categoria");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json(
      { error: "Selecciona un archivo." },
      { status: 400 }
    );
  }

  const categoria = CATEGORIAS_VALIDAS.includes(categoriaRaw as CategoriaDocumento)
    ? (categoriaRaw as CategoriaDocumento)
    : "otro";

  const supabase = await createClient();
  const nombreSanitizado = archivo.name.replace(/[^\w.\-]+/g, "_");
  const ruta = `pacientes/${pacienteId}/${crypto.randomUUID()}-${nombreSanitizado}`;

  const { error: errorStorage } = await supabase.storage
    .from(BUCKET_ADJUNTOS)
    .upload(ruta, archivo, { contentType: archivo.type || undefined });

  if (errorStorage) {
    return NextResponse.json(
      { error: "No se pudo subir el archivo. Intenta de nuevo." },
      { status: 500 }
    );
  }

  const { data: fila, error: errorFila } = await supabase
    .from("archivos_adjuntos")
    .insert({
      paciente_id: pacienteId,
      categoria,
      nombre_archivo: archivo.name,
      ruta_storage: ruta,
      tipo_archivo: archivo.type || null,
      tamano_bytes: archivo.size,
      subido_por: actual.user.id,
    })
    .select("id")
    .single();

  if (errorFila) {
    await supabase.storage.from(BUCKET_ADJUNTOS).remove([ruta]);
    return NextResponse.json(
      { error: "No se pudo registrar el archivo. Intenta de nuevo." },
      { status: 500 }
    );
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return NextResponse.json({ id: fila.id });
}
