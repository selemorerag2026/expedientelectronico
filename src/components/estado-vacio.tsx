import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EstadoVacio({
  icon: Icon,
  titulo,
  descripcion,
  accion,
}: {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-10 text-center">
      <Icon className="mb-1 size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium">{titulo}</p>
      {descripcion && (
        <p className="max-w-xs text-sm text-muted-foreground">{descripcion}</p>
      )}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
