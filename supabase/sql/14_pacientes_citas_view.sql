-- =============================================================================
-- PARTE 14: Vista de apoyo para el listado de pacientes (rediseño)
--
-- El listado de /pacientes necesita "última visita" y "próxima cita" por
-- fila, sin hacer una consulta separada por cada paciente (N+1). Es una
-- vista pura de solo lectura sobre "citas" + "pacientes" — no agrega
-- columnas ni cambia nada existente. No necesita RLS especial: hereda el
-- RLS de "citas" y "pacientes", que ya permiten leer a médico y asistente
-- por igual (el calendario ya es compartido entre ambos roles).
-- =============================================================================

create or replace view public.pacientes_con_citas as
select
  p.id as paciente_id,
  (
    select max(c.fecha_hora_inicio)
    from public.citas c
    where c.paciente_id = p.id and c.estado = 'completada'
  ) as ultima_visita,
  (
    select min(c.fecha_hora_inicio)
    from public.citas c
    where c.paciente_id = p.id
      and c.fecha_hora_inicio > now()
      and c.estado not in ('cancelada', 'no_show')
  ) as proxima_cita
from public.pacientes p;

comment on view public.pacientes_con_citas is 'Última visita completada y próxima cita agendada por paciente, para el listado de /pacientes. Solo fechas, nada clínico.';
