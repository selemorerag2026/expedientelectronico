-- =============================================================================
-- PARTE 8 — Función para el dashboard: citas completadas sin nota de evolución
--
-- Requisito: haber corrido primero 01 a 07.
--
-- Fase 8A (dashboard "Hoy"). El/la asistente necesita saber que existen citas
-- completadas sin nota de evolución (para no perder el registro de qué falta
-- documentar), pero NO tiene acceso a la tabla notas_evolucion por RLS
-- ("solo médico"). Sin esta función, ni siquiera podría calcular el conteo,
-- porque el "no existe nota" requiere leer notas_evolucion para comprobarlo.
--
-- Igual que rol_actual() y medico_por_defecto_id(), esta función es
-- "security definer" para poder hacer esa comprobación internamente, pero
-- SOLO devuelve datos que el/la asistente ya puede ver en otras pantallas
-- (id de la cita, id del paciente, fecha/hora) — nunca contenido clínico.
-- El frontend decide, según el rol, si muestra la lista completa (médico)
-- o solo el conteo (asistente).
-- =============================================================================

create or replace function public.citas_completadas_sin_nota()
returns table (
  cita_id uuid,
  paciente_id uuid,
  fecha_hora_inicio timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.paciente_id, c.fecha_hora_inicio
  from public.citas c
  where c.estado = 'completada'
    and not exists (
      select 1 from public.notas_evolucion n where n.cita_id = c.id
    )
  order by c.fecha_hora_inicio asc;
$$;

comment on function public.citas_completadas_sin_nota() is 'Citas completadas sin nota de evolución asociada. No expone contenido clínico, solo ids y fecha — usado por el dashboard para médico (lista completa) y asistente (solo conteo).';

grant execute on function public.citas_completadas_sin_nota() to authenticated;

-- =============================================================================
-- Fin de la Parte 8.
-- =============================================================================
