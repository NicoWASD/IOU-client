// Dinero siempre en centavos (enteros). Solo se convierte al mostrarlo o al leerlo de un input.

/**
 * Reparto en partes iguales (spec 4.2): base = floor(total / n); los centavos sobrantes
 * van de a uno a los primeros ids en orden ascendente. La suma es siempre exactamente el total.
 */
export function splitEqual(totalCents: number, ids: number[]): Record<number, number> {
  const ordenados = [...ids].sort((a, b) => a - b);
  const n = ordenados.length;
  const out: Record<number, number> = {};
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
