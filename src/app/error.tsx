"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app-gradient-bg flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            Ocurrió un error inesperado. Puedes intentar de nuevo; si el
            problema sigue, avísale a soporte con la hora en que pasó.
            {error.digest && (
              <span className="mt-1 block text-xs">
                Código: {error.digest}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => unstable_retry()}>Intentar de nuevo</Button>
        </CardContent>
      </Card>
    </div>
  );
}
