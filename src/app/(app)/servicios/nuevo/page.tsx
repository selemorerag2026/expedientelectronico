import { ServicioForm } from "@/components/servicios/servicio-form";
import { crearServicio } from "../actions";

export default function NuevoServicioPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="font-heading text-xl font-medium">Nuevo servicio</h1>
      <ServicioForm onSubmit={crearServicio} submitLabel="Crear servicio" />
    </div>
  );
}
