"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

type Estado = "verificando" | "listo" | "invalido";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [estado, setEstado] = useState<Estado>("verificando");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    // El enlace del correo trae el token en el fragmento de la URL
    // (#access_token=...&type=recovery). El cliente de Supabase lo detecta
    // solo al cargar la página y dispara este evento.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setEstado("listo");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setEstado("listo");
    });

    const timeout = setTimeout(() => {
      setEstado((actual) => (actual === "verificando" ? "invalido" : actual));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (contrasena.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmar) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    const supabase = supabaseRef.current;
    if (!supabase) return;

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({
      password: contrasena,
    });

    if (error) {
      setGuardando(false);
      toast.error(
        "No se pudo actualizar la contraseña. Pide un nuevo enlace de recuperación."
      );
      return;
    }

    await supabase.auth.signOut();
    setGuardando(false);
    toast.success("Contraseña actualizada. Ingresa con tu nueva contraseña.");
    router.push("/login");
  }

  if (estado === "verificando") {
    return (
      <div className="app-gradient-bg flex min-h-full flex-1 items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          Verificando enlace de recuperación...
        </p>
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <div className="app-gradient-bg flex min-h-full flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Enlace inválido o vencido</CardTitle>
            <CardDescription>
              Este enlace de recuperación ya no es válido. Pide uno nuevo
              desde la pantalla de inicio de sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Volver a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-gradient-bg flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>
            Elige una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={alEnviar}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="contrasena">Nueva contraseña</FieldLabel>
                <Input
                  id="contrasena"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmar">
                  Confirmar contraseña
                </FieldLabel>
                <Input
                  id="confirmar"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={guardando} className="w-full">
                {guardando ? "Guardando..." : "Guardar nueva contraseña"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
