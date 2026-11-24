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
