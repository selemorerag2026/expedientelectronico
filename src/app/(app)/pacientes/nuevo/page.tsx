import { PacienteForm } from "@/components/pacientes/paciente-form";
import { crearPaciente } from "../actions";

export default function NuevoPacientePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Nuevo paciente</h1>
        <p className="text-sm text-muted-foreground">
          Datos generales. La historia clínica se completa después, desde el
          expediente del paciente.
        </p>
      </div>
      <PacienteForm onSubmit={crearPaciente} submitLabel="Crear paciente" />
    </div>
  );
}
