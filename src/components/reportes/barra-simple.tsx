export function BarraSimple({
  datos,
  formatearValor,
}: {
  datos: { etiqueta: string; valor: number }[];
  formatearValor?: (valor: number) => string;
}) {
  if (datos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos en este rango.
      </p>
    );
  }

  const max = Math.max(1, ...datos.map((d) => d.valor));

  return (
    <div className="flex flex-col gap-3">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground">{d.etiqueta}</span>
            <span className="font-medium tabular-nums">
              {formatearValor ? formatearValor(d.valor) : d.valor}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(d.valor / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
