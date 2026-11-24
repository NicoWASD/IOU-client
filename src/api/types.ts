// Copia literal de los tipos del contrato (IOU-backend/docs/api-contract.md): comunes y H2.
// Si el contrato cambia, se cambia allá primero.

export type Money = string; // "12500.50"
export type Rol = 'ADMIN' | 'MIEMBRO';
export type UsuarioRef = { id: string; nombre: string };

export type Miembro = UsuarioRef & { email: string; rol: Rol; activo: boolean };

export type GrupoResumen = {
  id: string;
  nombre: string;
  descripcion: string | null;
  archivado: boolean;
  miembros: UsuarioRef[]; // activos, para los avatares
  miBalance: Money; // "0.00" hasta el H4
};

export type GrupoDetalle = {
  id: string;
  nombre: string;
  descripcion: string | null;
  moneda: 'ARS';
  archivado: boolean;
  creadoPor: UsuarioRef;
  miRol: Rol;
  createdAt: string;
  miembros: Miembro[]; // activos e inactivos
};

// Bodies de las rutas del H2
export type NuevoGrupo = { nombre: string; descripcion?: string | null };
export type EdicionGrupo = { nombre?: string; descripcion?: string | null };

/** Códigos de error de negocio del H2. */
export type CodigoErrorH2 =
  | 'GRUPO_NO_ENCONTRADO'
  | 'SOLO_ADMIN'
  | 'USUARIO_NO_ENCONTRADO'
  | 'YA_ES_MIEMBRO'
  | 'MIEMBRO_NO_ENCONTRADO'
  | 'SALDO_PENDIENTE'
  | 'ADMIN_NO_PUEDE_SALIR'
  | 'GRUPO_ARCHIVADO';

// H3 · Gastos
export type TipoDivision = 'IGUAL' | 'MONTOS' | 'PORCENTAJE';

export type Participacion = { usuario: UsuarioRef; monto: Money; porcentaje: string | null };

export type GastoResumen = {
  id: string;
  descripcion: string;
  monto: Money;
  fecha: string; // YYYY-MM-DD
  tipoDivision: TipoDivision;
  pagadoPor: UsuarioRef;
  miParte: Money; // "0.00" si no participo
};

export type GastoDetalle = GastoResumen & {
  creadoPor: UsuarioRef;
  participaciones: Participacion[];
  puedeEditar: boolean;
  createdAt: string;
};

export type PaginaGastos = {
  gastos: GastoResumen[];
  page: number;
  pageSize: number;
  total: number;
};

export type NuevoGasto = {
  descripcion: string;
  monto: Money;
  fecha: string;
  pagadoPor: string;
  tipoDivision: TipoDivision;
  participantes:
    | { usuarioId: string }[]
    | { usuarioId: string; monto: Money }[]
    | { usuarioId: string; porcentaje: string }[];
};
