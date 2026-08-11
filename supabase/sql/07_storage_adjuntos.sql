-- =============================================================================
-- PARTE 7 — Bucket y políticas de Storage para adjuntos clínicos
--
-- Requisito: haber corrido primero 01 a 06.
--
-- La tabla archivos_adjuntos (Parte 1) solo guarda la referencia; el archivo
-- real vive en Supabase Storage, en este bucket. Las políticas de aquí
-- replican la misma regla de la tabla: SOLO el médico puede subir, ver o
-- borrar adjuntos clínicos. Límite de 10MB por archivo.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('adjuntos-clinicos', 'adjuntos-clinicos', false, 10485760)
on conflict (id) do nothing;

create policy "adjuntos_clinicos_select_medico" on storage.objects
  for select to authenticated
  using (bucket_id = 'adjuntos-clinicos' and public.rol_actual() = 'medico');

create policy "adjuntos_clinicos_insert_medico" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'adjuntos-clinicos' and public.rol_actual() = 'medico');

create policy "adjuntos_clinicos_delete_medico" on storage.objects
  for delete to authenticated
  using (bucket_id = 'adjuntos-clinicos' and public.rol_actual() = 'medico');

-- =============================================================================
-- Fin de la Parte 7.
-- =============================================================================
