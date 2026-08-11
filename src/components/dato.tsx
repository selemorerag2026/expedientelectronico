export function Dato({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm">{valor?.trim() ? valor : "—"}</dd>
    </div>
  );
}
