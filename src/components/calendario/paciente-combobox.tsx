"use client";

import { useEffect, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { NuevoPacienteRapidoDialog } from "@/components/calendario/nuevo-paciente-rapido-dialog";
import { buscarPacientesParaCita } from "@/app/(app)/calendario/actions";

export type PacienteOpcion = { value: string; label: string };

export function PacienteCombobox({
  value,
  onChange,
}: {
  value: PacienteOpcion | null;
  onChange: (opcion: PacienteOpcion | null) => void;
}) {
  const [inputValue, setInputValue] = useState(value?.label ?? "");
  const [items, setItems] = useState<PacienteOpcion[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (inputValue.trim().length < 2) {
        setItems([]);
        setBuscando(false);
        return;
      }
      setBuscando(true);
      const resultados = await buscarPacientesParaCita(inputValue);
      setItems(
        resultados.map((p) => ({
          value: p.id,
          label: p.cedula ? `${p.nombre_completo} · ${p.cedula}` : p.nombre_completo,
        }))
      );
      setBuscando(false);
    }, 300);
    return () => clearTimeout(id);
  }, [inputValue]);

  return (
    <div className="flex items-center gap-2">
      <Combobox
        items={items}
        filter={null}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        value={value}
        onValueChange={onChange}
        isItemEqualToValue={(a: PacienteOpcion, b: PacienteOpcion) =>
          a.value === b.value
        }
        itemToStringLabel={(item: PacienteOpcion) => item.label}
      >
        <ComboboxInput placeholder="Buscar paciente por nombre o cédula..." showClear />
        <ComboboxContent>
          <ComboboxEmpty>
            {buscando
              ? "Buscando..."
              : inputValue.trim().length < 2
                ? "Escribe al menos 2 letras"
                : "Sin resultados"}
          </ComboboxEmpty>
          <ComboboxList>
            {items.map((item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <NuevoPacienteRapidoDialog
        onCreado={(paciente) => {
          const opcion = { value: paciente.id, label: paciente.nombre_completo };
          setInputValue(opcion.label);
          onChange(opcion);
        }}
      />
    </div>
  );
}
