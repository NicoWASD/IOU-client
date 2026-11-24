import type { LucideIcon } from 'lucide-react';
import { Fuel, House, MountainSnow, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { splitEqual } from '@/lib/money';

/**
 * Grupo de ejemplo de la landing ("Bariloche 2026"). Todo lo que muestra la página sobre este
 * grupo (saldos, transferencias sugeridas, pagos sueltos) se calcula acá a partir de los gastos,
 * con el mismo reparto de la spec (4.2) y la simplificación de deudas (4.4).
 */

export type Miembro = { id: number; nombre: string };

export const MIEMBROS: Miembro[] = [
  { id: 1, nombre: 'Sofi' },
  { id: 2, nombre: 'Tomi' },
  { id: 3, nombre: 'Juli' },
  { id: 4, nombre: 'Lu' },
];

/** Quién está mirando el grupo en el ejemplo. */
export const YO = 1;

export type GastoEjemplo = {
  id: number;
  descripcion: string;
  icono: LucideIcon;
  totalCents: number;
  pagoId: number;
  entre: number[];
  dia: string;
};

export const GASTOS: GastoEjemplo[] = [
  {
    id: 5,
    descripcion: 'Cerro Catedral',
    icono: MountainSnow,
    totalCents: 9_600_000,
    pagoId: 1,
    entre: [1, 2, 3],
    dia: 'Hoy',
  },
  {
    id: 4,
    descripcion: 'Nafta de la ida',
    icono: Fuel,
    totalCents: 4_000_000,
    pagoId: 2,
    entre: [1, 2, 3, 4],
    dia: 'Hoy',
  },
  {
    id: 3,
    descripcion: 'Cena en el centro',
    icono: UtensilsCrossed,
    totalCents: 3_600_000,
    pagoId: 4,
    entre: [1, 2, 3, 4],
    dia: 'Ayer',
  },
  {
    id: 2,
    descripcion: 'Supermercado',
    icono: ShoppingCart,
    totalCents: 2_830_050,
    pagoId: 3,
    entre: [1, 2, 3, 4],
    dia: 'Ayer',
  },
  {
    id: 1,
    descripcion: 'Cabaña, 4 noches',
    icono: House,
    totalCents: 18_000_000,
    pagoId: 1,
    entre: [1, 2, 3, 4],
    dia: 'Lunes 16',
  },
];

export const nombreDe = (id: number) => MIEMBROS.find((m) => m.id === id)?.nombre ?? `#${id}`;

/** Saldo neto de cada miembro: lo que pagó menos lo que le toca. Suma siempre 0. */
export function calcularSaldos(gastos: GastoEjemplo[]): Record<number, number> {
  const saldos: Record<number, number> = Object.fromEntries(MIEMBROS.map((m) => [m.id, 0]));
  for (const g of gastos) {
    saldos[g.pagoId] = (saldos[g.pagoId] ?? 0) + g.totalCents;
    for (const [id, parte] of Object.entries(splitEqual(g.totalCents, g.entre))) {
      saldos[Number(id)] = (saldos[Number(id)] ?? 0) - parte;
    }
  }
  return saldos;
}

export type Transferencia = { de: number; a: number; montoCents: number };

/** Spec 4.4: el mayor deudor le paga al mayor acreedor hasta que todos quedan en 0. */
export function simplificarDeudas(saldos: Record<number, number>): Transferencia[] {
  const deudores: [number, number][] = [];
  const acreedores: [number, number][] = [];
  for (const [id, v] of Object.entries(saldos)) {
    if (v < 0) deudores.push([Number(id), -v]);
    else if (v > 0) acreedores.push([Number(id), v]);
  }
  const out: Transferencia[] = [];
  const porMonto = (a: [number, number], b: [number, number]) => b[1] - a[1] || a[0] - b[0];
  while (deudores.length > 0 && acreedores.length > 0) {
    deudores.sort(porMonto);
    acreedores.sort(porMonto);
    const d = deudores[0]!;
    const c = acreedores[0]!;
    const monto = Math.min(d[1], c[1]);
    out.push({ de: d[0], a: c[0], montoCents: monto });
    d[1] -= monto;
    c[1] -= monto;
    if (d[1] === 0) deudores.shift();
    if (c[1] === 0) acreedores.shift();
  }
  return out;
}

/** Los pagos que harían falta si cada uno le devolviera a quien pagó, gasto por gasto. */
export function pagosSueltos(gastos: GastoEjemplo[]): (Transferencia & { gasto: string })[] {
  return gastos.flatMap((g) => {
    const partes = splitEqual(g.totalCents, g.entre);
    return g.entre
      .filter((id) => id !== g.pagoId)
      .map((id) => ({ de: id, a: g.pagoId, montoCents: partes[id] ?? 0, gasto: g.descripcion }));
  });
}

export const SALDOS = calcularSaldos(GASTOS);
export const TRANSFERENCIAS = simplificarDeudas(SALDOS);
export const PAGOS_SUELTOS = pagosSueltos(GASTOS);
export const TOTAL_GRUPO = GASTOS.reduce((s, g) => s + g.totalCents, 0);
