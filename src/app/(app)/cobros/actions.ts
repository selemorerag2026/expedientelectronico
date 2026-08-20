"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { CobroSchema, type CobroFormValues } from "@/lib/validations/cobro";
import {
  MotivoAnulacionSchema,
  PagoSchema,
  type PagoFormValues,
} from "@/lib/validations/pago";

export type CobroActionState = { error?: string };
export type PagoActionState = { error?: string };

export async function crearCobro(
  citaId: string,
  pacienteId: string,
  data: CobroFormValues
): Promise<CobroActionState> {
  const validado = CobroSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del cobro." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("cobros").insert({
    cita_id: citaId,
    paciente_id: pacienteId,
    monto: validado.data.monto,
    notas: validado.data.notas || null,
    registrado_por: user?.id,
  });

  if (error) {
    return { error: "No se pudo registrar el cobro. Intenta de nuevo." };
  }

  revalidatePath(`/calendario/citas/${citaId}`);
  revalidatePath("/cobros");
  return {};
}

export async function crearPago(
  cobroId: string,
  citaId: string | null,
  data: PagoFormValues
): Promise<PagoActionState> {
  const validado = PagoSchema.safeParse(data);
  if (!validado.success) {
    return { error: "Revisa los datos del pago." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("pagos").insert({
    cobro_id: cobroId,
    monto: validado.data.monto,
    metodo_pago: validado.data.metodo_pago,
    fecha_pago: validado.data.fecha_pago,
    notas: validado.data.notas || null,
    registrado_por: user?.id,
  });

  if (error) {
    return { error: "No se pudo registrar el pago. Intenta de nuevo." };
  }

  revalidatePath(`/cobros/${cobroId}`);
  revalidatePath("/cobros");
  revalidatePath("/dashboard");
  if (citaId) revalidatePath(`/calendario/citas/${citaId}`);
  return {};
}

export async function anularPago(
  pagoId: string,
  cobroId: string,
  citaId: string | null,
  motivo: string
): Promise<PagoActionState> {
  const validado = MotivoAnulacionSchema.safeParse({ motivo });
  if (!validado.success) {
    return { error: "Escribe el motivo de la anulación." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("pagos")
    .update({
      anulado: true,
      anulado_por: user?.id,
      anulado_en: new Date().toISOString(),
      motivo_anulacion: validado.data.motivo,
    })
    .eq("id", pagoId);

  if (error) {
    // RLS bloquea esto si quien lo intenta no es médico.
    return { error: "No se pudo anular el pago." };
  }

  revalidatePath(`/cobros/${cobroId}`);
  revalidatePath("/cobros");
  revalidatePath("/dashboard");
  if (citaId) revalidatePath(`/calendario/citas/${citaId}`);
  return {};
}
