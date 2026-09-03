-- =============================================================================
-- PARTE 13: Campos aditivos para el rediseño "Expediente CR"
--
-- Tres cambios de esquema, todos aditivos y no destructivos (no se toca RLS,
-- no se borra ni renombra ninguna columna existente, nada de esto rompe el
-- código anterior):
--
-- 1) archivos_adjuntos: documentos a nivel de PACIENTE (no solo por nota),
--    con categoría, para la nueva pestaña "Documentos" del expediente.
-- 2) citas.tipo_cita: para colorear el calendario por tipo en vez de estado.
-- 3) cobros.fecha_vencimiento: para poder calcular cobros "vencidos".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) archivos_adjuntos: paciente_id + categoria
--
-- Hasta ahora todo adjunto colgaba de una nota de evolución
-- (nota_evolucion_id not null). La pestaña "Documentos" del expediente
-- permite subir un archivo directo al paciente, sin pasar por una nota, así
-- que nota_evolucion_id pasa a ser opcional y agregamos paciente_id +
-- categoria. Los adjuntos que ya existen no se tocan: siguen con su
-- nota_evolucion_id y paciente_id queda NULL en ellos.
-- -----------------------------------------------------------------------------
-- Todo este archivo se escribe para poder correrse más de una vez sin
-- error (IF NOT EXISTS / DO blocks) — por si una corrida anterior falló a
-- mitad de camino (como pasó con la vista más abajo) y algunas de estas
-- sentencias ya habían quedado aplicadas.
alter table public.archivos_adjuntos
  alter column nota_evolucion_id drop not null;

alter table public.archivos_adjuntos
  add column if not exists paciente_id uuid references public.pacientes (id) on delete cascade;

alter table public.archivos_adjuntos
  add column if not exists categoria text check (categoria in ('laboratorio', 'imagen', 'receta', 'consentimiento', 'otro'));

do $$
begin
  alter table public.archivos_adjuntos
    add constraint archivos_adjuntos_origen_check
    check (nota_evolucion_id is not null or paciente_id is not null);
exception
  when duplicate_object then null;
end $$;

comment on column public.archivos_adjuntos.paciente_id is 'Para adjuntos subidos directo al expediente del paciente (pestaña Documentos), sin pasar por una nota de evolución. Null en los adjuntos antiguos, que siguen ligados a nota_evolucion_id.';
comment on column public.archivos_adjuntos.categoria is 'Categoría del documento para la galería filtrable del expediente: laboratorio/imagen/receta/consentimiento/otro. Null en adjuntos antiguos (subidos antes de este campo).';

create index if not exists idx_archivos_adjuntos_paciente on public.archivos_adjuntos (paciente_id, created_at desc);

-- No hace falta tocar RLS: la política "archivos_adjuntos_solo_medico" ya
-- filtra por rol_actual() = 'medico', sin importar qué columnas tenga la fila.

-- -----------------------------------------------------------------------------
-- 2) citas.tipo_cita: para colorear el calendario por tipo
-- -----------------------------------------------------------------------------
alter table public.citas
  add column if not exists tipo_cita text not null default 'consulta'
  check (tipo_cita in ('consulta', 'primera_vez', 'procedimiento'));

comment on column public.citas.tipo_cita is 'Tipo de cita para el color del calendario (consulta/primera_vez/procedimiento). Las citas creadas antes de este campo quedan como "consulta" por el default.';

-- -----------------------------------------------------------------------------
-- 3) cobros.fecha_vencimiento: para la tarjeta de "vencido"
-- -----------------------------------------------------------------------------
alter table public.cobros
  add column if not exists fecha_vencimiento date;

comment on column public.cobros.fecha_vencimiento is 'Opcional. Un cobro sin saldo pendiente nunca es "vencido"; uno con saldo pendiente y fecha_vencimiento < hoy sí. Si queda NULL (cobros antiguos o si no se llena), nunca se considera vencido.';

-- La vista cobros_con_estado (Parte 11) selecciona columnas explícitas, no
-- "c.*", así que hay que agregarle fecha_vencimiento a mano para que quede
-- visible ahí. No calculamos aquí si está "vencido" (eso depende de la
-- fecha de HOY, no de una columna fija) — el frontend combina
-- saldo + fecha_vencimiento en el momento de mostrarlo.
--
-- Importante: CREATE OR REPLACE VIEW solo permite AGREGAR columnas al
-- final de la lista, no insertarlas en medio (Postgres lo trata como un
-- intento de renombrar la columna que quedó corrida de posición y falla
-- con "cannot change name of view column"). Por eso fecha_vencimiento va
-- al final del select, después de estado_calculado, no junto a las demás
-- columnas de "cobros".
create or replace view public.cobros_con_estado as
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
  end as estado_calculado,
  c.fecha_vencimiento
from public.cobros c
left join public.pagos p on p.cobro_id = c.id
group by c.id;
