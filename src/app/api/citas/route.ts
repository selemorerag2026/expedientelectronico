import { NextResponse, type NextRequest } from "next/server";

import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { COLOR_POR_ESTADO } from "@/lib/citas/color-estado";
import { createClient } from "@/lib/supabase/server";
import type { CitaConPaciente } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  const actual = await getUsuarioActual();
  if (!actual) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const inicio = searchParams.get("start");
  const fin = searchParams.get("end");

  const supabase = await createClient();
  let query = supabase
    .from("citas")
    .select("*, pacientes(id, nombre_completo, telefono)")
    .order("fecha_hora_inicio");

  if (inicio && fin) {
    query = query.lt("fecha_hora_inicio", fin).gt("fecha_hora_fin", inicio);
  }

  const { data } = await query.returns<CitaConPaciente[]>();

  const eventos = (data ?? []).map((cita) => ({
    id: cita.id,
    title: cita.pacientes?.nombre_completo ?? "Paciente",
    start: cita.fecha_hora_inicio,
    end: cita.fecha_hora_fin,
    backgroundColor: COLOR_POR_ESTADO[cita.estado],
    borderColor: COLOR_POR_ESTADO[cita.estado],
    extendedProps: {
      estado: cita.estado,
      pacienteId: cita.paciente_id,
    },
  }));

  return NextResponse.json(eventos);
}
