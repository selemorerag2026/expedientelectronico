-- =============================================================================
-- PARTE 11: Pagos parciales (abonos) contra un cobro
--
-- Antes, "cobros" mezclaba dos cosas en una sola fila: el monto TOTAL
-- adeudado y su estado de pago (pagado/pendiente, todo-o-nada). Eso no
-- permite abonos parciales. Ahora "cobros" sigue siendo el monto total
-- adeudado, y cada abono real vive en "pagos" (1 cobro -> N pagos). El
-- estado (pendiente/parcial/pagado) se calcula sumando los pagos no
-- anulados, no se guarda como columna fija.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: pagos
-- -----------------------------------------------------------------------------
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  cobro_id uuid not null references public.cobros (id) on delete cascade,

  monto numeric(10, 2) not null check (monto > 0),
  metodo_pago text not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia', 'sinpe', 'otro')),
  fecha_pago date not null default current_date,
  notas text,
  registrado_por uuid references public.perfiles (id) default auth.uid(),

  -- Un pago nunca se borra. Si se registró mal, se anula con motivo y se
  -- registra un pago nuevo correcto. El historial completo queda visible.
  anulado boolean not null default false,
  anulado_por uuid references public.perfiles (id),
  anulado_en timestamptz,
  motivo_anulacion text,

  created_at timestamptz not null default now()
);

comment on table public.pagos is 'Abonos individuales contra un cobro. Un cobro puede tener varios pagos (pagos parciales). Nunca se borran: se anulan con motivo.';
comment on column public.pagos.anulado is 'Un pago anulado no cuenta para el saldo del cobro, pero queda visible en el historial con su motivo.';

create index idx_pagos_cobro on public.pagos (cobro_id, created_at desc);
create index idx_pagos_fecha on public.pagos (fecha_pago desc) where not anulado;

alter table public.pagos enable row level security;

-- Médico y asistente pueden ver y registrar pagos: es una tarea
-- administrativa, no clínica (igual que "cobros").
create policy "pagos_select_personal" on public.pagos
  for select to authenticated
  using (public.rol_actual() in ('medico', 'asistente'));

create policy "pagos_insert_personal" on public.pagos
  for insert to authenticated
  with check (public.rol_actual() in ('medico', 'asistente'));

-- Solo el médico puede anular un pago (update). No hay política de
-- "delete" para nadie: un pago nunca se borra de verdad.
create policy "pagos_update_medico" on public.pagos
  for update to authenticated
  using (public.rol_actual() = 'medico');

-- -----------------------------------------------------------------------------
-- Migración de datos: todo cobro que ya estaba marcado "pagado" bajo el
-- esquema anterior se convierte en un pago de un solo abono por el monto
-- completo, para no perder el historial de lo ya cobrado.
-- -----------------------------------------------------------------------------
insert into public.pagos (cobro_id, monto, metodo_pago, fecha_pago, notas, registrado_por, created_at)
select
  id,
  monto,
  coalesce(metodo_pago, 'otro'),
  coalesce(fecha_pago::date, created_at::date),
  'Migrado automáticamente desde el estado anterior del cobro.',
  registrado_por,
  coalesce(fecha_pago, created_at)
from public.cobros
where estado = 'pagado';

-- -----------------------------------------------------------------------------
-- "cobros" deja de guardar estado/método/fecha de pago como columnas fijas:
-- un cobro con abonos parciales no puede representarse con un solo valor
-- de cada una. Esa información ahora vive en "pagos".
-- -----------------------------------------------------------------------------
alter table public.cobros drop column estado;
alter table public.cobros drop column fecha_pago;
alter table public.cobros drop column metodo_pago;

-- -----------------------------------------------------------------------------
-- Vista: cobros_con_estado
-- Calcula, en un solo lugar, cuánto se ha pagado de cada cobro y su estado.
-- Hereda automáticamente el RLS de "cobros" y "pagos" (las tablas base).
-- -----------------------------------------------------------------------------
create view public.cobros_con_estado as
select
  c.id,
  c.cita_id,
  c.paciente_id,
  c.monto,
  c.notas,
  c.registrado_por,
  c.created_at,
  c.updated_at,
  coalesce(sum(p.monto) filter (where not p.anulado), 0) as monto_pagado,
  c.monto - coalesce(sum(p.monto) filter (where not p.anulado), 0) as saldo,
  case
    when coalesce(sum(p.monto) filter (where not p.anulado), 0) = 0 then 'pendiente'
    when coalesce(sum(p.monto) filter (where not p.anulado), 0) >= c.monto then 'pagado'
    else 'parcial'
  end as estado_calculado
from public.cobros c
left join public.pagos p on p.cobro_id = c.id
group by c.id;

comment on view public.cobros_con_estado is 'cobros + estado de pago calculado dinámicamente a partir de la suma de pagos no anulados. Usar esta vista para mostrar/filtrar cobros; no volver a guardar el estado como columna fija.';
