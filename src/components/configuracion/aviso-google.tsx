"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MENSAJES: Record<string, { texto: string; tipo: "success" | "error" }> = {
  conectado: { texto: "Google Calendar conectado.", tipo: "success" },
  error: {
    texto: "No se pudo conectar Google Calendar. Intenta de nuevo.",
    tipo: "error",
  },
  sin_refresh_token: {
    texto:
      "Google no devolvió permiso permanente. Quita el acceso en tu cuenta de Google y vuelve a intentar.",
    tipo: "error",
  },
  no_configurado: {
    texto:
      "Google Calendar todavía no está configurado en el servidor (faltan las variables de entorno).",
    tipo: "error",
  },
};

export function AvisoGoogle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const estado = searchParams.get("google");

  useEffect(() => {
    if (!estado) return;
    const mensaje = MENSAJES[estado];
    if (mensaje) {
      if (mensaje.tipo === "success") toast.success(mensaje.texto);
      else toast.error(mensaje.texto);
    }
    router.replace("/configuracion");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  return null;
}
