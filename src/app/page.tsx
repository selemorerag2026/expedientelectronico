import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
        Regenerative Nursing
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Expediente Clínico Electrónico
      </h1>
      <p className="max-w-md text-muted-foreground">
        Fase 0 completada: proyecto Next.js, Tailwind y shadcn/ui funcionando
        en local con la paleta de la clínica.
      </p>
      <Button>Todo listo</Button>
    </div>
  );
}
