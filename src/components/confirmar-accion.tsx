"use client";

import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ConfirmarAccion({
  onConfirmar,
  titulo,
  descripcion,
  textoBoton = "Eliminar",
  textoConfirmar = "Sí, eliminar",
  variantBoton = "destructive",
  size = "sm",
}: {
  onConfirmar: () => Promise<void> | void;
  titulo: string;
  descripcion: string;
  textoBoton?: string;
  textoConfirmar?: string;
  variantBoton?: "destructive" | "outline" | "ghost";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant={variantBoton} size={size} />}
      >
        {textoBoton}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await onConfirmar();
                setOpen(false);
              });
            }}
          >
            {pending ? "Eliminando..." : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
