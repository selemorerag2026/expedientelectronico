"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIAS_DOCUMENTO } from "@/lib/pacientes/categoria-documento";
import { cn } from "@/lib/utils";
import type { CategoriaDocumento } from "@/lib/types/database";

const TAMANO_MAXIMO_MB = 15;
const TIPOS_ACEPTADOS = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

type SubidaEnCurso = {
  id: string;
  nombre: string;
  progreso: number;
  estado: "subiendo" | "completado" | "error";
  error?: string;
};

export function DocumentosDropzone({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [categoria, setCategoria] = useState<CategoriaDocumento>("otro");
  const [arrastrando, setArrastrando] = useState(false);
  const [subidas, setSubidas] = useState<SubidaEnCurso[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function subirArchivo(archivo: File) {
    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      toast.error(
        `"${archivo.name}" supera el máximo de ${TAMANO_MAXIMO_MB}MB.`
      );
      return;
    }

    const idSubida = crypto.randomUUID();
    setSubidas((actual) => [
      ...actual,
      { id: idSubida, nombre: archivo.name, progreso: 0, estado: "subiendo" },
    ]);

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("categoria", categoria);

    // XMLHttpRequest en vez de fetch: es lo único con progreso real de
    // subida (xhr.upload.onprogress) soportado de forma consistente en
    // navegadores. fetch() no expone esto.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/pacientes/${pacienteId}/documentos`);

    xhr.upload.onprogress = (evento) => {
      if (!evento.lengthComputable) return;
      const progreso = Math.round((evento.loaded / evento.total) * 100);
      setSubidas((actual) =>
        actual.map((s) => (s.id === idSubida ? { ...s, progreso } : s))
      );
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setSubidas((actual) =>
          actual.map((s) =>
            s.id === idSubida
              ? { ...s, progreso: 100, estado: "completado" }
              : s
          )
        );
        router.refresh();
      } else {
        let mensaje = "No se pudo subir el archivo.";
        try {
          const cuerpo = JSON.parse(xhr.responseText);
          if (cuerpo?.error) mensaje = cuerpo.error;
        } catch {
          // Respuesta no era JSON — nos quedamos con el mensaje genérico.
        }
        setSubidas((actual) =>
          actual.map((s) =>
            s.id === idSubida ? { ...s, estado: "error", error: mensaje } : s
          )
        );
      }
    };

    xhr.onerror = () => {
      setSubidas((actual) =>
        actual.map((s) =>
          s.id === idSubida
            ? {
                ...s,
                estado: "error",
                error: "Error de red al subir el archivo.",
              }
            : s
        )
      );
    };

    xhr.send(formData);
  }

  function manejarArchivos(lista: FileList | null) {
    if (!lista) return;
    for (const archivo of Array.from(lista)) {
      subirArchivo(archivo);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="categoria_subida" className="text-sm font-medium">
          Categoría al subir
        </label>
        <Select
          value={categoria}
          onValueChange={(v) => setCategoria(v as CategoriaDocumento)}
        >
          <SelectTrigger id="categoria_subida" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_DOCUMENTO.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          manejarArchivos(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          arrastrando
            ? "border-primary bg-accent/40"
            : "border-mineral/50 hover:bg-muted/40"
        )}
      >
        <CloudUploadIcon className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Arrastra tus archivos aquí o selecciona desde tu computadora
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, JPG, PNG, DOC — máximo {TAMANO_MAXIMO_MB}MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={TIPOS_ACEPTADOS}
          className="hidden"
          onChange={(e) => {
            manejarArchivos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {subidas.length > 0 && (
        <div className="flex flex-col gap-2">
          {subidas.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-lg p-2.5 text-sm ring-1 ring-black/5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{s.nombre}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.estado === "error"
                      ? "Error"
                      : s.estado === "completado"
                        ? "Listo"
                        : `${s.progreso}%`}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      s.estado === "error" ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${s.progreso}%` }}
                  />
                </div>
                {s.error && (
                  <p className="mt-1 text-xs text-destructive">{s.error}</p>
                )}
              </div>
              {s.estado !== "subiendo" && (
                <button
                  type="button"
                  onClick={() =>
                    setSubidas((actual) => actual.filter((x) => x.id !== s.id))
                  }
                  aria-label="Quitar de la lista"
                >
                  <XIcon className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
