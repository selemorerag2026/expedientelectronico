-- =============================================================================
-- PARTE 6 — Catálogo inicial de diagnósticos CIE-10
--
-- Requisito: haber corrido primero 01 a 05.
--
-- No es el catálogo completo de la OMS (son miles de códigos) — es un punto
-- de partida con ~110 códigos de uso común en medicina general, para que el
-- buscador de la nota de evolución tenga algo útil desde el día uno. El
-- médico puede seguir agregando códigos después con un INSERT como los de
-- abajo, o desde Supabase > Table Editor > cie10_catalogo.
-- =============================================================================

insert into public.cie10_catalogo (codigo, descripcion, categoria) values
  -- Infecciosas / respiratorias comunes
  ('J00',    'Rinofaringitis aguda (resfriado común)', 'Respiratorio'),
  ('J01.9',  'Sinusitis aguda, no especificada', 'Respiratorio'),
  ('J02.9',  'Faringitis aguda, no especificada', 'Respiratorio'),
  ('J03.9',  'Amigdalitis aguda, no especificada', 'Respiratorio'),
  ('J06.9',  'Infección aguda de las vías respiratorias superiores, no especificada', 'Respiratorio'),
  ('J11.1',  'Influenza con otras manifestaciones respiratorias', 'Respiratorio'),
  ('J18.9',  'Neumonía, no especificada', 'Respiratorio'),
  ('J20.9',  'Bronquitis aguda, no especificada', 'Respiratorio'),
  ('J21.9',  'Bronquiolitis aguda, no especificada', 'Respiratorio'),
  ('J30.4',  'Rinitis alérgica, no especificada', 'Respiratorio'),
  ('J40',    'Bronquitis, no especificada como aguda o crónica', 'Respiratorio'),
  ('J44.9',  'Enfermedad pulmonar obstructiva crónica, no especificada', 'Respiratorio'),
  ('J45.9',  'Asma, no especificada', 'Respiratorio'),
  ('A09',    'Diarrea y gastroenteritis de presunto origen infeccioso', 'Infecciosas'),
  ('A90',    'Fiebre del dengue', 'Infecciosas'),
  ('B01.9',  'Varicela, sin complicaciones', 'Infecciosas'),
  ('B34.9',  'Infección viral, no especificada', 'Infecciosas'),
  ('B35.9',  'Dermatofitosis, no especificada', 'Infecciosas'),

  -- Cardiovascular
  ('I10',    'Hipertensión esencial (primaria)', 'Cardiovascular'),
  ('I25.9',  'Enfermedad isquémica crónica del corazón, no especificada', 'Cardiovascular'),
  ('I48.9',  'Fibrilación y aleteo auricular, no especificado', 'Cardiovascular'),
  ('I50.9',  'Insuficiencia cardíaca, no especificada', 'Cardiovascular'),
  ('I83.9',  'Várices de los miembros inferiores, sin complicación', 'Cardiovascular'),
  ('I95.9',  'Hipotensión, no especificada', 'Cardiovascular'),

  -- Endocrino / metabólico
  ('E10.9',  'Diabetes mellitus tipo 1, sin complicaciones', 'Endocrino'),
  ('E11.9',  'Diabetes mellitus tipo 2, sin complicaciones', 'Endocrino'),
  ('E03.9',  'Hipotiroidismo, no especificado', 'Endocrino'),
  ('E05.9',  'Tirotoxicosis, no especificada', 'Endocrino'),
  ('E55.9',  'Deficiencia de vitamina D, no especificada', 'Endocrino'),
  ('E66.9',  'Obesidad, no especificada', 'Endocrino'),
  ('E78.5',  'Hiperlipidemia, no especificada', 'Endocrino'),
  ('E86',    'Depleción del volumen (deshidratación)', 'Endocrino'),

  -- Digestivo
  ('K21.9',  'Enfermedad por reflujo gastroesofágico, sin esofagitis', 'Digestivo'),
  ('K29.7',  'Gastritis, no especificada', 'Digestivo'),
  ('K30',    'Dispepsia funcional', 'Digestivo'),
  ('K35.80', 'Apendicitis aguda, no especificada', 'Digestivo'),
  ('K52.9',  'Gastroenteritis y colitis no infecciosa, no especificada', 'Digestivo'),
  ('K59.0',  'Estreñimiento', 'Digestivo'),
  ('K59.1',  'Diarrea funcional', 'Digestivo'),
  ('K76.0',  'Hígado graso, no clasificado en otra parte', 'Digestivo'),
  ('K80.20', 'Colelitiasis sin colecistitis', 'Digestivo'),

  -- Musculoesquelético
  ('M19.90', 'Osteoartrosis, no especificada', 'Musculoesquelético'),
  ('M25.50', 'Dolor articular, no especificado', 'Musculoesquelético'),
  ('M54.2',  'Cervicalgia', 'Musculoesquelético'),
  ('M54.5',  'Lumbago, no especificado', 'Musculoesquelético'),
  ('M62.830','Espasmo muscular', 'Musculoesquelético'),
  ('M77.9',  'Entesopatía, no especificada', 'Musculoesquelético'),
  ('M79.1',  'Mialgia', 'Musculoesquelético'),

  -- Genitourinario
  ('N30.90', 'Cistitis, no especificada', 'Genitourinario'),
  ('N39.0',  'Infección de vías urinarias, sitio no especificado', 'Genitourinario'),
  ('N76.0',  'Vaginitis aguda', 'Genitourinario'),
  ('N92.6',  'Menstruación irregular, no especificada', 'Genitourinario'),
  ('N94.6',  'Dismenorrea, no especificada', 'Genitourinario'),

  -- Piel
  ('L08.9',  'Infección local de la piel, no especificada', 'Piel'),
  ('L20.9',  'Dermatitis atópica, no especificada', 'Piel'),
  ('L23.9',  'Dermatitis alérgica de contacto, de causa no especificada', 'Piel'),
  ('L30.9',  'Dermatitis, no especificada', 'Piel'),
  ('L50.9',  'Urticaria, no especificada', 'Piel'),

  -- Salud mental
  ('F32.9',  'Episodio depresivo, no especificado', 'Salud mental'),
  ('F41.1',  'Trastorno de ansiedad generalizada', 'Salud mental'),
  ('F41.9',  'Trastorno de ansiedad, no especificado', 'Salud mental'),
  ('F43.20', 'Trastorno de adaptación, no especificado', 'Salud mental'),
  ('F51.0',  'Insomnio no orgánico', 'Salud mental'),

  -- Neurológico
  ('G43.9',  'Migraña, no especificada', 'Neurológico'),
  ('G45.9',  'Ataque isquémico transitorio, no especificado', 'Neurológico'),
  ('G47.00', 'Insomnio, no especificado', 'Neurológico'),

  -- Signos y síntomas
  ('R05',    'Tos', 'Signos y síntomas'),
  ('R06.02', 'Disnea', 'Signos y síntomas'),
  ('R07.9',  'Dolor torácico, no especificado', 'Signos y síntomas'),
  ('R10.4',  'Dolor abdominal, no especificado', 'Signos y síntomas'),
  ('R11.0',  'Náusea', 'Signos y síntomas'),
  ('R42',    'Mareo y desvanecimiento', 'Signos y síntomas'),
  ('R50.9',  'Fiebre, no especificada', 'Signos y síntomas'),
  ('R51',    'Cefalea', 'Signos y síntomas'),
  ('R53.83', 'Fatiga', 'Signos y síntomas'),
  ('R60.9',  'Edema, no especificado', 'Signos y síntomas'),

  -- Alergias / hematología
  ('D50.9',  'Anemia por deficiencia de hierro, no especificada', 'Hematología'),
  ('D64.9',  'Anemia, no especificada', 'Hematología'),
  ('J30.1',  'Rinitis alérgica debida al polen', 'Alergias'),
  ('T78.2',  'Choque anafiláctico, no especificado', 'Alergias'),
  ('T78.40', 'Alergia, no especificada', 'Alergias'),
  ('Z88.0',  'Alergia a la penicilina', 'Alergias'),

  -- Oftalmología / ORL
  ('H10.9',  'Conjuntivitis, no especificada', 'ORL/Oftalmología'),
  ('H61.20', 'Cerumen impactado', 'ORL/Oftalmología'),
  ('H66.90', 'Otitis media, no especificada', 'ORL/Oftalmología'),

  -- Traumatismos
  ('S00.93', 'Traumatismo superficial de la cabeza, no especificado', 'Traumatismos'),
  ('S09.90', 'Traumatismo no especificado de la cabeza', 'Traumatismos'),
  ('S60.90', 'Traumatismo superficial de la muñeca y de la mano, no especificado', 'Traumatismos'),
  ('S93.40', 'Esguince de tobillo, no especificado', 'Traumatismos'),
  ('T14.90', 'Lesión traumática, no especificada', 'Traumatismos'),

  -- Preventivo / controles / exámenes
  ('Z00.00', 'Examen médico general, sin hallazgos anormales', 'Preventivo'),
  ('Z00.129','Examen de rutina de niño sano', 'Preventivo'),
  ('Z01.419','Examen ginecológico de rutina', 'Preventivo'),
  ('Z23',    'Necesidad de inmunización', 'Preventivo'),
  ('Z30.9',  'Anticoncepción, no especificada', 'Preventivo'),
  ('Z34.90', 'Supervisión de embarazo normal, no especificado', 'Preventivo'),
  ('Z71.3',  'Consulta para dieta y consejería nutricional', 'Preventivo'),
  ('Z76.89', 'Otras personas que consultan por otras razones especificadas', 'Preventivo')
on conflict (codigo) do nothing;

-- =============================================================================
-- Fin de la Parte 6.
-- =============================================================================
