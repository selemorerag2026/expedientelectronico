-- =============================================================================
-- PARTE 3 / 3 — Cobros y Log de Auditoría
-- Sistema de Expediente Clínico Electrónico
--
-- Requisito: haber corrido primero 01_pacientes_historia_clinica.sql
-- y 02_citas_servicios.sql
--
-- Tablas de este archivo:
--   11. cobros         -> registro básico de pagos por cita
--   12. log_auditoria  -> quién accedió/modificó un expediente y cuándo
--
-- Con este archivo se completan las 12 tablas del sistema.
-- =============================================================================

-- =============================================================================
-- TABLA 11: cobros
-- Registro básico de pagos (no es facturación electrónica). Administrativo,
-- así que el/la asistente sí puede crear y marcar cobros como pagados.
-- =============================================================================
create table public.cobros (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid references public.citas (id) on delete set null,
  paciente_id uuid not null references public.pacientes (id),

  monto numeric(10, 2) not null check (monto >= 0),
  metodo_pago text check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia', 'sinpe', 'otro')),
  estado text not null default 'pendiente' check (estado in ('pagado', 'pendiente')),
  fecha_pago timestamptz,

  notas text,
  registrado_por uuid references public.perfiles (id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cobros is 'Registro básico de cobros por cita: monto, método de pago y estado. No es facturación electrónica.';

create trigger trg_cobros_updated_at
  before update on public.cobros
  for each row execute function public.set_updated_at();

create index idx_cobros_paciente on public.cobros (paciente_id, created_at desc);
create index idx_cobros_estado_fecha on public.cobros (estado, created_at desc);

alter table public.cobros enable row level security;

create policy "cobros_select_personal" on public.cobros
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "cobros_insert_personal" on public.cobros
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

create policy "cobros_update_personal" on public.cobros
  for update to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "cobros_delete_medico" on public.cobros
  for delete to authenticated
  using (public.rol_actual() = 'medico');


-- =============================================================================
-- TABLA 12: log_auditoria
-- Registro de quién accedió/modificó un expediente y cuándo.
--
-- Es de SOLO ESCRITURA (insert) para el personal, y de SOLO LECTURA para el
-- médico. A propósito NO hay política de update ni de delete para nadie
-- autenticado: una vez escrito, un registro de auditoría no se puede alterar
-- ni borrar desde la aplicación (ni siquiera el médico admin puede hacerlo
-- por la API). Eso es lo que lo hace confiable como bitácora.
-- =============================================================================
create table public.log_auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) default auth.uid(),
  tabla_afectada text not null check (tabla_afectada in ('historia_clinica', 'notas_evolucion', 'archivos_adjuntos')),
  registro_id uuid not null,
  paciente_id uuid references public.pacientes (id),
  accion text not null check (accion in ('crear', 'actualizar', 'eliminar', 'ver')),
  detalle jsonb,
  creado_en timestamptz not null default now()
);

comment on table public.log_auditoria is 'Bitácora de acceso y modificación de información clínica. Inmutable: solo insert, sin update/delete vía API.';
comment on column public.log_auditoria.accion is 'crear/actualizar/eliminar se registran automáticamente con triggers. "ver" lo registra la app cuando el médico abre un expediente.';

create index idx_log_auditoria_paciente on public.log_auditoria (paciente_id, creado_en desc);
create index idx_log_auditoria_usuario on public.log_auditoria (usuario_id, creado_en desc);

alter table public.log_auditoria enable row level security;

create policy "log_auditoria_insert_propio" on public.log_auditoria
  for insert to authenticated
  with check (usuario_id = auth.uid());

create policy "log_auditoria_select_medico" on public.log_auditoria
  for select to authenticated
  using (public.rol_actual() = 'medico');

-- Intencionalmente NO se crean políticas de update ni de delete: sin ellas,
-- RLS bloquea esas operaciones para todos los roles autenticados.


-- -----------------------------------------------------------------------------
-- Trigger automático de auditoría para historia_clinica y notas_evolucion.
-- Cada vez que se crea, edita o elimina un registro clínico, queda una
-- entrada aquí sin que el frontend tenga que acordarse de hacerlo.
--
-- (Los eventos de solo "ver" un expediente, y los adjuntos, no pasan por un
-- trigger porque Postgres no dispara triggers en SELECT; esos se registran
-- con un INSERT directo a log_auditoria desde la app, ej. al abrir la ficha
-- de un paciente o al descargar un archivo adjunto.)
-- -----------------------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_registro_id uuid;
  v_paciente_id uuid;
  v_accion text;
begin
  if tg_op = 'INSERT' then
    v_accion := 'crear';
    v_registro_id := new.id;
    v_paciente_id := new.paciente_id;
  elsif tg_op = 'UPDATE' then
    v_accion := 'actualizar';
    v_registro_id := new.id;
    v_paciente_id := new.paciente_id;
  else
    v_accion := 'eliminar';
    v_registro_id := old.id;
    v_paciente_id := old.paciente_id;
  end if;

  insert into public.log_auditoria (usuario_id, tabla_afectada, registro_id, paciente_id, accion)
  values (auth.uid(), tg_table_name, v_registro_id, v_paciente_id, v_accion);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_auditoria_historia_clinica
  after insert or update or delete on public.historia_clinica
  for each row execute function public.registrar_auditoria();

create trigger trg_auditoria_notas_evolucion
  after insert or update or delete on public.notas_evolucion
  for each row execute function public.registrar_auditoria();


-- =============================================================================
-- Verificación final: deberían aparecer las 12 tablas + 1 vista pública.
-- =============================================================================
-- select table_name, table_type
-- from information_schema.tables
-- where table_schema = 'public'
-- order by table_name;

-- =============================================================================
-- Esquema completo. Pendiente para fases futuras (no corre en este script):
--   - Políticas del bucket de Supabase Storage para archivos_adjuntos
--     (deben replicar la misma regla: solo medico, ver Parte 1).
--   - Script de carga inicial de cie10_catalogo (200-300 códigos comunes).
--   - Creación de tu primer usuario médico (te guío paso a paso al
--     implementar el login en la siguiente fase).
-- =============================================================================
