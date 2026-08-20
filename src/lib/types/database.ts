export type Rol = "medico" | "asistente";
export type Sexo = "masculino" | "femenino" | "otro";
export type EstadoPaciente = "activo" | "inactivo";
export type OrigenPaciente = "manual" | "importado" | "auto_agendamiento";

export type Perfil = {
  id: string;
  nombre_completo: string;
  role: Rol;
  telefono: string | null;
  activo: boolean;
  correo_notificaciones: string | null;
  created_at: string;
  updated_at: string;
};

export type Paciente = {
  id: string;
  nombre_completo: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  sexo: Sexo | null;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  contacto_emergencia_parentesco: string | null;
  tipo_sangre: string | null;
  alergias: string | null;
  seguro_medico: string | null;
  estado: EstadoPaciente;
  origen: OrigenPaciente;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type PacienteInput = Omit<
  Paciente,
  "id" | "estado" | "origen" | "creado_por" | "created_at" | "updated_at"
>;

export type AntecedentesNoPatologicos = {
  alimentacion?: string;
  actividad_fisica?: string;
  tabaquismo?: string;
  alcohol?: string;
  otras_sustancias?: string;
  ocupacion?: string;
  vacunas?: string;
};

export type AntecedentesPatologicos = {
  enfermedades_cronicas?: string;
  cirugias_previas?: string;
  hospitalizaciones?: string;
  transfusiones?: string;
  alergias?: string;
  medicamentos_actuales?: string;
};

export type AntecedentesGinecoobstetricos = {
  menarca?: string;
  gestas?: string;
  partos?: string;
  abortos?: string;
  cesareas?: string;
  fum?: string;
  metodo_anticonceptivo?: string;
};

export type SignosVitales = {
  ta?: string;
  fc?: string;
  fr?: string;
  temperatura?: string;
  spo2?: string;
  peso_kg?: string;
  talla_cm?: string;
  imc?: string;
};

export type HistoriaClinica = {
  id: string;
  paciente_id: string;
  antecedentes_heredofamiliares: string | null;
  antecedentes_no_patologicos: AntecedentesNoPatologicos;
  antecedentes_patologicos: AntecedentesPatologicos;
  antecedentes_ginecoobstetricos: AntecedentesGinecoobstetricos | null;
  signos_vitales_iniciales: SignosVitales;
  actualizado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type Diagnostico = {
  codigo?: string;
  descripcion: string;
};

export type Medicamento = {
  nombre: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
};

export type ObjetivoSOAP = SignosVitales & {
  hallazgos_exploracion?: string;
};

export type NotaEvolucion = {
  id: string;
  paciente_id: string;
  cita_id: string | null;
  fecha: string;
  motivo_consulta: string;
  subjetivo: string | null;
  objetivo: ObjetivoSOAP;
  analisis: string | null;
  diagnosticos: Diagnostico[];
  plan_tratamiento: string | null;
  medicamentos: Medicamento[];
  indicaciones: string | null;
  estudios_solicitados: string | null;
  proxima_cita_recomendada: string | null;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type ArchivoAdjunto = {
  id: string;
  nota_evolucion_id: string;
  nombre_archivo: string;
  ruta_storage: string;
  tipo_archivo: string | null;
  tamano_bytes: number | null;
  subido_por: string | null;
  created_at: string;
};

export type Cie10 = {
  codigo: string;
  descripcion: string;
  categoria: string | null;
};

export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  // Ya no se usa en la app: el monto real se define por paciente en "cobros".
  precio: number | null;
  visible_portal_publico: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type HorarioAtencion = {
  id: string;
  medico_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type EstadoCita =
  | "agendada"
  | "confirmada"
  | "en_curso"
  | "completada"
  | "cancelada"
  | "no_show";
export type OrigenCita = "interno" | "portal_publico";

export type Cita = {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoCita;
  origen: OrigenCita;
  confirmada_por_paciente: boolean;
  notas_administrativas: string | null;
  google_event_id: string | null;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type CitaConPaciente = Cita & {
  pacientes: Pick<Paciente, "id" | "nombre_completo" | "telefono"> | null;
};

export type CitaServicio = {
  id: string;
  cita_id: string;
  servicio_id: string;
  precio_cobrado: number | null;
  created_at: string;
  updated_at: string;
};

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "sinpe" | "otro";

// El monto total adeudado. El estado de pago ya no es una columna fija —
// se calcula a partir de la suma de "pagos" (ver cobros_con_estado / Pago).
export type Cobro = {
  id: string;
  cita_id: string | null;
  paciente_id: string;
  monto: number;
  notas: string | null;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type EstadoCobroCalculado = "pendiente" | "parcial" | "pagado";

// Fila de la vista public.cobros_con_estado (cobros + estado calculado).
export type CobroConEstado = Cobro & {
  monto_pagado: number;
  saldo: number;
  estado_calculado: EstadoCobroCalculado;
};

export type CobroConPaciente = CobroConEstado & {
  pacientes: Pick<Paciente, "id" | "nombre_completo"> | null;
};

// Un abono individual contra un cobro (puede haber varios por cobro).
export type Pago = {
  id: string;
  cobro_id: string;
  monto: number;
  metodo_pago: MetodoPago;
  fecha_pago: string;
  notas: string | null;
  registrado_por: string | null;
  anulado: boolean;
  anulado_por: string | null;
  anulado_en: string | null;
  motivo_anulacion: string | null;
  created_at: string;
};
