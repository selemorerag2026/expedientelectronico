"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  confirmarCitaPublica,
  obtenerHorariosDisponibles,
} from "@/app/agendar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fechaHoyISO } from "@/lib/fecha";
import type { Servicio } from "@/lib/types/database";
import {
  AgendarPublicoSchema,
  type AgendarPublicoFormValues,
} from "@/lib/validations/agendar-publico";

export function AgendarWizard({ servicios }: { servicios: Servicio[] }) {
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [citaId, setCitaId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgendarPublicoFormValues>({
    resolver: zodResolver(AgendarPublicoSchema),
    defaultValues: {
      nombre_completo: "",
      fecha_nacimiento: "",
      telefono: "",
      correo: "",
      cedula: "",
    },
  });

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!servicio || !fecha) {
        setHorarios([]);
        return;
      }
      setBuscandoHorarios(true);
      setHora(null);
      const resultado = await obtenerHorariosDisponibles(servicio.id, fecha);
      if (!cancelado) {
        setHorarios(resultado);
        setBuscandoHorarios(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [servicio, fecha]);

  async function alConfirmar(data: AgendarPublicoFormValues) {
    if (!servicio || !fecha || !hora) return;
    const resultado = await confirmarCitaPublica(servicio.id, fecha, hora, data);
    if (resultado.error) {
      toast.error(resultado.error);
      if (servicio) {
        const actualizados = await obtenerHorariosDisponibles(servicio.id, fecha);
        setHorarios(actualizados);
      }
      setHora(null);
      return;
    }
    setCitaId(resultado.citaId ?? null);
  }

  if (citaId) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-2 pt-4 text-center">
          <h2 className="font-heading text-lg font-medium">
            ¡Listo! Tu cita quedó pendiente de confirmar
          </h2>
          <p className="text-sm text-muted-foreground">
            {servicio?.nombre} — {fecha} a las {hora}. El consultorio se
            pondrá en contacto contigo para confirmarla.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-5 pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Servicio</FieldLabel>
            <div className="flex flex-col gap-2">
              {servicios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServicio(s)}
                  className={`rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    servicio?.id === s.id
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{s.nombre}</div>
                  <div className="text-muted-foreground">
                    {s.duracion_minutos} min
                  </div>
                </button>
              ))}
              {servicios.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay servicios disponibles para agendar en este momento.
                </p>
              )}
            </div>
          </Field>

          {servicio && (
            <Field>
              <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
              <Input
                id="fecha"
                type="date"
                min={fechaHoyISO()}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Field>
          )}

          {servicio && fecha && (
            <Field>
              <FieldLabel>Horarios disponibles</FieldLabel>
              {buscandoHorarios && (
                <p className="text-sm text-muted-foreground">Buscando...</p>
              )}
              {!buscandoHorarios && horarios.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles ese día. Prueba otra fecha.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {horarios.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHora(h)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      hora === h
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </FieldGroup>

        {hora && (
          <form onSubmit={handleSubmit(alConfirmar)} className="border-t pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ap_nombre">Nombre completo</FieldLabel>
                <Input id="ap_nombre" {...register("nombre_completo")} />
                {errors.nombre_completo && (
                  <p className="text-sm text-destructive">
                    {errors.nombre_completo.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="ap_nacimiento">
                  Fecha de nacimiento
                </FieldLabel>
                <Input
                  id="ap_nacimiento"
                  type="date"
                  {...register("fecha_nacimiento")}
                />
                {errors.fecha_nacimiento && (
                  <p className="text-sm text-destructive">
                    {errors.fecha_nacimiento.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="ap_telefono">Teléfono</FieldLabel>
                <Input id="ap_telefono" {...register("telefono")} />
                {errors.telefono && (
                  <p className="text-sm text-destructive">
                    {errors.telefono.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="ap_correo">Correo (opcional)</FieldLabel>
                <Input id="ap_correo" type="email" {...register("correo")} />
                {errors.correo && (
                  <p className="text-sm text-destructive">
                    {errors.correo.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="ap_cedula">Cédula (opcional)</FieldLabel>
                <Input id="ap_cedula" {...register("cedula")} />
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Agendando..." : "Confirmar cita"}
              </Button>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
