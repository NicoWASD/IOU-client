// Dinero siempre en centavos (enteros). Solo se convierte al mostrarlo o al leerlo de un input.

/**
 * Reparto en partes iguales (spec 4.2): base = floor(total / n); los centavos sobrantes
 * van de a uno a los primeros ids en orden ascendente. La suma es siempre exactamente el total.
 */
export function splitEqual<T extends string | number>(
  totalCents: number,
  ids: T[],
): Record<T, number> {
  const ordenados = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const n = ordenados.length;
  const out = {} as Record<T, number>;
  if (n === 0) return out;
  const base = Math.floor(totalCents / n);
  let resto = totalCents - base * n;
  for (const id of ordenados) {
    out[id] = base + (resto > 0 ? 1 : 0);
    if (resto > 0) resto--;
  }
  return out;
}

const conCentavos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const sinCentavos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `$ 36.000` o `$ 33,34`: los centavos solo aparecen cuando no son ,00. */
export function formatMoney(cents: number): string {
  return (cents % 100 === 0 ? sinCentavos : conCentavos).format(cents / 100);
}

/**
 * Lee un monto escrito a mano y devuelve centavos, o null si no es válido.
 * Acepta `36.000`, `36000`, `36000,50`, `36000.5`, `36.000,5` y `$ 1.234,56`.
 */
export function parseMoney(input: string): number | null {
  let s = input.replace(/[$\s ]/g, '');
  if (s === '' || s.startsWith('-')) return null;
  if (s.includes(',')) {
    if (s.split(',').length > 2) return null;
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** `Money` del contrato (`"-100.00"`) → centavos (`-10000`). Tira si el formato no es el de la API. */
export function moneyToCents(m: string): number {
  const match = /^(-)?(\d+)\.(\d{2})$/.exec(m);
  if (!match) throw new Error(`Monto inválido: ${m}`);
  const [, signo, enteros, centavos] = match;
  const cents = Number(enteros) * 100 + Number(centavos);
  return signo ? -cents : cents;
}

/**
 * Reparto por porcentajes (spec 4.3): floor(total × % / 100) y los centavos sobrantes de a uno
 * a los primeros ids. `pct` en centésimos (100 % = 10000), igual que el back.
 */
export function splitPct(
  totalCents: number,
  items: { id: string; pct: number }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { id, pct } of items) out[id] = Math.floor((totalCents * pct) / 10000);
  let resto = totalCents - Object.values(out).reduce((a, b) => a + b, 0);
  for (const id of Object.keys(out).sort()) {
    if (resto <= 0) break;
    out[id] = (out[id] ?? 0) + 1;
    resto--;
  }
  return out;
}

/** `"33,33"` o `"60"` → 3333 centésimos; null si no es válido (hasta 2 decimales). */
export function parsePorcentaje(input: string): number | null {
  const s = input.replace(/[%\s]/g, '').replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** 3333 → `"33.33"` (formato del contrato). */
export const pctToString = (c: number) =>
  `${Math.trunc(c / 100)}.${String(c % 100).padStart(2, '0')}`;

/** Centavos → `Money` del contrato (`1250` → `"12.50"`). */
export function centsToMoney(cents: number): string {
  const abs = Math.abs(cents);
  return `${cents < 0 ? '-' : ''}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
