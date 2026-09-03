// Iniciales para el avatar de un paciente/usuario (ej. "Ana Pérez" -> "AP").
export function iniciales(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primera + ultima).toUpperCase();
}
