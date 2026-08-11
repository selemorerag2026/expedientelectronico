"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  buscarPacientesGlobal,
  type ResultadoBusquedaGlobal,
} from "@/app/(app)/pacientes/actions";

export function BusquedaGlobal() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusquedaGlobal[]>([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const id = setTimeout(async () => {
      if (texto.trim().length < 2) {
        setResultados([]);
        return;
      }
      const encontrados = await buscarPacientesGlobal(texto);
      if (!cancelado) setResultados(encontrados);
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(id);
    };
  }, [texto]);

  useEffect(() => {
    function alPresionarTecla(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, []);

  function irAPaciente(id: string) {
    setTexto("");
    setResultados([]);
    setAbierto(false);
    router.push(`/pacientes/${id}`);
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar paciente por nombre, cédula o teléfono..."
          className="pr-14 pl-9"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      {abierto && texto.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl bg-popover p-1 text-sm shadow-md ring-1 ring-black/5">
          {resultados.length === 0 && (
            <p className="px-3 py-2 text-muted-foreground">
              Sin resultados.
            </p>
          )}
          {resultados.map((paciente) => (
            <button
              key={paciente.id}
              type="button"
              className="flex w-full flex-col items-start rounded-lg px-3 py-1.5 text-left hover:bg-muted"
              onClick={() => irAPaciente(paciente.id)}
            >
              <span className="font-medium">{paciente.nombre_completo}</span>
              <span className="text-xs text-muted-foreground">
                {[paciente.cedula, paciente.telefono]
                  .filter(Boolean)
                  .join(" · ") || "Sin cédula ni teléfono registrados"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
