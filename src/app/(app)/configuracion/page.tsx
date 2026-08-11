import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AvisoGoogle } from "@/components/configuracion/aviso-google";
import { CorreoNotificacionesForm } from "@/components/configuracion/correo-notificaciones-form";
import { GoogleCalendarCard } from "@/components/configuracion/google-calendar-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracionPage() {
  const actual = await getUsuarioActual();
  if (actual?.perfil?.role !== "medico") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: tokenGoogle } = await supabase
    .from("google_calendar_tokens")
    .select("id")
    .eq("perfil_id", actual.user.id)
    .maybeSingle();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Suspense>
        <AvisoGoogle />
      </Suspense>
      <div>
        <h1 className="font-heading text-xl font-medium">
          Configuración e integraciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Estas opciones solo las puede ver y cambiar el médico.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones por correo</CardTitle>
          <CardDescription>
            Cuando se confirma una cita agendada desde el portal público, se
            envía un aviso a este correo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CorreoNotificacionesForm
            valorInicial={actual.perfil?.correo_notificaciones ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Cuando una cita queda confirmada, se reserva automáticamente el
            espacio en tu Google Calendar. Si reagendas o cancelas, el evento
            se actualiza o se borra solo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleCalendarCard conectado={Boolean(tokenGoogle)} />
        </CardContent>
      </Card>
    </div>
  );
}
