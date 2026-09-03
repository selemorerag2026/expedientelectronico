-- =============================================================================
-- PARTE 12: Aviso de cita confirmada por WhatsApp (Twilio)
--
-- Necesitamos el nombre del médico para armar el mensaje/enlace de Google
-- Calendar del paciente, sin importar si quien confirmó la cita fue el
-- médico o la asistente. La tabla "perfiles" tiene RLS que solo deja leer
-- la fila propia (o cualquiera si ya eres médico) — mismo problema que
-- resolvió medico_por_defecto_id() en la Parte 4, misma solución: una
-- función security definer que solo expone el nombre, nada más del perfil.
-- =============================================================================

create or replace function public.medico_por_defecto_nombre()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nombre_completo
  from public.perfiles
  where role = 'medico'
  order by created_at asc
  limit 1;
$$;

comment on function public.medico_por_defecto_nombre() is 'Devuelve el nombre del primer usuario con rol medico. Usado para el mensaje de WhatsApp de cita confirmada. No expone el resto del perfil.';

grant execute on function public.medico_por_defecto_nombre() to authenticated;
