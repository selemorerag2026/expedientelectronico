import Link from "next/link";
import { notFound } from "next/navigation";

import { anularPago, crearPago } from "@/app/(app)/cobros/actions";
import { AnularPagoDialog } from "@/components/cobros/anular-pago-dialog";
import { PagoForm } from "@/components/cobros/pago-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BADGE_VARIANT_ESTADO_COBRO,
  ETIQUETA_ESTADO_COBRO,
} from "@/lib/cobros/color-estado-cobro";
import { formatearFecha } from "@/lib/fecha";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";
import { METODOS_PAGO } from "@/lib/validations/pago";
import type { CobroConEstado, Pago, Paciente } from "@/lib/types/database";

function etiquetaMetodo(metodo: string) {
  return METODOS_PAGO.find((m) => m.value === metodo)?.label ?? metodo;
}

export default async function CobroDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actual = await getUsuarioActual();
  const esMedico = actual?.perfil?.role === "medico";

  const supabase = await createClient();

  const { data: cobro } = await supabase
    .from("cobros_con_estado")
    .select("*")
    .eq("id", id)
    .single<CobroConEstado>();

  if (!cobro) {
    notFound();
  }

  const [{ data: paciente }, { data: pagos }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .eq("id", cobro.paciente_id)
      .single<Pick<Paciente, "id" | "nombre_completo">>(),
    supabase
      .from("pagos")
      .select("*")
      .eq("cobro_id", id)
      .order("fecha_pago", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Pago[]>(),
  ]);

  const registrarPago = crearPago.bind(null, cobro.id, cobro.cita_id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Detalle de cobro</h1>
        {paciente && (
          <p className="text-sm text-muted-foreground">
            <Link href={`/pacientes/${paciente.id}`} className="hover:underline">
              {paciente.nombre_completo}
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Monto total</CardDescription>
            <CardTitle className="text-2xl">
              ₡{cobro.monto.toLocaleString("es-CR")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Saldo pendiente</CardDescription>
            <CardTitle className="text-2xl">
              ₡{cobro.saldo.toLocaleString("es-CR")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Estado</CardDescription>
            <CardTitle>
              <Badge variant={BADGE_VARIANT_ESTADO_COBRO[cobro.estado_calculado]}>
                {ETIQUETA_ESTADO_COBRO[cobro.estado_calculado]}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {cobro.estado_calculado !== "pagado" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar pago</CardTitle>
            <CardDescription>
              El monto sugerido es el saldo pendiente; puedes cambiarlo para
              registrar un abono parcial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PagoForm saldoPendiente={cobro.saldo} onSubmit={registrarPago} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {pagos && pagos.length > 0 ? (
            pagos.map((pago) => {
              const anularEstePago = anularPago.bind(
                null,
                pago.id,
                cobro.id,
                cobro.cita_id
              );
              return (
                <div
                  key={pago.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-sm ring-1 ring-black/5 ${
                    pago.anulado ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ₡{pago.monto.toLocaleString("es-CR")}
                      </span>
                      <span className="text-muted-foreground">
                        · {etiquetaMetodo(pago.metodo_pago)} ·{" "}
                        {formatearFecha(pago.fecha_pago)}
                      </span>
                      {pago.anulado && (
                        <Badge variant="destructive">Anulado</Badge>
                      )}
                    </div>
                    {pago.notas && (
                      <p className="text-muted-foreground">{pago.notas}</p>
                    )}
                    {pago.anulado && pago.motivo_anulacion && (
                      <p className="text-destructive">
                        Motivo: {pago.motivo_anulacion}
                      </p>
                    )}
                  </div>
                  {esMedico && !pago.anulado && (
                    <AnularPagoDialog onConfirmar={anularEstePago} />
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no se ha registrado ningún pago.
            </p>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" render={<Link href="/cobros" />} className="w-fit">
        Volver a cobros
      </Button>
    </div>
  );
}
