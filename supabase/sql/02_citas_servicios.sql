-- =============================================================================
-- PARTE 2 / 3 — Servicios, Horarios, Citas y Auto-agendamiento público
-- Sistema de Expediente Clínico Electrónico
--
-- Requisito: haber corrido primero 01_pacientes_historia_clinica.sql
--
-- Tablas de este archivo:
--   7.  servicios           -> catálogo de consultas/procedimientos
--   8.  horarios_atencion   -> bloques de horario disponible por día de semana
--   9.  citas                -> agenda (interna + portal público)
--   10. citas_servicios      -> servicios realizados/cobrados en cada cita
--
-- También:
--   - Conecta notas_evolucion.cita_id con citas (FK pendiente de la Parte 1)
--   - Crea una función RPC "agendar_cita_publica" para el portal /agendar,
--     que corre en una sola transacción y usa un constraint a nivel de base
--     de datos (no solo del código) para que sea IMPOSIBLE reservar el mismo
--     horario dos veces, incluso si dos personas agendan al mismo tiempo.
-- =============================================================================

-- Necesaria para el constraint anti-doble-reserva (EXCLUDE con igualdad + rango)
create extension if not exists btree_gist;

-- =============================================================================
-- TABLA 7: servicios
-- Catálogo de consultas/procedimientos que ofrece el consultorio.
-- =============================================================================
create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  duracion_minutos int not null check (duracion_minutos > 0),
  precio numeric(10, 2) not null default 0 check (precio >= 0),
  visible_portal_publico boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.servicios is 'Catálogo de servicios/procedimientos con duración y precio.';
comment on column public.servicios.visible_portal_publico is 'Si es true, el paciente lo puede elegir en /agendar. Si es false, solo se agenda internamente.';

create trigger trg_servicios_updated_at
  before update on public.servicios
  for each row execute function public.set_updated_at();

alter table public.servicios enable row level security;

create policy "servicios_select_personal" on public.servicios
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "servicios_insert_personal" on public.servicios
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

create policy "servicios_update_personal" on public.servicios
  for update to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "servicios_delete_medico" on public.servicios
  for delete to authenticated
  using (public.rol_actual() = 'medico');

-- El portal público necesita ver qué servicios existen para dejar elegir uno
create policy "servicios_select_publico" on public.servicios
  for select to anon
  using (visible_portal_publico = true and activo = true);


-- =============================================================================
-- TABLA 8: horarios_atencion
-- Bloques de horario disponible por día de semana (0=domingo ... 6=sábado).
-- Con esto el sistema calcula los espacios libres del calendario.
-- =============================================================================
create table public.horarios_atencion (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid not null references public.perfiles (id),
  dia_semana int not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null check (hora_fin > hora_inicio),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.horarios_atencion is 'Bloques de horario disponible por día de semana, por médico.';

create trigger trg_horarios_atencion_updated_at
  before update on public.horarios_atencion
  for each row execute function public.set_updated_at();

alter table public.horarios_atencion enable row level security;

create policy "horarios_atencion_select_personal" on public.horarios_atencion
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "horarios_atencion_insert_personal" on public.horarios_atencion
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

create policy "horarios_atencion_update_personal" on public.horarios_atencion
  for update to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "horarios_atencion_delete_medico" on public.horarios_atencion
  for delete to authenticated
  using (public.rol_actual() = 'medico');

-- El portal público necesita esto para calcular los horarios libres
create policy "horarios_atencion_select_publico" on public.horarios_atencion
  for select to anon
  using (activo = true);


-- =============================================================================
-- TABLA 9: citas
-- Agenda del consultorio. medico_id existe desde ya para poder agregar más
-- médicos en el futuro sin rediseñar el modelo (hoy solo habrá uno).
--
-- rango: columna generada automáticamente a partir de inicio/fin, usada por
-- el constraint "citas_no_solapadas" para IMPEDIR a nivel de base de datos
-- que un mismo médico tenga dos citas activas que se traslapen en el tiempo.
-- Esto es lo que evita la doble-reserva del portal público, incluso ante
-- solicitudes simultáneas (condición de carrera).
-- =============================================================================
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id),
  medico_id uuid not null references public.perfiles (id),

  fecha_hora_inicio timestamptz not null,
  fecha_hora_fin timestamptz not null check (fecha_hora_fin > fecha_hora_inicio),
  rango tstzrange generated always as (
    tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)')
  ) stored,

  estado text not null default 'agendada'
    check (estado in ('agendada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show')),
  origen text not null default 'interno' check (origen in ('interno', 'portal_publico')),
  confirmada_por_paciente boolean not null default false,

  notas_administrativas text,
  creado_por uuid references public.perfiles (id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Impide dos citas activas traslapadas para el mismo médico (a nivel de BD)
  constraint citas_no_solapadas exclude using gist (
    medico_id with =,
    rango with &&
  ) where (estado not in ('cancelada', 'no_show'))
);

comment on table public.citas is 'Agenda de citas, interna y del portal público. El constraint citas_no_solapadas evita doble-reserva.';

create trigger trg_citas_updated_at
  before update on public.citas
  for each row execute function public.set_updated_at();

create index idx_citas_medico_fecha on public.citas (medico_id, fecha_hora_inicio);
create index idx_citas_paciente on public.citas (paciente_id, fecha_hora_inicio desc);

alter table public.citas enable row level security;

create policy "citas_select_personal" on public.citas
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "citas_insert_personal" on public.citas
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

create policy "citas_update_personal" on public.citas
  for update to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "citas_delete_medico" on public.citas
  for delete to authenticated
  using (public.rol_actual() = 'medico');

-- Nota: NO se agrega ninguna política para "anon" en esta tabla.
-- El portal público nunca lee ni escribe la tabla citas directamente;
-- usa la función agendar_cita_publica() de más abajo (así un visitante
-- jamás puede ver la agenda completa ni los datos de otros pacientes).


-- =============================================================================
-- TABLA 10: citas_servicios
-- Servicios realizados/cobrados en una cita. Es administrativo (precio,
-- cuál servicio), no clínico, así que el/la asistente sí tiene acceso.
-- precio_cobrado guarda el precio del momento, por si el catálogo cambia después.
-- =============================================================================
create table public.citas_servicios (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references public.citas (id) on delete cascade,
  servicio_id uuid not null references public.servicios (id),
  precio_cobrado numeric(10, 2) not null check (precio_cobrado >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.citas_servicios is 'Servicios realizados en cada cita, con el precio cobrado en ese momento.';

create trigger trg_citas_servicios_updated_at
  before update on public.citas_servicios
  for each row execute function public.set_updated_at();

create index idx_citas_servicios_cita on public.citas_servicios (cita_id);

alter table public.citas_servicios enable row level security;

create policy "citas_servicios_select_personal" on public.citas_servicios
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "citas_servicios_insert_personal" on public.citas_servicios
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

create policy "citas_servicios_update_personal" on public.citas_servicios
  for update to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "citas_servicios_delete_medico" on public.citas_servicios
  for delete to authenticated
  using (public.rol_actual() = 'medico');


-- =============================================================================
-- Conecta notas_evolucion.cita_id -> citas.id (la tabla citas no existía
-- todavía cuando se creó notas_evolucion en la Parte 1)
-- =============================================================================
alter table public.notas_evolucion
  add constraint notas_evolucion_cita_id_fkey
  foreign key (cita_id) references public.citas (id) on delete set null;


-- =============================================================================
-- Vista pública de disponibilidad: SOLO expone qué bloques de tiempo están
-- ocupados (médico + inicio/fin), nunca el nombre del paciente ni el motivo.
-- El frontend de /agendar la combina con horarios_atencion para calcular
-- los espacios libres.
-- =============================================================================
create view public.citas_ocupadas_publico as
select medico_id, fecha_hora_inicio, fecha_hora_fin
from public.citas
where estado not in ('cancelada', 'no_show');

comment on view public.citas_ocupadas_publico is 'Vista sin datos de pacientes, usada por el portal público para calcular horarios libres.';

grant select on public.citas_ocupadas_publico to anon, authenticated;


-- =============================================================================
-- Función RPC: agendar_cita_publica
-- Punto de entrada ÚNICO del portal público para crear una cita.
-- Corre como "security definer" (permisos elevados controlados) para poder:
--   1. Buscar o crear el paciente por cédula
--   2. Insertar la cita
--   3. Registrar el servicio elegido en citas_servicios
-- ...todo en una sola transacción. Si el horario ya se ocupó (choque con
-- otra reserva simultánea), el constraint "citas_no_solapadas" hace fallar
-- la transacción completa y no se crea nada a medias.
-- La cita siempre entra como 'agendada' (pendiente de confirmar por el
-- consultorio), tal como se pidió.
-- =============================================================================
create or replace function public.agendar_cita_publica(
  p_paciente_nombre text,
  p_paciente_telefono text,
  p_paciente_correo text,
  p_paciente_cedula text,
  p_paciente_fecha_nacimiento date,
  p_medico_id uuid,
  p_servicio_id uuid,
  p_fecha_hora_inicio timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid;
  v_duracion_minutos int;
  v_precio numeric(10, 2);
  v_fecha_hora_fin timestamptz;
  v_cita_id uuid;
begin
  select duracion_minutos, precio
    into v_duracion_minutos, v_precio
  from public.servicios
  where id = p_servicio_id and activo = true and visible_portal_publico = true;

  if v_duracion_minutos is null then
    raise exception 'El servicio seleccionado no está disponible.';
  end if;

  if p_fecha_hora_inicio <= now() then
    raise exception 'La fecha y hora de la cita debe ser en el futuro.';
  end if;

  v_fecha_hora_fin := p_fecha_hora_inicio + make_interval(mins => v_duracion_minutos);

  if p_paciente_cedula is not null and length(trim(p_paciente_cedula)) > 0 then
    select id into v_paciente_id
    from public.pacientes
    where cedula = p_paciente_cedula;
  end if;

  if v_paciente_id is null then
    insert into public.pacientes (
      nombre_completo, telefono, correo, cedula, fecha_nacimiento, origen
    ) values (
      p_paciente_nombre, p_paciente_telefono, p_paciente_correo,
      nullif(trim(p_paciente_cedula), ''), p_paciente_fecha_nacimiento, 'auto_agendamiento'
    )
    returning id into v_paciente_id;
  end if;

  -- Si el horario ya está ocupado, esta línea falla por el constraint
  -- "citas_no_solapadas" y toda la función se revierte (rollback automático).
  insert into public.citas (
    paciente_id, medico_id, fecha_hora_inicio, fecha_hora_fin, estado, origen
  ) values (
    v_paciente_id, p_medico_id, p_fecha_hora_inicio, v_fecha_hora_fin, 'agendada', 'portal_publico'
  )
  returning id into v_cita_id;

  insert into public.citas_servicios (cita_id, servicio_id, precio_cobrado)
  values (v_cita_id, p_servicio_id, v_precio);

  return v_cita_id;
end;
$$;

comment on function public.agendar_cita_publica is 'Único punto de entrada del portal público /agendar. Crea paciente (si no existe) + cita + servicio en una transacción segura contra doble-reserva.';

-- Solo esta función puede ser llamada por visitantes sin sesión (anon).
-- No se otorga ningún otro permiso sobre las tablas a "anon".
grant execute on function public.agendar_cita_publica(
  text, text, text, text, date, uuid, uuid, timestamptz
) to anon, authenticated;

-- =============================================================================
-- Fin de la Parte 2.
-- Verifica en Table Editor que existan servicios, horarios_atencion, citas
-- y citas_servicios, y que notas_evolucion.cita_id ahora tenga su llave foránea.
-- Cuando confirmes, sigo con la Parte 3: cobros y log_auditoria.
-- =============================================================================
