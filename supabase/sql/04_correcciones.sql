-- =============================================================================
-- PARTE 4 — Corrección: exponer el id del médico por defecto
--
-- Requisito: haber corrido primero 01, 02 y 03.
--
-- Bug encontrado por el usuario: el rol "asistente" no podía crear una cita.
-- Causa: la política RLS "perfiles_select" solo permite leer la fila propia
-- o, si quien consulta ya es médico, cualquier fila. Un/a asistente
-- consultando "select id from perfiles where role='medico'" no cumple
-- ninguna de las dos condiciones, así que la consulta no devuelve nada.
--
-- El mismo problema bloquea por completo el portal público /agendar: un
-- visitante anónimo tampoco puede averiguar el id del médico para poder
-- agendar la cita.
--
-- Solución: igual que "rol_actual()", se expone SOLO el dato mínimo
-- necesario (un UUID, sin información sensible) a través de una función
-- "security definer", en vez de permitir la lectura directa de la tabla.
-- =============================================================================

create or replace function public.medico_por_defecto_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.perfiles
  where role = 'medico'
  order by created_at asc
  limit 1;
$$;

comment on function public.medico_por_defecto_id() is 'Devuelve el id del primer usuario con rol medico. Usado para asignar citas mientras solo haya un médico. No expone datos del perfil, solo el id.';

-- Necesario para: el/la asistente creando citas desde el calendario interno,
-- y el portal público /agendar (visitantes sin sesión).
grant execute on function public.medico_por_defecto_id() to anon, authenticated;

-- =============================================================================
-- Fin de la Parte 4. Corre este archivo en el SQL Editor de Supabase.
-- =============================================================================
