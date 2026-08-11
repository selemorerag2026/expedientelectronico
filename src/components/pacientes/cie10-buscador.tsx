"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { buscarCie10 } from "@/app/(app)/pacientes/[id]/actions";

export function Cie10Buscador({
  onSeleccionar,
}: {
  onSeleccionar: (item: { codigo: string; descripcion: string }) => void;
}) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<
    { codigo: string; descripcion: string }[]
  >([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const id = setTimeout(async () => {
      if (texto.trim().length < 2) {
        setResultados([]);
        return;
      }
      const encontrados = await buscarCie10(texto);
      if (!cancelado) setResultados(encontrados);
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(id);
    };
  }, [texto]);

  return (
    <div className="relative w-64">
      <Input
        placeholder="Buscar en CIE-10..."
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
      />
      {abierto && resultados.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-black/5">
          {resultados.map((item) => (
            <button
              key={item.codigo}
              type="button"
              className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
              onClick={() => {
                onSeleccionar(item);
                setTexto("");
                setResultados([]);
                setAbierto(false);
              }}
            >
              <span className="font-medium">{item.codigo}</span> —{" "}
              {item.descripcion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
