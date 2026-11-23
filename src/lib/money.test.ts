import { describe, expect, it } from 'vitest';
import { formatMoney, moneyToCents, parseMoney, splitEqual } from './money';

describe('moneyToCents (Money del contrato → centavos)', () => {
  it.each([
    ['0.00', 0],
    ['12500.50', 1250050],
    ['-100.00', -10000],
    ['0.01', 1],
    ['-0.01', -1],
  ])('%s → %i', (m, cents) => {
    expect(moneyToCents(m)).toBe(cents);
  });

  it('un valor que no es Money tira error', () => {
    expect(() => moneyToCents('12,50')).toThrow();
  });
});

// Intl usa un espacio duro entre el signo y el número: lo normalizamos para comparar
const plain = (s: string) => s.replace(/\s/g, ' ');

describe('splitEqual (spec 4.2)', () => {
  it('$100 entre 3 → 33,34 / 33,33 / 33,33 (CB-01)', () => {
    expect(splitEqual(10000, [1, 2, 3])).toEqual({ 1: 3334, 2: 3333, 3: 3333 });
  });

  it('$0,01 entre 3 → el primero paga el centavo (CB-02)', () => {
    expect(splitEqual(1, [1, 2, 3])).toEqual({ 1: 1, 2: 0, 3: 0 });
  });

  it('los centavos sobrantes van a los primeros ids en orden ascendente', () => {
    expect(splitEqual(10000, [9, 2, 5])).toEqual({ 2: 3334, 5: 3333, 9: 3333 });
  });

  it('la suma siempre es exactamente el total', () => {
    for (let total = 1; total <= 1000; total++) {
      for (let n = 1; n <= 8; n++) {
        const ids = Array.from({ length: n }, (_, i) => i + 1);
        const suma = Object.values(splitEqual(total, ids)).reduce((a, b) => a + b, 0);
        expect(suma).toBe(total);
      }
    }
  });
});

describe('formatMoney', () => {
  it('sin decimales cuando son ,00', () => {
    expect(plain(formatMoney(3600000))).toBe('$ 36.000');
  });
  it('con centavos cuando los hay', () => {
    expect(plain(formatMoney(3334))).toBe('$ 33,34');
  });
});

describe('parseMoney', () => {
  it.each([
    ['36.000', 3600000],
    ['36000', 3600000],
    ['36000,50', 3600050],
    ['36000.5', 3600050],
    ['36.000,5', 3600050],
    ['$ 1.234,56', 123456],
  ])('%s → %i centavos', (input, cents) => {
    expect(parseMoney(input)).toBe(cents);
  });

  it.each(['abc', '-5', '', '1,234,5'])('%s → null', (input) => {
    expect(parseMoney(input)).toBeNull();
  });
});
