import { COLOR_POR_TIPO, TIPOS_CITA } from "@/lib/citas/color-tipo";

export function LeyendaTipos() {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
      {TIPOS_CITA.map((tipo) => (
        <div key={tipo.value} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: COLOR_POR_TIPO[tipo.value] }}
          />
          {tipo.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: "var(--ink-faint)" }}
        />
        Cancelada
      </div>
    </div>
  );
}
