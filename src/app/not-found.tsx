import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="app-gradient-bg flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>No se encontró la página</CardTitle>
          <CardDescription>
            Puede que el enlace esté mal escrito, o que el paciente/cita ya
            no exista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/dashboard" />}>Ir al inicio</Button>
        </CardContent>
      </Card>
    </div>
  );
}
