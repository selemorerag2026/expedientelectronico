-- =============================================================================
-- PARTE 10 — Integración con Google Calendar (Fase 8E)
--
-- Requisito: haber corrido primero 01 a 09.
-- =============================================================================

alter table public.citas
  add column if not exists google_event_id text;

comment on column public.citas.google_event_id is 'ID del evento correspondiente en Google Calendar (si la integración está conectada). Null si no se ha creado o si Google Calendar no está conectado.';

-- =============================================================================
-- Tokens de Google del médico. Una fila por médico (hoy solo hay uno).
-- access_token/refresh_token son credenciales sensibles: por diseño, NINGUNA
-- política de RLS normal las expone a otras sesiones. El único camino para
-- que el/la asistente pueda disparar la sincronización (al confirmar/
-- reagendar/cancelar una cita) es a través de las funciones security definer
-- de abajo, que se usan solo desde el servidor y nunca devuelven el token al
-- navegador.
-- =============================================================================
create table public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.perfiles (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expiry_date timestamptz not null,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_calendar_tokens is 'Tokens OAuth de Google Calendar por médico. Contenido sensible — ver comentario de la tabla en el script.';

create trigger trg_google_calendar_tokens_updated_at
  before update on public.google_calendar_tokens
  for each row execute function public.set_updated_at();

alter table public.google_calendar_tokens enable row level security;

-- El médico administra su propia conexión (conectar/desconectar) desde
-- /configuracion, estando en su propia sesión — estas políticas normales
-- alcanzan para eso.
create policy "google_tokens_select_propio" on public.google_calendar_tokens
  for select to authenticated
  using (perfil_id = auth.uid());

create policy "google_tokens_insert_propio" on public.google_calendar_tokens
  for insert to authenticated
  with check (perfil_id = auth.uid() and public.rol_actual() = 'medico');

create policy "google_tokens_update_propio" on public.google_calendar_tokens
  for update to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

create policy "google_tokens_delete_propio" on public.google_calendar_tokens
  for delete to authenticated
  using (perfil_id = auth.uid());

-- =============================================================================
-- Funciones security definer para el flujo de sincronización, usable por
-- cualquier usuario autenticado (médico o asistente) que confirme/reagende/
-- cancele una cita — no solo por el médico dueño del token.
-- =============================================================================

create or replace function public.obtener_token_google_medico()
returns table (
  access_token text,
  refresh_token text,
  expiry_date timestamptz,
  calendar_id text
)
language sql
stable
security definer
set search_path = public
as $$
  select t.access_token, t.refresh_token, t.expiry_date, t.calendar_id
  from public.google_calendar_tokens t
  join public.perfiles p on p.id = t.perfil_id
  where p.role = 'medico'
  order by p.created_at asc
  limit 1;
$$;

comment on function public.obtener_token_google_medico() is 'Devuelve el token de Google Calendar del médico para uso EXCLUSIVO del servidor (nunca reenviar al navegador). Necesario para que asistente pueda disparar la sincronización.';

grant execute on function public.obtener_token_google_medico() to authenticated;

-- El SDK de Google puede refrescar el access_token en cualquier sincronización
-- (incluida una disparada por asistente); esta función deja guardado el token
-- nuevo sin necesitar que la fila sea "propia" de quien la llama.
create or replace function public.actualizar_token_google_medico(
  p_access_token text,
  p_expiry_date timestamptz
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.google_calendar_tokens
  set access_token = p_access_token,
      expiry_date = p_expiry_date,
      updated_at = now()
  where perfil_id = (
    select id from public.perfiles where role = 'medico'
    order by created_at asc limit 1
  );
$$;

comment on function public.actualizar_token_google_medico(text, timestamptz) is 'Actualiza el access_token refrescado del médico. Uso exclusivo del servidor.';

grant execute on function public.actualizar_token_google_medico(text, timestamptz) to authenticated;

-- =============================================================================
-- Fin de la Parte 10.
-- =============================================================================
