-- =============================================================================
-- PARTE 1 / 3 — Perfiles, Pacientes e Historia Clínica
-- Sistema de Expediente Clínico Electrónico
--
-- Cómo usar este archivo:
--   1. Entra a tu proyecto en supabase.com > SQL Editor > New query
--   2. Pega todo este archivo y dale "Run"
--   3. No sigas con la Parte 2 hasta que esta corra sin errores
--
-- Tablas de este archivo:
--   1. perfiles          -> usuarios internos (médico / asistente)
--   2. pacientes          -> datos generales del paciente
--   3. historia_clinica   -> ficha clínica inicial (1 por paciente)
--   4. notas_evolucion    -> notas SOAP de cada consulta
--   5. archivos_adjuntos  -> archivos ligados a una nota de evolución
--   6. cie10_catalogo     -> catálogo de diagnósticos (solo lectura)
--
-- Nota: notas_evolucion.cita_id se deja SIN llave foránea aquí porque la
-- tabla "citas" se crea en la Parte 2. La llave foránea se agrega al final
-- de la Parte 2 con ALTER TABLE.
-- =============================================================================

-- Extensión necesaria para generar IDs tipo UUID
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Función auxiliar: actualiza automáticamente la columna updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLA 1: perfiles
-- Un perfil = un usuario interno del sistema (médico o asistente).
-- El id es el mismo id que genera Supabase Auth (auth.users.id).
-- =============================================================================
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  role text not null check (role in ('medico', 'asistente')),
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.perfiles is 'Usuarios internos del consultorio: médico y asistentes. No incluye pacientes.';
comment on column public.perfiles.role is 'medico = acceso total. asistente = agenda y datos administrativos, sin acceso clínico.';

create trigger trg_perfiles_updated_at
  before update on public.perfiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Función auxiliar: devuelve el rol del usuario que está haciendo la consulta
-- Se usa en TODAS las políticas de RLS de aquí en adelante.
-- Es "security definer" para poder leer la tabla perfiles sin caer en un loop
-- infinito de RLS (perfiles también tiene RLS activado).
-- -----------------------------------------------------------------------------
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.perfiles where id = auth.uid();
$$;

comment on function public.rol_actual() is 'Devuelve el rol (medico/asistente) del usuario autenticado actual. Usado en políticas RLS.';

-- -----------------------------------------------------------------------------
-- Trigger: cuando alguien se registra en Supabase Auth, se crea su perfil
-- automáticamente. El rol y nombre se pueden pasar como metadata al
-- registrarse (options.data en supabase.auth.signUp); si no se pasan,
-- se crea como "asistente" por defecto y el médico lo ajusta después.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre_completo, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'asistente')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trigger de seguridad: un usuario no puede subirse su propio rol a "medico"
-- ni reactivarse a sí mismo si fue desactivado. Solo otro "medico" puede
-- cambiar el rol o el estado "activo" de un perfil.
-- -----------------------------------------------------------------------------
create or replace function public.proteger_cambios_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.activo is distinct from old.activo)
     and public.rol_actual() is distinct from 'medico' then
    raise exception 'Solo un usuario con rol medico puede cambiar el rol o el estado activo de un perfil.';
  end if;
  return new;
end;
$$;

create trigger trg_proteger_cambios_perfil
  before update on public.perfiles
  for each row execute function public.proteger_cambios_perfil();

-- RLS: perfiles
alter table public.perfiles enable row level security;

create policy "perfiles_select" on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.rol_actual() = 'medico');

create policy "perfiles_insert_medico" on public.perfiles
  for insert to authenticated
  with check (public.rol_actual() = 'medico');

create policy "perfiles_update" on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.rol_actual() = 'medico');

create policy "perfiles_delete_medico" on public.perfiles
  for delete to authenticated
  using (public.rol_actual() = 'medico');


-- =============================================================================
-- TABLA 2: pacientes
-- Datos generales/administrativos. Visibles para médico Y asistente
-- (la asistente necesita esto para agendar y dar seguimiento administrativo).
-- La edad se calcula en la app o en consultas con age(fecha_nacimiento),
-- no se guarda como columna porque cambiaría todos los días.
-- =============================================================================
create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  fecha_nacimiento date not null,
  sexo text check (sexo in ('masculino', 'femenino', 'otro')),
  cedula text unique,
  telefono text,
  correo text,
  direccion text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  contacto_emergencia_parentesco text,
  tipo_sangre text,
  alergias text,
  seguro_medico text,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  origen text not null default 'manual' check (origen in ('manual', 'importado', 'auto_agendamiento')),
  creado_por uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pacientes is 'Datos generales/administrativos del paciente. NO incluye información clínica.';
comment on column public.pacientes.origen is 'Cómo se creó el registro: manual, importado desde Excel, o desde el portal público de auto-agendamiento.';

create trigger trg_pacientes_updated_at
  before update on public.pacientes
  for each row execute function public.set_updated_at();

create index idx_pacientes_nombre on public.pacientes using gin (to_tsvector('spanish', nombre_completo));
create index idx_pacientes_cedula on public.pacientes (cedula);

-- RLS: pacientes (personal interno: médico y asistente, sin acceso público directo)
alter table public.pacientes enable row level security;

create policy "pacientes_select_personal" on public.pacientes
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "pacientes_insert_personal" on public.pacientes
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

create policy "pacientes_update_personal" on public.pacientes
  for update to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "pacientes_delete_medico" on public.pacientes
  for delete to authenticated
  using (public.rol_actual() = 'medico');


-- =============================================================================
-- TABLA 3: historia_clinica
-- Ficha clínica inicial. Una fila por paciente (1:1). SOLO el médico.
-- Se usan columnas jsonb para agrupar secciones relacionadas y mantener
-- el esquema simple; la app valida la forma exacta con zod en el frontend.
-- =============================================================================
create table public.historia_clinica (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null unique references public.pacientes (id) on delete cascade,

  antecedentes_heredofamiliares text,

  -- { alimentacion, actividad_fisica, tabaquismo, alcohol, otras_sustancias, ocupacion, vacunas }
  antecedentes_no_patologicos jsonb not null default '{}'::jsonb,

  -- { enfermedades_cronicas, cirugias_previas, hospitalizaciones, transfusiones, alergias, medicamentos_actuales }
  antecedentes_patologicos jsonb not null default '{}'::jsonb,

  -- { menarca, gestas, partos, abortos, cesareas, fum, metodo_anticonceptivo } — null si no aplica
  antecedentes_ginecoobstetricos jsonb,

  -- { ta, fc, fr, temperatura, spo2, peso_kg, talla_cm, imc }
  signos_vitales_iniciales jsonb not null default '{}'::jsonb,

  actualizado_por uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.historia_clinica is 'Ficha clínica inicial del paciente. Acceso exclusivo del médico (RLS).';

create trigger trg_historia_clinica_updated_at
  before update on public.historia_clinica
  for each row execute function public.set_updated_at();

-- RLS: historia_clinica (SOLO médico, ni siquiera lectura para asistente)
alter table public.historia_clinica enable row level security;

create policy "historia_clinica_solo_medico" on public.historia_clinica
  for all to authenticated
  using (public.rol_actual() = 'medico')
  with check (public.rol_actual() = 'medico');


-- =============================================================================
-- TABLA 4: notas_evolucion
-- Una nota SOAP por consulta. SOLO el médico. cita_id se conecta en Parte 2.
-- =============================================================================
create table public.notas_evolucion (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  cita_id uuid, -- FK a citas se agrega en la Parte 2

  fecha timestamptz not null default now(),
  motivo_consulta text not null,

  -- S: Subjetivo
  subjetivo text,

  -- O: Objetivo — { ta, fc, fr, temperatura, spo2, peso_kg, talla_cm, imc, hallazgos_exploracion }
  objetivo jsonb not null default '{}'::jsonb,

  -- A: Análisis
  analisis text,
  -- [{ codigo, descripcion }] — referencia libre a cie10_catalogo.codigo, sin FK forzada
  diagnosticos jsonb not null default '[]'::jsonb,

  -- P: Plan
  plan_tratamiento text,
  -- [{ nombre, dosis, frecuencia, duracion }]
  medicamentos jsonb not null default '[]'::jsonb,
  indicaciones text,
  estudios_solicitados text,
  proxima_cita_recomendada date,

  creado_por uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notas_evolucion is 'Notas de evolución SOAP, una por consulta. Acceso exclusivo del médico (RLS).';

create trigger trg_notas_evolucion_updated_at
  before update on public.notas_evolucion
  for each row execute function public.set_updated_at();

create index idx_notas_evolucion_paciente on public.notas_evolucion (paciente_id, fecha desc);

-- RLS: notas_evolucion (SOLO médico)
alter table public.notas_evolucion enable row level security;

create policy "notas_evolucion_solo_medico" on public.notas_evolucion
  for all to authenticated
  using (public.rol_actual() = 'medico')
  with check (public.rol_actual() = 'medico');


-- =============================================================================
-- TABLA 5: archivos_adjuntos
-- Archivos (labs, imágenes, PDFs) ligados a una nota de evolución.
-- El archivo real vive en Supabase Storage; aquí solo guardamos la referencia.
-- SOLO el médico (mismo nivel de confidencialidad que la nota clínica).
-- =============================================================================
create table public.archivos_adjuntos (
  id uuid primary key default gen_random_uuid(),
  nota_evolucion_id uuid not null references public.notas_evolucion (id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null, -- path dentro del bucket de Supabase Storage
  tipo_archivo text,
  tamano_bytes bigint,
  subido_por uuid references public.perfiles (id),
  created_at timestamptz not null default now()
);

comment on table public.archivos_adjuntos is 'Referencia a archivos clínicos guardados en Supabase Storage. Acceso exclusivo del médico.';
comment on column public.archivos_adjuntos.ruta_storage is 'Ruta del archivo dentro del bucket de Storage. Las políticas del bucket deben replicar esta misma restricción (solo médico).';

create index idx_archivos_adjuntos_nota on public.archivos_adjuntos (nota_evolucion_id);

-- RLS: archivos_adjuntos (SOLO médico)
alter table public.archivos_adjuntos enable row level security;

create policy "archivos_adjuntos_solo_medico" on public.archivos_adjuntos
  for all to authenticated
  using (public.rol_actual() = 'medico')
  with check (public.rol_actual() = 'medico');


-- =============================================================================
-- TABLA 6: cie10_catalogo
-- Catálogo de referencia para el buscador de diagnósticos (200-300 códigos
-- comunes, se cargan después con un script de datos aparte). No contiene
-- información de pacientes, así que médico y asistente pueden leerlo.
-- Solo lectura vía la app: no hay políticas de insert/update/delete para
-- authenticated, así que solo se puede modificar con la service_role key
-- (por ejemplo, al correr el script de carga inicial).
-- =============================================================================
create table public.cie10_catalogo (
  codigo text primary key,
  descripcion text not null,
  categoria text
);

comment on table public.cie10_catalogo is 'Catálogo de referencia de códigos CIE-10 más comunes en medicina general. Se carga con un script aparte.';

create index idx_cie10_descripcion on public.cie10_catalogo using gin (to_tsvector('spanish', descripcion));

-- RLS: cie10_catalogo (lectura para el personal, sin escritura desde la app)
alter table public.cie10_catalogo enable row level security;

create policy "cie10_catalogo_select_personal" on public.cie10_catalogo
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

-- =============================================================================
-- Fin de la Parte 1.
-- Verifica en Supabase > Table Editor que las 6 tablas existan.
-- Cuando confirmes, sigo con la Parte 2: citas, horarios_atencion,
-- servicios y citas_servicios.
-- =============================================================================
