"use client";

import { useState } from "react";
import { DownloadIcon, EyeIcon } from "lucide-react";

import { ConfirmarAccion } from "@/components/confirmar-accion";
import { EstadoVacio } from "@/components/estado-vacio";
import { Button } from "@/components/ui/button";
import {
  CATEGORIAS_DOCUMENTO,
  ETIQUETA_CATEGORIA,
  ICONO_CATEGORIA,
} from "@/lib/pacientes/categoria-documento";
import { formatearFechaHora } from "@/lib/fecha";
import { cn } from "@/lib/utils";
import type { CategoriaDocumento } from "@/lib/types/database";

export type DocumentoGaleria = {
  id: string;
  nombre_archivo: string;
  categoria: CategoriaDocumento | null;
  created_at: string;
  tamano_bytes: number | null;
  url: string | null;
  ruta_storage: string;
};

function formatearTamano(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentosGaleria({
  documentos,
  onEliminar,
}: {
  documentos: DocumentoGaleria[];
  onEliminar: (archivoId: string, rutaStorage: string) => Promise<void>;
}) {
  const [filtro, setFiltro] = useState<CategoriaDocumento | "todos">("todos");

  const documentosFiltrados =
    filtro === "todos"
      ? documentos
      : documentos.filter((d) => d.categoria === filtro);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={filtro === "todos" ? "default" : "secondary"}
          className="rounded-full"
          onClick={() => setFiltro("todos")}
        >
          Todos
        </Button>
        {CATEGORIAS_DOCUMENTO.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={filtro === c.value ? "default" : "secondary"}
            className="rounded-full"
            onClick={() => setFiltro(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {documentosFiltrados.length === 0 ? (
        <EstadoVacio
          icon={ICONO_CATEGORIA.otro}
          titulo="No hay documentos"
          descripcion="Sube el primero desde la zona de arriba."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {documentosFiltrados.map((doc) => {
            const Icono = ICONO_CATEGORIA[doc.categoria ?? "otro"];
            return (
              <div
                key={doc.id}
                className="flex flex-col gap-2 rounded-xl p-3 ring-1 ring-black/5"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent-foreground"
                    )}
                  >
                    <Icono className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {doc.nombre_archivo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.categoria
                        ? ETIQUETA_CATEGORIA[doc.categoria]
                        : "Sin categoría"}{" "}
                      · {formatearTamano(doc.tamano_bytes)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFechaHora(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {doc.url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <a href={doc.url} target="_blank" rel="noreferrer" />
                        }
                      >
                        <EyeIcon /> Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <a
                            href={doc.url}
                            download={doc.nombre_archivo}
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                      >
                        <DownloadIcon /> Descargar
                      </Button>
                    </>
                  )}
                  <ConfirmarAccion
                    titulo="¿Eliminar este documento?"
                    descripcion={`"${doc.nombre_archivo}" se borrará de forma permanente.`}
                    variantBoton="ghost"
                    size="sm"
                    onConfirmar={() => onEliminar(doc.id, doc.ruta_storage)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
