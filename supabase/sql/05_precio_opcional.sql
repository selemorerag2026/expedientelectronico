-- =============================================================================
-- PARTE 5 — El precio ya no es un dato fijo del catálogo de servicios
--
-- Requisito: haber corrido primero 01, 02, 03 y 04.
--
-- Pedido del usuario: el precio no debe vivir en "servicios" (catálogo fijo).
-- El monto real se define por paciente al momento de cobrar (tabla `cobros`,
-- ya existente). Este script solo relaja los NOT NULL para que el precio del
-- servicio sea opcional (referencia interna, no se usa en la app) y para que
-- `citas_servicios.precio_cobrado` pueda quedar en null.
-- =============================================================================

alter table public.servicios
  alter column precio drop not null,
  alter column precio drop default;

alter table public.citas_servicios
  alter column precio_cobrado drop not null;

comment on column public.servicios.precio is 'Opcional. Ya no se usa como precio fijo en la app: el monto se define por paciente en la tabla cobros.';
comment on column public.citas_servicios.precio_cobrado is 'Opcional, ya no se autocompleta desde servicios.precio. El monto real vive en la tabla cobros.';

-- =============================================================================
-- Fin de la Parte 5.
-- =============================================================================
