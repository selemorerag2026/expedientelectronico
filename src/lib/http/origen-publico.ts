import type { NextRequest } from "next/server";

// Detrás del proxy de Render, el proceso de Node recibe el request con un
// Host interno (ej. "localhost:10000", el puerto del contenedor) — el
// dominio público real viaja en X-Forwarded-Host/X-Forwarded-Proto. Sin
// esto, `new URL(ruta, request.url)` construye redirects que apuntan a esa
// dirección interna en vez del sitio público. En local (sin proxy delante)
// no hay estos headers y se usa el origen normal del request.
export function origenPublico(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;

  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}
