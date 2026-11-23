import { describe, expect, it } from 'vitest';
import {
  GASTOS,
  PAGOS_SUELTOS,
  SALDOS,
  TOTAL_GRUPO,
  TRANSFERENCIAS,
  simplificarDeudas,
} from './ejemplo';

describe('grupo de ejemplo de la landing', () => {
  it('los saldos suman 0', () => {
    expect(Object.values(SALDOS).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('las transferencias sugeridas dejan a todos en 0', () => {
    const resto = { ...SALDOS };
    for (const t of TRANSFERENCIAS) {
      resto[t.de] = (resto[t.de] ?? 0) + t.montoCents;
      resto[t.a] = (resto[t.a] ?? 0) - t.montoCents;
    }
    expect(Object.values(resto).every((v) => v === 0)).toBe(true);
  });

  it('resuelve en menos transferencias que los pagos gasto por gasto', () => {
    expect(GASTOS).toHaveLength(5);
    expect(TRANSFERENCIAS).toHaveLength(3);
    expect(PAGOS_SUELTOS).toHaveLength(14);
    expect(TOTAL_GRUPO).toBe(38_030_050);
  });

  it('simplifica con el mayor deudor contra el mayor acreedor (spec 4.4)', () => {
    expect(simplificarDeudas({ 1: 500, 2: -300, 3: -200 })).toEqual([
      { de: 2, a: 1, montoCents: 300 },
      { de: 3, a: 1, montoCents: 200 },
    ]);
    expect(simplificarDeudas({ 1: 0, 2: 0 })).toEqual([]);
  });
});
