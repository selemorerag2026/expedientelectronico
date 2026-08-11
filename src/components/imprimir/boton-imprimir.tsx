"use client";

import { Button } from "@/components/ui/button";

export function BotonImprimir() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="print:hidden"
    >
      Imprimir / Guardar como PDF
    </Button>
  );
}
