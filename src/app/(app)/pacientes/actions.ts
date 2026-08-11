"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PacienteSchema, type PacienteFormValues } from "@/lib/validations/paciente";

export type PacienteActionState = { error?: string };

function limpiarOpcionales(data: PacienteFormValues) {
  return {
    nombre_completo: data.nombre_completo,
    fecha_nacimiento: data.fecha_nacimiento,
    sexo: data.sexo || null,
    cedula: data.cedula || null,
    telefono: data.telefono || null,
    correo: data.correo || null,
    direccion: data.direccion || null,
    contacto_emergencia_nombre: data.contacto_emergencia_nombre || null,
    contacto_emergencia_telefono: data.contacto_emergencia_telefono || null,
    contacto_emergencia_parentesco: data.contacto_emergencia_parentesco || null,
    tipo_sangre: data.tipo_sangre || null,
    alergias: data.alergias || null,
    seguro_medico: data.seguro_medico || null,
  };
}

export async function crearPaciente(
  data: PacienteFormValues
): Promise<PacienteActionState> {
  const validado = PacienteSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del formulario." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .insert({ ...limpiarOpcionales(validado.data), creado_por: user?.id })
    .select("id")
    .single();

  if (error || !paciente) {
    if (error?.code === "23505") {
      return { error: "Ya existe un paciente con esa cédula." };
    }
    return { error: "No se pudo crear el paciente. Intenta de nuevo." };
  }

  redirect(`/pacientes/${paciente.id}`);
}

export async function actualizarPaciente(
  id: string,
  data: PacienteFormValues
): Promise<PacienteActionState> {
  const validado = PacienteSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del formulario." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pacientes")
    .update(limpiarOpcionales(validado.data))
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un paciente con esa cédula." };
    }
    return { error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }

  redirect(`/pacientes/${id}`);
}

export type ResultadoBusquedaGlobal = {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
};

// Búsqueda global (Fase 8B): por nombre, cédula o teléfono. Solo datos
// generales — médico y asistente ya tienen acceso a esto por RLS, así que
// no hace falta distinguir rol aquí; lo clínico se protege en /pacientes/[id].
export async function buscarPacientesGlobal(
  query: string
): Promise<ResultadoBusquedaGlobal[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("pacientes")
    .select("id, nombre_completo, cedula, telefono")
    .or(
      `nombre_completo.ilike.%${query}%,cedula.ilike.%${query}%,telefono.ilike.%${query}%`
    )
    .order("nombre_completo")
    .limit(8);

  return data ?? [];
}
