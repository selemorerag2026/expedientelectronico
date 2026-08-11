-- =============================================================================
-- PARTE 9 — Soporte para notificaciones por correo (Fase 8D)
--
-- Requisito: haber corrido primero 01 a 08.
-- =============================================================================

-- Correo donde el médico quiere recibir la notificación de "cita confirmada".
-- Se configura desde la pantalla /configuracion, no por variable de entorno,
-- para que se pueda cambiar sin volver a desplegar la aplicación.
alter table public.perfiles
  add column if not exists correo_notificaciones text;

comment on column public.perfiles.correo_notificaciones is 'Correo al que se le avisa cuando se confirma una cita agendada desde el portal público. Se edita desde /configuracion.';

-- log_auditoria (Parte 3) solo aceptaba 'historia_clinica' | 'notas_evolucion'
-- | 'archivos_adjuntos' en tabla_afectada. Ahora también registramos aquí los
-- fallos de envío de correo (y, en la Parte 10, de Google Calendar) ligados a
-- una cita, así que hay que ampliar la lista permitida.
alter table public.log_auditoria
  drop constraint if exists log_auditoria_tabla_afectada_check;

alter table public.log_auditoria
  add constraint log_auditoria_tabla_afectada_check
  check (tabla_afectada in (
    'historia_clinica',
    'notas_evolucion',
    'archivos_adjuntos',
    'citas'
  ));

-- Igual que medico_por_defecto_id(): un/a asistente no puede leer la fila de
-- perfiles del médico directamente (RLS de perfiles_select), así que sin
-- esta función no podría saber a qué correo avisar cuando confirma una cita.
create or replace function public.medico_correo_notificaciones()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select correo_notificaciones
  from public.perfiles
  where role = 'medico'
  order by created_at asc
  limit 1;
$$;

comment on function public.medico_correo_notificaciones() is 'Correo de notificaciones del primer médico. No expone el resto del perfil.';

grant execute on function public.medico_correo_notificaciones() to authenticated;

-- =============================================================================
-- Fin de la Parte 9.
-- =============================================================================
