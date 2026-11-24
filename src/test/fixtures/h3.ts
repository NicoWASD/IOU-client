import type { GastoDetalle, GastoResumen } from '@/api/types';

// Fixtures del H3 con los tipos del contrato. Grupo g1 (Bariloche); Sofía (u1) es la logueada.

const sofia = { id: 'u1', nombre: 'Sofía' };
const tomi = { id: 'u2', nombre: 'Tomi' };
const juli = { id: 'u3', nombre: 'Juli' };

export const gastoSuper: GastoDetalle = {
  id: 'e1',
  descripcion: 'Super',
  monto: '100.00',
  fecha: '2026-06-10',
  tipoDivision: 'IGUAL',
  pagadoPor: tomi,
  miParte: '33.34',
  creadoPor: tomi,
  participaciones: [
    { usuario: sofia, monto: '33.34', porcentaje: null },
    { usuario: tomi, monto: '33.33', porcentaje: null },
    { usuario: juli, monto: '33.33', porcentaje: null },
  ],
  puedeEditar: true,
  createdAt: '2026-06-10T15:00:00.000Z',
};

const resumen = ({
  id,
  descripcion,
  monto,
  fecha,
  tipoDivision,
  pagadoPor,
  miParte,
}: GastoDetalle): GastoResumen => ({
  id,
  descripcion,
  monto,
  fecha,
  tipoDivision,
  pagadoPor,
  miParte,
});

export const paginaGastos = {
  gastos: [
    resumen(gastoSuper),
    {
      ...resumen(gastoSuper),
      id: 'e2',
      descripcion: 'Nafta',
      fecha: '2026-06-01',
      miParte: '0.00',
    },
  ],
  page: 1,
  pageSize: 20,
  total: 2,
};
