import type { GrupoDetalle, GrupoResumen, Miembro } from '@/api/types';

// Fixtures del H2 construidas con los tipos del contrato (IOU-backend/docs/api-contract.md).
// El usuario logueado en los tests es usuarioDemo (u1, Sofía).

export const sofia: Miembro = {
  id: 'u1',
  nombre: 'Sofía',
  email: 'sofi@mail.com',
  rol: 'ADMIN',
  activo: true,
};
export const tomi: Miembro = {
  id: 'u2',
  nombre: 'Tomi',
  email: 'tomi@mail.com',
  rol: 'MIEMBRO',
  activo: true,
};
export const juli: Miembro = {
  id: 'u3',
  nombre: 'Juli',
  email: 'juli@mail.com',
  rol: 'MIEMBRO',
  activo: true,
};
export const caro: Miembro = {
  id: 'u4',
  nombre: 'Caro',
  email: 'caro@mail.com',
  rol: 'MIEMBRO',
  activo: false,
};

/** Grupo donde Sofía es admin: 4 miembros, Caro ya no participa. */
export const grupoBariloche: GrupoDetalle = {
  id: 'g1',
  nombre: 'Bariloche 2026',
  descripcion: 'El viaje de invierno',
  moneda: 'ARS',
  archivado: false,
  creadoPor: { id: 'u1', nombre: 'Sofía' },
  miRol: 'ADMIN',
  createdAt: '2026-11-20T15:00:00.000Z',
  miembros: [sofia, tomi, juli, caro],
};

/** Grupo donde Sofía es miembro común; el admin es Tomi. */
export const grupoDepto: GrupoDetalle = {
  id: 'g2',
  nombre: 'Depto Palermo',
  descripcion: null,
  moneda: 'ARS',
  archivado: false,
  creadoPor: { id: 'u2', nombre: 'Tomi' },
  miRol: 'MIEMBRO',
  createdAt: '2026-11-10T12:00:00.000Z',
  miembros: [
    { ...tomi, rol: 'ADMIN' },
    { ...sofia, rol: 'MIEMBRO' },
  ],
};

const ref = ({ id, nombre }: { id: string; nombre: string }) => ({ id, nombre });

/** `GET /grupos`: primero los activos y después el archivado. */
export const listaGrupos: GrupoResumen[] = [
  {
    id: 'g1',
    nombre: 'Bariloche 2026',
    descripcion: 'El viaje de invierno',
    archivado: false,
    miembros: [sofia, tomi, juli].map(ref),
    miBalance: '0.00',
  },
  {
    id: 'g2',
    nombre: 'Depto Palermo',
    descripcion: null,
    archivado: false,
    miembros: [tomi, sofia].map(ref),
    miBalance: '0.00',
  },
  {
    id: 'g3',
    nombre: 'Asado del sábado',
    descripcion: null,
    archivado: true,
    miembros: [sofia, juli].map(ref),
    miBalance: '0.00',
  },
];
