"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

export function BuscadorPacientes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (valor) {
        params.set("q", valor);
      } else {
        params.delete("q");
      }
      router.replace(`/pacientes?${params.toString()}`);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <Input
      placeholder="Buscar por nombre o cédula..."
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      className="max-w-sm"
    />
  );
}
