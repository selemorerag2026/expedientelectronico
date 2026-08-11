"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

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

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Expediente Clínico Electrónico — acceso para médico y personal del
          consultorio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <input type="hidden" name="next" value={next} />
            <Field>
              <FieldLabel htmlFor="correo">Correo</FieldLabel>
              <Input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contrasena">Contraseña</FieldLabel>
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
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Ingresando..." : "Ingresar"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
