"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StethoscopeIcon } from "lucide-react";

import { login } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(login, undefined);
  const accesoRef = useRef<HTMLDivElement>(null);

  function alEnviar() {
    accesoRef.current?.classList.add("acceso-sale");
  }

  return (
    <div
      ref={accesoRef}
      className="acceso flex w-full max-w-sm flex-col items-center gap-4"
    >
      <div className="acceso-marca relative flex size-9 items-center justify-center rounded-md bg-primary">
        <StethoscopeIcon className="size-5 text-primary-foreground" />
        <span className="acceso-halo absolute inset-0 rounded-md bg-primary" />
      </div>
      <Card className="acceso-card w-full">
        <CardHeader className="acceso-header">
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Expediente Clínico Electrónico — acceso para médico y personal
            del consultorio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} onSubmit={alEnviar}>
            <FieldGroup>
              <input type="hidden" name="next" value={next} />
              <Field className="acceso-campo-correo">
                <FieldLabel htmlFor="correo">Correo</FieldLabel>
                <Input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field className="acceso-campo-contrasena">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="contrasena">Contraseña</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              {state?.error && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <Button
                type="submit"
                disabled={pending}
                className={cn(
                  "acceso-boton w-full",
                  pending && "boton-cargando"
                )}
              >
                {pending ? "Ingresando..." : "Ingresar"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
