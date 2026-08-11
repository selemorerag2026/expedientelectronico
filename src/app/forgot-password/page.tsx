"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
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

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setEnviando(false);

    if (error) {
      toast.error("No se pudo enviar el correo. Intenta de nuevo.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="app-gradient-bg flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>
            {enviado
              ? "Revisa tu correo para continuar."
              : "Ingresa tu correo y te enviamos un enlace para elegir una nueva contraseña."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Si <strong>{correo}</strong> tiene una cuenta, en unos minutos
                debería llegar un correo con un enlace de recuperación. Si no
                lo ves, revisa la carpeta de spam.
              </p>
              <Button
                render={<Link href="/login" />}
                className="w-full"
                variant="outline"
              >
                Volver a iniciar sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={alEnviar}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="correo">Correo</FieldLabel>
                  <Input
                    id="correo"
                    type="email"
                    autoComplete="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </Field>
                <Button type="submit" disabled={enviando} className="w-full">
                  {enviando ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
                <Button
                  render={<Link href="/login" />}
                  variant="ghost"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
