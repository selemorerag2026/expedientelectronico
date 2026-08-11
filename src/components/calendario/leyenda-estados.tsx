import { COLOR_POR_ESTADO, ESTADOS_CITA } from "@/lib/citas/color-estado";

export function LeyendaEstados() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
      {ESTADOS_CITA.map((estado) => (
        <div key={estado.value} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: COLOR_POR_ESTADO[estado.value] }}
          />
          {estado.label}
        </div>
      ))}
    </div>
  );
}
